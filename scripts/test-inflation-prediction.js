const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test the enhanced prediction model with inflation
async function testInflationPrediction() {
  console.log('🔮 Testing Enhanced Property Prediction Model with Inflation\n');

  const testProperties = [
    { postcode: 'NE5 2PR', number: '21', description: 'Recent sale (2024)' },
    { postcode: 'SE3 9FW', number: '50', description: 'Older sale (2019)' },
    { postcode: 'M1 1AA', number: '10', description: 'Very old sale (2010)' }
  ];

  for (const property of testProperties) {
    console.log(`📍 Testing property: ${property.number} ${property.postcode}`);
    console.log(`📝 ${property.description}`);
    console.log('─'.repeat(60));

    try {
      // Test the enhanced prediction API
      const response = await fetch(`http://localhost:3000/api/enhanced-prediction?postcode=${encodeURIComponent(property.postcode)}&number=${encodeURIComponent(property.number)}`);
      
      if (!response.ok) {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Enhanced prediction successful!');
        console.log('');
        
        // Display prediction results
        console.log('📊 PREDICTION RESULTS:');
        console.log(`   Predicted Value: £${data.prediction.predictedValue.toLocaleString()}`);
        console.log(`   Confidence: ${(data.prediction.confidence * 100).toFixed(1)}%`);
        console.log(`   Prediction Range: £${data.prediction.predictionRange.low.toLocaleString()} - £${data.prediction.predictionRange.high.toLocaleString()}`);
        console.log('');
        
        // Display inflation metrics
        if (data.prediction.inflationMetrics) {
          console.log('💰 INFLATION ANALYSIS:');
          console.log(`   Years since sale: ${data.prediction.inflationMetrics.yearsSinceSale}`);
          console.log(`   Cumulative inflation: ${data.prediction.inflationMetrics.cumulativeInflation.toFixed(1)}%`);
          console.log(`   Nominal growth: ${data.prediction.inflationMetrics.nominalGrowth.toFixed(1)}%`);
          console.log(`   Real growth: ${data.prediction.inflationMetrics.realGrowth.toFixed(1)}%`);
          console.log(`   Growth type: ${data.prediction.inflationMetrics.growthType}`);
          console.log(`   Explanation: ${data.prediction.inflationMetrics.growthExplanation}`);
          console.log('');
        }
        
        // Display breakdown
        console.log('🔍 VALUE BREAKDOWN:');
        console.log(`   Base value: £${data.prediction.breakdown.baseValue.toLocaleString()}`);
        console.log(`   HPI multiplier: ${data.prediction.breakdown.hpiMultiplier.toFixed(3)}`);
        console.log(`   Energy efficiency bonus: £${data.prediction.breakdown.energyEfficiencyBonus.toLocaleString()}`);
        console.log(`   Market trend adjustment: £${data.prediction.breakdown.marketTrendAdjustment.toLocaleString()}`);
        console.log(`   Inflation adjustment: £${data.prediction.breakdown.inflationAdjustment.toLocaleString()}`);
        console.log('');
        
        // Display future projections
        console.log('🚀 FUTURE PROJECTIONS:');
        console.log(`   1 year: £${data.prediction.futureProjections.oneYear.toLocaleString()}`);
        console.log(`   3 years: £${data.prediction.futureProjections.threeYear.toLocaleString()}`);
        console.log(`   5 years: £${data.prediction.futureProjections.fiveYear.toLocaleString()}`);
        console.log(`   10 years: £${data.prediction.futureProjections.tenYear.toLocaleString()}`);
        console.log('');
        
        // Display risk factors
        if (data.prediction.riskFactors.length > 0) {
          console.log('⚠️  RISK FACTORS:');
          data.prediction.riskFactors.forEach(factor => {
            console.log(`   • ${factor}`);
          });
          console.log('');
        }
        
        // Display recommendations
        if (data.prediction.recommendations.length > 0) {
          console.log('💡 RECOMMENDATIONS:');
          data.prediction.recommendations.forEach(rec => {
            console.log(`   • ${rec}`);
          });
          console.log('');
        }
        
      } else {
        console.log(`❌ Prediction failed: ${data.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    console.log('='.repeat(60));
    console.log('');
  }
}

// Run the test
testInflationPrediction().catch(console.error); 