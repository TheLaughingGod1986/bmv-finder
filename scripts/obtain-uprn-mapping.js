const fs = require('fs');
const path = require('path');
const https = require('https');
const { pipeline } = require('stream');
const { promisify } = require('util');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const zlib = require('zlib');

const pipelineAsync = promisify(pipeline);

/**
 * UPRN Mapping Script
 * 
 * This script downloads UPRN data from official sources and creates mappings
 * between property identifiers and UPRNs for better data enrichment.
 * 
 * Sources:
 * 1. AddressBase Premium (requires license)
 * 2. OS AddressBase (requires license) 
 * 3. Open UPRN data (limited coverage)
 * 4. EPC UPRN data (already available)
 */

class UPRNMapper {
  constructor() {
    this.uprnMap = new Map();
    this.addressMap = new Map();
    this.stats = {
      totalUprns: 0,
      totalAddresses: 0,
      matches: 0,
      postcodeMatches: 0,
      streetMatches: 0
    };
  }

  /**
   * Download and process UPRN data from multiple sources
   */
  async downloadUPRNData() {
    console.log('🚀 Starting UPRN data download and mapping...');
    
    try {
      // 1. Process EPC UPRN data (already available)
      await this.processEPCUPRNData();
      
      // 2. Download Open UPRN data (if available)
      await this.downloadOpenUPRNData();
      
      // 3. Create address-based mappings
      await this.createAddressMappings();
      
      // 4. Save mappings
      await this.saveMappings();
      
      console.log('✅ UPRN mapping completed successfully!');
      this.printStats();
      
    } catch (error) {
      console.error('❌ Error in UPRN mapping:', error);
      throw error;
    }
  }

