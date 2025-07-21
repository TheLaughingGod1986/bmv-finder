require('dotenv').config();
const axios = require('axios');

const username = process.env.EPC_API_USERNAME;
const password = process.env.EPC_API_PASSWORD;
const baseUrl = process.env.EPC_API_BASE_URL || 'https://epc.opendatacommunities.org';

if (!username || !password) {
  console.error('Missing EPC_API_USERNAME or EPC_API_PASSWORD in .env');
  process.exit(1);
}

const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
const headers = {
  'Authorization': `Basic ${basicAuth}`,
  'Accept': 'application/json, text/html',
};

const url = `${baseUrl}/api/v1/domestic/search?postcode=NE177JH&address=3`;

console.log('[EPC TEST] Request URL:', url);
console.log('[EPC TEST] Authorization header:', headers['Authorization']);

axios.get(url, { headers })
  .then(res => {
    console.log('[EPC TEST] Status:', res.status);
    console.log('[EPC TEST] Headers:', res.headers);
    console.log('[EPC TEST] Body:', typeof res.data === 'string' ? res.data.slice(0, 500) : res.data);
  })
  .catch(err => {
    if (err.response) {
      console.error('[EPC TEST] Error status:', err.response.status);
      console.error('[EPC TEST] Error headers:', err.response.headers);
      console.error('[EPC TEST] Error body:', typeof err.response.data === 'string' ? err.response.data.slice(0, 500) : err.response.data);
    } else {
      console.error('[EPC TEST] Request error:', err.message);
    }
  }); 