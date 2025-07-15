const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000,
  maxRetries: 3,
  retryOnTimeout: true,
});

async function getSampleProperty() {
  try {
    const response = await esClient.search({
      index: 'properties',
      body: {
        query: {
          bool: {
            must: [
              { exists: { field: 'postcode' } },
              { exists: { field: 'paon' } },
              { exists: { field: 'price' } }
            ]
          }
        },
        size: 1
      }
    });

    if (response.hits.hits.length > 0) {
      return response.hits.hits[0]._source;
    }
    return null;
  } catch (error) {
    console.error('Error getting sample property:', error);
    return null;
  }
}

async function getHPIData(region) {
  try {
    const response = await esClient.search({
      index: 'house_price_index',
      body: {
        query: {
          bool: {
            should: [
              { term: { region: region.toLowerCase().replace(/\s+/g, '-') } },
              { term: { regionLabel: region } }
            ]
          }
        },
        sort: [{ date: { order: 'desc' } }],
        size: 600 // Last 50 years of monthly data to cover historical sales
      }
    });

    return response.hits.hits.map(hit => ({
      date: hit._source.date,
      hpi_value: hit._source.hpiIndex,
      hpi_change: hit._source.percentageChangeMonthly || 0,
      region: hit._source.regionLabel
    }));
  } catch (error) {
    console.error('Error getting HPI data:', error);
    return [];
  }
}

async function getMarketInsights(postcode) {
  try {
    const postcodePrefix = postcode.substring(0, 4);
    
    const response = await esClient.search({
      index: 'properties',
      body: {
        query: {
          bool: {
            must: [
              { prefix: { postcode: postcodePrefix } }
            ]
          }
        },
        size: 100
      }
    });

    const sales = response.hits.hits.map(hit => hit._source);
    
    if (sales.length === 0) {
      return {
        averagePrice: 250000, // Default fallback
        averagePricePerSqm: 2500,
        averagePricePerBedroom: 70000
      };
    }

    const prices = sales.map(sale => sale.price).filter(price => price > 0);
    const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 250000;

    return {
      averagePrice,
      averagePricePerSqm: 2500, // Estimate
      averagePricePerBedroom: 70000 // Estimate
    };
  } catch (error) {
    console.error('Error getting market insights:', error);
    return {
      averagePrice: 250000,
      averagePricePerSqm: 2500,
      averagePricePerBedroom: 70000
    };
  }
}

