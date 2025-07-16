const fs = require('fs');
const readline = require('readline');

const inputFile = 'properties-enhanced-advanced.csv'; // New output file from advanced enrichment

let total = 0;
let epcMatch = 0;
let hpiMatch = 0;

const rl = readline.createInterface({
  input: fs.createReadStream(inputFile),
  crlfDelay: Infinity
});

let headers = [];
let epcIdx = -1;
let hpiIdx = -1;
rl.on('line', (line) => {
  if (total === 0) {
    headers = line.split(',');
    epcIdx = headers.indexOf('epc_rating');
    // Find the HPI value column
    hpiIdx = headers.indexOf('hpi_value');
    total++;
    return;
  }
  total++;
  const cols = line.split(',');
  const epcRating = epcIdx !== -1 ? cols[epcIdx] : '';
  const hpiValue = hpiIdx !== -1 ? cols[hpiIdx] : '';
  if (epcRating && epcRating.trim() !== '') epcMatch++;
  if (hpiValue && hpiValue.trim() !== '') hpiMatch++;
});

rl.on('close', () => {
  const dataRows = total - 1;
  console.log(`Total properties: ${dataRows}`);
  console.log(`EPC matches: ${epcMatch} (${((epcMatch/dataRows)*100).toFixed(2)}%)`);
  console.log(`HPI matches: ${hpiMatch} (${((hpiMatch/dataRows)*100).toFixed(2)}%)`);
}); 