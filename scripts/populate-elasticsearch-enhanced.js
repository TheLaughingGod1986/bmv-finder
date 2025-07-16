const fs = require('fs');
const readline = require('readline');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 120000, // 2 minutes timeout for large batches
  maxRetries: 5,
  retryOnTimeout: true,
});

const INDEX_NAME = 'properties-enhanced';
const BATCH_SIZE = 100; // Optimized batch size for enhanced data
const CHECKPOINT_FILE = 'enhanced_import_checkpoint.txt';
const SKIPPED_LOG = 'enhanced_skipped_records.log';
const FAILED_LOG = 'enhanced_failed_records.log';

// Property type mapping
const PROPERTY_TYPE_MAP = {
  'D': 'Detached',
  'S': 'Semi-detached',
  'T': 'Terraced',
  'F': 'Flat/Maisonette',
  'O': 'Other'
};

// Duration mapping
const DURATION_MAP = {
  'F': 'Freehold',
  'L': 'Leasehold'
};

// New/Existing mapping
const NEW_BUILD_MAP = {
  'Y': 'New Build',
  'N': 'Existing'
};

// Transaction category mapping
const TRANSACTION_CATEGORY_MAP = {
  'A': 'Standard Price Paid',
  'B': 'Additional Price Paid',
  'C': 'Price Paid for Transfers of a Share',
  'D': 'Price Paid for Transfers of a Share - Not Full Market Value',
  'E': 'Price Paid for Transfers of a Share - Full Market Value'
};

function saveCheckpoint(lineNumber) {
  fs.writeFileSync(CHECKPOINT_FILE, String(lineNumber));
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return parseInt(fs.readFileSync(CHECKPOINT_FILE, 'utf8'), 10) || 0;
  }
  return 0;
}

function logSkipped(lineNumber, reason, line) {
  fs.appendFileSync(SKIPPED_LOG, `Line ${lineNumber}: ${reason} | ${line}\n`);
}

function logFailed(lineNumber, error, doc) {
  fs.appendFileSync(FAILED_LOG, `Line ${lineNumber}: ${error} | ${JSON.stringify(doc)}\n`);
}

async function createIndex() {
  try {
    // Check if index exists
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    
    if (indexExists) {
      console.log(`Index '${INDEX_NAME}' already exists. Skipping creation.`);
      return;
    }

    console.log(`Creating enhanced index '${INDEX_NAME}'...`);
    
    await esClient.indices.create({
      index: INDEX_NAME,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              postcode_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'trim']
              },
              address_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'trim', 'stop']
              }
            }
          }
        },
        mappings: {
          properties: {
            // Original Land Registry fields
            guid: { type: 'keyword' },
            price: { type: 'long' },
            date: { type: 'date' },
            postcode: { 
              type: 'text',
              analyzer: 'postcode_analyzer',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            property_type: { type: 'keyword' },
            property_type_label: { type: 'text' },
            new_build: { type: 'keyword' },
            new_build_label: { type: 'text' },
            estate_type: { type: 'keyword' },
            estate_type_label: { type: 'text' },
            transaction_id: { type: 'keyword' },
            paon: { type: 'text' },
            saon: { type: 'text' },
            street: { type: 'text', analyzer: 'address_analyzer' },
            locality: { type: 'text', analyzer: 'address_analyzer' },
            town_city: { type: 'text', analyzer: 'address_analyzer' },
            district: { type: 'text', analyzer: 'address_analyzer' },
            county: { type: 'keyword' },
            transaction_category: { type: 'keyword' },
            transaction_category_label: { type: 'text' },
            record_status: { type: 'keyword' },
            
            // Enhanced EPC fields
            epc_bedrooms: { type: 'integer' },
            epc_size: { type: 'float' },
            epc_rating: { type: 'keyword' },
            match_type: { type: 'keyword' },
            match_confidence: { type: 'keyword' },
            match_score: { type: 'integer' },
            
            // Enhanced HPI fields
            hpi_value: { type: 'float' },
            hpi_region: { type: 'keyword' },
            hpi_date: { type: 'keyword' },
            
            // Computed fields for better search
            full_address: { type: 'text', analyzer: 'address_analyzer' },
            year: { type: 'integer' },
            month: { type: 'integer' },
            price_range: { type: 'keyword' },
            
            // Search optimization fields
            has_epc: { type: 'boolean' },
            has_hpi: { type: 'boolean' },
            energy_efficient: { type: 'boolean' }
          }
        }
      }
    });

    console.log(`Enhanced index '${INDEX_NAME}' created successfully!`);
  } catch (error) {
    console.error('Error creating enhanced index:', error);
    throw error;
  }
}

function getPriceRange(price) {
  if (price < 100000) return 'Under £100k';
  if (price < 200000) return '£100k - £200k';
  if (price < 300000) return '£200k - £300k';
  if (price < 500000) return '£300k - £500k';
  if (price < 1000000) return '£500k - £1M';
  return 'Over £1M';
}

