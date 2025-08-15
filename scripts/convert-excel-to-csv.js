const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Function to convert Excel to CSV
function convertExcelToCSV(inputFile, outputFile) {
  try {
    console.log(`Converting ${inputFile} to ${outputFile}...`);
    
    // Read the Excel file
    const workbook = XLSX.readFile(inputFile);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to CSV
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    // Write to file
    fs.writeFileSync(outputFile, csv);
    
    console.log(`✅ Successfully converted to ${outputFile}`);
    console.log(`📊 Sheet: ${sheetName}`);
    console.log(`📝 CSV Preview (first 5 lines):`);
    
    // Show preview
    const lines = csv.split('\n').slice(0, 6);
    lines.forEach((line, index) => {
      if (line.trim()) {
        console.log(`${index === 0 ? 'Header:' : `Row ${index}:`} ${line}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error converting file:', error.message);
  }
}

// Main execution
const inputFile = path.join(__dirname, '../data/hpi-ons-download.xlsx');
const outputFile = path.join(__dirname, '../data/hpi-ons-raw.csv');

if (fs.existsSync(inputFile)) {
  convertExcelToCSV(inputFile, outputFile);
} else {
  console.error('❌ Input file not found:', inputFile);
}
