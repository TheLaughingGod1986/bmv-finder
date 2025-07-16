#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const path = require('path');

/**
 * Merge & Enrich Properties Script
 * 
 * Combines Land Registry sold prices with cleaned EPC data and HPI data.
 * - Land Registry (base): `data/land-registry-2006plus.csv`
 * - EPC Enrichment: `data/epc-certificates-clean.csv`
 * - HPI Enrichment: `data/hpi-full.csv`
 * 
 * Uses memory-efficient streaming and Map-based lookups for performance.
 */

const LAND_REGISTRY_FILE = 'data/land-registry-2006plus.csv';
const EPC_FILE = 'data/epc-certificates-clean.csv';
const HPI_FILE = 'data/hpi-full.csv';
const OUTPUT_FILE = 'data/unified-properties-final.csv';
const LOG_FILE = 'logs/merge-enrich.log';

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}
if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
}

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

// Data stores (for enrichment lookups)
const epcData = new Map();
const hpiData = new Map();

// Load EPC data into memory
const loadEpcData = async () => {
    log(`Loading EPC data from: ${EPC_FILE}`);
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
            epcData.set(key, row);
        }
    }
    log(`Loaded ${epcData.size.toLocaleString()} unique EPC records.`);
};

// Load HPI data into memory
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
        const regionName = row[0].replace(/"/g, ''); // Region name is the key
        hpiData.set(regionName, row);
    }
    log(`Loaded ${hpiData.size.toLocaleString()} unique HPI records.`);
};

// Main merging and enrichment process
const mergeAndEnrich = async () => {
    await loadEpcData();
    await loadHpiData();

    log('Starting merge and enrichment process...');
    log(`Base data: ${LAND_REGISTRY_FILE}`);

    const fileStream = fs.createReadStream(LAND_REGISTRY_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    const writeStream = fs.createWriteStream(OUTPUT_FILE);

    let isFirstRow = true;
    let landRegistryHeaders = [];
    let epcHeaders = [];
    let hpiHeaders = [];
    
    // Get headers from EPC and HPI to append
    if (epcData.size > 0) {
        const epcFileStream = fs.createReadStream(EPC_FILE);
        const epcRl = readline.createInterface({ input: epcFileStream, crlfDelay: Infinity });
        for await (const line of epcRl) {
            epcHeaders = line.split(',').map(h => `epc_${h}`);
            break;
        }
    }
    
    if (hpiData.size > 0) {
        const hpiFileStream = fs.createReadStream(HPI_FILE);
        const hpiRl = readline.createInterface({ input: hpiFileStream, crlfDelay: Infinity });
        for await (const line of hpiRl) {
            hpiHeaders = line.split(',').map(h => `hpi_${h.replace(/"/g, '')}`);
            break;
        }
    }

    for await (const line of rl) {
        if (isFirstRow) {
            landRegistryHeaders = line.split(',');
            // Write the combined header
            const finalHeaders = [...landRegistryHeaders, ...epcHeaders, ...hpiHeaders];
            writeStream.write(finalHeaders.join(',') + '\n');
            isFirstRow = false;
            continue;
        }

        stats.totalProperties++;
        const propertyRow = line.split(',');
        
        // Extract keys for matching
        const uprn = propertyRow[landRegistryHeaders.indexOf('uprn')];
        const paon = propertyRow[landRegistryHeaders.indexOf('paon')];
        const street = propertyRow[landRegistryHeaders.indexOf('street')];
        const postcode = propertyRow[landRegistryHeaders.indexOf('postcode')];
        const district = propertyRow[landRegistryHeaders.indexOf('district')];
        
        // Match EPC
        const epcKey = uprn || `${paon} ${street}_${postcode}`;
        let matchedEpc = [];
        if (epcData.has(epcKey)) {
            matchedEpc = epcData.get(epcKey);
            stats.epcMatched++;
        } else {
            // Create empty array to match header length
            matchedEpc = Array(epcHeaders.length).fill('');
        }

        // Match HPI (by district/region)
        let matchedHpi = [];
        if (hpiData.has(district)) {
            matchedHpi = hpiData.get(district);
            stats.hpiMatched++;
        } else {
            matchedHpi = Array(hpiHeaders.length).fill('');
        }

        // Combine and write the final row
        const finalRow = [...propertyRow, ...matchedEpc, ...matchedHpi];
        writeStream.write(finalRow.join(',') + '\n');
        
        // Progress logging
        if (stats.totalProperties % 100000 === 0) {
            const epcMatchRate = (stats.epcMatched / stats.totalProperties * 100).toFixed(1);
            const hpiMatchRate = (stats.hpiMatched / stats.totalProperties * 100).toFixed(1);
            log(`Processed ${stats.totalProperties.toLocaleString()} properties. EPC match rate: ${epcMatchRate}%, HPI match rate: ${hpiMatchRate}%`);
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
};

// Run the process
if (require.main === module) {
    mergeAndEnrich()
        .then(() => {
            console.log('Merge and enrich process completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Error during merge and enrich process:', error);
            log(`Error: ${error.message}`);
            process.exit(1);
        });
}

module.exports = { mergeAndEnrich }; 