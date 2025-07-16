const fs = require('fs');
const fastcsv = require('fast-csv');
const path = require('path');

/**
 * Comprehensive CSV Data Cleaning for UID Matching
 * This script standardizes address formats across Properties, HPI, and EPC datasets
 */

// Common UK address variations and their standardizations
const ADDRESS_STANDARDIZATIONS = {
  // Street type abbreviations
  'STREET': 'STREET',
  'ST': 'STREET',
  'STR': 'STREET',
  'ROAD': 'ROAD',
  'RD': 'ROAD',
  'AVENUE': 'AVENUE',
  'AVE': 'AVENUE',
  'AV': 'AVENUE',
  'LANE': 'LANE',
  'LN': 'LANE',
  'DRIVE': 'DRIVE',
  'DR': 'DRIVE',
  'CLOSE': 'CLOSE',
  'CL': 'CLOSE',
  'CRESCENT': 'CRESCENT',
  'CRES': 'CRESCENT',
  'CIRCUS': 'CIRCUS',
  'CIR': 'CIRCUS',
  'PLACE': 'PLACE',
  'PL': 'PLACE',
  'SQUARE': 'SQUARE',
  'SQ': 'SQUARE',
  'TERRACE': 'TERRACE',
  'TER': 'TERRACE',
  'WAY': 'WAY',
  'WALK': 'WALK',
  'GARDENS': 'GARDENS',
  'GARDEN': 'GARDEN',
  'GDNS': 'GARDENS',
  'COURT': 'COURT',
  'CT': 'COURT',
  'MANSIONS': 'MANSIONS',
  'MANSION': 'MANSION',
  'BUILDINGS': 'BUILDINGS',
  'BUILDING': 'BUILDING',
  'BDS': 'BUILDINGS',
  'FLATS': 'FLATS',
  'FLAT': 'FLAT',
  'APARTMENTS': 'APARTMENTS',
  'APARTMENT': 'APARTMENT',
  'APTS': 'APARTMENTS',
  'APT': 'APARTMENT'
};

// Common house number variations
const HOUSE_NUMBER_VARIATIONS = {
  'FLAT': 'FLAT',
  'FL': 'FLAT',
  'APARTMENT': 'APARTMENT',
  'APT': 'APARTMENT',
  'SUITE': 'SUITE',
  'STE': 'SUITE',
  'UNIT': 'UNIT',
  'BLOCK': 'BLOCK',
  'BLK': 'BLOCK'
};

function cleanString(input) {
  if (!input) return '';
  
  return input.toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Clean up multiple spaces again
    .trim();
}

function standardizeStreetName(street) {
  if (!street) return '';
  
  let cleaned = cleanString(street);
  
  // Split into words and standardize each
  const words = cleaned.split(' ');
  const standardized = words.map(word => {
    // Check if it's a known abbreviation
    if (ADDRESS_STANDARDIZATIONS[word]) {
      return ADDRESS_STANDARDIZATIONS[word];
    }
    return word;
  });
  
  return standardized.join(' ');
}

function standardizeHouseNumber(number) {
  if (!number) return '';
  
  let cleaned = cleanString(number);
  
  // Handle common variations
  Object.entries(HOUSE_NUMBER_VARIATIONS).forEach(([variation, standard]) => {
    const regex = new RegExp(`^${variation}\\s*`, 'i');
    cleaned = cleaned.replace(regex, standard + ' ');
  });
  
  return cleaned.trim();
}

function standardizePostcode(postcode) {
  if (!postcode) return '';
  
  return cleanString(postcode)
    .replace(/\s+/g, ''); // Remove all spaces
}

function generateCleanUID(houseNumber, streetName, postcode) {
  const cleanNumber = standardizeHouseNumber(houseNumber);
  const cleanStreet = standardizeStreetName(streetName);
  const cleanPostcode = standardizePostcode(postcode);
  
  return `${cleanNumber} ${cleanStreet} ${cleanPostcode}`.toUpperCase();
}

async function cleanPropertiesCSV(inputPath, outputPath) {
  console.log(`🧹 Cleaning Properties CSV: ${inputPath}`);
  
  return new Promise((resolve, reject) => {
    const cleanedRows = [];
    let processed = 0;
    
    fs.createReadStream(inputPath)
      .pipe(fastcsv.parse({ headers: false }))
      .on('data', (row) => {
        // Properties CSV columns: [0]=GUID, [3]=Postcode, [8]=Number, [9]=Street
        const originalRow = [...row];
        
        // Clean address components
        const cleanPostcode = standardizePostcode(row[3]);
        const cleanNumber = standardizeHouseNumber(row[8]);
        const cleanStreet = standardizeStreetName(row[9]);
        
        // Generate clean UID
        const cleanUID = generateCleanUID(cleanNumber, cleanStreet, cleanPostcode);
        
        // Add cleaned fields to the row
        const enhancedRow = [
          ...originalRow,
          cleanUID,
          cleanNumber,
          cleanStreet,
          cleanPostcode
        ];
        
        cleanedRows.push(enhancedRow);
        processed++;
        
        if (processed % 100000 === 0) {
          console.log(`  Processed ${processed.toLocaleString()} properties`);
        }
      })
      .on('end', () => {
        // Write cleaned data
        const outputStream = fs.createWriteStream(outputPath);
        const csvStream = fastcsv.format();
        csvStream.pipe(outputStream);
        
        cleanedRows.forEach(row => csvStream.write(row));
        csvStream.end();
        
        console.log(`✅ Cleaned ${processed.toLocaleString()} properties`);
        resolve(processed);
      })
      .on('error', reject);
  });
}

