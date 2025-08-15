const fs = require('fs');
const path = require('path');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000,
  maxRetries: 3,
  retryOnTimeout: true
});

// Index configuration for Price Paid data
const PRICE_PAID_INDEX = {
  name: 'recent_sales',
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    properties: {
      id: { type: 'keyword' },
      postcode: { type: 'keyword' },
      address: { type: 'text' },
      house_number: { type: 'keyword' },
      street: { type: 'text' },
      town: { type: 'keyword' },
      county: { type: 'keyword' },
      property_type: { type: 'keyword' },
      tenure: { type: 'keyword' },
      price: { type: 'float' },
      date_of_transfer: { type: 'date' },
      new_build: { type: 'keyword' },
      estate_type: { type: 'keyword' },
      transaction_category: { type: 'keyword' },
      primary_addressable_object_name: { type: 'keyword' },
      secondary_addressable_object_name: { type: 'keyword' },
      street_description: { type: 'text' },
      locality: { type: 'keyword' },
      town_city: { type: 'keyword' },
      district: { type: 'keyword' },
      transaction_id: { type: 'keyword' },
      entry_date: { type: 'date' },
      status: { type: 'keyword' }
    }
  }
};

// Create or update index
async function createIndex(indexConfig) {
  try {
    await esClient.indices.create({
      index: indexConfig.name,
      body: {
        settings: indexConfig.settings,
        mappings: indexConfig.mappings
      }
    });
    console.log(`✅ Created index '${indexConfig.name}'`);
  } catch (error) {
    if (error.message.includes('resource_already_exists_exception')) {
      console.log(`Index '${indexConfig.name}' already exists. Skipping creation.`);
    } else {
      throw error;
    }
  }
}

// Parse CSV line with minimal memory usage
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current.trim());
  return fields;
}

// Parse a single Price Paid record with minimal object creation
function parsePricePaidRecord(fields) {
  if (fields.length < 22) return null;
  
  try {
    const [
      id, postcode, address, house_number, street, town, county, property_type, 
      tenure, price, date_of_transfer, new_build, estate_type, transaction_category,
      primary_addressable_object_name, secondary_addressable_object_name, 
      street_description, locality, town_city, district, transaction_id, entry_date, status
    ] = fields;
    
    if (!id || !postcode || !price || !date_of_transfer) return null;
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) return null;
    
    const transferDate = new Date(date_of_transfer);
    if (isNaN(transferDate.getTime())) return null;
    
    const entryDate = new Date(entry_date || date_of_transfer);
    if (isNaN(entryDate.getTime())) return null;
    
    // Property type mapping
    let mappedPropertyType = 'Unknown';
    if (property_type === 'D') mappedPropertyType = 'Detached';
    else if (property_type === 'S') mappedPropertyType = 'Semi-Detached';
    else if (property_type === 'T') mappedPropertyType = 'Terraced';
    else if (property_type === 'F') mappedPropertyType = 'Flat/Maisonette';
    else if (property_type === 'O') mappedPropertyType = 'Other';
    
    // Estate type mapping
    let mappedEstateType = 'Unknown';
    if (estate_type === 'F') mappedEstateType = 'Freehold';
    else if (estate_type === 'L') mappedEstateType = 'Leasehold';
    
    // New build mapping
    let mappedNewBuild = 'Unknown';
    if (new_build === 'Y') mappedNewBuild = 'Yes';
    else if (new_build === 'N') mappedNewBuild = 'No';
    
    return {
      id: id.replace(/[{}]/g, ''),
      postcode: postcode.trim().toUpperCase(),
      address: `${house_number} ${street}`.trim(),
      house_number: house_number || '',
      street: street || '',
      town: town || '',
      county: county || '',
      property_type: mappedPropertyType,
      tenure: mappedEstateType,
      price: priceValue,
      date_of_transfer: transferDate.toISOString().split('T')[0],
      new_build: mappedNewBuild,
      estate_type: 'Residential',
      transaction_category: transaction_category || 'A',
      primary_addressable_object_name: house_number || '',
      secondary_addressable_object_name: '',
      street_description: street || '',
      locality: locality || '',
      town_city: town_city || '',
      district: district || '',
      transaction_id: transaction_id.replace(/[{}]/g, '') || id.replace(/[{}]/g, ''),
      entry_date: entryDate.toISOString().split('T')[0],
      status: status || 'A'
    };
    
  } catch (error) {
    return null;
  }
}

