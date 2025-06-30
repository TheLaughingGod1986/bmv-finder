const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');

const esClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'TIRv--dMe*rHmuRMm-b4'
  },
  tls: {
    ca: fs.readFileSync('elasticsearch-8.13.0/config/certs/http_ca.crt'),
    rejectUnauthorized: true
  }
});

async function testSearch() {
  try {
    console.log('Testing Elasticsearch search functionality...');
    
    // Test 1: Get total count
    const countResult = await esClient.count({
      index: 'properties'
    });
    console.log(`Total properties indexed: ${countResult.count}`);
    
    // Test 2: Search for a specific postcode
    const searchResult = await esClient.search({
      index: 'properties',
      size: 5,
      query: {
        match_phrase_prefix: {
          postcode: 'SW1A'
        }
      },
      sort: [
        { dateOfTransfer: { order: 'desc' } }
      ]
    });
    
    console.log(`\nSearch results for 'SW1A':`);
    console.log(`Found ${searchResult.hits.hits.length} properties`);
    
    if (searchResult.hits.hits.length > 0) {
      console.log('\nFirst result:');
      console.log(JSON.stringify(searchResult.hits.hits[0]._source, null, 2));
    }
    
    // Test 3: Get a sample of properties
    const sampleResult = await esClient.search({
      index: 'properties',
      size: 3,
      query: {
        match_all: {}
      },
      sort: [
        { dateOfTransfer: { order: 'desc' } }
      ]
    });
    
    console.log(`\nSample properties:`);
    sampleResult.hits.hits.forEach((hit, index) => {
      const source = hit._source;
      console.log(`${index + 1}. ${source.street}, ${source.town_city} - £${source.price.toLocaleString()} (${source.dateOfTransfer})`);
    });
    
  } catch (error) {
    console.error('Search test failed:', error.message);
  }
}

testSearch(); 