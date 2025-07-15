const fetch = require('node-fetch');

// Mock data to test current value estimation
const mockPropertyData = {
  property_info: {
    address: "21 Test Street",
    bedrooms: 3,
    epc_rating: "C",
    floor_area_m2: 85,
    property_type: "Terraced house"
  },
  sold_prices: [
    {
      price: 180000,
      date: "2022-06-15",
      property_type: "Terraced house"
    }
  ],
  hpi_data: [
    {
      date: "2024-01-01",
      hpi_value: 125.0,
      hpi_change: 2.1,
      region: "North East"
    },
    {
      date: "2022-06-01",
      hpi_value: 110.0,
      hpi_change: 1.5,
      region: "North East"
    }
  ],
  market_insights: {
    averagePricePerSqm: 2500,
    averagePricePerBedroom: 70000,
    averagePrice: 200000
  }
};

function calculateCurrentValueEstimate(propertyData, soldPrices, hpiData, marketInsights) {
  const estimates = [];
  const weights = [];

  // Method 1: HPI-adjusted value (40% weight)
  if (soldPrices.length > 0 && hpiData.length > 0) {
    const lastSoldPrice = soldPrices[0].price;
    const soldHPI = hpiData.find(hpi => new Date(hpi.date) >= new Date(soldPrices[0].date)) || hpiData[hpiData.length - 1];
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

function testCurrentValueEstimation() {
  console.log('🧪 Testing Current Value Estimation Algorithm\n');
  
  const { property_info, sold_prices, hpi_data, market_insights } = mockPropertyData;
  
  console.log('📋 Input Data:');
  console.log(`   Property: ${property_info.address}`);
  console.log(`   Bedrooms: ${property_info.bedrooms}`);
  console.log(`   Floor Area: ${property_info.floor_area_m2} sqm`);
  console.log(`   EPC Rating: ${property_info.epc_rating}`);
  console.log(`   Last Sold: £${sold_prices[0].price.toLocaleString()} on ${sold_prices[0].date}`);
  console.log(`   Current HPI: ${hpi_data[0].hpi_value} (${hpi_data[0].hpi_change > 0 ? '+' : ''}${hpi_data[0].hpi_change}%)`);
  console.log(`   Market Average: £${market_insights.averagePrice.toLocaleString()}`);
  console.log(`   Market Price/Sqm: £${market_insights.averagePricePerSqm.toLocaleString()}`);
  console.log(`   Market Price/Bedroom: £${market_insights.averagePricePerBedroom.toLocaleString()}\n`);
  
  console.log('🔢 Calculation Methods:\n');
  
  const currentValueEstimate = calculateCurrentValueEstimate(
    property_info,
    sold_prices,
    hpi_data,
    market_insights
  );
  
  if (currentValueEstimate) {
    const priceChange = ((currentValueEstimate - sold_prices[0].price) / sold_prices[0].price) * 100;
    console.log(`\n📈 Price Change Analysis:`);
    console.log(`   Last Sold: £${sold_prices[0].price.toLocaleString()}`);
    console.log(`   Current Estimate: £${currentValueEstimate.toLocaleString()}`);
    console.log(`   Change: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%`);
    console.log(`   Absolute Change: £${(currentValueEstimate - sold_prices[0].price).toLocaleString()}`);
    
    console.log(`\n💡 Investment Insights:`);
    if (priceChange > 10) {
      console.log(`   ✅ Property has appreciated significantly (${priceChange.toFixed(1)}%)`);
    } else if (priceChange > 0) {
      console.log(`   📈 Property has appreciated moderately (${priceChange.toFixed(1)}%)`);
    } else if (priceChange > -5) {
      console.log(`   📊 Property value is relatively stable (${priceChange.toFixed(1)}%)`);
    } else {
      console.log(`   ⚠️  Property has declined in value (${priceChange.toFixed(1)}%)`);
    }
  }
  
  console.log('\n✅ Current value estimation test completed!');
}

testCurrentValueEstimation(); 