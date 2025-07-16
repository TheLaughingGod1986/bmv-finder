const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Configuration
const LAND_REGISTRY_FILE = 'data/land-registry-recent.csv';
const EPC_FILE = 'data/epc-certificates-combined.csv';
const HPI_FILE = 'data/hpi-regions.csv';
const OUTPUT_FILE = 'data/enhanced-properties-final.csv';
const SAMPLE_OUTPUT = 'data/enhanced-properties-final-sample.csv';

// Processing limits - focus on quality over quantity
const MAX_RECORDS = 1000000; // Process first 1M records
const SAMPLE_SIZE = 50000; // Create a larger sample for testing
const BATCH_SIZE = 10000; // Process in batches

console.log('🚀 Starting Final High-Quality Merge for 70%+ EPC Matching');
console.log(`📊 Target: ${MAX_RECORDS.toLocaleString()} properties with maximum EPC matching`);

// Enhanced address normalization and matching
function normalizeAddress(address) {
  if (!address) return '';
  
  return address.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function extractAddressComponents(address) {
  if (!address) return { number: '', street: '', rest: '' };
  
  const normalized = normalizeAddress(address);
  
  // Try to extract number and street
  const numberMatch = normalized.match(/^(\d+[a-z]*)\s+(.+)$/);
  if (numberMatch) {
    return {
      number: numberMatch[1],
      street: numberMatch[2],
      rest: ''
    };
  }
  
  // Handle addresses without numbers
  return {
    number: '',
    street: normalized,
    rest: ''
  };
}

// Load EPC data with comprehensive indexing
async function loadEPCData() {
  console.log('📖 Loading EPC data with comprehensive indexing...');
  
  const epcByPostcode = new Map();
  const epcByStreet = new Map();
  const epcByNumber = new Map();
  const epcByAddress = new Map();
  let lineCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(EPC_FILE)
      .pipe(csv())
      .on('data', (row) => {
        lineCount++;
        
        if (lineCount % 100000 === 0) {
          console.log(`  Processed ${lineCount.toLocaleString()} EPC records...`);
        }
        
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
          postcode: row.POSTCODE || null,
          address1: row.ADDRESS1 || null,
          address2: row.ADDRESS2 || null,
          address3: row.ADDRESS3 || null
        };
        
        // Index by postcode
        const postcode = row.POSTCODE?.toUpperCase();
        if (postcode) {
          if (!epcByPostcode.has(postcode)) {
            epcByPostcode.set(postcode, []);
          }
          epcByPostcode.get(postcode).push(epcRecord);
        }
        
        // Index by street name
        const address = row.ADDRESS || row.ADDRESS1 || '';
        const components = extractAddressComponents(address);
        const street = components.street;
        if (street) {
          if (!epcByStreet.has(street)) {
            epcByStreet.set(street, []);
          }
          epcByStreet.get(street).push(epcRecord);
        }
        
        // Index by number
        const number = components.number;
        if (number) {
          if (!epcByNumber.has(number)) {
            epcByNumber.set(number, []);
          }
          epcByNumber.get(number).push(epcRecord);
        }
        
        // Index by full address
        const fullAddress = normalizeAddress(address);
        if (fullAddress) {
          if (!epcByAddress.has(fullAddress)) {
            epcByAddress.set(fullAddress, []);
          }
          epcByAddress.get(fullAddress).push(epcRecord);
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded ${lineCount.toLocaleString()} EPC records with comprehensive indexing`);
        console.log(`📊 Indexed by ${epcByPostcode.size} postcodes, ${epcByStreet.size} streets, ${epcByNumber.size} numbers, and ${epcByAddress.size} addresses`);
        resolve({ epcByPostcode, epcByStreet, epcByNumber, epcByAddress });
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

// Find best EPC match using multiple strategies
function findBestEPCMatch(landRegistryRow, epcByPostcode, epcByStreet, epcByNumber, epcByAddress) {
  const lrPaon = landRegistryRow.paon || '';
  const lrStreet = landRegistryRow.street || '';
  const lrPostcode = landRegistryRow.postcode || '';
  
  let bestMatch = null;
  let bestScore = 0;
  let matchStrategy = 'none';
  
  // Strategy 1: Exact postcode + number + street match
  if (lrPostcode && lrPaon && lrStreet) {
    const postcodeEPCs = epcByPostcode.get(lrPostcode.toUpperCase()) || [];
    
    for (const epc of postcodeEPCs) {
      const address = epc.address || epc.address1 || '';
      const components = extractAddressComponents(address);
      
      const numberMatch = lrPaon.toLowerCase() === components.number.toLowerCase();
      const streetMatch = lrStreet.toLowerCase() === components.street.toLowerCase();
      
      if (numberMatch && streetMatch) {
        bestMatch = epc;
        bestScore = 1.0;
        matchStrategy = 'exact_postcode_number_street';
        break;
      }
    }
  }
  
  // Strategy 2: Exact postcode + number match
  if (!bestMatch && lrPostcode && lrPaon) {
    const postcodeEPCs = epcByPostcode.get(lrPostcode.toUpperCase()) || [];
    
    for (const epc of postcodeEPCs) {
      const address = epc.address || epc.address1 || '';
      const components = extractAddressComponents(address);
      
      const numberMatch = lrPaon.toLowerCase() === components.number.toLowerCase();
      
      if (numberMatch) {
        bestMatch = epc;
        bestScore = 0.9;
        matchStrategy = 'exact_postcode_number';
        break;
      }
    }
  }
  
  // Strategy 3: Exact postcode + street match
  if (!bestMatch && lrPostcode && lrStreet) {
    const postcodeEPCs = epcByPostcode.get(lrPostcode.toUpperCase()) || [];
    
    for (const epc of postcodeEPCs) {
      const address = epc.address || epc.address1 || '';
      const components = extractAddressComponents(address);
      
      const streetMatch = lrStreet.toLowerCase() === components.street.toLowerCase();
      
      if (streetMatch) {
        bestMatch = epc;
        bestScore = 0.8;
        matchStrategy = 'exact_postcode_street';
        break;
      }
    }
  }
  
  // Strategy 4: Street + number match (any postcode)
  if (!bestMatch && lrStreet && lrPaon) {
    const streetEPCs = epcByStreet.get(lrStreet.toLowerCase()) || [];
    
    for (const epc of streetEPCs) {
      const address = epc.address || epc.address1 || '';
      const components = extractAddressComponents(address);
      
      const numberMatch = lrPaon.toLowerCase() === components.number.toLowerCase();
      
      if (numberMatch) {
        bestMatch = epc;
        bestScore = 0.7;
        matchStrategy = 'street_number';
        break;
      }
    }
  }
  
  // Strategy 5: Number match in same postcode area
  if (!bestMatch && lrPaon && lrPostcode) {
    const numberEPCs = epcByNumber.get(lrPaon.toLowerCase()) || [];
    
    for (const epc of numberEPCs) {
      const epcPostcode = epc.postcode?.toUpperCase();
      if (epcPostcode && epcPostcode.startsWith(lrPostcode.split(' ')[0])) {
        bestMatch = epc;
        bestScore = 0.6;
        matchStrategy = 'number_same_area';
        break;
      }
    }
  }
  
  return { match: bestMatch, score: bestScore, strategy: matchStrategy };
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
    { id: 'match_score', title: 'match_score' },
    { id: 'match_strategy', title: 'match_strategy' }
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
    { id: 'match_score', title: 'match_score' },
    { id: 'match_strategy', title: 'match_strategy' }
  ]
});

// Main processing function
async function processFinalMerge() {
  try {
    console.log('🚀 Starting final high-quality merge...');
    
    // Load data
    const { epcByPostcode, epcByStreet, epcByNumber, epcByAddress } = await loadEPCData();
    const hpiData = await loadHPIData();
    
    console.log('📖 Processing Land Registry data with final matching...');
    
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
          
          // Find best EPC match
          const epcMatch = findBestEPCMatch(row, epcByPostcode, epcByStreet, epcByNumber, epcByAddress);
          
          // Get HPI data
          const region = row.county?.toLowerCase().replace(/\s+/g, '-');
          const hpiList = hpiData.get(region) || [];
          const latestHPI = hpiList[hpiList.length - 1] || {};
          
          // Count matches
          if (epcMatch.match && epcMatch.match.bedrooms) epcMatches++;
          if (latestHPI.hpiIndex) hpiMatches++;
          
          // Calculate price per square meter
          const price = parseInt(row.price) || 0;
          const size = epcMatch.match?.property_size || null;
          const pricePerSqm = size && price > 0 ? Math.round(price / size) : null;
          
          // Create property UID
          const propertyUID = `${row.paon || ''}-${row.street || ''}-${row.postcode || ''}`.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .replace(/\s+/g, '');
          
          // Create enhanced record
          const enhancedRecord = {
            property_uid: propertyUID,
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
            bedrooms: epcMatch.match?.bedrooms || null,
            property_size: epcMatch.match?.property_size || null,
            epc_rating: epcMatch.match?.epc_rating || null,
            potential_rating: epcMatch.match?.potential_rating || null,
            energy_consumption: epcMatch.match?.energy_consumption || null,
            heating_cost: epcMatch.match?.heating_cost || null,
            construction_year: epcMatch.match?.construction_year || null,
            built_form: epcMatch.match?.built_form || null,
            hpi_value: latestHPI.hpiIndex || null,
            hpi_region: region || null,
            price_per_sqm: pricePerSqm,
            match_score: epcMatch.score || 0,
            match_strategy: epcMatch.strategy || 'none'
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
          
          console.log('\n🎉 Final high-quality merge completed!');
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
    console.error('❌ Error during final merge:', error);
    throw error;
  }
}

// Run the final merge
if (require.main === module) {
  processFinalMerge()
    .then(results => {
      console.log('\n✅ Final merge completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Final merge failed:', error);
      process.exit(1);
    });
}

module.exports = { processFinalMerge }; 