const fs = require('fs');
const path = require('path');

// Function to clean and transform Land Registry data
function cleanLandRegistryData() {
  try {
    console.log('🧹 Cleaning Land Registry data...');
    
    // Read the raw CSV
    const rawData = fs.readFileSync('data/land-registry-hpi.csv', 'utf8');
    const lines = rawData.split('\n').filter(line => line.trim());
    
    console.log(`📊 Found ${lines.length} lines of data`);
    
    // Parse CSV (simple approach for this format)
    const cleanedData = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const fields = parseCSVLine(line);
      
      if (fields.length >= 15) {
        // Map to our schema
        const cleaned = {
          id: fields[0].replace(/"/g, ''),
          postcode: fields[3].replace(/"/g, ''),
          address: `${fields[8] || ''} ${fields[9] || ''}`.trim(),
          house_number: fields[8] || '',
          street: fields[9] || '',
          town: fields[11] || '',
          county: fields[13] || '',
          property_type: mapPropertyType(fields[4]),
          tenure: mapTenure(fields[6]),
          price: parseFloat(fields[1]) || 0,
          date_of_transfer: fields[2].replace(/"/g, ''),
          new_build: fields[5] === 'Y' ? 'Y' : 'N',
          estate_type: 'Residential',
          transaction_category: 'A',
          primary_addressable_object_name: fields[8] || '',
          secondary_addressable_object_name: '',
          street_description: fields[9] || '',
          locality: fields[10] || '',
          town_city: fields[11] || '',
          district: fields[12] || '',
          transaction_id: fields[0].replace(/"/g, ''),
          entry_date: fields[2].replace(/"/g, ''),
          status: fields[14] || 'A'
        };
        
        cleanedData.push(cleaned);
      }
    }
    
    console.log(`✅ Cleaned ${cleanedData.length} records`);
    
    // Write cleaned CSV
    const outputFile = 'data/land-registry-cleaned.csv';
    const headers = Object.keys(cleanedData[0]);
    const csvContent = [
      headers.join(','),
      ...cleanedData.map(record => 
        headers.map(header => `"${record[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    fs.writeFileSync(outputFile, csvContent);
    console.log(`💾 Saved cleaned data to ${outputFile}`);
    
    // Show sample
    console.log('\n📝 Sample cleaned record:');
    console.log(JSON.stringify(cleanedData[0], null, 2));
    
    return cleanedData;
    
  } catch (error) {
    console.error('❌ Error cleaning data:', error.message);
    return [];
  }
}

// Simple CSV parser for this specific format
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current);
  return fields;
}

// Map property type codes to readable names
function mapPropertyType(code) {
  const types = {
    'F': 'Flat',
    'T': 'Terraced',
    'D': 'Detached',
    'S': 'Semi-detached',
    'O': 'Other'
  };
  return types[code] || 'Unknown';
}

// Map tenure codes to readable names
function mapTenure(code) {
  const tenures = {
    'F': 'Freehold',
    'L': 'Leasehold'
  };
  return tenures[code] || 'Unknown';
}

// Run the cleaning process
if (require.main === module) {
  cleanLandRegistryData();
}

module.exports = { cleanLandRegistryData };
