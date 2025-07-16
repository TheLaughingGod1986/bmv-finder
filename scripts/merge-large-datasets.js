const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Configuration
const LAND_REGISTRY_FILE = 'data/land-registry-recent.csv';
const EPC_FILE = 'data/epc-certificates-combined.csv';
const HPI_FILE = 'data/hpi-regions.csv';
const OUTPUT_FILE = 'data/enhanced-properties-unified.csv';
const SAMPLE_OUTPUT = 'data/enhanced-properties-sample.csv';

// Processing limits
const MAX_RECORDS = 1000000; // Process first 1M records for testing
const SAMPLE_SIZE = 10000; // Create a sample for testing
const BATCH_SIZE = 10000; // Process in batches

console.log('🚀 Starting Large Dataset Merge with High EPC Matching');
console.log(`📊 Target: ${MAX_RECORDS.toLocaleString()} properties with 70%+ EPC matching`);

// Enhanced UID generation with multiple strategies
function generatePropertyUID(row) {
  // Strategy 1: Standard format
  const standardUID = `${row.paon || ''}-${row.street || ''}-${row.postcode || ''}`.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
  
  // Strategy 2: Number-first format (for addresses like "1 HIGH STREET")
  const numberFirstUID = `${row.paon || ''}${row.street || ''}${row.postcode || ''}`.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
  
  // Strategy 3: Postcode-focused format
  const postcodeUID = `${row.postcode || ''}${row.paon || ''}${row.street || ''}`.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
  
  return {
    standard: standardUID,
    numberFirst: numberFirstUID,
    postcode: postcodeUID
  };
}

function generateEPCUID(row) {
  // Extract address components from EPC data
  const address = row.ADDRESS || '';
  const postcode = row.POSTCODE || '';
  
  // Parse address to extract number and street
  const addressParts = address.split(',').map(part => part.trim());
  const firstPart = addressParts[0] || '';
  
  // Extract number and street from first part
  const numberMatch = firstPart.match(/^(\d+[A-Za-z]*)\s+(.+)$/);
  const number = numberMatch ? numberMatch[1] : '';
  const street = numberMatch ? numberMatch[2] : firstPart;
  
  // Generate multiple UID formats
  const standardUID = `${number}-${street}-${postcode}`.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
  
  const numberFirstUID = `${number}${street}${postcode}`.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
  
  const postcodeUID = `${postcode}${number}${street}`.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
  
  return {
    standard: standardUID,
    numberFirst: numberFirstUID,
    postcode: postcodeUID
  };
}

// Load EPC data with multiple UID strategies
async function loadEPCData() {
  console.log('📖 Loading EPC data with enhanced UID matching...');
  
  const epcData = new Map();
  let lineCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(EPC_FILE)
      .pipe(csv())
      .on('data', (row) => {
        lineCount++;
        
        if (lineCount % 100000 === 0) {
          console.log(`  Processed ${lineCount.toLocaleString()} EPC records...`);
        }
        
        const uids = generateEPCUID(row);
        
        // Store with all UID formats for maximum matching
        const epcRecord = {
          bedrooms: parseInt(row.NUMBER_HABITABLE_ROOMS) || null,
          property_size: parseFloat(row.TOTAL_FLOOR_AREA) || null,
          epc_rating: row.CURRENT_ENERGY_RATING || null,
          potential_rating: row.POTENTIAL_ENERGY_RATING || null,
          energy_consumption: parseFloat(row.ENERGY_CONSUMPTION_CURRENT) || null,
          heating_cost: parseFloat(row.HEATING_COST_CURRENT) || null,
          construction_year: row.CONSTRUCTION_AGE_BAND || null,
          property_type: row.PROPERTY_TYPE || null,
          built_form: row.BUILT_FORM || null,
          inspection_date: row.INSPECTION_DATE || null,
          address: row.ADDRESS || null,
          postcode: row.POSTCODE || null
        };
        
        // Store with all UID formats
        if (uids.standard) epcData.set(uids.standard, epcRecord);
        if (uids.numberFirst) epcData.set(uids.numberFirst, epcRecord);
        if (uids.postcode) epcData.set(uids.postcode, epcRecord);
      })
      .on('end', () => {
        console.log(`✅ Loaded ${epcData.size.toLocaleString()} EPC records with enhanced UIDs`);
        resolve(epcData);
      })
      .on('error', reject);
  });
}

