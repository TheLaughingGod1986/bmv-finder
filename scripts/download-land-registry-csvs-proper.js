const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_DIR = path.join(__dirname, '../data/land-registry');
const START_YEAR = 1995;
const END_YEAR = new Date().getFullYear();
const CHECKPOINT_FILE = path.join(__dirname, '../data/land-registry/.download_checkpoint_proper');

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
  
  // Create directory if it doesn't exist
  fs.mkdirSync(yearDir, { recursive: true });
  
  try {
    console.log(`Downloading ${url} ...`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 60000, // 60 second timeout
      headers: {
        'User-Agent': 'BMV-Finder-Data-Import/1.0',
        'Accept': 'text/csv'
      }
    });
    
    // Check if response is successful
    if (response.status !== 200) {
      console.warn(`  HTTP ${response.status}: ${url}`);
      return false;
    }
    
    // Check content type to ensure it's CSV
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/csv') && !contentType.includes('application/csv')) {
      console.warn(`  Not a CSV file (content-type: ${contentType}): ${url}`);
      return false;
    }
    
    // Write the file
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        // Check if file has actual data (more than just headers)
        const stats = fs.statSync(filePath);
        if (stats.size < 100) {
          console.warn(`  File too small (${stats.size} bytes): ${url}`);
          fs.unlinkSync(filePath); // Delete the small file
          resolve(false);
        } else {
          console.log(`  ✓ Downloaded ${path.basename(filePath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
          saveCheckpoint(year, month);
          resolve(true);
        }
      });
      
      writer.on('error', (error) => {
        console.error(`  Error writing file: ${error.message}`);
        reject(error);
      });
    });
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`  Not found: ${url}`);
    } else {
      console.error(`  Error downloading ${url}: ${error.message}`);
    }
    return false;
  }
}

async function downloadAllCsvs() {
  let downloaded = 0;
  let { year, month } = loadCheckpoint();
  
  console.log(`Starting download from year ${year}, month ${month}...`);
  
  for (; year <= END_YEAR; year++) {
    for (; month <= 12; month++) {
      const success = await downloadCsv(year, month);
      if (success) downloaded++;
      
      // Add a small delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    month = 1; // Reset month for next year
  }
  
  console.log(`\nDone! Downloaded ${downloaded} CSV files.`);
  
  // Clean up checkpoint file
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
  }
}

// Run the download
downloadAllCsvs().catch(console.error); 