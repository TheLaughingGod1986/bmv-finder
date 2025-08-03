const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Elasticsearch client configuration
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  },
  tls: {
    rejectUnauthorized: false
  }
});

const PROPERTIES_INDEX = 'properties';
const HPI_INDEX = 'house_price_index';
const BATCH_SIZE = 100;

// Postcode to region mapping (simplified)
const POSTCODE_REGION_MAP = {
  // London
  'E': 'London',
  'N': 'London',
  'W': 'London',
  'SW': 'London',
  'SE': 'London',
  'NW': 'London',
  
  // South East
  'GU': 'South East',
  'RG': 'South East',
  'SL': 'South East',
  'SO': 'South East',
  'PO': 'South East',
  'BN': 'South East',
  'TN': 'South East',
  'CT': 'South East',
  'ME': 'South East',
  'DA': 'South East',
  'RH': 'South East',
  'HP': 'South East',
  'LU': 'South East',
  'MK': 'South East',
  'OX': 'South East',
  'RG': 'South East',
  
  // South West
  'BA': 'South West',
  'BS': 'South West',
  'DT': 'South West',
  'EX': 'South West',
  'GL': 'South West',
  'PL': 'South West',
  'SN': 'South West',
  'SP': 'South West',
  'TA': 'South West',
  'TQ': 'South West',
  'TR': 'South West',
  
  // East of England
  'AL': 'East of England',
  'CB': 'East of England',
  'CM': 'East of England',
  'CO': 'East of England',
  'IP': 'East of England',
  'NR': 'East of England',
  'SG': 'East of England',
  'SS': 'East of England',
  
  // West Midlands
  'B': 'West Midlands',
  'CV': 'West Midlands',
  'DY': 'West Midlands',
  'HR': 'West Midlands',
  'LE': 'West Midlands',
  'NG': 'West Midlands',
  'ST': 'West Midlands',
  'TF': 'West Midlands',
  'WS': 'West Midlands',
  'WV': 'West Midlands',
  
  // East Midlands
  'DE': 'East Midlands',
  'DN': 'East Midlands',
  'LN': 'East Midlands',
  'PE': 'East Midlands',
  'S': 'East Midlands',
  
  // Yorkshire and The Humber
  'BD': 'Yorkshire and The Humber',
  'HD': 'Yorkshire and The Humber',
  'HG': 'Yorkshire and The Humber',
  'HU': 'Yorkshire and The Humber',
  'HX': 'Yorkshire and The Humber',
  'LS': 'Yorkshire and The Humber',
  'WF': 'Yorkshire and The Humber',
  'YO': 'Yorkshire and The Humber',
  
  // North West
  'BB': 'North West',
  'BL': 'North West',
  'CA': 'North West',
  'CH': 'North West',
  'CW': 'North West',
  'FY': 'North West',
  'L': 'North West',
  'LA': 'North West',
  'M': 'North West',
  'OL': 'North West',
  'PR': 'North West',
  'SK': 'North West',
  'WA': 'North West',
  'WN': 'North West',
  
  // North East
  'DH': 'North East',
  'DL': 'North East',
  'NE': 'North East',
  'SR': 'North East',
  'TS': 'North East',
  
  // Wales
  'CF': 'Wales',
  'CH': 'Wales',
  'HR': 'Wales',
  'LD': 'Wales',
  'LL': 'Wales',
  'NP': 'Wales',
  'SA': 'Wales',
  'SY': 'Wales',
  
  // Scotland
  'AB': 'Scotland',
  'DD': 'Scotland',
  'DG': 'Scotland',
  'EH': 'Scotland',
  'FK': 'Scotland',
  'G': 'Scotland',
  'HS': 'Scotland',
  'IV': 'Scotland',
  'KA': 'Scotland',
  'KW': 'Scotland',
  'KY': 'Scotland',
  'ML': 'Scotland',
  'PA': 'Scotland',
  'PH': 'Scotland',
  'TD': 'Scotland',
  'ZE': 'Scotland',
  
  // Northern Ireland
  'BT': 'Northern Ireland'
};

function getRegionFromPostcode(postcode) {
  if (!postcode) return 'United Kingdom';
  
  const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
  
  // Try 2-letter prefixes first
  for (const [prefix, region] of Object.entries(POSTCODE_REGION_MAP)) {
    if (cleanPostcode.startsWith(prefix)) {
      return region;
    }
  }
  
  // Try 1-letter prefixes
  const firstChar = cleanPostcode.charAt(0);
  if (POSTCODE_REGION_MAP[firstChar]) {
    return POSTCODE_REGION_MAP[firstChar];
  }
  
  return 'United Kingdom'; // Default fallback
}

async function getHpiData(region, date) {
  try {
    const response = await client.search({
      index: HPI_INDEX,
      body: {
        query: {
          bool: {
            must: [
              { term: { region: region } },
              { term: { date: date } }
            ]
          }
        },
        size: 1
      }
    });
    
    return response.hits.hits[0]?._source || null;
  } catch (error) {
    console.error(`Error fetching HPI data for ${region} on ${date}:`, error);
    return null;
  }
}

async function getLatestHpiData(region) {
  try {
    const response = await client.search({
      index: HPI_INDEX,
      body: {
        query: {
          term: { region: region }
        },
        sort: [
          { date: { order: 'desc' } }
        ],
        size: 1
      }
    });
    
    return response.hits.hits[0]?._source || null;
  } catch (error) {
    console.error(`Error fetching latest HPI data for ${region}:`, error);
    return null;
  }
}

