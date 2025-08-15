const fs = require('fs');
const path = require('path');

// Price Paid Data column mapping (based on Land Registry documentation)
const COLUMNS = [
  'transaction_id',      // 1. Transaction unique identifier
  'price',              // 2. Price paid
  'date_of_transfer',   // 3. Date when the transfer was completed
  'postcode',           // 4. Postcode
  'property_type',      // 5. D=Detached, S=Semi-Detached, T=Terraced, F=Flats/Maisonettes, O=Other
  'new_build',          // 6. Y=New Build, N=Not New Build
  'estate_type',        // 7. F=Freehold, L=Leasehold
  'house_number',       // 8. House number or name
  'street',             // 9. Street name
  'locality',           // 10. Locality
  'town_city',          // 11. Town/City
  'district',           // 12. District
  'county',             // 13. County
  'transaction_category', // 14. A=Standard Price Paid, B=Additional Price Paid
  'record_status'       // 15. A=Addition, C=Change, D=Delete
];

// Property type mapping
function mapPropertyType(code) {
  const types = {
    'D': 'Detached',
    'S': 'Semi-Detached', 
    'T': 'Terraced',
    'F': 'Flat/Maisonette',
    'O': 'Other'
  };
  return types[code] || 'Unknown';
}

// Estate type mapping
function mapEstateType(code) {
  const types = {
    'F': 'Freehold',
    'L': 'Leasehold'
  };
  return types[code] || 'Unknown';
}

// New build mapping
function mapNewBuild(code) {
  const types = {
    'Y': 'Yes',
    'N': 'No'
  };
  return types[code] || 'Unknown';
}

// Parse CSV line with proper quote handling
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

// Clean and transform a single record
function cleanRecord(fields, lineNumber) {
  if (fields.length !== 16) {
    console.warn(`⚠️  Line ${lineNumber}: Expected 16 fields, got ${fields.length}`);
    return null;
  }
  
  try {
    const [
      transactionId, price, dateOfTransfer, postcode, propertyType, 
      newBuild, estateType, houseNumber, street, locality, 
      townCity, district, county, transactionCategory, recordStatus
    ] = fields;
    
    // Validate required fields
    if (!transactionId || !price || !dateOfTransfer || !postcode) {
      return null;
    }
    
    // Parse and validate price
    const priceValue = parseFloat(price.replace(/[£,]/g, ''));
    if (isNaN(priceValue) || priceValue <= 0) {
      return null;
    }
    
    // Parse date
    const date = new Date(dateOfTransfer);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // Clean and validate postcode
    const cleanPostcode = postcode.trim().toUpperCase();
    if (cleanPostcode.length < 5) {
      return null;
    }
    
    // Create cleaned record
    const cleanedRecord = {
      id: transactionId.replace(/[{}]/g, ''), // Remove curly braces
      postcode: cleanPostcode,
      address: `${houseNumber} ${street}`.trim(),
      house_number: houseNumber || '',
      street: street || '',
      town: townCity || '',
      county: county || '',
      property_type: mapPropertyType(propertyType),
      tenure: mapEstateType(estateType),
      price: priceValue,
      date_of_transfer: date.toISOString().split('T')[0], // YYYY-MM-DD format
      new_build: mapNewBuild(newBuild),
      estate_type: 'Residential', // All Price Paid data is residential
      transaction_category: transactionCategory,
      primary_addressable_object_name: houseNumber || '',
      secondary_addressable_object_name: '',
      street_description: street || '',
      locality: locality || '',
      town_city: townCity || '',
      district: district || '',
      transaction_id: transactionId.replace(/[{}]/g, ''),
      entry_date: date.toISOString().split('T')[0],
      status: recordStatus
    };
    
    return cleanedRecord;
    
  } catch (error) {
    console.warn(`⚠️  Line ${lineNumber}: Error processing record: ${error.message}`);
    return null;
  }
}

