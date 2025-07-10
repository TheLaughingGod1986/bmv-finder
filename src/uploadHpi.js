const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const axios = require('axios');

const argv = yargs(hideBin(process.argv))
  .option('postcode', {
    alias: 'p',
    type: 'string',
    description: 'Postcode to search for HPI data'
  })
  .option('mode', {
    alias: 'm',
    type: 'string',
    default: 'upload',
    choices: ['upload', 'search'],
    description: 'Mode: upload (default) or search'
  })
  .option('fetch-api', {
    alias: 'f',
    type: 'boolean',
    default: true,
    description: 'Fetch data from Land Registry API if not found locally (search mode only)'
  })
  .help()
  .argv;

console.log('CLI arguments:', argv);

// Elasticsearch client configuration
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'https://5210a2528e1a499e8b6ee0214cd4fbca.us-central1.gcp.cloud.es.io:443',
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY || 'RXR5QXdKY0JuWEhXbkJLZ0JhZVo6N3AwRk9tdFBzcENwV2hwdzVudjJ4Zw=='
  },
  tls: {
    rejectUnauthorized: false
  }
});

const INDEX_NAME = 'house_price_index';
const DEFAULT_CSV_PATH = path.join(__dirname, '../data/hpi.csv');

// Region mapping for manual CSV data
const REGION_MAPPING = {
  'North East': 'North East',
  'North West': 'North West',
  'Yorkshire and The Humber': 'Yorkshire and The Humber',
  'East Midlands': 'East Midlands',
  'West Midlands': 'West Midlands',
  'East of England': 'East of England',
  'London': 'London',
  'South East': 'South East',
  'South West': 'South West',
  'Wales': 'Wales',
  'Scotland': 'Scotland',
  'Northern Ireland': 'Northern Ireland',
  'United Kingdom': 'United Kingdom',
  'UK': 'United Kingdom'
};

function parseLocalHpiData(csvPath) {
  console.log(`📊 Parsing local HPI data from ${csvPath}...`);
  
  return new Promise((resolve, reject) => {
    const results = [];
    
    if (!fs.existsSync(csvPath)) {
      reject(new Error(`CSV file not found: ${csvPath}`));
      return;
    }
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Handle different CSV formats
        const region = row.region || row.Region || row.REGION;
        const dateStr = row.date || row.Date || row.DATE;
        const indexValue = parseFloat(row.index || row.Index || row.INDEX || row.value || row.Value || row.VALUE);
        
        if (!region || !dateStr || isNaN(indexValue)) {
          console.warn(`⚠️  Skipping invalid row:`, row);
          return;
        }
        
        const normalizedRegion = REGION_MAPPING[region] || region;
        const [year, month] = dateStr.split('-');
        
        if (!year || !month) {
          console.warn(`⚠️  Invalid date format: ${dateStr}`);
          return;
        }
        
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        
        if (yearNum < 1990 || yearNum > 2030 || monthNum < 1 || monthNum > 12) {
          console.warn(`⚠️  Invalid date values: ${year}-${month}`);
          return;
        }
        
        results.push({
          region: normalizedRegion,
          regionCode: getRegionCode(normalizedRegion),
          date: dateStr,
          year: yearNum,
          month: monthNum,
          index: indexValue,
          regionType: getRegionType(normalizedRegion),
          source: 'Manual CSV',
          lastUpdated: new Date().toISOString()
        });
      })
      .on('end', () => {
        console.log(`✅ Parsed ${results.length} HPI records from local CSV`);
        resolve(results);
      })
      .on('error', reject);
  });
}

function getRegionCode(region) {
  const codeMap = {
    'North East': 'E12000001',
    'North West': 'E12000002',
    'Yorkshire and The Humber': 'E12000003',
    'East Midlands': 'E12000004',
    'West Midlands': 'E12000005',
    'East of England': 'E12000006',
    'London': 'E12000007',
    'South East': 'E12000008',
    'South West': 'E12000009',
    'Wales': 'W92000004',
    'Scotland': 'S92000003',
    'Northern Ireland': 'N92000002',
    'United Kingdom': 'K02000001'
  };
  return codeMap[region] || region;
}

