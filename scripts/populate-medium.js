const fs = require('fs');
const { Client } = require('@elastic/elasticsearch');
const path = require('path');

// Elasticsearch client configuration
const client = new Client({
  node: 'https://5210a2528e1a499e8b6ee0214cd4fbca.us-central1.gcp.cloud.es.io:443',
  auth: {
    apiKey: process.env.MEDIUM_API_KEY
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Mapping constants
const PROPERTY_TYPE_MAP = {
  'D': 'Detached',
  'S': 'Semi-Detached',
  'T': 'Terraced',
  'F': 'Flats/Maisonettes',
  'O': 'Other'
};

const NEW_BUILD_MAP = {
  'Y': 'New Build',
  'N': 'Existing'
};

const TRANSACTION_CATEGORY_MAP = {
  'A': 'Standard Price Paid',
  'B': 'Additional Price Paid',
  'C': 'Price Paid for Transfers of a Share',
  'D': 'Price Paid for Transfers of a Share - Not Full Market Value',
  'E': 'Price Paid for Transfers of a Share - Full Market Value'
};

// CSV parsing function
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current.trim());
  return fields;
}

// Transform record function
function transformRecord(fields) {
  if (fields.length < 16) return null;
  
  const [
    transactionId, price, dateOfTransfer, postcode, propertyType,
    newBuild, estateType, paon, saon, street, locality, townCity,
    district, county, transactionCategory, recordStatus
  ] = fields;

  // Skip header or invalid records
  if (transactionId === 'Transaction unique identifier' || !price || !dateOfTransfer) {
    return null;
  }

  // Parse date and convert to ISO format for Elasticsearch
  let dateOfTransferFormatted = null;
  if (dateOfTransfer && dateOfTransfer.trim()) {
    // Convert "1995-06-23 00:00" to "1995-06-23T00:00:00Z"
    const dateStr = dateOfTransfer.trim();
    if (dateStr.includes(' ')) {
      dateOfTransferFormatted = dateStr.replace(' ', 'T') + ':00Z';
    } else {
      dateOfTransferFormatted = dateStr + 'T00:00:00Z';
    }
  }

  return {
    transactionId: transactionId || null,
    price: parseInt(price) || 0,
    dateOfTransfer: dateOfTransferFormatted,
    postcode: postcode || null,
    propertyType: PROPERTY_TYPE_MAP[propertyType] || propertyType || null,
    newBuild: NEW_BUILD_MAP[newBuild] || newBuild || null,
    estateType: estateType || null,
    paon: paon || null,
    saon: saon || null,
    street: street || null,
    locality: locality || null,
    townCity: townCity || null,
    district: district || null,
    county: county || null,
    transactionCategory: TRANSACTION_CATEGORY_MAP[transactionCategory] || transactionCategory || null,
    recordStatus: recordStatus || null
  };
}

async function indexMediumBatch() {
  const csvPath = path.join(__dirname, '../pp-complete.csv');
  const batchSize = 100;
  const maxRecords = 1000; // Process 1000 records
  let lineCount = 0;
  let indexedCount = 0;
  let batch = [];
  const startTime = Date.now();

  console.log(`Starting to index CSV data (limit: ${maxRecords} records)...`);

  try {
    const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
    const rl = require('readline').createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      lineCount++;
      
      // Skip header
      if (lineCount === 1) continue;
      
      // Stop after maxRecords
      if (indexedCount >= maxRecords) break;

      try {
        const fields = parseCSVLine(line);
        
        // Skip invalid records
        if (!Array.isArray(fields)) {
          console.warn(`Warning: Skipping malformed line ${lineCount} (fields is not iterable)`);
          continue;
        }
        if (fields === null) {
          continue;
        }

        const transformedRecord = transformRecord(fields);
        if (transformedRecord) {
          batch.push(transformedRecord);
        }

        // Index batch when it reaches batchSize
        if (batch.length >= batchSize) {
          console.log(`Attempting to index batch of ${batch.length} documents...`);
          
          const bulkBody = batch.flatMap(doc => [
            { index: { _index: 'properties' } },
            doc
          ]);

          try {
            const result = await client.bulk({ body: bulkBody });
            
            if (result.errors) {
              console.log('❌ Bulk operation failed with errors:');
              result.items.forEach((item, index) => {
                if (item.index && item.index.error) {
                  console.log(`  Document ${index}: ${item.index.error.reason}`);
                  if (item.index.error.caused_by) {
                    console.log(`    Caused by: ${item.index.error.caused_by.reason}`);
                  }
                }
              });
            } else {
              console.log(`✅ Successfully indexed batch of ${batch.length} documents`);
            }
            
            console.log(`Bulk operation result:`, { took: result.took, errors: result.errors, items: result.items.length });
          } catch (error) {
            console.error('Error during bulk operation:', error);
          }
          
          indexedCount += batch.length;
          console.log(`✅ Indexed ${indexedCount} records so far`);
          batch = [];
        }

      } catch (error) {
        console.error(`Error processing line ${lineCount}:`, error.message);
      }
    }

    // Index remaining records
    if (batch.length > 0) {
      console.log(`Attempting to index final batch of ${batch.length} documents...`);
      
      const bulkBody = batch.flatMap(doc => [
        { index: { _index: 'properties' } },
        doc
      ]);

      const result = await client.bulk({ body: bulkBody });
      console.log('Bulk operation result:', { took: result.took, errors: result.errors, items: result.items.length });
      
      if (!result.errors) {
        indexedCount += batch.length;
      }
    }

    const totalTime = (Date.now() - startTime) / 1000;
    const rate = totalTime > 0 ? (indexedCount / totalTime).toFixed(0) : 0;

    console.log('\n🎉 Indexing completed!');
    console.log(`📊 Total records indexed: ${indexedCount}`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
    console.log(`🚀 Average rate: ${rate} records/second`);

  } catch (error) {
    console.error('Error during indexing:', error);
  }
}

// Run the indexing
indexMediumBatch().catch(console.error); 