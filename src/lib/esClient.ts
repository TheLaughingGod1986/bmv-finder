import { Client } from '@elastic/elasticsearch';
import fs from 'fs';
import path from 'path';

// Configuration for different environments
const isDevelopment = process.env.NODE_ENV === 'development';
const isVercel = process.env.VERCEL === '1';

// Base client configuration
const clientConfig = {
  node: process.env.ELASTICSEARCH_URL || 'https://5210a2528e1a499e8b6ee0214cd4fbca.us-central1.gcp.cloud.es.io:443',
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY || 'RXR5QXdKY0JuWEhXbkJLZ0JhZVo6N3AwRk9tdFBzcENwV2hwdzVudjJ4Zw=='
  },
};

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

const client = new Client(clientConfig);

export default client; 