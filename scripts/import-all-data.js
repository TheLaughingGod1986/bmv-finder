const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Elasticsearch client with proper headers for v8/v9 compatibility
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000,
  maxRetries: 3,
  retryOnTimeout: true
});

// Helper functions to bypass strict typing
async function flexibleIndices() {
  return esClient.indices;
}

async function flexibleBulk() {
  return esClient.bulk;
}

async function flexibleSearch() {
  return esClient.search;
}

async function flexibleCount() {
  return esClient.count;
}

// Helper function to find the latest cleaned data file
function findLatestCleanedFile(pattern) {
  const cleanedDir = path.join(__dirname, '../data/cleaned-datasets');
  if (!fs.existsSync(cleanedDir)) {
    throw new Error(`Cleaned datasets directory not found: ${cleanedDir}`);
  }
  
  const files = fs.readdirSync(cleanedDir)
    .filter(file => file.includes(pattern))
    .map(file => ({
      name: file,
      path: path.join(cleanedDir, file),
      time: fs.statSync(path.join(cleanedDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  if (files.length === 0) {
    throw new Error(`No cleaned ${pattern} files found in ${cleanedDir}`);
  }
  
  console.log(`📁 Using latest ${pattern} file: ${files[0].name}`);
  return files[0].path;
}

// Index configurations
const INDICES = {
  HPI: {
    name: 'house_price_index',
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        region: { type: 'keyword' },
        regionLabel: { type: 'text' },
        date: { type: 'date', format: 'yyyy-MM-dd' },
        year: { type: 'integer' },
        month: { type: 'integer' },
        hpiIndex: { type: 'float' },
        averagePrice: { type: 'float' },
        percentageChangeYearly: { type: 'float' },
        percentageChangeMonthly: { type: 'float' },
        salesVolume: { type: 'integer' },
        propertyType: { type: 'keyword' },
        buyerType: { type: 'keyword' },
        purchaseType: { type: 'keyword' },
        buildType: { type: 'keyword' },
        // Additional detailed data
        detachedPrice: { type: 'float' },
        detachedIndex: { type: 'float' },
        semiDetachedPrice: { type: 'float' },
        semiDetachedIndex: { type: 'float' },
        terracedPrice: { type: 'float' },
        terracedIndex: { type: 'float' },
        flatPrice: { type: 'float' },
        flatIndex: { type: 'float' },
        cashPrice: { type: 'float' },
        mortgagePrice: { type: 'float' },
        ftbPrice: { type: 'float' },
        newPrice: { type: 'float' },
        oldPrice: { type: 'float' }
      }
    }
  },
  PROPERTY_SALES: {
    name: 'recent_sales',
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        postcode: { type: 'keyword' },
        address: { type: 'text' },
        house_number: { type: 'keyword' },
        street: { type: 'text' },
        town: { type: 'keyword' },
        county: { type: 'keyword' },
        property_type: { type: 'keyword' },
        tenure: { type: 'keyword' },
        price: { type: 'float' },
        date_of_transfer: { type: 'date' },
        new_build: { type: 'keyword' },
        estate_type: { type: 'keyword' },
        transaction_category: { type: 'keyword' },
        primary_addressable_object_name: { type: 'keyword' },
        secondary_addressable_object_name: { type: 'keyword' },
        street_description: { type: 'text' },
        locality: { type: 'keyword' },
        town_city: { type: 'keyword' },
        district: { type: 'keyword' },
        transaction_id: { type: 'keyword' },
        entry_date: { type: 'date' },
        status: { type: 'keyword' }
      }
    }
  },
  RENTAL_PRICES: {
    name: 'rental_prices',
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        region: { type: 'keyword' },
        region_code: { type: 'keyword' },
        property_type: { type: 'keyword' },
        bedrooms: { type: 'integer' },
        monthly_rent: { type: 'float' },
        annual_rent: { type: 'float' },
        date_updated: { type: 'date', format: 'yyyy-MM' },
        source: { type: 'keyword' }
      }
    }
  },
  EPC_DATA: {
    name: 'epc_data',
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        postcode: { type: 'keyword' },
        address: { type: 'text' },
        house_number: { type: 'keyword' },
        street: { type: 'text' },
        town: { type: 'keyword' },
        county: { type: 'keyword' },
        property_type: { type: 'keyword' },
        current_energy_rating: { type: 'keyword' },
        potential_energy_rating: { type: 'keyword' },
        current_energy_efficiency: { type: 'integer' },
        potential_energy_efficiency: { type: 'integer' },
        environmental_impact_co2: { type: 'float' },
        energy_consumption_current: { type: 'integer' },
        energy_consumption_potential: { type: 'integer' },
        environmental_impact_current: { type: 'float' },
        environmental_impact_potential: { type: 'float' },
        date_updated: { type: 'date', format: 'yyyy-MM' },
        source: { type: 'keyword' }
      }
    }
  }
};

