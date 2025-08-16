#!/usr/bin/env node

/**
 * ONS Postcode Directory (ONSPD) Data Cleaning Script - Fixed Version
 * Cleans and transforms the raw ONSPD CSV for Elasticsearch import
 * Handles the actual ONSPD data format correctly
 *
 * Usage: node scripts/clean-onspd-data-fixed.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
  if (values.length < 50) return null;

  // Map the actual columns based on the real data structure
  const [
    x, y, objectId, pcd, pcd2, pcds, dointr, doterm, oscty, ced, oslaua, osward, parish,
    usertype, oseast1m, osnrth1m, osgrdind, oshlthau, nhser, ctry, rgn, streg, pcon,
    eer, teclec, ttwa, pct, itl, statsward, oa01, casward, npark, lsoa01, msoa01,
    ur01ind, oac01, oa11, lsoa11, msoa11, wz11, sicbl, bua24, ru11ind, oac11,
    lat, long, lep1, lep2, pfa, imd, calncv, icb, oa21, lsoa21, msoa21, ruc21ind, globalId
  ] = values;

  // Skip header row
  if (pcd === 'PCD' || pcd === '') return null;

  // Skip terminated postcodes (unless you want to keep them for historical analysis)
  if (doterm && doterm !== '' && doterm !== 'S99999999') return null;

  // Parse coordinates - handle the actual format
  const latitude = parseFloat(lat);
  const longitude = parseFloat(long);
  
  if (isNaN(latitude) || isNaN(longitude)) return null;

  // Parse dates - handle the actual format (YYYYMM)
  let introDate = null;
  let termDate = null;
  
  if (dointr && dointr !== 'S99999999' && dointr.length === 6) {
    const year = dointr.substring(0, 4);
    const month = dointr.substring(4, 6);
    introDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  }
  
  if (doterm && doterm !== 'S99999999' && doterm.length === 6) {
    const year = doterm.substring(0, 4);
    const month = doterm.substring(4, 6);
    termDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  }

  // Clean postcode
  const cleanPostcode = pcds ? pcds.trim() : pcd.trim();

  // Determine if postcode is active
  const isActive = !doterm || doterm === '' || doterm === 'S99999999';

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
    imd_decile: imd && imd !== 'S99999999' ? parseInt(imd) : null,
    
    // Global ID for reference
    global_id: globalId || null,
    
    // Metadata
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Convert record to CSV line
function recordToCSV(record) {
  const values = Object.values(record).map(value => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' && value.includes(',')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  });
  return values.join(',');
}

async function cleanONSPDDataFixed() {
  try {
    console.log('🔄 Starting ONSPD data cleaning (fixed version)...');
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

    // Create read stream and readline interface
    const fileStream = fs.createReadStream(INPUT_FILE);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineCount = 0;
    let processedCount = 0;
    let skippedCount = 0;
    let headerWritten = false;

    console.log('📖 Processing ONSPD data line by line...');

    // Create write stream
    const writeStream = fs.createWriteStream(OUTPUT_FILE);

    for await (const line of rl) {
      lineCount++;

      try {
        const values = parseCSVLine(line);
        
        if (lineCount === 1) {
          // This is the header - we'll create our own cleaned header
          const csvHeader = 'postcode,postcode_clean,x_coord,y_coord,latitude,longitude,object_id,introduction_date,termination_date,is_active,user_type,os_grid_reference,easting_1m,northing_1m,county,local_authority,ward,parish,constituency,health_authority,nhs_region,lsoa_2011,msoa_2011,lsoa_2021,msoa_2021,output_area_2011,output_area_2021,country,region,european_electoral_region,travel_to_work_area,urban_rural_2011,urban_rural_2021,built_up_area,national_park,imd_decile,global_id,created_at,updated_at';
          writeStream.write(csvHeader + '\n');
          headerWritten = true;
          continue;
        }

        const record = cleanONSPDRecord(values);

        if (record) {
          const csvLine = recordToCSV(record);
          writeStream.write(csvLine + '\n');
          processedCount++;
        } else {
          skippedCount++;
        }

        // Progress indicator
        if (lineCount % 100000 === 0) {
          console.log(`📈 Processed ${lineCount.toLocaleString()} lines...`);
        }

      } catch (error) {
        console.warn(`⚠️  Skipping line ${lineCount}: ${error.message}`);
        skippedCount++;
      }
    }

    // Close write stream
    writeStream.end();

    console.log(`✅ Processing complete:`);
    console.log(`   📊 Total lines: ${lineCount.toLocaleString()}`);
    console.log(`   ✅ Valid records: ${processedCount.toLocaleString()}`);
    console.log(`   ⚠️  Skipped records: ${skippedCount.toLocaleString()}`);

    if (processedCount === 0) {
      console.error('❌ No valid records found');
      return;
    }

    console.log(`✅ Successfully wrote ${processedCount.toLocaleString()} records to:`);
    console.log(`   📁 ${OUTPUT_FILE}`);

    // Show file size
    const stats = fs.statSync(OUTPUT_FILE);
    console.log(`📏 Output file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('❌ Error cleaning ONSPD data:', error.message);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  cleanONSPDDataFixed()
    .then(() => {
      console.log('🎉 ONSPD data cleaning completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { cleanONSPDDataFixed, cleanONSPDRecord };
