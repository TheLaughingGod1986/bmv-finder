const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
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