const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const fuzz = require('fuzzball');

/**
 * Advanced Address Matching with Fuzzy Token Sort Ratio and Confidence Scoring
 */

async function enrichWithAdvancedAddressMatching({
  propertiesPath = 'pp-complete-cleaned.csv',
  epcPath = 'data/epc-certificates-combined.csv',
  outputPath = 'properties-enhanced-advanced.csv',
  unmatchedOutputPath = 'unmatched-records.csv',
  batchSize = 10000
} = {}) {
  console.log('🚀 Starting advanced address matching enrichment...');
  console.log(`📁 Properties: ${propertiesPath}`);
  console.log(`📁 EPC Data: ${epcPath}`);
  console.log(`📁 Output: ${outputPath}`);

  // Step 1: Build comprehensive EPC lookup
  console.log('\n📖 Loading and parsing EPC data...');
  const epcByPostcode = new Map();
  const epcByPostcodeNumber = new Map();
  const epcByPostcodeStreet = new Map();
  let epcCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(epcPath)
      .pipe(csv())
      .on('data', (row) => {
        const address = row.ADDRESS || row.ADDRESS1;
        const postcode = row.POSTCODE;
        
        if (address && postcode) {
          const normalizedPostcode = normalizePostcode(postcode);
          const parsedAddress = parseAddress(address);
          
          if (normalizedPostcode && parsedAddress) {
            // Store by postcode
            if (!epcByPostcode.has(normalizedPostcode)) {
              epcByPostcode.set(normalizedPostcode, []);
            }
            epcByPostcode.get(normalizedPostcode).push({
              bedrooms: row.NUMBER_HABITABLE_ROOMS || '',
              property_size: row.TOTAL_FLOOR_AREA || '',
              epc_rating: row.CURRENT_ENERGY_RATING || '',
              address: address,
              postcode: postcode,
              parsed: parsedAddress
            });
            
            // Store by postcode + number
            if (parsedAddress.number) {
              const numberKey = `${normalizedPostcode}|${parsedAddress.number}`;
              epcByPostcodeNumber.set(numberKey, {
                bedrooms: row.NUMBER_HABITABLE_ROOMS || '',
                property_size: row.TOTAL_FLOOR_AREA || '',
                epc_rating: row.CURRENT_ENERGY_RATING || '',
                address: address,
                postcode: postcode,
                parsed: parsedAddress
              });
            }
            
            // Store by postcode + street
            if (parsedAddress.street) {
              const streetKey = `${normalizedPostcode}|${parsedAddress.street}`;
              if (!epcByPostcodeStreet.has(streetKey)) {
                epcByPostcodeStreet.set(streetKey, []);
              }
              epcByPostcodeStreet.get(streetKey).push({
                bedrooms: row.NUMBER_HABITABLE_ROOMS || '',
                property_size: row.TOTAL_FLOOR_AREA || '',
                epc_rating: row.CURRENT_ENERGY_RATING || '',
                address: address,
                postcode: postcode,
                parsed: parsedAddress
              });
            }
            
            epcCount++;
          }
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded EPC data for ${epcCount.toLocaleString()} records`);
        console.log(`✅ Created ${epcByPostcodeNumber.size.toLocaleString()} postcode+number combinations`);
        console.log(`✅ Created ${epcByPostcodeStreet.size.toLocaleString()} postcode+street combinations`);
        processProperties();
      })
      .on('error', reject);

    function processProperties() {
      console.log('\n🔄 Processing properties with advanced matching...');
      let processedCount = 0;
      let highMatches = 0;
      let mediumMatches = 0;
      let lowMatches = 0;
      let postcodeMatches = 0;
      let noMatches = 0;
      let batchCount = 0;
      
      const outputStream = fs.createWriteStream(outputPath);
      const csvStream = fastcsv.format();
      csvStream.pipe(outputStream);

      const unmatchedStream = fs.createWriteStream(unmatchedOutputPath);
      const unmatchedCsv = fastcsv.format();
      unmatchedCsv.pipe(unmatchedStream);

      fs.createReadStream(propertiesPath)
        .pipe(fastcsv.parse({ headers: false }))
        .on('data', (rowArr) => {
          // Properties file columns: GUID, price, date, postcode, property_type, new_build, estate_type, 
          // transaction_id, paon, street, locality, town_city, district, county, transaction_category, record_status
          const postcode = (rowArr[3] || '').trim().toUpperCase();
          const paon = (rowArr[8] || '').trim();
          const street = (rowArr[9] || '').trim();
          
          let enrichment = { bedrooms: '', property_size: '', epc_rating: '' };
          let matchType = 'none';
          let matchConfidence = 'none';
          let matchScore = 0;
          let matchedEpc = null;
          
          if (postcode) {
            const normalizedPostcode = normalizePostcode(postcode);
            const normalizedPaon = normalizePaon(paon);
            const normalizedStreet = normalizeStreet(street);
            
            if (normalizedPostcode) {
              // Strategy 1: Exact postcode + number match (high confidence)
              if (normalizedPaon) {
                const numberKey = `${normalizedPostcode}|${normalizedPaon}`;
                if (epcByPostcodeNumber.has(numberKey)) {
                  enrichment = epcByPostcodeNumber.get(numberKey);
                  matchType = 'exact';
                  matchConfidence = 'high';
                  highMatches++;
                  matchedEpc = enrichment;
                }
              }
              // Strategy 2: Fuzzy token sort ratio on postcode+number (medium/low confidence)
              if (matchType === 'none' && normalizedPaon) {
                // Get all EPCs for this postcode
                const epcList = epcByPostcode.get(normalizedPostcode) || [];
                let bestScore = 0;
                let bestEpc = null;
                for (const epc of epcList) {
                  if (epc.parsed && epc.parsed.number) {
                    const score = fuzz.token_sort_ratio(normalizedPaon, epc.parsed.number);
                    if (score > bestScore) {
                      bestScore = score;
                      bestEpc = epc;
                    }
                  }
                }
                if (bestScore >= 90) {
                  enrichment = bestEpc;
                  matchType = 'fuzzy_number';
                  matchConfidence = 'medium';
                  matchScore = bestScore;
                  mediumMatches++;
                  matchedEpc = enrichment;
                } else if (bestScore >= 80) {
                  enrichment = bestEpc;
                  matchType = 'fuzzy_number';
                  matchConfidence = 'low';
                  matchScore = bestScore;
                  lowMatches++;
                  matchedEpc = enrichment;
                }
              }
              // Strategy 3: Postcode + street match (low confidence)
              if (matchType === 'none' && normalizedStreet) {
                const streetKey = `${normalizedPostcode}|${normalizedStreet}`;
                if (epcByPostcodeStreet.has(streetKey)) {
                  const epcList = epcByPostcodeStreet.get(streetKey);
                  if (epcList.length > 0) {
                    enrichment = epcList[0];
                    matchType = 'street';
                    matchConfidence = 'low';
                    lowMatches++;
                    matchedEpc = enrichment;
                  }
                }
              }
              // Strategy 4: Postcode-only match (very low confidence)
              if (matchType === 'none') {
                if (epcByPostcode.has(normalizedPostcode)) {
                  const epcList = epcByPostcode.get(normalizedPostcode);
                  if (epcList.length > 0) {
                    enrichment = epcList[0];
                    matchType = 'postcode';
                    matchConfidence = 'low';
                    postcodeMatches++;
                    matchedEpc = enrichment;
                  }
                }
              }
            }
          }
          
          if (matchType === 'none') {
            noMatches++;
            unmatchedCsv.write([...rowArr, 'none', 'none', 'none', 'none', 'none']);
          }

          // Output enriched row with confidence and score
          csvStream.write([
            ...rowArr,
            enrichment.bedrooms,
            enrichment.property_size,
            enrichment.epc_rating,
            matchType,
            matchConfidence,
            matchScore
          ]);
          
          processedCount++;
          if (processedCount % batchSize === 0) {
            batchCount++;
            const totalEnriched = highMatches + mediumMatches + lowMatches + postcodeMatches;
            const enrichmentRate = ((totalEnriched / processedCount) * 100).toFixed(2);
            console.log(`📊 Batch ${batchCount}: ${processedCount.toLocaleString()} processed, ${totalEnriched.toLocaleString()} enriched (${enrichmentRate}%)`);
          }
        })
        .on('end', () => {
          csvStream.end();
          unmatchedCsv.end();
          const totalEnriched = highMatches + mediumMatches + lowMatches + postcodeMatches;
          const finalEnrichmentRate = ((totalEnriched / processedCount) * 100).toFixed(2);
          
          console.log('\n🎉 Advanced address matching complete!');
          console.log(`📈 Total processed: ${processedCount.toLocaleString()}`);
          console.log(`✨ Total enriched: ${totalEnriched.toLocaleString()} (${finalEnrichmentRate}%)`);
          console.log(`🏅 High confidence: ${highMatches.toLocaleString()}`);
          console.log(`🥈 Medium confidence: ${mediumMatches.toLocaleString()}`);
          console.log(`🥉 Low confidence: ${lowMatches.toLocaleString()}`);
          console.log(`📮 Postcode-only matches: ${postcodeMatches.toLocaleString()}`);
          console.log(`❌ No matches: ${noMatches.toLocaleString()}`);
          console.log(`💾 Output saved to: ${outputPath}`);
          console.log(`📝 Unmatched records saved to: ${unmatchedOutputPath}`);
          resolve();
        })
        .on('error', reject);
    }
  });
}

/**
 * Parse address into components
 */
function parseAddress(address) {
  if (!address) return null;
  
  // Clean the address
  let cleanAddress = address
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const result = {
    number: null,
    street: null,
    full: cleanAddress
  };
  
  // Extract number (various patterns)
  const numberPatterns = [
    /^(\d+[A-Za-z]?)\s/,           // "10A High Street"
    /^(\d+[A-Za-z]?)$/,            // "10A"
    /^([A-Za-z]+\s+\d+[A-Za-z]?)\s/, // "Flat 2A High Street"
    /^(\d+[A-Za-z]?[A-Za-z]+)\s/,  // "10AFlat High Street"
  ];
  
  for (const pattern of numberPatterns) {
    const match = cleanAddress.match(pattern);
    if (match) {
      result.number = normalizeNumber(match[1]);
      break;
    }
  }
  
  // Extract street name (everything after the number)
  if (result.number) {
    const streetMatch = cleanAddress.match(new RegExp(`^[^\\s]*\\s+(.+)$`));
    if (streetMatch) {
      result.street = normalizeStreet(streetMatch[1]);
    }
  } else {
    // No number found, try to extract street
    result.street = normalizeStreet(cleanAddress);
  }
  
  return result;
}

/**
 * Normalize postcode
 */
function normalizePostcode(postcode) {
  if (!postcode) return null;
  return postcode.replace(/\s/g, '').toUpperCase();
}

/**
 * Normalize PAON (Property Address Number)
 */
function normalizePaon(paon) {
  if (!paon) return null;
  
  let clean = String(paon)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  
  // Handle common variations
  clean = clean
    .replace(/^flat\s*/, '')
    .replace(/^apartment\s*/, '')
    .replace(/^apt\s*/, '')
    .replace(/^unit\s*/, '');
  
  return clean || null;
}

/**
 * Normalize street name
 */
function normalizeStreet(street) {
  if (!street) return null;
  
  let clean = String(street)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove common words that don't help matching
  const stopWords = ['street', 'road', 'avenue', 'lane', 'close', 'drive', 'way', 'place', 'court', 'crescent'];
  const words = clean.split(' ');
  const filteredWords = words.filter(word => !stopWords.includes(word));
  
  return filteredWords.join(' ') || null;
}

/**
 * Normalize number
 */
function normalizeNumber(number) {
  if (!number) return null;
  
  let clean = String(number)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  
  return clean || null;
}

/**
 * Test address parsing with sample data
 */
async function testAddressParsing() {
  console.log('\n🧪 Testing address parsing...');
  
  const testAddresses = [
    '10 High Street',
    '25A Oak Road',
    'Flat 2, 15 Main Street',
    'Apartment 3B, 42 Park Avenue',
    '1 The Mews',
    '12B-14C Station Road',
    'Unit 5, 100 Industrial Estate',
    '15-17 Church Lane'
  ];
  
  console.log('\n📝 Address Parsing Results:');
  for (const address of testAddresses) {
    const parsed = parseAddress(address);
    console.log(`"${address}" → Number: "${parsed?.number}", Street: "${parsed?.street}"`);
  }
  
  // Test with some real data
  console.log('\n📊 Testing with sample EPC data...');
  let sampleCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('data/epc-certificates-combined.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (sampleCount < 10) {
          const address = row.ADDRESS || row.ADDRESS1;
          if (address) {
            const parsed = parseAddress(address);
            console.log(`"${address}" → Number: "${parsed?.number}", Street: "${parsed?.street}"`);
            sampleCount++;
          }
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    testAddressParsing().catch(console.error);
  } else {
    enrichWithAdvancedAddressMatching().catch(console.error);
  }
}

module.exports = { enrichWithAdvancedAddressMatching, testAddressParsing }; 