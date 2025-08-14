const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000,
  maxRetries: 3,
  retryOnTimeout: true
});

// Watchlist index configuration
const WATCHLIST_INDEX = {
  name: 'watchlist',
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    properties: {
      id: { type: 'keyword' },
      user_id: { type: 'keyword' },
      property_id: { type: 'keyword' },
      postcode: { type: 'keyword' },
      address: { type: 'text' },
      house_number: { type: 'keyword' },
      street: { type: 'text' },
      town: { type: 'keyword' },
      county: { type: 'keyword' },
      property_type: { type: 'keyword' },
      price: { type: 'float' },
      date_added: { type: 'date' },
      notes: { type: 'text' },
      status: { type: 'keyword' }, // 'watching', 'interested', 'purchased'
      source: { type: 'keyword' }, // 'chrome_extension', 'manual', 'api'
      last_updated: { type: 'date' }
    }
  }
};

// Sample watchlist data for testing
const sampleWatchlistData = [
  {
    id: 'watch_1',
    user_id: 'user_123',
    property_id: 'prop_1',
    postcode: 'SW1A1AA',
    address: '1 Buckingham Palace Road',
    house_number: '1',
    street: 'Buckingham Palace Road',
    town: 'London',
    county: 'Greater London',
    property_type: 'Terraced',
    price: 2500000,
    date_added: '2024-01-15T10:00:00Z',
    notes: 'Prime location, potential investment',
    status: 'watching',
    source: 'chrome_extension',
    last_updated: '2024-01-15T10:00:00Z'
  },
  {
    id: 'watch_2',
    user_id: 'user_123',
    property_id: 'prop_2',
    postcode: 'SW1A1AA',
    address: '2 Buckingham Palace Road',
    house_number: '2',
    street: 'Buckingham Palace Road',
    town: 'London',
    county: 'Greater London',
    property_type: 'Terraced',
    price: 2200000,
    date_added: '2024-01-16T14:30:00Z',
    notes: 'Good value, needs renovation',
    status: 'interested',
    source: 'chrome_extension',
    last_updated: '2024-01-16T14:30:00Z'
  },
  {
    id: 'watch_3',
    user_id: 'user_123',
    property_id: 'prop_3',
    postcode: 'SW1A1AA',
    address: '3 Buckingham Palace Road',
    house_number: '3',
    street: 'Buckingham Palace Road',
    town: 'London',
    county: 'Greater London',
    property_type: 'Terraced',
    price: 1800000,
    date_added: '2024-01-17T09:15:00Z',
    notes: 'Leasehold, check remaining term',
    status: 'watching',
    source: 'chrome_extension',
    last_updated: '2024-01-17T09:15:00Z'
  }
];

async function createWatchlistIndex() {
  try {
    console.log('Creating watchlist index...');
    
    // Check if index exists
    const indexExists = await esClient.indices.exists({ index: WATCHLIST_INDEX.name });
    
    if (indexExists) {
      console.log(`Index '${WATCHLIST_INDEX.name}' already exists. Skipping creation.`);
    } else {
      await esClient.indices.create({
        index: WATCHLIST_INDEX.name,
        body: {
          settings: WATCHLIST_INDEX.settings,
          mappings: WATCHLIST_INDEX.mappings
        }
      });
      console.log(`Index '${WATCHLIST_INDEX.name}' created successfully!`);
    }
    
    // Add sample data
    console.log('Adding sample watchlist data...');
    const bulkBody = sampleWatchlistData.flatMap(doc => [
      { index: { _index: WATCHLIST_INDEX.name } },
      doc
    ]);
    
    const response = await esClient.bulk({ body: bulkBody });
    
    if (response.errors) {
      const errors = response.items.filter(item => item.index.error);
      console.error(`Bulk indexing errors:`, errors.length);
    } else {
      console.log(`✅ Sample watchlist data added: ${sampleWatchlistData.length} records`);
    }
    
    // Refresh index
    await esClient.indices.refresh({ index: WATCHLIST_INDEX.name });
    console.log('✅ Watchlist index refreshed and ready!');
    
  } catch (error) {
    console.error('Error creating watchlist index:', error);
    throw error;
  }
}

// Run the setup
createWatchlistIndex().catch(console.error);