// Create index if it doesn't exist
async function createIndex(indexConfig) {
  try {
    console.log(`Creating index '${indexConfig.name}'...`);
    
    await esClient.indices.create({
      index: indexConfig.name,
      body: {
        settings: indexConfig.settings,
        mappings: indexConfig.mappings
      }
    });

    console.log(`Index '${indexConfig.name}' created successfully!`);
  } catch (error) {
    if (error.meta && error.meta.statusCode === 400 && error.message.includes('resource_already_exists_exception')) {
      console.log(`Index '${indexConfig.name}' already exists. Skipping creation.`);
      return;
    }
    console.error(`Error creating index '${indexConfig.name}':`, error);
    throw error;
  }
}

// Parse CSV line with proper handling of quoted fields
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current.trim());
  return fields;
}

// Parse HPI data line
function parseHPILine(line, lineNumber) {
  if (!line || line.trim() === '') return null;
  
  // Use proper CSV parsing for quoted fields
  const values = parseCSVLine(line);
  if (values.length < 27) return null; // Updated to expect 27 fields

  const [region, regionLabel, date, year, month, hpiIndex, averagePrice, percentageChangeYearly, percentageChangeMonthly, salesVolume, propertyType, buyerType, purchaseType, buildType, detachedPrice, detachedIndex, semiDetachedPrice, semiDetachedIndex, terracedPrice, terracedIndex, flatPrice, flatIndex, cashPrice, mortgagePrice, ftbPrice, newPrice, oldPrice] = values;
  
  if (!region || !date || !hpiIndex) return null;
  
  const hpiValue = parseFloat(hpiIndex);
  const avgPrice = parseFloat(averagePrice);
  const yearlyChange = parseFloat(percentageChangeYearly) || 0;
  const monthlyChange = parseFloat(percentageChangeMonthly) || 0;
  const salesVol = parseInt(salesVolume) || 0;
  
  if (isNaN(hpiValue) || isNaN(avgPrice)) return null;
  
  return {
    id: `${region}_${date}_${lineNumber}`,
    region,
    regionLabel,
    date,
    year: parseInt(year),
    month: parseInt(month),
    hpiIndex: hpiValue,
    averagePrice: avgPrice,
    percentageChangeYearly: yearlyChange,
    percentageChangeMonthly: monthlyChange,
    salesVolume: salesVol,
    propertyType: propertyType || 'All',
    buyerType: buyerType || 'All',
    purchaseType: purchaseType || 'All',
    buildType: buildType || 'All',
    // Additional detailed data
    detachedPrice: parseFloat(detachedPrice) || 0,
    detachedIndex: parseFloat(detachedIndex) || 0,
    semiDetachedPrice: parseFloat(semiDetachedPrice) || 0,
    semiDetachedIndex: parseFloat(semiDetachedIndex) || 0,
    terracedPrice: parseFloat(terracedPrice) || 0,
    terracedIndex: parseFloat(terracedIndex) || 0,
    flatPrice: parseFloat(flatPrice) || 0,
    flatIndex: parseFloat(flatIndex) || 0,
    cashPrice: parseFloat(cashPrice) || 0,
    mortgagePrice: parseFloat(mortgagePrice) || 0,
    ftbPrice: parseFloat(ftbPrice) || 0,
    newPrice: parseFloat(newPrice) || 0,
    oldPrice: parseFloat(oldPrice) || 0
  };
}

// Parse property sales line
function parsePropertySalesLine(line, lineNumber) {
  if (!line || line.trim() === '') return null;
  
  // Use proper CSV parsing for quoted fields
  const values = parseCSVLine(line);
  if (values.length < 23) return null; // Updated to expect 23 fields

  const [id, postcode, address, house_number, street, town, county, property_type, tenure, price, date_of_transfer, new_build, estate_type, transaction_category, primary_addressable_object_name, secondary_addressable_object_name, street_description, locality, town_city, district, transaction_id, entry_date, status] = values;
  
  if (!postcode || !price || !date_of_transfer) return null;
  
  const priceValue = parseFloat(price);
  if (isNaN(priceValue)) return null;
  
  return {
    id: id || `sale_${lineNumber}`,
    postcode,
    address,
    house_number,
    street,
    town,
    county,
    property_type,
    tenure,
    price: priceValue,
    date_of_transfer,
    new_build,
    estate_type,
    transaction_category,
    primary_addressable_object_name,
    secondary_addressable_object_name,
    street_description,
    locality,
    town_city,
    district,
    transaction_id,
    entry_date,
    status
  };
}

