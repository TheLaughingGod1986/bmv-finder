#!/usr/bin/env node

/**
 * Clean ONS Rental Price Data Script
 * Processes the Index of Private Housing Rental Prices CSV
 * 
 * Usage: node scripts/clean-rental-prices.js
 */

const fs = require('fs');
const path = require('path');

// File paths
const INPUT_FILE = path.join(__dirname, '..', 'data', 'rental-prices-ons.csv');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'cleaned-datasets', 'rental-prices-cleaned.csv');

// CSV parsing function
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Clean and transform rental price record
function cleanRentalPriceRecord(values) {
  if (values.length < 8) return null;
  
  const [
    version, dataMarking, monthYear, time, geoCode, geography, indexType, indexLabel
  ] = values;
  
  // Skip header row
  if (version === 'v4_1') return null;
  
  // Skip rows without geography code
  if (!geoCode || geoCode === '') return null;
  
  // Parse month and year
  const monthYearMatch = monthYear.match(/([A-Za-z]+)-(\d{2})/);
  if (!monthYearMatch) return null;
  
  const month = monthYearMatch[1];
  const year = '20' + monthYearMatch[2];
  
  // Convert month to number
  const monthMap = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };
  
  const monthNum = monthMap[month];
  if (!monthNum) return null;
  
  // Create date
  const date = new Date(year, monthNum - 1, 1);
  
  // Parse numeric values - use first column as the value
  const numericValue = parseFloat(version);
  if (isNaN(numericValue)) return null;
  
  // Determine if this is an index or year-on-year change
  const isIndex = indexType === 'index';
  const isYearOnYear = indexType === 'year-on-year-change';
  
  // Clean geography name
  let cleanGeography = geography;
  if (geoCode.startsWith('E120000')) {
    // English regions
    cleanGeography = geography.replace(/^The /, '');
  }
  
  return {
    geo_code: geoCode,
    geography: cleanGeography,
    date: date.toISOString().split('T')[0],
    month: monthNum,
    year: parseInt(year),
    index_type: indexType,
    index_label: indexLabel,
    value: numericValue,
    is_index: isIndex,
    is_year_on_year: isYearOnYear,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Main cleaning function
async function cleanRentalPrices() {
  try {
    console.log('🧹 Starting rental price data cleaning...');
    
    // Check if input file exists
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`❌ Input file not found: ${INPUT_FILE}`);
      return;
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Read and process the CSV file
    const csvContent = fs.readFileSync(INPUT_FILE, 'utf8');
    const lines = csvContent.split('\n');
    
    console.log(`📊 Processing ${lines.length} lines...`);
    
    // Process each line
    const cleanedRecords = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;
      
      try {
        const values = parseCSVLine(line);
        

        
        const cleanedRecord = cleanRentalPriceRecord(values);
        
        if (cleanedRecord) {
          cleanedRecords.push(cleanedRecord);
          processedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.warn(`⚠️  Error processing line ${i + 1}: ${error.message}`);
        skippedCount++;
      }
    }
    
    // Write cleaned data to CSV
    if (cleanedRecords.length > 0) {
      const header = Object.keys(cleanedRecords[0]).join(',');
      const csvLines = [header];
      
      for (const record of cleanedRecords) {
        const values = Object.values(record).map(value => {
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        });
        csvLines.push(values.join(','));
      }
      
      fs.writeFileSync(OUTPUT_FILE, csvLines.join('\n'));
      
      console.log('✅ Rental price data cleaning completed!');
      console.log(`📊 Processed: ${processedCount.toLocaleString()} records`);
      console.log(`⚠️  Skipped: ${skippedCount.toLocaleString()} records`);
      console.log(`📁 Output: ${OUTPUT_FILE}`);
      
      // Show sample of cleaned data
      console.log('\n📋 Sample cleaned records:');
      cleanedRecords.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.geography} - ${record.date} - ${record.index_type}: ${record.value}`);
      });
      
    } else {
      console.error('❌ No valid records found');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning rental price data:', error.message);
  }
}

// Run the script
if (require.main === module) {
  cleanRentalPrices();
}

module.exports = { cleanRentalPrices };
