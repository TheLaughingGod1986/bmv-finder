const fs = require('fs');
const path = require('path');

// EPC data columns and mapping - based on actual data structure
const EPC_COLUMNS = [
  'LMK_KEY',
  'ADDRESS1',
  'ADDRESS2',
  'ADDRESS3',
  'POSTCODE',
  'BUILDING_REFERENCE_NUMBER',
  'CURRENT_ENERGY_RATING',
  'POTENTIAL_ENERGY_RATING',
  'CURRENT_ENERGY_EFFICIENCY',
  'POTENTIAL_ENERGY_EFFICIENCY',
  'PROPERTY_TYPE',
  'BUILT_FORM',
  'INSPECTION_DATE',
  'LOCAL_AUTHORITY',
  'CONSTITUENCY',
  'COUNTY',
  'LODGEMENT_DATE',
  'TRANSACTION_TYPE',
  'ENVIRONMENT_IMPACT_CURRENT',
  'ENVIRONMENT_IMPACT_POTENTIAL',
  'ENERGY_CONSUMPTION_CURRENT',
  'ENERGY_CONSUMPTION_POTENTIAL',
  'CO2_EMISSIONS_CURRENT',
  'CO2_EMISS_CURR_PER_FLOOR_AREA',
  'CO2_EMISSIONS_POTENTIAL',
  'LIGHTING_COST_CURRENT',
  'LIGHTING_COST_POTENTIAL',
  'HEATING_COST_CURRENT',
  'HEATING_COST_POTENTIAL',
  'HOT_WATER_COST_CURRENT',
  'HOT_WATER_COST_POTENTIAL',
  'TOTAL_FLOOR_AREA',
  'ENERGY_TARIFF',
  'MAINS_GAS_FLAG',
  'FLOOR_LEVEL',
  'FLAT_TOP_STOREY',
  'FLAT_STOREY_COUNT',
  'MAIN_HEATING_CONTROLS',
  'MULTI_GLAZE_PROPORTION',
  'GLAZED_TYPE',
  'GLAZED_AREA',
  'EXTENSION_COUNT',
  'NUMBER_HABITABLE_ROOMS',
  'NUMBER_HEATED_ROOMS',
  'LOW_ENERGY_LIGHTING',
  'NUMBER_OPEN_FIREPLACES',
  'HOTWATER_DESCRIPTION',
  'HOT_WATER_ENERGY_EFF',
  'HOT_WATER_ENV_EFF',
  'FLOOR_DESCRIPTION',
  'FLOOR_ENERGY_EFF',
  'FLOOR_ENV_EFF',
  'WINDOWS_DESCRIPTION',
  'WINDOWS_ENERGY_EFF',
  'WINDOWS_ENV_EFF',
  'WALLS_DESCRIPTION',
  'WALLS_ENERGY_EFF',
  'WALLS_ENV_EFF',
  'SECONDHEAT_DESCRIPTION',
  'SHEATING_ENERGY_EFF',
  'SHEATING_ENV_EFF',
  'ROOF_DESCRIPTION',
  'ROOF_ENERGY_EFF',
  'ROOF_ENV_EFF',
  'MAINHEAT_DESCRIPTION',
  'MAINHEAT_ENERGY_EFF',
  'MAINHEAT_ENV_EFF',
  'MAINHEATCONT_DESCRIPTION',
  'MAINHEATC_ENERGY_EFF',
  'MAINHEATC_ENV_EFF',
  'LIGHTING_DESCRIPTION',
  'LIGHTING_ENERGY_EFF',
  'LIGHTING_ENV_EFF',
  'MAIN_FUEL',
  'WIND_TURBINE_COUNT',
  'HEAT_LOSS_CORRIDOR',
  'UNHEATED_CORRIDOR_LENGTH',
  'FLOOR_HEIGHT',
  'PHOTO_SUPPLY',
  'SOLAR_WATER_HEATING_FLAG',
  'MECHANICAL_VENTILATION',
  'ADDRESS',
  'LOCAL_AUTHORITY_LABEL',
  'CONSTITUENCY_LABEL',
  'POSTTOWN',
  'CONSTRUCTION_AGE_BAND',
  'LODGEMENT_DATETIME',
  'TENURE',
  'FIXED_LIGHTING_OUTLETS_COUNT',
  'LOW_ENERGY_FIXED_LIGHT_COUNT',
  'UPRN',
  'UPRN_SOURCE',
  'REPORT_TYPE'
];

// Helper function to parse CSV line with quoted fields
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

