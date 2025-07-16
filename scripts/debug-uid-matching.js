const fs = require('fs');
const csv = require('csv-parser');

function normalizeString(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractNumberFromAddress(address) {
  if (!address) return '';
  
  const match = address.match(/^(\d+[A-Za-z]?)/);
  if (match) return match[1].toLowerCase();
  
  const flatMatch = address.match(/flat\s+(\d+)/i);
  if (flatMatch) return `flat${flatMatch[1]}`;
  
  return '';
}

function extractStreetFromAddress(address) {
  if (!address) return '';
  
  let street = address
    .replace(/^\d+[A-Za-z]?\s*/, '')
    .replace(/^flat\s+\d+\s*/i, '')
    .replace(/^,\s*/, '')
    .trim();
  
  return normalizeString(street);
}

function generatePropertyUID(row) {
  const paon = (row.paon || '').toString().trim();
  const street = (row.street || '').trim();
  const postcode = (row.postcode || '').trim();
  
  if (!paon || paon === 'undefined' || !street || street === 'undefined' || !postcode || postcode === 'undefined') {
    return null;
  }
  
  const cleanNumber = extractNumberFromAddress(paon);
  const cleanStreet = normalizeString(street);
  const cleanPostcode = postcode.replace(/\s+/g, '').toLowerCase();
  
  if (!cleanNumber || !cleanStreet || !cleanPostcode) {
    return null;
  }
  
  return `${cleanNumber}-${cleanStreet}-${cleanPostcode}`;
}

function generateEPCUID(row) {
  const address1 = (row.ADDRESS1 || '').trim();
  const address2 = (row.ADDRESS2 || '').trim();
  const address3 = (row.ADDRESS3 || '').trim();
  const postcode = (row.POSTCODE || '').trim();
  
  if (!address1 || !postcode) {
    return null;
  }
  
  const cleanNumber = extractNumberFromAddress(address1);
  const cleanStreet = extractStreetFromAddress(address1) || normalizeString(address2) || normalizeString(address3);
  const cleanPostcode = postcode.replace(/\s+/g, '').toLowerCase();
  
  if (!cleanNumber || !cleanStreet || !cleanPostcode) {
    return null;
  }
  
  return `${cleanNumber}-${cleanStreet}-${cleanPostcode}`;
}

async function debugUIDMatching() {
  console.log('🔍 Debugging UID matching...');
  
  // Load sample Land Registry data
  const landRegistrySamples = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream('data/aligned-2006-geographic/land-registry-target-counties.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (landRegistrySamples.length >= 20) return;
        
        const uid = generatePropertyUID(row);
        if (uid) {
          landRegistrySamples.push({
            uid,
            paon: row.paon,
            street: row.street,
            postcode: row.postcode,
            county: row.county
          });
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  // Load sample EPC data
  const epcSamples = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream('data/aligned-2006-geographic/epc-target-counties.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (epcSamples.length >= 20) return;
        
        const uid = generateEPCUID(row);
        if (uid) {
          epcSamples.push({
            uid,
            address1: row.ADDRESS1,
            address2: row.ADDRESS2,
            address3: row.ADDRESS3,
            postcode: row.POSTCODE,
            county: row.COUNTY
          });
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log('\n📋 Land Registry UID Examples:');
  landRegistrySamples.forEach((sample, i) => {
    console.log(`${i+1}. PAON: "${sample.paon}", Street: "${sample.street}", Postcode: "${sample.postcode}"`);
    console.log(`   County: "${sample.county}", UID: ${sample.uid}`);
  });
  
  console.log('\n📋 EPC UID Examples:');
  epcSamples.forEach((sample, i) => {
    console.log(`${i+1}. Address1: "${sample.address1}", Address2: "${sample.address2}", Address3: "${sample.address3}"`);
    console.log(`   Postcode: "${sample.postcode}", County: "${sample.county}", UID: ${sample.uid}`);
  });
  
  // Check for any matches
  const lrUIDs = new Set(landRegistrySamples.map(s => s.uid));
  const epcUIDs = new Set(epcSamples.map(s => s.uid));
  
  const matches = [];
  for (const lrUID of lrUIDs) {
    if (epcUIDs.has(lrUID)) {
      matches.push(lrUID);
    }
  }
  
  console.log(`\n🎯 Matches found: ${matches.length} out of ${landRegistrySamples.length} (${(matches.length/landRegistrySamples.length*100).toFixed(1)}%)`);
  
  if (matches.length > 0) {
    console.log('\n✅ Matching UIDs:');
    matches.forEach(uid => console.log(`  - ${uid}`));
  } else {
    console.log('\n❌ No matches found. Let\'s try a more flexible matching approach...');
    
    // Try postcode-only matching
    const lrPostcodes = new Set(landRegistrySamples.map(s => s.postcode.replace(/\s+/g, '').toLowerCase()));
    const epcPostcodes = new Set(epcSamples.map(s => s.postcode.replace(/\s+/g, '').toLowerCase()));
    
    const postcodeMatches = Array.from(lrPostcodes).filter(p => epcPostcodes.has(p));
    console.log(`\n📮 Postcode matches: ${postcodeMatches.length}`, postcodeMatches.slice(0, 5));
    
    // Try street-only matching
    const lrStreets = new Set(landRegistrySamples.map(s => normalizeString(s.street)));
    const epcStreets = new Set(epcSamples.map(s => normalizeString(s.address1)));
    
    const streetMatches = Array.from(lrStreets).filter(s => epcStreets.has(s));
    console.log(`\n🏘️ Street matches: ${streetMatches.length}`, streetMatches.slice(0, 5));
  }
}

debugUIDMatching().catch(console.error); 