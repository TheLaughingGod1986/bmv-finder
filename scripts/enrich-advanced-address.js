const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const fuzz = require('fuzzball');

/**
 * Advanced Address Matching with Fuzzy Token Sort Ratio and Confidence Scoring
 * (Reverted to previous working version)
 */

function normalize(str) {
  if (!str) return '';
  return str.toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

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

  // Step 1: Build EPC lookups
  const epcByPostcodeNumber = new Map();
  const epcByPostcode = new Map();
  await new Promise((resolve, reject) => {
    fs.createReadStream(epcPath)
      .pipe(csv())
      .on('data', row => {
        const postcode = normalize(row['postcode']);
        const address = normalize(row['address']);
        // Extract number (first token)
        const number = address.split(' ')[0];
        if (postcode && number) {
          const key = `${postcode}|${number}`;
          epcByPostcodeNumber.set(key, row);
        }
        if (postcode) {
          if (!epcByPostcode.has(postcode)) epcByPostcode.set(postcode, []);
          epcByPostcode.get(postcode).push(row);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Step 2: Process properties in batches
  let total = 0, enriched = 0;
  let outputHeaders = null;
  let unmatchedHeaders = null;
  const outputStream = fs.createWriteStream(outputPath);
  const unmatchedStream = fs.createWriteStream(unmatchedOutputPath);
  const csvOutput = fastcsv.format({ headers: true });
  const csvUnmatched = fastcsv.format({ headers: true });
  csvOutput.pipe(outputStream);
  csvUnmatched.pipe(unmatchedStream);

  await new Promise((resolve, reject) => {
    const batch = [];
    fs.createReadStream(propertiesPath)
      .pipe(csv())
      .on('data', row => {
        batch.push(row);
        if (batch.length >= batchSize) {
          processBatch(batch.splice(0, batch.length));
        }
      })
      .on('end', async () => {
        if (batch.length) processBatch(batch);
        csvOutput.end();
        csvUnmatched.end();
        resolve();
      })
      .on('error', reject);

    function processBatch(rows) {
      for (const row of rows) {
        total++;
        const postcode = normalize(row['postcode']);
        const address = normalize(row['address']);
        const number = address.split(' ')[0];
        let match = null, matchType = 'none', confidence = 'none', score = 0;
        // Pass 1: Exact postcode+number
        if (postcode && number) {
          const key = `${postcode}|${number}`;
          if (epcByPostcodeNumber.has(key)) {
            match = epcByPostcodeNumber.get(key);
            matchType = 'exact_number';
            confidence = 'high';
            score = 100;
          }
        }
        // Pass 2: Fuzzy postcode+number
        if (!match && postcode && number) {
          const candidates = Array.from(epcByPostcodeNumber.keys())
            .filter(k => k.startsWith(`${postcode}|`));
          let best = null, bestScore = 0;
          for (const k of candidates) {
            const [pc, n] = k.split('|');
            const fuzzScore = fuzz.token_sort_ratio(number, n);
            if (fuzzScore > bestScore) {
              bestScore = fuzzScore;
              best = epcByPostcodeNumber.get(k);
            }
          }
          if (best && bestScore >= 90) {
            match = best;
            matchType = 'fuzzy_number';
            confidence = bestScore >= 95 ? 'medium' : 'low';
            score = bestScore;
          }
        }
        // Pass 3: Postcode-only
        if (!match && postcode && epcByPostcode.has(postcode)) {
          match = epcByPostcode.get(postcode)[0];
          matchType = 'postcode_only';
          confidence = 'low';
          score = 0;
        }
        if (!outputHeaders) {
          outputHeaders = Object.keys(row).concat(['epc_bedrooms','epc_size','epc_rating','match_type','match_confidence','match_score']);
          csvOutput.write(Object.fromEntries(outputHeaders.map(h => [h, h])));
        }
        if (!unmatchedHeaders) {
          unmatchedHeaders = Object.keys(row);
          csvUnmatched.write(Object.fromEntries(unmatchedHeaders.map(h => [h, h])));
        }
        if (match) {
          enriched++;
          const outRow = { ...row,
            epc_bedrooms: match['bedrooms'] || '',
            epc_size: match['property_size'] || '',
            epc_rating: match['epc_rating'] || '',
            match_type: matchType,
            match_confidence: confidence,
            match_score: score
          };
          csvOutput.write(outRow);
        } else {
          csvUnmatched.write(row);
        }
      }
      console.log(`📊 Batch ${total}: ${enriched} enriched (${((enriched/total)*100).toFixed(2)}%)`);
    }
  });

  console.log(`\n✅ Done. Total: ${total}, Enriched: ${enriched} (${((enriched/total)*100).toFixed(2)}%)`);
}

if (require.main === module) {
  enrichWithAdvancedAddressMatching();
} 