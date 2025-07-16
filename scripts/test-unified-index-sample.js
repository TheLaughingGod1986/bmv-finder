const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Client } = require('@elastic/elasticsearch');

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000,
  maxRetries: 3,
  retryOnTimeout: true,
});

// Configuration
const SAMPLE_SIZE = 100000;
const UNIFIED_INDEX = 'unified_properties';
const RESULTS_FILE = 'unified-index-test-results.json';

console.log('🚀 Testing Unified Property Index on 100,000 Properties');
console.log('📊 Analyzing data completeness across all sources');

// Generate UID for property
function generatePropertyUID(property) {
  const number = (property.paon || property.house_number || '').toString().toLowerCase().trim();
  const street = (property.street || property.street_name || '').toLowerCase().trim();
  const postcode = (property.postcode || '').toLowerCase().trim();
  
  // Clean and normalize components
  const cleanNumber = number.replace(/[^a-z0-9]/g, '');
  const cleanStreet = street.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const cleanPostcode = postcode.replace(/\s+/g, '').toLowerCase();
  
  return `${cleanNumber}-${cleanStreet}-${cleanPostcode}`;
}

// Load sample properties from Land Registry
async function loadSampleProperties() {
  console.log('📖 Loading sample properties from Land Registry...');
  const properties = [];
  let count = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('pp-complete-cleaned.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (count < SAMPLE_SIZE) {
          properties.push({
            ...row,
            uid: generatePropertyUID(row)
          });
          count++;
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded ${properties.length.toLocaleString()} sample properties`);
        resolve(properties);
      })
      .on('error', reject);
  });
}

// Load EPC data for matching
async function loadEPCData() {
  console.log('📖 Loading EPC data...');
  const epcData = new Map();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('data/epc-certificates-combined.csv')
      .pipe(csv())
      .on('data', (row) => {
        const uid = generatePropertyUID(row);
        epcData.set(uid, row);
      })
      .on('end', () => {
        console.log(`✅ Loaded ${epcData.size.toLocaleString()} EPC records`);
        resolve(epcData);
      })
      .on('error', reject);
  });
}

// Load HPI data
async function loadHPIData() {
  console.log('📖 Loading HPI data...');
  const hpiData = new Map();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('data/hpi-regions.csv')
      .pipe(csv())
      .on('data', (row) => {
        const region = row.region?.toLowerCase().replace(/\s+/g, '-');
        if (region) {
          if (!hpiData.has(region)) {
            hpiData.set(region, []);
          }
          hpiData.get(region).push({
            date: row.date,
            hpi_value: parseFloat(row.hpiIndex),
            hpi_change_monthly: parseFloat(row.percentageChangeMonthly),
            hpi_change_yearly: parseFloat(row.percentageChangeYearly)
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded HPI data for ${hpiData.size} regions`);
        resolve(hpiData);
      })
      .on('error', reject);
  });
}

// Test data integration for sample properties
async function testDataIntegration(properties, epcData, hpiData) {
  console.log('🔍 Testing data integration...');
  
  let landRegistryOnly = 0;
  let withEPC = 0;
  let withHPI = 0;
  let withBoth = 0;
  let completeData = 0;
  
  const integrationResults = [];
  
  properties.forEach((property, index) => {
    if (index % 10000 === 0) {
      console.log(`  Processed ${index.toLocaleString()} properties...`);
    }
    
    const uid = property.uid;
    const epcMatch = epcData.has(uid);
    const hpiMatch = hpiData.has(property.county?.toLowerCase().replace(/\s+/g, '-'));
    
    const result = {
      uid,
      address: `${property.paon || ''} ${property.street || ''} ${property.postcode || ''}`.trim(),
      land_registry: true,
      epc: epcMatch,
      hpi: hpiMatch,
      data_sources: ['land_registry']
    };
    
    if (epcMatch) {
      result.data_sources.push('epc');
      withEPC++;
    }
    
    if (hpiMatch) {
      result.data_sources.push('hpi');
      withHPI++;
    }
    
    if (epcMatch && hpiMatch) {
      withBoth++;
    }
    
    if (!epcMatch && !hpiMatch) {
      landRegistryOnly++;
    }
    
    // Check for complete data (all sources + key fields)
    const hasCompleteData = epcMatch && hpiMatch && 
                           property.price && property.dateOfTransfer &&
                           epcData.get(uid)?.bedrooms && epcData.get(uid)?.property_size;
    
    if (hasCompleteData) {
      completeData++;
    }
    
    result.complete_data = hasCompleteData;
    integrationResults.push(result);
  });
  
  return {
    total: properties.length,
    landRegistryOnly,
    withEPC,
    withHPI,
    withBoth,
    completeData,
    results: integrationResults
  };
}

