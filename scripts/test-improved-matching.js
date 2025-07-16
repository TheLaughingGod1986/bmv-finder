const fs = require('fs');
const csv = require('csv-parser');

async function testImprovedMatching() {
  console.log('🔍 Testing improved UID matching...');
  
  // Load Land Registry UIDs
  const landRegistryUIDs = new Set();
  const landRegistrySamples = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream('data/aligned-2006-improved/land-registry-clean.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (landRegistrySamples.length >= 50) return;
        
        const uid = row.property_uid;
        if (uid) {
          landRegistryUIDs.add(uid);
          landRegistrySamples.push({
            uid,
            paon: row.paon,
            street: row.street,
            postcode: row.postcode,
            county: row.county
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded ${landRegistryUIDs.size} Land Registry UIDs`);
        resolve();
      })
      .on('error', reject);
  });
  
  // Load EPC UIDs
  const epcUIDs = new Set();
  const epcSamples = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream('data/aligned-2006-improved/epc-clean.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (epcSamples.length >= 50) return;
        
        const uid = row.epc_uid;
        if (uid) {
          epcUIDs.add(uid);
          epcSamples.push({
            uid,
            address1: row.ADDRESS1,
            postcode: row.POSTCODE,
            county: row.COUNTY
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded ${epcUIDs.size} EPC UIDs`);
        resolve();
      })
      .on('error', reject);
  });
  
  // Show samples
  console.log('\n📋 Land Registry UID Examples:');
  landRegistrySamples.slice(0, 5).forEach((sample, i) => {
    console.log(`${i+1}. PAON: "${sample.paon}", Street: "${sample.street}", Postcode: "${sample.postcode}"`);
    console.log(`   County: "${sample.county}", UID: ${sample.uid}`);
  });
  
  console.log('\n📋 EPC UID Examples:');
  epcSamples.slice(0, 5).forEach((sample, i) => {
    console.log(`${i+1}. Address1: "${sample.address1}", Postcode: "${sample.postcode}"`);
    console.log(`   County: "${sample.county}", UID: ${sample.uid}`);
  });
  
  // Find matches
  const matches = [];
  for (const lrUID of landRegistryUIDs) {
    if (epcUIDs.has(lrUID)) {
      matches.push(lrUID);
    }
  }
  
  console.log(`\n🎯 Matches found: ${matches.length} out of ${landRegistryUIDs.size} (${(matches.length/landRegistryUIDs.size*100).toFixed(1)}%)`);
  
  if (matches.length > 0) {
    console.log('\n✅ Matching UIDs:');
    matches.slice(0, 10).forEach(uid => console.log(`  - ${uid}`));
  } else {
    console.log('\n❌ No matches found. Let\'s check geographic overlap...');
    
    // Check geographic overlap
    const lrCounties = new Set(landRegistrySamples.map(s => s.county));
    const epcCounties = new Set(epcSamples.map(s => s.county));
    
    console.log('\n🌍 Land Registry counties:', Array.from(lrCounties).slice(0, 10));
    console.log('🌍 EPC counties:', Array.from(epcCounties).slice(0, 10));
    
    const commonCounties = Array.from(lrCounties).filter(c => epcCounties.has(c));
    console.log(`🌍 Common counties: ${commonCounties.length}`, commonCounties.slice(0, 5));
  }
}

testImprovedMatching().catch(console.error); 