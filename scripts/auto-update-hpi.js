const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  // ONS HPI data sources (multiple URLs to try)
  dataSources: [
    {
      name: 'ONS HPI Full Dataset',
      url: 'https://www.ons.gov.uk/file?uri=/economy/inflationandpriceindices/datasets/housepriceindices/datasets/housepriceindexfornewbuilds/current/hpinb.xlsx',
      filename: 'ons-hpi-latest.xlsx'
    },
    {
      name: 'ONS HPI Main Page',
      url: 'https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/housepriceindices',
      filename: 'ons-hpi-main.html'
    },
    {
      name: 'Land Registry HPI',
      url: 'https://landregistry.data.gov.uk/app/ppd/ppd_data.csv',
      filename: 'land-registry-hpi-latest.csv'
    }
  ],
  
  // Local paths
  dataDir: 'data',
  cleanedDir: 'data/cleaned-datasets',
  backupDir: 'data/backups',
  
  // Elasticsearch settings
  esUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  hpiIndex: 'house_price_index',
  
  // Update frequency (in milliseconds)
  checkInterval: 24 * 60 * 60 * 1000, // 24 hours
  
  // Data retention
  maxBackups: 5
};

// Main auto-update class
class HPIAutoUpdater {
  constructor() {
    this.lastUpdate = null;
    this.currentDataHash = null;
    this.isRunning = false;
  }

