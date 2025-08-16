#!/usr/bin/env node

/**
 * ONS Postcode Directory (ONSPD) Data Cleaning Script
 * Cleans and transforms the raw ONSPD CSV for Elasticsearch import
 *
 * Usage: node scripts/clean-onspd-data.js
 */

const fs = require('fs');
const path = require('path');

// File paths
const INPUT_FILE = path.join(__dirname, '..', 'data', 'ONSPD_Online_Latest_Centroids.csv');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'cleaned-datasets', 'onspd-cleaned.csv');

// CSV parsing function for quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Clean and transform ONSPD record
function cleanONSPDRecord(values) {
  if (values.length < 60) return null;

  const [
    x, y, objectId, pcd, pcd2, pcds, dointr, doterm, oscty, ced, oslaua, osward, parish,
    usertype, oseast1m, osnrth1m, osgrdind, oshlthau, nhser, ctry, rgn, streg, pcon,
    eer, teclec, ttwa, pct, itl, statsward, oa01, casward, npark, lsoa01, msoa01,
    ur01ind, oac01, oa11, lsoa11, msoa11, wz11, sicbl, bua24, ru11ind, oac11,
    lat, long, lep1, lep2, pfa, imd, calncv, icb, oa21, lsoa21, msoa21, ruc21ind, globalId
  ] = values;

  // Skip header row
  if (pcd === 'PCD') return null;

  // Skip terminated postcodes (unless you want to keep them for historical analysis)
  if (doterm && doterm !== '') return null;

  // Parse coordinates
  const latitude = parseFloat(lat);
  const longitude = parseFloat(long);
  
  if (isNaN(latitude) || isNaN(longitude)) return null;

  // Parse dates
  const introDate = dointr ? new Date(dointr + '01') : null;
  const termDate = doterm ? new Date(doterm + '01') : null;

  // Clean postcode
  const cleanPostcode = pcds ? pcds.trim() : pcd.trim();

  // Determine if postcode is active
  const isActive = !doterm || doterm === '';

  // Create cleaned record with essential fields
  return {
    postcode: cleanPostcode,
    postcode_clean: cleanPostcode.replace(/\s+/g, ''),
    x_coord: parseFloat(x) || 0,
    y_coord: parseFloat(y) || 0,
    latitude: latitude,
    longitude: longitude,
    object_id: parseInt(objectId) || 0,
    introduction_date: introDate ? introDate.toISOString().split('T')[0] : null,
    termination_date: termDate ? termDate.toISOString().split('T')[0] : null,
    is_active: isActive,
    user_type: parseInt(usertype) || 0,
    os_grid_reference: osgrdind === '1',
    easting_1m: parseInt(oseast1m) || 0,
    northing_1m: parseInt(osnrth1m) || 0,
    
    // Administrative boundaries
    county: oscty !== 'S99999999' ? oscty : null,
    local_authority: oslaua !== 'S99999999' ? oslaua : null,
    ward: osward !== 'S99999999' ? osward : null,
    parish: parish !== 'S99999999' ? parish : null,
    constituency: pcon !== 'S99999999' ? pcon : null,
    
    // Health and NHS
    health_authority: oshlthau !== 'S99999999' ? oshlthau : null,
    nhs_region: nhser !== 'S99999999' ? nhser : null,
    
    // Statistical areas
    lsoa_2011: lsoa11 !== 'S99999999' ? lsoa11 : null,
    msoa_2011: msoa11 !== 'S99999999' ? msoa11 : null,
    lsoa_2021: lsoa21 !== 'S99999999' ? lsoa21 : null,
    msoa_2021: msoa21 !== 'S99999999' ? msoa21 : null,
    output_area_2011: oa11 !== 'S99999999' ? oa11 : null,
    output_area_2021: oa21 !== 'S99999999' ? oa21 : null,
    
    // Geographic regions
    country: ctry !== 'S99999999' ? ctry : null,
    region: rgn !== 'S99999999' ? rgn : null,
    european_electoral_region: eer !== 'S99999999' ? eer : null,
    travel_to_work_area: ttwa !== 'S99999999' ? ttwa : null,
    
    // Additional classifications
    urban_rural_2011: ru11ind || null,
    urban_rural_2021: ruc21ind || null,
    built_up_area: bua24 !== 'S99999999' ? bua24 : null,
    national_park: npark !== 'S99999999' ? npark : null,
    
    // IMD and deprivation
    imd_decile: imd ? parseInt(imd) : null,
    
    // Global ID for reference
    global_id: globalId || null,
    
    // Metadata
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function cleanONSPDData() {
  try {
    console.log('🔄 Starting ONSPD data cleaning...');
    console.log(`📁 Input file: ${INPUT_FILE}`);
    console.log(`📁 Output file: ${OUTPUT_FILE}`);

    // Check if input file exists
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`❌ Input file not found: ${INPUT_FILE}`);
      return;
    }

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read and process the file
    console.log('📖 Reading ONSPD data...');
    const csvContent = fs.readFileSync(INPUT_FILE, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    console.log(`📊 Found ${lines.length} lines to process`);

    // Process header
    const header = parseCSVLine(lines[0]);
    console.log(`📋 Header has ${header.length} columns`);

    // Process data lines
    let processedCount = 0;
    let skippedCount = 0;
    let validRecords = [];

    console.log('🧹 Processing and cleaning records...');

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const record = cleanONSPDRecord(values);

        if (record) {
          validRecords.push(record);
          processedCount++;
        } else {
          skippedCount++;
        }

        // Progress indicator
        if (i % 100000 === 0) {
          console.log(`📈 Processed ${i.toLocaleString()} lines...`);
        }

      } catch (error) {
        console.warn(`⚠️  Skipping line ${i + 1}: ${error.message}`);
        skippedCount++;
      }
    }

    console.log(`✅ Processing complete:`);
    console.log(`   📊 Total lines: ${lines.length.toLocaleString()}`);
    console.log(`   ✅ Valid records: ${processedCount.toLocaleString()}`);
    console.log(`   ⚠️  Skipped records: ${skippedCount.toLocaleString()}`);

    if (validRecords.length === 0) {
      console.error('❌ No valid records found');
      return;
    }

    // Write cleaned data to CSV
    console.log('💾 Writing cleaned data to CSV...');
    
    // Create CSV header
    const csvHeader = Object.keys(validRecords[0]).join(',');
    const csvLines = [csvHeader];

    // Add data rows
    for (const record of validRecords) {
      const values = Object.values(record).map(value => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvLines.push(values.join(','));
    }

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, csvLines.join('\n'));
    
    console.log(`✅ Successfully wrote ${validRecords.length.toLocaleString()} records to:`);
    console.log(`   📁 ${OUTPUT_FILE}`);

    // Show sample record
    if (validRecords.length > 0) {
      console.log('\n📋 Sample cleaned record:');
      console.log(JSON.stringify(validRecords[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error cleaning ONSPD data:', error.message);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  cleanONSPDData()
    .then(() => {
      console.log('🎉 ONSPD data cleaning completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { cleanONSPDData, cleanONSPDRecord };
