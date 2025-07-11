// import-land-registry-sales.js
// Node.js script to download, parse, and upsert Land Registry Price Paid Data into Elasticsearch
// - Organizes CSVs by year/month
// - Upserts by transaction unique identifier
// - Logs missing/invalid data
// - Uses environment variables for ES credentials
//
// Usage: node scripts/import-land-registry-sales.js

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { parse } = require('csv-parse');
const { Client } = require('@elastic/elasticsearch');
const readline = require('readline');

// --- CONFIG ---
const DATA_DIR = path.join(__dirname, '../data/land-registry');
const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'missing_sales.log');
const ES_INDEX = process.env.ES_INDEX || 'land_registry_sales';
const ES_NODE = process.env.ES_NODE; // e.g. 'https://your-es-url:9200'
const ES_USERNAME = process.env.ES_USERNAME;
const ES_PASSWORD = process.env.ES_PASSWORD;

// Land Registry monthly CSV URL pattern
const CSV_BASE_URL = 'https://landregistry.data.gov.uk/data/ppd/monthly/file';
// Example: https://landregistry.data.gov.uk/data/ppd/monthly/file-2024-06.csv

// --- HELPERS ---
function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getCsvUrl(year, month) {
  const mm = String(month).padStart(2, '0');
  return `${CSV_BASE_URL}-${year}-${mm}.csv`;
}

function getCsvPath(year, month) {
  const mm = String(month).padStart(2, '0');
  return path.join(DATA_DIR, `${year}`, `pp-${year}-${mm}.csv`);
}

function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// --- MAIN SCRIPT ---
(async () => {
  ensureDirSync(DATA_DIR);
  ensureDirSync(LOG_DIR);

  // Setup Elasticsearch client
  const esClient = new Client({
    node: ES_NODE,
    auth: ES_USERNAME && ES_PASSWORD ? { username: ES_USERNAME, password: ES_PASSWORD } : undefined,
    tls: { rejectUnauthorized: false },
  });

  // Download and process all months from 1995 to current
  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
  const startYear = 1995;
  let totalNew = 0, totalUpdated = 0, totalSkipped = 0, totalErrors = 0;
  const missingRows = [];

  for (let year = startYear; year <= currentYear; year++) {
    const maxMonth = (year === currentYear) ? currentMonth : 12;
    for (let month = 1; month <= maxMonth; month++) {
      const csvPath = getCsvPath(year, month);
      const csvUrl = getCsvUrl(year, month);
      ensureDirSync(path.dirname(csvPath));
      // Download if missing
      if (!fs.existsSync(csvPath)) {
        console.log(`Downloading ${csvUrl} ...`);
        try {
          const res = await fetch(csvUrl);
          if (!res.ok) {
            console.warn(`  Not found: ${csvUrl}`);
            continue;
          }
          const fileStream = fs.createWriteStream(csvPath);
          await new Promise((resolve, reject) => {
            res.body.pipe(fileStream);
            res.body.on('error', reject);
            fileStream.on('finish', resolve);
          });
        } catch (err) {
          console.error(`  Error downloading ${csvUrl}:`, err);
          continue;
        }
      }
      // Parse and upsert
      console.log(`Processing ${csvPath} ...`);
      const parser = fs.createReadStream(csvPath).pipe(parse({ columns: true, skip_empty_lines: true }));
      for await (const row of parser) {
        // Check for required fields
        const txnId = row['Transaction unique identifier'];
        if (!txnId || !row['Price Paid'] || !row['Postcode']) {
          missingRows.push(row);
          totalErrors++;
          continue;
        }
        // Prepare doc
        const doc = {
          transaction_id: txnId,
          price: Number(row['Price Paid']),
          date: row['Date of Transfer'],
          postcode: row['Postcode'],
          property_type: row['Property Type'],
          old_new: row['Old/New'],
          duration: row['Duration'],
          paon: row['PAON'],
          saon: row['SAON'],
          street: row['Street'],
          locality: row['Locality'],
          town_city: row['Town/City'],
          district: row['District'],
          county: row['County'],
          ppd_category: row['PPD Category Type'],
          record_status: row['Record Status'],
        };
        // Upsert into ES
        try {
          await esClient.index({
            index: ES_INDEX,
            id: txnId,
            document: doc,
            op_type: 'index', // upsert
            refresh: false,
          });
          totalNew++;
        } catch (err) {
          console.error(`  Error indexing txn ${txnId}:`, err.meta?.body?.error || err);
          totalErrors++;
        }
      }
    }
  }
  // Write missing/invalid rows to log
  if (missingRows.length > 0) {
    fs.appendFileSync(LOG_FILE, missingRows.map(r => JSON.stringify(r)).join('\n') + '\n');
    console.log(`Logged ${missingRows.length} missing/invalid rows to ${LOG_FILE}`);
  }
  console.log(`Import complete. New/updated: ${totalNew}, Errors: ${totalErrors}`);
})(); 