const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  }
});

async function testSalesComparison() {
  try {
    console.log('Testing Sales Comparison query...');
    
    // Test the exact query from the comprehensive valuation API
    const query = {
      index: 'properties-enhanced',
      body: {
        query: {
          bool: {
            must: [
              { prefix: { postcode: 'SW1A' } }
            ],
            filter: [
              { range: { year: { gte: new Date().getFullYear() - 2 } } }
            ],
            should: [
              { term: { property_type: 'F' }, boost: 2.0 },
              { term: { epc_bedrooms: 3 }, boost: 3.0 },
              {
                range: {
                  epc_size: {
                    gte: 94 * 0.8,
                    lte: 94 * 1.2,
                    boost: 2.0
                  }
                }
              }
            ],
            minimum_should_match: 1
          }
        },
        size: 10,
        sort: [{ year: { order: 'desc' } }, { month: { order: 'desc' } }]
      }
    };
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
    const response = await esClient.search(query);
    console.log(`Found ${response.body.hits.hits.length} comparable properties`);
    
    if (response.body.hits.hits.length > 0) {
      console.log('Sample comparable:', response.body.hits.hits[0]._source);
    }
    
    // Test a simpler query
    console.log('\nTesting simpler query...');
    const simpleQuery = {
      index: 'properties-enhanced',
      body: {
        query: {
          prefix: { postcode: 'SW1A' }
        },
        size: 5
      }
    };
    
    const simpleResponse = await esClient.search(simpleQuery);
    console.log(`Found ${simpleResponse.body.hits.hits.length} properties with SW1A postcode`);
    
    if (simpleResponse.body.hits.hits.length > 0) {
      console.log('Sample property:', simpleResponse.body.hits.hits[0]._source);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
  }
}

testSalesComparison(); 