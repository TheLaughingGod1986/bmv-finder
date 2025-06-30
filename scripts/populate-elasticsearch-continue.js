const fs = require('fs');
const readline = require('readline');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'TIRv--dMe*rHmuRMm-b4'
  },
  tls: {
    ca: fs.readFileSync('elasticsearch-8.13.0/config/certs/http_ca.crt'),
    rejectUnauthorized: true
  },
  requestTimeout: 60000, // 60 seconds timeout
  maxRetries: 3,
  retryOnTimeout: true,
});

const INDEX_NAME = 'properties';
const BATCH_SIZE = 20; // Even smaller batch size for memory efficiency
const START_FROM_LINE = 5041701; // Start from where we left off (5,041,700 + 1 for header)

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

function getPriceRange(price) {
  if (price < 100000) return 'Under £100k';
  if (price < 200000) return '£100k - £200k';
  if (price < 300000) return '£200k - £300k';
  if (price < 500000) return '£300k - £500k';
  if (price < 1000000) return '£500k - £1M';
  return 'Over £1M';
}

function parseCSVLine(line) {
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
  
  if (values.length < 16) return null;

  const [
    transactionId, price, dateOfTransfer, postcode, propertyType,
    duration, paon, saon, street, locality, town_city, county,
    transactionCategory, building, street2, locality2
  ] = values;

  // Clean up the values (remove quotes)
  const cleanTransactionId = transactionId.replace(/"/g, '');
  const cleanPrice = price.replace(/"/g, '');
  const cleanDateOfTransfer = dateOfTransfer.replace(/"/g, '').split(' ')[0]; // Take only the date part
  const cleanPostcode = postcode.replace(/"/g, '');
  const cleanPropertyType = propertyType.replace(/"/g, '');
  const cleanDuration = duration.replace(/"/g, '');
  const cleanPaon = paon.replace(/"/g, '');
  const cleanSaon = saon.replace(/"/g, '');
  const cleanStreet = street.replace(/"/g, '');
  const cleanLocality = locality.replace(/"/g, '');
  const cleanTownCity = town_city.replace(/"/g, '');
  const cleanCounty = county.replace(/"/g, '');
  const cleanTransactionCategory = transactionCategory.replace(/"/g, '');
  const cleanBuilding = building.replace(/"/g, '');
  const cleanStreet2 = street2.replace(/"/g, '');
  const cleanLocality2 = locality2.replace(/"/g, '');

  // Skip if price is not a valid number
  const priceNum = parseInt(cleanPrice);
  if (isNaN(priceNum) || priceNum <= 0) return null;

  return {
    id: cleanTransactionId,
    price: priceNum,
    dateOfTransfer: cleanDateOfTransfer,
    postcode: cleanPostcode,
    propertyType: cleanPropertyType,
    propertyTypeLabel: PROPERTY_TYPE_MAP[cleanPropertyType] || 'Unknown',
    duration: cleanDuration,
    durationLabel: DURATION_MAP[cleanDuration] || 'Unknown',
    paon: cleanPaon,
    saon: cleanSaon,
    street: cleanStreet,
    locality: cleanLocality,
    town_city: cleanTownCity,
    county: cleanCounty,
    transactionCategory: cleanTransactionCategory,
    transactionCategoryLabel: TRANSACTION_CATEGORY_MAP[cleanTransactionCategory] || 'Unknown',
    building: cleanBuilding,
    street2: cleanStreet2,
    locality2: cleanLocality2,
    // Computed fields
    fullAddress: `${cleanPaon || ''} ${cleanSaon || ''} ${cleanStreet || ''} ${cleanTownCity || ''}`.trim(),
    year: new Date(cleanDateOfTransfer).getFullYear(),
    month: new Date(cleanDateOfTransfer).getMonth() + 1,
    priceRange: getPriceRange(priceNum)
  };
}

async function indexBatch(batch) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const body = batch.flatMap(doc => [
        { index: { _index: INDEX_NAME } },
        doc
      ]);

      const result = await esClient.bulk({ 
        body,
        timeout: '60s',
        refresh: false
      });
      
      // Check for errors in bulk response
      if (result.errors) {
        const errors = result.items.filter(item => item.index?.error);
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

async function continuePopulateElasticsearch() {
  const startTime = Date.now();
  let totalIndexed = 0;
  let batch = [];
  let lineCount = 0;
  let isFirstLine = true;

  try {
    console.log(`Continuing to index CSV data from line ${START_FROM_LINE}...`);
    console.log('This may take a while for the remaining dataset...');

    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: fs.createReadStream('pp-complete.csv'),
        crlfDelay: Infinity
      });

      const processBatch = async () => {
        if (batch.length === 0) return;
        
        const currentBatch = [...batch];
        batch = [];
        
        try {
          const indexedCount = await indexBatch(currentBatch);
          totalIndexed += indexedCount;
          
          // Progress reporting
          if (totalIndexed % 500 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = Math.round(totalIndexed / elapsed);
            console.log(`Indexed ${totalIndexed.toLocaleString()} records (${rate} records/sec)`);
            
            // Force garbage collection if available
            if (global.gc) {
              global.gc();
            }
          }
        } catch (error) {
          reject(error);
          return;
        }
      };

      rl.on('line', async (line) => {
        lineCount++;
        
        // Skip until we reach the starting line
        if (lineCount < START_FROM_LINE) {
          return;
        }
        
        // Skip header line
        if (isFirstLine && lineCount === START_FROM_LINE) {
          isFirstLine = false;
          return;
        }
        
        try {
          const record = parseCSVLine(line);
          
          // Skip invalid records
          if (record === null) {
            return;
          }

          batch.push(record);

          // Process batch when it reaches the batch size
          if (batch.length >= BATCH_SIZE) {
            await processBatch();
          }
        } catch (error) {
          console.warn(`Error processing line ${lineCount}:`, error.message);
        }
      });

      rl.on('close', async () => {
        try {
          // Process remaining records
          if (batch.length > 0) {
            await processBatch();
          }

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

// Run the continuation import
continuePopulateElasticsearch().catch(console.error);

module.exports = { continuePopulateElasticsearch }; 