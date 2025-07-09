const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const INPUT_CSV = path.join(__dirname, '../data/hpi-regions.csv');
const OUTPUT_CSV = path.join(__dirname, '../data/hpi.csv');

const INPUT_HEADERS = {
  region: 'regionLabel',
  date: 'date',
  index: 'hpiIndex'
};

function isValidRow(row) {
  if (!row[INPUT_HEADERS.region] || !row[INPUT_HEADERS.date] || !row[INPUT_HEADERS.index]) return false;
  const idx = parseFloat(row[INPUT_HEADERS.index]);
  if (isNaN(idx)) return false;
  // Date should be in YYYY-MM format
  if (!/^\d{4}-\d{2}$/.test(row[INPUT_HEADERS.date])) return false;
  return true;
}

function cleanCsv() {
  const out = fs.createWriteStream(OUTPUT_CSV);
  out.write('region,date,index\n');
  let written = 0, skipped = 0;
  fs.createReadStream(INPUT_CSV)
    .pipe(csv())
    .on('data', row => {
      if (isValidRow(row)) {
        out.write(`"${row[INPUT_HEADERS.region].replace(/"/g, '')}",${row[INPUT_HEADERS.date]},${row[INPUT_HEADERS.index]}\n`);
        written++;
      } else {
        skipped++;
      }
    })
    .on('end', () => {
      out.end();
      console.log(`✅ Cleaned HPI regions CSV. Rows written: ${written}, skipped: ${skipped}`);
    });
}

if (require.main === module) {
  cleanCsv();
} 