// Analyze data quality
function analyzeDataQuality(results) {
  console.log('📊 Analyzing data quality...');
  
  const analysis = {
    totalProperties: results.total,
    landRegistryOnly: results.landRegistryOnly,
    withEPC: results.withEPC,
    withHPI: results.withHPI,
    withBoth: results.withBoth,
    completeData: results.completeData,
    
    // Percentages
    landRegistryOnlyPct: (results.landRegistryOnly / results.total * 100).toFixed(2),
    withEPCPct: (results.withEPC / results.total * 100).toFixed(2),
    withHPIPct: (results.withHPI / results.total * 100).toFixed(2),
    withBothPct: (results.withBoth / results.total * 100).toFixed(2),
    completeDataPct: (results.completeData / results.total * 100).toFixed(2)
  };
  
  return analysis;
}

// Create sample unified records
async function createSampleUnifiedRecords(properties, epcData, hpiData) {
  console.log('📝 Creating sample unified records...');
  
  const unifiedRecords = [];
  let created = 0;
  
  properties.forEach(property => {
    const uid = property.uid;
    const epcMatch = epcData.get(uid);
    const hpiRegion = property.county?.toLowerCase().replace(/\s+/g, '-');
    const hpiMatch = hpiData.get(hpiRegion);
    
    const unifiedRecord = {
      property_uid: uid,
      transaction_id: property.transactionId || property.id,
      paon: property.paon,
      street: property.street,
      town_city: property.town_city,
      county: property.county,
      postcode: property.postcode,
      full_address: `${property.paon || ''} ${property.street || ''} ${property.town_city || ''}`.trim(),
      property_type: property.propertyType,
      price: parseInt(property.price) || 0,
      date_of_transfer: property.dateOfTransfer,
      year: new Date(property.dateOfTransfer).getFullYear(),
      month: new Date(property.dateOfTransfer).getMonth() + 1,
      data_sources: ['land_registry']
    };
    
    // Add EPC data if available
    if (epcMatch) {
      unifiedRecord.bedrooms = parseInt(epcMatch.bedrooms);
      unifiedRecord.property_size = parseFloat(epcMatch.property_size);
      unifiedRecord.floor_area_m2 = parseFloat(epcMatch.floor_area_m2);
      unifiedRecord.epc_rating = epcMatch.epc_rating;
      unifiedRecord.current_energy_rating = epcMatch.current_energy_rating;
      unifiedRecord.construction_year = parseInt(epcMatch.construction_year);
      unifiedRecord.data_sources.push('epc');
    }
    
    // Add HPI data if available
    if (hpiMatch && hpiMatch.length > 0) {
      const latestHPI = hpiMatch[hpiMatch.length - 1];
      unifiedRecord.hpi_region = hpiRegion;
      unifiedRecord.hpi_value = latestHPI.hpi_value;
      unifiedRecord.hpi_change_monthly = latestHPI.hpi_change_monthly;
      unifiedRecord.hpi_change_yearly = latestHPI.hpi_change_yearly;
      unifiedRecord.hpi_date = latestHPI.date;
      
      // Calculate estimated current value
      if (unifiedRecord.price && unifiedRecord.date_of_transfer) {
        const yearsSinceSale = (new Date() - new Date(unifiedRecord.date_of_transfer)) / (1000 * 60 * 60 * 24 * 365);
        const growthFactor = Math.pow(1 + (latestHPI.hpi_change_yearly / 100), yearsSinceSale);
        unifiedRecord.estimated_current_value = Math.round(unifiedRecord.price * growthFactor);
        unifiedRecord.growth_percentage = ((growthFactor - 1) * 100);
        unifiedRecord.years_since_sale = yearsSinceSale;
      }
      
      unifiedRecord.data_sources.push('hpi');
    }
    
    unifiedRecords.push(unifiedRecord);
    created++;
    
    if (created % 10000 === 0) {
      console.log(`  Created ${created.toLocaleString()} unified records...`);
    }
  });
  
  console.log(`✅ Created ${unifiedRecords.length.toLocaleString()} unified records`);
  return unifiedRecords;
}

