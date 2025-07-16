const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Configuration
const LAND_REGISTRY_FILE = 'data/land-registry-recent.csv';
const EPC_FILE = 'data/epc-certificates-combined.csv';
const HPI_FILE = 'data/hpi-regions.csv';
const OUTPUT_FILE = 'data/enhanced-properties-advanced.csv';
const SAMPLE_OUTPUT = 'data/enhanced-properties-advanced-sample.csv';

// Processing limits
const MAX_RECORDS = 500000; // Process first 500K records for testing
const SAMPLE_SIZE = 10000; // Create a sample for testing
const BATCH_SIZE = 10000; // Process in batches

console.log('🚀 Starting Advanced Address Matching for High EPC Matching');
console.log(`📊 Target: ${MAX_RECORDS.toLocaleString()} properties with 70%+ EPC matching`);

// Advanced address normalization and matching
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

function generateMatchingKeys(landRegistryRow, epcRow) {
  const keys = [];
  
  // Land Registry components
  const lrPaon = landRegistryRow.paon || '';
  const lrStreet = landRegistryRow.street || '';
  const lrPostcode = landRegistryRow.postcode || '';
  
  // EPC components
  const epcAddress = epcRow.ADDRESS || '';
  const epcPostcode = epcRow.POSTCODE || '';
  
  // Extract components from EPC address
  const epcComponents = extractAddressComponents(epcAddress);
  
  // Strategy 1: Exact postcode + number + street match
  if (lrPostcode && epcPostcode && lrPostcode.toLowerCase() === epcPostcode.toLowerCase()) {
    const key1 = `${lrPaon}-${lrStreet}-${lrPostcode}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    const key2 = `${epcComponents.number}-${epcComponents.street}-${epcPostcode}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    keys.push({ key1, key2, strategy: 'exact' });
  }
  
  // Strategy 2: Postcode + street match (ignoring number variations)
  if (lrPostcode && epcPostcode && lrPostcode.toLowerCase() === epcPostcode.toLowerCase()) {
    const key1 = `${lrStreet}-${lrPostcode}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    const key2 = `${epcComponents.street}-${epcPostcode}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    keys.push({ key1, key2, strategy: 'street' });
  }
  
  // Strategy 3: Number + street match (ignoring postcode)
  if (lrPaon && epcComponents.number) {
    const key1 = `${lrPaon}-${lrStreet}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    const key2 = `${epcComponents.number}-${epcComponents.street}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    keys.push({ key1, key2, strategy: 'number_street' });
  }
  
  // Strategy 4: Fuzzy street name matching
  if (lrStreet && epcComponents.street) {
    const key1 = lrStreet.toLowerCase().replace(/[^a-z0-9]/g, '');
    const key2 = epcComponents.street.toLowerCase().replace(/[^a-z0-9]/g, '');
    keys.push({ key1, key2, strategy: 'fuzzy' });
  }
  
  return keys;
}

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (s1 === s2) return 1;
  
  // Simple similarity calculation
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Load EPC data with advanced indexing
async function loadEPCData() {
  console.log('📖 Loading EPC data with advanced indexing...');
  
  const epcData = new Map();
  const epcByPostcode = new Map();
  const epcByStreet = new Map();
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
        const postcode = row.POSTCODE?.toLowerCase();
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
        
        // Store full record
        epcData.set(lineCount.toString(), epcRecord);
      })
      .on('end', () => {
        console.log(`✅ Loaded ${epcData.size.toLocaleString()} EPC records with advanced indexing`);
        console.log(`📊 Indexed by ${epcByPostcode.size} postcodes and ${epcByStreet.size} streets`);
        resolve({ epcData, epcByPostcode, epcByStreet });
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

// Find best EPC match for a property
function findBestEPCMatch(landRegistryRow, epcByPostcode, epcByStreet) {
  const lrPaon = landRegistryRow.paon || '';
  const lrStreet = landRegistryRow.street || '';
  const lrPostcode = landRegistryRow.postcode || '';
  
  let bestMatch = null;
  let bestScore = 0;
  let matchStrategy = 'none';
  
  // Try postcode-based matching first
  if (lrPostcode) {
    const postcodeEPCs = epcByPostcode.get(lrPostcode.toLowerCase()) || [];
    
    for (const epc of postcodeEPCs) {
      const address = epc.address || epc.address1 || '';
      const components = extractAddressComponents(address);
      
      // Calculate similarity scores
      const numberSimilarity = lrPaon && components.number ? 
        calculateSimilarity(lrPaon, components.number) : 0;
      const streetSimilarity = lrStreet && components.street ? 
        calculateSimilarity(lrStreet, components.street) : 0;
      
      // Combined score
      const score = (numberSimilarity * 0.6) + (streetSimilarity * 0.4);
      
      if (score > bestScore && score > 0.7) { // Require 70% similarity
        bestScore = score;
        bestMatch = epc;
        matchStrategy = `postcode_${score.toFixed(2)}`;
      }
    }
  }
  
  // Try street-based matching if no good postcode match
  if (!bestMatch && lrStreet) {
    const streetEPCs = epcByStreet.get(lrStreet.toLowerCase()) || [];
    
    for (const epc of streetEPCs) {
      const address = epc.address || epc.address1 || '';
      const components = extractAddressComponents(address);
      
      const numberSimilarity = lrPaon && components.number ? 
        calculateSimilarity(lrPaon, components.number) : 0;
      
      if (numberSimilarity > bestScore && numberSimilarity > 0.8) { // Higher threshold for street-only
        bestScore = numberSimilarity;
        bestMatch = epc;
        matchStrategy = `street_${numberSimilarity.toFixed(2)}`;
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
async function processWithAdvancedMatching() {
  try {
    console.log('🚀 Starting advanced address matching...');
    
    // Load data
    const { epcData, epcByPostcode, epcByStreet } = await loadEPCData();
    const hpiData = await loadHPIData();
    
    console.log('📖 Processing Land Registry data with advanced matching...');
    
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
          const epcMatch = findBestEPCMatch(row, epcByPostcode, epcByStreet);
          
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
          
          console.log('\n🎉 Advanced address matching completed!');
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
    console.error('❌ Error during advanced matching:', error);
    throw error;
  }
}

// Run the advanced matching
if (require.main === module) {
  processWithAdvancedMatching()
    .then(results => {
      console.log('\n✅ Advanced matching completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Advanced matching failed:', error);
      process.exit(1);
    });
}

module.exports = { processWithAdvancedMatching }; 