// Index a batch of documents
async function indexBatch(documents, indexName) {
  if (documents.length === 0) return 0;
  
  try {
    const operations = documents.flatMap(doc => [
      { index: { _index: indexName } },
      doc
    ]);
    
    const result = await esClient.bulk({ body: operations });
    
    if (result.errors) {
      const errorCount = result.items.filter(item => item.index && item.index.error).length;
      if (errorCount > 0) {
        console.warn(`⚠️  ${errorCount} documents failed to index`);
      }
    }
    
    return documents.length;
  } catch (error) {
    console.error('❌ Error indexing batch:', error.message);
    throw error;
  }
}

// Process a single chunk file
async function processChunkFile(chunkPath, chunkName) {
  return new Promise((resolve, reject) => {
    console.log(`📁 Processing chunk: ${chunkName}`);
    
    const documents = [];
    let lineCount = 0;
    let validRecords = 0;
    let invalidRecords = 0;
    
    const readStream = fs.createReadStream(chunkPath, { 
      encoding: 'utf8',
      highWaterMark: 64 * 1024 // 64KB chunks
    });
    
    let buffer = '';
    
    readStream.on('data', (chunk) => {
      buffer += chunk;
      
      // Process complete lines
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.substring(0, newlineIndex);
        buffer = buffer.substring(newlineIndex + 1);
        
        lineCount++;
        
        try {
          const fields = parseCSVLine(line);
          const record = parsePricePaidRecord(fields);
          
          if (record) {
            documents.push(record);
            validRecords++;
          } else {
            invalidRecords++;
          }
          
        } catch (error) {
          invalidRecords++;
        }
      }
    });
    
    readStream.on('end', async () => {
      try {
        // Process any remaining buffer content
        if (buffer.trim()) {
          lineCount++;
          try {
            const fields = parseCSVLine(buffer.trim());
            const record = parsePricePaidRecord(fields);
            
            if (record) {
              documents.push(record);
              validRecords++;
            } else {
              invalidRecords++;
            }
          } catch (error) {
            invalidRecords++;
          }
        }
        
        // Index the documents in batches
        let totalIndexed = 0;
        const batchSize = 1000;
        
        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          const indexed = await indexBatch(batch, PRICE_PAID_INDEX.name);
          totalIndexed += indexed;
        }
        
        console.log(`  ✅ ${chunkName}: ${totalIndexed.toLocaleString()} records indexed (${validRecords.toLocaleString()} valid, ${invalidRecords.toLocaleString()} invalid)`);
        
        // Clear documents array to free memory
        documents.length = 0;
        
        resolve(totalIndexed);
        
      } catch (error) {
        reject(error);
      }
    });
    
    readStream.on('error', reject);
  });
}

// Get all chunk files
function getChunkFiles() {
  const cleanedDir = path.join(__dirname, '../data/cleaned-datasets');
  const files = fs.readdirSync(cleanedDir)
    .filter(file => file.startsWith('price-paid-chunk-'))
    .map(file => ({
      name: file,
      path: path.join(cleanedDir, file)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  return files;
}

// Main import function
async function importPricePaidChunks() {
  console.log('🚀 Starting chunked import of Price Paid data...');
  
  try {
    // Create/update index
    await createIndex(PRICE_PAID_INDEX);
    
    // Get all chunk files
    const chunkFiles = getChunkFiles();
    console.log(`📊 Found ${chunkFiles.length} chunk files to process`);
    
    let totalIndexed = 0;
    let processedChunks = 0;
    
    // Process chunks one by one
    for (const chunkFile of chunkFiles) {
      try {
        const indexed = await processChunkFile(chunkFile.path, chunkFile.name);
        totalIndexed += indexed;
        processedChunks++;
        
        // Progress update
        const progress = ((processedChunks / chunkFiles.length) * 100).toFixed(1);
        console.log(`📈 Overall Progress: ${progress}% (${processedChunks}/${chunkFiles.length} chunks) - Total indexed: ${totalIndexed.toLocaleString()}`);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
      } catch (error) {
        console.error(`❌ Error processing chunk ${chunkFile.name}:`, error.message);
        // Continue with next chunk
      }
    }
    
    // Refresh the index
    await esClient.indices.refresh({ index: PRICE_PAID_INDEX.name });
    
    console.log('\n✅ Price Paid data import completed!');
    console.log(`📊 Final Summary:`);
    console.log(`   Total chunks processed: ${processedChunks}`);
    console.log(`   Total records indexed: ${totalIndexed.toLocaleString()}`);
    
    return totalIndexed;
    
  } catch (error) {
    console.error('❌ Error during import:', error.message);
    throw error;
  }
}

// Run the import
if (require.main === module) {
  importPricePaidChunks()
    .then((count) => {
      console.log(`🎉 Successfully imported ${count.toLocaleString()} Price Paid records!`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error.message);
      process.exit(1);
    });
}

module.exports = { importPricePaidChunks };
