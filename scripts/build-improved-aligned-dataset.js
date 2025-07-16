const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const ALIGNED_DATA_DIR = 'data/aligned-2006-improved';
const LAND_REGISTRY_FILE = 'data/land-registry-recent.csv';
const EPC_FILE = 'data/cleaned/epc-cleaned-uid.csv';
const HPI_FILE = 'data/hpi-regions.csv';

const START_YEAR = 2006;

console.log('🚀 Building improved aligned dataset with better UID matching...');

function normalizeString(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

function extractNumberFromAddress(address) {
  if (!address) return '';
  
  // Handle various number formats: "123", "123A", "Flat 123", "123, Street Name"
  const match = address.match(/^(\d+[A-Za-z]?)/);
  if (match) return match[1].toLowerCase();
  
  // Handle "Flat 123" format
  const flatMatch = address.match(/flat\s+(\d+)/i);
  if (flatMatch) return `flat${flatMatch[1]}`;
  
  return '';
}

function extractStreetFromAddress(address) {
  if (!address) return '';
  
  // Remove number and common prefixes
  let street = address
    .replace(/^\d+[A-Za-z]?\s*/, '') // Remove number at start
    .replace(/^flat\s+\d+\s*/i, '') // Remove "Flat 123"
    .replace(/^,\s*/, '') // Remove leading comma
    .trim();
  
  return normalizeString(street);
}

function generatePropertyUID(row) {
  const paon = (row.paon || '').toString().trim();
  const street = (row.street || '').trim();
  const postcode = (row.postcode || '').trim();
  
  // Skip if essential fields are missing
  if (!paon || paon === 'undefined' || !street || street === 'undefined' || !postcode || postcode === 'undefined') {
    return null;
  }
  
  const cleanNumber = extractNumberFromAddress(paon);
  const cleanStreet = normalizeString(street);
  const cleanPostcode = postcode.replace(/\s+/g, '').toLowerCase();
  
  if (!cleanNumber || !cleanStreet || !cleanPostcode) {
    return null;
  }
  
  return `${cleanNumber}-${cleanStreet}-${cleanPostcode}`;
}

function generateEPCUID(row) {
  const address1 = (row.ADDRESS1 || '').trim();
  const address2 = (row.ADDRESS2 || '').trim();
  const address3 = (row.ADDRESS3 || '').trim();
  const postcode = (row.POSTCODE || '').trim();
  
  // Skip if essential fields are missing
  if (!address1 || !postcode) {
    return null;
  }
  
  const cleanNumber = extractNumberFromAddress(address1);
  const cleanStreet = extractStreetFromAddress(address1) || normalizeString(address2) || normalizeString(address3);
  const cleanPostcode = postcode.replace(/\s+/g, '').toLowerCase();
  
  if (!cleanNumber || !cleanStreet || !cleanPostcode) {
    return null;
  }
  
  return `${cleanNumber}-${cleanStreet}-${cleanPostcode}`;
}

async function filterAndCleanLandRegistryData() {
  console.log('📖 Filtering and cleaning Land Registry data from 2006 onwards...');
  
  const outputFile = path.join(ALIGNED_DATA_DIR, 'land-registry-clean.csv');
  const csvWriter = createObjectCsvWriter({
    path: outputFile,
    header: [
      { id: 'transaction_id', title: 'transaction_id' },
      { id: 'price', title: 'price' },
      { id: 'date', title: 'date' },
      { id: 'postcode', title: 'postcode' },
      { id: 'property_type', title: 'property_type' },
      { id: 'new_build', title: 'new_build' },
      { id: 'duration', title: 'duration' },
      { id: 'paon', title: 'paon' },
      { id: 'saon', title: 'saon' },
      { id: 'street', title: 'street' },
      { id: 'locality', title: 'locality' },
      { id: 'town_city', title: 'town_city' },
      { id: 'district', title: 'district' },
      { id: 'county', title: 'county' },
      { id: 'transaction_category', title: 'transaction_category' },
      { id: 'record_status', title: 'record_status' },
      { id: 'property_uid', title: 'property_uid' }
    ]
  });
  
  let totalProcessed = 0;
  let filteredCount = 0;
  let validUIDCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(LAND_REGISTRY_FILE)
      .pipe(csv())
      .on('data', (row) => {
        totalProcessed++;
        
        if (totalProcessed % 100000 === 0) {
          console.log(`  Processed ${totalProcessed.toLocaleString()} records, filtered ${filteredCount.toLocaleString()}, valid UIDs: ${validUIDCount.toLocaleString()}...`);
        }
        
        // Check date
        const year = parseInt(row.date?.split('-')[0]);
        if (!year || year < START_YEAR) return;
        
        // Generate UID
        const uid = generatePropertyUID(row);
        if (!uid) return;
        
        filteredCount++;
        validUIDCount++;
        
        csvWriter.writeRecords([{
          ...row,
          property_uid: uid
        }]);
      })
      .on('end', () => {
        console.log(`✅ Land Registry filtering complete: ${filteredCount.toLocaleString()} records with valid UIDs (${totalProcessed.toLocaleString()} total)`);
        resolve(filteredCount);
      })
      .on('error', reject);
  });
}

