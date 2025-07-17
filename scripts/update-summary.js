const { esClient } = require('../src/lib/esClient.cjs.js');
const fs = require('fs');

async function updateSummary() {
  try {
    console.log('Getting current Elasticsearch counts...');
    
    // Get counts from all indices
    const [propertiesCount, recentSalesCount, hpiCount] = await Promise.all([
      esClient.count({ index: 'properties-enhanced' }), // Use enhanced index for property count
      esClient.count({ index: 'recent_sales' }),
      esClient.count({ index: 'house_price_index' })
    ]);

    const summary = {
      lastUpdate: new Date().toISOString(),
      propertiesCount: propertiesCount.count,
      recentSalesCount: recentSalesCount.count,
      hpiCount: hpiCount.count,
      updateStatus: 'complete',
      notes: `Properties: ${propertiesCount.count.toLocaleString()}, Recent Sales: ${recentSalesCount.count.toLocaleString()}, HPI: ${hpiCount.count.toLocaleString()}`
    };

    // Write to summary file
    fs.writeFileSync('public/last-data-update.json', JSON.stringify(summary, null, 2));
    
    console.log('✅ Summary updated:', summary);
    console.log('📊 Current counts:');
    console.log(`   Properties: ${propertiesCount.count.toLocaleString()}`);
    console.log(`   Recent Sales: ${recentSalesCount.count.toLocaleString()}`);
    console.log(`   HPI Records: ${hpiCount.count.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error updating summary:', error);
    process.exit(1);
  }
}

updateSummary(); 