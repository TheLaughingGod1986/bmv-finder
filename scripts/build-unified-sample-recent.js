const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const SAMPLE_SIZE = 500;
const OUTPUT_FILE = 'data/unified-sample-recent.csv';

const PROPERTIES_FILE = 'data/cleaned/properties-cleaned-uid.csv';
const EPC_FILE = 'data/cleaned/epc-cleaned-uid.csv';
const HPI_FILE = 'data/hpi-regions.csv';

console.log('🚀 Building unified CSV sample with recent properties (500 properties)');

async function loadEPCData() {
  const epcData = new Map();
  return new Promise((resolve, reject) => {
    fs.createReadStream(EPC_FILE)
      .pipe(csv())
      .on('data', (row) => {
        const uid = row.CLEAN_UID;
        if (uid && uid !== '') {
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
            flat_storey_count: row.FLAT_STOREY_COUNT,
            energy_consumption: row.ENERGY_CONSUMPTION_CURRENT,
            co2_emissions: row.CO2_EMISSIONS_CURRENT,
            heating_cost: row.HEATING_COST_CURRENT,
            lighting_cost: row.LIGHTING_COST_CURRENT,
            hot_water_cost: row.HOT_WATER_COST_CURRENT
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
  
  console.log('📖 Processing recent properties...');
  const properties = [];
  let count = 0;
  let epcMatches = 0;
  let hpiMatches = 0;

  return new Promise((resolve, reject) => {
    const rl = require('readline').createInterface({
      input: fs.createReadStream(PROPERTIES_FILE),
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      if (count >= SAMPLE_SIZE) {
        rl.close();
        return;
      }
      
      // Parse CSV line manually since there are no headers
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      
      // Get UID from the cleaned data (last few columns)
      const uid = values[values.length - 4]; // CLEAN_UID column
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
        energy_consumption: epc.energy_consumption,
        co2_emissions: epc.co2_emissions,
        heating_cost: epc.heating_cost,
        lighting_cost: epc.lighting_cost,
        hot_water_cost: epc.hot_water_cost,
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

async function main() {
  try {
    const properties = await buildUnifiedSample();
    await writeUnifiedCSV(properties);
    console.log('🎉 Done!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main(); 