const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const BASE_DIR = path.join(__dirname, '../data/land-registry');

async function downloadAndReplaceCsv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let uri;
    try {
      // Try to parse as JSON
      const json = JSON.parse(content);
      uri = json.uri;
    } catch (e) {
      // Not a JSON file, skip
      return false;
    }
    if (!uri) {
      console.warn(`No URI found in ${filePath}`);
      return false;
    }
    console.log(`Downloading CSV for ${filePath} from ${uri} ...`);
    const res = await fetch(uri);
    if (!res.ok) {
      console.error(`Failed to download ${uri}: ${res.statusText}`);
      return false;
    }
    const csvData = await res.text();
    fs.writeFileSync(filePath, csvData, 'utf8');
    console.log(`Replaced ${filePath} with downloaded CSV.`);
    return true;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
    return false;
  }
}

async function processAllCsvs() {
  let replaced = 0;
  const years = fs.readdirSync(BASE_DIR).filter(f => fs.statSync(path.join(BASE_DIR, f)).isDirectory());
  for (const year of years) {
    const yearDir = path.join(BASE_DIR, year);
    const files = fs.readdirSync(yearDir).filter(f => f.endsWith('.csv'));
    for (const file of files) {
      const filePath = path.join(yearDir, file);
      const success = await downloadAndReplaceCsv(filePath);
      if (success) replaced++;
    }
  }
  console.log(`\nDone! Replaced ${replaced} files with actual CSVs.`);
}

processAllCsvs(); 