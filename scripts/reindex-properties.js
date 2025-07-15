const { esClient } = require('../src/lib/esClient.cjs.js');

// Configuration
const OLD_INDEX = 'properties_v2'; // Source index (if it exists)
const NEW_INDEX = 'properties';     // Target index (current Docker index)

async function createNewIndex() {
  const exists = await esClient.indices.exists({ index: NEW_INDEX });
  if (exists) {
    console.log(`Index '${NEW_INDEX}' already exists. Skipping creation.`);
    return;
  }
  console.log(`Creating index '${NEW_INDEX}' with correct mapping...`);
  await esClient.indices.create({
    index: NEW_INDEX,
    body: {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
          analyzer: {
            postcode_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'trim']
            }
          }
        }
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          price: { type: 'long' },
          dateOfTransfer: { type: 'date' },
          postcode: {
            type: 'text',
            analyzer: 'postcode_analyzer',
            fields: { keyword: { type: 'keyword' } }
          },
          propertyType: { type: 'keyword' },
          propertyTypeLabel: { type: 'text' },
          old_new: { type: 'keyword' },
          newBuildLabel: { type: 'text' },
          street: {
            type: 'text',
            fields: { keyword: { type: 'keyword' } }
          },
          town_city: { type: 'text' },
          district: { type: 'text' },
          county: { type: 'keyword' },
          paon: {
            type: 'text',
            fields: { keyword: { type: 'keyword' } }
          },
          saon: { type: 'text' },
          duration: { type: 'keyword' },
          durationLabel: { type: 'text' },
          locality: { type: 'text' },
          transactionCategory: { type: 'keyword' },
          transactionCategoryLabel: { type: 'text' },
          recordStatus: { type: 'keyword' },
          fullAddress: { type: 'text' },
          year: { type: 'integer' },
          month: { type: 'integer' },
          priceRange: { type: 'keyword' }
        }
      }
    }
  });
  console.log('✅ New index created!');
}

async function reindexData() {
  console.log(`Reindexing data from '${OLD_INDEX}' to '${NEW_INDEX}'...`);
  const result = await esClient.reindex({
    wait_for_completion: true,
    body: {
      source: { index: OLD_INDEX },
      dest: { index: NEW_INDEX }
    }
  });
  console.log('Reindex response:', result);
}

async function refreshNewIndex() {
  await esClient.indices.refresh({ index: NEW_INDEX });
  console.log('✅ New index refreshed!');
}

async function main() {
  try {
    await createNewIndex();
    await reindexData();
    await refreshNewIndex();
    console.log('🎉 Reindexing complete!');
    console.log(`Switch your app to use the '${NEW_INDEX}' index.`);
  } catch (error) {
    console.error('❌ Error during reindexing:', error);
  }
}

main().catch(console.error); 