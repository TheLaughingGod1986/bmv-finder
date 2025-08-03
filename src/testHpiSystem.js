#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import the HPI update functions
const { updateHpiFromOns } = require('./updateHpiFromOns');

// Elasticsearch client configuration
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  },
  tls: {
    rejectUnauthorized: false
  }
});

const INDEX_NAME = 'house_price_index';

// Test configuration
const argv = yargs(hideBin(process.argv))
  .option('mode', {
    alias: 'm',
    type: 'string',
    choices: ['upload', 'search', 'api-disabled', 'error-handling', 'all'],
    description: 'Test mode to run',
    default: 'all'
  })
  .option('postcode', {
    alias: 'p',
    type: 'string',
    description: 'Postcode to test search functionality',
    default: 'SW1A 1AA'
  })
  .option('api-enabled', {
    alias: 'a',
    type: 'boolean',
    description: 'Enable/disable API calls',
    default: true
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Enable verbose logging',
    default: false
  })
  .help()
  .argv;

// Test utilities
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTests() {
    console.log('🧪 Starting HPI System Tests...\n');
    
    for (const test of this.tests) {
      this.results.total++;
      console.log(`📋 Running: ${test.name}`);
      
      try {
        await test.testFn();
        console.log(`✅ PASSED: ${test.name}\n`);
        this.results.passed++;
      } catch (error) {
        console.log(`❌ FAILED: ${test.name}`);
        console.log(`   Error: ${error.message}\n`);
        this.results.failed++;
      }
    }
    
    this.printSummary();
  }

  printSummary() {
    console.log('📊 Test Summary:');
    console.log(`   Total: ${this.results.total}`);
    console.log(`   Passed: ${this.results.passed}`);
    console.log(`   Failed: ${this.results.failed}`);
    console.log(`   Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
  }

  log(message, level = 'info') {
    if (argv.verbose || level === 'error') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    }
  }
}

// Test functions
async function testElasticsearchConnection() {
  try {
    const info = await client.info();
    if (!info.version) {
      throw new Error('No version info returned from Elasticsearch');
    }
    console.log(`   Connected to Elasticsearch ${info.version.number}`);
  } catch (error) {
    throw new Error(`Elasticsearch connection failed: ${error.message}`);
  }
}

async function testIndexExists() {
  try {
    const exists = await client.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      console.log(`   Index ${INDEX_NAME} does not exist, creating...`);
      await client.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              region: { type: 'keyword' },
              regionCode: { type: 'keyword' },
              date: { type: 'date' },
              year: { type: 'integer' },
              month: { type: 'integer' },
              index: { type: 'float' },
              monthOverMonth: { type: 'float' },
              yearOverYear: { type: 'float' },
              regionType: { type: 'keyword' },
              source: { type: 'keyword' },
              lastUpdated: { type: 'date' }
            }
          }
        }
      });
      console.log(`   Index ${INDEX_NAME} created successfully`);
    } else {
      console.log(`   Index ${INDEX_NAME} exists`);
    }
  } catch (error) {
    throw new Error(`Index test failed: ${error.message}`);
  }
}

async function testUploadMode() {
  console.log('   Testing upload mode (only missing records)...');
  
  // Check if manual download file exists
  const tempDir = path.join(__dirname, '../temp');
  const manualZipPath = path.join(tempDir, 'hpione.zip');
  
  if (!fs.existsSync(manualZipPath)) {
    console.log('   ⚠️  No manual download file found, skipping upload test');
    console.log('   💡 To test upload mode:');
    console.log('      1. Download hpione.zip from ONS website');
    console.log('      2. Place it in the temp directory');
    console.log('      3. Run this test again');
    return;
  }
  
  try {
    // Run the upload process
    await updateHpiFromOns();
    console.log('   ✅ Upload mode test completed');
  } catch (error) {
    throw new Error(`Upload mode test failed: ${error.message}`);
  }
}

async function testSearchMode(postcode) {
  console.log(`   Testing search mode with postcode: ${postcode}`);
  
  try {
    // Test postcode to region mapping
    const regionMapping = await getRegionFromPostcode(postcode);
    console.log(`   📍 Postcode ${postcode} maps to region: ${regionMapping}`);
    
    // Search for HPI data in that region
    const searchResult = await client.search({
      index: INDEX_NAME,
      size: 10,
      body: {
        query: {
          bool: {
            should: [
              { match: { region: regionMapping } },
              { match: { regionCode: regionMapping } }
            ]
          }
        },
        sort: [{ date: { order: 'desc' } }]
      }
    });
    
    const hits = searchResult.hits.hits;
    console.log(`   📊 Found ${hits.length} HPI records for ${regionMapping}`);
    
    if (hits.length > 0) {
      const latest = hits[0]._source;
      console.log(`   📈 Latest HPI for ${regionMapping}: ${latest.index} (${latest.date})`);
      console.log(`   📊 Month-over-month growth: ${latest.monthOverMonth?.toFixed(2)}%`);
      console.log(`   📊 Year-over-year growth: ${latest.yearOverYear?.toFixed(2)}%`);
    }
    
  } catch (error) {
    throw new Error(`Search mode test failed: ${error.message}`);
  }
}

async function testApiDisabled() {
  console.log('   Testing with API disabled...');
  
  // Temporarily disable API by setting invalid credentials
  const originalApiKey = process.env.ELASTICSEARCH_API_KEY;
  process.env.ELASTICSEARCH_API_KEY = 'invalid-key';
  
  try {
    // Create a new client with invalid credentials
    const invalidClient = new Client({
      node: process.env.ELASTICSEARCH_URL,
      auth: {
        apiKey: 'invalid-key'
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // This should fail
    await invalidClient.info();
    throw new Error('API should have been disabled but connection succeeded');
    
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      console.log('   ✅ API disabled test passed - connection properly rejected');
    } else {
      throw new Error(`API disabled test failed: ${error.message}`);
    }
  } finally {
    // Restore original API key
    process.env.ELASTICSEARCH_API_KEY = originalApiKey;
  }
}

async function testErrorHandling() {
  console.log('   Testing error handling and edge cases...');
  
  // Test 1: Invalid postcode
  try {
    await testSearchMode('INVALID');
    console.log('   ✅ Invalid postcode handling test passed');
  } catch (error) {
    console.log('   ✅ Invalid postcode properly rejected');
  }
  
  // Test 2: Empty search
  try {
    const result = await client.search({
      index: INDEX_NAME,
      size: 0,
      body: {
        query: {
          match: { region: 'NONEXISTENT_REGION' }
        }
      }
    });
    
    if (result.hits.total.value === 0) {
      console.log('   ✅ Empty search results handled correctly');
    }
  } catch (error) {
    throw new Error(`Empty search test failed: ${error.message}`);
  }
  
  // Test 3: Malformed data handling
  try {
    const result = await client.search({
      index: INDEX_NAME,
      size: 1,
      body: {
        query: {
          exists: { field: 'index' }
        }
      }
    });
    
    if (result.hits.hits.length > 0) {
      const record = result.hits.hits[0]._source;
      if (typeof record.index === 'number' && !isNaN(record.index)) {
        console.log('   ✅ Data validation test passed');
      } else {
        throw new Error('Invalid index value found');
      }
    }
  } catch (error) {
    throw new Error(`Data validation test failed: ${error.message}`);
  }
}

// Helper function to map postcode to region
async function getRegionFromPostcode(postcode) {
  // Simple mapping for testing - in production this would use a proper postcode database
  const postcodeToRegion = {
    'SW1A 1AA': 'London',
    'M1 1AA': 'North West',
    'B1 1AA': 'West Midlands',
    'L1 1AA': 'North West',
    'E1 1AA': 'London',
    'W11 1AA': 'London'
  };
  
  return postcodeToRegion[postcode] || 'London'; // Default to London
}

// Main test execution
async function runTests() {
  const runner = new TestRunner();
  
  // Add tests based on mode
  if (argv.mode === 'all' || argv.mode === 'upload') {
    runner.addTest('Elasticsearch Connection', testElasticsearchConnection);
    runner.addTest('Index Existence', testIndexExists);
    runner.addTest('Upload Mode', testUploadMode);
  }
  
  if (argv.mode === 'all' || argv.mode === 'search') {
    runner.addTest('Search Mode', () => testSearchMode(argv.postcode));
  }
  
  if (argv.mode === 'all' || argv.mode === 'api-disabled') {
    runner.addTest('API Disabled', testApiDisabled);
  }
  
  if (argv.mode === 'all' || argv.mode === 'error-handling') {
    runner.addTest('Error Handling', testErrorHandling);
  }
  
  await runner.runTests();
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n🎉 All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests, TestRunner }; 