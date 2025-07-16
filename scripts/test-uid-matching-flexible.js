const fs = require('fs');
const csv = require('csv-parser');

function normalizeUID(uid) {
  return uid.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
}

async function testFlexibleUIDMatching() {
  console.log('🔍 Testing flexible UID matching between cleaned Land Registry and EPC data...');
  
  // Load sample Land Registry properties
  const landRegistryUIDs = new Map();
  const landRegistrySamples = [];
  
  return new Promise((resolve, reject) => {
    const rl = require('readline').createInterface({
      input: fs.createReadStream('data/cleaned/properties-cleaned-uid.csv'),
      crlfDelay: Infinity
    });

    let count = 0;
    rl.on('line', (line) => {
      if (count >= 100) {
        rl.close();
        return;
      }
      
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      const uid = values[values.length - 4]; // CLEAN_UID column
      const normalizedUID = normalizeUID(uid);
      
      landRegistryUIDs.set(normalizedUID, uid);
      
      landRegistrySamples.push({
        original_uid: uid,
        normalized_uid: normalizedUID,
        paon: values[7],
        street: values[9],
        postcode: values[3]
      });
      
      count++;
    });

    rl.on('close', async () => {
      console.log(`✅ Loaded ${landRegistryUIDs.size} Land Registry UIDs`);
      
      // Show some examples
      console.log('\n📋 Land Registry UID Examples:');
      landRegistrySamples.slice(0, 5).forEach((sample, i) => {
        console.log(`${i+1}. Original: "${sample.original_uid}"`);
        console.log(`   Normalized: "${sample.normalized_uid}"`);
        console.log(`   PAON: "${sample.paon}", Street: "${sample.street}", Postcode: "${sample.postcode}"`);
      });
      
      // Load sample EPC data
      const epcUIDs = new Map();
      const epcSamples = [];
      
      fs.createReadStream('data/cleaned/epc-cleaned-uid.csv')
        .pipe(csv())
        .on('data', (row) => {
          if (epcSamples.length >= 100) return;
          
          const uid = row.CLEAN_UID;
          const normalizedUID = normalizeUID(uid);
          
          if (uid && uid !== '') {
            epcUIDs.set(normalizedUID, uid);
            epcSamples.push({
              original_uid: uid,
              normalized_uid: normalizedUID,
              address1: row.ADDRESS1,
              postcode: row.POSTCODE
            });
          }
        })
        .on('end', () => {
          console.log(`✅ Loaded ${epcUIDs.size} EPC UIDs`);
          
          console.log('\n📋 EPC UID Examples:');
          epcSamples.slice(0, 5).forEach((sample, i) => {
            console.log(`${i+1}. Original: "${sample.original_uid}"`);
            console.log(`   Normalized: "${sample.normalized_uid}"`);
            console.log(`   Address1: "${sample.address1}", Postcode: "${sample.postcode}"`);
          });
          
          // Find matches
          const matches = [];
          for (const [lrNormalized, lrOriginal] of landRegistryUIDs) {
            if (epcUIDs.has(lrNormalized)) {
              matches.push({
                landRegistry: lrOriginal,
                epc: epcUIDs.get(lrNormalized)
              });
            }
          }
          
          console.log(`\n🎯 Matches found: ${matches.length} out of ${landRegistryUIDs.size} (${(matches.length/landRegistryUIDs.size*100).toFixed(1)}%)`);
          
          if (matches.length > 0) {
            console.log('\n✅ Matching UIDs:');
            matches.slice(0, 5).forEach((match, i) => {
              console.log(`${i+1}. LR: "${match.landRegistry}"`);
              console.log(`   EPC: "${match.epc}"`);
            });
          }
          
          resolve();
        })
        .on('error', reject);
    });

    rl.on('error', reject);
  });
}

testFlexibleUIDMatching().catch(console.error); 