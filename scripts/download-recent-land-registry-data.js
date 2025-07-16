const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createObjectCsvWriter } = require('csv-writer');

const LAND_REGISTRY_URL = 'http://prod2.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-complete.csv';
const OUTPUT_FILE = 'data/land-registry-recent.csv';
const RECENT_YEAR = 2019; // Extract properties from 2019 onwards

console.log('🚀 Downloading and processing recent Land Registry data...');

async function downloadAndProcessRecentData() {
  try {
    console.log(`📥 Downloading Land Registry data from ${LAND_REGISTRY_URL}...`);
    console.log('⚠️  This may take a while (file is ~5.3GB)...');
    
    const response = await axios({
      method: 'GET',
      url: LAND_REGISTRY_URL,
      responseType: 'stream',
      timeout: 300000, // 5 minutes timeout
      headers: {
        'User-Agent': 'BMV-Finder-Data-Import/1.0'
      }
    });
    
    console.log('✅ Download started, processing data...');
    
    // Create CSV writer for recent data
    const csvWriter = createObjectCsvWriter({
      path: OUTPUT_FILE,
      header: [
        { id: 'transaction_id', title: 'transaction_id' },
        { id: 'price', title: 'price' },
        { id: 'date', title: 'date' },
        { id: 'postcode', title: 'postcode' },
        { id: 'property_type', title: 'property_type' },
        { id: 'new_build', title: 'new_build' },
        { id: 'duration', title: 'duration' },
        { id: 'paon', title: 'paon' },
        { id: 'saon', title: 'saon' },
        { id: 'street', title: 'street' },
        { id: 'locality', title: 'locality' },
        { id: 'town_city', title: 'town_city' },
        { id: 'district', title: 'district' },
        { id: 'county', title: 'county' },
        { id: 'transaction_category', title: 'transaction_category' },
        { id: 'record_status', title: 'record_status' }
      ]
    });
    
    let totalLines = 0;
    let recentLines = 0;
    const recentRecords = [];
    
    return new Promise((resolve, reject) => {
      const rl = require('readline').createInterface({
        input: response.data,
        crlfDelay: Infinity
      });
      
      rl.on('line', (line) => {
        totalLines++;
        
        if (totalLines % 100000 === 0) {
          console.log(`  Processed ${totalLines.toLocaleString()} lines, found ${recentLines} recent properties...`);
        }
        
        // Parse CSV line
        const values = line.split(',').map(v => v.replace(/"/g, ''));
        
        // Check if this is a recent property (date is at index 2)
        const dateStr = values[2];
        if (dateStr) {
          const year = parseInt(dateStr.split('-')[0]);
          if (year >= RECENT_YEAR) {
            recentLines++;
            recentRecords.push({
              transaction_id: values[0],
              price: values[1],
              date: values[2],
              postcode: values[3],
              property_type: values[4],
              new_build: values[5],
              duration: values[6],
              paon: values[7],
              saon: values[8],
              street: values[9],
              locality: values[10],
              town_city: values[11],
              district: values[12],
              county: values[13],
              transaction_category: values[14],
              record_status: values[15]
            });
            
            // Write in batches to avoid memory issues
            if (recentRecords.length >= 1000) {
              csvWriter.writeRecords(recentRecords);
              recentRecords.length = 0; // Clear array
            }
          }
        }
      });
      
      rl.on('close', async () => {
        // Write remaining records
        if (recentRecords.length > 0) {
          await csvWriter.writeRecords(recentRecords);
        }
        
        console.log(`✅ Processing complete!`);
        console.log(`📊 Total lines processed: ${totalLines.toLocaleString()}`);
        console.log(`📊 Recent properties (${RECENT_YEAR}+): ${recentLines.toLocaleString()}`);
        console.log(`📁 Recent data saved to: ${OUTPUT_FILE}`);
        
        resolve();
      });
      
      rl.on('error', reject);
    });
    
  } catch (error) {
    console.error('❌ Error downloading/processing data:', error.message);
    throw error;
  }
}

// Run the download and processing
downloadAndProcessRecentData().catch(console.error); 