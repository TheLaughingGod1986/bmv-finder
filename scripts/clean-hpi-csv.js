const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const INPUT_CSV = path.join(__dirname, '../data/hpi-full.csv');
const OUTPUT_CSV = path.join(__dirname, '../data/hpi.csv');

const INPUT_HEADERS = {
  region: 'Name',
  date: 'Period',
  index: 'House price index All property types'
};

function isValidRow(row) {
  // All fields must be present and index must be a valid number
  if (!row[INPUT_HEADERS.region] || !row[INPUT_HEADERS.date] || !row[INPUT_HEADERS.index]) return false;
  const idx = parseFloat(row[INPUT_HEADERS.index]);
  if (isNaN(idx)) return false;
  // Date should be in YYYY-MM format
  if (!/^\d{4}-\d{2}$/.test(row[INPUT_HEADERS.date])) return false;
  return true;
}

async function cleanHpiCsv() {
  if (!fs.existsSync(INPUT_CSV)) {
    console.error(`Input file not found: ${INPUT_CSV}`);
    process.exit(1);
  }

  const output = fs.createWriteStream(OUTPUT_CSV);
  output.write('region,date,index\n');

  let count = 0;
  let skipped = 0;

  fs.createReadStream(INPUT_CSV)
    .pipe(csv())
    .on('data', (row) => {
      if (!isValidRow(row)) {
        skipped++;
        return;
      }
      const region = row[INPUT_HEADERS.region].trim();
      const date = row[INPUT_HEADERS.date].trim();
      const index = parseFloat(row[INPUT_HEADERS.index]);
      output.write(`${region},${date},${index}\n`);
      count++;
    })
    .on('end', () => {
      output.end();
      console.log(`✅ Cleaned HPI CSV written to ${OUTPUT_CSV}`);
      console.log(`  Rows written: ${count}`);
      console.log(`  Rows skipped: ${skipped}`);
    })
    .on('error', (err) => {
      console.error('Error reading input CSV:', err);
      process.exit(1);
    });
}

if (require.main === module) {
  cleanHpiCsv();
} 