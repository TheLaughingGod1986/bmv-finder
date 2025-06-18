#!/usr/bin/env node

/**
 * Automated Land Registry Data Update Script
 * 
 * This script can be scheduled to run daily using cron:
 * 0 2 * * * /usr/bin/node /path/to/your/project/cron-update.js
 * 
 * Or using a service like GitHub Actions, Vercel Cron, or a hosting provider's cron service.
 */

const https = require('https');
const http = require('http');

// Configuration
const UPDATE_URL = process.env.UPDATE_URL || 'http://localhost:3000/api/update-land-registry';
const LOG_FILE = process.env.LOG_FILE || './update-logs.txt';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(logMessage.trim());
  
  // Append to log file
  const fs = require('fs');
  fs.appendFileSync(LOG_FILE, logMessage);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(300000, () => { // 5 minute timeout
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function updateLandRegistry() {
  log('Starting automated Land Registry update...');
  
  try {
    log(`Making request to: ${UPDATE_URL}`);
    const response = await makeRequest(UPDATE_URL);
    
    if (response.status === 200 && response.data.success) {
      log('✅ Land Registry update completed successfully!');
      log(`Output: ${response.data.output || 'No output'}`);
      log(`Timestamp: ${response.data.timestamp}`);
    } else {
      log('❌ Land Registry update failed!');
      log(`Status: ${response.status}`);
      log(`Error: ${response.data.error || 'Unknown error'}`);
      log(`Output: ${response.data.output || 'No output'}`);
    }
  } catch (error) {
    log('❌ Land Registry update failed with exception!');
    log(`Error: ${error.message}`);
  }
  
  log('Automated update process completed.');
}

// Run the update
updateLandRegistry().catch((error) => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
}); 