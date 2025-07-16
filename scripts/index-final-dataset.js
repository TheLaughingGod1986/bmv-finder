const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('@elastic/elasticsearch');

// Configuration
const ELASTICSEARCH_URL = 'http://localhost:9201';
const INDEX_NAME = 'enhanced-properties-final';
const CSV_FILE = 'data/enhanced-properties-final.csv';
const BATCH_SIZE = 1000;

console.log('🚀 Starting Final Dataset Indexing to Elasticsearch');
console.log(`📊 Target: Index ${INDEX_NAME} with enhanced property data`);

// Create Elasticsearch client
const client = new Client({
  node: ELASTICSEARCH_URL,
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true
});

// Create index mapping
async function createIndexMapping() {
  console.log('📋 Creating index mapping...');
  
  try {
    // Check if index exists
    const indexExists = await client.indices.exists({
      index: INDEX_NAME
    });
    
    if (indexExists.body) {
      console.log(`🗑️  Deleting existing index: ${INDEX_NAME}`);
      await client.indices.delete({
        index: INDEX_NAME
      });
    }
    
    // Create index with mapping
    await client.indices.create({
      index: INDEX_NAME,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              address_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding']
              }
            }
          }
        },
        mappings: {
          properties: {
            property_uid: {
              type: 'keyword'
            },
            transaction_id: {
              type: 'keyword'
            },
            price: {
              type: 'long'
            },
            date: {
              type: 'date',
              format: 'yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis'
            },
            postcode: {
              type: 'keyword'
            },
            property_type: {
              type: 'keyword'
            },
            county: {
              type: 'keyword'
            },
            paon: {
              type: 'text',
              analyzer: 'address_analyzer',
              fields: {
                keyword: {
                  type: 'keyword'
                }
              }
            },
            street: {
              type: 'text',
              analyzer: 'address_analyzer',
              fields: {
                keyword: {
                  type: 'keyword'
                }
              }
            },
            new_build: {
              type: 'keyword'
            },
            duration: {
              type: 'keyword'
            },
            bedrooms: {
              type: 'integer'
            },
            property_size: {
              type: 'float'
            },
            epc_rating: {
              type: 'keyword'
            },
            potential_rating: {
              type: 'keyword'
            },
            energy_consumption: {
              type: 'float'
            },
            heating_cost: {
              type: 'float'
            },
            construction_year: {
              type: 'keyword'
            },
            built_form: {
              type: 'keyword'
            },
            hpi_value: {
              type: 'float'
            },
            hpi_region: {
              type: 'keyword'
            },
            price_per_sqm: {
              type: 'float'
            },
            match_score: {
              type: 'float'
            },
            match_strategy: {
              type: 'keyword'
            },
            location: {
              type: 'geo_point'
            }
          }
        }
      }
    });
    
    console.log(`✅ Index ${INDEX_NAME} created successfully`);
    
  } catch (error) {
    console.error('❌ Error creating index mapping:', error);
    throw error;
  }
}

// Index data in batches
async function indexData() {
  console.log('📖 Reading CSV data...');
  
  let batch = [];
  let totalIndexed = 0;
  let totalProcessed = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', async (row) => {
        totalProcessed++;
        
        // Clean and transform data
        const document = {
          property_uid: row.property_uid,
          transaction_id: row.transaction_id,
          price: parseInt(row.price) || 0,
          date: row.date,
          postcode: row.postcode,
          property_type: row.property_type,
          county: row.county,
          paon: row.paon,
          street: row.street,
          new_build: row.new_build,
          duration: row.duration,
          bedrooms: row.bedrooms ? parseInt(row.bedrooms) : null,
          property_size: row.property_size ? parseFloat(row.property_size) : null,
          epc_rating: row.epc_rating,
          potential_rating: row.potential_rating,
          energy_consumption: row.energy_consumption ? parseFloat(row.energy_consumption) : null,
          heating_cost: row.heating_cost ? parseFloat(row.heating_cost) : null,
          construction_year: row.construction_year,
          built_form: row.built_form,
          hpi_value: row.hpi_value ? parseFloat(row.hpi_value) : null,
          hpi_region: row.hpi_region,
          price_per_sqm: row.price_per_sqm ? parseFloat(row.price_per_sqm) : null,
          match_score: row.match_score ? parseFloat(row.match_score) : 0,
          match_strategy: row.match_strategy
        };
        
        batch.push({
          index: {
            _index: INDEX_NAME,
            _id: row.property_uid || `${row.transaction_id}-${Date.now()}`
          }
        });
        batch.push(document);
        
        // Process batch
        if (batch.length >= BATCH_SIZE * 2) {
          try {
            await client.bulk({ body: batch });
            totalIndexed += batch.length / 2;
            batch = [];
            
            console.log(`📊 Processed ${totalProcessed.toLocaleString()} records | Indexed ${totalIndexed.toLocaleString()} documents`);
          } catch (error) {
            console.error('❌ Error indexing batch:', error);
            reject(error);
          }
        }
      })
      .on('end', async () => {
        // Index remaining batch
        if (batch.length > 0) {
          try {
            await client.bulk({ body: batch });
            totalIndexed += batch.length / 2;
            console.log(`📊 Final batch indexed | Total indexed: ${totalIndexed.toLocaleString()}`);
          } catch (error) {
            console.error('❌ Error indexing final batch:', error);
            reject(error);
          }
        }
        
        resolve({ totalProcessed, totalIndexed });
      })
      .on('error', reject);
  });
}

// Refresh index and get statistics
async function getIndexStats() {
  console.log('📊 Getting index statistics...');
  
  try {
    // Refresh index
    await client.indices.refresh({ index: INDEX_NAME });
    
    // Get index stats
    const stats = await client.indices.stats({ index: INDEX_NAME });
    const count = await client.count({ index: INDEX_NAME });
    
    console.log(`✅ Index ${INDEX_NAME} statistics:`);
    console.log(`📊 Total documents: ${count.body.count.toLocaleString()}`);
    console.log(`📊 Index size: ${(stats.body.indices[INDEX_NAME].total.store.size_in_bytes / 1024 / 1024).toFixed(2)} MB`);
    
    return { count: count.body.count, stats: stats.body.indices[INDEX_NAME] };
    
  } catch (error) {
    console.error('❌ Error getting index stats:', error);
    throw error;
  }
}

// Main indexing function
async function indexFinalDataset() {
  try {
    console.log('🚀 Starting final dataset indexing...');
    
    // Create index mapping
    await createIndexMapping();
    
    // Index data
    const { totalProcessed, totalIndexed } = await indexData();
    
    // Get statistics
    await getIndexStats();
    
    console.log('\n🎉 Final dataset indexing completed!');
    console.log(`📊 Total records processed: ${totalProcessed.toLocaleString()}`);
    console.log(`📊 Total documents indexed: ${totalIndexed.toLocaleString()}`);
    console.log(`📊 Index name: ${INDEX_NAME}`);
    console.log(`🌐 Elasticsearch URL: ${ELASTICSEARCH_URL}`);
    
  } catch (error) {
    console.error('❌ Error during indexing:', error);
    throw error;
  }
}

// Run the indexing
if (require.main === module) {
  indexFinalDataset()
    .then(() => {
      console.log('\n✅ Indexing completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Indexing failed:', error);
      process.exit(1);
    });
}

module.exports = { indexFinalDataset }; 