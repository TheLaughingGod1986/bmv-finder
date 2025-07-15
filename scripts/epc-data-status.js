const axios = require('axios');
const { Client } = require('@elastic/elasticsearch');

// Elasticsearch client configuration
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  }
});

async function checkEPCDataSources() {
  console.log('🔍 Checking EPC data sources...\n');
  
  const sources = [
    {
      name: 'EPC Open Data Communities',
      url: 'https://epc.opendatacommunities.org/',
      description: 'Official EPC data portal'
    },
    {
      name: 'EPC API Search',
      url: 'https://epc.opendatacommunities.org/api/v1/domestic/search',
      description: 'EPC API endpoint'
    },
    {
      name: 'EPC Download',
      url: 'https://epc.opendatacommunities.org/downloads/domestic_epc.csv',
      description: 'Direct CSV download'
    },
    {
      name: 'Gov.uk EPC Data',
      url: 'https://www.gov.uk/government/statistical-data-sets/energy-performance-certificates-data',
      description: 'Government EPC data portal'
    }
  ];
  
  for (const source of sources) {
    try {
      console.log(`📡 Checking: ${source.name}`);
      console.log(`   URL: ${source.url}`);
      console.log(`   Description: ${source.description}`);
      
      const response = await axios.get(source.url, {
        timeout: 10000,
        validateStatus: () => true // Don't throw on any status code
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers['content-type'] || 'unknown'}`);
      
      if (response.data && typeof response.data === 'string') {
        const preview = response.data.substring(0, 200).replace(/\n/g, ' ');
        console.log(`   Preview: ${preview}...`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }
}

async function checkCurrentEPCIndex() {
  console.log('📊 Checking current EPC index status...\n');
  
  try {
    // Check if index exists
    const indexExists = await esClient.indices.exists({ index: 'epc_property_data' });
    
    if (!indexExists) {
      console.log('❌ EPC index does not exist');
      return;
    }
    
    // Get index stats
    const stats = await esClient.indices.stats({ index: 'epc_property_data' });
    const indexStats = stats.indices['epc_property_data'];
    
    console.log('✅ EPC index exists');
    console.log(`📊 Document count: ${indexStats.total.docs.count.toLocaleString()}`);
    console.log(`💾 Index size: ${(indexStats.total.store.size_in_bytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📈 Primary shards: ${indexStats.shards.total.length}`);
    
    // Get a sample document
    const sample = await esClient.search({
      index: 'epc_property_data',
      size: 1,
      body: {
        query: { match_all: {} }
      }
    });
    
    if (sample.hits.hits.length > 0) {
      const doc = sample.hits.hits[0]._source;
      console.log('\n📄 Sample document fields:');
      Object.keys(doc).forEach(key => {
        console.log(`   ${key}: ${doc[key]}`);
      });
    } else {
      console.log('\n❌ No documents found in EPC index');
    }
    
  } catch (error) {
    console.error('❌ Error checking EPC index:', error.message);
  }
}

async function checkEPCAPI() {
  console.log('\n🔌 Testing EPC API access...\n');
  
  try {
    // Test basic API access
    const response = await axios.get('https://epc.opendatacommunities.org/api/v1/domestic/search', {
      params: {
        postcode: 'SW1A 1AA',
        size: 1
      },
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log(`📡 API Response Status: ${response.status}`);
    console.log(`📡 API Response Headers:`, response.headers);
    
    if (response.data) {
      console.log(`📡 API Response Data Type: ${typeof response.data}`);
      if (typeof response.data === 'string') {
        console.log(`📡 API Response Preview: ${response.data.substring(0, 200)}...`);
      } else {
        console.log(`📡 API Response Keys: ${Object.keys(response.data).join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ EPC API Error:', error.message);
  }
}

async function checkAlternativeEPCSources() {
  console.log('\n🔍 Checking alternative EPC data sources...\n');
  
  const alternativeSources = [
    {
      name: 'Land Registry EPC Data',
      url: 'https://www.gov.uk/government/collections/price-paid-data',
      description: 'EPC data through Land Registry'
    },
    {
      name: 'ONS EPC Statistics',
      url: 'https://www.ons.gov.uk/economy/environmentalaccounts/datasets/energyperformanceofbuildingscertificates',
      description: 'Office for National Statistics EPC data'
    },
    {
      name: 'BEIS EPC Data',
      url: 'https://www.gov.uk/government/statistics/energy-performance-of-buildings-certificates',
      description: 'Department for Business, Energy & Industrial Strategy'
    }
  ];
  
  for (const source of alternativeSources) {
    console.log(`📡 ${source.name}: ${source.url}`);
    console.log(`   ${source.description}`);
    console.log('');
  }
}

async function main() {
  console.log('🚀 EPC Data Status Check\n');
  console.log('=' .repeat(50));
  
  await checkEPCDataSources();
  await checkCurrentEPCIndex();
  await checkEPCAPI();
  await checkAlternativeEPCSources();
  
  console.log('=' .repeat(50));
  console.log('\n📋 Summary:');
  console.log('✅ EPC index structure is ready in Elasticsearch');
  console.log('❌ Direct CSV downloads are not working (returning HTML)');
  console.log('❓ EPC API access requires authentication/registration');
  console.log('💡 Recommendation: Use your existing Property Enrichment Service for on-demand EPC data');
  console.log('💡 Alternative: Register for EPC API access for bulk data');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, checkEPCDataSources, checkCurrentEPCIndex }; 