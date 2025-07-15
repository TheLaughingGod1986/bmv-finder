const axios = require('axios');

const EPC_API_KEY = '52664ac273646603389548bd78d2de0c3ff13d0e';
const EPC_BASE_URL = 'https://epc.opendatacommunities.org';

async function testAlternativeEndpoints() {
  console.log('🔍 Testing Alternative EPC API Endpoints...');
  console.log(`API Key: ${EPC_API_KEY.substring(0, 8)}...`);
  console.log('=' .repeat(60));

  const endpoints = [
    {
      name: 'API Search Endpoint',
      url: `${EPC_BASE_URL}/api/v1/domestic/search?postcode=SW1A1AA&size=1`,
      method: 'GET',
      headers: { 'X-API-Key': EPC_API_KEY, 'Accept': 'application/json' }
    },
    {
      name: 'API Search with Bearer',
      url: `${EPC_BASE_URL}/api/v1/domestic/search?postcode=SW1A1AA&size=1`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${EPC_API_KEY}`, 'Accept': 'application/json' }
    },
    {
      name: 'API Token Endpoint',
      url: `${EPC_BASE_URL}/api/v1/domestic/search?postcode=SW1A1AA&size=1`,
      method: 'GET',
      headers: { 'Authorization': `Token ${EPC_API_KEY}`, 'Accept': 'application/json' }
    },
    {
      name: 'API Key Header',
      url: `${EPC_BASE_URL}/api/v1/domestic/search?postcode=SW1A1AA&size=1`,
      method: 'GET',
      headers: { 'API-Key': EPC_API_KEY, 'Accept': 'application/json' }
    },
    {
      name: 'Query Parameter API Key',
      url: `${EPC_BASE_URL}/api/v1/domestic/search?postcode=SW1A1AA&size=1&api_key=${EPC_API_KEY}`,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    },
    {
      name: 'CSV Download with Query Param',
      url: `${EPC_BASE_URL}/downloads/domestic_epc.csv?api_key=${EPC_API_KEY}`,
      method: 'GET',
      headers: { 'Accept': 'text/csv,application/csv,*/*' }
    },
    {
      name: 'CSV Download with Bearer',
      url: `${EPC_BASE_URL}/downloads/domestic_epc.csv`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${EPC_API_KEY}`, 'Accept': 'text/csv,application/csv,*/*' }
    },
    {
      name: 'Main Portal Page',
      url: `${EPC_BASE_URL}/`,
      method: 'GET',
      headers: { 'X-API-Key': EPC_API_KEY }
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      const response = await axios({
        method: endpoint.method,
        url: endpoint.url,
        headers: endpoint.headers,
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📄 Content-Type: ${response.headers['content-type']}`);
      
      if (response.headers['content-length']) {
        console.log(`   📏 Content-Length: ${response.headers['content-length']}`);
      }

      // Check if we got JSON data
      if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
        console.log(`   📊 JSON Response: ${typeof response.data}`);
        if (response.data && response.data.rows) {
          console.log(`   📋 Found ${response.data.rows.length} records`);
        }
      }
      
      // Check if we got CSV data
      if (response.headers['content-type'] && response.headers['content-type'].includes('text/csv')) {
        console.log(`   📄 CSV Response: ${typeof response.data}`);
        const firstLine = response.data.toString().split('\n')[0];
        console.log(`   📋 First line: ${firstLine.substring(0, 100)}...`);
      }

      // Check if we got HTML (login page)
      if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
        const content = response.data.toString();
        if (content.includes('login') || content.includes('sign in')) {
          console.log(`   ⚠️  HTML login page detected`);
        } else {
          console.log(`   📄 HTML content (${content.length} chars)`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`      Status: ${error.response.status}`);
      }
    }
  }
}

async function main() {
  try {
    await testAlternativeEndpoints();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 Summary:');
    console.log('- If any endpoint returns JSON with data, we can use that for API access');
    console.log('- If any endpoint returns CSV data, we can use that for bulk download');
    console.log('- If all return HTML, account activation is still needed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testAlternativeEndpoints }; 