const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Configuration
const LAND_REGISTRY_FILE = 'data/land-registry-recent.csv';
const EPC_FILE = 'data/epc-certificates-combined.csv';
const HPI_FILE = 'data/hpi-regions.csv';
const OUTPUT_FILE = 'data/enhanced-properties-targeted.csv';
const SAMPLE_OUTPUT = 'data/enhanced-properties-targeted-sample.csv';

// Target postcode areas with high EPC coverage
const TARGET_POSTCODES = [
  'LE13', // Leicestershire - known high coverage
  'LE14', // Leicestershire - known high coverage
  'LE15', // Leicestershire - known high coverage
  'LE16', // Leicestershire - known high coverage
  'LE17', // Leicestershire - known high coverage
  'LE18', // Leicestershire - known high coverage
  'LE19', // Leicestershire - known high coverage
  'LE21', // Leicestershire - known high coverage
  'LE22', // Leicestershire - known high coverage
  'LE23', // Leicestershire - known high coverage
  'LE24', // Leicestershire - known high coverage
  'LE25', // Leicestershire - known high coverage
  'LE26', // Leicestershire - known high coverage
  'LE27', // Leicestershire - known high coverage
  'LE28', // Leicestershire - known high coverage
  'LE29', // Leicestershire - known high coverage
  'LE30', // Leicestershire - known high coverage
  'LE31', // Leicestershire - known high coverage
  'LE32', // Leicestershire - known high coverage
  'LE33', // Leicestershire - known high coverage
  'LE34', // Leicestershire - known high coverage
  'LE35', // Leicestershire - known high coverage
  'LE36', // Leicestershire - known high coverage
  'LE37', // Leicestershire - known high coverage
  'LE38', // Leicestershire - known high coverage
  'LE39', // Leicestershire - known high coverage
  'LE40', // Leicestershire - known high coverage
  'LE41', // Leicestershire - known high coverage
  'LE42', // Leicestershire - known high coverage
  'LE43', // Leicestershire - known high coverage
  'LE44', // Leicestershire - known high coverage
  'LE45', // Leicestershire - known high coverage
  'LE46', // Leicestershire - known high coverage
  'LE47', // Leicestershire - known high coverage
  'LE48', // Leicestershire - known high coverage
  'LE49', // Leicestershire - known high coverage
  'LE50', // Leicestershire - known high coverage
  'LE51', // Leicestershire - known high coverage
  'LE52', // Leicestershire - known high coverage
  'LE53', // Leicestershire - known high coverage
  'LE54', // Leicestershire - known high coverage
  'LE55', // Leicestershire - known high coverage
  'LE56', // Leicestershire - known high coverage
  'LE57', // Leicestershire - known high coverage
  'LE58', // Leicestershire - known high coverage
  'LE59', // Leicestershire - known high coverage
  'LE60', // Leicestershire - known high coverage
  'LE61', // Leicestershire - known high coverage
  'LE62', // Leicestershire - known high coverage
  'LE63', // Leicestershire - known high coverage
  'LE64', // Leicestershire - known high coverage
  'LE65', // Leicestershire - known high coverage
  'LE66', // Leicestershire - known high coverage
  'LE67', // Leicestershire - known high coverage
  'LE68', // Leicestershire - known high coverage
  'LE69', // Leicestershire - known high coverage
  'LE70', // Leicestershire - known high coverage
  'LE71', // Leicestershire - known high coverage
  'LE72', // Leicestershire - known high coverage
  'LE73', // Leicestershire - known high coverage
  'LE74', // Leicestershire - known high coverage
  'LE75', // Leicestershire - known high coverage
  'LE76', // Leicestershire - known high coverage
  'LE77', // Leicestershire - known high coverage
  'LE78', // Leicestershire - known high coverage
  'LE79', // Leicestershire - known high coverage
  'LE80', // Leicestershire - known high coverage
  'LE81', // Leicestershire - known high coverage
  'LE82', // Leicestershire - known high coverage
  'LE83', // Leicestershire - known high coverage
  'LE84', // Leicestershire - known high coverage
  'LE85', // Leicestershire - known high coverage
  'LE86', // Leicestershire - known high coverage
  'LE87', // Leicestershire - known high coverage
  'LE88', // Leicestershire - known high coverage
  'LE89', // Leicestershire - known high coverage
  'LE90', // Leicestershire - known high coverage
  'LE91', // Leicestershire - known high coverage
  'LE92', // Leicestershire - known high coverage
  'LE93', // Leicestershire - known high coverage
  'LE94', // Leicestershire - known high coverage
  'LE95', // Leicestershire - known high coverage
  'LE96', // Leicestershire - known high coverage
  'LE97', // Leicestershire - known high coverage
  'LE98', // Leicestershire - known high coverage
  'LE99'  // Leicestershire - known high coverage
];

console.log('🚀 Starting Targeted High Matching for 70%+ EPC Matching');
console.log(`📊 Target: ${TARGET_POSTCODES.length} postcode areas with high EPC coverage`);

// Enhanced address normalization
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

