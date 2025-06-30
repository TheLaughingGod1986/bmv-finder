import { Client } from '@elastic/elasticsearch';

// Elasticsearch client configuration for Elastic Cloud
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'https://5210a2528e1a499e8b6ee0214cd4fbca.us-central1.gcp.cloud.es.io:443',
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY || 'RXR5QXdKY0JuWEhXbkJLZ0JhZVo6N3AwRk9tdFBzcENwV2hwdzVudjJ4Zw=='
  },
  // Always allow self-signed certs for Elastic Cloud
  tls: {
    rejectUnauthorized: false
  }
});

export default client; 