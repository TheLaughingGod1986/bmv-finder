const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const path = require('path');
const stringSimilarity = require('string-similarity');

/**
 * Streaming approach to enrich properties with EPC data
 * Matches on POSTCODE (exact) and street name (fuzzy)
 */

async function enrichPropertiesStreaming({
  propertiesPath = 'pp-complete-cleaned.csv',
  epcPath = 'data/epc-certificates-combined.csv',
  outputPath = 'properties-enhanced-streaming.csv',
  batchSize = 10000,
  streetMatchThreshold = 0.7 // Fuzzy match threshold (0-1)
} = {}) {
  console.log('🚀 Starting streaming enrichment process (postcode + street match)...');
  console.log(`📁 Properties: ${propertiesPath}`);
  console.log(`📁 EPC Data: ${epcPath}`);
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📦 Batch Size: ${batchSize.toLocaleString()}`);

  // Step 1: Build EPC lookup map by POSTCODE
  console.log('\n📖 Loading EPC data into memory (by postcode)...');
  const epcByPostcode = new Map();
  let epcCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(epcPath)
      .pipe(csv())
      .on('data', (row) => {
        const postcode = (row.POSTCODE || '').trim().toUpperCase();
        const street = (row.ADDRESS1 || '').trim().toUpperCase();
        if (!postcode || !street) return;
        if (!epcByPostcode.has(postcode)) epcByPostcode.set(postcode, []);
        epcByPostcode.get(postcode).push({
          street,
          bedrooms: row['NUMBER_HABITABLE_ROOMS'] || '',
          property_size: row['TOTAL_FLOOR_AREA'] || '',
          epc_rating: row['CURRENT_ENERGY_RATING'] || '',
        });
        epcCount++;
      })
      .on('end', () => {
        console.log(`✅ Loaded ${epcCount.toLocaleString()} EPC records for ${epcByPostcode.size.toLocaleString()} unique postcodes`);
        processProperties(epcByPostcode, resolve, reject);
      })
      .on('error', reject);

    function processProperties(epcByPostcode, resolve, reject) {
      console.log('\n🔄 Processing properties in streaming mode...');
      let processedCount = 0;
      let enrichedCount = 0;
      let postcodeOnlyCount = 0;
      let noMatchCount = 0;
      let batchCount = 0;
      const outputStream = fs.createWriteStream(outputPath);
      const csvStream = fastcsv.format();
      csvStream.pipe(outputStream);

      fs.createReadStream(propertiesPath)
        .on('error', reject)
        .pipe(fastcsv.parse({ headers: false }))
        .on('data', (rowArr) => {
          // Properties file has no headers, so use column indices
          // 4th column (index 3) = POSTCODE, 11th column (index 10) = street name
          const postcode = (rowArr[3] || '').trim().toUpperCase();
          const propStreet = (rowArr[10] || '').trim().toUpperCase();
          let enriched = false;
          let enrichment = { bedrooms: '', property_size: '', epc_rating: '' };

          if (postcode && epcByPostcode.has(postcode)) {
            // Fuzzy match on street name
            const epcList = epcByPostcode.get(postcode);
            let bestMatch = null;
            let bestScore = 0;
            for (const epc of epcList) {
              const score = stringSimilarity.compareTwoStrings(propStreet, epc.street);
              if (score > bestScore) {
                bestScore = score;
                bestMatch = epc;
              }
            }
            if (bestMatch && bestScore >= streetMatchThreshold) {
              enrichment = bestMatch;
              enriched = true;
              enrichedCount++;
            } else if (epcList.length > 0) {
              // No good street match, but postcode matches
              enrichment = epcList[0];
              postcodeOnlyCount++;
            }
          } else {
            noMatchCount++;
          }

          // Output enriched row (append new columns)
          csvStream.write([...rowArr, enrichment.bedrooms, enrichment.property_size, enrichment.epc_rating]);
          processedCount++;

          // Progress reporting
          if (processedCount % batchSize === 0) {
            batchCount++;
            const enrichmentRate = ((enrichedCount / processedCount) * 100).toFixed(2);
            const postcodeRate = ((postcodeOnlyCount / processedCount) * 100).toFixed(2);
            console.log(`📊 Batch ${batchCount}: ${processedCount.toLocaleString()} processed, ${enrichedCount.toLocaleString()} enriched (${enrichmentRate}%), ${postcodeOnlyCount.toLocaleString()} postcode-only (${postcodeRate}%)`);
          }
        })
        .on('end', () => {
          csvStream.end();
          const enrichmentRate = ((enrichedCount / processedCount) * 100).toFixed(2);
          const postcodeRate = ((postcodeOnlyCount / processedCount) * 100).toFixed(2);
          const noMatchRate = ((noMatchCount / processedCount) * 100).toFixed(2);
          console.log(`\n🎉 Enrichment complete!`);
          console.log(`📈 Total processed: ${processedCount.toLocaleString()}`);
          console.log(`✨ Total enriched (postcode+street): ${enrichedCount.toLocaleString()} (${enrichmentRate}%)`);
          console.log(`✨ Total postcode-only matches: ${postcodeOnlyCount.toLocaleString()} (${postcodeRate}%)`);
          console.log(`❌ No match: ${noMatchCount.toLocaleString()} (${noMatchRate}%)`);
          console.log(`💾 Output saved to: ${outputPath}`);
          resolve({ processedCount, enrichedCount, postcodeOnlyCount, noMatchCount });
        });
    }
  });
}

// If run directly, execute the enrichment
if (require.main === module) {
  const args = process.argv.slice(2);
  const propertiesPath = args[0] || 'pp-complete-cleaned.csv';
  const epcPath = args[1] || 'data/epc-certificates-combined.csv';
  const outputPath = args[2] || 'properties-enhanced-streaming.csv';

  // Install string-similarity if not present
  try {
    require.resolve('string-similarity');
  } catch (e) {
    console.log('Installing string-similarity...');
    require('child_process').execSync('npm install string-similarity', { stdio: 'inherit' });
  }

  enrichPropertiesStreaming({ propertiesPath, epcPath, outputPath })
    .then(result => {
      console.log('\n✅ Streaming enrichment completed successfully!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error during streaming enrichment:', err);
      process.exit(1);
    });
}

module.exports = { enrichPropertiesStreaming }; 