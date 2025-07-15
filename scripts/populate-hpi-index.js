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

const INDEX_NAME = 'house_price_index';
const BATCH_SIZE = 1000;
const CHECKPOINT_FILE = 'hpi_import_checkpoint.txt';

function saveCheckpoint(lineNumber) {
  fs.writeFileSync(CHECKPOINT_FILE, String(lineNumber));
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return parseInt(fs.readFileSync(CHECKPOINT_FILE, 'utf8'), 10) || 0;
  }
  return 0;
}

async function createHPIIndex() {
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
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            region: { type: 'keyword' },
            regionLabel: { type: 'text' },
            date: { type: 'date', format: 'yyyy-MM' },
            year: { type: 'integer' },
            month: { type: 'integer' },
            hpiIndex: { type: 'float' },
            averagePrice: { type: 'float' },
            percentageChangeYearly: { type: 'float' },
            percentageChangeMonthly: { type: 'float' },
            salesVolume: { type: 'integer' },
            propertyType: { type: 'keyword' },
            buyerType: { type: 'keyword' },
            purchaseType: { type: 'keyword' },
            buildType: { type: 'keyword' }
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

function parseHPIRegionsLine(line, lineNumber) {
  if (!line || line.trim() === '') return null;
  
  const values = line.split(',');
  if (values.length < 3) return null;

  const [regionLabel, date, hpiIndex] = values;
  
  if (!regionLabel || !date || !hpiIndex) return null;
  
  const hpiValue = parseFloat(hpiIndex);
  if (isNaN(hpiValue)) return null;
  
  const [year, month] = date.split('-').map(Number);
  if (!year || !month) return null;
  
  return {
    id: `${regionLabel}-${date}`,
    region: regionLabel.toLowerCase().replace(/\s+/g, '-'),
    regionLabel: regionLabel.trim(),
    date: date,
    year: year,
    month: month,
    hpiIndex: hpiValue,
    propertyType: 'all',
    buyerType: 'all',
    purchaseType: 'all',
    buildType: 'all'
  };
}

function parseHPIFullLine(line, lineNumber) {
  if (!line || line.trim() === '') return null;
  
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
  values.push(current.trim());
  
  if (values.length < 10) return null;

  const [
    name, uri, regionCode, period, salesVolume, reportingPeriod,
    averagePriceAll, percentageChangeYearlyAll, percentageChangeMonthlyAll, hpiIndexAll
  ] = values;

  if (!name || !period || !hpiIndexAll) return null;
  
  const hpiValue = parseFloat(hpiIndexAll.replace(/"/g, ''));
  if (isNaN(hpiValue)) return null;
  
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return null;
  
  const avgPrice = parseFloat(averagePriceAll.replace(/"/g, '')) || null;
  const yearlyChange = parseFloat(percentageChangeYearlyAll.replace(/"/g, '')) || null;
  const monthlyChange = parseFloat(percentageChangeMonthlyAll.replace(/"/g, '')) || null;
  const salesVol = parseInt(salesVolume.replace(/"/g, '')) || null;
  
  return {
    id: `${name.replace(/"/g, '')}-${period}`,
    region: name.replace(/"/g, '').toLowerCase().replace(/\s+/g, '-'),
    regionLabel: name.replace(/"/g, ''),
    date: period,
    year: year,
    month: month,
    hpiIndex: hpiValue,
    averagePrice: avgPrice,
    percentageChangeYearly: yearlyChange,
    percentageChangeMonthly: monthlyChange,
    salesVolume: salesVol,
    propertyType: 'all',
    buyerType: 'all',
    purchaseType: 'all',
    buildType: 'all'
  };
}

async function indexBatch(batch) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const body = batch.flatMap(doc => [
        { index: { _index: INDEX_NAME, _id: doc.id } },
        doc
      ]);

      const result = await esClient.bulk({ 
        body,
        timeout: '60s',
        refresh: false
      });
      
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
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function populateHPIRegions() {
  return new Promise((resolve, reject) => {
    let batch = [];
    let lineCount = 0;
    let isFirstLine = true;
    let totalIndexed = 0;
    const startFromLine = loadCheckpoint();

    console.log('Processing HPI regions data...');

    const rl = readline.createInterface({
      input: fs.createReadStream('data/hpi-regions.csv'),
      crlfDelay: Infinity
    });

    const processBatch = async () => {
      if (batch.length === 0) return;
      
      const currentBatch = [...batch];
      batch = [];
      
      try {
        const indexedCount = await indexBatch(currentBatch);
        totalIndexed += indexedCount;
        saveCheckpoint(lineCount);
        
        if (totalIndexed % 1000 === 0) {
          console.log(`  Indexed ${totalIndexed.toLocaleString()} HPI records`);
        }
      } catch (error) {
        reject(error);
        return;
      }
    };

    rl.on('line', async (line) => {
      lineCount++;
      if (lineCount <= startFromLine) return;
      
      if (isFirstLine) {
        isFirstLine = false;
        return;
      }
      
      try {
        const record = parseHPIRegionsLine(line, lineCount);
        if (record === null) return;
        
        batch.push(record);
        
        if (batch.length >= BATCH_SIZE) {
          await processBatch();
        }
      } catch (error) {
        console.error(`Error processing line ${lineCount}:`, error.message);
      }
    });

    rl.on('close', async () => {
      try {
        if (batch.length > 0) {
          await processBatch();
        }
        
        console.log(`  ✅ Completed HPI regions: ${totalIndexed.toLocaleString()} records`);
        resolve(totalIndexed);
      } catch (error) {
        reject(error);
      }
    });

    rl.on('error', (error) => {
      console.error('Error reading HPI regions CSV:', error);
      reject(error);
    });
  });
}

async function populateHPIFull() {
  return new Promise((resolve, reject) => {
    let batch = [];
    let lineCount = 0;
    let isFirstLine = true;
    let totalIndexed = 0;

    console.log('Processing HPI full data...');

    const rl = readline.createInterface({
      input: fs.createReadStream('data/hpi-full.csv'),
      crlfDelay: Infinity
    });

    const processBatch = async () => {
      if (batch.length === 0) return;
      
      const currentBatch = [...batch];
      batch = [];
      
      try {
        const indexedCount = await indexBatch(currentBatch);
        totalIndexed += indexedCount;
        
        if (totalIndexed % 1000 === 0) {
          console.log(`  Indexed ${totalIndexed.toLocaleString()} HPI full records`);
        }
      } catch (error) {
        reject(error);
        return;
      }
    };

    rl.on('line', async (line) => {
      lineCount++;
      
      if (isFirstLine) {
        isFirstLine = false;
        return;
      }
      
      try {
        const record = parseHPIFullLine(line, lineCount);
        if (record === null) return;
        
        batch.push(record);
        
        if (batch.length >= BATCH_SIZE) {
          await processBatch();
        }
      } catch (error) {
        console.error(`Error processing line ${lineCount}:`, error.message);
      }
    });

    rl.on('close', async () => {
      try {
        if (batch.length > 0) {
          await processBatch();
        }
        
        console.log(`  ✅ Completed HPI full: ${totalIndexed.toLocaleString()} records`);
        resolve(totalIndexed);
      } catch (error) {
        reject(error);
      }
    });

    rl.on('error', (error) => {
      console.error('Error reading HPI full CSV:', error);
      reject(error);
    });
  });
}

async function populateHPIIndex() {
  const startTime = Date.now();
  
  try {
    await createHPIIndex();
    
    console.log('Starting HPI data import...');
    
    const regionsCount = await populateHPIRegions();
    const fullCount = await populateHPIFull();
    
    const totalTime = (Date.now() - startTime) / 1000;
    console.log('\n🎉 HPI indexing completed successfully!');
    console.log(`📊 Total records indexed: ${(regionsCount + fullCount).toLocaleString()}`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
    
    await esClient.indices.refresh({ index: INDEX_NAME });
    console.log('✅ HPI index refreshed and ready for search!');
    
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE);
    }
    
  } catch (error) {
    console.error('Error during HPI indexing:', error);
    throw error;
  }
}

// Run the import
populateHPIIndex().catch(console.error); 