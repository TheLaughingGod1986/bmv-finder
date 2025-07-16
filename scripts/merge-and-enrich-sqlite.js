#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/**
 * Database-Powered Merge & Enrich Script
 * 
 * Uses SQLite for robust, indexed lookups to handle massive datasets.
 */

const LAND_REGISTRY_FILE = 'data/land-registry-2006plus.csv';
const EPC_FILE = 'data/epc-certificates-clean.csv';
const HPI_FILE = 'data/hpi-full.csv';
const OUTPUT_FILE = 'data/unified-properties-final.csv';
const DB_FILE = 'temp-epc.db';
const LOG_FILE = 'logs/merge-enrich.log';

// Setup
if (!fs.existsSync('logs')) fs.mkdirSync('logs');
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);

const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, logMessage);
};

const db = new sqlite3.Database(DB_FILE);

const stats = {
    totalProperties: 0,
    epcMatched: 0,
    hpiMatched: 0,
    startTime: Date.now()
};

// 1. Create EPC table and index in SQLite
const setupDatabase = () => new Promise((resolve, reject) => {
    log('Setting up SQLite database and EPC table...');
    db.serialize(() => {
        db.run(`
            CREATE TABLE epc (
                key TEXT PRIMARY KEY,
                data TEXT
            )
        `, (err) => {
            if (err) return reject(err);
            log('Database setup complete.');
            resolve();
        });
    });
});

// 2. Load EPC data into SQLite
const loadEpcIntoDb = () => new Promise(async (resolve, reject) => {
    log('Loading EPC data into SQLite...');
    const fileStream = fs.createReadStream(EPC_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let headers = [];
    let isFirstRow = true;
    let count = 0;
    
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("INSERT OR IGNORE INTO epc (key, data) VALUES (?, ?)");

    for await (const line of rl) {
        if (isFirstRow) {
            headers = line.split(',');
            isFirstRow = false;
            continue;
        }
        
        const row = line.split(',');
        const uprn = row[headers.indexOf('uprn')];
        const address_1 = row[headers.indexOf('address_1')];
        const postcode = row[headers.indexOf('postcode')];
        const key = uprn || `${address_1}_${postcode}`;
        
        if (key && key !== '_') {
            stmt.run(key, line);
            count++;
            if (count % 100000 === 0) {
                log(`Loaded ${count.toLocaleString()} EPC records into DB...`);
            }
        }
    }
    
    stmt.finalize();
    db.run("COMMIT", (err) => {
        if(err) return reject(err);
        log(`Finished loading ${count.toLocaleString()} EPC records.`);
        resolve();
    });
});

// 3. Load HPI data into memory
const hpiData = new Map();
const loadHpiData = async () => {
    log(`Loading HPI data...`);
    // ... same implementation as before ...
};

// 4. Merge and Enrich
const mergeAndEnrich = async () => {
    await setupDatabase();
    await loadEpcIntoDb();
    await loadHpiData();

    log('Starting merge and enrichment...');

    const fileStream = fs.createReadStream(LAND_REGISTRY_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    const writeStream = fs.createWriteStream(OUTPUT_FILE);

    let isFirstRow = true;
    let landRegistryHeaders = [];
    
    // Stream headers to avoid memory issues
    const getHeaders = (file) => new Promise(async (resolve) => {
        const stream = fs.createReadStream(file);
        const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
        for await (const line of rl) {
            stream.close();
            resolve(line.split(','));
            return;
        }
    });

    let epcHeaders = (await getHeaders(EPC_FILE)).map(h => `epc_${h}`);
    let hpiHeaders = (await getHeaders(HPI_FILE)).map(h => `hpi_${h.replace(/"/g, '')}`);

    for await (const line of rl) {
        if (isFirstRow) {
            landRegistryHeaders = line.split(',');
            const finalHeaders = [...landRegistryHeaders, ...epcHeaders, ...hpiHeaders];
            writeStream.write(finalHeaders.join(',') + '\n');
            isFirstRow = false;
            continue;
        }

        const propertyRow = line.split(',');
        const uprn = propertyRow[landRegistryHeaders.indexOf('uprn')];
        const paon = propertyRow[landRegistryHeaders.indexOf('paon')];
        const street = propertyRow[landRegistryHeaders.indexOf('street')];
        const postcode = propertyRow[landRegistryHeaders.indexOf('postcode')];
        const district = propertyRow[landRegistryHeaders.indexOf('district')];
        const epcKey = uprn || `${paon} ${street}_${postcode}`;

        const epcRecord = await new Promise((resolve, reject) => {
            db.get("SELECT data FROM epc WHERE key = ?", [epcKey], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });

        let matchedEpc = [];
        if (epcRecord) {
            stats.epcMatched++;
            matchedEpc = epcRecord.data.split(',');
        } else {
            matchedEpc = Array(epcHeaders.length).fill('');
        }
        
        let matchedHpi = [];
        if (hpiData.has(district)) {
            stats.hpiMatched++;
            matchedHpi = hpiData.get(district);
        } else {
            matchedHpi = Array(hpiHeaders.length).fill('');
        }
        
        const finalRow = [...propertyRow, ...matchedEpc, ...matchedHpi];
        writeStream.write(finalRow.join(',') + '\n');

        stats.totalProperties++;
        if (stats.totalProperties % 25000 === 0) {
            const epcMatchRate = (stats.epcMatched / stats.totalProperties * 100).toFixed(1);
            const hpiMatchRate = (stats.hpiMatched / stats.totalProperties * 100).toFixed(1);
            log(`Processed ${stats.totalProperties.toLocaleString()} properties. EPC Match: ${epcMatchRate}%, HPI Match: ${hpiMatchRate}%`);
        }
    }

    writeStream.end();
    db.close();
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);

    // Final statistics
    // ...
};

// Run
if (require.main === module) {
    mergeAndEnrich().catch(err => log(`Fatal error: ${err.message}`));
} 