const fs = require('fs');
const fastcsv = require('fast-csv');
const path = require('path');

/**
 * Streaming CSV Data Cleaning for UID Matching
 * Processes large CSV files in chunks to avoid memory issues
 */

// Common UK address variations and their standardizations
const ADDRESS_STANDARDIZATIONS = {
  'STREET': 'STREET', 'ST': 'STREET', 'STR': 'STREET',
  'ROAD': 'ROAD', 'RD': 'ROAD',
  'AVENUE': 'AVENUE', 'AVE': 'AVENUE', 'AV': 'AVENUE',
  'LANE': 'LANE', 'LN': 'LANE',
  'DRIVE': 'DRIVE', 'DR': 'DRIVE',
  'CLOSE': 'CLOSE', 'CL': 'CLOSE',
  'CRESCENT': 'CRESCENT', 'CRES': 'CRESCENT',
  'CIRCUS': 'CIRCUS', 'CIR': 'CIRCUS',
  'PLACE': 'PLACE', 'PL': 'PLACE',
  'SQUARE': 'SQUARE', 'SQ': 'SQUARE',
  'TERRACE': 'TERRACE', 'TER': 'TERRACE',
  'WAY': 'WAY', 'WALK': 'WALK',
  'GARDENS': 'GARDENS', 'GARDEN': 'GARDEN', 'GDNS': 'GARDENS',
  'COURT': 'COURT', 'CT': 'COURT',
  'MANSIONS': 'MANSIONS', 'MANSION': 'MANSION',
  'BUILDINGS': 'BUILDINGS', 'BUILDING': 'BUILDING', 'BDS': 'BUILDINGS',
  'FLATS': 'FLATS', 'FLAT': 'FLAT',
  'APARTMENTS': 'APARTMENTS', 'APARTMENT': 'APARTMENT', 'APTS': 'APARTMENTS', 'APT': 'APARTMENT'
};

