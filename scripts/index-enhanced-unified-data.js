const fs = require('fs');
const { Client } = require('@elastic/elasticsearch');
const csv = require('csv-parser');

// Elasticsearch client configuration
const client = new Client({
  node: 'http://localhost:9201',
  auth: {
    username: 'elastic',
    password: 'changeme'
  }
});

const INDEX_NAME = 'enhanced_properties';
const CSV_FILE = 'data/enhanced-properties-ml.csv';

async function createIndex() {
  try {
    // Check if index exists
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    
    if (indexExists) {
      console.log(`Index ${INDEX_NAME} already exists. Deleting...`);
      await client.indices.delete({ index: INDEX_NAME });
    }

    // Create index with mapping
    const mapping = {
      mappings: {
        properties: {
          property_uid: { type: 'keyword' },
          price: { type: 'long' },
          date: { type: 'date' },
          postcode: { type: 'keyword' },
          property_type: { type: 'keyword' },
          bedrooms: { type: 'integer' },
          property_size: { type: 'float' },
          price_per_sqm: { type: 'float' },
          age: { type: 'integer' },
          quarter: { type: 'integer' },
          year: { type: 'integer' },
          epc_rating: { type: 'keyword' },
          energy_consumption: { type: 'float' },
          heating_cost: { type: 'float' },
          energy_score: { type: 'integer' },
          hpi_value: { type: 'float' },
          hpi_region: { type: 'keyword' },
          new_build: { type: 'keyword' },
          duration: { type: 'keyword' }
        }
      },
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0
      }
    };

    await client.indices.create({
      index: INDEX_NAME,
      body: mapping
    });

    console.log(`✅ Index ${INDEX_NAME} created successfully`);
  } catch (error) {
    console.error('❌ Error creating index:', error.message);
    throw error;
  }
}

async function indexData() {
  try {
    console.log(`📊 Starting to index data from ${CSV_FILE}...`);
    
    const results = [];
    let processedCount = 0;
    let indexedCount = 0;

    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
          processedCount++;
          
          if (processedCount % 100 === 0) {
            console.log(`📈 Processed ${processedCount} records...`);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📋 Total records to index: ${results.length}`);

    // Process in batches
    const BATCH_SIZE = 100;
    let lastIndexed = 0;
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);
      
      const operations = batch.flatMap(doc => [
        { index: { _index: INDEX_NAME } },
        {
          property_uid: doc.property_uid,
          price: parseInt(doc.price) || 0,
          date: doc.date || null,
          postcode: doc.postcode,
          property_type: doc.property_type,
          bedrooms: parseInt(doc.bedrooms) || null,
          property_size: parseFloat(doc.property_size) || null,
          price_per_sqm: parseFloat(doc.price_per_sqm) || null,
          age: parseInt(doc.age) || null,
          quarter: parseInt(doc.quarter) || null,
          year: parseInt(doc.year) || null,
          epc_rating: doc.epc_rating || null,
          energy_consumption: parseFloat(doc.energy_consumption) || null,
          heating_cost: parseFloat(doc.heating_cost) || null,
          energy_score: parseInt(doc.energy_score) || null,
          hpi_value: parseFloat(doc.hpi_value) || null,
          hpi_region: doc.hpi_region || null,
          new_build: doc.new_build || null,
          duration: doc.duration || null
        }
      ]);

      let success = 0;
      let failed = 0;
      let retries = 0;
      let maxRetries = 3;
      while (retries < maxRetries) {
        try {
          const response = await client.bulk({ body: operations });
          if (response.errors) {
            failed = response.items.filter(item => item.index && item.index.status !== 200).length;
            success = response.items.filter(item => item.index && item.index.status === 200).length;
            console.warn(`⚠️  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${failed} failed, retrying...`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            success = batch.length;
            break;
          }
        } catch (error) {
          console.error(`❌ Error indexing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      indexedCount += success;
      lastIndexed = i + success;
      console.log(`✅ Indexed batch ${Math.floor(i / BATCH_SIZE) + 1}: ${success}/${batch.length} records (Total: ${indexedCount})`);
      // ETA calculation
      const percent = ((i + BATCH_SIZE) / results.length) * 100;
      const eta = ((results.length - (i + BATCH_SIZE)) / BATCH_SIZE) * 10; // ~10s per batch
      console.log(`Progress: ${percent.toFixed(1)}% | ETA: ~${Math.max(0, eta).toFixed(0)}s`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🎉 Indexing complete! Total indexed: ${indexedCount}/${results.length} records`);
    
    // Refresh index
    await client.indices.refresh({ index: INDEX_NAME });
    console.log('🔄 Index refreshed');
    
    // Get index stats
    const stats = await client.indices.stats({ index: INDEX_NAME });
    const docCount = stats.indices[INDEX_NAME].total.docs.count;
    console.log(`📊 Final document count: ${docCount}`);
    
  } catch (error) {
    console.error('❌ Error during indexing:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting enhanced unified data indexing...');
    
    await createIndex();
    await indexData();
    
    console.log('✅ Enhanced unified data indexing completed successfully!');
    
  } catch (error) {
    console.error('❌ Indexing failed:', error.message);
    process.exit(1);
  }
}

main(); 