async function filterAndCleanEPCData() {
  console.log('📖 Filtering and cleaning EPC data from 2006 onwards...');
  
  const outputFile = path.join(ALIGNED_DATA_DIR, 'epc-clean.csv');
  const csvWriter = createObjectCsvWriter({
    path: outputFile,
    header: [
      { id: 'LMK_KEY', title: 'LMK_KEY' },
      { id: 'ADDRESS1', title: 'ADDRESS1' },
      { id: 'ADDRESS2', title: 'ADDRESS2' },
      { id: 'ADDRESS3', title: 'ADDRESS3' },
      { id: 'POSTCODE', title: 'POSTCODE' },
      { id: 'CURRENT_ENERGY_RATING', title: 'CURRENT_ENERGY_RATING' },
      { id: 'POTENTIAL_ENERGY_RATING', title: 'POTENTIAL_ENERGY_RATING' },
      { id: 'PROPERTY_TYPE', title: 'PROPERTY_TYPE' },
      { id: 'BUILT_FORM', title: 'BUILT_FORM' },
      { id: 'INSPECTION_DATE', title: 'INSPECTION_DATE' },
      { id: 'COUNTY', title: 'COUNTY' },
      { id: 'TOTAL_FLOOR_AREA', title: 'TOTAL_FLOOR_AREA' },
      { id: 'NUMBER_HABITABLE_ROOMS', title: 'NUMBER_HABITABLE_ROOMS' },
      { id: 'NUMBER_HEATED_ROOMS', title: 'NUMBER_HEATED_ROOMS' },
      { id: 'CONSTRUCTION_AGE_BAND', title: 'CONSTRUCTION_AGE_BAND' },
      { id: 'ENERGY_CONSUMPTION_CURRENT', title: 'ENERGY_CONSUMPTION_CURRENT' },
      { id: 'CO2_EMISSIONS_CURRENT', title: 'CO2_EMISSIONS_CURRENT' },
      { id: 'HEATING_COST_CURRENT', title: 'HEATING_COST_CURRENT' },
      { id: 'LIGHTING_COST_CURRENT', title: 'LIGHTING_COST_CURRENT' },
      { id: 'HOT_WATER_COST_CURRENT', title: 'HOT_WATER_COST_CURRENT' },
      { id: 'UNHEATED_CORRIDOR_LENGTH', title: 'UNHEATED_CORRIDOR_LENGTH' },
      { id: 'FLOOR_LEVEL', title: 'FLOOR_LEVEL' },
      { id: 'FLAT_STOREY_COUNT', title: 'FLAT_STOREY_COUNT' },
      { id: 'ADDRESS', title: 'ADDRESS' },
      { id: 'epc_uid', title: 'epc_uid' }
    ]
  });
  
  let totalProcessed = 0;
  let filteredCount = 0;
  let validUIDCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(EPC_FILE)
      .pipe(csv())
      .on('data', (row) => {
        totalProcessed++;
        
        if (totalProcessed % 100000 === 0) {
          console.log(`  Processed ${totalProcessed.toLocaleString()} records, filtered ${filteredCount.toLocaleString()}, valid UIDs: ${validUIDCount.toLocaleString()}...`);
        }
        
        // Check inspection date
        const inspectionDate = row.INSPECTION_DATE;
        if (!inspectionDate || !inspectionDate.match(/^\d{4}-\d{2}-\d{2}$/)) return;
        
        const year = parseInt(inspectionDate.split('-')[0]);
        if (year < START_YEAR) return;
        
        // Generate UID
        const uid = generateEPCUID(row);
        if (!uid) return;
        
        filteredCount++;
        validUIDCount++;
        
        csvWriter.writeRecords([{
          ...row,
          epc_uid: uid
        }]);
      })
      .on('end', () => {
        console.log(`✅ EPC filtering complete: ${filteredCount.toLocaleString()} records with valid UIDs (${totalProcessed.toLocaleString()} total)`);
        resolve(filteredCount);
      })
      .on('error', reject);
  });
}

async function copyHPIData() {
  console.log('📖 Copying HPI data...');
  
  const outputFile = path.join(ALIGNED_DATA_DIR, 'hpi-regions.csv');
  fs.copyFileSync(HPI_FILE, outputFile);
  
  const lineCount = fs.readFileSync(HPI_FILE, 'utf8').split('\n').length - 1;
  console.log(`✅ HPI data copied: ${lineCount.toLocaleString()} records`);
  
  return lineCount;
}

