const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const clientConfig = {
  node: process.env.ELASTICSEARCH_URL || process.env.ES_NODE || 'http://localhost:9201',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || process.env.ES_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD || process.env.ES_PASSWORD
  }
};

exports.esClient = new Client(clientConfig); 