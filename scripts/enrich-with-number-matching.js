const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');

/**
 * Advanced Number-Based Property Enrichment
 * 
 * This script focuses on matching postcode + address number (PAON)
 * with advanced normalization to achieve much higher enrichment rates.
 */

async function enrichWithNumberMatching({
  propertiesPath = 'pp-complete-cleaned.csv',
  epcPath = 'data/epc-certificates-combined.csv',
  outputPath = 'properties-enhanced-number-match.csv',
  batchSize = 10000
} = {}) {
  console.log('🚀 Starting number-based enrichment process...');
  console.log(`📁 Properties: ${propertiesPath}`);
  console.log(`📁 EPC Data: ${epcPath}`);
  console.log(`📁 Output: ${outputPath}`);

  // Step 1: Build EPC lookup by postcode + number
  console.log('\n📖 Loading EPC data into memory...');
  const epcByPostcodeNumber = new Map();
  const epcByPostcode = new Map();
  let epcCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(epcPath)
      .pipe(csv())
      .on('data', (row) => {
        const address = row.ADDRESS || row.ADDRESS1;
        const postcode = row.POSTCODE;
        
        if (address && postcode) {
          // Extract number from EPC address
          const number = extractNumberFromAddress(address);
          const normalizedPostcode = normalizePostcode(postcode);
          
          if (number && normalizedPostcode) {
            const key = `${normalizedPostcode}|${number}`;
            epcByPostcodeNumber.set(key, {
              bedrooms: row.NUMBER_HABITABLE_ROOMS || '',
              property_size: row.TOTAL_FLOOR_AREA || '',
              epc_rating: row.CURRENT_ENERGY_RATING || '',
              address: address,
              postcode: postcode,
              number: number
            });
            epcCount++;
          }
          
          // Also store by postcode for fallback
          if (!epcByPostcode.has(normalizedPostcode)) {
            epcByPostcode.set(normalizedPostcode, []);
          }
          epcByPostcode.get(normalizedPostcode).push({
            bedrooms: row.NUMBER_HABITABLE_ROOMS || '',
            property_size: row.TOTAL_FLOOR_AREA || '',
            epc_rating: row.CURRENT_ENERGY_RATING || '',
            address: address,
            postcode: postcode
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded EPC data for ${epcCount.toLocaleString()} postcode+number combinations`);
        console.log(`✅ Loaded EPC data for ${epcByPostcode.size.toLocaleString()} postcodes`);
        processProperties();
      })
      .on('error', reject);

    function processProperties() {
      console.log('\n🔄 Processing properties with number matching...');
      let processedCount = 0;
      let exactMatches = 0;
      let postcodeMatches = 0;
      let noMatches = 0;
      let batchCount = 0;
      
      const outputStream = fs.createWriteStream(outputPath);
      const csvStream = fastcsv.format();
      csvStream.pipe(outputStream);

      fs.createReadStream(propertiesPath)
        .pipe(fastcsv.parse({ headers: false }))
        .on('data', (rowArr) => {
          // Properties file columns: GUID, price, date, postcode, property_type, new_build, estate_type, 
          // transaction_id, paon, street, locality, town_city, district, county, transaction_category, record_status
          const postcode = (rowArr[3] || '').trim().toUpperCase();
          const paon = (rowArr[8] || '').trim();
          
          let enrichment = { bedrooms: '', property_size: '', epc_rating: '' };
          let matchType = 'none';
          
          if (postcode && paon) {
            const normalizedPostcode = normalizePostcode(postcode);
            const normalizedNumber = normalizeNumber(paon);
            
            if (normalizedNumber && normalizedPostcode) {
              // Try exact postcode + number match
              const key = `${normalizedPostcode}|${normalizedNumber}`;
              if (epcByPostcodeNumber.has(key)) {
                enrichment = epcByPostcodeNumber.get(key);
                matchType = 'exact';
                exactMatches++;
              } else {
                // Try postcode-only match as fallback
                if (epcByPostcode.has(normalizedPostcode)) {
                  const epcList = epcByPostcode.get(normalizedPostcode);
                  if (epcList.length > 0) {
                    enrichment = epcList[0]; // Take first match
                    matchType = 'postcode';
                    postcodeMatches++;
                  }
                }
              }
            }
          }
          
          if (matchType === 'none') {
            noMatches++;
          }

          // Output enriched row (append new columns)
          csvStream.write([...rowArr, enrichment.bedrooms, enrichment.property_size, enrichment.epc_rating, matchType]);
          
          processedCount++;
          if (processedCount % batchSize === 0) {
            batchCount++;
            const totalEnriched = exactMatches + postcodeMatches;
            const enrichmentRate = ((totalEnriched / processedCount) * 100).toFixed(2);
            console.log(`📊 Batch ${batchCount}: ${processedCount.toLocaleString()} processed, ${totalEnriched.toLocaleString()} enriched (${enrichmentRate}%)`);
          }
        })
        .on('end', () => {
          csvStream.end();
          const totalEnriched = exactMatches + postcodeMatches;
          const finalEnrichmentRate = ((totalEnriched / processedCount) * 100).toFixed(2);
          
          console.log('\n🎉 Number-based enrichment complete!');
          console.log(`📈 Total processed: ${processedCount.toLocaleString()}`);
          console.log(`✨ Total enriched: ${totalEnriched.toLocaleString()} (${finalEnrichmentRate}%)`);
          console.log(`🎯 Exact postcode+number matches: ${exactMatches.toLocaleString()} (${((exactMatches/processedCount)*100).toFixed(2)}%)`);
          console.log(`📮 Postcode-only matches: ${postcodeMatches.toLocaleString()} (${((postcodeMatches/processedCount)*100).toFixed(2)}%)`);
          console.log(`❌ No matches: ${noMatches.toLocaleString()} (${((noMatches/processedCount)*100).toFixed(2)}%)`);
          console.log(`💾 Output saved to: ${outputPath}`);
          resolve();
        })
        .on('error', reject);
    }
  });
}

/**
 * Extract number from address string
 */
function extractNumberFromAddress(address) {
  if (!address) return null;
  
  // Remove common words and punctuation
  let cleanAddress = address
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Try to extract number at the beginning
  const numberMatch = cleanAddress.match(/^(\d+[A-Za-z]?)/);
  if (numberMatch) {
    return normalizeNumber(numberMatch[1]);
  }
  
  // Try to find number anywhere in the address
  const anyNumberMatch = cleanAddress.match(/(\d+[A-Za-z]?)/);
  if (anyNumberMatch) {
    return normalizeNumber(anyNumberMatch[1]);
  }
  
  return null;
}

/**
 * Normalize postcode
 */
function normalizePostcode(postcode) {
  if (!postcode) return null;
  
  // Remove spaces and convert to uppercase
  return postcode.replace(/\s/g, '').toUpperCase();
}

/**
 * Normalize number (PAON)
 */
function normalizeNumber(number) {
  if (!number) return null;
  
  // Convert to string and clean
  let cleanNumber = String(number)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // Remove special characters
  
  // Handle common variations
  if (cleanNumber === '') return null;
  
  // Normalize common abbreviations
  cleanNumber = cleanNumber
    .replace(/^flat\s*/, '')
    .replace(/^apartment\s*/, '')
    .replace(/^apt\s*/, '');
  
  return cleanNumber;
}

/**
 * Analyze address patterns to understand matching issues
 */
async function analyzeAddressPatterns() {
  console.log('\n🔍 Analyzing address patterns...');
  
  const propertiesPath = 'pp-complete-cleaned.csv';
  const epcPath = 'data/epc-certificates-combined.csv';
  
  const propertyNumbers = new Set();
  const epcNumbers = new Set();
  const propertyPostcodes = new Set();
  const epcPostcodes = new Set();
  
  // Analyze properties data
  await new Promise((resolve, reject) => {
    fs.createReadStream(propertiesPath)
      .pipe(fastcsv.parse({ headers: false }))
      .on('data', (rowArr) => {
        const postcode = (rowArr[3] || '').trim().toUpperCase();
        const paon = (rowArr[8] || '').trim();
        
        if (postcode) propertyPostcodes.add(postcode);
        if (paon) {
          const number = normalizeNumber(paon);
          if (number) propertyNumbers.add(number);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  // Analyze EPC data
  await new Promise((resolve, reject) => {
    fs.createReadStream(epcPath)
      .pipe(csv())
      .on('data', (row) => {
        const address = row.ADDRESS || row.ADDRESS1;
        const postcode = row.POSTCODE;
        
        if (postcode) epcPostcodes.add(normalizePostcode(postcode));
        if (address) {
          const number = extractNumberFromAddress(address);
          if (number) epcNumbers.add(number);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log('\n📊 Address Pattern Analysis:');
  console.log(`🏠 Unique property numbers: ${propertyNumbers.size.toLocaleString()}`);
  console.log(`📋 Unique EPC numbers: ${epcNumbers.size.toLocaleString()}`);
  console.log(`📮 Unique property postcodes: ${propertyPostcodes.size.toLocaleString()}`);
  console.log(`📮 Unique EPC postcodes: ${epcPostcodes.size.toLocaleString()}`);
  
  // Find overlap
  const commonPostcodes = new Set([...propertyPostcodes].filter(x => epcPostcodes.has(x)));
  console.log(`🎯 Common postcodes: ${commonPostcodes.size.toLocaleString()}`);
  
  const commonNumbers = new Set([...propertyNumbers].filter(x => epcNumbers.has(x)));
  console.log(`🎯 Common numbers: ${commonNumbers.size.toLocaleString()}`);
  
  // Sample some numbers for analysis
  const samplePropertyNumbers = Array.from(propertyNumbers).slice(0, 10);
  const sampleEpcNumbers = Array.from(epcNumbers).slice(0, 10);
  
  console.log('\n📝 Sample Property Numbers:', samplePropertyNumbers);
  console.log('📝 Sample EPC Numbers:', sampleEpcNumbers);
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--analyze')) {
    analyzeAddressPatterns().catch(console.error);
  } else {
    enrichWithNumberMatching().catch(console.error);
  }
}

module.exports = { enrichWithNumberMatching, analyzeAddressPatterns }; 