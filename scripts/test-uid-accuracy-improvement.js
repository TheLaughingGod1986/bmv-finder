const fs = require('fs');
const fastcsv = require('fast-csv');

/**
 * Test script to demonstrate UID accuracy improvement from data cleaning
 */

// Import cleaning functions
const { generateCleanUID, standardizeHouseNumber, standardizeStreetName, standardizePostcode } = require('./clean-csv-data-streaming.js');

function generateBasicUID(houseNumber, streetName, postcode) {
  const normalizedNumber = houseNumber ? houseNumber.toString().trim().toLowerCase() : '';
  const normalizedStreet = streetName ? streetName.trim().toLowerCase().replace(/\s+/g, ' ') : '';
  const normalizedPostcode = postcode ? postcode.trim().toUpperCase().replace(/\s+/g, '') : '';
  
  return `${normalizedNumber} ${normalizedStreet} ${normalizedPostcode}`.toUpperCase();
}

function testAccuracyImprovement() {
  console.log('🧪 Testing UID Accuracy Improvement from Data Cleaning\n');
  
  const testCases = [
    {
      name: 'Street Abbreviations',
      properties: { number: '21', street: 'Main St', postcode: 'NE5 2PR' },
      epc: { number: '21', street: 'Main Street', postcode: 'NE5 2PR' },
      shouldMatch: true
    },
    {
      name: 'Case Variations',
      properties: { number: '123', street: 'HIGH ROAD', postcode: 'SW1A 1AA' },
      epc: { number: '123', street: 'High Rd', postcode: 'SW1A 1AA' },
      shouldMatch: true
    },
    {
      name: 'Postcode Spaces',
      properties: { number: '45', street: 'Church Lane', postcode: 'M1 1AA' },
      epc: { number: '45', street: 'Church Lane', postcode: 'M11AA' },
      shouldMatch: true
    },
    {
      name: 'Flat Numbers',
      properties: { number: 'Flat 2A', street: 'Queen\'s Road', postcode: 'EH1 1AA' },
      epc: { number: 'FLAT 2A', street: 'Queens Road', postcode: 'EH1 1AA' },
      shouldMatch: true
    },
    {
      name: 'Complex Address',
      properties: { number: 'The Old Post Office', street: 'Church Ln', postcode: 'BS1 1AA' },
      epc: { number: 'The Old Post Office', street: 'Church Lane', postcode: 'BS1 1AA' },
      shouldMatch: true
    }
  ];
  
  let basicMatches = 0;
  let cleanMatches = 0;
  let totalTests = testCases.length;
  
  console.log('📊 UID Matching Results:\n');
  
  testCases.forEach((testCase, index) => {
    // Generate basic UIDs (before cleaning)
    const basicUID1 = generateBasicUID(
      testCase.properties.number, 
      testCase.properties.street, 
      testCase.properties.postcode
    );
    const basicUID2 = generateBasicUID(
      testCase.epc.number, 
      testCase.epc.street, 
      testCase.epc.postcode
    );
    
    // Generate clean UIDs (after cleaning)
    const cleanUID1 = generateCleanUID(
      testCase.properties.number, 
      testCase.properties.street, 
      testCase.properties.postcode
    );
    const cleanUID2 = generateCleanUID(
      testCase.epc.number, 
      testCase.epc.street, 
      testCase.epc.postcode
    );
    
    const basicMatch = basicUID1 === basicUID2;
    const cleanMatch = cleanUID1 === cleanUID2;
    
    if (basicMatch) basicMatches++;
    if (cleanMatch) cleanMatches++;
    
    console.log(`${index + 1}. ${testCase.name}:`);
    console.log(`   Properties: ${testCase.properties.number} ${testCase.properties.street}, ${testCase.properties.postcode}`);
    console.log(`   EPC: ${testCase.epc.number} ${testCase.epc.street}, ${testCase.epc.postcode}`);
    console.log(`   Basic UID 1: ${basicUID1}`);
    console.log(`   Basic UID 2: ${basicUID2}`);
    console.log(`   Basic Match: ${basicMatch ? '✅' : '❌'}`);
    console.log(`   Clean UID 1: ${cleanUID1}`);
    console.log(`   Clean UID 2: ${cleanUID2}`);
    console.log(`   Clean Match: ${cleanMatch ? '✅' : '❌'}`);
    console.log(`   Expected: ${testCase.shouldMatch ? '✅' : '❌'}`);
    console.log('');
  });
  
  const basicAccuracy = (basicMatches / totalTests) * 100;
  const cleanAccuracy = (cleanMatches / totalTests) * 100;
  const improvement = cleanAccuracy - basicAccuracy;
  
  console.log('📈 Accuracy Summary:');
  console.log(`   Basic UID Matching: ${basicMatches}/${totalTests} (${basicAccuracy.toFixed(1)}%)`);
  console.log(`   Clean UID Matching: ${cleanMatches}/${totalTests} (${cleanAccuracy.toFixed(1)}%)`);
  console.log(`   Improvement: +${improvement.toFixed(1)} percentage points`);
  
  if (improvement > 0) {
    console.log(`\n🎉 Data cleaning improved UID matching accuracy by ${improvement.toFixed(1)}%!`);
  } else {
    console.log(`\n⚠️  No improvement detected in this test set.`);
  }
}

