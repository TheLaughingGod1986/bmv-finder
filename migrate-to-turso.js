#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@libsql/client');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const BATCH_SIZE = 1000; // Process data in batches

async function migrateToTurso() {
  console.log('🚀 Starting migration from SQLite to Turso...');

  // Check environment variables
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local');
    console.log('Please set up your Turso database credentials in .env.local');
    process.exit(1);
  }

  // Initialize connections
  const localDbPath = path.join(__dirname, 'land_registry.db');
  const localDb = new sqlite3.Database(localDbPath);
  
  const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('📊 Checking local database...');

  try {
    // Get total count from local database
    const totalCount = await new Promise((resolve, reject) => {
      localDb.get('SELECT COUNT(*) as count FROM prices', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    console.log(`📈 Found ${totalCount} records in local database`);

    // Create table in Turso (if it doesn't exist)
    console.log('🏗️  Creating table in Turso...');
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS prices (
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

    // Check if data already exists in Turso
    const tursoResult = await tursoClient.execute('SELECT COUNT(*) as count FROM prices');
    const tursoCount = tursoResult.rows[0].count;
    
    if (tursoCount > 0) {
      console.log(`⚠️  Turso database already contains ${tursoCount} records`);
      console.log('Do you want to continue? This will add duplicate data.');
      console.log('Consider truncating the Turso table first if you want a clean migration.');
    }

    // Migrate data in batches
    let offset = 0;
    let migrated = 0;

    while (offset < totalCount) {
      console.log(`📦 Processing batch ${Math.floor(offset / BATCH_SIZE) + 1}...`);
      
      // Get batch from local database
      const batch = await new Promise((resolve, reject) => {
        localDb.all(
          `SELECT * FROM prices LIMIT ? OFFSET ?`,
          [BATCH_SIZE, offset],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      if (batch.length === 0) break;

      // Insert batch into Turso
      console.log(`💾 Inserting ${batch.length} records into Turso...`);
      
      for (const row of batch) {
        try {
          await tursoClient.execute({
            sql: `INSERT OR REPLACE INTO prices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              row.id, row.price, row.date_of_transfer, row.postcode,
              row.property_type, row.old_new, row.duration, row.paon,
              row.saon, row.street, row.locality, row.town_city,
              row.district, row.county, row.ppd_category_type, row.record_status
            ]
          });
          migrated++;
        } catch (error) {
          console.error(`❌ Error inserting record ${row.id}:`, error.message);
        }
      }

      offset += BATCH_SIZE;
      console.log(`✅ Progress: ${migrated}/${totalCount} records migrated (${Math.round(migrated/totalCount*100)}%)`);
    }

    console.log(`🎉 Migration completed! ${migrated} records successfully migrated to Turso.`);
    
    // Verify migration
    const finalResult = await tursoClient.execute('SELECT COUNT(*) as count FROM prices');
    const finalCount = finalResult.rows[0].count;
    console.log(`🔍 Verification: Turso now contains ${finalCount} records`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close connections
    localDb.close();
    tursoClient.close();
  }
}

// Helper function to truncate Turso table (if needed)
async function truncateTursoTable() {
  console.log('🗑️  Truncating Turso table...');
  
  const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    await tursoClient.execute('DELETE FROM prices');
    console.log('✅ Turso table truncated');
  } catch (error) {
    console.error('❌ Error truncating table:', error);
  } finally {
    tursoClient.close();
  }
}

// Command line handling
const command = process.argv[2];

if (command === 'truncate') {
  truncateTursoTable();
} else if (command === 'migrate') {
  migrateToTurso();
} else {
  console.log(`
🔄 Turso Migration Tool

Commands:
  node migrate-to-turso.js migrate    - Migrate data from SQLite to Turso
  node migrate-to-turso.js truncate  - Truncate Turso table (use with caution!)

Make sure your .env.local file contains:
  TURSO_DATABASE_URL=libsql://your-database-name-your-org.turso.io
  TURSO_AUTH_TOKEN=your-auth-token-here
  `);
}