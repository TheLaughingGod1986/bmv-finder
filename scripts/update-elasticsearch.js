const fs = require('fs');
const https = require('https');
const path = require('path');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const CSV_URL = 'https://landregistry.data.gov.uk/pp-complete.csv';
const CSV_FILE = 'pp-complete.csv';
const BACKUP_REPO = 'found-snapshots';
const BACKUP_DIR = 'backups';
const INDEX_NAME = 'properties';

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9201",
  auth: { apiKey: process.env.ES_API_KEY }
});

async function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${filename}...`);
    const file = fs.createWriteStream(filename);
    https.get(url, (response) => {
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
    }).on('error', (err) => {
      fs.unlink(filename, () => {});
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
  const backupName = `properties-backup-${timestamp}`.toLowerCase();
  console.log('Creating backup of current data...');
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
  }
  try {
    const resp = await esClient.snapshot.create({
      repository: BACKUP_REPO,
      snapshot: backupName,
      body: {
        indices: INDEX_NAME,
        ignore_unavailable: true,
        include_global_state: false
      },
      wait_for_completion: true
    });
    console.log(`Backup created: ${backupName}`);
  } catch (error) {
    console.log('Backup failed, continuing without backup...');
    if (error.meta && error.meta.body) {
      console.log(JSON.stringify(error.meta.body));
    } else {
      console.log(error.message);
    }
  }
}

async function deleteIndex() {
  console.log('Deleting old index...');
  try {
    await esClient.indices.delete({
      index: INDEX_NAME,
      timeout: '10m',
      ignore_unavailable: true
    });
    console.log('Index deleted.');
  } catch (error) {
    console.log('Index deletion failed (might not exist), continuing...');
    if (error.meta && error.meta.body) {
      console.log(JSON.stringify(error.meta.body));
    } else {
      console.log(error.message);
    }
  }
}

async function updateData() {
  try {
    console.log('Starting Elasticsearch data update...');
    await backupCurrentData();
    await downloadFile(CSV_URL, CSV_FILE);
    await deleteIndex();
    console.log('Re-importing data...');
    require('child_process').execSync('npm run populate-es', { stdio: 'inherit' });
    console.log('✅ Data update completed successfully!');
  } catch (error) {
    console.error('❌ Data update failed:', error.message);
    process.exit(1);
  }
}

updateData(); 