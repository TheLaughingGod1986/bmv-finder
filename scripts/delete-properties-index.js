const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  cloud: {
    id: process.env.ES_CLOUD_ID,
  },
  auth: {
    apiKey: process.env.ES_API_KEY,
  },
});

async function deleteIndex() {
  try {
    const indexName = 'properties';
    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      console.log(`Index '${indexName}' does not exist.`);
      return;
    }
    const response = await client.indices.delete({ index: indexName });
    console.log(`Index '${indexName}' deleted successfully.`);
    console.log(response);
  } catch (error) {
    console.error('Error deleting index:', error.message);
    if (error.meta) {
      console.error('Details:', error.meta.body);
    }
  } finally {
    await client.close();
  }
}

deleteIndex(); 