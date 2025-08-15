#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const { Client } = require('@elastic/elasticsearch');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const INDEX_NAME = 'recent_sales';
const PROPERTIES_INDEX = 'properties';
const BATCH_SIZE = 100;
const LOG_FILE = 'recent-sales-simple.log';

// Initialize Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000,
  maxRetries: 3,
  retryOnTimeout: true,
});

// Logging utility
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  fs.appendFile(LOG_FILE, logMessage + '\n').catch(err => {
    console.error('Failed to write to log file:', err);
  });
}

// Create Elasticsearch index
async function createIndex() {
  try {
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    
    if (!indexExists) {
      log(`Creating index: ${INDEX_NAME}`);
      
      await esClient.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              transactionId: { type: 'keyword' },
              postcode: { type: 'keyword' },
              pricePaid: { type: 'float' },
              dateOfTransfer: { type: 'date' },
              propertyType: { type: 'keyword' },
              newBuild: { type: 'boolean' },
              estateType: { type: 'keyword' },
              paon: { type: 'text' },
              saon: { type: 'text' },
              street: { type: 'text' },
              locality: { type: 'text' },
              town: { type: 'text' },
              district: { type: 'keyword' },
              county: { type: 'keyword' },
              transactionCategory: { type: 'keyword' },
              recordStatus: { type: 'keyword' },
              indexedAt: { type: 'date' },
              source: { type: 'keyword' }
            }
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0
          }
        }
      });
      
      log(`Index ${INDEX_NAME} created successfully`);
    } else {
      log(`Index ${INDEX_NAME} already exists`);
    }
  } catch (error) {
    log(`Error creating index: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Get recent sales directly from properties index
async function getRecentSales() {
  try {
    log('Fetching recent sales from properties index...');
    
    // Get sales from the last 2 years (2023-2024)
    const response = await esClient.search({
      index: PROPERTIES_INDEX,
      scroll: '30s',
      size: 1000,
      body: {
        query: {
          range: {
            year: {
              gte: 1998
            }
          }
        },
        sort: [
          { dateOfTransfer: { order: 'desc' } }
        ]
      }
    });

    const sales = [];
    let scrollId = response._scroll_id;
    let processed = 0;
    let currentResponse = response;

    while (currentResponse.hits.hits.length > 0 && sales.length < 50000) { // Limit to 50k recent sales
      // Transform properties to recent sales format
      currentResponse.hits.hits.forEach(hit => {
        const source = hit._source;
        sales.push({
          transactionId: source.id || `recent_${hit._id}`,
          postcode: source.postcode || '',
          pricePaid: source.price || 0,
          dateOfTransfer: source.dateOfTransfer || '',
          propertyType: source.propertyType || '',
          newBuild: source.old_new === 'Y',
          estateType: source.propertyTypeLabel || '',
          paon: source.paon || '',
          saon: source.saon || '',
          street: source.street || '',
          locality: source.locality || '',
          town: source.town_city || '',
          district: source.district || '',
          county: source.county || '',
          transactionCategory: source.transactionCategory || '',
          recordStatus: source.recordStatus || '',
          indexedAt: new Date().toISOString(),
          source: 'properties_recent'
        });
      });

      processed += currentResponse.hits.hits.length;
      log(`Processed ${processed} documents, found ${sales.length} recent sales`);

      // Get next batch
      currentResponse = await esClient.scroll({
        scroll_id: scrollId,
        scroll: '30s'
      });
    }

    // Clear scroll
    await esClient.clearScroll({ scroll_id: scrollId });

    log(`Found ${sales.length} recent sales from properties index`);
    return sales;
  } catch (error) {
    log(`Error fetching recent sales: ${error.message}`, 'ERROR');
    return [];
  }
}

// Index sales data
async function indexSales(sales) {
  if (sales.length === 0) return 0;
  
  try {
    log(`Indexing ${sales.length} sales records`);
    
    const operations = sales.flatMap(sale => [
      { index: { _index: INDEX_NAME, _id: sale.transactionId } },
      sale
    ]);
    
    const response = await esClient.bulk({
      body: operations,
      refresh: true
    });
    
    if (response.errors) {
      const errors = response.items.filter(item => item.index?.error);
      log(`Bulk indexing completed with ${errors.length} errors`, 'WARN');
      errors.forEach(error => {
        log(`Indexing error: ${JSON.stringify(error.index.error)}`, 'ERROR');
      });
    } else {
      log(`Successfully indexed ${sales.length} sales records`);
    }
    
    return sales.length;
  } catch (error) {
    log(`Error indexing sales: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Main execution function
async function main() {
  const startTime = new Date();
  log('Starting simplified recent sales indexing process');
  
  try {
    // Create index if it doesn't exist
    await createIndex();
    
    // Get recent sales from properties index
    const sales = await getRecentSales();
    
    if (sales.length === 0) {
      log('No recent sales found. Exiting.');
      return;
    }
    
    // Index the sales data
    const indexed = await indexSales(sales);
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    log(`Indexing process completed in ${duration.toFixed(2)} seconds`);
    log(`Total records indexed: ${indexed}`);
    
  } catch (error) {
    log(`Fatal error in main process: ${error.message}`, 'ERROR');
    process.exit(1);
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
  main().catch(error => {
    log(`Unhandled error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  createIndex,
  getRecentSales,
  indexSales
}; 