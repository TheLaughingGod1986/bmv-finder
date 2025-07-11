const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  cloud: {
    id: process.env.ES_CLOUD_ID,
  },
  auth: {
    username: process.env.ES_USERNAME,
    password: process.env.ES_PASSWORD
  },
  caFingerprint: process.env.ES_CA_FINGERPRINT,
});

async function checkElasticsearch() {
  try {
    console.log('Checking Elasticsearch connection...');
    
    // Test connection
    const info = await client.info();
    console.log('✅ Connected to Elasticsearch:', info.version.number);
    
    // List indices
    const indices = await client.cat.indices({ format: 'json' });
    console.log('\n📋 Available indices:');
    indices.forEach(index => {
      console.log(`  - ${index.index}: ${index['docs.count']} documents`);
    });
    
    // Check specific index if it exists
    const targetIndex = process.env.ES_INDEX || 'land_registry_sales';
    try {
      const count = await client.count({ index: targetIndex });
      console.log(`\n📊 ${targetIndex} index: ${count.count} documents`);
    } catch (error) {
      console.log(`\n❌ ${targetIndex} index does not exist yet`);
    }
    
  } catch (error) {
    console.error('❌ Error connecting to Elasticsearch:', error.message);
  }
}

checkElasticsearch(); 