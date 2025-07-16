const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: 'http://localhost:9201',
  auth: {
    username: 'elastic',
    password: 'changeme'
  }
});

const INDEX_NAME = 'unified-properties';
const BATCH_SIZE = 1000;

console.log('🚀 Indexing unified dataset into Elasticsearch...');

async function createIndex() {
  console.log('📋 Creating Elasticsearch index...');
  
  try {
    // Check if index exists
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    
    if (indexExists) {
      console.log(`🗑️ Deleting existing index: ${INDEX_NAME}`);
      await client.indices.delete({ index: INDEX_NAME });
    }
    
    // Create new index with mapping
    await client.indices.create({
      index: INDEX_NAME,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0
        },
        mappings: {
          properties: {
            property_uid: { type: 'keyword' },
            transaction_id: { type: 'keyword' },
            price: { type: 'long' },
            date: { type: 'date' },
            postcode: { type: 'keyword' },
            property_type: { type: 'keyword' },
            county: { type: 'keyword' },
            paon: { type: 'keyword' },
            street: { type: 'text' },
            locality: { type: 'text' },
            town_city: { type: 'text' },
            district: { type: 'text' },
            new_build: { type: 'keyword' },
            duration: { type: 'keyword' },
            transaction_category: { type: 'keyword' },
            record_status: { type: 'keyword' },
            
            // EPC Data
            bedrooms: { type: 'integer' },
            property_size: { type: 'float' },
            epc_rating: { type: 'keyword' },
            energy_consumption: { type: 'float' },
            heating_cost: { type: 'float' },
            lighting_cost: { type: 'float' },
            hot_water_cost: { type: 'float' },
            co2_emissions: { type: 'float' },
            construction_age_band: { type: 'keyword' },
            built_form: { type: 'keyword' },
            number_heated_rooms: { type: 'integer' },
            unheated_corridor_length: { type: 'float' },
            floor_level: { type: 'integer' },
            flat_storey_count: { type: 'integer' },
            
            // HPI Data
            hpi_value: { type: 'float' },
            hpi_region: { type: 'keyword' },
            
            // Computed fields
            has_epc_data: { type: 'boolean' },
            has_hpi_data: { type: 'boolean' },
            price_per_sqm: { type: 'float' },
            energy_efficiency_score: { type: 'integer' }
          }
        }
      }
    });
    
    console.log(`✅ Index created: ${INDEX_NAME}`);
    
  } catch (error) {
    console.error('❌ Error creating index:', error.message);
    throw error;
  }
}

function transformProperty(row) {
  const price = parseInt(row.price) || 0;
  const propertySize = parseFloat(row.property_size) || 0;
  const energyConsumption = parseFloat(row.energy_consumption) || 0;
  const hpiValue = parseFloat(row.hpi_value) || 0;
  
  // Calculate computed fields
  const hasEpcData = !!(row.bedrooms && row.bedrooms !== '');
  const hasHpiData = !!(hpiValue > 0);
  const pricePerSqm = propertySize > 0 ? price / propertySize : 0;
  
  // Energy efficiency score (lower is better)
  let energyEfficiencyScore = null;
  if (energyConsumption > 0) {
    if (energyConsumption <= 50) energyEfficiencyScore = 1; // A
    else if (energyConsumption <= 69) energyEfficiencyScore = 2; // B
    else if (energyConsumption <= 91) energyEfficiencyScore = 3; // C
    else if (energyConsumption <= 120) energyEfficiencyScore = 4; // D
    else if (energyConsumption <= 150) energyEfficiencyScore = 5; // E
    else if (energyConsumption <= 230) energyEfficiencyScore = 6; // F
    else energyEfficiencyScore = 7; // G
  }
  
  return {
    property_uid: row.property_uid,
    transaction_id: row.transaction_id,
    price: price,
    date: row.date,
    postcode: row.postcode,
    property_type: row.property_type,
    county: row.county,
    paon: row.paon,
    street: row.street,
    locality: row.locality,
    town_city: row.town_city,
    district: row.district,
    new_build: row.new_build,
    duration: row.duration,
    transaction_category: row.transaction_category,
    record_status: row.record_status,
    
    // EPC Data
    bedrooms: row.bedrooms ? parseInt(row.bedrooms) : null,
    property_size: propertySize,
    epc_rating: row.epc_rating,
    energy_consumption: energyConsumption,
    heating_cost: parseFloat(row.heating_cost) || null,
    lighting_cost: parseFloat(row.lighting_cost) || null,
    hot_water_cost: parseFloat(row.hot_water_cost) || null,
    co2_emissions: parseFloat(row.co2_emissions) || null,
    construction_age_band: row.construction_age_band,
    built_form: row.built_form,
    number_heated_rooms: row.number_heated_rooms ? parseInt(row.number_heated_rooms) : null,
    unheated_corridor_length: parseFloat(row.unheated_corridor_length) || null,
    floor_level: row.floor_level ? parseInt(row.floor_level) : null,
    flat_storey_count: row.flat_storey_count ? parseInt(row.flat_storey_count) : null,
    
    // HPI Data
    hpi_value: hpiValue,
    hpi_region: row.hpi_region,
    
    // Computed fields
    has_epc_data: hasEpcData,
    has_hpi_data: hasHpiData,
    price_per_sqm: pricePerSqm,
    energy_efficiency_score: energyEfficiencyScore
  };
}

