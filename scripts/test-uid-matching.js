const fs = require('fs');
const csv = require('csv-parser');

function generatePropertyUID(row) {
  const number = (row[7] || '').toString().toLowerCase().trim(); // paon
  const street = (row[9] || '').toLowerCase().trim(); // street
  const postcode = (row[3] || '').toLowerCase().trim(); // postcode
  
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
  
  // Extract house number from ADDRESS1 (usually first part)
  const addressParts = address1.split(' ');
  const number = addressParts[0] || '';
  const street = addressParts.slice(1).join(' ') || address2 || address3;
  
  const cleanNumber = number.replace(/[^a-z0-9]/g, '');
  const cleanStreet = street.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const cleanPostcode = postcode.replace(/\s+/g, '').toLowerCase();
  
  return `${cleanNumber}-${cleanStreet}-${cleanPostcode}`;
}

async function testUIDMatching() {
  console.log('🔍 Testing UID matching between Land Registry and EPC data...');
  
  // Load sample Land Registry properties
  const landRegistryUIDs = new Set();
  const landRegistrySamples = [];
  
  return new Promise((resolve, reject) => {
    const rl = require('readline').createInterface({
      input: fs.createReadStream('pp-complete-cleaned.csv'),
      crlfDelay: Infinity
    });

    let count = 0;
    rl.on('line', (line) => {
      if (count >= 100) {
        rl.close();
        return;
      }
      
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      const uid = generatePropertyUID(values);
      landRegistryUIDs.add(uid);
      
      landRegistrySamples.push({
        uid,
        paon: values[7],
        street: values[9],
        postcode: values[3],
        original: line
      });
      
      count++;
    });

    rl.on('close', async () => {
      console.log(`✅ Loaded ${landRegistryUIDs.size} Land Registry UIDs`);
      
      // Show some examples
      console.log('\n📋 Land Registry UID Examples:');
      landRegistrySamples.slice(0, 5).forEach((sample, i) => {
        console.log(`${i+1}. PAON: "${sample.paon}", Street: "${sample.street}", Postcode: "${sample.postcode}"`);
        console.log(`   UID: ${sample.uid}`);
      });
      
      // Load sample EPC data
      const epcUIDs = new Set();
      const epcSamples = [];
      
      fs.createReadStream('data/epc-certificates-combined.csv')
        .pipe(csv())
        .on('data', (row) => {
          if (epcSamples.length >= 100) return;
          
          const uid = generateEPCUID(row);
          if (uid && uid !== '--') {
            epcUIDs.add(uid);
            epcSamples.push({
              uid,
              address1: row.ADDRESS1,
              address2: row.ADDRESS2,
              address3: row.ADDRESS3,
              postcode: row.POSTCODE
            });
          }
        })
        .on('end', () => {
          console.log(`✅ Loaded ${epcUIDs.size} EPC UIDs`);
          
          console.log('\n📋 EPC UID Examples:');
          epcSamples.slice(0, 5).forEach((sample, i) => {
            console.log(`${i+1}. Address1: "${sample.address1}", Address2: "${sample.address2}", Postcode: "${sample.postcode}"`);
            console.log(`   UID: ${sample.uid}`);
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
            matches.slice(0, 5).forEach(uid => console.log(`  - ${uid}`));
          }
          
          resolve();
        })
        .on('error', reject);
    });

    rl.on('error', reject);
  });
}

testUIDMatching().catch(console.error); 