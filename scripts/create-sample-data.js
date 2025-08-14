const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000,
  maxRetries: 3,
  retryOnTimeout: true,
});

const INDEX_NAME = 'properties';

// Sample property data
const sampleProperties = [
  {
    id: '1',
    postcode: 'SW1A1AA',
    address: '1 Buckingham Palace Road',
    house_number: '1',
    street: 'Buckingham Palace Road',
    town: 'London',
    county: 'Greater London',
    property_type: 'Terraced',
    tenure: 'Freehold',
    price: 2500000,
    date_of_transfer: '2023-01-15',
    new_build: 'N',
    estate_type: 'Residential',
    transaction_category: 'A',
    primary_addressable_object_name: '1',
    secondary_addressable_object_name: '',
    street_description: 'Buckingham Palace Road',
    locality: 'Westminster',
    town_city: 'London',
    district: 'Westminster',
    county: 'Greater London',
    transaction_id: '123456789',
    entry_date: '2023-01-15',
    status: 'A'
  },
  {
    id: '2',
    postcode: 'SW1A1AA',
    address: '2 Buckingham Palace Road',
    house_number: '2',
    street: 'Buckingham Palace Road',
    town: 'London',
    county: 'Greater London',
    property_type: 'Terraced',
    tenure: 'Freehold',
    price: 2200000,
    date_of_transfer: '2023-02-20',
    new_build: 'N',
    estate_type: 'Residential',
    transaction_category: 'A',
    primary_addressable_object_name: '2',
    secondary_addressable_object_name: '',
    street_description: 'Buckingham Palace Road',
    locality: 'Westminster',
    town_city: 'London',
    district: 'Westminster',
    county: 'Greater London',
    transaction_id: '123456790',
    entry_date: '2023-02-20',
    status: 'A'
  },
  {
    id: '3',
    postcode: 'SW1A1AA',
    address: '3 Buckingham Palace Road',
    house_number: '3',
    street: 'Buckingham Palace Road',
    town: 'London',
    county: 'Greater London',
    property_type: 'Terraced',
    tenure: 'Leasehold',
    price: 1800000,
    date_of_transfer: '2023-03-10',
    new_build: 'N',
    estate_type: 'Residential',
    transaction_category: 'A',
    primary_addressable_object_name: '3',
    secondary_addressable_object_name: '',
    street_description: 'Buckingham Palace Road',
    locality: 'Westminster',
    town_city: 'London',
    district: 'Westminster',
    county: 'Greater London',
    transaction_id: '123456791',
    entry_date: '2023-03-10',
    status: 'A'
  }
];

async function createIndex() {
  try {
    // Check if index exists
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    
    if (indexExists) {
      console.log(`Index '${INDEX_NAME}' already exists. Skipping creation.`);
      return;
    }

    console.log(`Creating index '${INDEX_NAME}'...`);
    
    await esClient.indices.create({
      index: INDEX_NAME,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              postcode_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'trim']
              }
            }
          }
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            postcode: { type: 'keyword' },
            address: { type: 'text' },
            house_number: { type: 'keyword' },
            street: { type: 'text' },
            town: { type: 'text' },
            county: { type: 'text' },
            property_type: { type: 'keyword' },
            tenure: { type: 'keyword' },
            price: { type: 'long' },
            date_of_transfer: { type: 'date' },
            new_build: { type: 'keyword' },
            estate_type: { type: 'keyword' },
            transaction_category: { type: 'keyword' },
            primary_addressable_object_name: { type: 'keyword' },
            secondary_addressable_object_name: { type: 'keyword' },
            street_description: { type: 'text' },
            locality: { type: 'text' },
            town_city: { type: 'text' },
            district: { type: 'text' },
            transaction_id: { type: 'keyword' },
            entry_date: { type: 'date' },
            status: { type: 'keyword' }
          }
        }
      }
    });

    console.log(`Index '${INDEX_NAME}' created successfully!`);
  } catch (error) {
    console.error('Error creating index:', error);
    throw error;
  }
}

async function addSampleData() {
  try {
    console.log('Adding sample property data...');
    
    const operations = sampleProperties.flatMap(property => [
      { index: { _index: INDEX_NAME, _id: property.id } },
      property
    ]);

    const result = await esClient.bulk({ body: operations });
    
    if (result.errors) {
      console.error('Some errors occurred during bulk indexing:', result.items.filter(item => item.index?.error));
    } else {
      console.log('All sample data added successfully!');
    }

    // Refresh the index
    await esClient.indices.refresh({ index: INDEX_NAME });
    console.log('Index refreshed and ready for search!');
    
    return result;
  } catch (error) {
    console.error('Error adding sample data:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting sample data creation...');
    
    await createIndex();
    await addSampleData();
    
    console.log('✅ Sample data creation completed successfully!');
    console.log(`📊 Added ${sampleProperties.length} sample properties to index '${INDEX_NAME}'`);
    
    // Test search
    const searchResult = await esClient.search({
      index: INDEX_NAME,
      body: {
        query: {
          match: { postcode: 'SW1A1AA' }
        }
      }
    });
    
    console.log(`🔍 Search test: Found ${searchResult.hits.total.value} properties in SW1A1AA`);
    
  } catch (error) {
    console.error('❌ Error in main function:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createIndex, addSampleData };