function calculateCurrentValueEstimate(propertyData, soldPrices, hpiData, marketInsights) {
  const estimates = [];
  const weights = [];

  // Method 1: HPI-adjusted value (40% weight)
  if (soldPrices.length > 0 && hpiData.length > 0) {
    const lastSoldPrice = soldPrices[0].price;
    const lastSoldDate = soldPrices[0].date;
    
    const soldDate = new Date(lastSoldDate);
    const currentDate = new Date();
    
    // Find HPI data closest to sold date and current date
    const soldHPI = hpiData.find(hpi => new Date(hpi.date) >= soldDate) || hpiData[hpiData.length - 1];
    const currentHPI = hpiData[0];
    
    if (soldHPI && currentHPI) {
      const hpiMultiplier = currentHPI.hpi_value / soldHPI.hpi_value;
      const hpiAdjustedValue = lastSoldPrice * hpiMultiplier;
      estimates.push(hpiAdjustedValue);
      weights.push(0.4);
      console.log(`📊 HPI Method: £${lastSoldPrice.toLocaleString()} × ${hpiMultiplier.toFixed(3)} = £${hpiAdjustedValue.toLocaleString()}`);
    }
  }

  // Method 2: Market average price per sqm (30% weight)
  if (propertyData?.floor_area_m2 && marketInsights.averagePricePerSqm) {
    const sqmEstimate = propertyData.floor_area_m2 * marketInsights.averagePricePerSqm;
    estimates.push(sqmEstimate);
    weights.push(0.3);
    console.log(`📏 Sqm Method: ${propertyData.floor_area_m2} sqm × £${marketInsights.averagePricePerSqm.toLocaleString()}/sqm = £${sqmEstimate.toLocaleString()}`);
  }

  // Method 3: Market average price per bedroom (20% weight)
  if (propertyData?.bedrooms && marketInsights.averagePricePerBedroom) {
    const bedroomEstimate = propertyData.bedrooms * marketInsights.averagePricePerBedroom;
    estimates.push(bedroomEstimate);
    weights.push(0.2);
    console.log(`🛏️  Bedroom Method: ${propertyData.bedrooms} bedrooms × £${marketInsights.averagePricePerBedroom.toLocaleString()}/bedroom = £${bedroomEstimate.toLocaleString()}`);
  }

  // Method 4: Market average price (10% weight)
  if (marketInsights.averagePrice) {
    estimates.push(marketInsights.averagePrice);
    weights.push(0.1);
    console.log(`🏠 Market Average: £${marketInsights.averagePrice.toLocaleString()}`);
  }

  // Calculate weighted average
  if (estimates.length === 0) {
    return null;
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const weightedSum = estimates.reduce((sum, estimate, index) => sum + (estimate * weights[index]), 0);
  const finalEstimate = Math.round(weightedSum / totalWeight);
  
  console.log(`\n🎯 Final Current Value Estimate: £${finalEstimate.toLocaleString()}`);
  
  return finalEstimate;
}

async function testRealDataEstimation() {
  console.log('🧪 Testing Current Value Estimation with Real Data\n');
  
  // Get a sample property
  const property = await getSampleProperty();
  if (!property) {
    console.log('❌ No sample property found');
    return;
  }

  console.log('📋 Sample Property Data:');
  console.log(`   Address: ${property.paon} ${property.street}, ${property.town_city}`);
  console.log(`   Postcode: ${property.postcode}`);
  console.log(`   Property Type: ${property.propertyTypeLabel}`);
  console.log(`   Last Sold: £${property.price.toLocaleString()} on ${property.dateOfTransfer}`);
  console.log(`   Duration: ${property.durationLabel}`);
  console.log(`   Transaction: ${property.transactionCategoryLabel}\n`);

  // Get HPI data for the region
  const region = property.county || 'England';
  console.log(`📊 Fetching HPI data for region: ${region}`);
  const hpiData = await getHPIData(region);
  console.log(`   Found ${hpiData.length} HPI data points`);
  if (hpiData.length > 0) {
    console.log(`   Latest HPI: ${hpiData[0].hpi_value} (${hpiData[0].date})`);
    console.log(`   Oldest HPI: ${hpiData[hpiData.length - 1].hpi_value} (${hpiData[hpiData.length - 1].date})`);
  }

  // Get market insights
  console.log(`\n🏠 Fetching market insights for postcode area: ${property.postcode.substring(0, 4)}`);
  const marketInsights = await getMarketInsights(property.postcode);
  console.log(`   Market Average Price: £${marketInsights.averagePrice.toLocaleString()}`);
  console.log(`   Market Price/Sqm: £${marketInsights.averagePricePerSqm.toLocaleString()}`);
  console.log(`   Market Price/Bedroom: £${marketInsights.averagePricePerBedroom.toLocaleString()}`);

  // Create sold prices data
  const soldPrices = [{
    price: property.price,
    date: property.dateOfTransfer,
    property_type: property.propertyType,
    new_build: property.old_new === 'Y',
    estate_type: property.transactionCategory,
    transaction_type: property.transactionCategory
  }];

  // Estimate property characteristics (since we don't have EPC data)
  const estimatedPropertyData = {
    address: `${property.paon} ${property.street}`,
    bedrooms: property.propertyType === 'F' ? 2 : property.propertyType === 'T' ? 3 : 4, // Estimate based on type
    floor_area_m2: property.propertyType === 'F' ? 65 : property.propertyType === 'T' ? 85 : 110, // Estimate
    property_type: property.propertyTypeLabel,
    epc_rating: 'C' // Default estimate
  };

  console.log(`\n🏠 Estimated Property Characteristics:`);
  console.log(`   Bedrooms: ${estimatedPropertyData.bedrooms}`);
  console.log(`   Floor Area: ${estimatedPropertyData.floor_area_m2} sqm`);
  console.log(`   EPC Rating: ${estimatedPropertyData.epc_rating}`);

  console.log('\n🔢 Calculation Methods:\n');
  
  const currentValueEstimate = calculateCurrentValueEstimate(
    estimatedPropertyData,
    soldPrices,
    hpiData,
    marketInsights
  );
  
  if (currentValueEstimate) {
    const priceChange = ((currentValueEstimate - property.price) / property.price) * 100;
    const yearsSinceSale = (new Date() - new Date(property.dateOfTransfer)) / (1000 * 60 * 60 * 24 * 365);
    
    console.log(`\n📈 Price Change Analysis:`);
    console.log(`   Last Sold: £${property.price.toLocaleString()} (${property.dateOfTransfer})`);
    console.log(`   Current Estimate: £${currentValueEstimate.toLocaleString()}`);
    console.log(`   Time Since Sale: ${yearsSinceSale.toFixed(1)} years`);
    console.log(`   Total Change: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%`);
    console.log(`   Annual Growth: ${(priceChange / yearsSinceSale).toFixed(1)}% per year`);
    console.log(`   Absolute Change: £${(currentValueEstimate - property.price).toLocaleString()}`);
    
    console.log(`\n💡 Investment Insights:`);
    if (priceChange > 100) {
      console.log(`   ✅ Property has more than doubled in value (${priceChange.toFixed(1)}%)`);
    } else if (priceChange > 50) {
      console.log(`   📈 Property has appreciated significantly (${priceChange.toFixed(1)}%)`);
    } else if (priceChange > 20) {
      console.log(`   📊 Property has appreciated moderately (${priceChange.toFixed(1)}%)`);
    } else if (priceChange > 0) {
      console.log(`   📈 Property has appreciated slightly (${priceChange.toFixed(1)}%)`);
    } else {
      console.log(`   ⚠️  Property has declined in value (${priceChange.toFixed(1)}%)`);
    }
  }
  
  console.log('\n✅ Real data estimation test completed!');
}

testRealDataEstimation().catch(console.error); 