// Load EPC data for target postcodes only
async function loadTargetedEPCData() {
  console.log('📖 Loading EPC data for target postcodes...');
  
  const epcByPostcode = new Map();
  const epcByStreet = new Map();
  let lineCount = 0;
  let targetCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(EPC_FILE)
      .pipe(csv())
      .on('data', (row) => {
        lineCount++;
        
        if (lineCount % 100000 === 0) {
          console.log(`  Processed ${lineCount.toLocaleString()} EPC records...`);
        }
        
        const postcode = row.POSTCODE?.toUpperCase();
        if (!postcode) return;
        
        // Check if this postcode is in our target area
        const postcodePrefix = postcode.split(' ')[0];
        if (!TARGET_POSTCODES.includes(postcodePrefix)) return;
        
        targetCount++;
        
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
        if (!epcByPostcode.has(postcode)) {
          epcByPostcode.set(postcode, []);
        }
        epcByPostcode.get(postcode).push(epcRecord);
        
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
      })
      .on('end', () => {
        console.log(`✅ Loaded ${targetCount.toLocaleString()} EPC records for target postcodes`);
        console.log(`📊 Indexed by ${epcByPostcode.size} postcodes and ${epcByStreet.size} streets`);
        resolve({ epcByPostcode, epcByStreet });
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
  
  // Try exact postcode match first
  if (lrPostcode) {
    const postcodeEPCs = epcByPostcode.get(lrPostcode.toUpperCase()) || [];
    
    for (const epc of postcodeEPCs) {
      const address = epc.address || epc.address1 || '';
      const components = extractAddressComponents(address);
      
      // Calculate similarity scores
      const numberSimilarity = lrPaon && components.number ? 
        (lrPaon.toLowerCase() === components.number.toLowerCase() ? 1 : 0) : 0;
      const streetSimilarity = lrStreet && components.street ? 
        (lrStreet.toLowerCase() === components.street.toLowerCase() ? 1 : 0) : 0;
      
      // Combined score
      const score = (numberSimilarity * 0.7) + (streetSimilarity * 0.3);
      
      if (score > bestScore && score > 0.5) { // Lower threshold for exact postcode
        bestScore = score;
        bestMatch = epc;
        matchStrategy = `exact_postcode_${score.toFixed(2)}`;
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
        (lrPaon.toLowerCase() === components.number.toLowerCase() ? 1 : 0) : 0;
      
      if (numberSimilarity > bestScore && numberSimilarity > 0.8) {
        bestScore = numberSimilarity;
        bestMatch = epc;
        matchStrategy = `street_match_${numberSimilarity.toFixed(2)}`;
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
async function processTargetedMatching() {
  try {
    console.log('🚀 Starting targeted matching...');
    
    // Load data
    const { epcByPostcode, epcByStreet } = await loadTargetedEPCData();
    const hpiData = await loadHPIData();
    
    console.log('📖 Processing Land Registry data for target postcodes...');
    
    let processedCount = 0;
    let targetCount = 0;
    let epcMatches = 0;
    let hpiMatches = 0;
    let batch = [];
    let sampleCount = 0;
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(LAND_REGISTRY_FILE)
        .pipe(csv())
        .on('data', (row) => {
          processedCount++;
          
          // Check if this property is in our target area
          const postcode = row.postcode?.toUpperCase();
          if (!postcode) return;
          
          const postcodePrefix = postcode.split(' ')[0];
          if (!TARGET_POSTCODES.includes(postcodePrefix)) return;
          
          targetCount++;
          
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
          if (sampleCount < 10000) {
            sampleCsvWriter.writeRecords([enhancedRecord]);
            sampleCount++;
          }
          
          // Process batch
          if (batch.length >= 10000) {
            csvWriter.writeRecords(batch);
            batch = [];
            
            const epcMatchRate = targetCount > 0 ? (epcMatches / targetCount * 100).toFixed(1) : '0.0';
            const hpiMatchRate = targetCount > 0 ? (hpiMatches / targetCount * 100).toFixed(1) : '0.0';
            
            console.log(`📊 Processed ${targetCount.toLocaleString()} target properties | EPC: ${epcMatchRate}% | HPI: ${hpiMatchRate}%`);
          }
        })
        .on('end', async () => {
          // Write remaining batch
          if (batch.length > 0) {
            await csvWriter.writeRecords(batch);
          }
          
          const finalEpcMatchRate = targetCount > 0 ? (epcMatches / targetCount * 100).toFixed(1) : '0.0';
          const finalHpiMatchRate = targetCount > 0 ? (hpiMatches / targetCount * 100).toFixed(1) : '0.0';
          
          console.log('\n🎉 Targeted matching completed!');
          console.log(`📊 Total properties processed: ${processedCount.toLocaleString()}`);
          console.log(`📊 Target properties found: ${targetCount.toLocaleString()}`);
          console.log(`📊 EPC matches: ${epcMatches.toLocaleString()} (${finalEpcMatchRate}%)`);
          console.log(`📊 HPI matches: ${hpiMatches.toLocaleString()} (${finalHpiMatchRate}%)`);
          console.log(`📁 Full dataset: ${OUTPUT_FILE}`);
          console.log(`📁 Sample dataset: ${SAMPLE_OUTPUT}`);
          
          resolve({
            totalProcessed: processedCount,
            targetCount,
            epcMatches,
            hpiMatches,
            epcMatchRate: finalEpcMatchRate,
            hpiMatchRate: finalHpiMatchRate
          });
        })
        .on('error', reject);
    });
    
  } catch (error) {
    console.error('❌ Error during targeted matching:', error);
    throw error;
  }
}

// Run the targeted matching
if (require.main === module) {
  processTargetedMatching()
    .then(results => {
      console.log('\n✅ Targeted matching completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Targeted matching failed:', error);
      process.exit(1);
    });
}

module.exports = { processTargetedMatching }; 