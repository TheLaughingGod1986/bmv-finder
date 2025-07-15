const axios = require('axios');

const email = 'benoats86@gmail.com';
const apiKey = '52664ac273646603389548bd78d2de0c3ff13d0e';
const auth = Buffer.from(`${email}:${apiKey}`).toString('base64');

const url = 'https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=SW1A1AA&size=5';

async function main() {
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else {
      console.error(error);
    }
  }
}

main(); 