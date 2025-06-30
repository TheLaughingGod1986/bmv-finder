const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
require('dotenv').config();

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

async function run() {
  try {
    // Create index if it doesn't exist
    const exists = await esClient.indices.exists({ index: 'properties' });
    if (!exists) {
      await esClient.indices.create({ index: 'properties' });
      console.log('Created index properties');
    }
    // Insert a single document
    const doc = {
      id: 'test-1',
      price: 123456,
      dateOfTransfer: '2020-01-01',
      postcode: 'AB1 2CD',
      propertyType: 'D',
      propertyTypeLabel: 'Detached',
      street: 'Test Street',
      town_city: 'Test Town',
      county: 'Test County',
      paon: '1',
      saon: '',
      duration: 'F',
      durationLabel: 'Freehold',
      old_new: 'N',
      newBuildLabel: 'Existing',
      locality: 'Test Locality',
      ppd_category_type: 'A',
      record_status: 'A',
      fullAddress: '1 Test Street Test Town',
      year: 2020,
      month: 1,
      priceRange: '£100k - £200k'
    };
    const result = await esClient.index({
      index: 'properties',
      id: doc.id,
      document: doc
    });
    console.log('Insert result:', result);
  } catch (err) {
    console.error('Error inserting document:', err);
  }
}

run(); 