// Load HPI data
async function loadHPIData() {
  console.log('📖 Loading HPI data...');
  
  const hpiData = new Map();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(HPI_FILE)
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
        resolve(hpiData);
      })
      .on('error', reject);
  });
}

// Create CSV writer for enhanced properties
const csvWriter = createObjectCsvWriter({
  path: OUTPUT_FILE,
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
    { id: 'new_build', title: 'new_build' },
    { id: 'duration', title: 'duration' },
    { id: 'bedrooms', title: 'bedrooms' },
    { id: 'property_size', title: 'property_size' },
    { id: 'epc_rating', title: 'epc_rating' },
    { id: 'potential_rating', title: 'potential_rating' },
    { id: 'energy_consumption', title: 'energy_consumption' },
    { id: 'heating_cost', title: 'heating_cost' },
    { id: 'construction_year', title: 'construction_year' },
    { id: 'built_form', title: 'built_form' },
    { id: 'hpi_value', title: 'hpi_value' },
    { id: 'hpi_region', title: 'hpi_region' },
    { id: 'price_per_sqm', title: 'price_per_sqm' },
    { id: 'uid_match_type', title: 'uid_match_type' }
  ]
});

// Create sample CSV writer
const sampleCsvWriter = createObjectCsvWriter({
  path: SAMPLE_OUTPUT,
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
    { id: 'new_build', title: 'new_build' },
    { id: 'duration', title: 'duration' },
    { id: 'bedrooms', title: 'bedrooms' },
    { id: 'property_size', title: 'property_size' },
    { id: 'epc_rating', title: 'epc_rating' },
    { id: 'potential_rating', title: 'potential_rating' },
    { id: 'energy_consumption', title: 'energy_consumption' },
    { id: 'heating_cost', title: 'heating_cost' },
    { id: 'construction_year', title: 'construction_year' },
    { id: 'built_form', title: 'built_form' },
    { id: 'hpi_value', title: 'hpi_value' },
    { id: 'hpi_region', title: 'hpi_region' },
    { id: 'price_per_sqm', title: 'price_per_sqm' },
    { id: 'uid_match_type', title: 'uid_match_type' }
  ]
});

