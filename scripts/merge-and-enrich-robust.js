#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const path = require('path');

/**
 * Ultra-Robust Merge & Enrich Properties Script
 * 
 * Merges Land Registry, EPC, and HPI data using a streaming approach
 * to handle massive datasets without high memory usage.
 * 
 * - Base: Land Registry
 * - Enrichment: Indexed EPC data (for fast lookups)
 * - Enrichment: HPI data (in memory)
 */

const LAND_REGISTRY_FILE = 'data/land-registry-2006plus.csv';
const EPC_FILE = 'data/epc-certificates-clean.csv';
const HPI_FILE = 'data/hpi-full.csv';
const OUTPUT_FILE = 'data/unified-properties-final.csv';
const EPC_INDEX_DIR = 'temp-epc-index';
const LOG_FILE = 'logs/merge-enrich.log';

// Ensure directories exist
if (!fs.existsSync('logs')) fs.mkdirSync('logs');
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
if (fs.existsSync(EPC_INDEX_DIR)) fs.rmSync(EPC_INDEX_DIR, { recursive: true });
fs.mkdirSync(EPC_INDEX_DIR);

// Logging utility
const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, logMessage);
};

// Statistics tracking
const stats = {
    totalProperties: 0,
    epcMatched: 0,
    hpiMatched: 0,
    startTime: Date.now()
};

// Create a file-based index for EPC data for fast lookups
const indexEpcData = async () => {
    log(`Creating file-based index for EPC data...`);
    const fileStream = fs.createReadStream(EPC_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isFirstRow = true;
    let headers = [];

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
            const indexKey = key.substring(0, 2); // Use first 2 chars for sharding
            const indexDir = path.join(EPC_INDEX_DIR, indexKey.substring(0, 1));
            if (!fs.existsSync(indexDir)) {
                fs.mkdirSync(indexDir, { recursive: true });
            }
            const indexFile = path.join(indexDir, `${indexKey.substring(1)}.csv`);
            fs.appendFileSync(indexFile, `${key}|${line}\n`);
        }
    }
    log('EPC indexing complete.');
};

// Load HPI data into memory (small enough)
const hpiData = new Map();
const loadHpiData = async () => {
    log(`Loading HPI data from: ${HPI_FILE}`);
    const fileStream = fs.createReadStream(HPI_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isFirstRow = true;
    for await (const line of rl) {
        if (isFirstRow) {
            isFirstRow = false;
            continue;
        }
        
        const row = line.split(',');
        const regionName = row[0].replace(/"/g, '');
        hpiData.set(regionName, row);
    }
    log(`Loaded ${hpiData.size.toLocaleString()} unique HPI records.`);
};

// Get a record from the EPC index
const getEpcRecord = (key) => {
    if (!key) return null;
    const indexKey = key.substring(0, 2);
    const indexDir = path.join(EPC_INDEX_DIR, indexKey.substring(0, 1));
    const indexFile = path.join(indexDir, `${indexKey.substring(1)}.csv`);

    if (fs.existsSync(indexFile)) {
        const data = fs.readFileSync(indexFile, 'utf-8');
        const lines = data.split('\n');
        for (const line of lines) {
            if (line.startsWith(`${key}|`)) {
                return line.split('|')[1].split(',');
            }
        }
    }
    return null;
};

// Main merge and enrich process
const mergeAndEnrich = async () => {
    await indexEpcData();
    await loadHpiData();

    log('Starting robust merge and enrichment process...');
    
    const fileStream = fs.createReadStream(LAND_REGISTRY_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    const writeStream = fs.createWriteStream(OUTPUT_FILE);

    let isFirstRow = true;
    let landRegistryHeaders = [];
    let epcHeaders = [];
    let hpiHeaders = [];

    // Get headers
    epcHeaders = fs.readFileSync(EPC_FILE, 'utf-8').split('\n')[0].split(',').map(h => `epc_${h}`);
    hpiHeaders = fs.readFileSync(HPI_FILE, 'utf-8').split('\n')[0].split(',').map(h => `hpi_${h.replace(/"/g, '')}`);

    for await (const line of rl) {
        if (isFirstRow) {
            landRegistryHeaders = line.split(',');
            const finalHeaders = [...landRegistryHeaders, ...epcHeaders, ...hpiHeaders];
            writeStream.write(finalHeaders.join(',') + '\n');
            isFirstRow = false;
            continue;
        }

        stats.totalProperties++;
        const propertyRow = line.split(',');
        
        const uprn = propertyRow[landRegistryHeaders.indexOf('uprn')];
        const paon = propertyRow[landRegistryHeaders.indexOf('paon')];
        const street = propertyRow[landRegistryHeaders.indexOf('street')];
        const postcode = propertyRow[landRegistryHeaders.indexOf('postcode')];
        const district = propertyRow[landRegistryHeaders.indexOf('district')];
        
        // EPC match from file index
        const epcKey = uprn || `${paon} ${street}_${postcode}`;
        let matchedEpc = getEpcRecord(epcKey);
        if (matchedEpc) {
            stats.epcMatched++;
        } else {
            matchedEpc = Array(epcHeaders.length).fill('');
        }

        // HPI match from memory
        let matchedHpi = [];
        if (hpiData.has(district)) {
            matchedHpi = hpiData.get(district);
            stats.hpiMatched++;
        } else {
            matchedHpi = Array(hpiHeaders.length).fill('');
        }

        const finalRow = [...propertyRow, ...matchedEpc, ...matchedHpi];
        writeStream.write(finalRow.join(',') + '\n');
        
        if (stats.totalProperties % 25000 === 0) {
            const epcMatchRate = (stats.epcMatched / stats.totalProperties * 100).toFixed(1);
            const hpiMatchRate = (stats.hpiMatched / stats.totalProperties * 100).toFixed(1);
            log(`Processed ${stats.totalProperties.toLocaleString()} properties. EPC Match: ${epcMatchRate}%, HPI Match: ${hpiMatchRate}%`);
        }
    }

    writeStream.end();

    // Final statistics
    const elapsed = (Date.now() - stats.startTime) / 1000;
    const epcMatchRate = (stats.epcMatched / stats.totalProperties * 100).toFixed(1);
    const hpiMatchRate = (stats.hpiMatched / stats.totalProperties * 100).toFixed(1);

    log('='.repeat(60));
    log('🎉 Merge & Enrich Complete!');
    log(`Total properties processed: ${stats.totalProperties.toLocaleString()}`);
    log(`EPC records matched: ${stats.epcMatched.toLocaleString()} (${epcMatchRate}%)`);
    log(`HPI records matched: ${stats.hpiMatched.toLocaleString()} (${hpiMatchRate}%)`);
    log(`Processing time: ${elapsed.toFixed(1)} seconds`);
    log(`Output file: ${OUTPUT_FILE}`);
    log('='.repeat(60));

    // Cleanup
    if (fs.existsSync(EPC_INDEX_DIR)) {
        fs.rmSync(EPC_INDEX_DIR, { recursive: true });
    }
};

// Run
if (require.main === module) {
    mergeAndEnrich().catch(err => {
        log(`Fatal error: ${err.message}`);
        process.exit(1);
    });
} 