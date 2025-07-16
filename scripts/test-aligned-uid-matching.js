const fs = require('fs');
const csv = require('csv-parser');

function generatePropertyUID(row) {
  const number = (row.paon || '').toString().toLowerCase().trim();
  const street = (row.street || '').toLowerCase().trim();
  const postcode = (row.postcode || '').toLowerCase().trim();
  
  const cleanNumber = number.replace(/[^a-z0-9]/g, '');
  const cleanStreet = street.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const cleanPostcode = postcode.replace(/\s+/g, '').toLowerCase();
  
  return `${cleanNumber}-${cleanStreet}-${cleanPostcode}`;
}

function generateEPCUID(row) {
  const address1 = (row.ADDRESS1 || '').toLowerCase().trim();
  const address2 = (row.ADDRESS2 || '').toLowerCase().trim();
  const address3 = (row.ADDRESS3 || '').toLowerCase().trim();
  const postcode = (row.POSTCODE || '').toLowerCase().trim();
  
  const addressParts = address1.split(' ');
  const number = addressParts[0] || '';
  const street = addressParts.slice(1).join(' ') || address2 || address3;
  
  const cleanNumber = number.replace(/[^a-z0-9]/g, '');
  const cleanStreet = street.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const cleanPostcode = postcode.replace(/\s+/g, '').toLowerCase();
  
  return `${cleanNumber}-${cleanStreet}-${cleanPostcode}`;
}

async function testAlignedUIDMatching() {
  console.log('🔍 Testing UID matching between aligned Land Registry and EPC data...');
  
  // Load sample Land Registry properties
  const landRegistryUIDs = new Map();
  const landRegistrySamples = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('data/aligned-2006/land-registry-2006.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (landRegistrySamples.length >= 100) return;
        
        const uid = generatePropertyUID(row);
        landRegistryUIDs.set(uid, uid);
        
        landRegistrySamples.push({
          uid,
          paon: row.paon,
          street: row.street,
          postcode: row.postcode,
          date: row.date
        });
      })
      .on('end', async () => {
        console.log(`✅ Loaded ${landRegistryUIDs.size} Land Registry UIDs`);
        
        // Show some examples
        console.log('\n📋 Land Registry UID Examples:');
        landRegistrySamples.slice(0, 5).forEach((sample, i) => {
          console.log(`${i+1}. PAON: "${sample.paon}", Street: "${sample.street}", Postcode: "${sample.postcode}"`);
          console.log(`   Date: ${sample.date}, UID: ${sample.uid}`);
        });
        
        // Load sample EPC data
        const epcUIDs = new Map();
        const epcSamples = [];
        
        fs.createReadStream('data/aligned-2006/epc-2006.csv')
          .pipe(csv())
          .on('data', (row) => {
            if (epcSamples.length >= 100) return;
            
            const uid = generateEPCUID(row);
            if (uid && uid !== '--') {
              epcUIDs.set(uid, uid);
              epcSamples.push({
                uid,
                address1: row.ADDRESS1,
                address2: row.ADDRESS2,
                address3: row.ADDRESS3,
                postcode: row.POSTCODE,
                inspection_date: row.INSPECTION_DATE
              });
            }
          })
          .on('end', () => {
            console.log(`✅ Loaded ${epcUIDs.size} EPC UIDs`);
            
            console.log('\n📋 EPC UID Examples:');
            epcSamples.slice(0, 5).forEach((sample, i) => {
              console.log(`${i+1}. Address1: "${sample.address1}", Address2: "${sample.address2}", Postcode: "${sample.postcode}"`);
              console.log(`   Date: ${sample.inspection_date}, UID: ${sample.uid}`);
            });
            
            // Find matches
            const matches = [];
            for (const lrUID of landRegistryUIDs.keys()) {
              if (epcUIDs.has(lrUID)) {
                matches.push(lrUID);
              }
            }
            
            console.log(`\n🎯 Matches found: ${matches.length} out of ${landRegistryUIDs.size} (${(matches.length/landRegistryUIDs.size*100).toFixed(1)}%)`);
            
            if (matches.length > 0) {
              console.log('\n✅ Matching UIDs:');
              matches.slice(0, 5).forEach(uid => console.log(`  - ${uid}`));
            } else {
              console.log('\n❌ No matches found. This suggests:');
              console.log('  1. Different address formats between datasets');
              console.log('  2. Different geographic coverage');
              console.log('  3. UID generation logic needs adjustment');
            }
            
            resolve();
          })
          .on('error', reject);
      })
      .on('error', reject);
  });
}

testAlignedUIDMatching().catch(console.error); 