const { esClient } = require('../src/lib/esClient.cjs.js');

async function checkIndicesDetailed() {
  try {
    console.log('🔍 Checking Elasticsearch indices with detailed information...\n');
    
    // Get all indices
    const indices = await esClient.cat.indices({ format: 'json' });
    
    console.log('📊 INDEX DETAILS:');
    console.log('='.repeat(80));
    
    let totalDocs = 0;
    let totalSize = 0;
    
    // Sort indices by document count (descending)
    const sortedIndices = indices.sort((a, b) => parseInt(b['docs.count']) - parseInt(a['docs.count']));
    
    for (const index of sortedIndices) {
      const docsCount = parseInt(index['docs.count']);
      const storeSize = index['store.size'];
      const indexName = index.index;
      
      // Skip system indices unless they have data
      if (indexName.startsWith('.') && docsCount === 0) {
        continue;
      }
      
      // Highlight BMV Finder core indices
      const isCoreIndex = 
        indexName === 'properties' ||
        indexName === 'house_price_index' ||
        indexName === 'recent_sales';
      
      const prefix = isCoreIndex ? '🎯' : '📁';
      const suffix = isCoreIndex ? ' (CORE)' : '';
      
      console.log(`${prefix} ${indexName.padEnd(30)} | 📄 ${docsCount.toString().padStart(10)} docs | 💾 ${storeSize.padStart(10)}${suffix}`);
      
      totalDocs += docsCount;
      totalSize += parseFloat(storeSize.replace(/[a-zA-Z]/g, ''));
    }
    
    console.log('='.repeat(80));
    console.log(`📈 TOTAL: ${totalDocs.toString().padStart(10)} documents | 💾 ${totalSize.toFixed(1)}gb\n`);
    
    // Show BMV Finder core indices separately
    console.log('🎯 BMV FINDER CORE INDICES:');
    console.log('-'.repeat(50));
    
    const coreIndices = ['properties', 'house_price_index', 'recent_sales'];
    for (const coreIndex of coreIndices) {
      const found = sortedIndices.find(idx => idx.index === coreIndex);
      if (found) {
        const docsCount = parseInt(found['docs.count']);
        const storeSize = found['store.size'];
        console.log(`✅ ${coreIndex.padEnd(20)} | ${docsCount.toString().padStart(10)} docs | ${storeSize.padStart(10)}`);
      } else {
        console.log(`❌ ${coreIndex.padEnd(20)} | NOT FOUND`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking indices:', error.message);
  }
}

checkIndicesDetailed(); 