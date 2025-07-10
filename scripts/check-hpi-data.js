require('dotenv').config({ path: '.env.local' });
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const csv = require('csv-parser');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function checkHpiData() {
  try {
    console.log('🔍 Checking HPI data in Elasticsearch...\n');

    // Check if hpi index exists
    const indexExists = await esClient.indices.exists({ index: 'hpi' });
    if (!indexExists) {
      console.log('❌ HPI index does not exist in Elasticsearch');
      return;
    }

    // Get index stats
    const stats = await esClient.indices.stats({ index: 'hpi' });
    const docCount = stats.body.indices.hpi.total.docs.count;
    console.log(`📊 Total documents in HPI index: ${docCount.toLocaleString()}`);

    // Get sample of data
    const sample = await esClient.search({
      index: 'hpi',
      size: 5,
      sort: [{ date: { order: 'desc' } }]
    });

    console.log('\n📅 Most recent HPI records:');
    sample.body.hits.hits.forEach((hit, i) => {
      console.log(`${i + 1}. ${hit._source.region} - ${hit._source.date} - Index: ${hit._source.index}`);
    });

    // Get date range
    const dateRange = await esClient.search({
      index: 'hpi',
      size: 0,
      aggs: {
        min_date: { min: { field: 'date' } },
        max_date: { max: { field: 'date' } }
      }
    });

    const minDate = dateRange.body.aggregations.min_date.value_as_string;
    const maxDate = dateRange.body.aggregations.max_date.value_as_string;
    console.log(`\n📅 Date range: ${minDate} to ${maxDate}`);

    // Count by region
    const regionCount = await esClient.search({
      index: 'hpi',
      size: 0,
      aggs: {
        regions: {
          terms: { field: 'region', size: 20 }
        }
      }
    });

    console.log('\n🌍 Regions in Elasticsearch:');
    regionCount.body.aggregations.regions.buckets.forEach(bucket => {
      console.log(`  ${bucket.key}: ${bucket.doc_count} records`);
    });

    // Compare with CSV data
    console.log('\n📋 Comparing with local CSV data...');
    
    const csvData = [];
    fs.createReadStream('data/hpi.csv')
      .pipe(csv())
      .on('data', (row) => csvData.push(row))
      .on('end', () => {
        console.log(`📄 CSV records: ${csvData.length.toLocaleString()}`);
        
        // Get unique regions from CSV
        const csvRegions = [...new Set(csvData.map(row => row.region))];
        console.log(`🌍 CSV regions: ${csvRegions.length}`);
        
        // Get date range from CSV
        const csvDates = csvData.map(row => row.date).sort();
        console.log(`📅 CSV date range: ${csvDates[0]} to ${csvDates[csvDates.length - 1]}`);
        
        // Check for missing data
        const missingInES = csvData.length - docCount;
        if (missingInES > 0) {
          console.log(`\n⚠️  Missing ${missingInES.toLocaleString()} records in Elasticsearch`);
        } else if (missingInES < 0) {
          console.log(`\n⚠️  Extra ${Math.abs(missingInES).toLocaleString()} records in Elasticsearch`);
        } else {
          console.log('\n✅ Record counts match between CSV and Elasticsearch');
        }
      });

  } catch (error) {
    console.error('❌ Error checking HPI data:', error.message);
  }
}

checkHpiData(); 