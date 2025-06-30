const fs = require('fs');
const readline = require('readline');
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'TIRv--dMe*rHmuRMm-b4'
  },
  tls: {
    ca: fs.readFileSync('elasticsearch-8.13.0/config/certs/http_ca.crt'),
    rejectUnauthorized: true
  }
});

const INDEX_NAME = 'properties';
const BATCH_SIZE = 10; // Very small batch size for testing

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

// Transaction category mapping
const TRANSACTION_CATEGORY_MAP = {
  'A': 'Standard Price Paid',
  'B': 'Additional Price Paid',
  'C': 'Price Paid for Transfers of a Share',
  'D': 'Price Paid for Transfers of a Share - Not Full Market Value',
  'E': 'Price Paid for Transfers of a Share - Full Market Value'
};

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
    locality2: cleanLocality2
  };
}

async function indexBatch(batch) {
  try {
    const body = batch.flatMap(doc => [
      { index: { _index: INDEX_NAME } },
      doc
    ]);

    console.log(`Attempting to index batch of ${batch.length} documents...`);
    
    const result = await esClient.bulk({ 
      body,
      timeout: '30s',
      refresh: true
    });
    
    console.log('Bulk operation result:', {
      took: result.took,
      errors: result.errors,
      items: result.items ? result.items.length : 0
    });
    
    if (result.errors) {
      const errors = result.items.filter(item => item.index?.error);
      console.error(`Bulk operation had ${errors.length} errors:`, errors.slice(0, 3));
    }
    
    return batch.length;
  } catch (error) {
    console.error('Batch indexing failed:', error.message);
    throw error;
  }
}

async function populateElasticsearch(limit = 100) {
  const startTime = Date.now();
  let totalIndexed = 0;
  let batch = [];
  let lineCount = 0;
  let isFirstLine = true;

  try {
    console.log(`Starting to index CSV data (limit: ${limit.toLocaleString()} records)...`);

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
          const indexed = await indexBatch(currentBatch);
          totalIndexed += indexed;
          console.log(`✅ Indexed ${totalIndexed} records so far`);
        } catch (error) {
          console.error('Failed to index batch:', error);
          reject(error);
          return;
        }
      };

      rl.on('line', async (line) => {
        if (isFirstLine) {
          isFirstLine = false;
          return;
        }

        if (lineCount >= limit) {
          rl.close();
          return;
        }

        const doc = parseCSVLine(line);
        if (doc) {
          batch.push(doc);
          
          if (batch.length >= BATCH_SIZE) {
            await processBatch();
          }
        }
        
        lineCount++;
      });

      rl.on('close', async () => {
        try {
          // Process remaining batch
          if (batch.length > 0) {
            await processBatch();
          }

          const endTime = Date.now();
          const duration = (endTime - startTime) / 1000;
          
          console.log('\n🎉 Indexing completed!');
          console.log(`📊 Total records indexed: ${totalIndexed.toLocaleString()}`);
          console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
          console.log(`🚀 Average rate: ${Math.round(totalIndexed / duration)} records/second`);
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Indexing failed:', error);
    throw error;
  }
}

// Run with a small limit for testing
populateElasticsearch(50).catch(console.error); 