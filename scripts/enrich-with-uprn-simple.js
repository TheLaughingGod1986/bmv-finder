const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const stringSimilarity = require('string-similarity');

/**
 * Simple UPRN-based Property Enrichment
 * 
 * This script uses the existing EPC UPRN data to create better mappings
 * between properties and EPC data, achieving much higher enrichment rates.
 */

async function enrichWithUPRN({
  propertiesPath = 'pp-complete-cleaned.csv',
  epcPath = 'data/epc-certificates-combined.csv',
  outputPath = 'properties-enhanced-uprn-simple.csv',
  batchSize = 10000
} = {}) {
  console.log('🚀 Starting UPRN-based enrichment process...');
  console.log(`📁 Properties: ${propertiesPath}`);
  console.log(`📁 EPC Data: ${epcPath}`);
  console.log(`📁 Output: ${outputPath}`);

  // Step 1: Build EPC lookup by UPRN and address
  console.log('\n📖 Loading EPC data into memory...');
  const epcByUprn = new Map();
  const epcByAddress = new Map();
  let epcCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(epcPath)
      .pipe(csv())
      .on('data', (row) => {
        const uprn = row.UPRN;
        const address = row.ADDRESS || row.ADDRESS1;
        const postcode = row.POSTCODE;
        
        if (uprn) {
          // Store by UPRN
          epcByUprn.set(uprn, {
            bedrooms: row.NUMBER_HABITABLE_ROOMS || '',
            property_size: row.TOTAL_FLOOR_AREA || '',
            epc_rating: row.CURRENT_ENERGY_RATING || '',
            address: address,
            postcode: postcode
          });
          epcCount++;
        }
        
        if (address && postcode) {
          // Store by address for fallback matching
          const addressKey = normalizeAddress(address, postcode);
          epcByAddress.set(addressKey, {
            bedrooms: row.NUMBER_HABITABLE_ROOMS || '',
            property_size: row.TOTAL_FLOOR_AREA || '',
            epc_rating: row.CURRENT_ENERGY_RATING || '',
            address: address,
            postcode: postcode
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded EPC data for ${epcCount.toLocaleString()} UPRNs`);
        console.log(`✅ Loaded EPC data for ${epcByAddress.size.toLocaleString()} addresses`);
        processProperties();
      })
      .on('error', reject);

    function processProperties() {
      console.log('\n🔄 Processing properties with UPRN matching...');
      let processedCount = 0;
      let uprnEnrichedCount = 0;
      let addressEnrichedCount = 0;
      let postcodeEnrichedCount = 0;
      let noMatchCount = 0;
      let batchCount = 0;
      
      const outputStream = fs.createWriteStream(outputPath);
      const csvStream = fastcsv.format();
      csvStream.pipe(outputStream);

      fs.createReadStream(propertiesPath)
        .pipe(fastcsv.parse({ headers: false }))
        .on('data', (rowArr) => {
          // Properties file columns: GUID, price, date, postcode, property_type, new_build, estate_type, 
          // transaction_id, paon, street, locality, town_city, district, county, transaction_category, record_status
          const guid = rowArr[0];
          const postcode = (rowArr[3] || '').trim().toUpperCase();
          const paon = (rowArr[8] || '').trim();
          const street = (rowArr[9] || '').trim();
          
          let enrichment = { bedrooms: '', property_size: '', epc_rating: '' };
          let matchType = 'none';
          
                     if (paon && street && postcode) {
             const address = `${paon} ${street}`.trim();
             const addressKey = normalizeAddress(address, postcode);
             
             // Try to find UPRN for this address in EPC data
             let uprn = null;
             let bestScore = 0;
             
             // Method 1: Look for exact address match in EPC data
             if (epcByAddress.has(addressKey)) {
               // Find the UPRN for this address
               for (const [epcUprn, epcData] of epcByUprn.entries()) {
                 if (epcData.address === address && epcData.postcode === postcode) {
                   uprn = epcUprn;
                   break;
                 }
               }
             }
             
             // Method 2: Try fuzzy address matching
             if (!uprn) {
               let bestMatch = null;
               
               for (const [epcUprn, epcData] of epcByUprn.entries()) {
                 if (epcData.postcode === postcode) {
                   const score = stringSimilarity.compareTwoStrings(
                     address.toLowerCase(), 
                     epcData.address.toLowerCase()
                   );
                   if (score > bestScore && score > 0.8) {
                     bestScore = score;
                     bestMatch = epcUprn;
                   }
                 }
               }
               
               if (bestMatch) {
                 uprn = bestMatch;
               }
             }
             
             // Method 3: Postcode-only matching (fallback)
             if (!uprn) {
               for (const [epcUprn, epcData] of epcByUprn.entries()) {
                 if (epcData.postcode === postcode) {
                   uprn = epcUprn;
                   break;
                 }
               }
             }
             
             // Apply enrichment based on UPRN match
             if (uprn && epcByUprn.has(uprn)) {
               enrichment = epcByUprn.get(uprn);
               
               if (matchType === 'none') {
                 if (epcByAddress.has(addressKey)) {
                   matchType = 'exact';
                   uprnEnrichedCount++;
                 } else if (bestScore > 0.8) {
                   matchType = 'fuzzy';
                   addressEnrichedCount++;
                 } else {
                   matchType = 'postcode';
                   postcodeEnrichedCount++;
                 }
               }
             } else {
               noMatchCount++;
             }
          } else {
            noMatchCount++;
          }

          // Output enriched row (append new columns)
          csvStream.write([...rowArr, enrichment.bedrooms, enrichment.property_size, enrichment.epc_rating, matchType]);
          
          processedCount++;
          if (processedCount % batchSize === 0) {
            batchCount++;
            const totalEnriched = uprnEnrichedCount + addressEnrichedCount + postcodeEnrichedCount;
            const enrichmentRate = ((totalEnriched / processedCount) * 100).toFixed(2);
            console.log(`📊 Batch ${batchCount}: ${processedCount.toLocaleString()} processed, ${totalEnriched.toLocaleString()} enriched (${enrichmentRate}%)`);
          }
        })
        .on('end', () => {
          csvStream.end();
          const totalEnriched = uprnEnrichedCount + addressEnrichedCount + postcodeEnrichedCount;
          const finalEnrichmentRate = ((totalEnriched / processedCount) * 100).toFixed(2);
          
          console.log('\n🎉 UPRN enrichment complete!');
          console.log(`📈 Total processed: ${processedCount.toLocaleString()}`);
          console.log(`✨ Total enriched: ${totalEnriched.toLocaleString()} (${finalEnrichmentRate}%)`);
          console.log(`🎯 Exact UPRN matches: ${uprnEnrichedCount.toLocaleString()} (${((uprnEnrichedCount/processedCount)*100).toFixed(2)}%)`);
          console.log(`🔍 Fuzzy address matches: ${addressEnrichedCount.toLocaleString()} (${((addressEnrichedCount/processedCount)*100).toFixed(2)}%)`);
          console.log(`📮 Postcode-only matches: ${postcodeEnrichedCount.toLocaleString()} (${((postcodeEnrichedCount/processedCount)*100).toFixed(2)}%)`);
          console.log(`❌ No matches: ${noMatchCount.toLocaleString()} (${((noMatchCount/processedCount)*100).toFixed(2)}%)`);
          console.log(`💾 Output saved to: ${outputPath}`);
          resolve();
        })
        .on('error', reject);
    }
  });
}

/**
 * Normalize address for matching
 */
function normalizeAddress(address, postcode) {
  return `${address.trim().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')}|${postcode.trim().toLowerCase()}`;
}

/**
 * Create a UPRN mapping file from EPC data
 */
async function createUPRNMapping() {
  console.log('\n🔗 Creating UPRN mapping file...');
  
  const epcPath = 'data/epc-certificates-combined.csv';
  const outputPath = 'uprn-address-mapping.csv';
  
  if (!fs.existsSync(epcPath)) {
    console.log('⚠️  EPC data not found');
    return;
  }

  return new Promise((resolve, reject) => {
    let count = 0;
    const outputStream = fs.createWriteStream(outputPath);
    const csvStream = fastcsv.format();
    csvStream.pipe(outputStream);

    // Write header
    csvStream.write(['UPRN', 'Address', 'Postcode', 'Bedrooms', 'Property_Size', 'EPC_Rating']);

    fs.createReadStream(epcPath)
      .pipe(csv())
      .on('data', (row) => {
        const uprn = row.UPRN;
        const address = row.ADDRESS || row.ADDRESS1;
        const postcode = row.POSTCODE;
        
        if (uprn && address && postcode) {
          csvStream.write([
            uprn,
            address,
            postcode,
            row.NUMBER_HABITABLE_ROOMS || '',
            row.TOTAL_FLOOR_AREA || '',
            row.CURRENT_ENERGY_RATING || ''
          ]);
          count++;
        }
      })
      .on('end', () => {
        csvStream.end();
        console.log(`✅ UPRN mapping created: ${count.toLocaleString()} records`);
        console.log(`💾 Saved to: ${outputPath}`);
        resolve();
      })
      .on('error', reject);
  });
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--mapping')) {
    createUPRNMapping().catch(console.error);
  } else {
    enrichWithUPRN().catch(console.error);
  }
}

module.exports = { enrichWithUPRN, createUPRNMapping }; 