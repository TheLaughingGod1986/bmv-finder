const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Data sources
  dataSources: {
    hpi: [
      {
        name: 'ONS HPI Full Dataset',
        url: 'https://www.ons.gov.uk/file?uri=/economy/inflationandpriceindices/datasets/housepriceindices/datasets/housepriceindexfornewbuilds/current/hpinb.xlsx',
        filename: 'ons-hpi-latest.xlsx',
        type: 'excel'
      },
      {
        name: 'Land Registry HPI',
        url: 'https://landregistry.data.gov.uk/app/ppd/ppd_data.csv',
        filename: 'land-registry-hpi-latest.csv',
        type: 'csv'
      }
    ],
    epc: [
      {
        name: 'EPC Domestic Certificates',
        url: 'https://epc.opendatacommunities.org/files/all-domestic-certificates.zip',
        filename: 'epc-domestic-certificates.zip',
        type: 'zip',
        requiresAuth: true,
        apiKey: 'cd3c1db07626ebf7bdeba18f823851cb3f4003eb',
        headers: {
          'Authorization': 'Bearer cd3c1db07626ebf7bdeba18f823851cb3f4003eb',
          'User-Agent': 'BMV-Finder-Data-Updater/1.0'
        }
      }
    ],
    pricePaid: [
      {
        name: 'Land Registry Price Paid Data',
        url: 'http://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-complete.csv',
        filename: 'pp-complete.csv',
        type: 'csv',
        size: '5GB+',
        records: '30M+'
      }
    ]
  },
  
  // Local paths
  dataDir: 'data',
  cleanedDir: 'data/cleaned-datasets',
  backupDir: 'data/backups',
  
  // Elasticsearch settings
  esUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  indices: {
    hpi: 'house_price_index',
    epc: 'epc_data',
    pricePaid: 'recent_sales'
  },
  
  // Update frequency (in milliseconds)
  checkInterval: 24 * 60 * 60 * 1000, // 24 hours
  
  // Data retention
  maxBackups: 5
};

// Main data auto-updater class
class DataAutoUpdater {
  constructor() {
    this.lastUpdate = null;
    this.currentDataHashes = {};
    this.isRunning = false;
  }

  // Initialize the auto-updater
  async init() {
    console.log('🚀 Initializing Data Auto-Updater...');
    
    // Create necessary directories
    this.ensureDirectories();
    
    // Load last update info
    await this.loadUpdateInfo();
    
    // Check if we need to run initial update
    if (!this.lastUpdate) {
      console.log('📥 No previous update found. Running initial data import...');
      await this.runFullUpdate();
    } else {
      console.log(`📅 Last update: ${this.lastUpdate.toISOString()}`);
      console.log(`🔄 Next check: ${new Date(this.lastUpdate.getTime() + CONFIG.checkInterval).toISOString()}`);
    }
  }

