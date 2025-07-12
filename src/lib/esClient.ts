import { Client, ClientOptions } from '@elastic/elasticsearch';

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import fs from 'fs';
import path from 'path';

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
    apiKey: (process.env.ES_API_KEY || process.env.ELASTICSEARCH_API_KEY) as string
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
const caPath = process.env.ELASTIC_CA_CERT_PATH || 'elasticsearch-8.13.0/config/certs/http_ca.crt';
let caCert: Buffer | undefined = undefined;
try {
  if (fs.existsSync(caPath)) {
    caCert = fs.readFileSync(caPath);
  }
} catch (err) {
  // Ignore error, fallback to insecure
}

if (caCert) {
  clientConfig.tls = {
    ca: caCert,
    rejectUnauthorized: true
  };
} else {
  clientConfig.tls = {
    rejectUnauthorized: false
  };
}

export const esClient = new Client(clientConfig); 