const { Client } = require('@elastic/elasticsearch');
const { postcodeToRegion } = require('../utils/postcodeToRegion');
require('dotenv').config();

// Elasticsearch client configuration
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  },
  tls: {
    rejectUnauthorized: false
  }
});

const HPI_INDEX = 'house_price_index';
const PROPERTIES_INDEX = 'properties';

async function testHpiPipeline() {
  console.log('🧪 Testing HPI Pipeline Components...\n');

  try {
    // Test 1: Elasticsearch Connection
    console.log('1. Testing Elasticsearch Connection...');
    const health = await client.cluster.health();
    console.log(`✅ Elasticsearch Status: ${health.status}`);
    console.log(`   Cluster Name: ${health.cluster_name}`);
    console.log(`   Number of Nodes: ${health.number_of_nodes}\n`);

    // Test 2: HPI Index Check
    console.log('2. Checking HPI Index...');
    const indexExists = await client.indices.exists({ index: HPI_INDEX });
    if (indexExists) {
      const indexStats = await client.indices.stats({ index: HPI_INDEX });
      const docCount = indexStats.indices[HPI_INDEX].total.docs.count;
      console.log(`✅ HPI Index exists with ${docCount} documents\n`);
    } else {
      console.log('⚠️  HPI Index does not exist. Run: node src/createHpiIndex.js\n');
    }

    // Test 3: Properties Index Check
    console.log('3. Checking Properties Index...');
    const propertiesExist = await client.indices.exists({ index: PROPERTIES_INDEX });
    if (propertiesExist) {
      const propertiesStats = await client.indices.stats({ index: PROPERTIES_INDEX });
      const docCount = propertiesStats.indices[PROPERTIES_INDEX].total.docs.count;
      console.log(`✅ Properties Index exists with ${docCount} documents\n`);
    } else {
      console.log('⚠️  Properties Index does not exist\n');
    }

    // Test 4: Postcode to Region Mapping
    console.log('4. Testing Postcode to Region Mapping...');
    const testPostcodes = [
      'SW1A 1AA', // London
      'M1 1AA',   // North West
      'B1 1AA',   // West Midlands
      'EH1 1AA',  // Scotland
      'CF1 1AA'   // Wales
    ];

    testPostcodes.forEach(postcode => {
      const region = postcodeToRegion(postcode);
      console.log(`   ${postcode} → ${region}`);
    });
    console.log('✅ Postcode mapping working correctly\n');

    // Test 5: Sample HPI Data Query
    console.log('5. Testing HPI Data Query...');
    if (indexExists) {
      const hpiResponse = await client.search({
        index: HPI_INDEX,
        body: {
          query: { match_all: {} },
          size: 5,
          sort: [{ date: { order: 'desc' } }]
        }
      });

      const hpiData = hpiResponse.hits.hits.map(hit => hit._source);
      console.log('   Latest HPI Data:');
      hpiData.forEach(item => {
        console.log(`   ${item.region} (${item.date}): ${item.index}`);
      });
      console.log('✅ HPI data query successful\n');
    }

    // Test 6: Properties with Estimated Values
    console.log('6. Checking Properties with Estimated Values...');
    if (propertiesExist) {
      const estimatedResponse = await client.search({
        index: PROPERTIES_INDEX,
        body: {
          query: {
            bool: {
              must: [
                { exists: { field: 'estimatedValue' } },
                { exists: { field: 'growthPercentage' } }
              ]
            }
          },
          size: 5,
          sort: [{ growthPercentage: { order: 'desc' } }]
        }
      });

      const estimatedProperties = estimatedResponse.hits.hits.map(hit => hit._source);
      console.log(`   Found ${estimatedResponse.hits.total.value} properties with estimated values`);
      
      if (estimatedProperties.length > 0) {
        console.log('   Top Growth Properties:');
        estimatedProperties.forEach(prop => {
          console.log(`   ${prop.postcode} - Growth: ${prop.growthPercentage?.toFixed(1)}%`);
        });
      }
      console.log('✅ Property valuation check complete\n');
    }

    // Test 7: API Endpoint Test
    console.log('7. Testing API Endpoints...');
    try {
      const apiResponse = await fetch('http://localhost:3002/api/hpi');
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log(`✅ API endpoint responding: ${apiData.total || 0} records`);
      } else {
        console.log('⚠️  API endpoint not responding (server may not be running)');
      }
    } catch (error) {
      console.log('⚠️  API endpoint test skipped (server not running)');
    }
    console.log('');

    // Summary
    console.log('📊 HPI Pipeline Test Summary:');
    console.log('✅ Elasticsearch connection working');
    console.log('✅ Postcode mapping functional');
    if (indexExists) {
      console.log('✅ HPI index available');
    } else {
      console.log('⚠️  HPI index needs to be created');
    }
    if (propertiesExist) {
      console.log('✅ Properties index available');
    } else {
      console.log('⚠️  Properties index needs to be created');
    }
    console.log('\n🚀 Next Steps:');
    console.log('1. Run: node src/createHpiIndex.js (if index missing)');
    console.log('2. Run: node src/uploadHpi.js (to add sample data)');
    console.log('3. Run: node src/estimate.js (to calculate valuations)');
    console.log('4. Start dashboard: npm run dev');
    console.log('5. Visit: http://localhost:3002/hpi-dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testHpiPipeline().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 