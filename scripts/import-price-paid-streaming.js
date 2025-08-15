const fs = require('fs');
const path = require('path');
const readline = require('readline');
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

// Helper function to find the latest cleaned data file
function findLatestCleanedFile(pattern) {
  const cleanedDir = path.join(__dirname, '../data/cleaned-datasets');
  if (!fs.existsSync(cleanedDir)) {
    throw new Error(`Cleaned datasets directory not found: ${cleanedDir}`);
  }
  
  const files = fs.readdirSync(cleanedDir)
    .filter(file => file.includes(pattern))
    .map(file => ({
      name: file,
      path: path.join(cleanedDir, file),
      time: fs.statSync(path.join(cleanedDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  if (files.length === 0) {
    throw new Error(`No cleaned ${pattern} files found in ${cleanedDir}`);
  }
  
  console.log(`📁 Using latest ${pattern} file: ${files[0].name}`);
  return files[0].path;
}

// Parse CSV line with proper quote handling
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

// Parse a single Price Paid record
function parsePricePaidLine(line, lineNumber) {
  if (!line || line.trim() === '') return null;
  
  try {
    const values = parseCSVLine(line);
    if (values.length < 22) return null;
    
    const [
      id, postcode, address, house_number, street, town, county, property_type, 
      tenure, price, date_of_transfer, new_build, estate_type, transaction_category,
      primary_addressable_object_name, secondary_addressable_object_name, 
      street_description, locality, town_city, district, transaction_id, entry_date, status
    ] = values;
    
    if (!id || !postcode || !price || !date_of_transfer) return null;
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) return null;
    
    const transferDate = new Date(date_of_transfer);
    if (isNaN(transferDate.getTime())) return null;
    
    const entryDate = new Date(entry_date || date_of_transfer);
    if (isNaN(entryDate.getTime())) return null;
    
    return {
      id: id.replace(/[{}]/g, ''),
      postcode: postcode.trim().toUpperCase(),
      address: address || '',
      house_number: house_number || '',
      street: street || '',
      town: town || '',
      county: county || '',
      property_type: property_type || 'Unknown',
      tenure: tenure || 'Unknown',
      price: priceValue,
      date_of_transfer: transferDate.toISOString().split('T')[0],
      new_build: new_build || 'Unknown',
      estate_type: estate_type || 'Residential',
      transaction_category: transaction_category || 'A',
      primary_addressable_object_name: primary_addressable_object_name || '',
      secondary_addressable_object_name: secondary_addressable_object_name || '',
      street_description: street_description || '',
      locality: locality || '',
      town_city: town_city || '',
      district: district || '',
      transaction_id: transaction_id.replace(/[{}]/g, '') || id.replace(/[{}]/g, ''),
      entry_date: entryDate.toISOString().split('T')[0],
      status: status || 'A'
    };
    
  } catch (error) {
    console.warn(`⚠️  Line ${lineNumber}: Error parsing record: ${error.message}`);
    return null;
  }
}

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
      console.warn(`⚠️  ${errorCount} documents failed to index`);
    }
    
    return documents.length;
  } catch (error) {
    console.error('❌ Error indexing batch:', error.message);
    throw error;
  }
}

// Stream import Price Paid data
async function importPricePaidDataStreaming() {
  console.log('🚀 Starting streaming import of Price Paid data...');
  
  try {
    // Create/update index
    await createIndex(PRICE_PAID_INDEX);
    
    // Find the latest cleaned file
    const inputFile = findLatestCleanedFile('price-paid-cleaned');
    
    // Count total lines for progress tracking
    console.log('📊 Counting total lines...');
    const totalLines = await countLines(inputFile);
    console.log(`📊 Total lines: ${totalLines.toLocaleString()}`);
    
    // Process the file with streaming
    let processedLines = 0;
    let validRecords = 0;
    let invalidRecords = 0;
    let batchSize = 1000; // Process in batches of 1000
    let currentBatch = [];
    
    console.log('🔄 Processing records (streaming mode)...');
    
    const readStream = fs.createReadStream(inputFile, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity
    });
    
    return new Promise((resolve, reject) => {
      let isFirstLine = true;
      
      rl.on('line', async (line) => {
        try {
          if (isFirstLine) {
            isFirstLine = false;
            return;
          }
          
          processedLines++;
          
          const record = parsePricePaidLine(line, processedLines);
          if (record) {
            currentBatch.push(record);
            validRecords++;
          } else {
            invalidRecords++;
          }
          
          // Process batch when it reaches the batch size
          if (currentBatch.length >= batchSize) {
            try {
              await indexBatch(currentBatch, PRICE_PAID_INDEX.name);
              currentBatch = [];
              
              // Progress update
              const progress = ((processedLines / totalLines) * 100).toFixed(1);
              console.log(`📈 Progress: ${progress}% (${processedLines.toLocaleString()}/${totalLines.toLocaleString()}) - Valid: ${validRecords.toLocaleString()}, Invalid: ${invalidRecords.toLocaleString()})`);
              
              // Force garbage collection if available
              if (global.gc) {
                global.gc();
              }
            } catch (error) {
              console.error('❌ Error processing batch:', error.message);
              reject(error);
              return;
            }
          }
          
        } catch (error) {
          console.warn(`⚠️  Line ${processedLines}: Error: ${error.message}`);
          invalidRecords++;
        }
      });
      
      rl.on('close', async () => {
        try {
          // Process remaining records in the final batch
          if (currentBatch.length > 0) {
            await indexBatch(currentBatch, PRICE_PAID_INDEX.name);
          }
          
          // Refresh the index
          await esClient.indices.refresh({ index: PRICE_PAID_INDEX.name });
          
          console.log('\n✅ Price Paid data import completed!');
          console.log(`📊 Summary:`);
          console.log(`   Total lines processed: ${processedLines.toLocaleString()}`);
          console.log(`   Valid records imported: ${validRecords.toLocaleString()}`);
          console.log(`   Invalid records: ${invalidRecords.toLocaleString()}`);
          console.log(`   Success rate: ${((validRecords / processedLines) * 100).toFixed(1)}%`);
          
          resolve(validRecords);
          
        } catch (error) {
          reject(error);
        }
      });
      
      rl.on('error', reject);
    });
    
  } catch (error) {
    console.error('❌ Error during import:', error.message);
    throw error;
  }
}

// Helper function to count lines in a file
function countLines(filePath) {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    
    readStream.on('data', (chunk) => {
      lineCount += (chunk.match(/\n/g) || []).length;
    });
    
    readStream.on('end', () => resolve(lineCount));
    readStream.on('error', reject);
  });
}

// Run the import
if (require.main === module) {
  importPricePaidDataStreaming()
    .then((count) => {
      console.log(`🎉 Successfully imported ${count.toLocaleString()} Price Paid records!`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error.message);
      process.exit(1);
    });
}

module.exports = { importPricePaidDataStreaming };
