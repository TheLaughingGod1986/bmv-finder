import { Client, ClientOptions } from '@elastic/elasticsearch';

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Configuration for different environments
const isDevelopment = process.env.NODE_ENV === 'development';
const isVercel = process.env.VERCEL === '1';

// Base client configuration
const clientConfig: ClientOptions = {};

// Use cloud configuration if available (preferred for Elastic Cloud)
if (process.env.ES_CLOUD_ID) {
  clientConfig.cloud = {
    id: process.env.ES_CLOUD_ID
  };
} else {
  // Fallback to node configuration
  clientConfig.node = process.env.ES_NODE || process.env.ELASTICSEARCH_URL || 'https://localhost:9200';
}

// Prefer API key authentication if available
if (process.env.ES_API_KEY || process.env.ELASTICSEARCH_API_KEY) {
  clientConfig.auth = {
    apiKey: process.env.ES_API_KEY || process.env.ELASTICSEARCH_API_KEY
  };
} else if (process.env.ES_USERNAME && process.env.ES_PASSWORD) {
  clientConfig.auth = {
    username: process.env.ES_USERNAME,
    password: process.env.ES_PASSWORD
  };
} else if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
  clientConfig.auth = {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  };
} else {
  throw new Error('Missing Elasticsearch credentials in environment variables.');
}

// Always allow self-signed certs for this client (fixes Next.js API route issues)
clientConfig.tls = {
  rejectUnauthorized: false
};

export const esClient = new Client(clientConfig); 