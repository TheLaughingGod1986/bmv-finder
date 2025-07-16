const { Client } = require('@elastic/elasticsearch');

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000,
  maxRetries: 3,
  retryOnTimeout: true,
});

const UNIFIED_INDEX = 'unified_properties';

// Test property search by UID
async function searchPropertyByUID(uid) {
  console.log(`🔍 Searching for property with UID: ${uid}`);
  
  try {
    const response = await esClient.search({
      index: UNIFIED_INDEX,
      body: {
        query: {
          term: {
            property_uid: uid
          }
        }
      }
    });

    if (response.hits.hits.length > 0) {
      const property = response.hits.hits[0]._source;
      console.log('\n📋 COMPLETE PROPERTY DATA:');
      console.log('=' .repeat(60));
      
      // Address Information
      console.log('📍 ADDRESS:');
      console.log(`  Full Address: ${property.full_address}`);
      console.log(`  Street: ${property.street}`);
      console.log(`  Town/City: ${property.town_city}`);
      console.log(`  County: ${property.county}`);
      console.log(`  Postcode: ${property.postcode}`);
      
      // Property Details
      console.log('\n🏠 PROPERTY DETAILS:');
      console.log(`  Type: ${property.property_type_label}`);
      console.log(`  Bedrooms: ${property.bedrooms || 'Not available'}`);
      console.log(`  Property Size: ${property.property_size || property.floor_area_m2 || 'Not available'} m²`);
      console.log(`  Construction Year: ${property.construction_year || 'Not available'}`);
      
      // EPC Information
      console.log('\n⚡ ENERGY PERFORMANCE:');
      console.log(`  Current Rating: ${property.current_energy_rating || 'Not available'}`);
      console.log(`  Potential Rating: ${property.potential_energy_rating || 'Not available'}`);
      console.log(`  EPC Date: ${property.epc_date || 'Not available'}`);
      
      // Transaction History
      console.log('\n💰 TRANSACTION HISTORY:');
      console.log(`  Last Sale Price: £${property.price?.toLocaleString() || 'Not available'}`);
      console.log(`  Sale Date: ${property.date_of_transfer || 'Not available'}`);
      console.log(`  Years Since Sale: ${property.years_since_sale?.toFixed(1) || 'Not available'}`);
      
      // Market Analysis
      console.log('\n📈 MARKET ANALYSIS:');
      console.log(`  Estimated Current Value: £${property.estimated_current_value?.toLocaleString() || 'Not available'}`);
      console.log(`  Growth Percentage: ${property.growth_percentage?.toFixed(1) || 'Not available'}%`);
      console.log(`  HPI Region: ${property.hpi_region || 'Not available'}`);
      console.log(`  HPI Value: ${property.hpi_value || 'Not available'}`);
      console.log(`  Monthly HPI Change: ${property.hpi_change_monthly?.toFixed(2) || 'Not available'}%`);
      
      // Data Sources
      console.log('\n📊 DATA SOURCES:');
      console.log(`  Sources: ${property.data_sources?.join(', ') || 'Land Registry only'}`);
      console.log(`  Last Updated: ${property.last_updated || 'Not available'}`);
      
      return property;
    } else {
      console.log('❌ Property not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error searching property:', error);
    return null;
  }
}

// Search properties by postcode
async function searchPropertiesByPostcode(postcode) {
  console.log(`🔍 Searching properties in postcode: ${postcode}`);
  
  try {
    const response = await esClient.search({
      index: UNIFIED_INDEX,
      body: {
        query: {
          prefix: {
            postcode: postcode.replace(/\s+/g, '').toUpperCase()
          }
        },
        sort: [
          { date_of_transfer: { order: 'desc' } }
        ],
        size: 10
      }
    });

    console.log(`\n📋 Found ${response.hits.hits.length} properties in ${postcode}:`);
    console.log('=' .repeat(60));
    
    response.hits.hits.forEach((hit, index) => {
      const property = hit._source;
      console.log(`\n${index + 1}. ${property.full_address}`);
      console.log(`   Price: £${property.price?.toLocaleString() || 'N/A'}`);
      console.log(`   Date: ${property.date_of_transfer || 'N/A'}`);
      console.log(`   Type: ${property.property_type_label || 'N/A'}`);
      console.log(`   Bedrooms: ${property.bedrooms || 'N/A'}`);
      console.log(`   Current Value: £${property.estimated_current_value?.toLocaleString() || 'N/A'}`);
      console.log(`   Growth: ${property.growth_percentage?.toFixed(1) || 'N/A'}%`);
      console.log(`   UID: ${property.property_uid}`);
    });
    
    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.error('❌ Error searching by postcode:', error);
    return [];
  }
}

// Search properties with specific criteria
async function searchPropertiesWithCriteria(criteria) {
  console.log('🔍 Searching properties with criteria:', criteria);
  
  try {
    const query = {
      bool: {
        must: []
      }
    };
    
    if (criteria.minPrice) {
      query.bool.must.push({ range: { price: { gte: criteria.minPrice } } });
    }
    
    if (criteria.maxPrice) {
      query.bool.must.push({ range: { price: { lte: criteria.maxPrice } } });
    }
    
    if (criteria.propertyType) {
      query.bool.must.push({ term: { property_type: criteria.propertyType } });
    }
    
    if (criteria.minBedrooms) {
      query.bool.must.push({ range: { bedrooms: { gte: criteria.minBedrooms } } });
    }
    
    if (criteria.region) {
      query.bool.must.push({ term: { county: criteria.region } });
    }
    
    const response = await esClient.search({
      index: UNIFIED_INDEX,
      body: {
        query,
        sort: [
          { growth_percentage: { order: 'desc' } }
        ],
        size: criteria.limit || 20
      }
    });

    console.log(`\n📋 Found ${response.hits.hits.length} properties matching criteria:`);
    console.log('=' .repeat(60));
    
    response.hits.hits.forEach((hit, index) => {
      const property = hit._source;
      console.log(`\n${index + 1}. ${property.full_address}`);
      console.log(`   Price: £${property.price?.toLocaleString() || 'N/A'}`);
      console.log(`   Growth: ${property.growth_percentage?.toFixed(1) || 'N/A'}%`);
      console.log(`   Current Value: £${property.estimated_current_value?.toLocaleString() || 'N/A'}`);
      console.log(`   Bedrooms: ${property.bedrooms || 'N/A'}`);
      console.log(`   EPC Rating: ${property.current_energy_rating || 'N/A'}`);
    });
    
    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.error('❌ Error searching with criteria:', error);
    return [];
  }
}

// Get property statistics
async function getPropertyStatistics() {
  console.log('📊 Getting property statistics...');
  
  try {
    const response = await esClient.search({
      index: UNIFIED_INDEX,
      body: {
        size: 0,
        aggs: {
          total_properties: { value_count: { field: 'property_uid' } },
          avg_price: { avg: { field: 'price' } },
          avg_growth: { avg: { field: 'growth_percentage' } },
          property_types: { terms: { field: 'property_type_label', size: 10 } },
          regions: { terms: { field: 'county', size: 10 } },
          data_sources: { terms: { field: 'data_sources', size: 10 } }
        }
      }
    });

    const aggs = response.aggregations;
    
    console.log('\n📊 PROPERTY STATISTICS:');
    console.log('=' .repeat(60));
    console.log(`Total Properties: ${aggs.total_properties.value.toLocaleString()}`);
    console.log(`Average Price: £${Math.round(aggs.avg_price.value).toLocaleString()}`);
    console.log(`Average Growth: ${aggs.avg_growth.value?.toFixed(1) || 'N/A'}%`);
    
    console.log('\n🏠 Property Types:');
    aggs.property_types.buckets.forEach(bucket => {
      console.log(`  ${bucket.key}: ${bucket.doc_count.toLocaleString()}`);
    });
    
    console.log('\n📍 Top Regions:');
    aggs.regions.buckets.forEach(bucket => {
      console.log(`  ${bucket.key}: ${bucket.doc_count.toLocaleString()}`);
    });
    
    console.log('\n📊 Data Sources:');
    aggs.data_sources.buckets.forEach(bucket => {
      console.log(`  ${bucket.key}: ${bucket.doc_count.toLocaleString()}`);
    });
    
    return aggs;
  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    return null;
  }
}

// Main test function
async function runUnifiedPropertyTests() {
  console.log('🚀 Testing Unified Property Index');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Get statistics
    await getPropertyStatistics();
    
    // Test 2: Search by postcode
    console.log('\n' + '=' .repeat(60));
    await searchPropertiesByPostcode('SW1A');
    
    // Test 3: Search with criteria
    console.log('\n' + '=' .repeat(60));
    await searchPropertiesWithCriteria({
      minPrice: 500000,
      maxPrice: 1000000,
      minBedrooms: 3,
      propertyType: 'D',
      limit: 5
    });
    
    // Test 4: Search specific property by UID (if available)
    console.log('\n' + '=' .repeat(60));
    const sampleProperties = await searchPropertiesByPostcode('SW1A');
    if (sampleProperties.length > 0) {
      const sampleUID = sampleProperties[0].property_uid;
      await searchPropertyByUID(sampleUID);
    }
    
  } catch (error) {
    console.error('❌ Error running tests:', error);
  }
}

// Run the tests
if (require.main === module) {
  runUnifiedPropertyTests()
    .then(() => {
      console.log('\n✅ Unified property index tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Tests failed:', error);
      process.exit(1);
    });
}

module.exports = {
  searchPropertyByUID,
  searchPropertiesByPostcode,
  searchPropertiesWithCriteria,
  getPropertyStatistics
}; 