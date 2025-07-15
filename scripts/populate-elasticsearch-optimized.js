const fs = require('fs');
const readline = require('readline');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Elasticsearch client - using localhost
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000,
  maxRetries: 3,
  retryOnTimeout: true,
});

const INDEX_NAME = 'properties';
const BATCH_SIZE = 5; // Very small batch size
const CHUNK_SIZE = 1000; // Process 1000 lines at a time
const CHECKPOINT_FILE = 'import_checkpoint.txt';
const SKIPPED_LOG = 'skipped_records.log';
const FAILED_LOG = 'failed_records.log';

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
          number_of_shards: 1,
          number_of_replicas: 0,
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
  values.push(current.trim());
  
  if (values.length < 16) {
    logSkipped(lineNumber, 'Too few columns', line);
    return null;
  }

  const [
    transactionId, price, dateOfTransfer, postcode, propertyType,
    old_new, duration, paon, saon, street, locality, town_city,
    district, county, transactionCategory, recordStatus
  ] = values;

  // Clean up values
  const cleanTransactionId = transactionId.replace(/"/g, '');
  const cleanPrice = price.replace(/"/g, '');
  const cleanDateOfTransfer = dateOfTransfer.replace(/"/g, '').split(' ')[0];
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

  // Validate price
  const priceNum = parseInt(cleanPrice, 10);
  if (isNaN(priceNum) || priceNum <= 0) {
    logSkipped(lineNumber, 'Invalid price', line);
    return null;
  }

  // Parse date
  const dateParts = cleanDateOfTransfer.split('-');
  if (dateParts.length !== 3) {
    logSkipped(lineNumber, 'Invalid date format', line);
    return null;
  }

  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);

  if (isNaN(year) || isNaN(month) || year < 1995 || year > 2025 || month < 1 || month > 12) {
    logSkipped(lineNumber, 'Invalid date', line);
    return null;
  }

  // Build full address
  const addressParts = [cleanPaon, cleanSaon, cleanStreet, cleanLocality, cleanTownCity, cleanDistrict, cleanCounty]
    .filter(part => part && part.trim() !== '')
    .map(part => part.trim());
  
  const fullAddress = addressParts.join(', ');

  return {
    id: cleanTransactionId,
    price: priceNum,
    dateOfTransfer: cleanDateOfTransfer,
    postcode: cleanPostcode,
    propertyType: cleanPropertyType,
    propertyTypeLabel: PROPERTY_TYPE_MAP[cleanPropertyType] || 'Unknown',
    old_new: cleanOldNew,
    newBuildLabel: NEW_BUILD_MAP[cleanOldNew] || 'Unknown',
    street: cleanStreet,
    town_city: cleanTownCity,
    district: cleanDistrict,
    county: cleanCounty,
    paon: cleanPaon,
    saon: cleanSaon,
    duration: cleanDuration,
    durationLabel: DURATION_MAP[cleanDuration] || 'Unknown',
    locality: cleanLocality,
    transactionCategory: cleanTransactionCategory,
    transactionCategoryLabel: TRANSACTION_CATEGORY_MAP[cleanTransactionCategory] || 'Unknown',
    recordStatus: cleanRecordStatus,
    fullAddress,
    year,
    month,
    priceRange: getPriceRange(priceNum)
  };
}

async function indexBatch(batch, batchLineNumbers) {
  if (batch.length === 0) return;

  try {
    const operations = batch.flatMap(doc => [
      { index: { _index: INDEX_NAME, _id: doc.id } },
      doc
    ]);

    const response = await esClient.bulk({
      body: operations,
      refresh: false // Don't refresh after every batch for better performance
    });

    if (response.errors) {
      const errors = response.items.filter(item => item.index?.error);
      errors.forEach((error, index) => {
        logFailed(batchLineNumbers[index], error.index.error.reason, batch[index]);
      });
    }

    return batch.length;
  } catch (error) {
    console.error('Error indexing batch:', error);
    batch.forEach((doc, index) => {
      logFailed(batchLineNumbers[index], error.message, doc);
    });
    return 0;
  }
}

async function processChunk(lines, startLineNumber) {
  let batch = [];
  let batchLineNumbers = [];
  let totalIndexed = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = startLineNumber + i;
    const line = lines[i];

    if (!line || line.trim() === '') continue;

    const doc = parseCSVLine(line, lineNumber);
    if (!doc) continue;

    batch.push(doc);
    batchLineNumbers.push(lineNumber);

    if (batch.length >= BATCH_SIZE) {
      const indexed = await indexBatch(batch, batchLineNumbers);
      totalIndexed += indexed;
      
      // Save checkpoint after each batch
      saveCheckpoint(lineNumber);
      
      // Clear batch arrays to free memory
      batch = [];
      batchLineNumbers = [];
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }

  // Index remaining documents in the last batch
  if (batch.length > 0) {
    const indexed = await indexBatch(batch, batchLineNumbers);
    totalIndexed += indexed;
    saveCheckpoint(startLineNumber + lines.length - 1);
  }

  return totalIndexed;
}

async function populateElasticsearch() {
  const startTime = Date.now();
  let totalIndexed = 0;
  let totalProcessed = 0;

  try {
    await createIndex();

    const csvFile = 'pp-complete-cleaned.csv';
    if (!fs.existsSync(csvFile)) {
      throw new Error(`CSV file not found: ${csvFile}`);
    }

    const startLine = loadCheckpoint();
    console.log(`Starting from line ${startLine}`);

    const fileStream = fs.createReadStream(csvFile, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lines = [];
    let currentLineNumber = startLine;
    let isFirstLine = true;

    for await (const line of rl) {
      currentLineNumber++;

      // Skip header line
      if (isFirstLine) {
        isFirstLine = false;
        continue;
      }

      // Skip lines before checkpoint
      if (currentLineNumber <= startLine) {
        continue;
      }

      lines.push(line);
      totalProcessed++;

      // Process chunk when we have enough lines
      if (lines.length >= CHUNK_SIZE) {
        const indexed = await processChunk(lines, currentLineNumber - lines.length + 1);
        totalIndexed += indexed;
        
        console.log(`Indexed ${totalIndexed} records (${Math.round(totalIndexed / ((Date.now() - startTime) / 1000))} records/sec) [Line: ${currentLineNumber}]`);
        
        // Clear lines array to free memory
        lines = [];
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
    }

    // Process remaining lines
    if (lines.length > 0) {
      const indexed = await processChunk(lines, currentLineNumber - lines.length + 1);
      totalIndexed += indexed;
    }

    // Final refresh
    await esClient.indices.refresh({ index: INDEX_NAME });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('\n🎉 Indexing completed!');
    console.log(`📊 Total records indexed: ${totalIndexed.toLocaleString()}`);
    console.log(`📈 Total lines processed: ${totalProcessed.toLocaleString()}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`🚀 Average speed: ${Math.round(totalIndexed / duration)} records/sec`);

  } catch (error) {
    console.error('Error during indexing:', error);
    throw error;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  populateElasticsearch().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  createIndex,
  parseCSVLine,
  indexBatch,
  populateElasticsearch
}; 