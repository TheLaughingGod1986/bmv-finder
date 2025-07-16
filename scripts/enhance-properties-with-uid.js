const { esClient } = require('../src/lib/esClient.cjs.js');
const fs = require('fs');
const fastcsv = require('fast-csv');

/**
 * Enhanced Properties Index with UID-based enrichment
 * This script adds UID fields and enriches properties with HPI and EPC data
 */

const PROPERTIES_INDEX = 'properties';
const HPI_INDEX = 'house_price_index';
const EPC_INDEX = 'epc_certificates';

// UID generation function
function generatePropertyUID(houseNumber, streetName, postcode) {
  const normalizedNumber = normalizeHouseNumber(houseNumber);
  const normalizedStreet = normalizeStreet(streetName);
  const normalizedPostcode = normalizePostcode(postcode);
  
  return `${normalizedNumber} ${normalizedStreet} ${normalizedPostcode}`.toUpperCase();
}

// Normalization functions
function normalizeHouseNumber(number) {
  if (!number) return '';
  return number.toString().trim().toLowerCase();
}

function normalizeStreet(street) {
  if (!street) return '';
  return street.trim().toLowerCase()
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

function normalizePostcode(postcode) {
  if (!postcode) return '';
  return postcode.trim().toUpperCase()
    .replace(/\s+/g, ''); // Remove spaces
}

async function enhancePropertiesWithUID() {
  console.log('🚀 Starting enhanced properties indexing with UID...');
  
  try {
    // Step 1: Update index mapping to include UID fields
    await updateIndexMapping();
    
    // Step 2: Load HPI data into memory for enrichment
    const hpiData = await loadHPIData();
    console.log(`✅ Loaded ${hpiData.size} HPI data points`);
    
    // Step 3: Load EPC data into memory for enrichment
    const epcData = await loadEPCData();
    console.log(`✅ Loaded ${epcData.size} EPC records`);
    
    // Step 4: Process properties and enrich with UID
    await processAndEnrichProperties(hpiData, epcData);
    
    console.log('🎉 Enhanced properties indexing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in enhanced properties indexing:', error);
    throw error;
  }
}

async function updateIndexMapping() {
  console.log('📝 Updating index mapping to include UID fields...');
  
  try {
    // Add new fields to existing index
    await esClient.indices.putMapping({
      index: PROPERTIES_INDEX,
      body: {
        properties: {
          // UID fields
          property_uid: { type: 'keyword' },
          house_number_normalized: { type: 'keyword' },
          street_normalized: { type: 'keyword' },
          postcode_normalized: { type: 'keyword' },
          
          // HPI enrichment fields
          hpi_region: { type: 'keyword' },
          hpi_index_current: { type: 'float' },
          hpi_index_at_sale: { type: 'float' },
          hpi_adjusted_value: { type: 'float' },
          hpi_growth_rate: { type: 'float' },
          
          // EPC enrichment fields
          epc_rating: { type: 'keyword' },
          epc_bedrooms: { type: 'integer' },
          epc_floor_area: { type: 'float' },
          epc_construction_year: { type: 'integer' },
          epc_certificate_id: { type: 'keyword' },
          
          // Enhanced analysis fields
          price_per_sqm: { type: 'float' },
          price_per_bedroom: { type: 'float' },
          market_value_estimate: { type: 'float' },
          growth_potential_score: { type: 'float' },
          
          // Metadata
          enriched_at: { type: 'date' },
          enrichment_source: { type: 'keyword' }
        }
      }
    });
    
    console.log('✅ Index mapping updated successfully');
  } catch (error) {
    console.error('❌ Error updating index mapping:', error);
    throw error;
  }
}

async function loadHPIData() {
  console.log('📊 Loading HPI data...');
  
  const hpiData = new Map();
  
  try {
    const response = await esClient.search({
      index: HPI_INDEX,
      size: 10000,
      body: {
        query: { match_all: {} },
        sort: [{ date: { order: 'desc' } }]
      }
    });
    
    response.hits.hits.forEach(hit => {
      const doc = hit._source;
      const key = `${doc.region}_${doc.date}`;
      hpiData.set(key, doc);
    });
    
    return hpiData;
  } catch (error) {
    console.error('❌ Error loading HPI data:', error);
    return new Map();
  }
}

async function loadEPCData() {
  console.log('🏠 Loading EPC data...');
  
  const epcData = new Map();
  
  try {
    const response = await esClient.search({
      index: EPC_INDEX,
      size: 10000,
      body: {
        query: { match_all: {} }
      }
    });
    
    response.hits.hits.forEach(hit => {
      const doc = hit._source;
      if (doc.postcode && doc.address_line_1) {
        const uid = generatePropertyUID(
          extractHouseNumber(doc.address_line_1),
          doc.address_line_1,
          doc.postcode
        );
        epcData.set(uid, doc);
      }
    });
    
    return epcData;
  } catch (error) {
    console.error('❌ Error loading EPC data:', error);
    return new Map();
  }
}

function extractHouseNumber(address) {
  if (!address) return '';
  const match = address.match(/^(\d+)/);
  return match ? match[1] : '';
}

async function processAndEnrichProperties(hpiData, epcData) {
  console.log('🔄 Processing and enriching properties...');
  
  let processed = 0;
  let enriched = 0;
  const batchSize = 1000;
  
  try {
    // Use scroll API to process all properties
    const response = await esClient.search({
      index: PROPERTIES_INDEX,
      scroll: '30s',
      size: batchSize,
      body: {
        query: { match_all: {} }
      }
    });
    
    let scrollId = response._scroll_id;
    let currentResponse = response;
    
    while (currentResponse.hits.hits.length > 0) {
      const operations = [];
      
      for (const hit of currentResponse.hits.hits) {
        const source = hit._source;
        
        // Generate UID
        const uid = generatePropertyUID(source.paon, source.street, source.postcode);
        
        // Prepare enrichment data
        const enrichment = await enrichProperty(source, uid, hpiData, epcData);
        
        // Add update operation
        operations.push({
          update: {
            _index: PROPERTIES_INDEX,
            _id: hit._id
          }
        });
        
        operations.push({
          doc: {
            property_uid: uid,
            house_number_normalized: normalizeHouseNumber(source.paon),
            street_normalized: normalizeStreet(source.street),
            postcode_normalized: normalizePostcode(source.postcode),
            ...enrichment,
            enriched_at: new Date().toISOString()
          }
        });
        
        processed++;
        if (enrichment.enrichment_source) enriched++;
      }
      
      // Bulk update
      if (operations.length > 0) {
        await esClient.bulk({ body: operations });
        console.log(`📊 Processed ${processed} properties, enriched ${enriched}`);
      }
      
      // Get next batch
      currentResponse = await esClient.scroll({
        scrollId: scrollId,
        scroll: '30s'
      });
      
      scrollId = currentResponse._scroll_id;
    }
    
    console.log(`✅ Completed processing ${processed} properties, enriched ${enriched}`);
    
  } catch (error) {
    console.error('❌ Error processing properties:', error);
    throw error;
  }
}

async function enrichProperty(property, uid, hpiData, epcData) {
  const enrichment = {
    enrichment_source: 'none'
  };
  
  // HPI Enrichment
  const hpiEnrichment = enrichWithHPI(property, hpiData);
  if (hpiEnrichment) {
    Object.assign(enrichment, hpiEnrichment);
    enrichment.enrichment_source = 'hpi';
  }
  
  // EPC Enrichment
  const epcEnrichment = enrichWithEPC(uid, epcData);
  if (epcEnrichment) {
    Object.assign(enrichment, epcEnrichment);
    enrichment.enrichment_source = enrichment.enrichment_source === 'none' ? 'epc' : 'hpi_epc';
  }
  
  // Calculate derived metrics
  const derivedMetrics = calculateDerivedMetrics(property, enrichment);
  Object.assign(enrichment, derivedMetrics);
  
  return enrichment;
}

function enrichWithHPI(property, hpiData) {
  try {
    const saleDate = property.dateOfTransfer;
    if (!saleDate) return null;
    
    // Get HPI data for the region and date
    const region = getHPIRegion(property.postcode);
    const dateKey = `${region}_${saleDate.substring(0, 7)}`; // YYYY-MM format
    
    const hpiRecord = hpiData.get(dateKey);
    if (!hpiRecord) return null;
    
    // Get current HPI for the same region
    const currentDate = new Date().toISOString().substring(0, 7);
    const currentKey = `${region}_${currentDate}`;
    const currentHPI = hpiData.get(currentKey);
    
    if (!currentHPI) return null;
    
    // Calculate HPI-adjusted value
    const hpiAdjustedValue = property.price * (currentHPI.index / hpiRecord.index);
    const hpiGrowthRate = ((currentHPI.index - hpiRecord.index) / hpiRecord.index) * 100;
    
    return {
      hpi_region: region,
      hpi_index_at_sale: hpiRecord.index,
      hpi_index_current: currentHPI.index,
      hpi_adjusted_value: Math.round(hpiAdjustedValue),
      hpi_growth_rate: Math.round(hpiGrowthRate * 100) / 100
    };
  } catch (error) {
    console.error('Error enriching with HPI:', error);
    return null;
  }
}

function enrichWithEPC(uid, epcData) {
  try {
    const epcRecord = epcData.get(uid);
    if (!epcRecord) return null;
    
    return {
      epc_rating: epcRecord.current_energy_rating,
      epc_bedrooms: epcRecord.number_of_habitable_rooms || null,
      epc_floor_area: epcRecord.total_floor_area || null,
      epc_construction_year: epcRecord.construction_year || null,
      epc_certificate_id: epcRecord.certificate_id
    };
  } catch (error) {
    console.error('Error enriching with EPC:', error);
    return null;
  }
}

function calculateDerivedMetrics(property, enrichment) {
  const metrics = {};
  
  // Price per square meter
  if (property.price && enrichment.epc_floor_area) {
    metrics.price_per_sqm = Math.round(property.price / enrichment.epc_floor_area);
  }
  
  // Price per bedroom
  if (property.price && enrichment.epc_bedrooms) {
    metrics.price_per_bedroom = Math.round(property.price / enrichment.epc_bedrooms);
  }
  
  // Market value estimate (HPI-adjusted or current price)
  if (enrichment.hpi_adjusted_value) {
    metrics.market_value_estimate = enrichment.hpi_adjusted_value;
  } else if (property.price) {
    metrics.market_value_estimate = property.price;
  }
  
  // Growth potential score (simplified)
  if (enrichment.hpi_growth_rate) {
    metrics.growth_potential_score = Math.min(Math.max(enrichment.hpi_growth_rate / 10, 0), 10);
  }
  
  return metrics;
}

function getHPIRegion(postcode) {
  if (!postcode) return 'england';
  
  const prefix = postcode.substring(0, 2).toUpperCase();
  
  // UK region mapping
  const regions = {
    'E': 'london', 'N': 'london', 'W': 'london', 'SW': 'london', 'SE': 'london', 'NW': 'london',
    'GU': 'south-east', 'RG': 'south-east', 'SL': 'south-east', 'SO': 'south-east', 'PO': 'south-east',
    'BN': 'south-east', 'TN': 'south-east', 'CT': 'south-east', 'ME': 'south-east', 'DA': 'south-east',
    'RH': 'south-east', 'HP': 'south-east', 'LU': 'south-east', 'MK': 'south-east', 'OX': 'south-east',
    'BA': 'south-west', 'BS': 'south-west', 'DT': 'south-west', 'EX': 'south-west', 'GL': 'south-west',
    'PL': 'south-west', 'SN': 'south-west', 'SP': 'south-west', 'TA': 'south-west', 'TQ': 'south-west',
    'TR': 'south-west', 'AL': 'east', 'CB': 'east', 'CM': 'east', 'CO': 'east', 'IP': 'east',
    'NR': 'east', 'SG': 'east', 'SS': 'east', 'B': 'west-midlands', 'CV': 'west-midlands',
    'DY': 'west-midlands', 'HR': 'west-midlands', 'LE': 'west-midlands', 'NG': 'west-midlands',
    'ST': 'west-midlands', 'TF': 'west-midlands', 'WS': 'west-midlands', 'WV': 'west-midlands',
    'DE': 'east-midlands', 'DN': 'east-midlands', 'LN': 'east-midlands', 'PE': 'east-midlands',
    'S': 'east-midlands', 'BD': 'yorkshire-humber', 'HD': 'yorkshire-humber', 'HG': 'yorkshire-humber',
    'HU': 'yorkshire-humber', 'HX': 'yorkshire-humber', 'LS': 'yorkshire-humber', 'WF': 'yorkshire-humber',
    'YO': 'yorkshire-humber', 'BB': 'north-west', 'BL': 'north-west', 'CA': 'north-west',
    'CH': 'north-west', 'CW': 'north-west', 'FY': 'north-west', 'L': 'north-west', 'LA': 'north-west',
    'M': 'north-west', 'OL': 'north-west', 'PR': 'north-west', 'SK': 'north-west', 'WA': 'north-west',
    'WN': 'north-west', 'DH': 'north-east', 'DL': 'north-east', 'NE': 'north-east', 'SR': 'north-east',
    'TS': 'north-east', 'CF': 'wales', 'LD': 'wales', 'LL': 'wales', 'NP': 'wales', 'SA': 'wales',
    'SY': 'wales'
  };
  
  return regions[prefix] || 'england';
}

// Run the enhancement
if (require.main === module) {
  enhancePropertiesWithUID()
    .then(() => {
      console.log('✅ Enhanced properties indexing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Enhanced properties indexing failed:', error);
      process.exit(1);
    });
}

module.exports = { enhancePropertiesWithUID, generatePropertyUID }; 