function testRealDataSample() {
  console.log('\n🔍 Testing with Real Data Sample\n');
  
  // Check if cleaned data exists
  const propertiesPath = 'data/cleaned/properties-cleaned-uid.csv';
  const epcPath = 'data/cleaned/epc-cleaned-uid.csv';
  
  if (!fs.existsSync(propertiesPath) || !fs.existsSync(epcPath)) {
    console.log('❌ Cleaned data files not found. Please run the cleaning script first.');
    return;
  }
  
  console.log('📖 Loading sample data from cleaned files...');
  
  // Load sample data (first 1000 records from each)
  const propertiesSample = [];
  const epcSample = [];
  
  // Load properties sample
  fs.createReadStream(propertiesPath)
    .pipe(fastcsv.parse({ headers: false }))
    .on('data', (row) => {
      if (propertiesSample.length < 1000) {
        // Properties CSV: [0]=GUID, [3]=Postcode, [8]=Number, [9]=Street, [last-4]=CleanUID
        propertiesSample.push({
          guid: row[0],
          postcode: row[3],
          number: row[8],
          street: row[9],
          cleanUID: row[row.length - 4] // Clean UID is 4th from end
        });
      }
    })
    .on('end', () => {
      console.log(`✅ Loaded ${propertiesSample.length} properties sample`);
      
      // Load EPC sample
      fs.createReadStream(epcPath)
        .pipe(fastcsv.parse({ headers: true }))
        .on('data', (row) => {
          if (epcSample.length < 1000) {
            epcSample.push({
              certificate_id: row['CERTIFICATE_ID'] || row['certificate_id'],
              postcode: row['POSTCODE'] || row['postcode'],
              address: row['ADDRESS1'] || row['ADDRESS'] || row['address1'],
              cleanUID: row['CLEAN_UID']
            });
          }
        })
        .on('end', () => {
          console.log(`✅ Loaded ${epcSample.length} EPC sample`);
          
          // Test UID matching
          testUIDMatching(propertiesSample, epcSample);
        });
    });
}

function testUIDMatching(properties, epcRecords) {
  console.log('\n🎯 Testing UID Matching with Real Data\n');
  
  const uidMatches = new Map();
  let totalMatches = 0;
  let exactMatches = 0;
  
  // Build UID index from properties
  properties.forEach(prop => {
    if (prop.cleanUID) {
      uidMatches.set(prop.cleanUID, {
        type: 'property',
        data: prop,
        matches: []
      });
    }
  });
  
  // Find matches in EPC data
  epcRecords.forEach(epc => {
    if (epc.cleanUID && uidMatches.has(epc.cleanUID)) {
      const match = uidMatches.get(epc.cleanUID);
      match.matches.push({
        type: 'epc',
        data: epc
      });
      totalMatches++;
      
      // Check for exact matches (same postcode and similar address)
      if (match.data.postcode === epc.postcode) {
        exactMatches++;
      }
    }
  });
  
  // Calculate statistics
  const uniqueUIDs = uidMatches.size;
  const propertiesWithMatches = Array.from(uidMatches.values()).filter(m => m.matches.length > 0).length;
  const matchRate = (propertiesWithMatches / uniqueUIDs) * 100;
  const exactMatchRate = (exactMatches / totalMatches) * 100;
  
  console.log('📊 Real Data UID Matching Results:');
  console.log(`   Total Properties: ${properties.length}`);
  console.log(`   Total EPC Records: ${epcRecords.length}`);
  console.log(`   Unique UIDs (Properties): ${uniqueUIDs}`);
  console.log(`   Properties with EPC matches: ${propertiesWithMatches}`);
  console.log(`   Total UID matches: ${totalMatches}`);
  console.log(`   Exact matches: ${exactMatches}`);
  console.log(`   Match rate: ${matchRate.toFixed(2)}%`);
  console.log(`   Exact match rate: ${exactMatchRate.toFixed(2)}%`);
  
  // Show some example matches
  console.log('\n📋 Example UID Matches:');
  let examplesShown = 0;
  for (const [uid, match] of uidMatches.entries()) {
    if (match.matches.length > 0 && examplesShown < 5) {
      console.log(`   UID: ${uid}`);
      console.log(`   Property: ${match.data.number} ${match.data.street}, ${match.data.postcode}`);
      console.log(`   EPC: ${match.matches[0].data.address}, ${match.matches[0].data.postcode}`);
      console.log('');
      examplesShown++;
    }
  }
  
  if (matchRate > 10) {
    console.log('🎉 Excellent! Data cleaning significantly improved UID matching!');
  } else if (matchRate > 5) {
    console.log('✅ Good! Data cleaning improved UID matching.');
  } else {
    console.log('⚠️  Low match rate. May need additional data cleaning rules.');
  }
}

// Run the tests
if (require.main === module) {
  testAccuracyImprovement();
  testRealDataSample();
}

module.exports = { testAccuracyImprovement, testRealDataSample }; 