function getRegionType(region) {
  if (region === 'United Kingdom') return 'UK';
  if (region === 'Wales') return 'Wales';
  if (region === 'Scotland') return 'Scotland';
  if (region === 'Northern Ireland') return 'Northern Ireland';
  return 'England';
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
  console.log(`📤 Checking and uploading ${data.length} records to Elasticsearch...`);
  
  // Filter out records that already exist
  const missingRecords = [];
  let checked = 0;
  
  for (const record of data) {
    const exists = await checkRecordExists(record);
    if (!exists) {
      missingRecords.push(record);
    }
    checked++;
    if (checked % 100 === 0) {
      console.log(`🔍 Checked ${checked}/${data.length} records, found ${missingRecords.length} missing`);
    }
  }
  
  console.log(`📊 Found ${missingRecords.length} missing records out of ${data.length} total`);
  
  if (missingRecords.length === 0) {
    console.log('✅ All records already exist in Elasticsearch');
    return;
  }
  
  const batchSize = 1000;
  let uploaded = 0;
  
  for (let i = 0; i < missingRecords.length; i += batchSize) {
    const batch = missingRecords.slice(i, i + batchSize);
    
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
      console.log(`📊 Uploaded ${uploaded}/${missingRecords.length} missing records`);
      
    } catch (error) {
      console.error('❌ Error uploading batch:', error);
      throw error;
    }
  }
  
  // Refresh index
  await client.indices.refresh({ index: INDEX_NAME });
  console.log('✅ Index refreshed');
}