// Index sample records to test
async function indexSampleRecords(records) {
  console.log('📊 Indexing sample unified records...');
  
  const BATCH_SIZE = 1000;
  let indexed = 0;
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    const body = batch.flatMap(record => [
      { index: { _index: UNIFIED_INDEX, _id: record.property_uid } },
      record
    ]);
    
    try {
      await esClient.bulk({ body, refresh: false });
      indexed += batch.length;
      
      if (indexed % 10000 === 0) {
        console.log(`  Indexed ${indexed.toLocaleString()} records...`);
      }
    } catch (error) {
      console.error('Error indexing batch:', error);
    }
  }
  
  // Refresh index
  await esClient.indices.refresh({ index: UNIFIED_INDEX });
  console.log(`✅ Indexed ${indexed.toLocaleString()} sample records`);
  
  return indexed;
}

// Main test function
async function runUnifiedIndexTest() {
  try {
    const startTime = Date.now();
    
    // Step 1: Load sample data
    const properties = await loadSampleProperties();
    const epcData = await loadEPCData();
    const hpiData = await loadHPIData();
    
    // Step 2: Test data integration
    const integrationResults = await testDataIntegration(properties, epcData, hpiData);
    
    // Step 3: Analyze results
    const analysis = analyzeDataQuality(integrationResults);
    
    // Step 4: Create unified records
    const unifiedRecords = await createSampleUnifiedRecords(properties, epcData, hpiData);
    
    // Step 5: Index sample records
    const indexed = await indexSampleRecords(unifiedRecords);
    
    // Step 6: Save results
    const testResults = {
      timestamp: new Date().toISOString(),
      sampleSize: SAMPLE_SIZE,
      propertiesLoaded: properties.length,
      epcRecordsLoaded: epcData.size,
      hpiRegionsLoaded: hpiData.size,
      integrationResults,
      analysis,
      unifiedRecordsCreated: unifiedRecords.length,
      indexedRecords: indexed,
      executionTime: Date.now() - startTime
    };
    
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(testResults, null, 2));
    
    // Display results
    console.log('\n🎯 UNIFIED INDEX TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`📊 Sample Size: ${SAMPLE_SIZE.toLocaleString()} properties`);
    console.log(`📊 EPC Records: ${epcData.size.toLocaleString()}`);
    console.log(`📊 HPI Regions: ${hpiData.size.toLocaleString()}`);
    console.log(`⏱️  Execution Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.log('');
    console.log('📈 DATA INTEGRATION RESULTS:');
    console.log(`  🏠 Land Registry Only: ${analysis.landRegistryOnly.toLocaleString()} (${analysis.landRegistryOnlyPct}%)`);
    console.log(`  ⚡ With EPC Data: ${analysis.withEPC.toLocaleString()} (${analysis.withEPCPct}%)`);
    console.log(`  📈 With HPI Data: ${analysis.withHPI.toLocaleString()} (${analysis.withHPIPct}%)`);
    console.log(`  🔗 With Both EPC & HPI: ${analysis.withBoth.toLocaleString()} (${analysis.withBothPct}%)`);
    console.log(`  ✅ Complete Data: ${analysis.completeData.toLocaleString()} (${analysis.completeDataPct}%)`);
    console.log('');
    console.log('📊 UNIFIED RECORDS:');
    console.log(`  📝 Created: ${unifiedRecords.length.toLocaleString()}`);
    console.log(`  📊 Indexed: ${indexed.toLocaleString()}`);
    console.log('');
    console.log(`💾 Results saved to: ${RESULTS_FILE}`);
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Error in unified index test:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  runUnifiedIndexTest()
    .then(() => {
      console.log('\n✅ Unified index test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runUnifiedIndexTest }; 