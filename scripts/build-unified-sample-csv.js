const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const SAMPLE_SIZE = 500;
const OUTPUT_FILE = 'data/unified-sample.csv';

const LAND_REGISTRY_FILE = 'pp-complete-cleaned.csv';
const EPC_FILE = 'data/epc-certificates-combined.csv';
const HPI_FILE = 'data/hpi-regions.csv';

console.log('🚀 Building unified CSV sample (500 properties)');

function generatePropertyUID(row) {
  // Based on the actual CSV structure: transactionId,price,date,postcode,propertyType,newBuild,duration,paon,saon,street,locality,town,district,county,transactionCategory,recordStatus
  const number = (row[7] || '').toString().toLowerCase().trim(); // paon is at index 7
  const street = (row[9] || '').toLowerCase().trim(); // street is at index 9
  const postcode = (row[3] || '').toLowerCase().trim(); // postcode is at index 3
  
  const cleanNumber = number.replace(/[^a-z0-9]/g, '');
  const cleanStreet = street.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const cleanPostcode = postcode.replace(/\s+/g, '').toLowerCase();
  
  return `${cleanNumber}-${cleanStreet}-${cleanPostcode}`;
}

function generateEPCUID(row) {
  // EPC CSV has ADDRESS1, ADDRESS2, ADDRESS3, POSTCODE fields
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

async function loadEPCData() {
  const epcData = new Map();
  return new Promise((resolve, reject) => {
    fs.createReadStream(EPC_FILE)
      .pipe(csv())
      .on('data', (row) => {
        const uid = generateEPCUID(row);
        if (uid && uid !== '--') {
          epcData.set(uid, {
            bedrooms: row.NUMBER_HABITABLE_ROOMS,
            heated_rooms: row.NUMBER_HEATED_ROOMS,
            property_size: row.TOTAL_FLOOR_AREA,
            epc_rating: row.CURRENT_ENERGY_RATING,
            current_energy_rating: row.CURRENT_ENERGY_RATING,
            potential_energy_rating: row.POTENTIAL_ENERGY_RATING,
            construction_year: row.CONSTRUCTION_AGE_BAND,
            property_type: row.PROPERTY_TYPE,
            built_form: row.BUILT_FORM,
            inspection_date: row.INSPECTION_DATE,
            address: row.ADDRESS,
            unheated_corridor: row.UNHEATED_CORRIDOR_LENGTH,
            floor_level: row.FLOOR_LEVEL,
            flat_storey_count: row.FLAT_STOREY_COUNT
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded ${epcData.size.toLocaleString()} EPC records`);
        resolve(epcData);
      })
      .on('error', reject);
  });
}

async function loadHPIData() {
  const hpiData = new Map();
  return new Promise((resolve, reject) => {
    fs.createReadStream(HPI_FILE)
      .pipe(csv())
      .on('data', (row) => {
        const region = row.regionLabel?.toLowerCase().replace(/\s+/g, '-');
        if (region) {
          if (!hpiData.has(region)) hpiData.set(region, []);
          hpiData.get(region).push({
            date: row.date,
            hpiIndex: parseFloat(row.hpiIndex),
            regionLabel: row.regionLabel
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

async function buildUnifiedSample() {
  console.log('📖 Loading EPC and HPI data...');
  const epcData = await loadEPCData();
  const hpiData = await loadHPIData();
  
  console.log('📖 Processing Land Registry data...');
  const properties = [];
  let count = 0;
  let epcMatches = 0;
  let hpiMatches = 0;

  return new Promise((resolve, reject) => {
    const rl = require('readline').createInterface({
      input: fs.createReadStream(LAND_REGISTRY_FILE),
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      if (count >= SAMPLE_SIZE) {
        rl.close();
        return;
      }
      
      // Parse CSV line manually since there are no headers
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      
      // CSV structure: transactionId,price,date,postcode,propertyType,newBuild,duration,paon,saon,street,locality,town,district,county,transactionCategory,recordStatus
      const uid = generatePropertyUID(values);
      const epc = epcData.get(uid) || {};
      const region = values[13]?.toLowerCase().replace(/\s+/g, '-'); // county is at index 13
      const hpiList = hpiData.get(region) || [];
      const latestHPI = hpiList[hpiList.length - 1] || {};
      
      if (epc.bedrooms) epcMatches++;
      if (latestHPI.hpiIndex) hpiMatches++;
      
      properties.push({
        property_uid: uid,
        transaction_id: values[0],
        paon: values[7],
        saon: values[8],
        street: values[9],
        locality: values[10],
        town_city: values[11],
        district: values[12],
        county: values[13],
        postcode: values[3],
        property_type: values[4],
        price: values[1],
        date_of_transfer: values[2],
        new_build: values[5],
        duration: values[6],
        transaction_category: values[14],
        record_status: values[15],
        // EPC data
        bedrooms: epc.bedrooms,
        heated_rooms: epc.heated_rooms,
        property_size: epc.property_size,
        epc_rating: epc.epc_rating,
        current_energy_rating: epc.current_energy_rating,
        potential_energy_rating: epc.potential_energy_rating,
        construction_year: epc.construction_year,
        property_type_epc: epc.property_type,
        built_form: epc.built_form,
        inspection_date: epc.inspection_date,
        epc_address: epc.address,
        unheated_corridor: epc.unheated_corridor,
        floor_level: epc.floor_level,
        flat_storey_count: epc.flat_storey_count,
        // HPI data
        hpi_region: region,
        hpi_value: latestHPI.hpiIndex,
        hpi_date: latestHPI.date,
        hpi_region_label: latestHPI.regionLabel
      });
      
      count++;
      if (count % 100 === 0) {
        console.log(`  Processed ${count} properties...`);
      }
    });

    rl.on('close', () => {
      console.log(`✅ Processed ${properties.length} properties`);
      console.log(`📊 EPC matches: ${epcMatches} (${(epcMatches/properties.length*100).toFixed(1)}%)`);
      console.log(`📊 HPI matches: ${hpiMatches} (${(hpiMatches/properties.length*100).toFixed(1)}%)`);
      resolve(properties);
    });

    rl.on('error', reject);
  });
}

async function writeUnifiedCSV(records) {
  if (records.length === 0) {
    console.log('❌ No records to write!');
    return;
  }
  
  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_FILE,
    header: Object.keys(records[0]).map(key => ({ id: key, title: key }))
  });
  
  await csvWriter.writeRecords(records);
  console.log(`✅ Unified CSV written: ${OUTPUT_FILE} (${records.length} records)`);
}

(async () => {
  try {
    const records = await buildUnifiedSample();
    await writeUnifiedCSV(records);
    console.log('🎉 Done!');
  } catch (err) {
    console.error('❌ Error:', err);
  }
})(); 