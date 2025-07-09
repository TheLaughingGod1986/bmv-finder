const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

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

// Run the upload
if (require.main === module) {
  const csvPath = process.argv[2] || DEFAULT_CSV_PATH;
  
  uploadHpi(csvPath)
    .then(() => {
      console.log('✅ HPI upload completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ HPI upload failed:', error);
      process.exit(1);
    });
}

module.exports = { uploadHpi, createSampleCsv }; 