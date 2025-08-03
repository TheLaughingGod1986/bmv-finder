const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  },
  tls: { rejectUnauthorized: false }
});

async function testSearchAfterPagination() {
  const searchTerm = 'SS9 5EL';
  const pageSize = 5;
  
  console.log(`Testing search_after pagination for: ${searchTerm}`);
  console.log('='.repeat(50));

  try {
    // First page
    console.log('\n📄 Page 1:');
    const page1Result = await esClient.search({
      index: 'properties',
      size: 0,
      query: {
        term: { 'postcode.keyword': searchTerm }
      },
      aggs: {
        deduped_properties: {
          composite: {
            size: pageSize,
            sources: [
              {
                address: {
                  terms: {
                    script: {
                      source: "((doc.containsKey('paon.keyword') && !doc['paon.keyword'].empty ? doc['paon.keyword'].value : '') + '|' + (doc.containsKey('street.keyword') && !doc['street.keyword'].empty ? doc['street.keyword'].value : '') + '|' + (doc.containsKey('postcode.keyword') && !doc['postcode.keyword'].empty ? doc['postcode.keyword'].value : '')).toLowerCase()",
                      lang: 'painless'
                    }
                  }
                }
              }
            ]
          },
          aggs: {
            most_recent_sale: {
              top_hits: {
                size: 1,
                sort: [
                  { dateOfTransfer: { order: 'desc' } }
                ]
              }
            }
          }
        }
      }
    });

    const page1Buckets = page1Result.aggregations?.deduped_properties?.buckets || [];
    const page1AfterKey = page1Result.aggregations?.deduped_properties?.after_key;
    
    console.log(`Found ${page1Buckets.length} properties`);
    page1Buckets.forEach((bucket, i) => {
      const property = bucket.most_recent_sale.hits.hits[0]._source;
      console.log(`  ${i + 1}. ${property.paon} ${property.street} - £${property.price.toLocaleString()}`);
    });
    
    console.log(`After key:`, page1AfterKey);

    if (page1AfterKey) {
      // Second page
      console.log('\n📄 Page 2:');
      const page2Result = await esClient.search({
        index: 'properties',
        size: 0,
        query: {
          term: { 'postcode.keyword': searchTerm }
        },
        aggs: {
          deduped_properties: {
            composite: {
              size: pageSize,
              after: page1AfterKey,
              sources: [
                {
                  address: {
                    terms: {
                      script: {
                        source: "((doc.containsKey('paon.keyword') && !doc['paon.keyword'].empty ? doc['paon.keyword'].value : '') + '|' + (doc.containsKey('street.keyword') && !doc['street.keyword'].empty ? doc['street.keyword'].value : '') + '|' + (doc.containsKey('postcode.keyword') && !doc['postcode.keyword'].empty ? doc['postcode.keyword'].value : '')).toLowerCase()",
                        lang: 'painless'
                      }
                    }
                  }
                }
              ]
            },
            aggs: {
              most_recent_sale: {
                top_hits: {
                  size: 1,
                  sort: [
                    { dateOfTransfer: { order: 'desc' } }
                  ]
                }
              }
            }
          }
        }
      });

      const page2Buckets = page2Result.aggregations?.deduped_properties?.buckets || [];
      const page2AfterKey = page2Result.aggregations?.deduped_properties?.after_key;
      
      console.log(`Found ${page2Buckets.length} properties`);
      page2Buckets.forEach((bucket, i) => {
        const property = bucket.most_recent_sale.hits.hits[0]._source;
        console.log(`  ${i + 1}. ${property.paon} ${property.street} - £${property.price.toLocaleString()}`);
      });
      
      console.log(`After key:`, page2AfterKey);
      
      // Verify no duplicates between pages
      const page1Addresses = page1Buckets.map(bucket => bucket.key.address);
      const page2Addresses = page2Buckets.map(bucket => bucket.key.address);
      const duplicates = page1Addresses.filter(addr => page2Addresses.includes(addr));
      
      console.log('\n✅ Verification:');
      console.log(`Page 1 addresses: ${page1Addresses.length}`);
      console.log(`Page 2 addresses: ${page2Addresses.length}`);
      console.log(`Duplicates between pages: ${duplicates.length}`);
      
      if (duplicates.length === 0) {
        console.log('✅ SUCCESS: No duplicates between pages!');
      } else {
        console.log('❌ FAILURE: Found duplicates between pages!');
        console.log('Duplicates:', duplicates);
      }
    } else {
      console.log('No after_key returned, pagination not needed');
    }

  } catch (error) {
    console.error('Error testing search_after pagination:', error);
  }
}

testSearchAfterPagination().catch(console.error); 