// Parse rental prices line
function parseRentalLine(line, lineNumber) {
  if (!line || line.trim() === '') return null;
  
  const values = line.split(',');
  if (values.length < 8) return null;

  const [region, region_code, property_type, bedrooms, monthly_rent, annual_rent, date_updated, source] = values;
  
  if (!region || !monthly_rent) return null;
  
  const monthlyRent = parseFloat(monthly_rent);
  const annualRent = parseFloat(annual_rent);
  const bedroomCount = parseInt(bedrooms);
  
  if (isNaN(monthlyRent) || isNaN(annualRent)) return null;
  
  return {
    id: `rental_${lineNumber}`,
    region,
    region_code,
    property_type,
    bedrooms: bedroomCount,
    monthly_rent: monthlyRent,
    annual_rent: annualRent,
    date_updated,
    source: source || 'ONS'
  };
}

// Parse EPC data line
function parseEPCLine(line, lineNumber) {
  if (!line || line.trim() === '') return null;
  
  const values = line.split(',');
  if (values.length < 20) return null;

  const [id, postcode, address, house_number, street, town, county, property_type, current_energy_rating, potential_energy_rating, current_energy_efficiency, potential_energy_efficiency, environmental_impact_co2, energy_consumption_current, energy_consumption_potential, environmental_impact_current, environmental_impact_potential, date_updated, source] = values;
  
  if (!postcode || !current_energy_rating) return null;
  
  const currentEfficiency = parseInt(current_energy_efficiency);
  const potentialEfficiency = parseInt(potential_energy_efficiency);
  const currentConsumption = parseInt(energy_consumption_current);
  const potentialConsumption = parseInt(energy_consumption_potential);
  
  if (isNaN(currentEfficiency) || isNaN(currentConsumption)) return null;
  
  return {
    id: id || `epc_${lineNumber}`,
    postcode,
    address,
    house_number,
    street,
    town,
    county,
    property_type,
    current_energy_rating,
    potential_energy_rating,
    current_energy_efficiency: currentEfficiency,
    potential_energy_efficiency: potentialEfficiency,
    environmental_impact_co2: parseFloat(environmental_impact_co2) || 0,
    energy_consumption_current: currentConsumption,
    energy_consumption_potential: potentialConsumption,
    environmental_impact_current: parseFloat(environmental_impact_current) || 0,
    environmental_impact_potential: parseFloat(environmental_impact_potential) || 0,
    date_updated,
    source: source || 'EPC Register'
  };
}

// Index batch of documents
async function indexBatch(documents, indexName) {
  if (documents.length === 0) return 0;
  
  const bulkBody = documents.flatMap(doc => [
    { index: { _index: indexName } },
    doc
  ]);
  
  try {
    const response = await esClient.bulk({ body: bulkBody });
    
    if (response.errors) {
      const errors = response.items.filter(item => item.index.error);
      console.error(`Bulk indexing errors for ${indexName}:`, errors.length);
    }
    
    return documents.length;
  } catch (error) {
    console.error(`Error indexing batch to ${indexName}:`, error);
    throw error;
  }
}

