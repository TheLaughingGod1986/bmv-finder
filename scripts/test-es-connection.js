require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });
console.log('ES_NODE:', process.env.ES_NODE);
console.log('ES_API_KEY:', process.env.ES_API_KEY ? 'Set' : 'Not set');
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ES_NODE || process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ES_API_KEY || process.env.ELASTICSEARCH_API_KEY
  },
  // Disable SSL verification for local development
  tls: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Testing Elasticsearch connection...');
    
    // Test basic connection
    const info = await esClient.info();
    console.log('✅ Elasticsearch connection successful!');
    console.log('Version:', info.version.number);
    console.log('Cluster:', info.cluster_name);
    
    // Test if we can create an index
    const testIndex = 'test-connection';
    await esClient.indices.create({ index: testIndex });
    console.log('✅ Index creation successful!');
    
    // Clean up test index
    await esClient.indices.delete({ index: testIndex });
    console.log('✅ Index deletion successful!');
    
    console.log('\n🎉 All tests passed! Elasticsearch is ready for use.');
    
  } catch (error) {
    console.error('❌ Elasticsearch connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Suggestions:');
      console.log('1. Make sure Elasticsearch is running');
      console.log('2. Check if it\'s running on port 9200');
      console.log('3. Try: cd elasticsearch-8.13.0 && ./bin/elasticsearch');
    }
    
    if (error.message.includes('security_exception')) {
      console.log('\n💡 Security is enabled. You may need to:');
      console.log('1. Generate a password: ./bin/elasticsearch-reset-password -u elastic');
      console.log('2. Or disable security for development');
    }
  }
}

testConnection(); 