const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const fuzz = require('fuzzball');

// Abbreviation map for UK addresses
const ABBREVIATIONS = {
  'ST': 'STREET',
  'RD': 'ROAD',
  'AVE': 'AVENUE',
  'CRES': 'CRESCENT',
  'DR': 'DRIVE',
  'LN': 'LANE',
  'PL': 'PLACE',
  'CT': 'COURT',
  'GR': 'GROVE',
  'CL': 'CLOSE',
  'SQ': 'SQUARE',
  'TCE': 'TERRACE',
  'PK': 'PARK',
  'GDNS': 'GARDENS',
  'FLAT': 'FLAT',
  'UNIT': 'UNIT',
  'APT': 'APARTMENT',
  'BLDG': 'BUILDING',
};

function expandAbbreviations(str) {
  return str.split(' ').map(word => ABBREVIATIONS[word] || word).join(' ');
}

function normalizeAddress(str) {
  if (!str) return '';
  let s = str.toUpperCase();
  s = s.replace(/[^A-Z0-9 ]/g, ' '); // Remove punctuation
  s = s.replace(/\s+/g, ' '); // Collapse spaces
  s = expandAbbreviations(s);
  return s.trim();
}

function extractComponents(address) {
  // Try to extract flat/unit, number, street
  let flat = '', number = '', street = '';
  let m = address.match(/^(FLAT|UNIT|APT)\s*([A-Z0-9]+)[ ,]+([0-9A-Z]+)\s+(.*)$/);
  if (m) {
    flat = `${m[1]} ${m[2]}`;
    number = m[3];
    street = m[4];
  } else {
    m = address.match(/^([0-9A-Z]+)\s+(.*)$/);
    if (m) {
      number = m[1];
      street = m[2];
    } else {
      street = address;
    }
  }
  return { flat, number, street };
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
  const epcByPostcode = new Map();
  const epcByPostcodeNumberStreet = new Map();
  const epcByPostcodeStreet = new Map();
  await new Promise((resolve, reject) => {
    fs.createReadStream(epcPath)
      .pipe(csv())
      .on('data', row => {
        const postcode = normalizeAddress(row['postcode']);
        const address = normalizeAddress(row['address']);
        const { flat, number, street } = extractComponents(address);
        // Key: postcode+number+street
        if (postcode && number && street) {
          const key = `${postcode}|${number}|${street}`;
          epcByPostcodeNumberStreet.set(key, row);
        }
        // Key: postcode+street
        if (postcode && street) {
          const key = `${postcode}|${street}`;
          if (!epcByPostcodeStreet.has(key)) epcByPostcodeStreet.set(key, []);
          epcByPostcodeStreet.get(key).push(row);
        }
        // Key: postcode
        if (postcode) {
          if (!epcByPostcode.has(postcode)) epcByPostcode.set(postcode, []);
          epcByPostcode.get(postcode).push(row);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Step 2: Process properties in batches
  const unmatched = [];
  const output = fs.createWriteStream(outputPath);
  const unmatchedOut = fs.createWriteStream(unmatchedOutputPath);
  let headerWritten = false;
  let unmatchedHeaderWritten = false;
  let total = 0, enriched = 0;

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
        resolve();
      })
      .on('error', reject);

    function processBatch(rows) {
      for (const row of rows) {
        total++;
        const postcode = normalizeAddress(row['postcode']);
        const address = normalizeAddress(row['address']);
        const { flat, number, street } = extractComponents(address);
        let match = null, matchType = 'none', confidence = 'none', score = 0;
        // Pass 1: Exact postcode+number+street
        if (postcode && number && street) {
          const key = `${postcode}|${number}|${street}`;
          if (epcByPostcodeNumberStreet.has(key)) {
            match = epcByPostcodeNumberStreet.get(key);
            matchType = 'exact_number_street';
            confidence = 'high';
            score = 100;
          }
        }
        // Pass 2: Fuzzy postcode+number+street
        if (!match && postcode && number && street) {
          const candidates = Array.from(epcByPostcodeStreet.keys())
            .filter(k => k.startsWith(`${postcode}|`));
          let best = null, bestScore = 0;
          for (const k of candidates) {
            const [pc, n, s] = k.split('|');
            const fuzzScore = fuzz.token_sort_ratio(`${number} ${street}`, `${n} ${s}`);
            if (fuzzScore > bestScore) {
              bestScore = fuzzScore;
              best = epcByPostcodeNumberStreet.get(k);
            }
          }
          if (best && bestScore >= 90) {
            match = best;
            matchType = 'fuzzy_number_street';
            confidence = bestScore >= 95 ? 'medium' : 'low';
            score = bestScore;
          }
        }
        // Pass 3: Fuzzy postcode+street
        if (!match && postcode && street) {
          const key = `${postcode}|${street}`;
          if (epcByPostcodeStreet.has(key)) {
            // Try fuzzy match among all in this postcode+street
            let best = null, bestScore = 0;
            for (const epcRow of epcByPostcodeStreet.get(key)) {
              const epcAddr = normalizeAddress(epcRow['address']);
              const epcComp = extractComponents(epcAddr);
              const fuzzScore = fuzz.token_sort_ratio(address, epcAddr);
              if (fuzzScore > bestScore) {
                bestScore = fuzzScore;
                best = epcRow;
              }
            }
            if (best && bestScore >= 90) {
              match = best;
              matchType = 'fuzzy_street';
              confidence = bestScore >= 95 ? 'medium' : 'low';
              score = bestScore;
            }
          }
        }
        // Pass 4: Postcode-only
        if (!match && postcode && epcByPostcode.has(postcode)) {
          match = epcByPostcode.get(postcode)[0];
          matchType = 'postcode_only';
          confidence = 'low';
          score = 0;
        }
        // Write output
        if (!headerWritten) {
          output.write(fastcsv.writeToStringSync([{
            ...row,
            epc_bedrooms: '',
            epc_size: '',
            epc_rating: '',
            match_type: '',
            match_confidence: '',
            match_score: ''
          }], { headers: true }));
          headerWritten = true;
        }
        if (!unmatchedHeaderWritten) {
          unmatchedOut.write(fastcsv.writeToStringSync([row], { headers: true }));
          unmatchedHeaderWritten = true;
        }
        if (match) {
          enriched++;
          output.write(fastcsv.writeToStringSync([{
            ...row,
            epc_bedrooms: match['bedrooms'] || '',
            epc_size: match['property_size'] || '',
            epc_rating: match['epc_rating'] || '',
            match_type: matchType,
            match_confidence: confidence,
            match_score: score
          }], { headers: false }));
        } else {
          unmatchedOut.write(fastcsv.writeToStringSync([row], { headers: false }));
        }
      }
      console.log(`📊 Batch ${total}: ${enriched} enriched (${((enriched/total)*100).toFixed(2)}%)`);
    }
  });

  output.end();
  unmatchedOut.end();
  console.log(`\n✅ Done. Total: ${total}, Enriched: ${enriched} (${((enriched/total)*100).toFixed(2)}%)`);
}

if (require.main === module) {
  enrichWithAdvancedAddressMatching();
} 