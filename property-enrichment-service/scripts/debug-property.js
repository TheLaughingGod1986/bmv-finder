// Usage: node debug-property.js <number> <street> <postcode>
const { Client } = require('@elastic/elasticsearch');
const axios = require('axios');

const ES_HOST = process.env.ES_HOST || 'http://localhost:9201';
const EPC_API_BASE_URL = process.env.EPC_API_BASE_URL || 'https://epc.opendatacommunities.org';
const EPC_API_USERNAME = process.env.EPC_API_USERNAME;
const EPC_API_PASSWORD = process.env.EPC_API_PASSWORD;

const client = new Client({ node: ES_HOST });

function normalizePostcode(postcode) {
  return postcode.replace(/\s+/g, '').toUpperCase();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchES(index, number, street, postcode) {
  const queries = [
    { postcode, number, street },
    { postcode: normalizePostcode(postcode), number, street },
  ];
  for (const q of queries) {
    const must = [
      { match: { postcode: q.postcode } },
      { match: { number: q.number } },
      { match: { address: street } },
    ];
    try {
      const res = await client.search({
        index,
        body: { query: { bool: { must } } },
        size: 5,
      });
      if (res.body.hits.total.value > 0) {
        console.log(`[FOUND] ${index}:`, res.body.hits.hits.map(h => h._source));
        return true;
      } else {
        console.log(`[NOT FOUND] ${index} for`, q);
      }
    } catch (e) {
      console.error(`[ERROR] Searching ${index}:`, e.message);
    }
  }
  return false;
}

async function queryEPC(number, street, postcode) {
  const postcodes = [postcode, normalizePostcode(postcode)];
  const addresses = [number, `${number} ${street}`];
  for (const pc of postcodes) {
    for (const addr of addresses) {
      const url = `${EPC_API_BASE_URL}/api/v1/domestic/search?postcode=${encodeURIComponent(pc)}&address=${encodeURIComponent(addr)}`;
      try {
        const auth = {
          username: EPC_API_USERNAME,
          password: EPC_API_PASSWORD,
        };
        const res = await axios.get(url, { auth });
        if (res.data && res.data.rows && res.data.rows.length > 0) {
          console.log(`[FOUND] EPC API:`, res.data.rows);
          return true;
        } else {
          console.log(`[NOT FOUND] EPC API for`, { pc, addr });
        }
      } catch (e) {
        if (e.response && e.response.status === 404) {
          console.log(`[NOT FOUND] EPC API for`, { pc, addr });
        } else {
          console.error(`[ERROR] EPC API:`, e.message);
        }
      }
      await sleep(500); // avoid rate limiting
    }
  }
  return false;
}

async function main() {
  const [,, number, ...rest] = process.argv;
  const postcode = rest.pop();
  const street = rest.join(' ');
  if (!number || !street || !postcode) {
    console.error('Usage: node debug-property.js <number> <street> <postcode>');
    process.exit(1);
  }
  console.log(`\n--- Debugging property: ${number} ${street}, ${postcode} ---\n`);
  let found = false;
  found = await searchES('properties-enhanced', number, street, postcode) || found;
  found = await searchES('properties', number, street, postcode) || found;
  found = await queryEPC(number, street, postcode) || found;
  if (!found) {
    console.log('\n[RESULT] Property NOT FOUND in any source.');
  } else {
    console.log('\n[RESULT] Property FOUND in at least one source.');
  }
}

main(); 