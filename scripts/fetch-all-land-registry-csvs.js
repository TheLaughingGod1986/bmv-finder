const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_DIR = path.join(__dirname, '../data/land-registry');
const START_YEAR = 1995;
const END_YEAR = new Date().getFullYear();
const CHECKPOINT_FILE = path.join(__dirname, '../data/land-registry/.download_checkpoint');

function saveCheckpoint(year, month) {
  fs.writeFileSync(CHECKPOINT_FILE, `${year},${month}`);
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    const [year, month] = fs.readFileSync(CHECKPOINT_FILE, 'utf8').split(',').map(Number);
    return { year, month };
  }
  return { year: START_YEAR, month: 1 };
}

async function downloadCsv(year, month) {
  const mm = String(month).padStart(2, '0');
  const url = `https://landregistry.data.gov.uk/data/ppd/monthly/file-${year}-${mm}.csv`;
  const yearDir = path.join(BASE_DIR, String(year));
  const filePath = path.join(yearDir, `pp-${year}-${mm}.csv`);
  fs.mkdirSync(yearDir, { recursive: true });
  try {
    console.log(`Downloading ${url} ...`);
    const response = await axios({
      method: 'GET',
      url: url,
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'BMV-Finder-Data-Import/1.0'
      }
    });
    
    fs.writeFileSync(filePath, response.data, 'utf8');
    console.log(`  ✓ Downloaded ${path.basename(filePath)}`);
    saveCheckpoint(year, month);
    return true;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn(`  Not found: ${url}`);
    } else {
      console.error(`  Error downloading ${url}:`, err.message);
    }
    return false;
  }
}

async function fetchAllCsvs() {
  let downloaded = 0;
  let { year, month } = loadCheckpoint();
  for (; year <= END_YEAR; year++) {
    for (; month <= 12; month++) {
      const success = await downloadCsv(year, month);
      if (success) downloaded++;
    }
    month = 1; // Reset month for next year
  }
  console.log(`\nDone! Downloaded ${downloaded} CSV files.`);
  if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE);
}

fetchAllCsvs(); 