async function createSampleCsv() {
  console.log('📝 Creating sample HPI CSV file...');
  
  const sampleData = [
    { region: 'London', date: '2023-01', index: 100.0 },
    { region: 'London', date: '2023-02', index: 101.2 },
    { region: 'London', date: '2023-03', index: 102.5 },
    { region: 'South East', date: '2023-01', index: 95.0 },
    { region: 'South East', date: '2023-02', index: 96.1 },
    { region: 'South East', date: '2023-03', index: 97.3 },
    { region: 'North West', date: '2023-01', index: 85.0 },
    { region: 'North West', date: '2023-02', index: 85.8 },
    { region: 'North West', date: '2023-03', index: 86.7 }
  ];
  
  const csvContent = ['region,date,index\n'];
  sampleData.forEach(row => {
    csvContent.push(`${row.region},${row.date},${row.index}\n`);
  });
  
  // Ensure data directory exists
  const dataDir = path.dirname(DEFAULT_CSV_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(DEFAULT_CSV_PATH, csvContent.join(''));
  console.log(`✅ Sample CSV created at ${DEFAULT_CSV_PATH}`);
}

async function checkRecordExists(record) {
  const query = {
    bool: {
      must: [
        { term: { region: record.region } },
        { term: { date: record.date } }
      ]
    }
  };
  
  // Add postcode to query if it exists
  if (record.postcode) {
    query.bool.must.push({ term: { postcode: record.postcode } });
  }
  
  try {
    const result = await client.search({
      index: INDEX_NAME,
      size: 1,
      body: {
        query: query
      }
    });
    
    return result.body && result.body.hits && result.body.hits.total && result.body.hits.total.value > 0;
  } catch (error) {
    console.error('Error checking if record exists:', error);
    return false;
  }
}

async function uploadHpi(csvPath = DEFAULT_CSV_PATH) {
  console.log('🚀 Starting local HPI upload...');
  
  try {
    // Check if CSV file exists, create sample if not
    if (!fs.existsSync(csvPath)) {
      console.log(`📁 CSV file not found at ${csvPath}`);
      await createSampleCsv();
    }
    
    // Parse CSV data
    let data = await parseLocalHpiData(csvPath);
    
    if (data.length === 0) {
      throw new Error('No valid data found in CSV file');
    }
    
    // Calculate growth rates
    data = await calculateGrowthRates(data);
    
    // Upload to Elasticsearch
    await uploadToElasticsearch(data);
    
    console.log('🎉 Local HPI upload completed successfully!');
    console.log(`📊 Total records processed: ${data.length}`);
    
    // Show summary by region
    const regionSummary = {};
    data.forEach(record => {
      if (!regionSummary[record.region]) {
        regionSummary[record.region] = { count: 0, latestIndex: 0, latestDate: '' };
      }
      regionSummary[record.region].count++;
      if (record.date > regionSummary[record.region].latestDate) {
        regionSummary[record.region].latestDate = record.date;
        regionSummary[record.region].latestIndex = record.index;
      }
    });
    
    console.log('\n📋 Upload Summary by Region:');
    Object.entries(regionSummary).forEach(([region, stats]) => {
      console.log(`  ${region}: ${stats.count} records, latest: ${stats.latestDate} (${stats.latestIndex.toFixed(1)})`);
    });
    
  } catch (error) {
    console.error('💥 Local HPI upload failed:', error);
    throw error;
  }
}

async function searchHpiByPostcode(postcode) {
  console.log(`🔍 Searching for HPI data for postcode: ${postcode}`);
  
  try {
    const result = await client.search({
      index: INDEX_NAME,
      size: 100,
      body: {
        query: {
          term: { postcode: postcode }
        },
        sort: [
          { date: { order: 'desc' } }
        ]
      }
    });
    
    const hits = result.body && result.body.hits ? result.body.hits.hits : [];
    
    if (hits.length === 0) {
      console.log(`❌ No HPI data found for postcode: ${postcode}`);
      return [];
    }
    
    console.log(`✅ Found ${hits.length} HPI records for postcode: ${postcode}`);
    
    // Display the results
    hits.forEach((hit, index) => {
      const source = hit._source;
      console.log(`${index + 1}. ${source.region} - ${source.date} - Index: ${source.index}`);
      if (source.monthOverMonth !== undefined) {
        console.log(`   MoM Growth: ${source.monthOverMonth.toFixed(2)}%`);
      }
      if (source.yearOverYear !== undefined) {
        console.log(`   YoY Growth: ${source.yearOverYear.toFixed(2)}%`);
      }
    });
    
    return hits.map(hit => hit._source);
    
  } catch (error) {
    console.error('❌ Error searching for postcode:', error);
    return [];
  }
}

// Land Registry API configuration
const LAND_REGISTRY_API_BASE = 'https://landregistry.data.gov.uk/data/ppi/';

async function fetchHpiFromLandRegistry(postcode) {
  console.log(`🌐 Fetching HPI data from Land Registry API for postcode: ${postcode}`);
  
  try {
    // Query the Land Registry API for HPI data
    const response = await axios.get(`${LAND_REGISTRY_API_BASE}transaction-record`, {
      params: {
        postcode: postcode,
        limit: 100,
        format: 'json'
      },
      timeout: 30000
    });
    
    if (!response.data || !response.data.result) {
      console.log(`❌ No data returned from Land Registry API for postcode: ${postcode}`);
      return [];
    }
    
    const transactions = response.data.result.items || [];
    console.log(`📊 Found ${transactions.length} transactions from Land Registry API`);
    
    // Process and format the data for HPI index
    const hpiRecords = transactions.map(transaction => {
      const date = new Date(transaction.dateOfTransfer);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      return {
        region: transaction.region || 'Unknown',
        regionCode: transaction.regionCode || '',
        date: `${year}-${month.toString().padStart(2, '0')}`,
        year: year,
        month: month,
        index: transaction.pricePaid || 0,
        postcode: postcode,
        regionType: 'England', // Default, could be enhanced
        source: 'Land Registry API',
        lastUpdated: new Date().toISOString(),
        transactionId: transaction.transactionId,
        propertyType: transaction.propertyType,
        pricePaid: transaction.pricePaid
      };
    });
    
    return hpiRecords;
    
  } catch (error) {
    console.error('❌ Error fetching from Land Registry API:', error.message);
    return [];
  }
}

async function searchAndFetchHpiData(postcode, fetchFromApi = true) {
  console.log(`🔍 Searching for HPI data for postcode: ${postcode}`);
  
  // First, search in Elasticsearch
  const existingData = await searchHpiByPostcode(postcode);
  
  if (existingData.length > 0) {
    console.log(`✅ Found ${existingData.length} existing records in Elasticsearch`);
    return existingData;
  }
  
  if (!fetchFromApi) {
    console.log(`❌ No existing data found in Elasticsearch for ${postcode}`);
    return [];
  }
  
  console.log(`❌ No existing data found in Elasticsearch for ${postcode}`);
  console.log(`🌐 Attempting to fetch from Land Registry API...`);
  
  // If not found in Elasticsearch, try Land Registry API
  const apiData = await fetchHpiFromLandRegistry(postcode);
  
  if (apiData.length > 0) {
    console.log(`📤 Uploading ${apiData.length} new records to Elasticsearch...`);
    
    // Upload the new data to Elasticsearch
    await uploadToElasticsearch(apiData);
    
    // Return the newly uploaded data
    return apiData;
  }
  
  console.log(`❌ No HPI data available for postcode: ${postcode}`);
  return [];
}

// Run the upload
if (require.main === module) {
  const csvPath = argv._[0] || DEFAULT_CSV_PATH;
  // For now, just print the mode and postcode
  console.log(`Mode: ${argv.mode}`);
  if (argv.postcode) {
    console.log(`Postcode: ${argv.postcode}`);
  }
  // Continue with upload as default
  if (argv.mode === 'upload') {
    uploadHpi(csvPath)
      .then(() => {
        console.log('✅ HPI upload completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ HPI upload failed:', error);
        process.exit(1);
      });
  } else if (argv.mode === 'search') {
    // Implement search logic
    if (!argv.postcode) {
      console.error('❌ Postcode is required for search mode. Use --postcode=POSTCODE');
      process.exit(1);
    }
    
    const fetchFromApi = argv['fetch-api']; // Use the --fetch-api flag
    searchAndFetchHpiData(argv.postcode, fetchFromApi)
      .then((results) => {
        if (results.length > 0) {
          console.log(`\n📊 Search completed. Found ${results.length} records for ${argv.postcode}`);
        } else {
          console.log(`\n📊 Search completed. No records found for ${argv.postcode}`);
        }
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Search failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { uploadHpi, createSampleCsv }; 