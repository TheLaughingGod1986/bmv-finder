const fs = require('fs');
const path = require('path');

// Import English HPI data into Elasticsearch
// This script reads the generated CSV and imports it into the house_price_index

const csvPath = path.join(__dirname, '..', 'data', 'cleaned-datasets', 'ons-english-hpi-cleaned.csv');

async function importEnglishHPI() {
  try {
    console.log('🚀 Importing English HPI data into Elasticsearch...');
    
    // Read the CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    console.log(`📊 Found ${lines.length - 1} HPI records to import`);
    
    // Process each line (skip header)
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
        const record = {};
        
        headers.forEach((header, index) => {
          let value = values[index];
          
          // Convert numeric fields
          if (['year', 'month', 'hpiIndex', 'averagePrice', 'percentageChangeYearly', 'percentageChangeMonthly', 'salesVolume'].includes(header)) {
            value = parseFloat(value) || 0;
          }
          
          record[header] = value;
        });
        
        records.push(record);
      }
    }
    
    console.log(`✅ Processed ${records.length} records`);
    
    // Import into Elasticsearch using the existing HPI index
    console.log('📤 Importing into Elasticsearch...');
    
    // Use curl to import the data
    const batchSize = 100;
    let imported = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      // Create bulk import format
      const bulkData = batch.map(record => {
        return JSON.stringify({ index: { _index: 'house_price_index' } }) + '\n' + JSON.stringify(record);
      }).join('\n') + '\n';
      
      // Write batch to temporary file
      const tempFile = `/tmp/hpi_batch_${i}.json`;
      fs.writeFileSync(tempFile, bulkData);
      
      // Import batch
      const { execSync } = require('child_process');
      try {
        execSync(`curl -s -X POST "http://localhost:9201/house_price_index/_bulk" -H "Content-Type: application/x-ndjson" --data-binary @${tempFile}`, { encoding: 'utf8' });
        
        // Clean up temp file
        fs.unlinkSync(tempFile);
        
        imported += batch.length;
        console.log(`📈 Imported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}: ${imported}/${records.length} records`);
        
      } catch (error) {
        console.error(`❌ Error importing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully imported ${imported} English HPI records!`);
    console.log('📍 Regions added: North East, North West, Yorkshire, East/West Midlands, East of England, London, South East, South West');
    
    // Verify the import
    console.log('\n🔍 Verifying import...');
    const { execSync } = require('child_process');
    
    try {
      const response = execSync('curl -s "http://localhost:9201/house_price_index/_search?size=0" -H "Content-Type: application/json" -d \'{"aggs":{"regions":{"terms":{"field":"region.keyword","size":20}}}}\'', { encoding: 'utf8' });
      const data = JSON.parse(response);
      
      if (data.aggregations?.regions?.buckets) {
        console.log('📊 Current regions in HPI index:');
        data.aggregations.regions.buckets.forEach(bucket => {
          console.log(`   - ${bucket.key}: ${bucket.doc_count} records`);
        });
      }
    } catch (error) {
      console.error('❌ Error verifying import:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error importing English HPI data:', error);
  }
}

// Run the import
importEnglishHPI();
