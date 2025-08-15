const fs = require('fs');

// Test the HPI parsing function
function testHPIParsing() {
  try {
    console.log('🧪 Testing HPI parsing...');
    
    // Read a few lines from the cleaned CSV
    const rawData = fs.readFileSync('data/cleaned-datasets/uk-hpi-cleaned.csv', 'utf8');
    const lines = rawData.split('\n').filter(line => line.trim());
    
    console.log(`📊 Total lines: ${lines.length}`);
    console.log(`📝 Headers: ${lines[0]}`);
    
    // Test parsing the first few data lines
    for (let i = 1; i <= 3; i++) {
      if (lines[i]) {
        console.log(`\n🔍 Testing line ${i}:`);
        console.log(`Raw: ${lines[i].substring(0, 100)}...`);
        
        // Parse the line
        const values = parseCSVLine(lines[i]);
        console.log(`Parsed fields: ${values.length}`);
        
        if (values.length >= 27) {
          const [region, regionLabel, date, year, month, hpiIndex, averagePrice] = values;
          console.log(`  Region: ${region}`);
          console.log(`  Label: ${regionLabel}`);
          console.log(`  Date: ${date}`);
          console.log(`  HPI Index: ${hpiIndex}`);
          console.log(`  Avg Price: ${averagePrice}`);
          
          // Test the numeric parsing
          const hpiValue = parseFloat(hpiIndex);
          const avgPrice = parseFloat(averagePrice);
          console.log(`  Parsed HPI: ${hpiValue} (valid: ${!isNaN(hpiValue)})`);
          console.log(`  Parsed Price: ${avgPrice} (valid: ${!isNaN(avgPrice)})`);
        } else {
          console.log(`  ❌ Not enough fields: expected 27, got ${values.length}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing HPI parsing:', error.message);
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

// Run the test
testHPIParsing();
