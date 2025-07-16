#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const path = require('path');

/**
 * Ultra-Optimized EPC Certificates Cleaning Script
 * 
 * Final approach that handles 20M+ unique properties by avoiding
 * memory-intensive Set operations during merge
 */

const INPUT_FILE = 'data/epc-certificates.csv';
const OUTPUT_FILE = 'data/epc-certificates-clean.csv';
const TEMP_DIR = 'temp-epc-processing';
const LOG_FILE = 'logs/epc-cleaning.log';
const CHUNK_SIZE = 50000;

// Ensure directories exist
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

// Clear log file
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
    totalRows: 0,
    validRows: 0,
    duplicatesRemoved: 0,
    invalidRows: 0,
    chunksProcessed: 0,
    finalUniqueRecords: 0,
    startTime: Date.now()
};

// Validation functions
const isValidPostcode = (postcode) => {
    if (!postcode || typeof postcode !== 'string') return false;
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    return postcodeRegex.test(postcode.trim());
};

const normalizePostcode = (postcode) => {
    if (!postcode) return '';
    return postcode.trim().toUpperCase().replace(/\s+/g, ' ');
};

const normalizeDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

const normalizeNumeric = (value) => {
    if (!value || value === '' || value === 'N/A' || value === 'NODATA!' || value === 'NO DATA!') return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
};

const normalizeText = (text) => {
    if (!text || text === 'N/A' || text === 'NODATA!' || text === 'NO DATA!') return '';
    return text.trim();
};

// Key columns to extract
const KEY_COLUMNS = {
    'UPRN': 'uprn',
    'ADDRESS1': 'address_1', 
    'ADDRESS': 'full_address',
    'POSTCODE': 'postcode',
    'INSPECTION_DATE': 'inspection_date',
    'CURRENT_ENERGY_RATING': 'current_energy_rating',
    'CURRENT_ENERGY_EFFICIENCY': 'current_energy_efficiency',
    'PROPERTY_TYPE': 'property_type',
    'TOTAL_FLOOR_AREA': 'total_floor_area',
    'NUMBER_HABITABLE_ROOMS': 'number_habitable_rooms',
    'HEATING_COST_CURRENT': 'heating_cost_current',
    'ENERGY_CONSUMPTION_CURRENT': 'energy_consumption_current',
    'BUILT_FORM': 'built_form',
    'CONSTRUCTION_AGE_BAND': 'construction_age_band',
    'TENURE': 'tenure',
    'TRANSACTION_TYPE': 'transaction_type'
};

// Process row with validation
const processRow = (row, headers) => {
    const data = {};
    
    headers.forEach((header, index) => {
        if (KEY_COLUMNS[header]) {
            data[KEY_COLUMNS[header]] = row[index] || '';
        }
    });

    data.postcode = normalizePostcode(data.postcode);
    if (!isValidPostcode(data.postcode)) return null;

    data.inspection_date = normalizeDate(data.inspection_date);
    if (!data.inspection_date) return null;

    data.uprn = normalizeText(data.uprn);
    data.address_1 = normalizeText(data.address_1);
    data.full_address = normalizeText(data.full_address);
    
    const propertyKey = data.uprn || `${data.address_1}_${data.postcode}`;
    if (!propertyKey || propertyKey === '_') return null;

    // Normalize numeric fields
    data.current_energy_efficiency = normalizeNumeric(data.current_energy_efficiency);
    data.total_floor_area = normalizeNumeric(data.total_floor_area);
    data.number_habitable_rooms = normalizeNumeric(data.number_habitable_rooms);
    data.heating_cost_current = normalizeNumeric(data.heating_cost_current);
    data.energy_consumption_current = normalizeNumeric(data.energy_consumption_current);

    // Normalize text fields
    data.current_energy_rating = normalizeText(data.current_energy_rating);
    data.property_type = normalizeText(data.property_type);
    data.built_form = normalizeText(data.built_form);
    data.construction_age_band = normalizeText(data.construction_age_band);
    data.tenure = normalizeText(data.tenure);
    data.transaction_type = normalizeText(data.transaction_type);

    return { data, propertyKey };
};