// Import HPI data
async function importHPIData() {
  return new Promise(async (resolve, reject) => {
    console.log('Importing HPI data...');
    
    const documents = [];
    let lineCount = 0;
    let isFirstLine = true;
    
    try {
      const hpiFile = findLatestCleanedFile('uk-hpi-cleaned');
      const rl = readline.createInterface({
        input: fs.createReadStream(hpiFile),
        crlfDelay: Infinity
      });
      
      rl.on('line', (line) => {
        lineCount++;
        
        if (isFirstLine) {
          isFirstLine = false;
          return;
        }
        
        try {
          const record = parseHPILine(line, lineCount);
          if (record) {
            documents.push(record);
          }
        } catch (error) {
          console.error(`Error processing HPI line ${lineCount}:`, error.message);
        }
      });
      
      rl.on('close', async () => {
        try {
          if (documents.length > 0) {
            const indexedCount = await indexBatch(documents, INDICES.HPI.name);
            console.log(`  ✅ HPI data imported: ${indexedCount.toLocaleString()} records`);
            resolve(indexedCount);
          } else {
            console.log('  ⚠️  No HPI records to import');
            resolve(0);
          }
        } catch (error) {
          reject(error);
        }
      });
      
      rl.on('error', (error) => {
        console.error('Error reading HPI CSV:', error);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Import Price Paid data
async function importPricePaidData() {
  return new Promise(async (resolve, reject) => {
    console.log('Importing Price Paid data...');
    
    const documents = [];
    let lineCount = 0;
    let isFirstLine = true;
    
    try {
      const propertySalesFile = findLatestCleanedFile('price-paid-cleaned');
      const rl = readline.createInterface({
        input: fs.createReadStream(propertySalesFile), // Use real Price Paid data
        crlfDelay: Infinity
      });
      
      rl.on('line', (line) => {
        lineCount++;
        
        if (isFirstLine) {
          isFirstLine = false;
          return;
        }
        
        try {
          const record = parsePropertySalesLine(line, lineCount);
          if (record) {
            documents.push(record);
          }
        } catch (error) {
          console.error(`Error processing property sales line ${lineCount}:`, error.message);
        }
      });
      
      rl.on('close', async () => {
        try {
          if (documents.length > 0) {
            const indexedCount = await indexBatch(documents, INDICES.PROPERTY_SALES.name);
            console.log(`  ✅ Property sales data imported: ${indexedCount.toLocaleString()} records`);
            resolve(indexedCount);
          } else {
            console.log('  ⚠️  No property sales records to import');
            resolve(0);
          }
        } catch (error) {
          reject(error);
        }
      });
      
      rl.on('error', (error) => {
        console.error('Error reading property sales CSV:', error);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Import rental prices data
async function importRentalData() {
  return new Promise(async (resolve, reject) => {
    console.log('Importing rental prices data...');
    
    const documents = [];
    let lineCount = 0;
    let isFirstLine = true;
    
    try {
      const rl = readline.createInterface({
        input: fs.createReadStream('data/rental-prices.csv'),
        crlfDelay: Infinity
      });
      
      rl.on('line', (line) => {
        lineCount++;
        
        if (isFirstLine) {
          isFirstLine = false;
          return;
        }
        
        try {
          const record = parseRentalLine(line, lineCount);
          if (record) {
            documents.push(record);
          }
        } catch (error) {
          console.error(`Error processing rental line ${lineCount}:`, error.message);
        }
      });
      
      rl.on('close', async () => {
        try {
          if (documents.length > 0) {
            const indexedCount = await indexBatch(documents, INDICES.RENTAL_PRICES.name);
            console.log(`  ✅ Rental prices data imported: ${indexedCount.toLocaleString()} records`);
            resolve(indexedCount);
          } else {
            console.log('  ⚠️  No rental records to import');
            resolve(0);
          }
        } catch (error) {
          reject(error);
        }
      });
      
      rl.on('error', (error) => {
        console.error('Error reading rental prices CSV:', error);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Import EPC data
async function importEPCData() {
  return new Promise(async (resolve, reject) => {
    console.log('Importing EPC data...');
    
    const documents = [];
    let lineCount = 0;
    let isFirstLine = true;
    
    try {
      const rl = readline.createInterface({
        input: fs.createReadStream('data/epc-data.csv'),
        crlfDelay: Infinity
      });
      
      rl.on('line', (line) => {
        lineCount++;
        
        if (isFirstLine) {
          isFirstLine = false;
          return;
        }
        
        try {
          const record = parseEPCLine(line, lineCount);
          if (record) {
            documents.push(record);
          }
        } catch (error) {
          console.error(`Error processing EPC line ${lineCount}:`, error.message);
        }
      });
      
      rl.on('close', async () => {
        try {
          if (documents.length > 0) {
            const indexedCount = await indexBatch(documents, INDICES.EPC_DATA.name);
            console.log(`  ✅ EPC data imported: ${indexedCount.toLocaleString()} records`);
            resolve(indexedCount);
          } else {
            console.log('  ⚠️  No EPC records to import');
            resolve(0);
          }
        } catch (error) {
          reject(error);
        }
      });
      
      rl.on('error', (error) => {
        console.error('Error reading EPC CSV:', error);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Main import function
async function importAllData() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting comprehensive data import...\n');
    
    // Create all indices
    for (const [key, indexConfig] of Object.entries(INDICES)) {
      await createIndex(indexConfig);
    }
    
    console.log('\n📊 Starting data import...\n');
    
    // Import all data
    const hpiCount = await importHPIData();
    const pricePaidCount = await importPricePaidData();
    const rentalCount = await importRentalData();
    const epcCount = await importEPCData();
    
    // Refresh all indices
    for (const [key, indexConfig] of Object.entries(INDICES)) {
      await esClient.indices.refresh({ index: indexConfig.name });
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    const totalRecords = hpiCount + pricePaidCount + rentalCount + epcCount;
    
    console.log('\n🎉 Data import completed successfully!');
    console.log(`📊 Total records imported: ${totalRecords.toLocaleString()}`);
    console.log(`  • HPI data: ${hpiCount.toLocaleString()}`);
    console.log(`  • Price Paid data: ${pricePaidCount.toLocaleString()}`);
    console.log(`  • Rental prices: ${rentalCount.toLocaleString()}`);
    console.log(`  • EPC data: ${epcCount.toLocaleString()}`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
    console.log('\n✅ All indices refreshed and ready for search!');
    
  } catch (error) {
    console.error('❌ Error during data import:', error);
    throw error;
  }
}

// Run the import
importAllData().catch(console.error);
