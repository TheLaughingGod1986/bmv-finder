const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const path = require('path');

const CSV_URL = 'http://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-complete.csv';
const CSV_FILE = 'pp-complete.csv';
const BACKUP_DIR = 'backups';

async function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${filename}...`);
    
    const file = fs.createWriteStream(filename);
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const progress = ((downloaded / totalSize) * 100).toFixed(2);
        process.stdout.write(`\rDownload progress: ${progress}%`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`\nDownload completed: ${filename}`);
        resolve();
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(filename, () => {}); // Delete the file if download fails
      reject(err);
    });
    
    file.on('error', (err) => {
      fs.unlink(filename, () => {});
      reject(err);
    });
  });
}

async function backupCurrentData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `properties-backup-${timestamp}`;
  
  console.log('Creating backup of current data...');
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
  }
  
  // Create a snapshot of the current index
  try {
    execSync(`curl -k -u "elastic:TIRv--dMe*rHmuRMm-b4" -X PUT "https://localhost:9200/_snapshot/backup_repo/${backupName}?wait_for_completion=true"`, { stdio: 'inherit' });
    console.log(`Backup created: ${backupName}`);
  } catch (error) {
    console.log('Backup failed, continuing without backup...');
  }
}

async function updateData() {
  try {
    console.log('Starting Elasticsearch data update...');
    
    // Step 1: Backup current data
    await backupCurrentData();
    
    // Step 2: Download latest CSV
    await downloadFile(CSV_URL, CSV_FILE);
    
    // Step 3: Delete old index
    console.log('Deleting old index...');
    try {
      execSync(`curl -k -u "elastic:TIRv--dMe*rHmuRMm-b4" -X DELETE "https://localhost:9200/properties"`, { stdio: 'inherit' });
    } catch (error) {
      console.log('Index deletion failed (might not exist), continuing...');
    }
    
    // Step 4: Re-import data
    console.log('Re-importing data...');
    execSync('npm run populate-es', { stdio: 'inherit' });
    
    console.log('✅ Data update completed successfully!');
    
  } catch (error) {
    console.error('❌ Data update failed:', error.message);
    process.exit(1);
  }
}

// Run the update
updateData(); 