#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const path = require('path');

/**
 * EPC Certificates Data Cleaning & Normalization Script
 * 
 * Processes 23M+ rows of EPC data with:
 * - Deduplication (keeps latest certificate per property)
 * - Data validation and normalization
 * - Column standardization
 * - Memory-efficient streaming processing
 */

const INPUT_FILE = 'data/epc-certificates.csv';
const OUTPUT_FILE = 'data/epc-certificates-clean.csv';
const LOG_FILE = 'logs/epc-cleaning.log';

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
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
    startTime: Date.now()
};

// Validation functions
const isValidPostcode = (postcode) => {
    if (!postcode || typeof postcode !== 'string') return false;
    // UK postcode regex (basic validation)
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
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
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

// Property uniqueness tracking (for deduplication)
const propertyMap = new Map(); // key: uprn or address+postcode, value: { row, inspectionDate }

// Column mapping for standardization
const COLUMN_MAPPING = {
    'LMK_KEY': 'lmk_key',
    'ADDRESS1': 'address_1',
    'ADDRESS2': 'address_2', 
    'ADDRESS3': 'address_3',
    'ADDRESS': 'full_address',
    'POSTCODE': 'postcode',
    'UPRN': 'uprn',
    'BUILDING_REFERENCE_NUMBER': 'building_reference',
    'CURRENT_ENERGY_RATING': 'current_energy_rating',
    'POTENTIAL_ENERGY_RATING': 'potential_energy_rating',
    'CURRENT_ENERGY_EFFICIENCY': 'current_energy_efficiency',
    'POTENTIAL_ENERGY_EFFICIENCY': 'potential_energy_efficiency',
    'PROPERTY_TYPE': 'property_type',
    'BUILT_FORM': 'built_form',
    'INSPECTION_DATE': 'inspection_date',
    'LODGEMENT_DATE': 'lodgement_date',
    'LOCAL_AUTHORITY': 'local_authority',
    'CONSTITUENCY': 'constituency',
    'COUNTY': 'county',
    'TRANSACTION_TYPE': 'transaction_type',
    'ENERGY_CONSUMPTION_CURRENT': 'energy_consumption_current',
    'ENERGY_CONSUMPTION_POTENTIAL': 'energy_consumption_potential',
    'CO2_EMISSIONS_CURRENT': 'co2_emissions_current',
    'CO2_EMISSIONS_POTENTIAL': 'co2_emissions_potential',
    'HEATING_COST_CURRENT': 'heating_cost_current',
    'HEATING_COST_POTENTIAL': 'heating_cost_potential',
    'HOT_WATER_COST_CURRENT': 'hot_water_cost_current',
    'HOT_WATER_COST_POTENTIAL': 'hot_water_cost_potential',
    'LIGHTING_COST_CURRENT': 'lighting_cost_current',
    'LIGHTING_COST_POTENTIAL': 'lighting_cost_potential',
    'TOTAL_FLOOR_AREA': 'total_floor_area',
    'NUMBER_HABITABLE_ROOMS': 'number_habitable_rooms',
    'NUMBER_HEATED_ROOMS': 'number_heated_rooms',
    'TENURE': 'tenure',
    'CONSTRUCTION_AGE_BAND': 'construction_age_band',
    'POSTTOWN': 'post_town',
    'MAINS_GAS_FLAG': 'mains_gas_flag',
    'FLOOR_LEVEL': 'floor_level',
    'FLAT_TOP_STOREY': 'flat_top_storey',
    'FLAT_STOREY_COUNT': 'flat_storey_count',
    'MULTI_GLAZE_PROPORTION': 'multi_glaze_proportion',
    'GLAZED_AREA': 'glazed_area',
    'EXTENSION_COUNT': 'extension_count',
    'LOW_ENERGY_LIGHTING': 'low_energy_lighting',
    'NUMBER_OPEN_FIREPLACES': 'number_open_fireplaces',
    'PHOTO_SUPPLY': 'photo_supply',
    'SOLAR_WATER_HEATING_FLAG': 'solar_water_heating_flag',
    'MECHANICAL_VENTILATION': 'mechanical_ventilation',
    'MAIN_FUEL': 'main_fuel',
    'WIND_TURBINE_COUNT': 'wind_turbine_count',
    'FLOOR_HEIGHT': 'floor_height'
};

// Process a single row
const processRow = (row, headers) => {
    const data = {};
    
    // Map all columns to standardized names
    headers.forEach((header, index) => {
        const standardName = COLUMN_MAPPING[header] || header.toLowerCase();
        data[standardName] = row[index] || '';
    });

    // Validate and normalize key fields
    data.postcode = normalizePostcode(data.postcode);
    if (!isValidPostcode(data.postcode)) {
        return null; // Skip invalid postcodes
    }

    data.inspection_date = normalizeDate(data.inspection_date);
    if (!data.inspection_date) {
        return null; // Skip rows without valid inspection date
    }

    data.lodgement_date = normalizeDate(data.lodgement_date);

    // Normalize UPRN
    data.uprn = normalizeText(data.uprn);
    
    // Normalize address fields
    data.address_1 = normalizeText(data.address_1);
    data.full_address = normalizeText(data.full_address);
    
    // Create property key for deduplication
    const propertyKey = data.uprn || `${data.address_1}_${data.postcode}`;
    if (!propertyKey || propertyKey === '_') {
        return null; // Skip if no valid property identifier
    }

    // Normalize numeric fields
    data.current_energy_efficiency = normalizeNumeric(data.current_energy_efficiency);
    data.potential_energy_efficiency = normalizeNumeric(data.potential_energy_efficiency);
    data.energy_consumption_current = normalizeNumeric(data.energy_consumption_current);
    data.energy_consumption_potential = normalizeNumeric(data.energy_consumption_potential);
    data.co2_emissions_current = normalizeNumeric(data.co2_emissions_current);
    data.co2_emissions_potential = normalizeNumeric(data.co2_emissions_potential);
    data.heating_cost_current = normalizeNumeric(data.heating_cost_current);
    data.heating_cost_potential = normalizeNumeric(data.heating_cost_potential);
    data.hot_water_cost_current = normalizeNumeric(data.hot_water_cost_current);
    data.hot_water_cost_potential = normalizeNumeric(data.hot_water_cost_potential);
    data.lighting_cost_current = normalizeNumeric(data.lighting_cost_current);
    data.lighting_cost_potential = normalizeNumeric(data.lighting_cost_potential);
    data.total_floor_area = normalizeNumeric(data.total_floor_area);
    data.number_habitable_rooms = normalizeNumeric(data.number_habitable_rooms);
    data.number_heated_rooms = normalizeNumeric(data.number_heated_rooms);
    data.flat_storey_count = normalizeNumeric(data.flat_storey_count);
    data.multi_glaze_proportion = normalizeNumeric(data.multi_glaze_proportion);
    data.glazed_area = normalizeNumeric(data.glazed_area);
    data.extension_count = normalizeNumeric(data.extension_count);
    data.number_open_fireplaces = normalizeNumeric(data.number_open_fireplaces);
    data.wind_turbine_count = normalizeNumeric(data.wind_turbine_count);
    data.floor_height = normalizeNumeric(data.floor_height);

    // Normalize text fields
    data.current_energy_rating = normalizeText(data.current_energy_rating);
    data.potential_energy_rating = normalizeText(data.potential_energy_rating);
    data.property_type = normalizeText(data.property_type);
    data.built_form = normalizeText(data.built_form);
    data.transaction_type = normalizeText(data.transaction_type);
    data.tenure = normalizeText(data.tenure);
    data.construction_age_band = normalizeText(data.construction_age_band);
    data.post_town = normalizeText(data.post_town);
    data.main_fuel = normalizeText(data.main_fuel);

    return { data, propertyKey };
};

// Convert row object back to CSV format
const rowToCsv = (data, headers) => {
    return headers.map(header => {
        const value = data[header];
        if (value === null || value === undefined) return '';
        const str = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }).join(',');
};

// Main processing function
const cleanEpcData = async () => {
    log('Starting EPC data cleaning process...');
    log(`Input file: ${INPUT_FILE}`);
    log(`Output file: ${OUTPUT_FILE}`);

    if (!fs.existsSync(INPUT_FILE)) {
        throw new Error(`Input file not found: ${INPUT_FILE}`);
    }

    const fileStream = fs.createReadStream(INPUT_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let headers = [];
    let outputHeaders = [];
    let isFirstRow = true;
    const validRows = [];

    for await (const line of rl) {
        stats.totalRows++;

        if (isFirstRow) {
            headers = line.split(',').map(h => h.trim());
            // Create standardized output headers
            outputHeaders = headers.map(h => COLUMN_MAPPING[h] || h.toLowerCase());
            isFirstRow = false;
            continue;
        }

        // Parse CSV row (simple split - may need more robust parsing for complex cases)
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
        row.push(current.trim()); // Add the last field

        // Process the row
        const result = processRow(row, headers);
        
        if (!result) {
            stats.invalidRows++;
            continue;
        }

        const { data, propertyKey } = result;
        const inspectionDate = new Date(data.inspection_date);

        // Check for duplicates (keep latest inspection)
        if (propertyMap.has(propertyKey)) {
            const existing = propertyMap.get(propertyKey);
            const existingDate = new Date(existing.inspection_date);
            
            if (inspectionDate > existingDate) {
                // Replace with newer certificate
                propertyMap.set(propertyKey, data);
                stats.duplicatesRemoved++;
            } else {
                stats.duplicatesRemoved++;
                continue;
            }
        } else {
            propertyMap.set(propertyKey, data);
        }

        stats.validRows++;

        // Progress logging
        if (stats.totalRows % 100000 === 0) {
            const elapsed = (Date.now() - stats.startTime) / 1000;
            const rate = stats.totalRows / elapsed;
            log(`Processed ${stats.totalRows.toLocaleString()} rows (${rate.toFixed(0)} rows/sec). Valid: ${stats.validRows.toLocaleString()}, Invalid: ${stats.invalidRows.toLocaleString()}, Duplicates: ${stats.duplicatesRemoved.toLocaleString()}`);
        }
    }

    log('Writing cleaned data to output file...');
    
    // Write output file
    const writeStream = fs.createWriteStream(OUTPUT_FILE);
    
    // Write header
    writeStream.write(outputHeaders.join(',') + '\n');
    
    // Write all unique, valid rows
    let written = 0;
    for (const data of propertyMap.values()) {
        const csvRow = rowToCsv(data, outputHeaders);
        writeStream.write(csvRow + '\n');
        written++;
        
        if (written % 50000 === 0) {
            log(`Written ${written.toLocaleString()} clean records...`);
        }
    }
    
    writeStream.end();

    // Final statistics
    const elapsed = (Date.now() - stats.startTime) / 1000;
    log('='.repeat(60));
    log('EPC Data Cleaning Complete!');
    log(`Total rows processed: ${stats.totalRows.toLocaleString()}`);
    log(`Valid rows: ${stats.validRows.toLocaleString()}`);
    log(`Invalid rows: ${stats.invalidRows.toLocaleString()}`);
    log(`Duplicates removed: ${stats.duplicatesRemoved.toLocaleString()}`);
    log(`Final unique records: ${propertyMap.size.toLocaleString()}`);
    log(`Processing time: ${elapsed.toFixed(1)} seconds`);
    log(`Average rate: ${(stats.totalRows / elapsed).toFixed(0)} rows/second`);
    log(`Output file: ${OUTPUT_FILE}`);
    log('='.repeat(60));

    return {
        totalProcessed: stats.totalRows,
        validRows: stats.validRows,
        invalidRows: stats.invalidRows,
        duplicatesRemoved: stats.duplicatesRemoved,
        finalRecords: propertyMap.size,
        processingTime: elapsed
    };
};

// Run the cleaning process
if (require.main === module) {
    cleanEpcData()
        .then(results => {
            console.log('Cleaning completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Error during EPC data cleaning:', error);
            log(`Error: ${error.message}`);
            process.exit(1);
        });
}

module.exports = { cleanEpcData }; 