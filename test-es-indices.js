const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  }
});

async function testIndices() {
  try {
    console.log('Testing Elasticsearch connection...');
    
    // Check if cluster is healthy
    const health = await esClient.cluster.health();
    console.log('Cluster health:', health.body.status);
    
    // List all indices
    const indices = await esClient.cat.indices({ format: 'json' });
    console.log('\nAvailable indices:');
    indices.body.forEach(index => {
      console.log(`- ${index.index}: ${index['docs.count']} documents`);
    });
    
    // Test search in properties-enhanced index
    if (indices.body.some(idx => idx.index === 'properties-enhanced')) {
      console.log('\nTesting search in properties-enhanced...');
      const searchResult = await esClient.search({
        index: 'properties-enhanced',
        body: {
          query: {
            prefix: { postcode: 'SW1A' }
          },
          size: 5
        }
      });
      console.log(`Found ${searchResult.body.hits.hits.length} properties with SW1A postcode`);
      
      if (searchResult.body.hits.hits.length > 0) {
        console.log('Sample property:', searchResult.body.hits.hits[0]._source);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testIndices(); 