// Convert data to CSV
const dataToCsv = (data) => {
    const fields = [
        data.uprn || '',
        data.address_1 || '',
        data.full_address || '',
        data.postcode || '',
        data.inspection_date || '',
        data.current_energy_rating || '',
        data.current_energy_efficiency || '',
        data.property_type || '',
        data.total_floor_area || '',
        data.number_habitable_rooms || '',
        data.heating_cost_current || '',
        data.energy_consumption_current || '',
        data.built_form || '',
        data.construction_age_band || '',
        data.tenure || '',
        data.transaction_type || ''
    ];
    
    return fields.map(field => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }).join(',');
};

// Process chunk and write to sorted file
const processChunk = async (chunkData, chunkNumber) => {
    const chunkFile = path.join(TEMP_DIR, `chunk_${chunkNumber}.csv`);
    const properties = new Map();
    
    log(`Processing chunk ${chunkNumber} with ${chunkData.length} rows...`);
    
    let validInChunk = 0;
    let invalidInChunk = 0;
    
    for (const { row, headers } of chunkData) {
        const result = processRow(row, headers);
        
        if (!result) {
            invalidInChunk++;
            continue;
        }

        const { data, propertyKey } = result;
        const inspectionDate = new Date(data.inspection_date);
        
        if (properties.has(propertyKey)) {
            const existing = properties.get(propertyKey);
            const existingDate = new Date(existing.inspection_date);
            
            if (inspectionDate > existingDate) {
                properties.set(propertyKey, data);
                stats.duplicatesRemoved++;
            } else {
                stats.duplicatesRemoved++;
                continue;
            }
        } else {
            properties.set(propertyKey, data);
        }
        
        validInChunk++;
    }
    
    // Sort by property key and write
    const sortedEntries = Array.from(properties.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    const writeStream = fs.createWriteStream(chunkFile);
    for (const [propertyKey, data] of sortedEntries) {
        const csvLine = `${propertyKey}|${data.inspection_date}|${dataToCsv(data)}`;
        writeStream.write(csvLine + '\n');
    }
    writeStream.end();
    
    stats.validRows += validInChunk;
    stats.invalidRows += invalidInChunk;
    stats.chunksProcessed++;
    
    log(`Chunk ${chunkNumber} complete: ${validInChunk} valid, ${invalidInChunk} invalid, ${properties.size} unique`);
    
    return {
        chunkFile,
        uniqueCount: properties.size
    };
};

// Ultra-optimized streaming merge without memory-intensive Set
const ultraOptimizedMerge = async (chunkFiles) => {
    log('Starting ultra-optimized streaming merge...');
    
    const writeStream = fs.createWriteStream(OUTPUT_FILE);
    
    // Write header
    const outputHeaders = [
        'uprn', 'address_1', 'full_address', 'postcode', 'inspection_date',
        'current_energy_rating', 'current_energy_efficiency', 'property_type',
        'total_floor_area', 'number_habitable_rooms', 'heating_cost_current',
        'energy_consumption_current', 'built_form', 'construction_age_band',
        'tenure', 'transaction_type'
    ];
    writeStream.write(outputHeaders.join(',') + '\n');
    
    let written = 0;
    let lastPropertyKey = '';
    
    // Process each chunk file in order (they're already sorted)
    for (let i = 0; i < chunkFiles.length; i++) {
        const chunkFile = chunkFiles[i];
        log(`Merging chunk file ${i + 1}/${chunkFiles.length}: ${path.basename(chunkFile)}`);
        
        const fileStream = fs.createReadStream(chunkFile);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        
        for await (const line of rl) {
            const [propertyKey, inspectionDate, ...csvParts] = line.split('|');
            const csvData = csvParts.join('|');
            
            // Since chunks are sorted, we only need to compare with the last written property
            if (propertyKey !== lastPropertyKey) {
                writeStream.write(csvData + '\n');
                written++;
                lastPropertyKey = propertyKey;
                
                if (written % 100000 === 0) {
                    log(`Written ${written.toLocaleString()} unique records...`);
                }
            } else {
                stats.duplicatesRemoved++;
            }
        }
        
        // Clean up chunk file
        fs.unlinkSync(chunkFile);
    }
    
    writeStream.end();
    stats.finalUniqueRecords = written;
    
    log(`Ultra-optimized merge complete. Final unique records: ${written.toLocaleString()}`);
    return written;
};

// Main cleaning function
const cleanEpcData = async () => {
    log('Starting ultra-optimized EPC data cleaning...');
    log(`Input file: ${INPUT_FILE}`);
    log(`Output file: ${OUTPUT_FILE}`);
    log(`Chunk size: ${CHUNK_SIZE} rows`);

    if (!fs.existsSync(INPUT_FILE)) {
        throw new Error(`Input file not found: ${INPUT_FILE}`);
    }

    const fileStream = fs.createReadStream(INPUT_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let headers = [];
    let isFirstRow = true;
    let currentChunk = [];
    let chunkNumber = 0;
    const chunkFiles = [];

    // Process file in chunks
    for await (const line of rl) {
        stats.totalRows++;

        if (isFirstRow) {
            headers = line.split(',').map(h => h.trim());
            isFirstRow = false;
            continue;
        }

        // Parse CSV row
        const row = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        row.push(current.trim());

        currentChunk.push({ row, headers });

        // Process chunk when full
        if (currentChunk.length >= CHUNK_SIZE) {
            const chunkResult = await processChunk(currentChunk, chunkNumber);
            chunkFiles.push(chunkResult.chunkFile);
            currentChunk = [];
            chunkNumber++;
            
            // Progress update
            const elapsed = (Date.now() - stats.startTime) / 1000;
            const rate = stats.totalRows / elapsed;
            log(`Progress: ${stats.totalRows.toLocaleString()} rows processed (${rate.toFixed(0)} rows/sec)`);
        }
    }

    // Process final chunk
    if (currentChunk.length > 0) {
        const chunkResult = await processChunk(currentChunk, chunkNumber);
        chunkFiles.push(chunkResult.chunkFile);
    }

    // Ultra-optimized merge
    await ultraOptimizedMerge(chunkFiles);

    // Cleanup temp directory
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true });
    }

    // Final statistics
    const elapsed = (Date.now() - stats.startTime) / 1000;
    log('='.repeat(60));
    log('🎉 EPC Data Cleaning Complete!');
    log(`📊 Total rows processed: ${stats.totalRows.toLocaleString()}`);
    log(`✅ Valid rows: ${stats.validRows.toLocaleString()}`);
    log(`❌ Invalid rows: ${stats.invalidRows.toLocaleString()}`);
    log(`🔄 Duplicates removed: ${stats.duplicatesRemoved.toLocaleString()}`);
    log(`🏠 Final unique properties: ${stats.finalUniqueRecords.toLocaleString()}`);
    log(`📦 Chunks processed: ${stats.chunksProcessed}`);
    log(`⏱️  Processing time: ${elapsed.toFixed(1)} seconds`);
    log(`🚀 Average rate: ${(stats.totalRows / elapsed).toFixed(0)} rows/second`);
    log(`📁 Output file: ${OUTPUT_FILE}`);
    
    // Check file size if it exists
    if (fs.existsSync(OUTPUT_FILE)) {
        log(`💾 File size: ${(fs.statSync(OUTPUT_FILE).size / (1024 * 1024)).toFixed(1)} MB`);
    }
    log('='.repeat(60));

    return stats;
};

// Run the cleaning process
if (require.main === module) {
    cleanEpcData()
        .then(results => {
            console.log('🎉 EPC cleaning completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error during EPC data cleaning:', error);
            log(`Error: ${error.message}`);
            process.exit(1);
        });
}

module.exports = { cleanEpcData }; 