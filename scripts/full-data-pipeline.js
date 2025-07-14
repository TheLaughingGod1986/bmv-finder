#!/usr/bin/env node

const { updateDataSources } = require('./update-data-sources');
const { updateElasticsearchIndices } = require('./update-elasticsearch-indices');
require('dotenv').config();

// Configuration
const LOG_FILE = 'full-pipeline.log';

// Logging utility
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  const fs = require('fs').promises;
  fs.appendFile(LOG_FILE, logMessage + '\n').catch(err => {
    console.error('Failed to write to log file:', err);
  });
}

// Main pipeline function
async function runFullDataPipeline(options = {}) {
  const startTime = new Date();
  log('🚀 Starting full data pipeline...');
  
  try {
    // Step 1: Update CSV data sources
    log('📥 Step 1: Updating CSV data sources...');
    const dataUpdateResult = await updateDataSources();
    
    if (!dataUpdateResult.success) {
      throw new Error('Data source update failed');
    }
    
    log(`✅ Data sources updated: ${dataUpdateResult.downloadedFiles} files downloaded`);
    
    // Step 2: Update Elasticsearch indices
    log('🔍 Step 2: Updating Elasticsearch indices...');
    const esUpdateResult = await updateElasticsearchIndices({
      forceAll: options.forceAll,
      stopOnError: options.stopOnError
    });
    
    if (!esUpdateResult.success) {
      throw new Error('Elasticsearch update failed');
    }
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    log(`🎉 Full data pipeline completed successfully!`);
    log(`⏱️  Total duration: ${duration.toFixed(2)} seconds`);
    log(`📊 Scripts run: ${esUpdateResult.scriptsRun}`);
    log(`📁 Backup location: ${dataUpdateResult.backupDir}`);
    
    return {
      success: true,
      duration,
      dataUpdate: dataUpdateResult,
      elasticsearchUpdate: esUpdateResult
    };
    
  } catch (error) {
    log(`❌ Full data pipeline failed: ${error.message}`, 'ERROR');
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

// Run the pipeline
if (require.main === module) {
  const options = {
    forceAll: process.argv.includes('--force-all'),
    stopOnError: process.argv.includes('--stop-on-error')
  };
  
  runFullDataPipeline(options).catch(error => {
    log(`Unhandled error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  runFullDataPipeline
}; 