// Clean and map EPC record
function cleanEPCRecord(values) {
  if (values.length < EPC_COLUMNS.length) {
    return null;
  }
  
  const record = {};
  
  EPC_COLUMNS.forEach((column, index) => {
    let value = values[index] || '';
    
      // Clean and validate specific fields
  switch (column) {
    case 'CURRENT_ENERGY_EFFICIENCY':
    case 'POTENTIAL_ENERGY_EFFICIENCY':
      value = parseInt(value) || 0;
      break;
    case 'TOTAL_FLOOR_AREA':
    case 'GLAZED_AREA':
    case 'FLOOR_HEIGHT':
    case 'UNHEATED_CORRIDOR_LENGTH':
      value = parseFloat(value) || 0;
      break;
    case 'HEATING_COST_CURRENT':
    case 'HEATING_COST_POTENTIAL':
    case 'HOT_WATER_COST_CURRENT':
    case 'HOT_WATER_COST_POTENTIAL':
    case 'LIGHTING_COST_CURRENT':
    case 'LIGHTING_COST_POTENTIAL':
      value = parseFloat(value) || 0;
      break;
    case 'ENERGY_CONSUMPTION_CURRENT':
    case 'ENERGY_CONSUMPTION_POTENTIAL':
      value = parseFloat(value) || 0;
      break;
    case 'CO2_EMISSIONS_CURRENT':
    case 'CO2_EMISSIONS_POTENTIAL':
    case 'CO2_EMISS_CURR_PER_FLOOR_AREA':
      value = parseFloat(value) || 0;
      break;
    case 'EXTENSION_COUNT':
    case 'NUMBER_HABITABLE_ROOMS':
    case 'NUMBER_HEATED_ROOMS':
    case 'NUMBER_OPEN_FIREPLACES':
    case 'WIND_TURBINE_COUNT':
    case 'FIXED_LIGHTING_OUTLETS_COUNT':
    case 'LOW_ENERGY_FIXED_LIGHT_COUNT':
      value = parseInt(value) || 0;
      break;
    case 'INSPECTION_DATE':
    case 'LODGEMENT_DATE':
    case 'LODGEMENT_DATETIME':
      // Ensure date format is valid
      if (value && value !== '') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          value = '';
        } else {
          value = date.toISOString().split('T')[0];
        }
      }
      break;
    default:
      // Keep string values as is
      break;
  }
    
    record[column.toLowerCase()] = value;
  });
  
  // Add derived fields
  record.id = record.lmk_key || record.building_reference_number || `epc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  record.full_address = [record.address1, record.address2, record.address3, record.postcode].filter(Boolean).join(', ');
  
  return record;
}

// Process all local authority directories
async function processAllLocalAuthorities(epcDirs) {
  console.log('🚀 Starting bulk EPC data processing...');
  
  const outputFile = path.join(__dirname, '..', 'data', 'cleaned-datasets', 'epc-cleaned.csv');
  const outputDir = path.dirname(outputFile);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write header
  const writeStream = fs.createWriteStream(outputFile);
  const header = EPC_COLUMNS.map(col => col.toLowerCase()).join(',') + ',id,full_address\n';
  writeStream.write(header);
  
  let totalProcessed = 0;
  let totalSkipped = 0;
  
  for (const dir of epcDirs) {
    const certFile = path.join(__dirname, '..', 'data', dir, 'certificates.csv');
    
    if (fs.existsSync(certFile)) {
      console.log(`📊 Processing ${dir}...`);
      
      try {
        const { processed, skipped } = await processLocalAuthorityFile(certFile, writeStream);
        totalProcessed += processed;
        totalSkipped += skipped;
        
        console.log(`  ✅ ${dir}: ${processed.toLocaleString()} processed, ${skipped.toLocaleString()} skipped`);
      } catch (error) {
        console.error(`  ❌ Error processing ${dir}:`, error.message);
      }
    }
  }
  
  writeStream.end();
  
  console.log('\n🎉 Bulk EPC data processing completed!');
  console.log(`📊 Total Processed: ${totalProcessed.toLocaleString()} records`);
  console.log(`⚠️  Total Skipped: ${totalSkipped.toLocaleString()} records`);
  console.log(`📁 Output: ${outputFile}`);
  
  return { processed: totalProcessed, skipped: totalSkipped };
}

// Process a single local authority file
async function processLocalAuthorityFile(certFile, writeStream) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(certFile, { encoding: 'utf8' });
    let lineNumber = 0;
    let processedRecords = 0;
    let skippedRecords = 0;
    
    let buffer = '';
    
    readStream.on('data', (chunk) => {
      buffer += chunk;
      let newlineIndex;
      
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.substring(0, newlineIndex);
        buffer = buffer.substring(newlineIndex + 1);
        lineNumber++;
        
        // Skip header line
        if (lineNumber === 1) continue;
        
        // Skip empty lines
        if (line.trim() === '') continue;
        
        try {
          const values = parseCSVLine(line);
          const cleanedRecord = cleanEPCRecord(values);
          
          if (cleanedRecord) {
            // Convert record to CSV line
            const csvLine = EPC_COLUMNS.map(col => {
              const value = cleanedRecord[col.toLowerCase()];
              // Escape quotes and wrap in quotes if contains comma
              const escaped = String(value).replace(/"/g, '""');
              return escaped.includes(',') ? `"${escaped}"` : escaped;
            }).join(',') + `,"${cleanedRecord.id}","${cleanedRecord.full_address}"`;
            
            writeStream.write(csvLine + '\n');
            processedRecords++;
          } else {
            skippedRecords++;
          }
        } catch (error) {
          console.error(`⚠️  Error processing line ${lineNumber}:`, error.message);
          skippedRecords++;
        }
      }
    });
    
    readStream.on('end', () => {
      resolve({ processed: processedRecords, skipped: skippedRecords });
    });
    
    readStream.on('error', reject);
  });
}

// Main cleaning function
async function cleanEPCData() {
  console.log('🧹 Starting EPC data cleaning...');
  
  const inputFile = path.join(__dirname, '..', 'data', 'domestic-certificates.csv');
  const outputFile = path.join(__dirname, '..', 'data', 'cleaned-datasets', 'epc-cleaned.csv');
  
  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.log('⚠️  Input file not found. Looking for EPC data files...');
    
    const dataDir = path.join(__dirname, '..', 'data');
    const files = fs.readdirSync(dataDir);
    const epcDirs = files.filter(file => 
      file.startsWith('domestic-') && 
      fs.statSync(path.join(dataDir, file)).isDirectory()
    );
    
    if (epcDirs.length === 0) {
      console.log('❌ No EPC data directories found. Please download EPC data first.');
      return;
    }
    
    console.log(`📁 Found ${epcDirs.length} EPC local authority directories`);
    console.log('🔄 Processing all local authority certificate files...');
    
    // Process all local authority directories
    return await processAllLocalAuthorities(epcDirs);
  }
  
  console.log(`📁 Processing: ${inputFile}`);
  console.log(`📤 Output: ${outputFile}`);
  
  // Count total lines
  const totalLines = fs.readFileSync(inputFile, 'utf8').split('\n').length;
  console.log(`📊 Total lines: ${totalLines.toLocaleString()}`);
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Process the file
  const readStream = fs.createReadStream(inputFile, { encoding: 'utf8' });
  const writeStream = fs.createWriteStream(outputFile);
  
  let lineNumber = 0;
  let processedRecords = 0;
  let skippedRecords = 0;
  
  // Write header
  const header = EPC_COLUMNS.map(col => col.toLowerCase()).join(',') + ',id,full_address\n';
  writeStream.write(header);
  
  return new Promise((resolve, reject) => {
    let buffer = '';
    
    readStream.on('data', (chunk) => {
      buffer += chunk;
      let newlineIndex;
      
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.substring(0, newlineIndex);
        buffer = buffer.substring(newlineIndex + 1);
        lineNumber++;
        
        // Skip header line
        if (lineNumber === 1) continue;
        
        // Skip empty lines
        if (line.trim() === '') continue;
        
        try {
          const values = parseCSVLine(line);
          const cleanedRecord = cleanEPCRecord(values);
          
          if (cleanedRecord) {
            // Convert record to CSV line
            const csvLine = EPC_COLUMNS.map(col => {
              const value = cleanedRecord[col.toLowerCase()];
              // Escape quotes and wrap in quotes if contains comma
              const escaped = String(value).replace(/"/g, '""');
              return escaped.includes(',') ? `"${escaped}"` : escaped;
            }).join(',') + `,"${cleanedRecord.id}","${cleanedRecord.full_address}"`;
            
            writeStream.write(csvLine + '\n');
            processedRecords++;
          } else {
            skippedRecords++;
          }
        } catch (error) {
          console.error(`⚠️  Error processing line ${lineNumber}:`, error.message);
          skippedRecords++;
        }
        
        // Progress update every 1000 lines
        if (lineNumber % 1000 === 0) {
          const progress = ((lineNumber / totalLines) * 100).toFixed(1);
          console.log(`📊 Progress: ${progress}% (${lineNumber.toLocaleString()}/${totalLines.toLocaleString()})`);
        }
      }
    });
    
    readStream.on('end', () => {
      writeStream.end();
      console.log('\n✅ EPC data cleaning completed!');
      console.log(`📊 Processed: ${processedRecords.toLocaleString()} records`);
      console.log(`⚠️  Skipped: ${skippedRecords.toLocaleString()} records`);
      console.log(`📁 Output: ${outputFile}`);
      resolve();
    });
    
    readStream.on('error', reject);
    writeStream.on('error', reject);
  });
}

// CLI interface
if (require.main === module) {
  cleanEPCData()
    .then(() => {
      console.log('🎉 EPC data cleaning finished successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ EPC data cleaning failed:', error.message);
      process.exit(1);
    });
}

module.exports = { cleanEPCData };