  /**
   * Process UPRN data from existing EPC dataset
   */
  async processEPCUPRNData() {
    console.log('\n📖 Processing EPC UPRN data...');
    
    const epcPath = 'data/epc-certificates-combined.csv';
    if (!fs.existsSync(epcPath)) {
      console.log('⚠️  EPC data not found, skipping...');
      return;
    }

    return new Promise((resolve, reject) => {
      let count = 0;
      
      fs.createReadStream(epcPath)
        .pipe(csv())
        .on('data', (row) => {
          const uprn = row.UPRN;
          const address = row.ADDRESS || row.ADDRESS1;
          const postcode = row.POSTCODE;
          
          if (uprn && address && postcode) {
            // Create normalized address key
            const addressKey = this.normalizeAddress(address, postcode);
            
            // Store UPRN mapping
            this.uprnMap.set(uprn, {
              address: address,
              postcode: postcode,
              addressKey: addressKey,
              source: 'EPC'
            });
            
            // Store address mapping
            this.addressMap.set(addressKey, uprn);
            
            count++;
          }
        })
        .on('end', () => {
          console.log(`✅ Processed ${count.toLocaleString()} EPC UPRN records`);
          this.stats.totalUprns += count;
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Download open UPRN data sources
   */
  async downloadOpenUPRNData() {
    console.log('\n🌐 Downloading open UPRN data...');
    
    // List of potential open UPRN data sources
    const sources = [
      {
        name: 'OS Open UPRN',
        url: 'https://download.os.uk/downloads/open/uprn/',
        description: 'Open UPRN data from Ordnance Survey'
      },
      {
        name: 'GOV.UK UPRN',
        url: 'https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads',
        description: 'UPRN data from GOV.UK'
      }
    ];

    for (const source of sources) {
      console.log(`📡 Checking ${source.name}...`);
      try {
        await this.checkDataSource(source);
      } catch (error) {
        console.log(`⚠️  ${source.name} not available: ${error.message}`);
      }
    }
  }

  /**
   * Check if a data source is available
   */
  async checkDataSource(source) {
    return new Promise((resolve, reject) => {
      const req = https.get(source.url, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ ${source.name} is available`);
          // TODO: Implement actual download logic
        } else {
          console.log(`❌ ${source.name} not available (${res.statusCode})`);
        }
        resolve();
      });
      
      req.on('error', (error) => {
        console.log(`❌ ${source.name} error: ${error.message}`);
        resolve(); // Don't fail the whole process
      });
      
      req.setTimeout(5000, () => {
        console.log(`⏰ ${source.name} timeout`);
        req.destroy();
        resolve();
      });
    });
  }

  /**
   * Create address-based mappings from properties data
   */
  async createAddressMappings() {
    console.log('\n🏠 Creating address-based mappings from properties data...');
    
    const propertiesPath = 'pp-complete-cleaned.csv';
    if (!fs.existsSync(propertiesPath)) {
      console.log('⚠️  Properties data not found, skipping...');
      return;
    }

    return new Promise((resolve, reject) => {
      let count = 0;
      
      fs.createReadStream(propertiesPath)
        .pipe(fastcsv.parse({ headers: false }))
        .on('data', (rowArr) => {
          // Properties file columns: GUID, price, date, postcode, property_type, new_build, estate_type, 
          // transaction_id, paon, street, locality, town_city, district, county, transaction_category, record_status
          const guid = rowArr[0];
          const postcode = (rowArr[3] || '').trim().toUpperCase();
          const paon = (rowArr[8] || '').trim();
          const street = (rowArr[9] || '').trim();
          const town = (rowArr[11] || '').trim();
          
          if (guid && postcode && paon && street) {
            // Create normalized address
            const address = `${paon} ${street}`.trim();
            const addressKey = this.normalizeAddress(address, postcode);
            
            // Store property mapping
            this.addressMap.set(addressKey, {
              guid: guid,
              address: address,
              postcode: postcode,
              town: town,
              source: 'Properties'
            });
            
            count++;
          }
        })
        .on('end', () => {
          console.log(`✅ Processed ${count.toLocaleString()} property addresses`);
          this.stats.totalAddresses = count;
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Normalize address for matching
   */
  normalizeAddress(address, postcode) {
    return `${address.trim().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')}|${postcode.trim().toLowerCase()}`;
  }

  /**
   * Match properties to UPRNs
   */
  async matchPropertiesToUPRNs() {
    console.log('\n🔗 Matching properties to UPRNs...');
    
    const propertiesPath = 'pp-complete-cleaned.csv';
    const outputPath = 'properties-with-uprn.csv';
    
    if (!fs.existsSync(propertiesPath)) {
      console.log('⚠️  Properties data not found');
      return;
    }

    return new Promise((resolve, reject) => {
      let processed = 0;
      let matched = 0;
      let postcodeMatched = 0;
      let streetMatched = 0;
      
      const outputStream = fs.createWriteStream(outputPath);
      const csvStream = fastcsv.format();
      csvStream.pipe(outputStream);

      fs.createReadStream(propertiesPath)
        .pipe(fastcsv.parse({ headers: false }))
        .on('data', (rowArr) => {
          const guid = rowArr[0];
          const postcode = (rowArr[3] || '').trim().toUpperCase();
          const paon = (rowArr[8] || '').trim();
          const street = (rowArr[9] || '').trim();
          
          let uprn = '';
          let matchType = '';
          
          if (paon && street && postcode) {
            const address = `${paon} ${street}`.trim();
            const addressKey = this.normalizeAddress(address, postcode);
            
            // Try exact address match
            const uprnMatch = this.addressMap.get(addressKey);
            if (uprnMatch && typeof uprnMatch === 'string') {
              uprn = uprnMatch;
              matchType = 'exact';
              matched++;
            } else {
              // Try postcode + street match
              const postcodeKey = `|${postcode.toLowerCase()}`;
              for (const [key, value] of this.addressMap.entries()) {
                if (key.endsWith(postcodeKey) && key.includes(street.toLowerCase())) {
                  if (typeof value === 'string') {
                    uprn = value;
                    matchType = 'street';
                    streetMatched++;
                    break;
                  }
                }
              }
              
              // Try postcode-only match
              if (!uprn) {
                for (const [key, value] of this.addressMap.entries()) {
                  if (key.endsWith(postcodeKey)) {
                    if (typeof value === 'string') {
                      uprn = value;
                      matchType = 'postcode';
                      postcodeMatched++;
                      break;
                    }
                  }
                }
              }
            }
          }
          
          // Output row with UPRN
          csvStream.write([...rowArr, uprn, matchType]);
          processed++;
          
          if (processed % 100000 === 0) {
            console.log(`📊 Processed ${processed.toLocaleString()} properties, ${matched.toLocaleString()} matched`);
          }
        })
        .on('end', () => {
          csvStream.end();
          console.log(`✅ Matching completed!`);
          console.log(`📊 Total processed: ${processed.toLocaleString()}`);
          console.log(`🎯 Exact matches: ${matched.toLocaleString()} (${((matched/processed)*100).toFixed(2)}%)`);
          console.log(`🏠 Street matches: ${streetMatched.toLocaleString()} (${((streetMatched/processed)*100).toFixed(2)}%)`);
          console.log(`📮 Postcode matches: ${postcodeMatched.toLocaleString()} (${((postcodeMatched/processed)*100).toFixed(2)}%)`);
          console.log(`💾 Output saved to: ${outputPath}`);
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Save mappings to files
   */
  async saveMappings() {
    console.log('\n💾 Saving UPRN mappings...');
    
    // Save UPRN map
    const uprnData = Array.from(this.uprnMap.entries()).map(([uprn, data]) => ({
      uprn,
      address: data.address,
      postcode: data.postcode,
      source: data.source
    }));
    
    fs.writeFileSync('uprn-mappings.json', JSON.stringify(uprnData, null, 2));
    console.log(`✅ UPRN mappings saved to uprn-mappings.json (${uprnData.length} records)`);
    
    // Save address map
    const addressData = Array.from(this.addressMap.entries()).map(([address, uprn]) => ({
      address,
      uprn: typeof uprn === 'string' ? uprn : uprn.guid,
      type: typeof uprn === 'string' ? 'UPRN' : 'GUID'
    }));
    
    fs.writeFileSync('address-mappings.json', JSON.stringify(addressData, null, 2));
    console.log(`✅ Address mappings saved to address-mappings.json (${addressData.length} records)`);
  }

  /**
   * Print statistics
   */
  printStats() {
    console.log('\n📊 UPRN Mapping Statistics:');
    console.log(`🔢 Total UPRNs: ${this.stats.totalUprns.toLocaleString()}`);
    console.log(`🏠 Total Addresses: ${this.stats.totalAddresses.toLocaleString()}`);
    console.log(`🎯 Total Matches: ${this.stats.matches.toLocaleString()}`);
    console.log(`📮 Postcode Matches: ${this.stats.postcodeMatches.toLocaleString()}`);
    console.log(`🏠 Street Matches: ${this.stats.streetMatches.toLocaleString()}`);
  }

  /**
   * Create enhanced enrichment script with UPRN support
   */
  async createEnhancedEnrichmentScript() {
    console.log('\n🔧 Creating enhanced enrichment script...');
    
    const script = `const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const path = require('path');

/**
 * Enhanced Property Enrichment with UPRN Support
 * Uses UPRN mappings for better data matching
 */

async function enrichPropertiesWithUPRN({
  propertiesPath = 'properties-with-uprn.csv',
  epcPath = 'data/epc-certificates-combined.csv',
  outputPath = 'properties-enhanced-uprn.csv',
  batchSize = 10000
} = {}) {
  console.log('🚀 Starting UPRN-enhanced enrichment process...');
  
  // Load UPRN mappings
  const uprnMappings = JSON.parse(fs.readFileSync('uprn-mappings.json', 'utf8'));
  const uprnMap = new Map(uprnMappings.map(m => [m.uprn, m]));
  
  // Load EPC data by UPRN
  const epcByUprn = new Map();
  let epcCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(epcPath)
      .pipe(csv())
      .on('data', (row) => {
        const uprn = row.UPRN;
        if (uprn) {
          epcByUprn.set(uprn, {
            bedrooms: row.NUMBER_HABITABLE_ROOMS || '',
            property_size: row.TOTAL_FLOOR_AREA || '',
            epc_rating: row.CURRENT_ENERGY_RATING || '',
            address: row.ADDRESS || row.ADDRESS1 || '',
            postcode: row.POSTCODE || ''
          });
          epcCount++;
        }
      })
      .on('end', () => {
        console.log(\`Loaded EPC data for \${epcCount.toLocaleString()} UPRNs\`);
        processProperties();
      })
      .on('error', reject);

    function processProperties() {
      console.log('🔄 Processing properties with UPRN matching...');
      let processedCount = 0;
      let enrichedCount = 0;
      let batchCount = 0;
      
      const outputStream = fs.createWriteStream(outputPath);
      const csvStream = fastcsv.format();
      csvStream.pipe(outputStream);

      fs.createReadStream(propertiesPath)
        .pipe(fastcsv.parse({ headers: false }))
        .on('data', (rowArr) => {
          const uprn = rowArr[rowArr.length - 2]; // UPRN column
          let enrichment = { bedrooms: '', property_size: '', epc_rating: '' };

          if (uprn && epcByUprn.has(uprn)) {
            enrichment = epcByUprn.get(uprn);
            enrichedCount++;
          }

          // Output enriched row
          csvStream.write([...rowArr.slice(0, -2), enrichment.bedrooms, enrichment.property_size, enrichment.epc_rating]);
          
          processedCount++;
          if (processedCount % batchSize === 0) {
            batchCount++;
            const enrichmentRate = ((enrichedCount / processedCount) * 100).toFixed(2);
            console.log(\`📊 Batch \${batchCount}: \${processedCount.toLocaleString()} processed, \${enrichedCount.toLocaleString()} enriched (\${enrichmentRate}%)\`);
          }
        })
        .on('end', () => {
          csvStream.end();
          const finalEnrichmentRate = ((enrichedCount / processedCount) * 100).toFixed(2);
          console.log(\`🎉 UPRN enrichment complete!\`);
          console.log(\`📈 Total processed: \${processedCount.toLocaleString()}\`);
          console.log(\`✨ Total enriched: \${enrichedCount.toLocaleString()} (\${finalEnrichmentRate}%)\`);
          console.log(\`💾 Output saved to: \${outputPath}\`);
          resolve();
        })
        .on('error', reject);
    }
  });
}

// Run if called directly
if (require.main === module) {
  enrichPropertiesWithUPRN().catch(console.error);
}

module.exports = { enrichPropertiesWithUPRN };
`;

    fs.writeFileSync('scripts/enrich-properties-uprn.js', script);
    console.log('✅ Enhanced enrichment script created: scripts/enrich-properties-uprn.js');
  }
}

// Main execution
async function main() {
  const mapper = new UPRNMapper();
  
  try {
    // Step 1: Download and process UPRN data
    await mapper.downloadUPRNData();
    
    // Step 2: Match properties to UPRNs
    await mapper.matchPropertiesToUPRNs();
    
    // Step 3: Create enhanced enrichment script
    await mapper.createEnhancedEnrichmentScript();
    
    console.log('\n🎉 UPRN mapping process completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the generated mappings in uprn-mappings.json');
    console.log('2. Run the enhanced enrichment script: node scripts/enrich-properties-uprn.js');
    console.log('3. The new script should achieve much higher enrichment rates using UPRN matching');
    
  } catch (error) {
    console.error('❌ UPRN mapping failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { UPRNMapper }; 