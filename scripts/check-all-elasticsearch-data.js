const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  cloud: {
    id: process.env.ES_CLOUD_ID,
  },
  auth: {
    apiKey: process.env.ES_API_KEY,
  },
});

async function checkAllElasticsearchData() {
  try {
    console.log('🔍 Checking all Elasticsearch data...\n');

    // Get all indices
    const indices = await client.cat.indices({ format: 'json' });
    
    console.log(`📊 Found ${indices.length} indices in your Elasticsearch cluster:\n`);

    for (const index of indices) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📁 Index: ${index.index}`);
      console.log(`📈 Documents: ${index['docs.count']}`);
      console.log(`💾 Size: ${index['store.size']}`);
      console.log(`🏷️  Status: ${index.health} (${index.status})`);
      
      // Get mapping for this index
      try {
        const mapping = await client.indices.getMapping({ index: index.index });
        const properties = mapping[index.index].mappings.properties;
        
        console.log(`\n🗺️  Fields (${Object.keys(properties).length}):`);
        Object.keys(properties).slice(0, 10).forEach(field => {
          const fieldType = properties[field].type || 'object';
          console.log(`   - ${field}: ${fieldType}`);
        });
        
        if (Object.keys(properties).length > 10) {
          console.log(`   ... and ${Object.keys(properties).length - 10} more fields`);
        }

        // Get sample data for each index
        const sample = await client.search({
          index: index.index,
          size: 1
        });

        if (sample.hits.hits.length > 0) {
          const doc = sample.hits.hits[0]._source;
          console.log(`\n📋 Sample document structure:`);
          console.log(JSON.stringify(doc, null, 2));
        }

      } catch (mappingError) {
        console.log(`❌ Could not get mapping for ${index.index}: ${mappingError.message}`);
      }
    }

    // Get cluster info
    const clusterInfo = await client.info();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏢 Cluster Information:`);
    console.log(`   Name: ${clusterInfo.cluster_name}`);
    console.log(`   Version: ${clusterInfo.version.number}`);
    console.log(`   Lucene Version: ${clusterInfo.version.lucene_version}`);

    // Get cluster stats
    const clusterStats = await client.cluster.stats();
    console.log(`\n📊 Cluster Statistics:`);
    console.log(`   Total Documents: ${clusterStats.indices.docs.count}`);
    console.log(`   Total Size: ${clusterStats.indices.store.size_in_bytes}`);
    console.log(`   Number of Indices: ${clusterStats.indices.count}`);
    console.log(`   Number of Shards: ${clusterStats.indices.shards.total}`);

    console.log(`\n✅ All Elasticsearch data check completed successfully`);

  } catch (error) {
    console.error('❌ Error checking Elasticsearch data:', error.message);
    if (error.meta) {
      console.error('Details:', error.meta.body);
    }
  } finally {
    await client.close();
  }
}

checkAllElasticsearchData(); 