#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { Client } = require('@elastic/elasticsearch');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const INDEX_NAME = 'recent_sales';
const PROPERTIES_INDEX = 'properties'; // Our main properties index
const BATCH_SIZE = 100;
const MAX_POSTCODES_PER_RUN = 1000; // Limit to prevent overwhelming the API
const LOG_FILE = 'recent-sales-indexing.log';

// Initialize Elasticsearch client with same config as main app
const clientConfig = {
  node: process.env.ELASTICSEARCH_URL || 'https://localhost:9200',
};

// Prefer API key authentication if available
if (process.env.ELASTICSEARCH_API_KEY) {
  clientConfig.auth = {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  };
} else if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
  clientConfig.auth = {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  };
} else {
  throw new Error('Missing Elasticsearch credentials in environment variables.');
}

// Always allow self-signed certs for this client
clientConfig.tls = {
  rejectUnauthorized: false
};

const esClient = new Client(clientConfig);

// Logging utility
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  // Append to log file
  fs.appendFile(LOG_FILE, logMessage + '\n').catch(err => {
    console.error('Failed to write to log file:', err);
  });
}

// Create Elasticsearch index with proper mapping
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
              paon: { type: 'text' }, // Primary Addressable Object Name
              saon: { type: 'text' }, // Secondary Addressable Object Name
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

// Fetch recent sales from our existing property data
async function fetchRecentSalesFromES(postcode, limit = 50) {
  try {
    log(`Fetching recent sales from ES for postcode: ${postcode}`);
    
    // Query our properties index for recent sales in this postcode
    const response = await esClient.search({
      index: PROPERTIES_INDEX,
      body: {
        query: {
          bool: {
            should: [
              { match_phrase: { postcode: postcode } },
              { match_phrase: { postcode: postcode.replace(/\s+/g, '') } }
            ]
          }
        },
        sort: [
          { dateOfTransfer: { order: 'desc' } }
        ],
        size: limit
      }
    });

    if (!response.hits || !response.hits.hits) {
      log(`No results found in ES for postcode: ${postcode}`);
      return [];
    }

    const sales = response.hits.hits.map(hit => {
      const source = hit._source;
      return {
        transactionId: source.transactionId || `es_${hit._id}`,
        postcode: source.postcode || postcode,
        pricePaid: source.price || 0,
        dateOfTransfer: source.dateOfTransfer || '',
        propertyType: source.propertyType || '',
        newBuild: source.newBuild || false,
        estateType: source.estateType || '',
        paon: source.paon || '',
        saon: source.saon || '',
        street: source.street || '',
        locality: source.locality || '',
        town: source.town || '',
        district: source.district || '',
        county: source.county || '',
        transactionCategory: source.transactionCategory || '',
        recordStatus: source.recordStatus || '',
        indexedAt: new Date().toISOString(),
        source: 'elasticsearch_properties'
      };
    });

    log(`Found ${sales.length} recent sales from ES for postcode: ${postcode}`);
    return sales;
  } catch (error) {
    log(`Error fetching sales from ES for ${postcode}: ${error.message}`, 'ERROR');
    return [];
  }
}

// Fallback: Try Land Registry SPARQL endpoint (less reliable)
async function fetchRecentSalesFromSPARQL(postcode, limit = 50) {
  // Try both with and without spaces
  const formats = [postcode, postcode.replace(/\s+/g, '')];
  for (const pc of formats) {
    try {
      log(`Fetching recent sales from SPARQL for postcode: ${pc}`);
      const sparqlQuery = `
        PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
        PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        SELECT ?transaction ?pricePaid ?dateOfTransfer ?propertyType ?newBuild ?estateType 
               ?paon ?saon ?street ?locality ?town ?district ?county ?transactionCategory ?recordStatus
        WHERE {
          ?transaction lrppi:pricePaid ?pricePaid ;
                      lrppi:dateOfTransfer ?dateOfTransfer ;
                      lrppi:propertyAddress ?address .
          
          ?address lrcommon:postcode "${pc}" .
          
          OPTIONAL { ?transaction lrppi:propertyType ?propertyType }
          OPTIONAL { ?transaction lrppi:newBuild ?newBuild }
          OPTIONAL { ?transaction lrppi:estateType ?estateType }
          OPTIONAL { ?address lrcommon:paon ?paon }
          OPTIONAL { ?address lrcommon:saon ?saon }
          OPTIONAL { ?address lrcommon:street ?street }
          OPTIONAL { ?address lrcommon:locality ?locality }
          OPTIONAL { ?address lrcommon:town ?town }
          OPTIONAL { ?address lrcommon:district ?district }
          OPTIONAL { ?address lrcommon:county ?county }
          OPTIONAL { ?transaction lrppi:transactionCategory ?transactionCategory }
          OPTIONAL { ?transaction lrppi:recordStatus ?recordStatus }
        }
        ORDER BY DESC(?dateOfTransfer)
        LIMIT ${limit}
      `;
      
      const response = await axios.post('https://landregistry.data.gov.uk/landregistry/query', sparqlQuery, {
        headers: {
          'Content-Type': 'application/sparql-query',
          'Accept': 'application/sparql-results+json'
        },
        timeout: 30000
      });
      
      if (!response.data || !response.data.results || !response.data.results.bindings) {
        log(`No results returned from SPARQL for postcode: ${pc}`);
        continue;
      }
      
      const sales = response.data.results.bindings.map(binding => ({
        transactionId: binding.transaction?.value || '',
        postcode: pc,
        pricePaid: parseFloat(binding.pricePaid?.value) || 0,
        dateOfTransfer: binding.dateOfTransfer?.value || '',
        propertyType: binding.propertyType?.value || '',
        newBuild: binding.newBuild?.value === 'Y',
        estateType: binding.estateType?.value || '',
        paon: binding.paon?.value || '',
        saon: binding.saon?.value || '',
        street: binding.street?.value || '',
        locality: binding.locality?.value || '',
        town: binding.town?.value || '',
        district: binding.district?.value || '',
        county: binding.county?.value || '',
        transactionCategory: binding.transactionCategory?.value || '',
        recordStatus: binding.recordStatus?.value || '',
        indexedAt: new Date().toISOString(),
        source: 'land_registry_sparql'
      }));
      
      log(`Found ${sales.length} recent sales from SPARQL for postcode: ${pc}`);
      if (sales.length > 0) return sales;
    } catch (error) {
      log(`Error fetching sales from SPARQL for ${pc}: ${error.message}`, 'ERROR');
    }
  }
  return [];
}

