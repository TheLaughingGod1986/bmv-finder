const fs = require('fs');
const readline = require('readline');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  },
  tls: {
    rejectUnauthorized: false
  },
  requestTimeout: 60000, // 60 seconds timeout
  maxRetries: 3,
  retryOnTimeout: true,
});

const INDEX_NAME = 'properties';
const BATCH_SIZE = 10; // Very small batch size to prevent memory issues
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
    logSkipped(lineNumber, 'Too few columns', line);
    return null;
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

  // Skip if price is not a valid number
  const priceNum = parseInt(cleanPrice);
  if (isNaN(priceNum) || priceNum <= 0) {
    logSkipped(lineNumber, 'Invalid price', line);
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

async function indexBatch(batch, batchLineNumbers) {
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
            logFailed(batchLineNumbers[idx], item.index.error.reason, batch[idx]);
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

async function populateElasticsearch() {
  const startTime = Date.now();
  let totalIndexed = 0;
  let batch = [];
  let lineCount = 0;
  let isFirstLine = true;
  const startFromLine = loadCheckpoint();

  try {
    // Create the index if needed
    await createIndex();

    console.log(`Starting to index CSV data (resuming from line ${startFromLine})...`);
    console.log('This may take a while for the full dataset...');

    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: fs.createReadStream('pp-complete.csv'),
        crlfDelay: Infinity
      });

      const processBatch = async () => {
        if (batch.length === 0) return;
        
        const currentBatch = [...batch];
        const currentLineNumbers = batch.lineNumbers ? [...batch.lineNumbers] : [];
        batch = [];
        batch.lineNumbers = [];
        
        try {
          const indexedCount = await indexBatch(currentBatch, currentLineNumbers);
          totalIndexed += indexedCount;
          saveCheckpoint(lineCount); // Save progress after each batch
          
          // Progress reporting
          if (totalIndexed % 100 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = Math.round(totalIndexed / elapsed);
            console.log(`Indexed ${totalIndexed.toLocaleString()} records (${rate} records/sec) [Line: ${lineCount}]`);
          }
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
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
          logSkipped(lineCount, `Exception: ${error.message}`, line);
        }
      });

      rl.on('close', async () => {
        try {
          // Process remaining records
          if (batch.length > 0) {
            await processBatch();
          }
          
          saveCheckpoint(lineCount); // Save final checkpoint
          const totalTime = (Date.now() - startTime) / 1000;
          console.log('\n🎉 Indexing completed successfully!');
          console.log(`📊 Total records indexed: ${totalIndexed.toLocaleString()}`);
          console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
          console.log(`🚀 Average rate: ${Math.round(totalIndexed / totalTime)} records/second`);
          console.log(`📁 Lines processed: ${lineCount.toLocaleString()}`);
          
          // Refresh the index
          await esClient.indices.refresh({ index: INDEX_NAME });
          console.log('✅ Index refreshed and ready for search!');
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      rl.on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
    });

  } catch (error) {
    console.error('Error during indexing:', error);
    throw error;
  }
}

// Run the full import
populateElasticsearch().catch(console.error);

module.exports = { populateElasticsearch, createIndex }; 