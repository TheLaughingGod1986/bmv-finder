const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const INPUT_FILE = 'data/aligned-2006-final/unified-sample-final.csv';
const EXCEL_OUTPUT = 'data/enhanced-properties-excel.csv';
const ML_OUTPUT = 'data/enhanced-properties-ml.csv';
const ANALYSIS_OUTPUT = 'data/data-quality-report.json';

// Define the fields we want to keep
const ESSENTIAL_FIELDS = [
  'property_uid',
  'transaction_id', 
  'price',
  'date',
  'postcode',
  'property_type',
  'paon',
  'street',
  'county',
  'bedrooms',
  'property_size',
  'new_build',
  'duration',
  'epc_rating',
  'energy_consumption',
  'heating_cost',
  'potential_energy_rating',
  'construction_year',
  'hpi_value',
  'hpi_region',
  'hpi_date'
];

async function cleanAndEnhanceData() {
  console.log('🚀 Starting enhanced data cleaning and enhancement...');
  
  const results = [];
  let processedCount = 0;
  let validRecords = 0;
  let epcRecords = 0;
  let hpiRecords = 0;
  let sizeRecords = 0;
  let bedroomRecords = 0;

  // Read and process the CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_FILE)
      .pipe(csv())
      .on('data', (row) => {
        processedCount++;
        
        if (processedCount % 100 === 0) {
          console.log(`📈 Processed ${processedCount} records...`);
        }

        // Clean and validate the row
        const cleanedRow = cleanRow(row);
        
        if (cleanedRow) {
          results.push(cleanedRow);
          validRecords++;
          
          // Count data quality metrics
          if (cleanedRow.epc_rating && cleanedRow.epc_rating !== '') epcRecords++;
          if (cleanedRow.hpi_value && cleanedRow.hpi_value > 0) hpiRecords++;
          if (cleanedRow.property_size && cleanedRow.property_size > 0) sizeRecords++;
          if (cleanedRow.bedrooms && cleanedRow.bedrooms > 0) bedroomRecords++;
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 Processing complete!`);
  console.log(`📋 Total records processed: ${processedCount}`);
  console.log(`✅ Valid records: ${validRecords}`);
  console.log(`🔋 EPC records: ${epcRecords} (${((epcRecords/validRecords)*100).toFixed(1)}%)`);
  console.log(`📈 HPI records: ${hpiRecords} (${((hpiRecords/validRecords)*100).toFixed(1)}%)`);
  console.log(`📏 Size records: ${sizeRecords} (${((sizeRecords/validRecords)*100).toFixed(1)}%)`);
  console.log(`🛏️ Bedroom records: ${bedroomRecords} (${((bedroomRecords/validRecords)*100).toFixed(1)}%)`);

  // Add derived features
  console.log('🧮 Adding derived features...');
  const enhancedResults = results.map(row => addDerivedFeatures(row));

  // Create Excel-ready version (user-friendly)
  console.log('📊 Creating Excel-ready version...');
  await createExcelVersion(enhancedResults);

  // Create ML-optimized version (algorithm-friendly)
  console.log('🤖 Creating ML-optimized version...');
  await createMLVersion(enhancedResults);

  // Generate data quality report
  console.log('📋 Generating data quality report...');
  await generateQualityReport(enhancedResults, {
    totalProcessed: processedCount,
    validRecords,
    epcRecords,
    hpiRecords,
    sizeRecords,
    bedroomRecords
  });

  console.log('✅ Data cleaning and enhancement completed successfully!');
  console.log(`📁 Excel version: ${EXCEL_OUTPUT}`);
  console.log(`📁 ML version: ${ML_OUTPUT}`);
  console.log(`📁 Quality report: ${ANALYSIS_OUTPUT}`);
}

function cleanRow(row) {
  try {
    // Basic validation
    if (!row.property_uid || !row.price || !row.postcode) {
      return null;
    }

    // Clean and standardize fields
    const cleaned = {};
    
    ESSENTIAL_FIELDS.forEach(field => {
      let value = row[field];
      
      // Clean specific fields
      switch (field) {
        case 'price':
          value = parseInt(value) || 0;
          if (value <= 0) return null; // Skip invalid prices
          break;
          
        case 'date_of_transfer':
        case 'date':
          if (!value || value === '') return null;
          // Ensure date format is consistent
          value = new Date(value).toISOString().split('T')[0];
          break;
          
        case 'property_size':
          value = parseFloat(value) || null;
          break;
          
        case 'bedrooms':
          value = parseInt(value) || null;
          break;
          
        case 'energy_consumption':
          value = parseFloat(value) || null;
          break;
          
        case 'heating_cost':
          value = parseFloat(value) || null;
          break;
          
        case 'hpi_value':
          value = parseFloat(value) || null;
          break;
          
        case 'construction_year':
          value = parseInt(value) || null;
          break;
          
        case 'epc_rating':
          // Standardize EPC ratings
          if (value && value !== '') {
            value = value.toUpperCase().trim();
            if (!['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(value)) {
              value = null;
            }
          } else {
            value = null;
          }
          break;
          
        default:
          // Clean strings
          if (typeof value === 'string') {
            value = value.trim();
            if (value === '' || value === 'null' || value === 'NA' || value === 'N/A') {
              value = null;
            }
          }
      }
      
      cleaned[field] = value;
    });

    return cleaned;
  } catch (error) {
    console.error('Error cleaning row:', error);
    return null;
  }
}

function addDerivedFeatures(row) {
  const enhanced = { ...row };
  
  // Price per square meter
  if (row.price && row.property_size && row.property_size > 0) {
    enhanced.price_per_sqm = Math.round(row.price / row.property_size);
  } else {
    enhanced.price_per_sqm = null;
  }
  
  // Property age
  if (row.construction_year) {
    enhanced.age = new Date().getFullYear() - row.construction_year;
  } else {
    enhanced.age = null;
  }
  
  // Transaction quarter (for seasonal analysis)
  if (row.date_of_transfer || row.date) {
    const date = new Date(row.date_of_transfer || row.date);
    enhanced.quarter = Math.ceil((date.getMonth() + 1) / 3);
    enhanced.year = date.getFullYear();
  } else {
    enhanced.quarter = null;
    enhanced.year = null;
  }
  
  // Normalized region name
  if (row.hpi_region) {
    enhanced.region = row.hpi_region.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  } else {
    enhanced.region = null;
  }
  
  // Energy efficiency score (A=7, B=6, C=5, D=4, E=3, F=2, G=1)
  if (row.epc_rating) {
    const epcScores = { 'A': 7, 'B': 6, 'C': 5, 'D': 4, 'E': 3, 'F': 2, 'G': 1 };
    enhanced.energy_score = epcScores[row.epc_rating] || null;
  } else {
    enhanced.energy_score = null;
  }
  
  // Property type category
  if (row.property_type) {
    const typeMap = {
      'D': 'Detached',
      'S': 'Semi-Detached', 
      'T': 'Terraced',
      'F': 'Flat',
      'O': 'Other'
    };
    enhanced.property_type_label = typeMap[row.property_type] || 'Other';
  } else {
    enhanced.property_type_label = 'Unknown';
  }
  
  return enhanced;
}

async function createExcelVersion(data) {
  const excelFields = [
    { id: 'property_uid', title: 'Property ID' },
    { id: 'price', title: 'Sale Price (£)' },
    { id: 'date_of_transfer', title: 'Sale Date' },
    { id: 'postcode', title: 'Postcode' },
    { id: 'property_type_label', title: 'Property Type' },
    { id: 'paon', title: 'House Number' },
    { id: 'street', title: 'Street' },
    { id: 'county', title: 'County' },
    { id: 'bedrooms', title: 'Bedrooms' },
    { id: 'property_size', title: 'Size (m²)' },
    { id: 'price_per_sqm', title: 'Price per m² (£)' },
    { id: 'age', title: 'Property Age (years)' },
    { id: 'epc_rating', title: 'EPC Rating' },
    { id: 'energy_consumption', title: 'Energy Use (kWh/m²/year)' },
    { id: 'heating_cost', title: 'Heating Cost (£/year)' },
    { id: 'energy_score', title: 'Energy Score (1-7)' },
    { id: 'hpi_value', title: 'HPI Value' },
    { id: 'region', title: 'Region' },
    { id: 'new_build', title: 'New Build' },
    { id: 'duration', title: 'Tenure' }
  ];

  const csvWriter = createCsvWriter({
    path: EXCEL_OUTPUT,
    header: excelFields
  });

  await csvWriter.writeRecords(data);
}

async function createMLVersion(data) {
  const mlFields = [
    { id: 'property_uid', title: 'property_uid' },
    { id: 'price', title: 'price' },
    { id: 'date', title: 'date' },
    { id: 'postcode', title: 'postcode' },
    { id: 'property_type', title: 'property_type' },
    { id: 'bedrooms', title: 'bedrooms' },
    { id: 'property_size', title: 'property_size' },
    { id: 'price_per_sqm', title: 'price_per_sqm' },
    { id: 'age', title: 'age' },
    { id: 'quarter', title: 'quarter' },
    { id: 'year', title: 'year' },
    { id: 'epc_rating', title: 'epc_rating' },
    { id: 'energy_consumption', title: 'energy_consumption' },
    { id: 'heating_cost', title: 'heating_cost' },
    { id: 'energy_score', title: 'energy_score' },
    { id: 'hpi_value', title: 'hpi_value' },
    { id: 'hpi_region', title: 'hpi_region' },
    { id: 'new_build', title: 'new_build' },
    { id: 'duration', title: 'duration' }
  ];

  const csvWriter = createCsvWriter({
    path: ML_OUTPUT,
    header: mlFields
  });

  await csvWriter.writeRecords(data);
}

async function generateQualityReport(data, stats) {
  // Calculate additional statistics
  const priceStats = calculateStats(data.map(d => d.price).filter(p => p > 0));
  const sizeStats = calculateStats(data.map(d => d.property_size).filter(s => s > 0));
  const bedroomStats = calculateStats(data.map(d => d.bedrooms).filter(b => b > 0));
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalProcessed: stats.totalProcessed,
      validRecords: stats.validRecords,
      dataQuality: {
        epcCoverage: `${stats.epcRecords}/${stats.validRecords} (${((stats.epcRecords/stats.validRecords)*100).toFixed(1)}%)`,
        hpiCoverage: `${stats.hpiRecords}/${stats.validRecords} (${((stats.hpiRecords/stats.validRecords)*100).toFixed(1)}%)`,
        sizeCoverage: `${stats.sizeRecords}/${stats.validRecords} (${((stats.sizeRecords/stats.validRecords)*100).toFixed(1)}%)`,
        bedroomCoverage: `${stats.bedroomRecords}/${stats.validRecords} (${((stats.bedroomRecords/stats.validRecords)*100).toFixed(1)}%)`
      }
    },
    statistics: {
      price: priceStats,
      propertySize: sizeStats,
      bedrooms: bedroomStats
    },
    distributions: {
      propertyTypes: countValues(data, 'property_type'),
      epcRatings: countValues(data, 'epc_rating'),
      regions: countValues(data, 'hpi_region')
    }
  };

  fs.writeFileSync(ANALYSIS_OUTPUT, JSON.stringify(report, null, 2));
}

function calculateStats(values) {
  if (values.length === 0) return { count: 0, min: null, max: null, mean: null, median: null };
  
  const sorted = values.sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    mean: Math.round(mean),
    median: Math.round(median)
  };
}

function countValues(data, field) {
  const counts = {};
  data.forEach(row => {
    const value = row[field];
    if (value !== null && value !== undefined && value !== '') {
      counts[value] = (counts[value] || 0) + 1;
    }
  });
  return counts;
}

// Run the script
cleanAndEnhanceData().catch(console.error); 