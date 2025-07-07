const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'https://5210a2528e1a499e8b6ee0214cd4fbca.us-central1.gcp.cloud.es.io:443',
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY || 'RXR5QXdKY0JuWEhXbkJLZ0JhZVo6N3AwRk9tdFBzcENwV2hwdzVudjJ4Zw=='
  },
  tls: { rejectUnauthorized: false }
});

async function run() {
  const query = {
    term: { 'postcode.keyword': 'SS9 5EL' }
  };
  const result = await esClient.search({
    index: 'properties_v2',
    size: 100,
    query,
    _source: ['postcode', 'postcode.keyword', 'fullAddress', 'dateOfTransfer']
  });
  console.log('Found', result.hits.hits.length, 'results for postcode.keyword = SS9 5EL');
  result.hits.hits.forEach((hit, i) => {
    console.log(`${i + 1}. postcode: '${hit._source.postcode}', fullAddress: '${hit._source.fullAddress}', date: ${hit._source.dateOfTransfer}`);
  });
}

run().catch(console.error); 