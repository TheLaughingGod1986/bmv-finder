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

function normalizePostcode(str) {
  if (!str) return '';
  return str.replace(/\s+/g, '').toUpperCase();
}

function normalizeStreet(str) {
  if (!str) return '';
  let s = str.toUpperCase();
  s = s.replace(/[^A-Z0-9 ]/g, ' '); // Remove punctuation
  s = s.replace(/\s+/g, ' '); // Collapse spaces
  s = expandAbbreviations(s);
  return s.trim();
}

function extractNumber(str) {
  if (!str) return '';
  // Look for first number in the string
  const m = str.match(/\b\d+[A-Z]?\b/);
  return m ? m[0] : '';
}

function parseEpcAddress(address1) {
  // ADDRESS1 is usually like "25, Heron Crescent"
  if (!address1) return { number: '', street: '' };
  const parts = address1.split(',');
  const number = extractNumber(parts[0] || '');
  const street = normalizeStreet((parts[1] || parts[0] || ''));
  return { number, street };
}

// Load postcode fallback data
async function loadPostcodeFallback(fallbackPath) {
  const fallbackByPostcode = new Map();
  await new Promise((resolve, reject) => {
    fs.createReadStream(fallbackPath)
      .pipe(csv())
      .on('data', row => {
        const postcode = normalizePostcode(row['POSTCODE']);
        if (postcode) {
          fallbackByPostcode.set(postcode, row);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
  return fallbackByPostcode;
}

// Modular enrichment logic
function enrichWithEpc(epcByComposite, postcode, number, street) {
  // Pass 1: Exact postcode|number|street
  if (postcode && number && street) {
    const key = `${postcode}|${number}|${street}`;
    if (epcByComposite.has(key)) {
      const match = epcByComposite.get(key);
      return {
        epc_bedrooms: match['NUMBER_HABITABLE_ROOMS'] || '',
        epc_size: match['TOTAL_FLOOR_AREA'] || '',
        epc_rating: match['CURRENT_ENERGY_RATING'] || '',
        match_type: 'exact_composite',
        match_confidence: 'high',
        match_score: 100
      };
    }
  }
  // Pass 2: Fuzzy street match within postcode|number
  if (postcode && number && street) {
    const candidates = Array.from(epcByComposite.keys())
      .filter(k => k.startsWith(`${postcode}|${number}|`));
    let best = null, bestScore = 0;
    for (const k of candidates) {
      const [pc, n, s] = k.split('|');
      const fuzzScore = fuzz.token_sort_ratio(street, s);
      if (fuzzScore > bestScore) {
        bestScore = fuzzScore;
        best = epcByComposite.get(k);
      }
    }
    if (best && bestScore >= 90) {
      return {
        epc_bedrooms: best['NUMBER_HABITABLE_ROOMS'] || '',
        epc_size: best['TOTAL_FLOOR_AREA'] || '',
        epc_rating: best['CURRENT_ENERGY_RATING'] || '',
        match_type: 'fuzzy_street',
        match_confidence: bestScore >= 95 ? 'medium' : 'low',
        match_score: bestScore
      };
    }
  }
  return null;
}

// Placeholder for future model-based enrichment
function enrichWithModel(rowArr) {
  // Example: return null for now, but can be replaced with ML predictions
  return null;
}

async function enrichWithAdvancedAddressMatching({
  propertiesPath = 'pp-complete-cleaned.csv',
  epcPath = 'data/epc-certificates-combined.csv',
  fallbackPath = 'postcode-fallback.csv',
  outputPath = 'properties-enhanced-advanced.csv',
  unmatchedOutputPath = 'unmatched-records.csv',
  batchSize = 10000
} = {}) {
  console.log('🚀 Starting advanced address matching enrichment...');
  console.log(`📁 Properties: ${propertiesPath}`);
  console.log(`📁 EPC Data: ${epcPath}`);
  console.log(`📁 Fallback: ${fallbackPath}`);
  console.log(`📁 Output: ${outputPath}`);

  // Step 1: Build EPC lookup by postcode|number|street
  const epcByComposite = new Map();
  await new Promise((resolve, reject) => {
    fs.createReadStream(epcPath)
      .pipe(csv())
      .on('data', row => {
        const postcode = normalizePostcode(row['POSTCODE']);
        const { number, street } = parseEpcAddress(row['ADDRESS1']);
        if (postcode && number && street) {
          const key = `${postcode}|${number}|${street}`;
          epcByComposite.set(key, row);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Step 2: Load postcode fallback data
  const fallbackByPostcode = await loadPostcodeFallback(fallbackPath);

  // Step 3: Process properties in batches (array-based, no header)
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
      .pipe(fastcsv.parse({ headers: false }))
      .on('data', rowArr => {
        batch.push(rowArr);
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
      for (const rowArr of rows) {
        total++;
        // Properties CSV: [0]=GUID, [3]=Postcode, [8]=Number, [9]=Street
        const postcode = normalizePostcode(rowArr[3]);
        const number = extractNumber(rowArr[8] || '');
        const street = normalizeStreet(rowArr[9] || '');
        let enrichment = enrichWithEpc(epcByComposite, postcode, number, street);
        // Fallback: model-based enrichment (future)
        if (!enrichment) {
          enrichment = enrichWithModel(rowArr);
          if (enrichment) {
            enrichment.match_type = 'model';
          }
        }
        // Fallback: postcode-level enrichment
        if (!enrichment && postcode && fallbackByPostcode.has(postcode)) {
          const fb = fallbackByPostcode.get(postcode);
          enrichment = {
            epc_bedrooms: fb['AVG_BEDROOMS'] || '',
            epc_size: fb['AVG_SIZE'] || '',
            epc_rating: fb['AVG_EPC'] || '',
            match_type: 'postcode_fallback',
            match_confidence: 'low',
            match_score: 0
          };
        }
        // Compose output row as object for CSV
        if (!outputHeaders) {
          outputHeaders = rowArr.concat(['epc_bedrooms','epc_size','epc_rating','match_type','match_confidence','match_score']);
          csvOutput.write(Object.fromEntries(outputHeaders.map((h,i) => [i, h])));
        }
        if (!unmatchedHeaders) {
          unmatchedHeaders = rowArr;
          csvUnmatched.write(Object.fromEntries(unmatchedHeaders.map((h,i) => [i, h])));
        }
        if (enrichment) {
          enriched++;
          const outRow = Object.assign({}, rowArr);
          outRow[rowArr.length] = enrichment.epc_bedrooms;
          outRow[rowArr.length+1] = enrichment.epc_size;
          outRow[rowArr.length+2] = enrichment.epc_rating;
          outRow[rowArr.length+3] = enrichment.match_type;
          outRow[rowArr.length+4] = enrichment.match_confidence;
          outRow[rowArr.length+5] = enrichment.match_score;
          csvOutput.write(outRow);
        } else {
          csvUnmatched.write(rowArr);
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