function parseEnhancedCSVLine(line, lineNumber) {
  // Handle quoted CSV format
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim()); // Add the last value
  
  if (values.length < 31) {
    logSkipped(lineNumber, 'Too few columns', line);
    return null;
  }

  // Enhanced CSV structure with 31 columns
  const [
    guid, price, date, postcode, property_type, new_build, estate_type,
    transaction_id, paon, saon, street, locality, town_city, district, county,
    transaction_category, record_status, field_17, field_18, field_19, field_20, field_21,
    epc_bedrooms, epc_size, epc_rating, match_type, match_confidence, match_score,
    hpi_value, hpi_region, hpi_date
  ] = values;

  // Clean up the values (remove quotes)
  const cleanGuid = guid?.replace(/"/g, '');
  const cleanPrice = price?.replace(/"/g, '');
  const cleanDate = date?.replace(/"/g, '').split(' ')[0]; // Take only the date part
  const cleanPostcode = postcode?.replace(/"/g, '');
  const cleanPropertyType = property_type?.replace(/"/g, '');
  const cleanNewBuild = new_build?.replace(/"/g, '');
  const cleanEstateType = estate_type?.replace(/"/g, '');
  const cleanTransactionId = transaction_id?.replace(/"/g, '');
  const cleanPaon = paon?.replace(/"/g, '');
  const cleanSaon = saon?.replace(/"/g, '');
  const cleanStreet = street?.replace(/"/g, '');
  const cleanLocality = locality?.replace(/"/g, '');
  const cleanTownCity = town_city?.replace(/"/g, '');
  const cleanDistrict = district?.replace(/"/g, '');
  const cleanCounty = county?.replace(/"/g, '');
  const cleanTransactionCategory = transaction_category?.replace(/"/g, '');
  const cleanRecordStatus = record_status?.replace(/"/g, '');
  
  // Enhanced fields
  const cleanEpcBedrooms = epc_bedrooms?.replace(/"/g, '');
  const cleanEpcSize = epc_size?.replace(/"/g, '');
  const cleanEpcRating = epc_rating?.replace(/"/g, '');
  const cleanMatchType = match_type?.replace(/"/g, '');
  const cleanMatchConfidence = match_confidence?.replace(/"/g, '');
  const cleanMatchScore = match_score?.replace(/"/g, '');
  const cleanHpiValue = hpi_value?.replace(/"/g, '');
  const cleanHpiRegion = hpi_region?.replace(/"/g, '');
  const cleanHpiDate = hpi_date?.replace(/"/g, '');

  // Validate price
  const priceNum = parseInt(cleanPrice, 10);
  if (isNaN(priceNum) || priceNum <= 0) {
    logSkipped(lineNumber, 'Invalid price', line);
    return null;
  }

  // Validate date
  if (!cleanDate || cleanDate === '') {
    logSkipped(lineNumber, 'Missing date', line);
    return null;
  }

  // Parse enhanced fields
  const epcBedroomsNum = cleanEpcBedrooms ? parseInt(cleanEpcBedrooms, 10) : null;
  const epcSizeNum = cleanEpcSize ? parseFloat(cleanEpcSize) : null;
  const hpiValueNum = cleanHpiValue ? parseFloat(cleanHpiValue) : null;
  const matchScoreNum = cleanMatchScore ? parseInt(cleanMatchScore, 10) : null;

  // Build full address
  const addressParts = [cleanPaon, cleanSaon, cleanStreet, cleanLocality, cleanTownCity].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  // Parse date components
  const dateObj = new Date(cleanDate);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;

  // Determine if property has EPC and HPI data
  const hasEpc = !!(cleanEpcRating && cleanEpcRating !== '');
  const hasHpi = !!(cleanHpiValue && cleanHpiValue !== '');
  const energyEfficient = hasEpc && ['A', 'B', 'C'].includes(cleanEpcRating);

  return {
    guid: cleanGuid,
    price: priceNum,
    date: cleanDate,
    postcode: cleanPostcode,
    property_type: cleanPropertyType,
    property_type_label: PROPERTY_TYPE_MAP[cleanPropertyType] || cleanPropertyType,
    new_build: cleanNewBuild,
    new_build_label: NEW_BUILD_MAP[cleanNewBuild] || cleanNewBuild,
    estate_type: cleanEstateType,
    estate_type_label: DURATION_MAP[cleanEstateType] || cleanEstateType,
    transaction_id: cleanTransactionId,
    paon: cleanPaon,
    saon: cleanSaon,
    street: cleanStreet,
    locality: cleanLocality,
    town_city: cleanTownCity,
    district: cleanDistrict,
    county: cleanCounty,
    transaction_category: cleanTransactionCategory,
    transaction_category_label: TRANSACTION_CATEGORY_MAP[cleanTransactionCategory] || cleanTransactionCategory,
    record_status: cleanRecordStatus,
    
    // Enhanced EPC fields
    epc_bedrooms: epcBedroomsNum,
    epc_size: epcSizeNum,
    epc_rating: cleanEpcRating,
    match_type: cleanMatchType,
    match_confidence: cleanMatchConfidence,
    match_score: matchScoreNum,
    
    // Enhanced HPI fields
    hpi_value: hpiValueNum,
    hpi_region: cleanHpiRegion,
    hpi_date: cleanHpiDate,
    
    // Computed fields
    full_address: fullAddress,
    year: year,
    month: month,
    price_range: getPriceRange(priceNum),
    
    // Search optimization
    has_epc: hasEpc,
    has_hpi: hasHpi,
    energy_efficient: energyEfficient
  };
}

async function indexBatch(batch, batchLineNumbers) {
  if (batch.length === 0) return;

  const operations = [];
  
  for (let i = 0; i < batch.length; i++) {
    const doc = batch[i];
    const lineNumber = batchLineNumbers[i];
    
    if (!doc) continue;
    
    // Add index operation
    operations.push({ index: { _index: INDEX_NAME } });
    operations.push(doc);
  }

  try {
    const result = await esClient.bulk({ body: operations });
    
    if (result.errors) {
      const errors = result.items.filter(item => item.index?.error);
      console.error(`Batch had ${errors.length} errors out of ${batch.length} documents`);
      
      for (const error of errors) {
        logFailed(lineNumber, error.index.error.reason, error.index.data);
      }
    }
    
    console.log(`✅ Indexed batch of ${batch.length} documents`);
  } catch (error) {
    console.error('Error indexing batch:', error);
    
    // Log all documents in the failed batch
    for (let i = 0; i < batch.length; i++) {
      logFailed(batchLineNumbers[i], error.message, batch[i]);
    }
  }
}

async function populateElasticsearch() {
  try {
    console.log('🚀 Starting enhanced Elasticsearch population...');
    
    // Test Elasticsearch connection
    try {
      await esClient.ping();
      console.log('✅ Elasticsearch connection successful');
    } catch (error) {
      console.error('❌ Cannot connect to Elasticsearch. Please ensure it is running.');
      console.error('Error:', error.message);
      return;
    }

    // Create index
    await createIndex();

    const inputFile = 'properties-enhanced-advanced.csv';
    
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Input file '${inputFile}' not found`);
      return;
    }

    const startLine = loadCheckpoint();
    console.log(`📖 Starting from line ${startLine + 1}`);

    const fileStream = fs.createReadStream(inputFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineNumber = 0;
    let batch = [];
    let batchLineNumbers = [];
    let totalProcessed = 0;
    let totalIndexed = 0;
    const startTime = Date.now();

    for await (const line of rl) {
      lineNumber++;
      
      // Skip lines before checkpoint
      if (lineNumber <= startLine) {
        continue;
      }

      // Skip header line
      if (lineNumber === 1) {
        console.log('📋 Skipping header line');
        continue;
      }

      totalProcessed++;
      
      const doc = parseEnhancedCSVLine(line, lineNumber);
      
      if (doc) {
        batch.push(doc);
        batchLineNumbers.push(lineNumber);
        totalIndexed++;
      }

      // Process batch when it reaches the batch size
      if (batch.length >= BATCH_SIZE) {
        await indexBatch(batch, batchLineNumbers);
        
        // Save checkpoint
        saveCheckpoint(lineNumber);
        
        // Log progress
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = totalIndexed / elapsed;
        console.log(`📊 Progress: ${totalIndexed.toLocaleString()} indexed, ${totalProcessed.toLocaleString()} processed (${rate.toFixed(1)} docs/sec)`);
        
        // Clear batch
        batch = [];
        batchLineNumbers = [];
      }

      // Progress update every 10,000 lines
      if (totalProcessed % 10000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = totalProcessed / elapsed;
        console.log(`⏱️  Processed ${totalProcessed.toLocaleString()} lines (${rate.toFixed(1)} lines/sec)`);
      }
    }

    // Process remaining batch
    if (batch.length > 0) {
      await indexBatch(batch, batchLineNumbers);
      saveCheckpoint(lineNumber);
    }

    const totalTime = (Date.now() - startTime) / 1000;
    console.log('\n🎉 Enhanced Elasticsearch population completed!');
    console.log(`📊 Final Stats:`);
    console.log(`   - Total processed: ${totalProcessed.toLocaleString()}`);
    console.log(`   - Total indexed: ${totalIndexed.toLocaleString()}`);
    console.log(`   - Total time: ${totalTime.toFixed(1)} seconds`);
    console.log(`   - Average rate: ${(totalIndexed / totalTime).toFixed(1)} docs/sec`);
    console.log(`   - Index: ${INDEX_NAME}`);

  } catch (error) {
    console.error('❌ Error during Elasticsearch population:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  populateElasticsearch()
    .then(() => {
      console.log('✅ Enhanced Elasticsearch population script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Enhanced Elasticsearch population script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateElasticsearch, createIndex }; 