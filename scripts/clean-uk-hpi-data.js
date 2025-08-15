const fs = require('fs');
const path = require('path');

// Function to clean and transform UK HPI data
function cleanUKHPIData() {
  try {
    console.log('🧹 Cleaning UK HPI full dataset...');
    
    // Read the raw CSV
    const rawData = fs.readFileSync('data/UK-HPI-full-file-2025-04.csv', 'utf8');
    const lines = rawData.split('\n').filter(line => line.trim());
    
    console.log(`📊 Found ${lines.length} lines of data`);
    
    // Parse CSV header
    const header = lines[0];
    const headers = header.split(',').map(h => h.trim());
    
    console.log(`📝 Headers: ${headers.length} columns`);
    
    // Parse CSV data (simple approach for this format)
    const cleanedData = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const fields = parseCSVLine(line);
      
      if (fields.length >= headers.length) {
        // Create a record object
        const record = {};
        headers.forEach((header, index) => {
          record[header] = fields[index] || '';
        });
        
        // Only process records with valid data
        if (record.Date && record.RegionName && record.Index) {
          // Map to our schema
          const cleaned = {
            region: record.AreaCode || '',
            regionLabel: record.RegionName || '',
            date: formatDate(record.Date),
            year: extractYear(record.Date),
            month: extractMonth(record.Date),
            hpiIndex: parseFloat(record.Index) || 0,
            averagePrice: parseFloat(record.AveragePrice) || 0,
            percentageChangeYearly: parseFloat(record['12m%Change']) || 0,
            percentageChangeMonthly: parseFloat(record['1m%Change']) || 0,
            salesVolume: parseInt(record.SalesVolume) || 0,
            propertyType: 'All',
            buyerType: 'All',
            purchaseType: 'All',
            buildType: 'All',
            // Additional detailed data
            detachedPrice: parseFloat(record.DetachedPrice) || 0,
            detachedIndex: parseFloat(record.DetachedIndex) || 0,
            semiDetachedPrice: parseFloat(record.SemiDetachedPrice) || 0,
            semiDetachedIndex: parseFloat(record.SemiDetachedIndex) || 0,
            terracedPrice: parseFloat(record.TerracedPrice) || 0,
            terracedIndex: parseFloat(record.TerracedIndex) || 0,
            flatPrice: parseFloat(record.FlatPrice) || 0,
            flatIndex: parseFloat(record.FlatIndex) || 0,
            cashPrice: parseFloat(record.CashPrice) || 0,
            mortgagePrice: parseFloat(record.MortgagePrice) || 0,
            ftbPrice: parseFloat(record.FTBPrice) || 0,
            newPrice: parseFloat(record.NewPrice) || 0,
            oldPrice: parseFloat(record.OldPrice) || 0
          };
          
          cleanedData.push(cleaned);
        }
      }
    }
    
    console.log(`✅ Cleaned ${cleanedData.length} records`);
    
    // Write cleaned CSV to the cleaned-datasets folder
    const outputFile = 'data/cleaned-datasets/uk-hpi-cleaned.csv';
    const outputHeaders = Object.keys(cleanedData[0]);
    const csvContent = [
      outputHeaders.join(','),
      ...cleanedData.map(record => 
        outputHeaders.map(header => `"${record[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    fs.writeFileSync(outputFile, csvContent);
    console.log(`💾 Saved cleaned data to ${outputFile}`);
    
    // Show sample
    console.log('\n📝 Sample cleaned record:');
    console.log(JSON.stringify(cleanedData[0], null, 2));
    
    // Show data summary
    const years = [...new Set(cleanedData.map(r => r.year))].sort();
    const regions = [...new Set(cleanedData.map(r => r.regionLabel))].length;
    
    console.log(`\n📊 Data Summary:`);
    console.log(`   • Total records: ${cleanedData.length.toLocaleString()}`);
    console.log(`   • Date range: ${years[0]} - ${years[years.length-1]}`);
    console.log(`   • Regions covered: ${regions}`);
    console.log(`   • Average HPI index: ${(cleanedData.reduce((sum, r) => sum + r.hpiIndex, 0) / cleanedData.length).toFixed(2)}`);
    
    return cleanedData;
    
  } catch (error) {
    console.error('❌ Error cleaning data:', error.message);
    return [];
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

// Format date from DD/MM/YYYY to YYYY-MM-DD
function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

// Extract year from date
function extractYear(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  return parts.length === 3 ? parts[2] : dateStr;
}

// Extract month from date
function extractMonth(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  return parts.length === 3 ? parts[1] : dateStr;
}

// Run the cleaning process
if (require.main === module) {
  cleanUKHPIData();
}

module.exports = { cleanUKHPIData };
