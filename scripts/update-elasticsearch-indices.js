#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const LOG_FILE = 'elasticsearch-update.log';
const SCRIPTS = [
  'populate-elasticsearch.js',
  'populate-hpi-index.js', 
  'populate-recent-sales-simple.js'
];

// Logging utility
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  fs.appendFile(LOG_FILE, logMessage + '\n').catch(err => {
    console.error('Failed to write to log file:', err);
  });
}

// Run a script and return a promise
function runScript(scriptName, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Starting ${scriptName}...`);
    
    const nodeOptions = options.nodeOptions || '--max-old-space-size=16384 --expose-gc';
    const args = [scriptName];
    
    const child = spawn('node', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_OPTIONS: nodeOptions },
      cwd: path.join(__dirname, '..')
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      log(`[${scriptName}] ${output.trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      log(`[${scriptName}] ERROR: ${output.trim()}`, 'ERROR');
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${scriptName} completed successfully`);
        resolve({ script: scriptName, code, stdout, stderr });
      } else {
        log(`❌ ${scriptName} failed with code ${code}`, 'ERROR');
        reject(new Error(`${scriptName} failed with code ${code}: ${stderr}`));
      }
    });
    
    child.on('error', (error) => {
      log(`❌ ${scriptName} error: ${error.message}`, 'ERROR');
      reject(error);
    });
  });
}

// Check if CSV files have been updated recently
async function checkDataFreshness() {
  try {
    const dataFiles = [
      'pp-complete-cleaned.csv',
      'hpi-full.csv',
      'hpi-regions.csv'
    ];
    
    const results = {};
    
    for (const file of dataFiles) {
      const filePath = path.join(__dirname, '..', 'data', file);
      
      try {
        const stats = await fs.stat(filePath);
        const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        
        results[file] = {
          exists: true,
          lastModified: stats.mtime,
          ageInHours: Math.round(ageInHours),
          size: stats.size
        };
        
        log(`📁 ${file}: ${Math.round(ageInHours)} hours old, ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
      } catch (error) {
        results[file] = { exists: false, error: error.message };
        log(`❌ ${file}: Not found`, 'ERROR');
      }
    }
    
    return results;
  } catch (error) {
    log(`❌ Failed to check data freshness: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Check Elasticsearch index status
async function checkElasticsearchStatus() {
  try {
    const { Client } = require('@elastic/elasticsearch');
    
    const esClient = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
      requestTimeout: 30000
    });
    
    const indices = ['properties', 'house_price_index', 'recent_sales'];
    const results = {};
    
    for (const index of indices) {
      try {
        const response = await esClient.count({ index });
        results[index] = {
          exists: true,
          documentCount: response.count
        };
        log(`🔍 ${index}: ${response.count.toLocaleString()} documents`);
      } catch (error) {
        results[index] = { exists: false, error: error.message };
        log(`❌ ${index}: Not found`, 'ERROR');
      }
    }
    
    return results;
  } catch (error) {
    log(`❌ Failed to check Elasticsearch status: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Main update function
async function updateElasticsearchIndices(options = {}) {
  const startTime = new Date();
  log('Starting Elasticsearch indices update process...');
  
  try {
    // Check data freshness
    log('Checking data freshness...');
    const dataStatus = await checkDataFreshness();
    
    // Check current Elasticsearch status
    log('Checking current Elasticsearch status...');
    const esStatus = await checkElasticsearchStatus();
    
    // Determine which scripts to run
    const scriptsToRun = [];
    
    if (options.forceAll || !esStatus.properties?.exists) {
      scriptsToRun.push('populate-elasticsearch.js');
    }
    
    if (options.forceAll || !esStatus.house_price_index?.exists) {
      scriptsToRun.push('populate-hpi-index.js');
    }
    
    if (options.forceAll || !esStatus.recent_sales?.exists) {
      scriptsToRun.push('populate-recent-sales-simple.js');
    }
    
    if (scriptsToRun.length === 0) {
      log('✅ All indices exist and are up to date. No updates needed.');
      return { success: true, message: 'No updates needed' };
    }
    
    log(`🔄 Running ${scriptsToRun.length} update scripts...`);
    
    // Run scripts sequentially
    const results = [];
    
    for (const script of scriptsToRun) {
      try {
        const result = await runScript(script, options);
        results.push(result);
      } catch (error) {
        log(`❌ Failed to run ${script}: ${error.message}`, 'ERROR');
        
        if (options.stopOnError) {
          throw error;
        }
        
        results.push({ script, error: error.message });
      }
    }
    
    // Final status check
    log('Checking final Elasticsearch status...');
    const finalEsStatus = await checkElasticsearchStatus();
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    log(`🎉 Elasticsearch update completed in ${duration.toFixed(2)} seconds`);
    
    return {
      success: true,
      duration,
      scriptsRun: scriptsToRun.length,
      results,
      finalStatus: finalEsStatus
    };
    
  } catch (error) {
    log(`❌ Elasticsearch update failed: ${error.message}`, 'ERROR');
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
  const options = {
    forceAll: process.argv.includes('--force-all'),
    stopOnError: process.argv.includes('--stop-on-error'),
    nodeOptions: process.argv.includes('--low-memory') ? '--max-old-space-size=8192' : '--max-old-space-size=16384 --expose-gc'
  };
  
  updateElasticsearchIndices(options).catch(error => {
    log(`Unhandled error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  updateElasticsearchIndices,
  runScript,
  checkDataFreshness,
  checkElasticsearchStatus
}; 