// Fetch recent sales (try ES first, then SPARQL as fallback)
async function fetchRecentSales(postcode, limit = 50) {
  // First try our ES data
  let sales = await fetchRecentSalesFromES(postcode, limit);
  
  // If no results from ES, try SPARQL as fallback
  if (sales.length === 0) {
    log(`No sales found in ES for ${postcode}, trying SPARQL fallback`);
    sales = await fetchRecentSalesFromSPARQL(postcode, limit);
  }
  
  return sales;
}

// Index sales data into Elasticsearch
async function indexSales(sales) {
  if (sales.length === 0) return;
  
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
    
  } catch (error) {
    log(`Error indexing sales: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Get list of postcodes to process from our existing data
async function getPostcodesToProcess() {
  try {
    log('Fetching postcodes from existing property data...');
    
    // Get a sample of postcodes that have recent activity
    const response = await esClient.search({
      index: PROPERTIES_INDEX,
      body: {
        query: {
          range: {
            dateOfTransfer: {
              gte: 'now-1y/d' // Last year
            }
          }
        },
        aggs: {
          postcodes: {
            terms: {
              field: 'postcode.keyword',
              size: MAX_POSTCODES_PER_RUN
            }
          }
        },
        size: 0
      }
    });

    if (!response.aggregations || !response.aggregations.postcodes) {
      log('No postcodes found in aggregation');
      return [];
    }

    const postcodes = response.aggregations.postcodes.buckets.map(bucket => bucket.key);
    log(`Found ${postcodes.length} postcodes with recent activity`);
    
    // For testing, limit to first 10 postcodes
    const testPostcodes = postcodes.slice(0, 10);
    log(`Using first ${testPostcodes.length} postcodes for testing`);
    
    return testPostcodes;
  } catch (error) {
    log(`Error getting postcodes: ${error.message}`, 'ERROR');
    // Fallback to some known postcodes
    return ['E14 5AB', 'SE3 9FW', 'NE5 2PR', 'SS9 5EL'];
  }
}

// Check if postcode has been indexed recently
async function isRecentlyIndexed(postcode, daysThreshold = 7) {
  try {
    const response = await esClient.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must: [
              { term: { postcode: postcode } },
              { range: { indexedAt: { gte: `now-${daysThreshold}d/d` } } }
            ]
          }
        }
      }
    });
    if (!response || !response.hits || !response.hits.total) return false;
    return response.hits.total.value > 0;
  } catch (error) {
    log(`Error checking recent indexing for ${postcode}: ${error.message}`, 'WARN');
    return false;
  }
}

// Main execution function
async function main() {
  const startTime = new Date();
  log('Starting recent sales indexing process');
  
  try {
    // Create index if it doesn't exist
    await createIndex();
    
    // Get postcodes to process
    const postcodes = await getPostcodesToProcess();
    
    if (postcodes.length === 0) {
      log('No postcodes to process. Exiting.');
      return;
    }
    
    log(`Processing ${postcodes.length} postcodes`);
    
    let totalIndexed = 0;
    let processedCount = 0;
    
    // Process postcodes in batches
    for (let i = 0; i < postcodes.length; i += BATCH_SIZE) {
      const batch = postcodes.slice(i, i + BATCH_SIZE);
      
      log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(postcodes.length / BATCH_SIZE)}`);
      
      for (const postcode of batch) {
        try {
          // Check if recently indexed
          const recentlyIndexed = await isRecentlyIndexed(postcode);
          if (recentlyIndexed) {
            log(`Skipping ${postcode} - recently indexed`);
            continue;
          }
          
          // Fetch sales data
          const sales = await fetchRecentSales(postcode);
          
          if (sales.length > 0) {
            // Index the sales data
            await indexSales(sales);
            totalIndexed += sales.length;
          }
          
          processedCount++;
          
          // Add delay to be respectful to the API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          log(`Error processing postcode ${postcode}: ${error.message}`, 'ERROR');
        }
      }
      
      log(`Batch completed. Processed: ${processedCount}/${postcodes.length}, Total indexed: ${totalIndexed}`);
    }
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    log(`Indexing process completed in ${duration.toFixed(2)} seconds`);
    log(`Total records indexed: ${totalIndexed}`);
    log(`Postcodes processed: ${processedCount}`);
    
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
  fetchRecentSales,
  indexSales,
  getPostcodesToProcess,
  isRecentlyIndexed
}; 