function cleanString(input) {
  if (!input) return '';
  return input.toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function standardizeStreetName(street) {
  if (!street) return '';
  let cleaned = cleanString(street);
  const words = cleaned.split(' ');
  const standardized = words.map(word => {
    return ADDRESS_STANDARDIZATIONS[word] || word;
  });
  return standardized.join(' ');
}

function standardizeHouseNumber(number) {
  if (!number) return '';
  return cleanString(number);
}

function standardizePostcode(postcode) {
  if (!postcode) return '';
  return cleanString(postcode).replace(/\s+/g, '');
}

function generateCleanUID(houseNumber, streetName, postcode) {
  const cleanNumber = standardizeHouseNumber(houseNumber);
  const cleanStreet = standardizeStreetName(streetName);
  const cleanPostcode = standardizePostcode(postcode);
  return `${cleanNumber} ${cleanStreet} ${cleanPostcode}`.toUpperCase();
}

async function cleanPropertiesCSVStreaming(inputPath, outputPath) {
  console.log(`🧹 Cleaning Properties CSV (Streaming): ${inputPath}`);
  
  return new Promise((resolve, reject) => {
    let processed = 0;
    const outputStream = fs.createWriteStream(outputPath);
    const csvStream = fastcsv.format();
    csvStream.pipe(outputStream);
    
    fs.createReadStream(inputPath)
      .pipe(fastcsv.parse({ headers: false }))
      .on('data', (row) => {
        // Properties CSV: [0]=GUID, [3]=Postcode, [8]=Number, [9]=Street
        const originalRow = [...row];
        
        // Clean address components
        const cleanPostcode = standardizePostcode(row[3]);
        const cleanNumber = standardizeHouseNumber(row[8]);
        const cleanStreet = standardizeStreetName(row[9]);
        const cleanUID = generateCleanUID(cleanNumber, cleanStreet, cleanPostcode);
        
        // Add cleaned fields
        const enhancedRow = [
          ...originalRow,
          cleanUID,
          cleanNumber,
          cleanStreet,
          cleanPostcode
        ];
        
        csvStream.write(enhancedRow);
        processed++;
        
        if (processed % 100000 === 0) {
          console.log(`  Processed ${processed.toLocaleString()} properties`);
        }
      })
      .on('end', () => {
        csvStream.end();
        console.log(`✅ Cleaned ${processed.toLocaleString()} properties`);
        resolve(processed);
      })
      .on('error', reject);
  });
}

async function cleanEPCCSVStreaming(inputPath, outputPath) {
  console.log(`🏠 Cleaning EPC CSV (Streaming): ${inputPath}`);
  
  return new Promise((resolve, reject) => {
    let processed = 0;
    let headers = null;
    const outputStream = fs.createWriteStream(outputPath);
    const csvStream = fastcsv.format({ headers: true });
    csvStream.pipe(outputStream);
    
    fs.createReadStream(inputPath)
      .pipe(fastcsv.parse({ headers: true }))
      .on('data', (row) => {
        if (!headers) {
          headers = Object.keys(row);
        }
        
        // Extract and clean address components
        const address = row['ADDRESS1'] || row['ADDRESS'] || '';
        const postcode = row['POSTCODE'] || '';
        
        const addressParts = parseEPCAddress(address);
        const cleanNumber = standardizeHouseNumber(addressParts.number);
        const cleanStreet = standardizeStreetName(addressParts.street);
        const cleanPostcode = standardizePostcode(postcode);
        const cleanUID = generateCleanUID(cleanNumber, cleanStreet, cleanPostcode);
        
        // Add cleaned fields
        const enhancedRow = {
          ...row,
          CLEAN_UID: cleanUID,
          CLEAN_NUMBER: cleanNumber,
          CLEAN_STREET: cleanStreet,
          CLEAN_POSTCODE: cleanPostcode
        };
        
        csvStream.write(enhancedRow);
        processed++;
        
        if (processed % 10000 === 0) {
          console.log(`  Processed ${processed.toLocaleString()} EPC records`);
        }
      })
      .on('end', () => {
        csvStream.end();
        console.log(`✅ Cleaned ${processed.toLocaleString()} EPC records`);
        resolve(processed);
      })
      .on('error', reject);
  });
}

function parseEPCAddress(address) {
  if (!address) return { number: '', street: '' };
  
  const cleaned = cleanString(address);
  
  // Try to extract house number from start
  const numberMatch = cleaned.match(/^(\d+[A-Z]?|[A-Z]+\s*\d+)/);
  if (numberMatch) {
    const number = numberMatch[1];
    const street = cleaned.substring(numberMatch[0].length).trim();
    return { number, street };
  }
  
  return { number: '', street: cleaned };
}

async function cleanAllCSVDataStreaming() {
  console.log('🚀 Starting streaming CSV data cleaning for UID matching...\n');
  
  try {
    // Create output directory
    const outputDir = 'data/cleaned';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const results = {};
    
    // Clean Properties data (streaming)
    if (fs.existsSync('pp-complete-cleaned.csv')) {
      results.properties = await cleanPropertiesCSVStreaming(
        'pp-complete-cleaned.csv',
        `${outputDir}/properties-cleaned-uid.csv`
      );
    }
    
    // Clean EPC data (streaming)
    if (fs.existsSync('data/epc-certificates-combined.csv')) {
      results.epc = await cleanEPCCSVStreaming(
        'data/epc-certificates-combined.csv',
        `${outputDir}/epc-cleaned-uid.csv`
      );
    }
    
    console.log('\n📊 Cleaning Results:');
    Object.entries(results).forEach(([dataset, count]) => {
      console.log(`  ${dataset.toUpperCase()}: ${count.toLocaleString()} records`);
    });
    
    console.log('\n✅ All CSV data cleaned successfully!');
    console.log('📁 Cleaned files saved to: data/cleaned/');
    
    return results;
    
  } catch (error) {
    console.error('❌ Error cleaning CSV data:', error);
    throw error;
  }
}

// Test the cleaning functions
function testCleaningFunctions() {
  console.log('🧪 Testing Data Cleaning Functions\n');
  
  const testCases = [
    {
      name: 'Standard Address',
      input: { number: '21', street: 'Main St', postcode: 'NE5 2PR' },
      expected: { number: '21', street: 'MAIN STREET', postcode: 'NE52PR' }
    },
    {
      name: 'Flat Address',
      input: { number: 'Flat 2A', street: 'High Rd', postcode: 'M1 1AA' },
      expected: { number: 'FLAT 2A', street: 'HIGH ROAD', postcode: 'M11AA' }
    },
    {
      name: 'Complex Address',
      input: { number: 'The Old Post Office', street: 'Church Ln', postcode: 'BS1 1AA' },
      expected: { number: 'THE OLD POST OFFICE', street: 'CHURCH LANE', postcode: 'BS11AA' }
    }
  ];
  
  testCases.forEach((testCase, index) => {
    const cleanNumber = standardizeHouseNumber(testCase.input.number);
    const cleanStreet = standardizeStreetName(testCase.input.street);
    const cleanPostcode = standardizePostcode(testCase.input.postcode);
    const cleanUID = generateCleanUID(cleanNumber, cleanStreet, cleanPostcode);
    
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`  Input: ${testCase.input.number} ${testCase.input.street}, ${testCase.input.postcode}`);
    console.log(`  Cleaned: ${cleanNumber} ${cleanStreet}, ${cleanPostcode}`);
    console.log(`  UID: ${cleanUID}\n`);
  });
}

// Run the cleaning process
if (require.main === module) {
  testCleaningFunctions();
  
  cleanAllCSVDataStreaming()
    .then((results) => {
      console.log('\n🎉 CSV cleaning completed successfully!');
      console.log('Next step: Run the UID enhancement script with cleaned data');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ CSV cleaning failed:', error);
      process.exit(1);
    });
}

module.exports = {
  cleanString,
  standardizeStreetName,
  standardizeHouseNumber,
  standardizePostcode,
  generateCleanUID,
  cleanAllCSVDataStreaming
}; 