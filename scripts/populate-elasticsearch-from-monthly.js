const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Elasticsearch client - using localhost
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000, // 60 seconds timeout
  maxRetries: 3,
  retryOnTimeout: true,
});

const INDEX_NAME = 'properties';
const BATCH_SIZE = 100; // Increased batch size for better performance
const CHECKPOINT_FILE = 'monthly_import_checkpoint.json';
const SKIPPED_LOG = 'monthly_skipped_records.log';
const FAILED_LOG = 'monthly_failed_records.log';
const DATA_DIR = path.join(__dirname, '../data/land-registry');

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

function saveCheckpoint(year, month, lineNumber) {
  const checkpoint = { year, month, lineNumber };
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint));
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    const data = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
    return JSON.parse(data);
  }
  return { year: 1995, month: 1, lineNumber: 0 };
}

function logSkipped(filePath, lineNumber, reason, line) {
  fs.appendFileSync(SKIPPED_LOG, `${filePath}:${lineNumber}: ${reason} | ${line}\n`);
}

function logFailed(filePath, lineNumber, error, doc) {
  fs.appendFileSync(FAILED_LOG, `${filePath}:${lineNumber}: ${error} | ${JSON.stringify(doc)}\n`);
}

async function createIndex() {
  try {
    // Check if index exists
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    
    if (indexExists) {
      console.log(`Index '${INDEX_NAME}' already exists. Skipping creation.`);
      return;
    }

    console.log(`Creating index '${INDEX_NAME}'...`);
    
    await esClient.indices.create({
      index: INDEX_NAME,
      body: {
        settings: {
          number_of_shards: 1, // Reduced for single node
          number_of_replicas: 0, // No replicas for single node
          analysis: {
            analyzer: {
              postcode_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'trim']
              }
            }
          }
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            price: { type: 'long' },
            dateOfTransfer: { type: 'date' },
            postcode: { 
              type: 'text',
              analyzer: 'postcode_analyzer',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            propertyType: { type: 'keyword' },
            propertyTypeLabel: { type: 'text' },
            old_new: { type: 'keyword' },
            newBuildLabel: { type: 'text' },
            street: { type: 'text' },
            town_city: { type: 'text' },
            district: { type: 'text' },
            county: { type: 'keyword' },
            paon: { type: 'text' },
            saon: { type: 'text' },
            duration: { type: 'keyword' },
            durationLabel: { type: 'text' },
            locality: { type: 'text' },
            transactionCategory: { type: 'keyword' },
            transactionCategoryLabel: { type: 'text' },
            recordStatus: { type: 'keyword' },
            // Computed fields for better search
            fullAddress: { type: 'text' },
            year: { type: 'integer' },
            month: { type: 'integer' },
            priceRange: { type: 'keyword' }
          }
        }
      }
    });

    console.log(`Index '${INDEX_NAME}' created successfully!`);
  } catch (error) {
    console.error('Error creating index:', error);
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

function parseCSVLine(line, lineNumber) {
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
  
  if (values.length < 16) {
    return null; // Too few columns
  }

  const [
    transactionId, price, dateOfTransfer, postcode, propertyType,
    old_new, duration, paon, saon, street, locality, town_city,
    district, county, transactionCategory, recordStatus
  ] = values;

  // Clean up the values (remove quotes)
  const cleanTransactionId = transactionId.replace(/"/g, '');
  const cleanPrice = price.replace(/"/g, '');
  const cleanDateOfTransfer = dateOfTransfer.replace(/"/g, '').split(' ')[0]; // Take only the date part
  const cleanPostcode = postcode.replace(/"/g, '');
  const cleanPropertyType = propertyType.replace(/"/g, '');
  const cleanOldNew = old_new.replace(/"/g, '');
  const cleanDuration = duration.replace(/"/g, '');
  const cleanPaon = paon.replace(/"/g, '');
  const cleanSaon = saon.replace(/"/g, '');
  const cleanStreet = street.replace(/"/g, '');
  const cleanLocality = locality.replace(/"/g, '');
  const cleanTownCity = town_city.replace(/"/g, '');
  const cleanDistrict = district.replace(/"/g, '');
  const cleanCounty = county.replace(/"/g, '');
  const cleanTransactionCategory = transactionCategory.replace(/"/g, '');
  const cleanRecordStatus = recordStatus.replace(/"/g, '');

  // Validate required fields
  if (!cleanTransactionId || !cleanPrice || !cleanDateOfTransfer || !cleanPostcode) {
    return null;
  }

  // Parse price
  const priceNum = parseInt(cleanPrice, 10);
  if (isNaN(priceNum) || priceNum <= 0) {
    return null;
  }

  return {
    id: cleanTransactionId,
    price: priceNum,
    dateOfTransfer: cleanDateOfTransfer,
    postcode: cleanPostcode,
    propertyType: cleanPropertyType,
    propertyTypeLabel: PROPERTY_TYPE_MAP[cleanPropertyType] || 'Unknown',
    old_new: cleanOldNew,
    newBuildLabel: NEW_BUILD_MAP[cleanOldNew] || 'Unknown',
    duration: cleanDuration,
    durationLabel: DURATION_MAP[cleanDuration] || 'Unknown',
    paon: cleanPaon,
    saon: cleanSaon,
    street: cleanStreet,
    locality: cleanLocality,
    town_city: cleanTownCity,
    district: cleanDistrict,
    county: cleanCounty,
    transactionCategory: cleanTransactionCategory,
    transactionCategoryLabel: TRANSACTION_CATEGORY_MAP[cleanTransactionCategory] || 'Unknown',
    recordStatus: cleanRecordStatus,
    // Computed fields
    fullAddress: `${cleanPaon || ''} ${cleanSaon || ''} ${cleanStreet || ''} ${cleanTownCity || ''}`.trim(),
    year: new Date(cleanDateOfTransfer).getFullYear(),
    month: new Date(cleanDateOfTransfer).getMonth() + 1,
    priceRange: getPriceRange(priceNum)
  };
}

async function indexBatch(batch, batchLineNumbers, filePath) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const body = batch.flatMap((doc, idx) => [
        { index: { _index: INDEX_NAME, _id: doc.id } },
        doc
      ]);

      const result = await esClient.bulk({ 
        body,
        timeout: '60s',
        refresh: false
      });
      
      // Check for errors in bulk response
      if (result.errors) {
        const errors = result.items.filter((item, idx) => {
          if (item.index?.error) {
            logFailed(filePath, batchLineNumbers[idx], item.index.error.reason, batch[idx]);
            return true;
          }
          return false;
        });
        if (errors.length > 0) {
          console.warn(`Bulk operation had ${errors.length} errors, but continuing...`);
        }
      }
      
      return batch.length;
    } catch (error) {
      attempt++;
      console.warn(`Batch indexing attempt ${attempt} failed:`, error.message);
      
      if (attempt >= maxRetries) {
        console.error('All retry attempts failed for batch');
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function processCSVFile(filePath, startFromLine = 0) {
  return new Promise((resolve, reject) => {
    let batch = [];
    let lineCount = 0;
    let isFirstLine = true;
    let totalIndexed = 0;

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });

    const processBatch = async () => {
      if (batch.length === 0) return;
      
      const currentBatch = [...batch];
      const currentLineNumbers = batch.lineNumbers ? [...batch.lineNumbers] : [];
      batch = [];
      batch.lineNumbers = [];
      
      try {
        const indexedCount = await indexBatch(currentBatch, currentLineNumbers, filePath);
        totalIndexed += indexedCount;
        
        // Progress reporting
        if (totalIndexed % 1000 === 0) {
          console.log(`  Indexed ${totalIndexed.toLocaleString()} records from ${path.basename(filePath)}`);
        }
      } catch (error) {
        reject(error);
        return;
      }
    };

    rl.on('line', async (line) => {
      lineCount++;
      if (lineCount <= startFromLine) return; // Skip already imported lines
      
      // Skip header line
      if (isFirstLine) {
        isFirstLine = false;
        return;
      }
      
      try {
        const record = parseCSVLine(line, lineCount);
        // Skip invalid records
        if (record === null) {
          return;
        }
        batch.push(record);
        if (!batch.lineNumbers) batch.lineNumbers = [];
        batch.lineNumbers.push(lineCount);
        
        // Process batch when it reaches the batch size
        if (batch.length >= BATCH_SIZE) {
          await processBatch();
        }
      } catch (error) {
        logSkipped(filePath, lineCount, `Exception: ${error.message}`, line);
      }
    });

    rl.on('close', async () => {
      try {
        // Process remaining records
        if (batch.length > 0) {
          await processBatch();
        }
        
        resolve(totalIndexed);
      } catch (error) {
        reject(error);
      }
    });

    rl.on('error', (error) => {
      console.error(`Error reading CSV ${filePath}:`, error);
      reject(error);
    });
  });
}

async function getAllCSVFiles() {
  const files = [];
  const years = fs.readdirSync(DATA_DIR).filter(dir => /^\d{4}$/.test(dir)).sort();
  
  for (const year of years) {
    const yearDir = path.join(DATA_DIR, year);
    const yearFiles = fs.readdirSync(yearDir)
      .filter(file => file.endsWith('.csv'))
      .sort()
      .map(file => path.join(yearDir, file));
    files.push(...yearFiles);
  }
  
  return files;
}

async function populateElasticsearch() {
  const startTime = Date.now();
  let totalIndexed = 0;
  const checkpoint = loadCheckpoint();
  
  try {
    // Create the index if needed
    await createIndex();

    console.log(`Starting to index CSV data from monthly files...`);
    console.log(`Resuming from year ${checkpoint.year}, month ${checkpoint.month}, line ${checkpoint.lineNumber}`);
    console.log('This may take a while for the full dataset...');

    const allFiles = await getAllCSVFiles();
    console.log(`Found ${allFiles.length} CSV files to process`);

    for (const filePath of allFiles) {
      const fileName = path.basename(filePath);
      const year = parseInt(fileName.match(/pp-(\d{4})-\d{2}\.csv/)?.[1]);
      const month = parseInt(fileName.match(/pp-\d{4}-(\d{2})\.csv/)?.[1]);
      
      // Skip files before checkpoint
      if (year < checkpoint.year || (year === checkpoint.year && month < checkpoint.month)) {
        continue;
      }
      
      console.log(`\n📁 Processing ${fileName}...`);
      
      try {
        const startLine = (year === checkpoint.year && month === checkpoint.month) ? checkpoint.lineNumber : 0;
        const indexedCount = await processCSVFile(filePath, startLine);
        totalIndexed += indexedCount;
        
        console.log(`  ✅ Completed ${fileName}: ${indexedCount.toLocaleString()} records`);
        
        // Save checkpoint after each file
        saveCheckpoint(year, month, 0);
        
      } catch (error) {
        console.error(`  ❌ Error processing ${fileName}:`, error.message);
        // Continue with next file
      }
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    console.log('\n🎉 Indexing completed successfully!');
    console.log(`📊 Total records indexed: ${totalIndexed.toLocaleString()}`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
    console.log(`🚀 Average rate: ${Math.round(totalIndexed / totalTime)} records/second`);
    
    // Refresh the index
    await esClient.indices.refresh({ index: INDEX_NAME });
    console.log('✅ Index refreshed and ready for search!');
    
    // Clean up checkpoint file
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE);
    }

  } catch (error) {
    console.error('Error during indexing:', error);
    throw error;
  }
}

// Run the full import
populateElasticsearch().catch(console.error);

module.exports = { populateElasticsearch, createIndex }; 