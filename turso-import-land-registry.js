const fs = require('fs');
const http = require('http');
const path = require('path');
const { createClient } = require('@libsql/client');
const csv = require('csv-parser');
require('dotenv').config({ path: '.env.local' });

// 1. Download the full dataset CSV (all years)
const CSV_URL = 'http://prod1.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-monthly-update-new-version.csv';
const CSV_PATH = path.join(__dirname, 'pp-complete.csv');

function downloadCSV(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  http.get(url, (response) => {
    if (response.statusCode !== 200) {
      cb(new Error(`Failed to download file: ${response.statusCode}`));
      return;
    }
    response.pipe(file);
    file.on('finish', () => file.close(cb));
  }).on('error', (err) => {
    fs.unlink(dest, () => cb(err));
  });
}

async function importCSVtoTurso(csvPath, cb) {
  console.log('🚀 Starting import to Turso...');

  // Check environment variables
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local');
    console.log('Please set up your Turso database credentials in .env.local');
    process.exit(1);
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Create table
    console.log('🏗️  Creating/updating table schema...');
    await client.execute(`DROP TABLE IF EXISTS prices`);
    await client.execute(`
      CREATE TABLE prices (
        id TEXT PRIMARY KEY,
        price INTEGER,
        date_of_transfer TEXT,
        postcode TEXT,
        property_type TEXT,
        old_new TEXT,
        duration TEXT,
        paon TEXT,
        saon TEXT,
        street TEXT,
        locality TEXT,
        town_city TEXT,
        district TEXT,
        county TEXT,
        ppd_category_type TEXT,
        record_status TEXT
      )
    `);

    // Import data in batches
    const BATCH_SIZE = 1000;
    let batch = [];
    let rowCount = 0;
    let isFirstRow = true;

    console.log('📊 Processing CSV data...');

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv({ headers: false }))
        .on('data', async (row) => {
          if (isFirstRow) {
            isFirstRow = false; // skip header row
            return;
          }

          batch.push([
            row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7],
            row[8], row[9], row[10], row[11], row[12], row[13], row[14], row[15]
          ]);

          rowCount++;

          // Process batch when it reaches the batch size
          if (batch.length >= BATCH_SIZE) {
            try {
              console.log(`💾 Inserting batch of ${batch.length} records... (Total processed: ${rowCount})`);
              
              // Insert batch
              for (const rowData of batch) {
                await client.execute({
                  sql: `INSERT INTO prices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  args: rowData
                });
              }
              
              batch = []; // Clear batch
            } catch (error) {
              console.error('❌ Error inserting batch:', error);
              reject(error);
              return;
            }
          }
        })
        .on('end', async () => {
          try {
            // Insert remaining records
            if (batch.length > 0) {
              console.log(`💾 Inserting final batch of ${batch.length} records...`);
              for (const rowData of batch) {
                await client.execute({
                  sql: `INSERT INTO prices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  args: rowData
                });
              }
            }

            // Verify import
            const result = await client.execute('SELECT COUNT(*) as count FROM prices');
            const totalCount = result.rows[0].count;
            
            console.log(`🎉 Import completed! ${totalCount} records imported to Turso.`);
            
            await client.close();
            resolve();
          } catch (error) {
            console.error('❌ Error completing import:', error);
            await client.close();
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('❌ Error reading CSV:', error);
          client.close();
          reject(error);
        });
    });

  } catch (error) {
    console.error('❌ Error setting up Turso import:', error);
    await client.close();
    throw error;
  }
}

// Main process
if (require.main === module) {
  console.log('🔄 Land Registry Data Import to Turso');
  console.log('This will download and import the latest Land Registry data to your Turso database.');
  
  downloadCSV(CSV_URL, CSV_PATH, (err) => {
    if (err) {
      console.error('❌ Download failed:', err);
      process.exit(1);
    }
    console.log('✅ CSV downloaded. Importing to Turso database...');
    importCSVtoTurso(CSV_PATH, () => {
      console.log('🎉 Database updated with latest Land Registry data!');
      // Clean up CSV file
      fs.unlinkSync(CSV_PATH);
      console.log('🧹 Temporary CSV file cleaned up.');
    }).catch((error) => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
  });
}