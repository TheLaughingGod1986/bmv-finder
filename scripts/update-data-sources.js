#!/usr/bin/env node

const fs = require('fs').promises;
const axios = require('axios');
const path = require('path');
require('dotenv').config();

// Configuration
const DATA_DIR = 'data';
const LOG_FILE = 'data-update.log';

// Data sources
const DATA_SOURCES = {
  landRegistry: {
    url: 'https://landregistry.data.gov.uk/app/ppd/pp-complete.csv',
    filename: 'pp-complete-new.csv',
    description: 'Land Registry Price Paid Data'
  },
  hpiFull: {
    url: 'https://www.ons.gov.uk/file?uri=/economy/inflationandpriceindices/datasets/housepriceindexfornewpropertiesandexistingdwellings/current/hpi-full.csv',
    filename: 'hpi-full-new.csv',
    description: 'ONS House Price Index Full Data'
  },
  hpiRegions: {
    url: 'https://www.ons.gov.uk/file?uri=/economy/inflationandpriceindices/datasets/housepriceindexfornewpropertiesandexistingdwellings/current/hpi-regions.csv',
    filename: 'hpi-regions-new.csv',
    description: 'ONS House Price Index Regional Data'
  }
};

// Logging utility
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  fs.appendFile(LOG_FILE, logMessage + '\n').catch(err => {
    console.error('Failed to write to log file:', err);
  });
}

// Download file from URL
async function downloadFile(url, filename, description) {
  try {
    log(`Downloading ${description}...`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 300000, // 5 minutes
      headers: {
        'User-Agent': 'BMV-Finder-Data-Updater/1.0'
      }
    });

    const filePath = path.join(DATA_DIR, filename);
    const writer = fs.createWriteStream(filePath);
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        log(`✅ Downloaded ${description} to ${filename}`);
        resolve(filePath);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    log(`❌ Failed to download ${description}: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Clean and validate CSV data
async function cleanLandRegistryData(filePath) {
  try {
    log('Cleaning Land Registry data...');
    
    // Read the file and clean it
    const data = await fs.readFile(filePath, 'utf8');
    const lines = data.split('\n');
    
    // Remove header and clean data
    const cleanedLines = lines
      .slice(1) // Remove header
      .filter(line => line.trim() && line.split(',').length >= 16) // Valid records
      .map(line => {
        // Basic cleaning - remove quotes and normalize
        return line.replace(/"/g, '').trim();
      });
    
    // Write cleaned data
    const cleanedPath = path.join(DATA_DIR, 'pp-complete-cleaned.csv');
    await fs.writeFile(cleanedPath, cleanedLines.join('\n'));
    
    log(`✅ Cleaned Land Registry data: ${cleanedLines.length} records`);
    return cleanedPath;
  } catch (error) {
    log(`❌ Failed to clean Land Registry data: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Backup existing files
async function backupExistingFiles() {
  try {
    log('Creating backups of existing files...');
    
    const filesToBackup = [
      'pp-complete-cleaned.csv',
      'hpi-full.csv',
      'hpi-regions.csv'
    ];
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(DATA_DIR, 'backups', timestamp);
    
    await fs.mkdir(backupDir, { recursive: true });
    
    for (const file of filesToBackup) {
      const sourcePath = path.join(DATA_DIR, file);
      const backupPath = path.join(backupDir, file);
      
      try {
        await fs.copyFile(sourcePath, backupPath);
        log(`✅ Backed up ${file}`);
      } catch (error) {
        log(`⚠️  Could not backup ${file}: ${error.message}`, 'WARN');
      }
    }
    
    return backupDir;
  } catch (error) {
    log(`❌ Failed to create backups: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Replace old files with new ones
async function replaceFiles() {
  try {
    log('Replacing old files with new ones...');
    
    const replacements = [
      { from: 'pp-complete-new.csv', to: 'pp-complete-cleaned.csv' },
      { from: 'hpi-full-new.csv', to: 'hpi-full.csv' },
      { from: 'hpi-regions-new.csv', to: 'hpi-regions.csv' }
    ];
    
    for (const replacement of replacements) {
      const fromPath = path.join(DATA_DIR, replacement.from);
      const toPath = path.join(DATA_DIR, replacement.to);
      
      try {
        await fs.rename(fromPath, toPath);
        log(`✅ Replaced ${replacement.to}`);
      } catch (error) {
        log(`❌ Failed to replace ${replacement.to}: ${error.message}`, 'ERROR');
      }
    }
  } catch (error) {
    log(`❌ Failed to replace files: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Main update function
async function updateDataSources() {
  const startTime = new Date();
  log('Starting data source update process...');
  
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Backup existing files
    const backupDir = await backupExistingFiles();
    
    // Download new data
    const downloadedFiles = [];
    
    for (const [key, source] of Object.entries(DATA_SOURCES)) {
      try {
        const filePath = await downloadFile(source.url, source.filename, source.description);
        downloadedFiles.push({ key, filePath });
      } catch (error) {
        log(`Skipping ${source.description} due to download error`, 'WARN');
      }
    }
    
    // Clean Land Registry data if downloaded
    const landRegistryFile = downloadedFiles.find(f => f.key === 'landRegistry');
    if (landRegistryFile) {
      await cleanLandRegistryData(landRegistryFile.filePath);
    }
    
    // Replace old files with new ones
    await replaceFiles();
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    log(`🎉 Data update completed in ${duration.toFixed(2)} seconds`);
    log(`📁 Backup created at: ${backupDir}`);
    
    return {
      success: true,
      downloadedFiles: downloadedFiles.length,
      backupDir,
      duration
    };
    
  } catch (error) {
    log(`❌ Data update failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  updateDataSources().catch(error => {
    log(`Unhandled error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  updateDataSources,
  downloadFile,
  cleanLandRegistryData,
  backupExistingFiles
}; 