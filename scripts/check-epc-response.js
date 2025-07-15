const axios = require('axios');

const EPC_API_KEY = '52664ac273646603389548bd78d2de0c3ff13d0e';

async function checkEPCResponse() {
  try {
    console.log('🔍 Checking EPC API response...');
    
    const response = await axios.get('https://epc.opendatacommunities.org/downloads/domestic_epc.csv', {
      headers: {
        'X-API-Key': EPC_API_KEY,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Content-Length: ${response.headers['content-length']}`);
    
    const content = response.data.toString();
    console.log('\nFirst 500 characters of response:');
    console.log('=' .repeat(50));
    console.log(content.substring(0, 500));
    console.log('=' .repeat(50));
    
    // Check for common keywords
    const keywords = ['login', 'activate', 'enable', 'account', 'sign in', 'register'];
    const foundKeywords = keywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (foundKeywords.length > 0) {
      console.log(`\nFound keywords: ${foundKeywords.join(', ')}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

checkEPCResponse(); 