const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { pipeline } = require('stream');
const { promisify } = require('util');
const csv = require('csv-parser');
const AdmZip = require('adm-zip');
require('dotenv').config();

const pipelineAsync = promisify(pipeline);

// Elasticsearch client configuration
const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  },
  tls: {
    rejectUnauthorized: false
  }
});

const INDEX_NAME = 'house_price_index';
// Updated URL - try multiple possible URLs
const ONS_HPI_URLS = [
  'https://www.ons.gov.uk/file?uri=/economy/inflationandpriceindices/datasets/housepriceindexfornewpropertiesandexistingdwellingshpione/current/hpione.zip',
  'https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/housepriceindexfornewpropertiesandexistingdwellingshpione/current/download/hpione.zip',
  'https://www.ons.gov.uk/file?uri=/economy/inflationandpriceindices/datasets/housepriceindexfornewpropertiesandexistingdwellingshpione/current/hpione.csv'
];
const TEMP_DIR = path.join(__dirname, '../temp');

// Region mapping for ONS data
const REGION_MAPPING = {
  'E12000001': 'North East',
  'E12000002': 'North West',
  'E12000003': 'Yorkshire and The Humber',
  'E12000004': 'East Midlands',
  'E12000005': 'West Midlands',
  'E12000006': 'East of England',
  'E12000007': 'London',
  'E12000008': 'South East',
  'E12000009': 'South West',
  'W92000004': 'Wales',
  'S92000003': 'Scotland',
  'N92000002': 'Northern Ireland',
  'K02000001': 'United Kingdom'
};

async function downloadFile(url, filepath) {
  console.log(`📥 Downloading from ${url}...`);
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    // Add headers to mimic a browser request
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    };
    
    https.get(url, options, (response) => {
      console.log(`📊 Response status: ${response.statusCode}`);
      console.log(`📊 Response headers:`, response.headers);
      
      if (response.statusCode === 403) {
        console.log('❌ 403 Forbidden - ONS website may be blocking automated requests');
        console.log('💡 Try accessing the data manually from: https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/housepriceindexfornewpropertiesandexistingdwellingshpione');
        reject(new Error('403 Forbidden - ONS website blocking automated requests'));
        return;
      }
      
      if (response.statusCode === 404) {
        console.log('❌ 404 Not Found - URL may have changed');
        reject(new Error('404 Not Found - URL may have changed'));
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded to ${filepath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file async
      reject(err);
    });
  });
}

async function tryDownloadFromMultipleUrls() {
  for (const url of ONS_HPI_URLS) {
    try {
      const filepath = path.join(TEMP_DIR, `hpi-${Date.now()}.zip`);
      await downloadFile(url, filepath);
      return filepath;
    } catch (error) {
      console.log(`❌ Failed to download from ${url}: ${error.message}`);
      continue;
    }
  }
  throw new Error('All ONS URLs failed - manual download required');
}

async function extractZip(zipPath, extractPath) {
  console.log(`📦 Extracting ${zipPath}...`);
  
  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);
    
    const files = fs.readdirSync(extractPath);
    const csvFile = files.find(file => file.endsWith('.csv'));
    
    if (!csvFile) {
      throw new Error('No CSV file found in ZIP');
    }
    
    console.log(`✅ Extracted ${csvFile}`);
    return path.join(extractPath, csvFile);
  } catch (error) {
    console.error('❌ Error extracting ZIP:', error);
    throw error;
  }
}

function parseHpiData(csvPath) {
  console.log(`📊 Parsing HPI data from ${csvPath}...`);
  
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Skip header rows and empty data
        if (!row['V4_0'] || row['V4_0'] === 'V4_0') return;
        
        const regionCode = row['administrative-geography'];
        const dateStr = row['date'];
        const indexValue = parseFloat(row['V4_0']);
        
        if (!regionCode || !dateStr || isNaN(indexValue)) return;
        
        const region = REGION_MAPPING[regionCode] || regionCode;
        const [year, month] = dateStr.split('-');
        
        if (!year || !month) return;
        
        results.push({
          region,
          regionCode,
          date: dateStr,
          year: parseInt(year),
          month: parseInt(month),
          index: indexValue,
          regionType: regionCode.startsWith('E') ? 'England' : 
                     regionCode.startsWith('W') ? 'Wales' :
                     regionCode.startsWith('S') ? 'Scotland' :
                     regionCode.startsWith('N') ? 'Northern Ireland' : 'UK',
          source: 'ONS',
          lastUpdated: new Date().toISOString()
        });
      })
      .on('end', () => {
        console.log(`✅ Parsed ${results.length} HPI records`);
        resolve(results);
      })
      .on('error', reject);
  });
}

async function calculateGrowthRates(data) {
  console.log('📈 Calculating growth rates...');
  
  // Sort data by region and date
  const sortedData = data.sort((a, b) => {
    if (a.region !== b.region) return a.region.localeCompare(b.region);
    return new Date(a.date) - new Date(b.date);
  });
  
  // Group by region
  const regionGroups = {};
  data.forEach(record => {
    if (!regionGroups[record.region]) {
      regionGroups[record.region] = [];
    }
    regionGroups[record.region].push(record);
  });
  
  // Calculate growth rates for each region
  Object.values(regionGroups).forEach(records => {
    records.forEach((record, index) => {
      if (index > 0) {
        const prevRecord = records[index - 1];
        const monthDiff = (record.year - prevRecord.year) * 12 + (record.month - prevRecord.month);
        
        if (monthDiff === 1) {
          record.monthOverMonth = ((record.index - prevRecord.index) / prevRecord.index) * 100;
        }
        
        if (monthDiff === 12) {
          record.yearOverYear = ((record.index - prevRecord.index) / prevRecord.index) * 100;
        }
      }
    });
  });
  
  console.log('✅ Growth rates calculated');
  return data;
}

