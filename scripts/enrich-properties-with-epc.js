const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');

if (process.argv.length < 5) {
  console.error('Usage: node enrich-properties-with-epc.js <properties.csv> <epc.csv> <output.csv>');
  process.exit(1);
}

const [,, propertiesPath, epcPath, outputPath] = process.argv;

// Step 1: Load EPC data into a Map by UPRN
const epcMap = new Map();

console.log('Reading EPC CSV...');
fs.createReadStream(epcPath)
  .pipe(csv())
  .on('data', (row) => {
    const uprn = row.UPRN || row.uprn || row["uprn"];
    if (!uprn) return;
    // If multiple EPCs per UPRN, keep the most recent (by inspection_date or lodgement_date)
    const date = row['INSPECTION_DATE'] || row['inspection_date'] || row['LODGE_DATE'] || row['lodgement_date'];
    if (!epcMap.has(uprn) || (date && epcMap.get(uprn).date < date)) {
      epcMap.set(uprn, {
        bedrooms: row['NUMBER_HABITABLE_ROOMS'] || row['bedrooms'] || row['NUMBER_BEDROOMS'] || row['number_bedrooms'],
        property_size: row['TOTAL_FLOOR_AREA'] || row['total_floor_area'],
        epc_rating: row['CURRENT_ENERGY_RATING'] || row['current_energy_rating'],
        date: date
      });
    }
  })
  .on('end', () => {
    console.log(`Loaded EPC records for ${epcMap.size} UPRNs.`);
    enrichProperties();
  });

function enrichProperties() {
  const enrichedRows = [];
  let headers = null;
  console.log('Reading properties CSV and enriching...');
  fs.createReadStream(propertiesPath)
    .pipe(csv())
    .on('headers', (h) => {
      headers = h;
      // Add new fields if not present
      if (!headers.includes('bedrooms')) headers.push('bedrooms');
      if (!headers.includes('property_size')) headers.push('property_size');
      if (!headers.includes('epc_rating')) headers.push('epc_rating');
    })
    .on('data', (row) => {
      const uprn = row.UPRN || row.uprn || row["uprn"];
      if (uprn && epcMap.has(uprn)) {
        const epc = epcMap.get(uprn);
        row.bedrooms = epc.bedrooms || '';
        row.property_size = epc.property_size || '';
        row.epc_rating = epc.epc_rating || '';
      } else {
        row.bedrooms = '';
        row.property_size = '';
        row.epc_rating = '';
      }
      enrichedRows.push(row);
    })
    .on('end', () => {
      console.log(`Enriched ${enrichedRows.length} property records.`);
      writeOutput(headers, enrichedRows);
    });
}

function writeOutput(headers, rows) {
  const ws = fs.createWriteStream(outputPath);
  fastcsv
    .write(rows, { headers: headers })
    .pipe(ws)
    .on('finish', () => {
      console.log(`Enriched CSV written to ${outputPath}`);
    });
} 