  // Ensure all necessary directories exist
  ensureDirectories() {
    [CONFIG.dataDir, CONFIG.cleanedDir, CONFIG.backupDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  // Load last update information
  async loadUpdateInfo() {
    const infoFile = path.join(CONFIG.dataDir, 'update-info.json');
    
    if (fs.existsSync(infoFile)) {
      try {
        const info = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
        this.lastUpdate = new Date(info.lastUpdate);
        this.currentDataHashes = info.dataHashes || {};
        console.log(`📊 Current data hashes:`, this.currentDataHashes);
      } catch (error) {
        console.warn('⚠️  Could not load update info, starting fresh');
      }
    }
  }

  // Save update information
  async saveUpdateInfo(dataHashes) {
    const infoFile = path.join(CONFIG.dataDir, 'update-info.json');
    const info = {
      lastUpdate: new Date().toISOString(),
      dataHashes: dataHashes
    };
    
    fs.writeFileSync(infoFile, JSON.stringify(info, null, 2));
    console.log('💾 Update info saved');
  }

  // Check for updates across all data sources
  async checkForUpdates() {
    console.log('🔍 Checking for data updates...');
    
    const updates = {};
    
    for (const [dataType, sources] of Object.entries(CONFIG.dataSources)) {
      console.log(`\n📊 Checking ${dataType.toUpperCase()} data sources...`);
      
      for (const source of sources) {
        try {
          const hasUpdate = await this.checkSourceForUpdates(source);
          if (hasUpdate) {
            updates[dataType] = updates[dataType] || [];
            updates[dataType].push(source);
          }
        } catch (error) {
          console.error(`❌ Error checking ${source.name}:`, error.message);
        }
      }
    }
    
    return updates;
  }

  // Check if a specific source has updates
  async checkSourceForUpdates(source) {
    console.log(`  🔍 Checking ${source.name}...`);
    
    try {
      const headers = source.requiresAuth && source.headers ? source.headers : {};
      const remoteInfo = await this.getRemoteFileInfo(source.url, headers);
      const localFile = path.join(CONFIG.dataDir, source.filename);
      
      if (!fs.existsSync(localFile)) {
        console.log(`  📥 New file available: ${source.filename}`);
        return true;
      }
      
      const localStats = fs.statSync(localFile);
      const localHash = await this.calculateDataHash(localFile);
      
      if (remoteInfo.size !== localStats.size || remoteInfo.lastModified > localStats.mtime) {
        console.log(`  🔄 Update available for ${source.filename}`);
        return true;
      }
      
      console.log(`  ✅ ${source.filename} is up to date`);
      return false;
      
    } catch (error) {
      console.error(`  ❌ Error checking ${source.name}:`, error.message);
      return false;
    }
  }

  // Get remote file information
  async getRemoteFileInfo(url, headers = {}) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      const options = {
        method: 'HEAD',
        headers: {
          'User-Agent': 'BMV-Finder-Data-Updater/1.0',
          ...headers
        }
      };
      
      const req = protocol.get(url, options, (res) => {
        if (res.statusCode === 200) {
          resolve({
            size: parseInt(res.headers['content-length'] || '0'),
            lastModified: new Date(res.headers['last-modified'] || Date.now()),
            etag: res.headers.etag
          });
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => req.destroy());
    });
  }

  // Download data from a source
  async downloadData(source) {
    console.log(`📥 Downloading ${source.name}...`);
    
    const outputFile = path.join(CONFIG.dataDir, source.filename);
    
    try {
      if (source.requiresAuth && source.headers) {
        console.log(`🔐 Using authenticated download for ${source.name}`);
        await this.downloadFile(source.url, outputFile, source.headers);
      } else {
        await this.downloadFile(source.url, outputFile);
      }
      
      console.log(`✅ Downloaded ${source.filename}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to download ${source.filename}:`, error.message);
      return false;
    }
  }

  // Download a file from URL
  async downloadFile(url, outputFile, headers = {}) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      const file = fs.createWriteStream(outputFile);
      
      const options = {
        headers: {
          'User-Agent': 'BMV-Finder-Data-Updater/1.0',
          ...headers
        }
      };
      
      const req = protocol.get(url, options, (res) => {
        if (res.statusCode === 200) {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
      
      req.on('error', reject);
      file.on('error', reject);
      req.setTimeout(300000, () => req.destroy()); // 5 minute timeout
    });
  }

  // Clean and process downloaded data
  async cleanData(dataType, source) {
    console.log(`🧹 Cleaning ${dataType} data from ${source.name}...`);
    
    try {
      switch (dataType) {
        case 'hpi':
          return await this.cleanHPIData(source);
        case 'epc':
          return await this.cleanEPCData(source);
        case 'pricePaid':
          return await this.cleanPricePaidData(source);
        default:
          console.log(`⚠️  Unknown data type: ${dataType}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Error cleaning ${dataType} data:`, error.message);
      return false;
    }
  }

  // Clean HPI data
  async cleanHPIData(source) {
    if (source.type === 'excel') {
      console.log('  📊 Converting Excel to CSV...');
      execSync(`node scripts/excel-to-csv.js "${path.join(CONFIG.dataDir, source.filename)}"`, { stdio: 'inherit' });
    }
    
    console.log('  🧹 Cleaning HPI CSV data...');
    execSync('node scripts/clean-uk-hpi-data.js', { stdio: 'inherit' });
    
    return true;
  }

  // Clean EPC data
  async cleanEPCData(source) {
    if (source.type === 'zip') {
      console.log('  📦 Extracting EPC data from ZIP...');
      execSync(`cd ${CONFIG.dataDir} && unzip -o "${source.filename}"`, { stdio: 'inherit' });
    }
    
    console.log('  🧹 Cleaning EPC data...');
    execSync('node scripts/clean-epc-data.js', { stdio: 'inherit' });
    
    return true;
  }

  // Clean Price Paid data
  async cleanPricePaidData(source) {
    console.log('  🧹 Cleaning Price Paid data...');
    execSync('node scripts/clean-price-paid-streaming.js', { stdio: 'inherit' });
    
    // Split into chunks for processing
    console.log('  ✂️  Splitting into chunks...');
    execSync(`cd ${CONFIG.dataDir} && split -l 100000 --additional-suffix=.csv pp-complete.csv cleaned-datasets/price-paid-chunk-`, { stdio: 'inherit' });
    
    return true;
  }

  // Update Elasticsearch with cleaned data
  async updateElasticsearch(dataType) {
    console.log(`📊 Updating Elasticsearch with ${dataType} data...`);
    
    try {
      switch (dataType) {
        case 'hpi':
        case 'pricePaid':
          execSync('node scripts/import-all-data.js', { stdio: 'inherit' });
          break;
        case 'epc':
          execSync('node scripts/import-epc-data.js', { stdio: 'inherit' });
          break;
        default:
          console.log(`⚠️  Unknown data type: ${dataType}`);
          return false;
      }
      
      console.log(`✅ Elasticsearch updated with ${dataType} data`);
      return true;
    } catch (error) {
      console.error(`❌ Error updating Elasticsearch:`, error.message);
      return false;
    }
  }

  // Create backup of cleaned data
  async createBackup(dataType) {
    const timestamp = Date.now();
    const backupDir = path.join(CONFIG.backupDir, `${dataType}-${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Copy cleaned data files
    const cleanedFiles = fs.readdirSync(CONFIG.cleanedDir)
      .filter(file => file.includes(dataType) || file.includes('price-paid-chunk-'));
    
    for (const file of cleanedFiles) {
      const source = path.join(CONFIG.cleanedDir, file);
      const dest = path.join(backupDir, file);
      fs.copyFileSync(source, dest);
    }
    
    console.log(`💾 Backup created: ${backupDir}`);
    return backupDir;
  }

  // Clean up old backups
  async cleanupOldBackups() {
    const backups = fs.readdirSync(CONFIG.backupDir)
      .filter(dir => fs.statSync(path.join(CONFIG.backupDir, dir)).isDirectory())
      .map(dir => ({
        name: dir,
        path: path.join(CONFIG.backupDir, dir),
        mtime: fs.statSync(path.join(CONFIG.backupDir, dir)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    if (backups.length > CONFIG.maxBackups) {
      const toDelete = backups.slice(CONFIG.maxBackups);
      for (const backup of toDelete) {
        fs.rmSync(backup.path, { recursive: true });
        console.log(`🗑️  Deleted old backup: ${backup.name}`);
      }
    }
  }

  // Calculate hash of a file
  async calculateDataHash(filePath) {
    const crypto = require('crypto');
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  // Run a full update for all data types
  async runFullUpdate() {
    console.log('🚀 Running full data update...');
    
    const dataHashes = {};
    
    for (const [dataType, sources] of Object.entries(CONFIG.dataSources)) {
      console.log(`\n📊 Processing ${dataType.toUpperCase()} data...`);
      
      for (const source of sources) {
        try {
          // Download
          const downloaded = await this.downloadData(source);
          if (!downloaded) continue;
          
          // Clean
          const cleaned = await this.cleanData(dataType, source);
          if (!cleaned) continue;
          
          // Backup
          await this.createBackup(dataType);
          
          // Update Elasticsearch
          const updated = await this.updateElasticsearch(dataType);
          if (updated) {
            // Calculate hash of cleaned data
            const cleanedFiles = fs.readdirSync(CONFIG.cleanedDir)
              .filter(file => file.includes(dataType) || file.includes('price-paid-chunk-'));
            
            if (cleanedFiles.length > 0) {
              const mainFile = path.join(CONFIG.cleanedDir, cleanedFiles[0]);
              dataHashes[dataType] = await this.calculateDataHash(mainFile);
            }
          }
          
        } catch (error) {
          console.error(`❌ Error processing ${dataType}:`, error.message);
        }
      }
    }
    
    // Save update info
    await this.saveUpdateInfo(dataHashes);
    
    // Cleanup old backups
    await this.cleanupOldBackups();
    
    console.log('✅ Full data update completed');
  }

  // Start the auto-updater
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Auto-updater is already running');
      return;
    }
    
    this.isRunning = true;
    console.log('🚀 Starting data auto-updater...');
    
    try {
      await this.init();
      
      // Set up periodic checks
      setInterval(async () => {
        if (!this.isRunning) return;
        
        try {
          const updates = await this.checkForUpdates();
          
          if (Object.keys(updates).length > 0) {
            console.log('🔄 Updates found, running update...');
            await this.runFullUpdate();
          } else {
            console.log('✅ No updates found');
          }
        } catch (error) {
          console.error('❌ Error during update check:', error.message);
        }
      }, CONFIG.checkInterval);
      
    } catch (error) {
      console.error('❌ Failed to start auto-updater:', error.message);
      this.isRunning = false;
    }
  }

  // Stop the auto-updater
  stop() {
    this.isRunning = false;
    console.log('🛑 Data auto-updater stopped');
  }

  // Get current status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate,
      currentDataHashes: this.currentDataHashes,
      nextCheck: this.lastUpdate ? new Date(this.lastUpdate.getTime() + CONFIG.checkInterval) : null
    };
  }
}

// CLI interface
if (require.main === module) {
  const updater = new DataAutoUpdater();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      updater.start();
      break;
    case 'update':
      updater.runFullUpdate();
      break;
    case 'check':
      updater.checkForUpdates().then(updates => {
        console.log('Available updates:', updates);
      });
      break;
    case 'status':
      console.log('Status:', updater.getStatus());
      break;
    default:
      console.log('Usage: node auto-update-data.js [start|update|check|status]');
      console.log('  start  - Start the auto-updater service');
      console.log('  update - Run a full update now');
      console.log('  check  - Check for available updates');
      console.log('  status - Show current status');
  }
}

module.exports = { DataAutoUpdater };