async function cleanEPCCSV(inputPath, outputPath) {
  console.log(`🏠 Cleaning EPC CSV: ${inputPath}`);
  
  return new Promise((resolve, reject) => {
    const cleanedRows = [];
    let processed = 0;
    let headers = null;
    
    fs.createReadStream(inputPath)
      .pipe(fastcsv.parse({ headers: true }))
      .on('data', (row) => {
        if (!headers) {
          headers = Object.keys(row);
        }
        
        // Extract address components from EPC data
        const address = row['ADDRESS1'] || row['ADDRESS'] || '';
        const postcode = row['POSTCODE'] || '';
        
        // Parse address to extract number and street
        const addressParts = parseEPCAddress(address);
        const cleanNumber = standardizeHouseNumber(addressParts.number);
        const cleanStreet = standardizeStreetName(addressParts.street);
        const cleanPostcode = standardizePostcode(postcode);
        
        // Generate clean UID
        const cleanUID = generateCleanUID(cleanNumber, cleanStreet, cleanPostcode);
        
        // Add cleaned fields
        const enhancedRow = {
          ...row,
          CLEAN_UID: cleanUID,
          CLEAN_NUMBER: cleanNumber,
          CLEAN_STREET: cleanStreet,
          CLEAN_POSTCODE: cleanPostcode
        };
        
        cleanedRows.push(enhancedRow);
        processed++;
        
        if (processed % 10000 === 0) {
          console.log(`  Processed ${processed.toLocaleString()} EPC records`);
        }
      })
      .on('end', () => {
        // Write cleaned data
        const outputStream = fs.createWriteStream(outputPath);
        const csvStream = fastcsv.format({ headers: true });
        csvStream.pipe(outputStream);
        
        cleanedRows.forEach(row => csvStream.write(row));
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
  
  // Try to extract house number from start of address
  const numberMatch = cleaned.match(/^(\d+[A-Z]?|[A-Z]+\s*\d+)/);
  if (numberMatch) {
    const number = numberMatch[1];
    const street = cleaned.substring(numberMatch[0].length).trim();
    return { number, street };
  }
  
  // If no number found, treat whole address as street
  return { number: '', street: cleaned };
}

async function cleanHPICSV(inputPath, outputPath) {
  console.log(`📊 Cleaning HPI CSV: ${inputPath}`);
  
  return new Promise((resolve, reject) => {
    const cleanedRows = [];
    let processed = 0;
    let headers = null;
    
    fs.createReadStream(inputPath)
      .pipe(fastcsv.parse({ headers: true }))
      .on('data', (row) => {
        if (!headers) {
          headers = Object.keys(row);
        }
        
        // HPI data is already quite clean, but standardize region names
        const region = cleanString(row['REGION'] || row['region'] || '');
        const regionLabel = cleanString(row['REGION_LABEL'] || row['regionLabel'] || '');
        
        const enhancedRow = {
          ...row,
          CLEAN_REGION: region,
          CLEAN_REGION_LABEL: regionLabel
        };
        
        cleanedRows.push(enhancedRow);
        processed++;
        
        if (processed % 1000 === 0) {
          console.log(`  Processed ${processed.toLocaleString()} HPI records`);
        }
      })
      .on('end', () => {
        // Write cleaned data
        const outputStream = fs.createWriteStream(outputPath);
        const csvStream = fastcsv.format({ headers: true });
        csvStream.pipe(outputStream);
        
        cleanedRows.forEach(row => csvStream.write(row));
        csvStream.end();
        
        console.log(`✅ Cleaned ${processed.toLocaleString()} HPI records`);
        resolve(processed);
      })
      .on('error', reject);
  });
}

async function cleanAllCSVData() {
  console.log('🚀 Starting comprehensive CSV data cleaning for UID matching...\n');
  
  try {
    // Create output directory
    const outputDir = 'data/cleaned';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Clean each dataset
    const results = {};
    
    // Properties data
    if (fs.existsSync('pp-complete-cleaned.csv')) {
      results.properties = await cleanPropertiesCSV(
        'pp-complete-cleaned.csv',
        `${outputDir}/properties-cleaned-uid.csv`
      );
    }
    
    // EPC data
    if (fs.existsSync('data/epc-certificates-combined.csv')) {
      results.epc = await cleanEPCCSV(
        'data/epc-certificates-combined.csv',
        `${outputDir}/epc-cleaned-uid.csv`
      );
    }
    
    // HPI data
    if (fs.existsSync('data/hpi-data.csv')) {
      results.hpi = await cleanHPICSV(
        'data/hpi-data.csv',
        `${outputDir}/hpi-cleaned-uid.csv`
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
  
  cleanAllCSVData()
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
  cleanAllCSVData
}; 