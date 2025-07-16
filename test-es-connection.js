const { Client } = require('@elastic/elasticsearch');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing Elasticsearch connection...\n');
  
  // Test different configurations
  const configs = [
    {
      name: 'HTTP Local',
      config: {
        node: 'http://localhost:9201',
        auth: {
          username: 'elastic',
          password: 'Plymouth.09'
        }
      }
    },
    {
      name: 'HTTP Docker Internal',
      config: {
        node: 'http://host.docker.internal:9201',
        auth: {
          username: 'elastic',
          password: 'Plymouth.09'
        }
      }
    },
    {
      name: 'HTTPS Local (skip cert)',
      config: {
        node: 'https://localhost:9201',
        auth: {
          username: 'elastic',
          password: 'Plymouth.09'
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'HTTP Local (no auth)',
      config: {
        node: 'http://localhost:9201'
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`Testing: ${name}`);
    try {
      const client = new Client(config);
      const info = await client.info();
      console.log(`✅ ${name}: Connected successfully!`);
      console.log(`   Version: ${info.version.number}`);
      console.log(`   Cluster: ${info.cluster_name}\n`);
      
      // Test indices
      const indices = await client.cat.indices({ format: 'json' });
      console.log(`   Indices found: ${indices.length}`);
      indices.forEach(idx => {
        console.log(`   - ${idx.index}: ${idx['docs.count']} docs`);
      });
      console.log('');
      
      await client.close();
      return; // Success, exit
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}\n`);
    }
  }
  
  console.log('❌ All connection attempts failed');
}

testConnection(); 