async function indexData() {
  console.log('📖 Reading unified dataset...');
  
  const data = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream('data/aligned-2006-final/unified-sample-final.csv')
      .pipe(csv())
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`📊 Found ${data.length.toLocaleString()} properties to index`);
  
  if (data.length === 0) {
    console.log('❌ No data found to index');
    return;
  }
  
  // Transform and index data in batches
  let indexedCount = 0;
  let batch = [];
  
  for (const row of data) {
    const transformedProperty = transformProperty(row);
    batch.push({
      index: {
        _index: INDEX_NAME,
        _id: transformedProperty.property_uid
      }
    });
    batch.push(transformedProperty);
    
    if (batch.length >= BATCH_SIZE * 2) {
      await indexBatch(batch);
      indexedCount += batch.length / 2;
      console.log(`✅ Indexed ${indexedCount.toLocaleString()} properties...`);
      batch = [];
    }
  }
  
  // Index remaining properties
  if (batch.length > 0) {
    await indexBatch(batch);
    indexedCount += batch.length / 2;
  }
  
  console.log(`🎉 Indexing complete! ${indexedCount.toLocaleString()} properties indexed`);
  
  // Refresh index
  await client.indices.refresh({ index: INDEX_NAME });
  console.log('🔄 Index refreshed');
}

async function indexBatch(batch) {
  try {
    await client.bulk({ body: batch });
  } catch (error) {
    console.error('❌ Error indexing batch:', error.message);
    throw error;
  }
}

async function getIndexStats() {
  try {
    const stats = await client.indices.stats({ index: INDEX_NAME });
    const count = await client.count({ index: INDEX_NAME });
    
    console.log('\n📊 Index Statistics:');
    console.log(`   Total documents: ${count.count.toLocaleString()}`);
    console.log(`   Index size: ${(stats.indices[INDEX_NAME].total.store.size_in_bytes / 1024 / 1024).toFixed(2)} MB`);
    
    // Sample query to test
    const sample = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must: [
              { term: { has_epc_data: true } },
              { range: { price: { gte: 100000, lte: 500000 } } }
            ]
          }
        },
        size: 5
      }
    });
    
    console.log(`\n🔍 Sample query results: ${sample.hits.total.value} properties with EPC data between £100k-£500k`);
    
    if (sample.hits.hits.length > 0) {
      console.log('\n📋 Sample properties:');
      sample.hits.hits.forEach((hit, i) => {
        const prop = hit._source;
        console.log(`${i+1}. ${prop.paon} ${prop.street}, ${prop.postcode}`);
        console.log(`   Price: £${prop.price.toLocaleString()}, Bedrooms: ${prop.bedrooms}, EPC: ${prop.epc_rating}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error getting stats:', error.message);
  }
}

async function main() {
  try {
    // Test connection
    console.log('🔌 Testing Elasticsearch connection...');
    await client.ping();
    console.log('✅ Connected to Elasticsearch');
    
    // Create index
    await createIndex();
    
    // Index data
    await indexData();
    
    // Get statistics
    await getIndexStats();
    
    console.log('\n🎉 Unified dataset successfully indexed!');
    console.log('🚀 Ready for enhanced property search with EPC and HPI data!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main(); 