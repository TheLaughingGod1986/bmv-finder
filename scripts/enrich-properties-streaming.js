const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const path = require('path');

/**
 * Streaming approach to enrich properties with EPC data
 * Processes data in chunks to avoid memory issues
 */

async function enrichPropertiesStreaming({
  propertiesPath = 'pp-complete-cleaned.csv',
  epcPath = 'data/epc-certificates-combined.csv',
  outputPath = 'properties-enhanced-streaming.csv',
  batchSize = 10000
} = {}) {
  console.log('🚀 Starting streaming enrichment process...');
  console.log(`📁 Properties: ${propertiesPath}`);
  console.log(`📁 EPC Data: ${epcPath}`);
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📦 Batch Size: ${batchSize.toLocaleString()}`);

  // Step 1: Build EPC lookup map (this is smaller, can fit in memory)
  console.log('\n📖 Loading EPC data into memory...');
  const epcMap = new Map();
  let epcCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(epcPath)
      .pipe(csv())
      .on('data', (row) => {
        const uprn = row.UPRN || row.uprn;
        if (!uprn) return;
        
        // Keep most recent EPC for each UPRN
        const date = row['INSPECTION_DATE'] || row['LODGEMENT_DATE'];
        if (!epcMap.has(uprn) || (date && epcMap.get(uprn).date < date)) {
          epcMap.set(uprn, {
            bedrooms: row['NUMBER_HABITABLE_ROOMS'] || '',
            property_size: row['TOTAL_FLOOR_AREA'] || '',
            epc_rating: row['CURRENT_ENERGY_RATING'] || '',
            date: date || ''
          });
        }
        epcCount++;
      })
      .on('end', () => {
        console.log(`✅ Loaded ${epcCount.toLocaleString()} EPC records for ${epcMap.size.toLocaleString()} unique UPRNs`);
        processProperties(epcMap);
      })
      .on('error', reject);
  });

  function processProperties(epcMap) {
    console.log('\n🔄 Processing properties in streaming mode...');
    
    let processedCount = 0;
    let enrichedCount = 0;
    let batchCount = 0;
    let headers = null;
    const outputStream = fs.createWriteStream(outputPath);
    const csvStream = fastcsv.format({ headers: true });
    csvStream.pipe(outputStream);

    fs.createReadStream(propertiesPath)
      .pipe(csv())
      .on('headers', (headerList) => {
        headers = headerList;
        // Add new fields if not present
        if (!headers.includes('bedrooms')) headers.push('bedrooms');
        if (!headers.includes('property_size')) headers.push('property_size');
        if (!headers.includes('epc_rating')) headers.push('epc_rating');
        csvStream.write(headers);
      })
      .on('data', (row) => {
        const uprn = row.UPRN || row.uprn;
        
        // Add enriched fields
        if (uprn && epcMap.has(uprn)) {
          const epc = epcMap.get(uprn);
          row.bedrooms = epc.bedrooms;
          row.property_size = epc.property_size;
          row.epc_rating = epc.epc_rating;
          enrichedCount++;
        } else {
          row.bedrooms = '';
          row.property_size = '';
          row.epc_rating = '';
        }

        csvStream.write(row);
        processedCount++;

        // Progress reporting
        if (processedCount % batchSize === 0) {
          batchCount++;
          const enrichmentRate = ((enrichedCount / processedCount) * 100).toFixed(2);
          console.log(`📊 Batch ${batchCount}: ${processedCount.toLocaleString()} processed, ${enrichedCount.toLocaleString()} enriched (${enrichmentRate}%)`);
        }
      })
      .on('end', () => {
        csvStream.end();
        const finalEnrichmentRate = ((enrichedCount / processedCount) * 100).toFixed(2);
        console.log(`\n🎉 Enrichment complete!`);
        console.log(`📈 Total processed: ${processedCount.toLocaleString()}`);
        console.log(`✨ Total enriched: ${enrichedCount.toLocaleString()} (${finalEnrichmentRate}%)`);
        console.log(`💾 Output saved to: ${outputPath}`);
        resolve({ processedCount, enrichedCount, enrichmentRate: finalEnrichmentRate });
      })
      .on('error', reject);
  }
}

// If run directly, execute the enrichment
if (require.main === module) {
  const args = process.argv.slice(2);
  const propertiesPath = args[0] || 'pp-complete-cleaned.csv';
  const epcPath = args[1] || 'data/epc-certificates-combined.csv';
  const outputPath = args[2] || 'properties-enhanced-streaming.csv';

  enrichPropertiesStreaming({ propertiesPath, epcPath, outputPath })
    .then(result => {
      console.log('\n✅ Streaming enrichment completed successfully!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error during streaming enrichment:', err);
      process.exit(1);
    });
}

module.exports = { enrichPropertiesStreaming }; 