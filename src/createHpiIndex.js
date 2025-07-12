const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Elasticsearch client configuration
const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  },
  tls: {
    rejectUnauthorized: false
  }
});

const INDEX_NAME = 'house_price_index';

async function createHpiIndex() {
  try {
    // Check if index already exists
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    
    if (indexExists) {
      console.log(`Index '${INDEX_NAME}' already exists. Skipping creation.`);
      return;
    }

    console.log(`Creating HPI index '${INDEX_NAME}'...`);
    
    await client.indices.create({
      index: INDEX_NAME,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              region_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'trim']
              }
            }
          }
        },
        mappings: {
          properties: {
            region: { 
              type: 'keyword',
              fields: {
                text: {
                  type: 'text',
                  analyzer: 'region_analyzer'
                }
              }
            },
            date: { 
              type: 'date',
              format: 'yyyy-MM'
            },
            index: { type: 'float' },
            year: { type: 'integer' },
            month: { type: 'integer' },
            regionCode: { type: 'keyword' },
            regionType: { type: 'keyword' },
            // Additional fields for enhanced analytics
            yearOverYear: { type: 'float' },
            monthOverMonth: { type: 'float' },
            source: { type: 'keyword' },
            lastUpdated: { 
              type: 'date',
              format: 'strict_date_optional_time||epoch_millis'
            }
          }
        }
      }
    });

    console.log(`✅ HPI index '${INDEX_NAME}' created successfully!`);
    
    // Create index alias for easier management
    await client.indices.putAlias({
      index: INDEX_NAME,
      name: 'hpi'
    });
    
    console.log('✅ Index alias "hpi" created');
    
  } catch (error) {
    console.error('❌ Error creating HPI index:', error);
    throw error;
  }
}

// Run the index creation
if (require.main === module) {
  createHpiIndex()
    .then(() => {
      console.log('🎉 HPI index setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 HPI index setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createHpiIndex, INDEX_NAME }; 