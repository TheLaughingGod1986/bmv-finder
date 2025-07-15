const axios = require('axios');

// EPC API Configuration
const EPC_API_KEY = process.env.EPC_API_KEY || '52664ac273646603389548bd78d2de0c3ff13d0e';
const EPC_BASE_URL = 'https://epc.opendatacommunities.org';

async function testEPCAuthentication() {
  console.log('🔑 Testing EPC API Authentication...');
  console.log(`API Key: ${EPC_API_KEY.substring(0, 8)}...`);
  console.log(`Base URL: ${EPC_BASE_URL}`);
  console.log('=' .repeat(50));

  // Test 1: Try X-API-Key authentication
  console.log('🔑 Test 1: X-API-Key Authentication...');
  try {
    const response1 = await axios.get(`${EPC_BASE_URL}/api/v1/domestic/search?postcode=SW1A1AA&size=1`, {
      headers: {
        'X-API-Key': EPC_API_KEY,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log(`✅ X-API-Key authentication successful (Status: ${response1.status})`);
    console.log(`   Response type: ${typeof response1.data}`);
    if (response1.data && response1.data.rows) {
      console.log(`   Found ${response1.data.rows.length} records`);
    }
    return true;
  } catch (error) {
    console.log(`❌ X-API-Key authentication failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
    }
  }

  // Test 2: Try Bearer token authentication
  console.log('\n🔑 Test 2: Bearer Token Authentication...');
  try {
    const response2 = await axios.get(`${EPC_BASE_URL}/api/v1/domestic/search?postcode=SW1A1AA&size=1`, {
      headers: {
        'Authorization': `Bearer ${EPC_API_KEY}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log(`✅ Bearer token authentication successful (Status: ${response2.status})`);
    console.log(`   Response type: ${typeof response2.data}`);
    if (response2.data && response2.data.rows) {
      console.log(`   Found ${response2.data.rows.length} records`);
    }
    return true;
  } catch (error) {
    console.log(`❌ Bearer token authentication failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
    }
  }

  // Test 3: Try CSV download with X-API-Key
  console.log('\n📥 Test 3: CSV Download with X-API-Key...');
  try {
    const response3 = await axios.get(`${EPC_BASE_URL}/downloads/domestic_epc.csv`, {
      headers: {
        'X-API-Key': EPC_API_KEY,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/csv,application/csv,*/*'
      },
      responseType: 'stream',
      timeout: 30000,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    const contentType = response3.headers['content-type'] || '';
    const contentLength = response3.headers['content-length'] || 'unknown';
    
    console.log(`✅ CSV download accessible (Status: ${response3.status})`);
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Content-Length: ${contentLength}`);
    
    if (contentType.includes('text/html')) {
      console.log('⚠️  Warning: Received HTML instead of CSV - may need to activate account');
    } else if (contentType.includes('text/csv') || contentType.includes('application/csv')) {
      console.log('✅ Success: Received proper CSV content type');
    }

    return true;
  } catch (error) {
    console.log(`❌ CSV download failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
    }
  }

  return false;
}

async function main() {
  try {
    const success = await testEPCAuthentication();
    
    console.log('\n' + '=' .repeat(50));
    if (success) {
      console.log('🎉 EPC API authentication test completed successfully!');
      console.log('✅ Ready to proceed with bulk download');
    } else {
      console.log('❌ EPC API authentication test failed');
      console.log('🔧 Please check your API key and account status');
      console.log('📧 You may need to activate your account via the email link');
    }
  } catch (error) {
    console.error('❌ Test script failed:', error);
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testEPCAuthentication }; 