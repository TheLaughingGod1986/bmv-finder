const fs = require('fs');
const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

// 1. Download the full dataset CSV (all years)
const CSV_URL = 'http://prod1.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-monthly-update-new-version.csv';
const CSV_PATH = path.join(__dirname, 'pp-complete.csv');
const DB_PATH = path.join(__dirname, 'land_registry.db');

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

function importCSVtoDB(csvPath, dbPath, cb) {
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS prices`);
    db.run(`
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

    const stmt = db.prepare(`
      INSERT INTO prices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let isFirstRow = true;
    fs.createReadStream(csvPath)
      .pipe(csv({ headers: false }))
      .on('data', (row) => {
        if (isFirstRow) {
          isFirstRow = false; // skip header row
          return;
        }
        stmt.run(
          row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7],
          row[8], row[9], row[10], row[11], row[12], row[13], row[14], row[15]
        );
      })
      .on('end', () => {
        stmt.finalize();
        db.close();
        cb();
      });
  });
}

// Main process
if (require.main === module) {
  downloadCSV(CSV_URL, CSV_PATH, (err) => {
    if (err) {
      console.error('Download failed:', err);
      process.exit(1);
    }
    console.log('CSV downloaded. Importing to database...');
    importCSVtoDB(CSV_PATH, DB_PATH, () => {
      console.log('Database updated with latest Land Registry data!');
    });
  });
} 