// Main cleaning function
async function cleanPricePaidData() {
  console.log('🧹 Starting Price Paid data cleaning...');
  
  const inputFile = path.join(__dirname, '../data/pp-complete.csv');
  const outputFile = path.join(__dirname, '../data/cleaned-datasets/price-paid-cleaned.csv');
  
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`📁 Input file: ${inputFile}`);
  console.log(`📁 Output file: ${outputFile}`);
  
  // Count total lines first
  console.log('📊 Counting total lines...');
  const totalLines = await countLines(inputFile);
  console.log(`📊 Total lines: ${totalLines.toLocaleString()}`);
  
  // Process the file
  const cleanedRecords = [];
  let processedLines = 0;
  let validRecords = 0;
  let invalidRecords = 0;
  
  console.log('🔄 Processing records...');
  
  const readStream = fs.createReadStream(inputFile, { encoding: 'utf8' });
  const writeStream = fs.createWriteStream(outputFile);
  
  // Write header
  const header = COLUMNS.join(',') + '\n';
  writeStream.write(header);
  
  return new Promise((resolve, reject) => {
    let buffer = '';
    let lineNumber = 0;
    
    readStream.on('data', (chunk) => {
      buffer += chunk;
      
      // Process complete lines
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.substring(0, newlineIndex);
        buffer = buffer.substring(newlineIndex + 1);
        
        lineNumber++;
        
        if (lineNumber === 1) {
          // Skip header line
          continue;
        }
        
        try {
          const fields = parseCSVLine(line);
          const cleanedRecord = cleanRecord(fields, lineNumber);
          
          if (cleanedRecord) {
            // Write to CSV
            const csvLine = Object.values(cleanedRecord).map(value => 
              typeof value === 'string' && value.includes(',') ? `"${value}"` : value
            ).join(',') + '\n';
            
            writeStream.write(csvLine);
            validRecords++;
            cleanedRecords.push(cleanedRecord);
          } else {
            invalidRecords++;
          }
          
          processedLines++;
          
          // Progress update every 100,000 lines
          if (processedLines % 100000 === 0) {
            const progress = ((processedLines / totalLines) * 100).toFixed(1);
            console.log(`📈 Progress: ${progress}% (${processedLines.toLocaleString()}/${totalLines.toLocaleString()}) - Valid: ${validRecords.toLocaleString()}, Invalid: ${invalidRecords.toLocaleString()}`);
          }
          
        } catch (error) {
          console.warn(`⚠️  Line ${lineNumber}: Error: ${error.message}`);
          invalidRecords++;
          processedLines++;
        }
      }
    });
    
    readStream.on('end', () => {
      // Process any remaining buffer content
      if (buffer.trim()) {
        lineNumber++;
        try {
          const fields = parseCSVLine(buffer.trim());
          const cleanedRecord = cleanRecord(fields, lineNumber);
          
          if (cleanedRecord) {
            const csvLine = Object.values(cleanedRecord).map(value => 
              typeof value === 'string' && value.includes(',') ? `"${value}"` : value
            ).join(',') + '\n';
            
            writeStream.write(csvLine);
            validRecords++;
            cleanedRecords.push(cleanedRecord);
          } else {
            invalidRecords++;
          }
          
          processedLines++;
        } catch (error) {
          console.warn(`⚠️  Line ${lineNumber}: Error: ${error.message}`);
          invalidRecords++;
          processedLines++;
        }
      }
      
      writeStream.end();
    });
    
    writeStream.on('finish', () => {
      console.log('\n✅ Price Paid data cleaning completed!');
      console.log(`📊 Summary:`);
      console.log(`   Total lines processed: ${processedLines.toLocaleString()}`);
      console.log(`   Valid records: ${validRecords.toLocaleString()}`);
      console.log(`   Invalid records: ${invalidRecords.toLocaleString()}`);
      console.log(`   Success rate: ${((validRecords / processedLines) * 100).toFixed(1)}%`);
      console.log(`📁 Output saved to: ${outputFile}`);
      
      // Show sample of cleaned data
      if (cleanedRecords.length > 0) {
        console.log('\n📝 Sample cleaned record:');
        console.log(JSON.stringify(cleanedRecords[0], null, 2));
      }
      
      resolve(cleanedRecords);
    });
    
    readStream.on('error', reject);
    writeStream.on('error', reject);
  });
}

// Helper function to count lines in a file
function countLines(filePath) {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    
    readStream.on('data', (chunk) => {
      lineCount += (chunk.match(/\n/g) || []).length;
    });
    
    readStream.on('end', () => resolve(lineCount));
    readStream.on('error', reject);
  });
}

// Run if called directly
if (require.main === module) {
  cleanPricePaidData()
    .then(() => {
      console.log('🎉 Price Paid data cleaning completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { cleanPricePaidData };
