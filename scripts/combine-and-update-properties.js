const fs = require('fs');
const path = require('path');
const { esClient } = require('../src/lib/esClient.cjs.js');

const EXISTING_CSV = 'pp-complete-cleaned.csv';
const COMBINED_CSV = 'pp-complete-updated.csv';
const LAND_REGISTRY_DIR = 'data/land-registry';

async function combineCsvFiles() {
  console.log('🔄 Combining CSV files...');
  
  // Check if existing CSV exists
  if (!fs.existsSync(EXISTING_CSV)) {
    console.error(`❌ Existing CSV not found: ${EXISTING_CSV}`);
    return false;
  }
  
  // Get all downloaded CSV files
  const csvFiles = [];
  const years = fs.readdirSync(LAND_REGISTRY_DIR).filter(dir => 
    fs.statSync(path.join(LAND_REGISTRY_DIR, dir)).isDirectory()
  ).sort();
  
  for (const year of years) {
    const yearDir = path.join(LAND_REGISTRY_DIR, year);
    const files = fs.readdirSync(yearDir).filter(file => file.endsWith('.csv'));
    for (const file of files) {
      csvFiles.push(path.join(yearDir, file));
    }
  }
  
  console.log(`📁 Found ${csvFiles.length} new CSV files to combine`);
  
  if (csvFiles.length === 0) {
    console.log('⚠️  No new CSV files found. Using existing data only.');
    return true;
  }
  
  // Start with existing CSV
  console.log(`📋 Copying existing CSV (${EXISTING_CSV})...`);
  fs.copyFileSync(EXISTING_CSV, COMBINED_CSV);
  
  // Append new CSV files
  let totalNewRecords = 0;
  for (const csvFile of csvFiles) {
    console.log(`📄 Appending ${path.basename(csvFile)}...`);
    
    const content = fs.readFileSync(csvFile, 'utf8');
    const lines = content.split('\n');
    
    // Skip header line for all files except the first
    const dataLines = lines.slice(1).filter(line => line.trim());
    totalNewRecords += dataLines.length;
    
    // Append to combined file
    fs.appendFileSync(COMBINED_CSV, '\n' + dataLines.join('\n'));
  }
  
  console.log(`✅ Combined CSV created: ${COMBINED_CSV}`);
  console.log(`📊 Added ${totalNewRecords.toLocaleString()} new records`);
  
  return true;
}

async function updatePropertiesIndex() {
  console.log('🔄 Updating properties index...');
  
  // Check if combined CSV exists
  if (!fs.existsSync(COMBINED_CSV)) {
    console.error(`❌ Combined CSV not found: ${COMBINED_CSV}`);
    return false;
  }
  
  // Get line count of combined CSV
  const lineCount = fs.readFileSync(COMBINED_CSV, 'utf8').split('\n').length - 1; // -1 for header
  console.log(`📊 Combined CSV has ${lineCount.toLocaleString()} records`);
  
  // Update the indexing script to use the new combined file
  const indexingScript = 'scripts/populate-elasticsearch.js';
  let scriptContent = fs.readFileSync(indexingScript, 'utf8');
  
  // Replace the CSV filename
  scriptContent = scriptContent.replace(
    /input: fs\.createReadStream\('pp-complete-cleaned\.csv'\)/,
    `input: fs.createReadStream('${COMBINED_CSV}')`
  );
  
  fs.writeFileSync(indexingScript, scriptContent);
  console.log(`✅ Updated indexing script to use ${COMBINED_CSV}`);
  
  return true;
}

async function runRecentSalesPopulation() {
  console.log('🔄 Running recent sales population...');
  
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    const result = await execAsync('node scripts/populate-recent-sales-simple.js');
    console.log('✅ Recent sales population completed');
    console.log(result.stdout);
    
    if (result.stderr) {
      console.warn('⚠️  Recent sales warnings:', result.stderr);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Recent sales population failed:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting data update process...\n');
    
    // Step 1: Combine CSV files
    const combineSuccess = await combineCsvFiles();
    if (!combineSuccess) {
      console.error('❌ Failed to combine CSV files');
      return;
    }
    
    // Step 2: Update properties index
    const updateSuccess = await updatePropertiesIndex();
    if (!updateSuccess) {
      console.error('❌ Failed to update properties index');
      return;
    }
    
    // Step 3: Run properties indexing
    console.log('🔄 Running properties indexing...');
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    const result = await execAsync('node scripts/populate-elasticsearch.js');
    console.log('✅ Properties indexing completed');
    console.log(result.stdout);
    
    if (result.stderr) {
      console.warn('⚠️  Properties indexing warnings:', result.stderr);
    }
    
    // Step 4: Run recent sales population
    const recentSalesSuccess = await runRecentSalesPopulation();
    if (!recentSalesSuccess) {
      console.error('❌ Failed to populate recent sales');
      return;
    }
    
    console.log('\n🎉 Data update process completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during data update:', error);
  }
}

main(); 