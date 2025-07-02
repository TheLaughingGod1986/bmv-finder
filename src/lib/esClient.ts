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
} else if (isDevelopment) {
  // Fallback for local development
  clientConfig.auth = {
    username: 'elastic',
    password: 'TIRv--dMe*rHmuRMm-b4'
  };
}

// TLS configuration - only use local certs in development
if (isDevelopment && !isVercel) {
  try {
    const certPath = path.join(process.cwd(), 'elasticsearch-8.13.0/config/certs/http_ca.crt');
    if (fs.existsSync(certPath)) {
      clientConfig.tls = {
        ca: fs.readFileSync(certPath),
        rejectUnauthorized: true
      };
    }
  } catch (error) {
    console.warn('Could not load Elasticsearch certificate:', error);
  }
} else {
  // In production/Vercel, use default TLS settings (no custom cert)
  clientConfig.tls = {
    rejectUnauthorized: false // Allow self-signed certs for managed services
  };
}

export const esClient = new Client(clientConfig); 