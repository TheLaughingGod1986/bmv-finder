const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  },
  tls: { rejectUnauthorized: false }
});

async function updateIndexMapping() {
  try {
    console.log('Updating Elasticsearch index mapping...');
    
    // First, check if the index exists
    const indexExists = await esClient.indices.exists({ index: 'properties' });
    
    if (!indexExists) {
      console.log('Index "properties" does not exist. Creating it with proper mapping...');
      
      await esClient.indices.create({
        index: 'properties',
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
              price: { type: 'long' },
              dateOfTransfer: { type: 'date' },
              postcode: { 
                type: 'text',
                analyzer: 'postcode_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              propertyType: { type: 'keyword' },
              propertyTypeLabel: { type: 'text' },
              old_new: { type: 'keyword' },
              newBuildLabel: { type: 'text' },
              street: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              town_city: { type: 'text' },
              district: { type: 'text' },
              county: { type: 'keyword' },
              paon: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              saon: { type: 'text' },
              duration: { type: 'keyword' },
              durationLabel: { type: 'text' },
              locality: { type: 'text' },
              transactionCategory: { type: 'keyword' },
              transactionCategoryLabel: { type: 'text' },
              recordStatus: { type: 'keyword' },
              fullAddress: { type: 'text' },
              year: { type: 'integer' },
              month: { type: 'integer' },
              priceRange: { type: 'keyword' }
            }
          }
        }
      });
      
      console.log('✅ Index created with proper mapping!');
      return;
    }
    
    console.log('Index exists. Updating mapping to add .keyword fields...');
    
    // Update the mapping to add .keyword fields for paon and street
    await esClient.indices.putMapping({
      index: 'properties',
      body: {
        properties: {
          paon: { 
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          street: { 
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          }
        }
      }
    });
    
    console.log('✅ Mapping updated successfully!');
    
    // Refresh the index to apply changes
    await esClient.indices.refresh({ index: 'properties' });
    console.log('✅ Index refreshed!');
    
  } catch (error) {
    console.error('❌ Error updating index mapping:', error);
    
    if (error.meta?.body?.error?.type === 'illegal_argument_exception') {
      console.log('This error might be expected if the fields already exist. Trying alternative approach...');
      
      // Try to create a new index with a different name
      const newIndexName = 'properties_v2';
      console.log(`Creating new index: ${newIndexName}`);
      
      await esClient.indices.create({
        index: newIndexName,
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
              price: { type: 'long' },
              dateOfTransfer: { type: 'date' },
              postcode: { 
                type: 'text',
                analyzer: 'postcode_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              propertyType: { type: 'keyword' },
              propertyTypeLabel: { type: 'text' },
              old_new: { type: 'keyword' },
              newBuildLabel: { type: 'text' },
              street: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              town_city: { type: 'text' },
              district: { type: 'text' },
              county: { type: 'keyword' },
              paon: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              saon: { type: 'text' },
              duration: { type: 'keyword' },
              durationLabel: { type: 'text' },
              locality: { type: 'text' },
              transactionCategory: { type: 'keyword' },
              transactionCategoryLabel: { type: 'text' },
              recordStatus: { type: 'keyword' },
              fullAddress: { type: 'text' },
              year: { type: 'integer' },
              month: { type: 'integer' },
              priceRange: { type: 'keyword' }
            }
          }
        }
      });
      
      console.log(`✅ New index ${newIndexName} created with proper mapping!`);
      console.log('You may need to reindex your data to the new index.');
    }
  }
}

updateIndexMapping().catch(console.error); 