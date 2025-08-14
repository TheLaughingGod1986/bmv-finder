import { Client, ClientOptions } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const clientConfig: ClientOptions = {
  node: process.env.ELASTICSEARCH_URL || process.env.ES_NODE || 'http://localhost:9201',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || process.env.ES_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD || process.env.ES_PASSWORD
  }
};

export const esClient = new Client(clientConfig);

// Create a more flexible search method that bypasses strict typing
export const flexibleSearch = async (params: any) => {
  return esClient.search(params as any);
};

// Test the connection
esClient.ping()
  .then(() => console.log('✅ Elasticsearch connection successful'))
  .catch((error) => console.error('❌ Elasticsearch connection failed:', error.message)); 