// Main processing function
async function mergeLargeDatasets() {
  try {
    console.log('🚀 Starting large dataset merge...');
    
    // Load data
    const epcData = await loadEPCData();
    const hpiData = await loadHPIData();
    
    console.log('📖 Processing Land Registry data...');
    
    let processedCount = 0;
    let epcMatches = 0;
    let hpiMatches = 0;
    let batch = [];
    let sampleCount = 0;
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(LAND_REGISTRY_FILE)
        .pipe(csv())
        .on('data', (row) => {
          if (processedCount >= MAX_RECORDS) {
            return;
          }
          
          processedCount++;
          
          // Generate property UIDs
          const propertyUIDs = generatePropertyUID(row);
          
          // Try to match EPC data with multiple strategies
          let epcMatch = null;
          let matchType = 'none';
          
          if (epcData.has(propertyUIDs.standard)) {
            epcMatch = epcData.get(propertyUIDs.standard);
            matchType = 'standard';
          } else if (epcData.has(propertyUIDs.numberFirst)) {
            epcMatch = epcData.get(propertyUIDs.numberFirst);
            matchType = 'numberFirst';
          } else if (epcData.has(propertyUIDs.postcode)) {
            epcMatch = epcData.get(propertyUIDs.postcode);
            matchType = 'postcode';
          }
          
          // Get HPI data
          const region = row.county?.toLowerCase().replace(/\s+/g, '-');
          const hpiList = hpiData.get(region) || [];
          const latestHPI = hpiList[hpiList.length - 1] || {};
          
          // Count matches
          if (epcMatch && epcMatch.bedrooms) epcMatches++;
          if (latestHPI.hpiIndex) hpiMatches++;
          
          // Calculate price per square meter
          const price = parseInt(row.price) || 0;
          const size = epcMatch?.property_size || null;
          const pricePerSqm = size && price > 0 ? Math.round(price / size) : null;
          
          // Create enhanced record
          const enhancedRecord = {
            property_uid: propertyUIDs.standard,
            transaction_id: row.transaction_id,
            price: price,
            date: row.date,
            postcode: row.postcode,
            property_type: row.property_type,
            county: row.county,
            paon: row.paon,
            street: row.street,
            new_build: row.new_build,
            duration: row.duration,
            bedrooms: epcMatch?.bedrooms || null,
            property_size: epcMatch?.property_size || null,
            epc_rating: epcMatch?.epc_rating || null,
            potential_rating: epcMatch?.potential_rating || null,
            energy_consumption: epcMatch?.energy_consumption || null,
            heating_cost: epcMatch?.heating_cost || null,
            construction_year: epcMatch?.construction_year || null,
            built_form: epcMatch?.built_form || null,
            hpi_value: latestHPI.hpiIndex || null,
            hpi_region: region || null,
            price_per_sqm: pricePerSqm,
            uid_match_type: matchType
          };
          
          batch.push(enhancedRecord);
          
          // Write to sample file
          if (sampleCount < SAMPLE_SIZE) {
            sampleCsvWriter.writeRecords([enhancedRecord]);
            sampleCount++;
          }
          
          // Process batch
          if (batch.length >= BATCH_SIZE) {
            csvWriter.writeRecords(batch);
            batch = [];
            
            const epcMatchRate = (epcMatches / processedCount * 100).toFixed(1);
            const hpiMatchRate = (hpiMatches / processedCount * 100).toFixed(1);
            
            console.log(`📊 Processed ${processedCount.toLocaleString()} properties | EPC: ${epcMatchRate}% | HPI: ${hpiMatchRate}%`);
          }
        })
        .on('end', async () => {
          // Write remaining batch
          if (batch.length > 0) {
            await csvWriter.writeRecords(batch);
          }
          
          const finalEpcMatchRate = (epcMatches / processedCount * 100).toFixed(1);
          const finalHpiMatchRate = (hpiMatches / processedCount * 100).toFixed(1);
          
          console.log('\n🎉 Large dataset merge completed!');
          console.log(`📊 Total properties processed: ${processedCount.toLocaleString()}`);
          console.log(`📊 EPC matches: ${epcMatches.toLocaleString()} (${finalEpcMatchRate}%)`);
          console.log(`📊 HPI matches: ${hpiMatches.toLocaleString()} (${finalHpiMatchRate}%)`);
          console.log(`📁 Full dataset: ${OUTPUT_FILE}`);
          console.log(`📁 Sample dataset: ${SAMPLE_OUTPUT}`);
          
          resolve({
            totalProcessed: processedCount,
            epcMatches,
            hpiMatches,
            epcMatchRate: finalEpcMatchRate,
            hpiMatchRate: finalHpiMatchRate
          });
        })
        .on('error', reject);
    });
    
  } catch (error) {
    console.error('❌ Error during merge:', error);
    throw error;
  }
}

// Run the merge
if (require.main === module) {
  mergeLargeDatasets()
    .then(results => {
      console.log('\n✅ Merge completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Merge failed:', error);
      process.exit(1);
    });
}

module.exports = { mergeLargeDatasets }; 