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

async function testSingleInsert() {
  try {
    console.log('Testing single document insert...');
    
    const testDoc = {
      id: 'test-single-1',
      price: 250000,
      dateOfTransfer: '2020-01-15',
      postcode: 'SW1A 1AA',
      propertyType: 'D',
      propertyTypeLabel: 'Detached',
      street: 'Test Street',
      town_city: 'London',
      county: 'Greater London',
      duration: 'F',
      durationLabel: 'Freehold',
      paon: '1',
      saon: '',
      building: 'Test Building',
      locality: 'Test Locality',
      transactionCategory: 'A',
      transactionCategoryLabel: 'Standard Price Paid'
    };
    
    const result = await esClient.index({
      index: 'properties',
      id: testDoc.id,
      body: testDoc
    });
    
    console.log('Insert result:', result);
    
    // Wait a moment for the document to be indexed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if the document was indexed
    const countResult = await esClient.count({
      index: 'properties'
    });
    
    console.log(`Total documents in index: ${countResult.count}`);
    
    // Try to get the document
    const getResult = await esClient.get({
      index: 'properties',
      id: testDoc.id
    });
    
    console.log('Retrieved document:', getResult._source);
    
  } catch (error) {
    console.error('Single insert test failed:', error.message);
    console.error('Full error:', error);
  }
}

testSingleInsert(); 