async function buildUnifiedSample() {
  console.log('📖 Building unified sample with improved matching...');
  
  const outputFile = path.join(ALIGNED_DATA_DIR, 'unified-sample-improved.csv');
  const landRegistryFile = path.join(ALIGNED_DATA_DIR, 'land-registry-clean.csv');
  const epcFile = path.join(ALIGNED_DATA_DIR, 'epc-clean.csv');
  const hpiFile = path.join(ALIGNED_DATA_DIR, 'hpi-regions.csv');
  
  // Load EPC data
  const epcData = new Map();
  await new Promise((resolve, reject) => {
    fs.createReadStream(epcFile)
      .pipe(csv())
      .on('data', (row) => {
        const uid = row.epc_uid;
        if (uid) {
          epcData.set(uid, row);
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded ${epcData.size.toLocaleString()} EPC records with valid UIDs`);
        resolve();
      })
      .on('error', reject);
  });
  
  // Load HPI data
  const hpiData = new Map();
  await new Promise((resolve, reject) => {
    fs.createReadStream(hpiFile)
      .pipe(csv())
      .on('data', (row) => {
        const region = row.regionLabel?.toLowerCase().replace(/\s+/g, '-');
        if (region) {
          if (!hpiData.has(region)) hpiData.set(region, []);
          hpiData.get(region).push({
            date: row.date,
            hpiIndex: parseFloat(row.hpiIndex),
            regionLabel: row.regionLabel
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded HPI data for ${hpiData.size} regions`);
        resolve();
      })
      .on('error', reject);
  });
  
  // Build unified sample
  const csvWriter = createObjectCsvWriter({
    path: outputFile,
    header: [
      { id: 'property_uid', title: 'property_uid' },
      { id: 'transaction_id', title: 'transaction_id' },
      { id: 'price', title: 'price' },
      { id: 'date', title: 'date' },
      { id: 'postcode', title: 'postcode' },
      { id: 'property_type', title: 'property_type' },
      { id: 'county', title: 'county' },
      { id: 'paon', title: 'paon' },
      { id: 'street', title: 'street' },
      { id: 'bedrooms', title: 'bedrooms' },
      { id: 'property_size', title: 'property_size' },
      { id: 'epc_rating', title: 'epc_rating' },
      { id: 'energy_consumption', title: 'energy_consumption' },
      { id: 'heating_cost', title: 'heating_cost' },
      { id: 'hpi_value', title: 'hpi_value' },
      { id: 'hpi_region', title: 'hpi_region' }
    ]
  });
  
  const SAMPLE_SIZE = 500;
  let count = 0;
  let epcMatches = 0;
  let hpiMatches = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(landRegistryFile)
      .pipe(csv())
      .on('data', (row) => {
        if (count >= SAMPLE_SIZE) return;
        
        const uid = row.property_uid;
        const epc = epcData.get(uid) || {};
        const region = row.county?.toLowerCase().replace(/\s+/g, '-');
        const hpiList = hpiData.get(region) || [];
        const latestHPI = hpiList[hpiList.length - 1] || {};
        
        if (epc.NUMBER_HABITABLE_ROOMS) epcMatches++;
        if (latestHPI.hpiIndex) hpiMatches++;
        
        csvWriter.writeRecords([{
          property_uid: uid,
          transaction_id: row.transaction_id,
          price: row.price,
          date: row.date,
          postcode: row.postcode,
          property_type: row.property_type,
          county: row.county,
          paon: row.paon,
          street: row.street,
          bedrooms: epc.NUMBER_HABITABLE_ROOMS,
          property_size: epc.TOTAL_FLOOR_AREA,
          epc_rating: epc.CURRENT_ENERGY_RATING,
          energy_consumption: epc.ENERGY_CONSUMPTION_CURRENT,
          heating_cost: epc.HEATING_COST_CURRENT,
          hpi_value: latestHPI.hpiIndex,
          hpi_region: region
        }]);
        
        count++;
        if (count % 100 === 0) {
          console.log(`  Processed ${count} properties...`);
        }
      })
      .on('end', () => {
        console.log(`✅ Unified sample complete: ${count} properties`);
        console.log(`📊 EPC matches: ${epcMatches} (${(epcMatches/count*100).toFixed(1)}%)`);
        console.log(`📊 HPI matches: ${hpiMatches} (${(hpiMatches/count*100).toFixed(1)}%)`);
        resolve();
      })
      .on('error', reject);
  });
}

async function main() {
  try {
    // Create aligned data directory
    fs.mkdirSync(ALIGNED_DATA_DIR, { recursive: true });
    
    // Check if recent Land Registry file exists
    if (!fs.existsSync(LAND_REGISTRY_FILE)) {
      console.log(`❌ Recent Land Registry file not found: ${LAND_REGISTRY_FILE}`);
      console.log('Please run the download script first: node scripts/download-recent-land-registry-data.js');
      return;
    }
    
    // Filter and clean all datasets
    await filterAndCleanLandRegistryData();
    await filterAndCleanEPCData();
    await copyHPIData();
    
    // Build unified sample
    await buildUnifiedSample();
    
    console.log('\n🎉 Improved aligned dataset complete!');
    console.log(`📁 Data saved to: ${ALIGNED_DATA_DIR}`);
    console.log('📊 Expected much higher EPC matching rates with improved UID logic!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main(); 