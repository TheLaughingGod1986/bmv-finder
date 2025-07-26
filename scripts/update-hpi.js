#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config();

const { Client } = require('@elastic/elasticsearch');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const INDEX_NAME = 'house_price_index';
const HPI_FILE_PATH = './data/hpi-regions.csv'; // Use local file instead of URL
const LOG_FILE = 'hpi-update.log';

// Initialize Elasticsearch client with Elastic Cloud config
const esClient = new Client({
  node: 'http://localhost:9201'
});

// Logging function
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  // Also write to log file
  fs.appendFile(LOG_FILE, logMessage + '\n').catch(err => {
    console.error('Error writing to log file:', err.message);
  });
}

// Create HPI index if it doesn't exist
async function createHpiIndex() {
  try {
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    
    if (!indexExists) {
      log(`Creating HPI index: ${INDEX_NAME}`);
      
      await esClient.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              date: { type: 'date' },
              year: { type: 'integer' },
              month: { type: 'integer' },
              index: { type: 'float' },
              postcode: { type: 'keyword' },
              region: { type: 'keyword' },
              regionCode: { type: 'keyword' },
              regionType: { type: 'keyword' },
              source: { type: 'keyword' },
              lastUpdated: { type: 'date' }
            }
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0
          }
        }
      });
      
      log(`HPI index created successfully`);
    } else {
      log(`HPI index already exists: ${INDEX_NAME}`);
    }
  } catch (error) {
    log(`Error creating HPI index: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Download HPI data from ONS
async function downloadHpiData() {
  try {
    log('Reading HPI data from local file...');
    
    // Check if file exists
    try {
      await fs.access(HPI_FILE_PATH);
    } catch (error) {
      throw new Error(`HPI file not found at ${HPI_FILE_PATH}. Please download the latest UK HPI full CSV from https://www.gov.uk/government/statistical-data-sets/uk-house-price-index-data-downloads and place it in the data/ directory.`);
    }
    
    const csvString = await fs.readFile(HPI_FILE_PATH, 'utf8');
    log(`Read ${csvString.length} characters from local HPI file`);
    return csvString;
  } catch (error) {
    log(`Error reading HPI file: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Parse CSV data
function parseCsvData(csvData) {
  try {
    const records = csvData.split('\n').slice(1); // Skip header
    log(`Parsing ${records.length} HPI records...`);
    
    const documents = [];
    let validRecords = 0;
    
    records.forEach(record => {
      // Skip empty records
      if (!record.trim()) return;
      
      const fields = record.split(',').map(field => field.replace(/"/g, '').trim());
      
      // Map CSV fields to expected structure (regionLabel,date,hpiIndex)
      const regionLabel = fields[0]; // "regionLabel" column
      const date = fields[1]; // "date" column (format: "1995-01")
      const hpiIndex = fields[2]; // "hpiIndex" column
      
      // Skip records without essential data
      if (!date || !hpiIndex) return;
      
      // Parse period (format: "1990-01", "2024-07")
      const [year, month] = date.split('-');
      if (!year || !month) return;
      
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum)) return;
      
      const document = {
        date: date,
        year: yearNum,
        month: monthNum,
        index: parseFloat(hpiIndex) || 0,
        region: regionLabel || 'Unknown',
        regionCode: '', // Not available in this format
        source: 'ONS HPI',
        lastUpdated: new Date().toISOString()
      };
      
      documents.push(document);
      validRecords++;
    });
    
    log(`Parsed ${validRecords} valid HPI records out of ${records.length} total records`);
    return documents;
  } catch (error) {
    log(`Error parsing CSV data: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Index HPI data into Elasticsearch
async function indexHpiData(records) {
  try {
    log(`Indexing ${records.length} HPI records...`);
    
    const batchSize = 100;
    let indexed = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const operations = [];
      
      batch.forEach(record => {
        // Skip records without essential data
        if (!record.date || !record.index) return;
        
        const document = {
          date: record.date,
          year: record.year,
          month: record.month,
          index: record.index,
          region: record.region,
          regionCode: record.regionCode,
          source: record.source,
          lastUpdated: record.lastUpdated
        };
        
        operations.push({ index: { _index: INDEX_NAME } });
        operations.push(document);
      });
      
      if (operations.length > 0) {
        await esClient.bulk({ body: operations });
        indexed += operations.length / 2;
        log(`Indexed batch: ${indexed}/${records.length} records`);
      }
    }
    
    log(`Successfully indexed ${indexed} HPI records`);
    return indexed;
  } catch (error) {
    log(`Error indexing HPI data: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Main execution function
async function main() {
  try {
    log('Starting HPI update process...');
    
    // Test Elasticsearch connection
    await esClient.ping();
    log('Elasticsearch connection successful');
    
    // Create index if needed
    await createHpiIndex();
    
    // Download and parse data
    const csvData = await downloadHpiData();
    const records = parseCsvData(csvData);
    
    // Index the data
    const indexedCount = await indexHpiData(records);
    
    log(`HPI update completed successfully. Indexed ${indexedCount} records.`);
    
  } catch (error) {
    log(`HPI update failed: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, createHpiIndex, downloadHpiData, parseCsvData, indexHpiData }; 