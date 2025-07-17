const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testHPICalculation() {
  console.log('🔍 Testing HPI Calculation for NE5 2PR\n');

  try {
    // Get property analysis data
    const response = await fetch('http://localhost:3000/api/property-analysis?postcode=NE5%202PR&number=21');
    const data = await response.json();

    console.log('📊 Property Analysis Results:');
    console.log(`   Last Sold Price: £${data.deal_metrics.last_sold_price?.toLocaleString()}`);
    console.log(`   Last Sold Date: ${data.sold_prices[0]?.date}`);
    console.log(`   HPI Adjusted Value: £${data.deal_metrics.hpi_adjusted_value?.toLocaleString()}`);
    console.log(`   Current Value Estimate: £${data.deal_metrics.current_value_estimate?.toLocaleString()}`);
    console.log('');

    console.log('📈 HPI Data Analysis:');
    const hpiData = data.hpi_data;
    
    // Filter for regional data (not England)
    const regionalHPI = hpiData.filter(hpi => hpi.region !== 'England');
    console.log(`   Total HPI records: ${hpiData.length}`);
    console.log(`   Regional HPI records: ${regionalHPI.length}`);
    console.log(`   England HPI records: ${hpiData.length - regionalHPI.length}`);
    console.log('');

    // Show recent HPI data
    console.log('📅 Recent HPI Data (Regional):');
    regionalHPI.slice(0, 10).forEach(hpi => {
      console.log(`   ${hpi.date}: ${hpi.hpi_value} (${hpi.region})`);
    });
    console.log('');

    // Manual calculation
    const soldDate = '2024-02-15'; // Approximate sale date
    const soldHPI = regionalHPI.find(hpi => hpi.date >= '2024-02') || regionalHPI[regionalHPI.length - 1];
    const currentHPI = regionalHPI[0];

    if (soldHPI && currentHPI) {
      console.log('🧮 Manual HPI Calculation:');
      console.log(`   Sold HPI: ${soldHPI.hpi_value} (${soldHPI.date})`);
      console.log(`   Current HPI: ${currentHPI.hpi_value} (${currentHPI.date})`);
      
      const hpiMultiplier = currentHPI.hpi_value / soldHPI.hpi_value;
      const expectedValue = data.deal_metrics.last_sold_price * hpiMultiplier;
      
      console.log(`   HPI Multiplier: ${hpiMultiplier.toFixed(4)}`);
      console.log(`   Expected Value: £${expectedValue.toLocaleString()}`);
      console.log(`   Growth: ${((hpiMultiplier - 1) * 100).toFixed(2)}%`);
      console.log(`   Absolute Growth: £${(expectedValue - data.deal_metrics.last_sold_price).toLocaleString()}`);
    }

    // Check if there's data for February 2024
    const feb2024HPI = regionalHPI.find(hpi => hpi.date.startsWith('2024-02'));
    console.log('');
    console.log('🔍 February 2024 HPI Data:');
    if (feb2024HPI) {
      console.log(`   Found: ${feb2024HPI.hpi_value} (${feb2024HPI.date})`);
    } else {
      console.log('   ❌ No February 2024 data found');
      console.log('   Available 2024 dates:');
      regionalHPI.filter(hpi => hpi.date.startsWith('2024')).slice(0, 5).forEach(hpi => {
        console.log(`     ${hpi.date}: ${hpi.hpi_value}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testHPICalculation(); 