async function getPropertiesWithoutEstimates(limit = 1000) {
  try {
    const response = await client.search({
      index: PROPERTIES_INDEX,
      body: {
        query: {
          bool: {
            must_not: {
              exists: { field: 'estimatedValue' }
            }
          }
        },
        size: limit
      }
    });
    
    return response.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));
  } catch (error) {
    console.error('Error fetching properties without estimates:', error);
    return [];
  }
}

function calculateEstimatedValue(pricePaid, pastIndex, currentIndex) {
  if (!pastIndex || !currentIndex || pastIndex === 0) {
    return null;
  }
  
  const growthFactor = currentIndex / pastIndex;
  return Math.round(pricePaid * growthFactor);
}

async function estimatePropertyValue(property) {
  try {
    const region = getRegionFromPostcode(property.postcode);
    const saleDate = property.dateOfTransfer;
    
    if (!saleDate) {
      console.warn(`⚠️  No sale date for property ${property.id}`);
      return null;
    }
    
    // Extract YYYY-MM for HPI query
    const saleDateYYYYMM = saleDate.slice(0, 7); // e.g., '2024-01'
    
    // Get HPI data for sale date (YYYY-MM)
    const saleHpiData = await getHpiData(region, saleDateYYYYMM);
    if (!saleHpiData) {
      console.warn(`⚠️  No HPI data found for ${region} on ${saleDateYYYYMM}`);
      return null;
    }
    
    // Get latest HPI data for region
    const latestHpiData = await getLatestHpiData(region);
    if (!latestHpiData) {
      console.warn(`⚠️  No latest HPI data found for ${region}`);
      return null;
    }
    
    // Calculate estimated value
    const estimatedValue = calculateEstimatedValue(
      property.price,
      saleHpiData.index,
      latestHpiData.index
    );
    
    if (!estimatedValue) {
      return null;
    }
    
    // Calculate growth percentage
    const growthPercentage = ((estimatedValue - property.price) / property.price) * 100;
    
    return {
      id: property.id,
      estimatedValue,
      growthPercentage,
      saleHpiIndex: saleHpiData.index,
      currentHpiIndex: latestHpiData.index,
      hpiGrowthFactor: latestHpiData.index / saleHpiData.index,
      region,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Error estimating value for property ${property.id}:`, error);
    return null;
  }
}

async function updatePropertyEstimates(estimates) {
  if (estimates.length === 0) return;
  
  try {
    const body = estimates.flatMap(estimate => [
      { update: { _index: PROPERTIES_INDEX, _id: estimate.id } },
      {
        doc: {
          estimatedValue: estimate.estimatedValue,
          growthPercentage: estimate.growthPercentage,
          saleHpiIndex: estimate.saleHpiIndex,
          currentHpiIndex: estimate.currentHpiIndex,
          hpiGrowthFactor: estimate.hpiGrowthFactor,
          hpiRegion: estimate.region,
          lastEstimated: estimate.lastUpdated
        }
      }
    ]);
    
    const result = await client.bulk({ 
      body,
      timeout: '60s',
      refresh: false
    });
    
    if (result.errors) {
      const errors = result.items.filter(item => item.update?.error);
      console.warn(`⚠️  Batch had ${errors.length} errors, but continuing...`);
    }
    
    console.log(`✅ Updated ${estimates.length} property estimates`);
    
  } catch (error) {
    console.error('❌ Error updating property estimates:', error);
    throw error;
  }
}

async function estimateAllProperties() {
  console.log('🚀 Starting property value estimation...');
  
  let totalProcessed = 0;
  let totalEstimated = 0;
  let totalErrors = 0;
  
  try {
    // Get properties without estimates
    const properties = await getPropertiesWithoutEstimates();
    console.log(`📊 Found ${properties.length} properties without estimates`);
    
    if (properties.length === 0) {
      console.log('✅ All properties already have estimates');
      return;
    }
    
    // Process in batches
    for (let i = 0; i < properties.length; i += BATCH_SIZE) {
      const batch = properties.slice(i, i + BATCH_SIZE);
      const estimates = [];
      
      console.log(`📈 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(properties.length / BATCH_SIZE)}`);
      
      // Estimate values for batch
      for (const property of batch) {
        try {
          const estimate = await estimatePropertyValue(property);
          if (estimate) {
            estimates.push(estimate);
            totalEstimated++;
          } else {
            totalErrors++;
          }
          totalProcessed++;
        } catch (error) {
          console.error(`Error processing property ${property.id}:`, error);
          totalErrors++;
          totalProcessed++;
        }
      }
      
      // Update estimates in Elasticsearch
      if (estimates.length > 0) {
        await updatePropertyEstimates(estimates);
      }
      
      // Progress update
      console.log(`📊 Progress: ${totalProcessed}/${properties.length} processed, ${totalEstimated} estimated, ${totalErrors} errors`);
    }
    
    // Refresh index
    await client.indices.refresh({ index: PROPERTIES_INDEX });
    
    console.log('🎉 Property value estimation completed!');
    console.log(`📊 Summary:`);
    console.log(`  - Total processed: ${totalProcessed}`);
    console.log(`  - Successfully estimated: ${totalEstimated}`);
    console.log(`  - Errors: ${totalErrors}`);
    console.log(`  - Success rate: ${((totalEstimated / totalProcessed) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('💥 Property value estimation failed:', error);
    throw error;
  }
}

// Run the estimation
if (require.main === module) {
  estimateAllProperties()
    .then(() => {
      console.log('✅ Property estimation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Property estimation failed:', error);
      process.exit(1);
    });
}

module.exports = { 
  estimateAllProperties, 
  estimatePropertyValue, 
  getRegionFromPostcode,
  calculateEstimatedValue 
}; 