const { esClient } = require('../src/lib/esClient.cjs.js');

async function getRealCounts() {
  try {
    console.log('Getting real counts from Elasticsearch...');
    
    // Get recent sales (last 12 months)
    const recentSalesQuery = {
      size: 0,
      aggs: {
        recent_sales: {
          filter: {
            range: {
              year: {
                gte: 2024
              }
            }
          }
        }
      }
    };

    // Get HPI records (properties with HPI data)
    const hpiQuery = {
      size: 0,
      aggs: {
        hpi_records: {
          filter: {
            exists: {
              field: "hpi_value"
            }
          }
        }
      }
    };

    // Get year distribution
    const yearQuery = {
      size: 0,
      aggs: {
        years: {
          terms: {
            field: "year",
            size: 20
          }
        }
      }
    };

    const [recentSalesResult, hpiResult, yearResult] = await Promise.all([
      esClient.search({ index: 'properties-enhanced', body: recentSalesQuery }),
      esClient.search({ index: 'properties-enhanced', body: hpiQuery }),
      esClient.search({ index: 'properties-enhanced', body: yearQuery })
    ]);

    const recentSalesCount = recentSalesResult.aggregations?.recent_sales?.doc_count || 0;
    const hpiCount = hpiResult.aggregations?.hpi_records?.doc_count || 0;
    const yearBuckets = yearResult.aggregations?.years?.buckets || [];

    console.log('📊 Real counts:');
    console.log(`   Recent Sales (2024+): ${recentSalesCount.toLocaleString()}`);
    console.log(`   HPI Records: ${hpiCount.toLocaleString()}`);
    console.log('\n📅 Year distribution:');
    yearBuckets.forEach(bucket => {
      console.log(`   ${bucket.key}: ${bucket.doc_count.toLocaleString()}`);
    });

    return { recentSalesCount, hpiCount, yearBuckets };
    
  } catch (error) {
    console.error('❌ Error getting real counts:', error);
    return null;
  }
}

getRealCounts(); 