async function uploadToElasticsearch(data) {
  console.log(`📤 Uploading ${data.length} records to Elasticsearch...`);
  
  const batchSize = 1000;
  let uploaded = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    const body = batch.flatMap(doc => [
      { index: { _index: INDEX_NAME } },
      doc
    ]);
    
    try {
      const result = await client.bulk({ 
        body,
        timeout: '60s',
        refresh: false
      });
      
      if (result.errors) {
        const errors = result.items.filter(item => item.index?.error);
        console.warn(`⚠️  Batch had ${errors.length} errors, but continuing...`);
      }
      
      uploaded += batch.length;
      console.log(`📊 Uploaded ${uploaded}/${data.length} records`);
      
    } catch (error) {
      console.error('❌ Error uploading batch:', error);
      throw error;
    }
  }
  
  // Refresh index
  await client.indices.refresh({ index: INDEX_NAME });
  console.log('✅ Index refreshed');
}

async function cleanup() {
  console.log('🧹 Cleaning up temporary files...');
  
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  
  console.log('✅ Cleanup completed');
}

async function updateHpiFromOns() {
  console.log('🚀 Starting ONS HPI update...');
  
  try {
    // Create temp directory
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
    
    console.log('⚠️  ONS website is blocking automated requests');
    console.log('💡 Manual download required:');
    console.log('   1. Visit: https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/housepriceindexfornewpropertiesandexistingdwellingshpione');
    console.log('   2. Download the latest ZIP file');
    console.log('   3. Place it in the temp directory as "hpione.zip"');
    console.log('   4. Run this script again');
    
    // Check if manual file exists
    const manualZipPath = path.join(TEMP_DIR, 'hpione.zip');
    if (fs.existsSync(manualZipPath)) {
      console.log('✅ Found manual download file, processing...');
      
      const extractPath = path.join(TEMP_DIR, 'extracted');
      
      // Extract ZIP file
      const csvPath = await extractZip(manualZipPath, extractPath);
      
      // Parse CSV data
      let data = await parseHpiData(csvPath);
      
      // Calculate growth rates
      data = await calculateGrowthRates(data);
      
      // Upload to Elasticsearch
      await uploadToElasticsearch(data);
      
      // Cleanup
      await cleanup();
      
      console.log('🎉 ONS HPI update completed successfully!');
      console.log(`📊 Total records processed: ${data.length}`);
      
    } else {
      console.log('❌ No manual download file found');
      console.log('📁 Expected location:', manualZipPath);
      console.log('🔄 Please download the file manually and try again');
      
      // Alternative: Use existing data to update growth rates
      console.log('🔄 Attempting to update growth rates for existing data...');
      await updateExistingHpiGrowthRates();
    }
    
  } catch (error) {
    console.error('💥 ONS HPI update failed:', error);
    await cleanup();
    throw error;
  }
}

async function updateExistingHpiGrowthRates() {
  console.log('📊 Updating growth rates for existing HPI data...');
  
  try {
    // Get existing HPI data from Elasticsearch
    const result = await client.search({
      index: INDEX_NAME,
      size: 10000,
      body: {
        query: {
          match_all: {}
        },
        sort: [
          { region: { order: 'asc' } },
          { date: { order: 'asc' } }
        ]
      }
    });
    
    const existingData = result.hits.hits.map(hit => hit._source);
    
    if (existingData.length === 0) {
      console.log('❌ No existing HPI data found');
      return;
    }
    
    console.log(`📊 Found ${existingData.length} existing records`);
    
    // Calculate growth rates
    const updatedData = await calculateGrowthRates(existingData);
    
    // Update records with new growth rates
    const batchSize = 1000;
    let updated = 0;
    
    for (let i = 0; i < updatedData.length; i += batchSize) {
      const batch = updatedData.slice(i, i + batchSize);
      
      const body = batch.flatMap(doc => [
        { update: { _index: INDEX_NAME, _id: doc._id || `${doc.region}_${doc.date}` } },
        { doc: { monthOverMonth: doc.monthOverMonth, yearOverYear: doc.yearOverYear }, doc_as_upsert: true }
      ]);
      
      try {
        const result = await client.bulk({ 
          body,
          timeout: '60s',
          refresh: false
        });
        
        if (result.errors) {
          const errors = result.items.filter(item => item.update?.error);
          console.warn(`⚠️  Batch had ${errors.length} errors, but continuing...`);
        }
        
        updated += batch.length;
        console.log(`📊 Updated ${updated}/${updatedData.length} records`);
        
      } catch (error) {
        console.error('❌ Error updating batch:', error);
        throw error;
      }
    }
    
    // Refresh index
    await client.indices.refresh({ index: INDEX_NAME });
    console.log('✅ Growth rates updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating growth rates:', error);
    throw error;
  }
}

// Run the update
if (require.main === module) {
  updateHpiFromOns()
    .then(() => {
      console.log('✅ HPI update completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ HPI update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateHpiFromOns }; 