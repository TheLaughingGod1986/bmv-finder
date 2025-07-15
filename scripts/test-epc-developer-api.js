const axios = require('axios');

const EPC_API_KEY = '52664ac273646603389548bd78d2de0c3ff13d0e';
const EPC_BASE_URL = 'https://epc.opendatacommunities.org';

async function testDeveloperAPI() {
  console.log('🔍 Testing EPC Developer API...');
  console.log(`API Key: ${EPC_API_KEY.substring(0, 8)}...`);
  console.log('=' .repeat(60));

  const testQueries = [
    {
      name: 'Search by Postcode (SW1A1AA)',
      url: `${EPC_BASE_URL}/api/v1/domestic/search?postcode=SW1A1AA&size=5`,
      description: 'Search for properties in a specific postcode'
    },
    {
      name: 'Search by Address',
      url: `${EPC_BASE_URL}/api/v1/domestic/search?address=10&postcode=SW1A1AA&size=3`,
      description: 'Search for a specific address'
    },
    {
      name: 'Search by Energy Rating',
      url: `${EPC_BASE_URL}/api/v1/domestic/search?postcode=SW1A1AA&current-energy-rating=A&size=3`,
      description: 'Search for properties with A energy rating'
    },
    {
      name: 'Search by Property Type',
      url: `${EPC_BASE_URL}/api/v1/domestic/search?postcode=SW1A1AA&property-type=House&size=3`,
      description: 'Search for houses in a postcode'
    },
    {
      name: 'Search by Date Range',
      url: `${EPC_BASE_URL}/api/v1/domestic/search?postcode=SW1A1AA&from-date=2020-01-01&to-date=2025-12-31&size=3`,
      description: 'Search for certificates in a date range'
    }
  ];

  for (const query of testQueries) {
    try {
      console.log(`\n🔍 Testing: ${query.name}`);
      console.log(`   Description: ${query.description}`);
      console.log(`   URL: ${query.url}`);
      
      const response = await axios.get(query.url, {
        headers: {
          'Authorization': `Bearer ${EPC_API_KEY}`,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📄 Content-Type: ${response.headers['content-type']}`);
      
      if (response.data) {
        console.log(`   📊 Response type: ${typeof response.data}`);
        
        if (response.data.rows && Array.isArray(response.data.rows)) {
          console.log(`   📋 Found ${response.data.rows.length} records`);
          
          if (response.data.rows.length > 0) {
            const firstRecord = response.data.rows[0];
            console.log(`   📝 Sample record keys: ${Object.keys(firstRecord).slice(0, 10).join(', ')}...`);
            
            // Show some key fields if available
            const keyFields = ['lmk_key', 'address', 'postcode', 'current-energy-rating', 'property-type', 'total-floor-area', 'number-habitable-rooms'];
            const availableFields = keyFields.filter(field => firstRecord[field] !== undefined);
            console.log(`   🏠 Available key fields: ${availableFields.join(', ')}`);
          }
        } else {
          console.log(`   📄 Response structure:`, Object.keys(response.data));
        }
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`      Status: ${error.response.status}`);
        console.log(`      Status Text: ${error.response.statusText}`);
        
        if (error.response.data) {
          console.log(`      Response: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
        }
      }
    }
  }
}

async function testBulkDataAccess() {
  console.log('\n' + '=' .repeat(60));
  console.log('🔍 Testing Bulk Data Access Methods...');
  
  const bulkMethods = [
    {
      name: 'Download Endpoint with API Key',
      url: `${EPC_BASE_URL}/downloads/domestic_epc.csv`,
      headers: { 'Authorization': `Bearer ${EPC_API_KEY}` }
    },
    {
      name: 'API Search with Large Size',
      url: `${EPC_BASE_URL}/api/v1/domestic/search?postcode=SW1A1AA&size=1000`,
      headers: { 'Authorization': `Bearer ${EPC_API_KEY}` }
    },
    {
      name: 'API Search by Region',
      url: `${EPC_BASE_URL}/api/v1/domestic/search?local-authority=Westminster&size=100`,
      headers: { 'Authorization': `Bearer ${EPC_API_KEY}` }
    }
  ];

  for (const method of bulkMethods) {
    try {
      console.log(`\n🔍 Testing: ${method.name}`);
      
      const response = await axios.get(method.url, {
        headers: {
          ...method.headers,
          'Accept': 'application/json,text/csv,*/*',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 20000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📄 Content-Type: ${response.headers['content-type']}`);
      
      if (response.headers['content-length']) {
        console.log(`   📏 Content-Length: ${response.headers['content-length']}`);
      }

      if (response.headers['content-type'] && response.headers['content-type'].includes('text/csv')) {
        console.log(`   📄 CSV Data: ${response.data.toString().substring(0, 200)}...`);
      } else if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
        if (response.data && response.data.rows) {
          console.log(`   📊 JSON Data: ${response.data.rows.length} records`);
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
    await testDeveloperAPI();
    await testBulkDataAccess();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 Summary:');
    console.log('- If API queries work, you can use the Developer API for specific searches');
    console.log('- You can build a system to query properties by postcode/address');
    console.log('- For bulk data, you may need to combine multiple API calls or use manual download');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testDeveloperAPI, testBulkDataAccess }; 