const { Client } = require('@elastic/elasticsearch');
const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const ES_URL = process.env.ELASTICSEARCH_URL;
const ES_API_KEY = process.env.ELASTICSEARCH_API_KEY;
const INDEX = 'properties';
const BATCH_SIZE = 100;
const RATE_LIMIT_DELAY = 100; // ms between API calls
const MAX_RETRIES = 3;
const CHECKPOINT_FILE = 'location-population-checkpoint.json';

const esClient = new Client({
  node: ES_URL,
  auth: { apiKey: ES_API_KEY },
  tls: { rejectUnauthorized: false },
});

// Load checkpoint if exists
function loadCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const data = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('No checkpoint found, starting from beginning');
  }
  return { processedCount: 0, lastSearchAfter: null };
}

// Save checkpoint
function saveCheckpoint(checkpoint) {
  try {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  } catch (error) {
    console.error('Failed to save checkpoint:', error.message);
  }
}

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getLatLonForPostcode(postcode, retries = 0) {
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    if (!res.ok) {
      if (res.status === 404) {
        return null; // Postcode not found
      }
      if (res.status === 429 && retries < MAX_RETRIES) {
        console.log(`Rate limited, retrying in ${RATE_LIMIT_DELAY * (retries + 1)}ms...`);
        await sleep(RATE_LIMIT_DELAY * (retries + 1));
        return getLatLonForPostcode(postcode, retries + 1);
      }
      return null;
    }
    const data = await res.json();
    if (data.status === 200 && data.result) {
      return { lat: data.result.latitude, lon: data.result.longitude };
    }
    return null;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.log(`Network error, retrying in ${RATE_LIMIT_DELAY * (retries + 1)}ms...`);
      await sleep(RATE_LIMIT_DELAY * (retries + 1));
      return getLatLonForPostcode(postcode, retries + 1);
    }
    return null;
  }
}

async function updateDocumentWithLocation(docId, location) {
  try {
    await esClient.update({
      index: INDEX,
      id: docId,
      body: {
        doc: { location }
      }
    });
    return true;
  } catch (error) {
    console.error(`Failed to update document ${docId}:`, error.message);
    return false;
  }
}

async function processBatch(documents) {
  const updates = [];
  let successCount = 0;
  let errorCount = 0;

  for (const doc of documents) {
    const postcode = doc._source.postcode;
    if (!postcode) {
      errorCount++;
      continue;
    }

    const latLon = await getLatLonForPostcode(postcode);
    if (latLon) {
      const success = await updateDocumentWithLocation(doc._id, latLon);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    } else {
      errorCount++;
      console.log(`Could not geocode postcode: ${postcode}`);
    }

    // Rate limiting
    await sleep(RATE_LIMIT_DELAY);
  }

  return { successCount, errorCount };
}

async function populateLocations() {
  console.log('Starting location population for properties index...');
  
  const checkpoint = loadCheckpoint();
  console.log(`Resuming from checkpoint: ${checkpoint.processedCount} documents processed`);

  let totalProcessed = checkpoint.processedCount;
  let totalSuccess = 0;
  let totalErrors = 0;
  let batchCount = 0;

  try {
    while (true) {
      // Build search query
      const searchBody = {
        size: BATCH_SIZE,
        query: {
          bool: {
            must_not: {
              exists: { field: 'location' }
            }
          }
        },
        sort: [{ 'dateOfTransfer': 'asc' }, { 'postcode.keyword': 'asc' }]
      };

      // Add search_after for pagination
      if (checkpoint.lastSearchAfter) {
        searchBody.search_after = checkpoint.lastSearchAfter;
      }

      const response = await esClient.search({
        index: INDEX,
        body: searchBody
      });

      const documents = response.hits.hits;
      
      if (documents.length === 0) {
        console.log('No more documents to process!');
        break;
      }

      console.log(`\nProcessing batch ${++batchCount} (${documents.length} documents)`);
      
      const { successCount, errorCount } = await processBatch(documents);
      
      totalProcessed += documents.length;
      totalSuccess += successCount;
      totalErrors += errorCount;

      // Update checkpoint
      checkpoint.processedCount = totalProcessed;
      checkpoint.lastSearchAfter = documents[documents.length - 1].sort;
      saveCheckpoint(checkpoint);

      console.log(`Batch ${batchCount} complete:`);
      console.log(`  Success: ${successCount}`);
      console.log(`  Errors: ${errorCount}`);
      console.log(`  Total processed: ${totalProcessed}`);
      console.log(`  Total success: ${totalSuccess}`);
      console.log(`  Total errors: ${totalErrors}`);

      // Progress indicator
      if (batchCount % 10 === 0) {
        console.log(`\n--- Progress: ${totalProcessed} documents processed ---\n`);
      }
    }

    console.log('\n=== POPULATION COMPLETE ===');
    console.log(`Total documents processed: ${totalProcessed}`);
    console.log(`Successful updates: ${totalSuccess}`);
    console.log(`Failed updates: ${totalErrors}`);
    console.log(`Success rate: ${((totalSuccess / totalProcessed) * 100).toFixed(2)}%`);

    // Clean up checkpoint file
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE);
      console.log('Checkpoint file cleaned up');
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
    console.log('Checkpoint saved. You can resume by running the script again.');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Saving checkpoint and exiting...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Saving checkpoint and exiting...');
  process.exit(0);
});

// Run the script
populateLocations().catch(console.error); 