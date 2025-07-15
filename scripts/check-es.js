const { esClient } = require('../src/lib/esClient.cjs.js');

async function checkElasticsearch() {
  try {
    console.log('Checking Elasticsearch connection...');
    
    // Test connection
    const info = await esClient.info();
    console.log(`✅ Connected to Elasticsearch: ${info.version.number}\n`);
    
    // Get all indices
    const indices = await esClient.cat.indices({ format: 'json' });
    
    console.log('📋 Available indices:');
    
    // Filter out system indices and sort by document count
    const userIndices = indices
      .filter(idx => !idx.index.startsWith('.'))
      .sort((a, b) => parseInt(b['docs.count']) - parseInt(a['docs.count']));
    
    for (const index of userIndices) {
      const docsCount = parseInt(index['docs.count']);
      const storeSize = index['store.size'];
      console.log(`  - ${index.index}: ${docsCount.toLocaleString()} documents`);
    }
    
    // Check for required BMV Finder indices
    console.log('\n🔍 BMV Finder Index Status:');
    
    const requiredIndices = ['properties', 'house_price_index', 'recent_sales'];
    const existingIndices = indices.map(idx => idx.index);
    
    for (const requiredIndex of requiredIndices) {
      if (existingIndices.includes(requiredIndex)) {
        const indexData = indices.find(idx => idx.index === requiredIndex);
        const docsCount = parseInt(indexData['docs.count']);
        console.log(`✅ ${requiredIndex}: ${docsCount.toLocaleString()} documents`);
      } else {
        console.log(`❌ ${requiredIndex} index does not exist yet`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error connecting to Elasticsearch:', error.message);
  }
}

checkElasticsearch(); 