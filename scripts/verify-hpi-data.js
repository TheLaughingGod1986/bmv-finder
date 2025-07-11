const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  cloud: {
    id: process.env.ES_CLOUD_ID,
  },
  auth: {
    apiKey: process.env.ES_API_KEY,
  },
});

async function verifyHpiData() {
  try {
    console.log('Verifying HPI data in Elasticsearch...\n');

    // Check if index exists
    const indexExists = await client.indices.exists({
      index: 'house_price_index'
    });

    if (!indexExists) {
      console.log('❌ house_price_index does not exist');
      return;
    }

    console.log('✅ house_price_index exists');

    // Get index stats
    const stats = await client.indices.stats({
      index: 'house_price_index'
    });

    const docCount = stats.indices['house_price_index'].total.docs.count;
    console.log(`📊 Total documents: ${docCount}`);

    // Get a few sample records with correct field names
    const sample = await client.search({
      index: 'house_price_index',
      size: 5,
      sort: [{ date: { order: 'desc' } }]
    });

    console.log('\n📋 Sample records (most recent first):');
    sample.hits.hits.forEach((hit, index) => {
      const doc = hit._source;
      console.log(`\n${index + 1}. ${doc.region} (${doc.regionCode})`);
      console.log(`   Date: ${doc.date} (${doc.year}-${doc.month})`);
      console.log(`   Index: ${doc.index}`);
      console.log(`   Month-over-Month: ${doc.monthOverMonth?.toFixed(2)}%`);
      console.log(`   Year-over-Year: ${doc.yearOverYear?.toFixed(2)}%`);
      console.log(`   Region Type: ${doc.regionType}`);
      console.log(`   Source: ${doc.source}`);
    });

    // Get unique regions
    const regions = await client.search({
      index: 'house_price_index',
      size: 0,
      aggs: {
        unique_regions: {
          terms: {
            field: 'region',
            size: 20
          }
        }
      }
    });

    console.log('\n🏘️  Top regions in dataset:');
    regions.aggregations.unique_regions.buckets.forEach(bucket => {
      console.log(`   - ${bucket.key} (${bucket.doc_count} records)`);
    });

    // Get date range info
    const dateStats = await client.search({
      index: 'house_price_index',
      size: 0,
      aggs: {
        min_date: { min: { field: 'date' } },
        max_date: { max: { field: 'date' } },
        total_regions: { cardinality: { field: 'region' } }
      }
    });

    const aggs = dateStats.aggregations;
    console.log('\n📅 Dataset statistics:');
    console.log(`   Date range: ${aggs.min_date.value_as_string} to ${aggs.max_date.value_as_string}`);
    console.log(`   Total unique regions: ${aggs.total_regions.value}`);

    console.log('\n✅ HPI data verification completed successfully');

  } catch (error) {
    console.error('❌ Error verifying HPI data:', error.message);
    if (error.meta) {
      console.error('Details:', error.meta.body);
    }
  } finally {
    await client.close();
  }
}

verifyHpiData(); 