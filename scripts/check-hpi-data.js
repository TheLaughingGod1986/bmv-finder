require('dotenv').config({ path: '.env.local' });
const { esClient } = require('../src/lib/esClient.cjs.js');

async function checkHpiData() {
  try {
    console.log('🔍 Checking HPI data in Elasticsearch...\n');
    
    // Check if house_price_index exists
    const indexExists = await esClient.indices.exists({ index: 'house_price_index' });
    
    if (!indexExists) {
      console.log('❌ house_price_index does not exist in Elasticsearch');
      return;
    }
    
    // Get document count
    const count = await esClient.count({ index: 'house_price_index' });
    console.log(`✅ house_price_index exists with ${count.count.toLocaleString()} documents`);
    
    // Get sample data
    const sample = await esClient.search({
      index: 'house_price_index',
      size: 5,
      sort: [{ date: { order: 'desc' } }]
    });
    
    console.log('\n📋 Sample HPI records (most recent first):');
    sample.hits.hits.forEach((hit, i) => {
      const doc = hit._source;
      console.log(`${i + 1}. ${doc.regionLabel || doc.region} (${doc.region})`);
      console.log(`   Date: ${doc.date} (${doc.year}-${doc.month})`);
      console.log(`   HPI Index: ${doc.hpiIndex || doc.index || 'N/A'}`);
      console.log(`   Property Type: ${doc.propertyType || 'N/A'}`);
      console.log(`   Buyer Type: ${doc.buyerType || 'N/A'}`);
      console.log(`   Purchase Type: ${doc.purchaseType || 'N/A'}`);
      console.log(`   Build Type: ${doc.buildType || 'N/A'}\n`);
    });
    
    // Get some statistics
    const stats = await esClient.search({
      index: 'house_price_index',
      size: 0,
      aggs: {
        regions: {
          terms: { field: 'region', size: 10 }
        },
        date_range: {
          date_range: {
            field: 'date',
            ranges: [
              { from: '1990-01', to: '2000-01' },
              { from: '2000-01', to: '2010-01' },
              { from: '2010-01', to: '2020-01' },
              { from: '2020-01', to: '2025-12' }
            ]
          }
        }
      }
    });
    
    console.log('📊 HPI Data Statistics:');
    console.log('Top regions by document count:');
    stats.aggregations.regions.buckets.forEach((bucket, i) => {
      console.log(`  ${i + 1}. ${bucket.key}: ${bucket.doc_count} records`);
    });
    
    console.log('\nDate range distribution:');
    stats.aggregations.date_range.buckets.forEach(bucket => {
      console.log(`  ${bucket.from_as_string} to ${bucket.to_as_string}: ${bucket.doc_count} records`);
    });
    
  } catch (error) {
    console.error('❌ Error checking HPI data:', error.message);
  }
}

checkHpiData(); 