  // Initialize the auto-updater
  async init() {
    console.log('🚀 Initializing HPI Auto-Updater...');
    
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
        this.currentDataHash = info.dataHash;
        console.log(`📊 Current data hash: ${this.currentDataHash}`);
      } catch (error) {
        console.warn('⚠️  Could not load update info, starting fresh');
      }
    }
  }

  // Save update information
  async saveUpdateInfo(dataHash) {
    const infoFile = path.join(CONFIG.dataDir, 'update-info.json');
    const info = {
      lastUpdate: new Date().toISOString(),
      dataHash: dataHash,
      version: '1.0.0'
    };
    
    fs.writeFileSync(infoFile, JSON.stringify(info, null, 2));
    this.lastUpdate = new Date();
    this.currentDataHash = dataHash;
  }

  // Check for new data availability
  async checkForUpdates() {
    console.log('🔍 Checking for new HPI data...');
    
    for (const source of CONFIG.dataSources) {
      try {
        console.log(`📡 Checking ${source.name}...`);
        
        const newDataAvailable = await this.checkSourceForUpdates(source);
        
        if (newDataAvailable) {
          console.log(`✅ New data found in ${source.name}`);
          await this.downloadAndUpdate(source);
          return true;
        } else {
          console.log(`ℹ️  No new data in ${source.name}`);
        }
      } catch (error) {
        console.error(`❌ Error checking ${source.name}:`, error.message);
      }
    }
    
    console.log('📭 No new data found in any source');
    return false;
  }

  // Check if a specific source has updates
  async checkSourceForUpdates(source) {
    return new Promise((resolve, reject) => {
      const url = new URL(source.url);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, { timeout: 10000 }, (res) => {
        if (res.statusCode === 200) {
          // For now, assume any successful response means new data
          // In production, you'd check headers like Last-Modified or ETag
          resolve(true);
        } else {
          resolve(false);
        }
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  // Download data from a source
  async downloadData(source) {
    return new Promise((resolve, reject) => {
      const url = new URL(source.url);
      const client = url.protocol === 'https:' ? https : http;
      const filePath = path.join(CONFIG.dataDir, source.filename);
      
      console.log(`📥 Downloading from ${source.name}...`);
      
      const file = fs.createWriteStream(filePath);
      const req = client.get(url, (res) => {
        if (res.statusCode === 200) {
          res.pipe(file);
          
          file.on('finish', () => {
            file.close();
            console.log(`✅ Downloaded: ${source.filename}`);
            resolve(filePath);
          });
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      file.on('error', reject);
    });
  }

  // Clean and prepare the downloaded data
  async cleanData(filePath, source) {
    console.log('🧹 Cleaning downloaded data...');
    
    // Determine file type and use appropriate cleaning method
    if (filePath.endsWith('.csv')) {
      return await this.cleanCSVData(filePath, source);
    } else if (filePath.endsWith('.xlsx')) {
      return await this.cleanExcelData(filePath, source);
    } else {
      throw new Error(`Unsupported file type: ${path.extname(filePath)}`);
    }
  }

  // Clean CSV data
  async cleanCSVData(filePath, source) {
    console.log('🧹 Cleaning CSV data...');
    
    // Determine which cleaning script to use based on the source
    if (source.name.includes('Land Registry')) {
      // Use Land Registry cleaning script
      const { cleanLandRegistryData } = require('./clean-land-registry-data.js');
      
      // Temporarily copy the file to the expected location
      const tempPath = path.join(CONFIG.dataDir, 'land-registry-hpi.csv');
      fs.copyFileSync(filePath, tempPath);
      
      try {
        await cleanLandRegistryData();
        
        // Find the cleaned file that was just created
        const cleanedFiles = fs.readdirSync(CONFIG.cleanedDir)
          .filter(file => file.includes('land-registry-cleaned') && !file.includes('timestamp'))
          .sort((a, b) => {
            const aTime = fs.statSync(path.join(CONFIG.cleanedDir, a)).mtime.getTime();
            const bTime = fs.statSync(path.join(CONFIG.cleanedDir, b)).mtime.getTime();
            return bTime - aTime;
          });
        
        if (cleanedFiles.length === 0) {
          throw new Error('No cleaned land registry file found after cleaning');
        }
        
        // Rename the most recent file to include timestamp
        const baseFile = path.join(CONFIG.cleanedDir, cleanedFiles[0]);
        const cleanedPath = path.join(CONFIG.cleanedDir, `land-registry-cleaned-${Date.now()}.csv`);
        fs.renameSync(baseFile, cleanedPath);
        
        // Clean up temp file
        fs.unlinkSync(tempPath);
        
        return cleanedPath;
      } catch (error) {
        // Clean up temp file on error
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        throw error;
      }
    } else {
      // Use HPI cleaning script
      const { cleanUKHPIData } = require('./clean-uk-hpi-data.js');
      
      // Temporarily copy the file to the expected location
      const tempPath = path.join(CONFIG.dataDir, 'UK-HPI-full-file-2025-04.csv');
      fs.copyFileSync(filePath, tempPath);
      
      try {
        await cleanUKHPIData();
        
        // Find the cleaned file that was just created
        const cleanedFiles = fs.readdirSync(CONFIG.cleanedDir)
          .filter(file => file.includes('uk-hpi-cleaned') && !file.includes('timestamp'))
          .sort((a, b) => {
            const aTime = fs.statSync(path.join(CONFIG.cleanedDir, a)).mtime.getTime();
            const bTime = fs.statSync(path.join(CONFIG.cleanedDir, b)).mtime.getTime();
            return bTime - aTime;
          });
        
        if (cleanedFiles.length === 0) {
          throw new Error('No cleaned HPI file found after cleaning');
        }
        
        // Rename the most recent file to include timestamp
        const baseFile = path.join(CONFIG.cleanedDir, cleanedFiles[0]);
        const cleanedPath = path.join(CONFIG.cleanedDir, `uk-hpi-cleaned-${Date.now()}.csv`);
        fs.renameSync(baseFile, cleanedPath);
        
        // Clean up temp file
        fs.unlinkSync(tempPath);
        
        return cleanedPath;
      } catch (error) {
        // Clean up temp file on error
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        throw error;
      }
    }
  }

  // Clean Excel data (placeholder - would need xlsx library)
  async cleanExcelData(filePath, source) {
    throw new Error('Excel cleaning not yet implemented. Please convert to CSV first.');
  }

  // Update Elasticsearch with new data
  async updateElasticsearch(cleanedDataPath) {
    console.log('🔄 Updating Elasticsearch...');
    
    try {
      // Run the import script directly
      const { execSync } = require('child_process');
      execSync('node scripts/import-all-data.js', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Elasticsearch updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating Elasticsearch:', error.message);
      return false;
    }
  }

  // Create backup of current data
  async createBackup() {
    console.log('💾 Creating backup of current data...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(CONFIG.backupDir, `backup-${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Copy current cleaned datasets
    const files = fs.readdirSync(CONFIG.cleanedDir);
    files.forEach(file => {
      if (file.includes('uk-hpi-cleaned')) {
        const source = path.join(CONFIG.cleanedDir, file);
        const dest = path.join(backupDir, file);
        fs.copyFileSync(source, dest);
      }
    });
    
    // Clean up old backups
    await this.cleanupOldBackups();
    
    console.log(`✅ Backup created: ${backupDir}`);
    return backupDir;
  }

  // Clean up old backups
  async cleanupOldBackups() {
    const backups = fs.readdirSync(CONFIG.backupDir)
      .filter(dir => dir.startsWith('backup-'))
      .map(dir => ({
        name: dir,
        path: path.join(CONFIG.backupDir, dir),
        time: fs.statSync(path.join(CONFIG.backupDir, dir)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    // Keep only the most recent backups
    if (backups.length > CONFIG.maxBackups) {
      const toDelete = backups.slice(CONFIG.maxBackups);
      
      toDelete.forEach(backup => {
        fs.rmSync(backup.path, { recursive: true, force: true });
        console.log(`🗑️  Deleted old backup: ${backup.name}`);
      });
    }
  }

  // Download and update process
  async downloadAndUpdate(source) {
    try {
      // Create backup first
      await this.createBackup();
      
      // Download new data
      const downloadedPath = await this.downloadData(source);
      
      // Clean the data
      const cleanedPath = await this.cleanData(downloadedPath, source);
      
      // Update Elasticsearch
      const updateSuccess = await this.updateElasticsearch(cleanedPath);
      
      if (updateSuccess) {
        // Calculate new data hash
        const newDataHash = await this.calculateDataHash(cleanedPath);
        
        // Save update info
        await this.saveUpdateInfo(newDataHash);
        
        console.log('🎉 Data update completed successfully!');
        return true;
      } else {
        console.error('❌ Elasticsearch update failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Error in download and update process:', error.message);
      return false;
    }
  }

  // Calculate hash of data file
  async calculateDataHash(filePath) {
    const crypto = require('crypto');
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  }

  // Run full update process
  async runFullUpdate() {
    console.log('🚀 Running full HPI data update...');
    
    // Try each data source until one works
    for (const source of CONFIG.dataSources) {
      try {
        console.log(`📡 Attempting update from ${source.name}...`);
        
        const success = await this.downloadAndUpdate(source);
        
        if (success) {
          console.log('✅ Full update completed successfully');
          return true;
        }
      } catch (error) {
        console.error(`❌ Failed to update from ${source.name}:`, error.message);
      }
    }
    
    console.error('❌ All update attempts failed');
    return false;
  }

  // Start the auto-updater
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Auto-updater is already running');
      return;
    }
    
    this.isRunning = true;
    console.log('🚀 Starting HPI Auto-Updater...');
    
    // Run initial check
    await this.checkForUpdates();
    
    // Set up periodic checks
    setInterval(async () => {
      if (this.isRunning) {
        await this.checkForUpdates();
      }
    }, CONFIG.checkInterval);
    
    console.log(`🔄 Auto-updater will check every ${CONFIG.checkInterval / (1000 * 60 * 60)} hours`);
  }

  // Stop the auto-updater
  stop() {
    this.isRunning = false;
    console.log('⏹️  HPI Auto-Updater stopped');
  }

  // Get status information
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate,
      currentDataHash: this.currentDataHash,
      nextCheck: this.lastUpdate ? new Date(this.lastUpdate.getTime() + CONFIG.checkInterval) : null,
      config: CONFIG
    };
  }
}

// CLI interface
async function main() {
  const updater = new HPIAutoUpdater();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    await updater.init();
    
    switch (command) {
      case 'start':
        await updater.start();
        break;
      
      case 'update':
        console.log('🔄 Running manual update...');
        await updater.runFullUpdate();
        break;
      
      case 'check':
        console.log('🔍 Running manual check...');
        await updater.checkForUpdates();
        break;
      
      case 'status':
        const status = updater.getStatus();
        console.log('📊 HPI Auto-Updater Status:');
        console.log(JSON.stringify(status, null, 2));
        break;
      
      case 'stop':
        updater.stop();
        break;
      
      default:
        console.log('🚀 HPI Auto-Updater');
        console.log('');
        console.log('Usage:');
        console.log('  node scripts/auto-update-hpi.js start    # Start auto-updater');
        console.log('  node scripts/auto-update-hpi.js update   # Run manual update');
        console.log('  node scripts/auto-update-hpi.js check    # Check for updates');
        console.log('  node scripts/auto-update-hpi.js status   # Show status');
        console.log('  node scripts/auto-update-hpi.js stop     # Stop auto-updater');
        console.log('');
        console.log('Examples:');
        console.log('  # Start the auto-updater (runs in background)');
        console.log('  node scripts/auto-update-hpi.js start');
        console.log('');
        console.log('  # Run a one-time update');
        console.log('  node scripts/auto-update-hpi.js update');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { HPIAutoUpdater };
