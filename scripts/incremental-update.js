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
  }
});

const INDEX_NAME = 'properties';
const BATCH_SIZE = 100;

async function getLatestTransactionDate() {
  try {
    const response = await esClient.search({
      index: INDEX_NAME,
      body: {
        size: 1,
        sort: [{ dateOfTransfer: { order: 'desc' } }],
        _source: ['dateOfTransfer']
      }
    });
    
    if (response.hits.hits.length > 0) {
      return response.hits.hits[0]._source.dateOfTransfer;
    }
    return null;
  } catch (error) {
    console.error('Error getting latest transaction date:', error);
    return null;
  }
}

async function indexBatch(batch) {
  if (batch.length === 0) return 0;
  
  const operations = batch.flatMap(doc => [
    { index: { _index: INDEX_NAME } },
    doc
  ]);
  
  try {
    const response = await esClient.bulk({ body: operations });
    
    if (response.errors) {
      const errors = response.items.filter(item => item.index?.error);
      console.error('Bulk indexing errors:', errors.length);
    }
    
    return batch.length;
  } catch (error) {
    console.error('Bulk indexing failed:', error);
    throw error;
  }
}

async function incrementalUpdate() {
  try {
    console.log('Starting incremental update...');
    
    // Get the latest transaction date from current data
    const latestDate = await getLatestTransactionDate();
    console.log(`Latest transaction date in index: ${latestDate || 'None'}`);
    
    if (!fs.existsSync('pp-complete.csv')) {
      console.error('CSV file not found. Please download it first.');
      return;
    }
    
    const fileStream = fs.createReadStream('pp-complete.csv');
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let lineCount = 0;
    let newRecords = 0;
    let batch = [];
    const startTime = Date.now();
    
    for await (const line of rl) {
      lineCount++;
      
      // Skip header
      if (lineCount === 1) continue;
      
      // Parse the line
      const record = parseCSVLine(line);
      if (!record) continue;
      
      // Check if this record is newer than our latest date
      if (latestDate && record.dateOfTransfer <= latestDate) {
        continue; // Skip older records
      }
      
      batch.push(record);
      newRecords++;
      
      if (batch.length >= BATCH_SIZE) {
        await indexBatch(batch);
        batch = [];
        
        if (newRecords % 1000 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = Math.round(newRecords / elapsed);
          console.log(`Processed ${newRecords.toLocaleString()} new records (${rate} records/sec)`);
        }
      }
    }
    
    // Index remaining records
    if (batch.length > 0) {
      await indexBatch(batch);
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`✅ Incremental update completed!`);
    console.log(`📊 New records added: ${newRecords.toLocaleString()}`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
    
  } catch (error) {
    console.error('❌ Incremental update failed:', error);
    process.exit(1);
  }
}

// Reuse the parseCSVLine function from the main import script
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
  const cleanDate = dateOfTransfer.replace(/"/g, '');
  const cleanPostcode = postcode.replace(/"/g, '').toUpperCase();
  const cleanPropertyType = propertyType.replace(/"/g, '');
  const cleanDuration = duration.replace(/"/g, '');
  const cleanPaon = paon.replace(/"/g, '');
  const cleanSaon = saon.replace(/"/g, '');
  const cleanStreet = street.replace(/"/g, '');
  const cleanLocality = locality.replace(/"/g, '');
  const cleanTownCity = town_city.replace(/"/g, '');
  const cleanCounty = county.replace(/"/g, '');

  // Validate required fields
  if (!cleanPrice || !cleanDate || !cleanPostcode) return null;

  const priceNum = parseInt(cleanPrice);
  if (isNaN(priceNum) || priceNum <= 0) return null;

  const date = new Date(cleanDate);
  if (isNaN(date.getTime())) return null;

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

  return {
    id: `${cleanTransactionId || cleanPaon}_${cleanStreet}_${cleanPostcode}_${cleanDate}`,
    price: priceNum,
    dateOfTransfer: cleanDate,
    postcode: cleanPostcode,
    propertyType: cleanPropertyType,
    propertyTypeLabel: PROPERTY_TYPE_MAP[cleanPropertyType] || cleanPropertyType,
    street: cleanStreet,
    town_city: cleanTownCity,
    county: cleanCounty,
    paon: cleanPaon,
    saon: cleanSaon,
    duration: cleanDuration,
    durationLabel: DURATION_MAP[cleanDuration] || cleanDuration,
    locality: cleanLocality,
    fullAddress: `${cleanPaon} ${cleanStreet}, ${cleanTownCity}, ${cleanCounty}`.trim(),
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    priceRange: priceNum < 100000 ? 'Under £100k' :
                priceNum < 200000 ? '£100k-£200k' :
                priceNum < 300000 ? '£200k-£300k' :
                priceNum < 500000 ? '£300k-£500k' :
                priceNum < 1000000 ? '£500k-£1M' : 'Over £1M'
  };
}

// Run the incremental update
incrementalUpdate(); 