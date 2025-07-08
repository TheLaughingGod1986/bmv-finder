import { Client, ClientOptions } from '@elastic/elasticsearch';
import fs from 'fs';
import path from 'path';

// Configuration for different environments
const isDevelopment = process.env.NODE_ENV === 'development';
const isVercel = process.env.VERCEL === '1';

// Base client configuration
const clientConfig: ClientOptions = {
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

// Always allow self-signed certs for this client (fixes Next.js API route issues)
clientConfig.tls = {
  rejectUnauthorized: false
};

export const esClient = new Client(clientConfig); 