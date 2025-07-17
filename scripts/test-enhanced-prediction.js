const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test the enhanced prediction model
async function testEnhancedPrediction() {
  console.log('🔮 Testing Enhanced Property Prediction Model\n');

  const testProperties = [
    { postcode: 'NE5 2PR', number: '21' },
    { postcode: 'SE3 9FW', number: '50' },
    { postcode: 'M1 1AA', number: '10' }
  ];

  for (const property of testProperties) {
    console.log(`📍 Testing property: ${property.number} ${property.postcode}`);
    console.log('─'.repeat(50));

    try {
      // Test the enhanced prediction API
      const response = await fetch(`http://localhost:3000/api/enhanced-prediction?postcode=${encodeURIComponent(property.postcode)}&number=${encodeURIComponent(property.number)}`);
      
      if (!response.ok) {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      
      // Display results
      console.log(`🏠 Property Type: ${data.features.propertyType}`);
      console.log(`🛏️  Bedrooms: ${data.features.bedrooms || 'Unknown'}`);
      console.log(`📏 Floor Area: ${data.features.floorArea ? `${data.features.floorArea}m²` : 'Unknown'}`);
      console.log(`⚡ EPC Rating: ${data.features.epcRating || 'Unknown'}`);
      
      if (data.features.lastSoldPrice) {
        console.log(`💰 Last Sold: £${data.features.lastSoldPrice.toLocaleString()} (${data.features.lastSoldDate ? new Date(data.features.lastSoldDate).toLocaleDateString() : 'Unknown date'})`);
      }

      console.log('\n📊 Enhanced Prediction Results:');
      console.log(`🎯 Predicted Value: £${data.prediction.predictedValue.toLocaleString()}`);
      console.log(`🛡️  Confidence: ${Math.round(data.prediction.confidence * 100)}%`);
      console.log(`📈 Range: £${data.prediction.predictionRange.low.toLocaleString()} - £${data.prediction.predictionRange.high.toLocaleString()}`);

      // Show factor contributions
      console.log('\n🔍 Prediction Factors:');
      Object.entries(data.prediction.factors).forEach(([factor, value]) => {
        const factorName = factor.replace(/([A-Z])/g, ' $1').trim();
        console.log(`  • ${factorName}: £${value.toLocaleString()}`);
      });

      // Show breakdown
      console.log('\n📋 Value Breakdown:');
      console.log(`  • Base Value: £${data.prediction.breakdown.baseValue.toLocaleString()}`);
      console.log(`  • HPI Multiplier: ${data.prediction.breakdown.hpiMultiplier.toFixed(3)}x`);
      
      if (data.prediction.breakdown.energyEfficiencyBonus !== 0) {
        const bonus = data.prediction.breakdown.energyEfficiencyBonus;
        console.log(`  • Energy Efficiency: ${bonus > 0 ? '+' : ''}£${bonus.toLocaleString()}`);
      }
      
      if (data.prediction.breakdown.marketTrendAdjustment !== 0) {
        const trend = data.prediction.breakdown.marketTrendAdjustment;
        console.log(`  • Market Trend: ${trend > 0 ? '+' : ''}£${trend.toLocaleString()}`);
      }

      // Show future projections
      console.log('\n🚀 Future Projections:');
      Object.entries(data.prediction.futureProjections).forEach(([period, value]) => {
        const periodName = period.replace(/([A-Z])/g, ' $1').trim();
        const growth = data.features.lastSoldPrice ? 
          ((value - data.features.lastSoldPrice) / data.features.lastSoldPrice * 100) : 0;
        console.log(`  • ${periodName}: £${value.toLocaleString()} (${growth > 0 ? '+' : ''}${growth.toFixed(1)}%)`);
      });

      // Show risk factors and recommendations
      if (data.prediction.riskFactors.length > 0) {
        console.log('\n⚠️  Risk Factors:');
        data.prediction.riskFactors.forEach(risk => {
          console.log(`  • ${risk}`);
        });
      }

      if (data.prediction.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        data.prediction.recommendations.forEach(rec => {
          console.log(`  • ${rec}`);
        });
      }

      // Data quality metrics
      console.log('\n📊 Data Quality:');
      console.log(`  • HPI Data Points: ${data.features.hpiDataPoints}`);
      console.log(`  • Transaction Volume: ${data.features.transactionVolume}`);

      console.log('\n' + '='.repeat(60) + '\n');

    } catch (error) {
      console.error(`❌ Error testing ${property.number} ${property.postcode}:`, error.message);
      console.log('\n' + '='.repeat(60) + '\n');
    }
  }
}

// Compare with basic prediction
async function compareWithBasicPrediction() {
  console.log('🔄 Comparing Enhanced vs Basic Prediction\n');

  const testProperty = { postcode: 'NE5 2PR', number: '21' };

  try {
    // Get basic prediction (current system)
    const basicResponse = await fetch(`http://localhost:3000/api/property-analysis?postcode=${encodeURIComponent(testProperty.postcode)}&number=${encodeURIComponent(testProperty.number)}`);
    const basicData = await basicResponse.json();

    // Get enhanced prediction
    const enhancedResponse = await fetch(`http://localhost:3000/api/enhanced-prediction?postcode=${encodeURIComponent(testProperty.postcode)}&number=${encodeURIComponent(testProperty.number)}`);
    const enhancedData = await enhancedResponse.json();

    console.log(`📍 Property: ${testProperty.number} ${testProperty.postcode}\n`);

    console.log('📊 Comparison Results:');
    console.log('─'.repeat(40));
    
    console.log(`Basic Prediction:`);
    console.log(`  • Current Value: £${basicData.deal_metrics.current_value_estimate?.toLocaleString() || 'N/A'}`);
    console.log(`  • HPI Adjusted: £${basicData.deal_metrics.hpi_adjusted_value?.toLocaleString() || 'N/A'}`);
    console.log(`  • Deal Score: ${basicData.deal_metrics.deal_score}/100`);
    
    console.log(`\nEnhanced Prediction:`);
    console.log(`  • Predicted Value: £${enhancedData.prediction.predictedValue.toLocaleString()}`);
    console.log(`  • Confidence: ${Math.round(enhancedData.prediction.confidence * 100)}%`);
    console.log(`  • Range: £${enhancedData.prediction.predictionRange.low.toLocaleString()} - £${enhancedData.prediction.predictionRange.high.toLocaleString()}`);
    
    // Calculate difference
    const basicValue = basicData.deal_metrics.current_value_estimate || basicData.deal_metrics.hpi_adjusted_value || 0;
    const enhancedValue = enhancedData.prediction.predictedValue;
    
    if (basicValue > 0) {
      const difference = ((enhancedValue - basicValue) / basicValue * 100);
      console.log(`\n📈 Difference: ${difference > 0 ? '+' : ''}${difference.toFixed(1)}%`);
      
      if (Math.abs(difference) > 10) {
        console.log(`💡 The enhanced model provides a significantly different prediction`);
        if (enhancedData.prediction.confidence > 0.7) {
          console.log(`✅ Enhanced model has high confidence (${Math.round(enhancedData.prediction.confidence * 100)}%)`);
        }
      }
    }

    console.log('\n🎯 Key Improvements:');
    console.log('• Multi-factor weighted analysis');
    console.log('• Energy efficiency adjustments');
    console.log('• Market trend analysis');
    console.log('• Economic factor consideration');
    console.log('• Confidence scoring');
    console.log('• Risk factor identification');
    console.log('• Future projections');

  } catch (error) {
    console.error('❌ Error in comparison:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Enhanced Property Prediction Model Test Suite\n');
  
  await testEnhancedPrediction();
  await compareWithBasicPrediction();
  
  console.log('✅ Test suite completed!');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEnhancedPrediction, compareWithBasicPrediction }; 