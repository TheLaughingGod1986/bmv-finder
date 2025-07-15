const axios = require('axios');

// Example usage of the Property Enrichment Service
class PropertyEnrichmentExample {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get property information for a given address
   * @param {string} postcode - UK postcode
   * @param {string} number - House number/name
   * @returns {Promise<Object>} Property data
   */
  async getPropertyInfo(postcode, number) {
    try {
      console.log(`🔍 Looking up property: ${number} ${postcode}`);
      
      const response = await axios.get(`${this.baseUrl}/api/property-info`, {
        params: { postcode, number },
        timeout: 10000
      });

      console.log('✅ Property found!');
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error(`❌ Error ${error.response.status}: ${error.response.data.error}`);
        return null;
      } else {
        console.error('❌ Network error:', error.message);
        return null;
      }
    }
  }

  /**
   * Check service health
   * @returns {Promise<boolean>} Health status
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      console.log('✅ Service is healthy:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Service health check failed:', error.message);
      return false;
    }
  }

  /**
   * Run example queries
   */
  async runExamples() {
    console.log('🚀 Property Enrichment Service Examples\n');

    // Check service health first
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      console.log('❌ Service is not available. Please start the service first.');
      return;
    }

    console.log('\n📋 Running example queries...\n');

    // Example 1: Basic property lookup
    console.log('Example 1: Basic property lookup');
    const example1 = await this.getPropertyInfo('SW1A1AA', '10');
    if (example1) {
      console.log('Result:', JSON.stringify(example1, null, 2));
    }
    console.log('');

    // Example 2: Property with house name
    console.log('Example 2: Property with house name');
    const example2 = await this.getPropertyInfo('SW1A1AA', 'The Cottage');
    if (example2) {
      console.log('Result:', JSON.stringify(example2, null, 2));
    }
    console.log('');

    // Example 3: Different postcode
    console.log('Example 3: Different postcode');
    const example3 = await this.getPropertyInfo('M11AA', '1');
    if (example3) {
      console.log('Result:', JSON.stringify(example3, null, 2));
    }
    console.log('');

    // Example 4: Invalid postcode (should fail)
    console.log('Example 4: Invalid postcode (should fail)');
    const example4 = await this.getPropertyInfo('INVALID', '10');
    if (example4) {
      console.log('Result:', JSON.stringify(example4, null, 2));
    }
    console.log('');

    console.log('✨ Examples completed!');
  }

  /**
   * Interactive mode for testing
   */
  async interactiveMode() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🔍 Interactive Property Lookup Mode\n');
    console.log('Enter "quit" to exit\n');

    const askQuestion = () => {
      rl.question('Enter postcode: ', (postcode) => {
        if (postcode.toLowerCase() === 'quit') {
          rl.close();
          return;
        }

        rl.question('Enter house number/name: ', async (number) => {
          if (number.toLowerCase() === 'quit') {
            rl.close();
            return;
          }

          console.log('\n🔍 Searching...\n');
          const result = await this.getPropertyInfo(postcode, number);
          
          if (result) {
            console.log('📋 Property Details:');
            console.log(JSON.stringify(result, null, 2));
          }
          
          console.log('\n' + '='.repeat(50) + '\n');
          askQuestion();
        });
      });
    };

    askQuestion();
  }
}

// Main execution
async function main() {
  const example = new PropertyEnrichmentExample();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    await example.interactiveMode();
  } else {
    await example.runExamples();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PropertyEnrichmentExample; 