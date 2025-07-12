import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';
import axios from 'axios';

const RECENT_SALES_INDEX = 'recent_sales';
const LAND_REGISTRY_SPARQL_URL = 'https://landregistry.data.gov.uk/landregistry/query';

// Search recent sales from Elasticsearch index
async function searchRecentSalesFromES(postcode: string, limit: number = 50) {
  try {
    const result = await esClient.search({
      index: RECENT_SALES_INDEX,
      size: limit,
      query: {
        term: { postcode: postcode }
      },
      sort: [
        { dateOfTransfer: { order: 'desc' } }
      ]
    });

    const hits = result.hits.hits;
    return hits.map((hit: any) => ({
      ...hit._source,
      source: 'elasticsearch_cache'
    }));
  } catch (error) {
    console.error('Error searching Elasticsearch for recent sales:', error);
    return [];
  }
}

// Fetch recent sales from Land Registry SPARQL endpoint
async function fetchRecentSalesFromSPARQL(postcode: string, limit: number = 50) {
  try {
    console.log(`Fetching recent sales from SPARQL for postcode: ${postcode}`);
    
    const sparqlQuery = `
      PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
      PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
      
      SELECT ?transaction ?pricePaid ?dateOfTransfer ?propertyType ?newBuild ?estateType 
             ?paon ?saon ?street ?locality ?town ?district ?county ?transactionCategory ?recordStatus
      WHERE {
        ?transaction lrppi:pricePaid ?pricePaid ;
                    lrppi:dateOfTransfer ?dateOfTransfer ;
                    lrppi:propertyType ?propertyType ;
                    lrppi:newBuild ?newBuild ;
                    lrppi:estateType ?estateType ;
                    lrcommon:postcode "${postcode}" .
        
        OPTIONAL { ?transaction lrcommon:paon ?paon }
        OPTIONAL { ?transaction lrcommon:saon ?saon }
        OPTIONAL { ?transaction lrcommon:street ?street }
        OPTIONAL { ?transaction lrcommon:locality ?locality }
        OPTIONAL { ?transaction lrcommon:town ?town }
        OPTIONAL { ?transaction lrcommon:district ?district }
        OPTIONAL { ?transaction lrcommon:county ?county }
        OPTIONAL { ?transaction lrppi:transactionCategory ?transactionCategory }
        OPTIONAL { ?transaction lrppi:recordStatus ?recordStatus }
        
        FILTER(?dateOfTransfer >= "2020-01-01"^^xsd:date)
      }
      ORDER BY DESC(?dateOfTransfer)
      LIMIT ${limit}
    `;
    
    const response = await axios.get(LAND_REGISTRY_SPARQL_URL, {
      params: {
        query: sparqlQuery,
        output: 'json'
      },
      timeout: 30000
    });
    
    if (!response.data || !response.data.results || !response.data.results.bindings) {
      console.log(`No results returned from SPARQL for postcode: ${postcode}`);
      return [];
    }
    
    const sales = response.data.results.bindings.map((binding: any) => ({
      transactionId: binding.transaction?.value || '',
      postcode: postcode,
      pricePaid: parseFloat(binding.pricePaid?.value) || 0,
      dateOfTransfer: binding.dateOfTransfer?.value || '',
      propertyType: binding.propertyType?.value || '',
      newBuild: binding.newBuild?.value === 'Y',
      estateType: binding.estateType?.value || '',
      paon: binding.paon?.value || '',
      saon: binding.saon?.value || '',
      street: binding.street?.value || '',
      locality: binding.locality?.value || '',
      town: binding.town?.value || '',
      district: binding.district?.value || '',
      county: binding.county?.value || '',
      transactionCategory: binding.transactionCategory?.value || '',
      recordStatus: binding.recordStatus?.value || '',
      source: 'land_registry_sparql'
    }));
    
    console.log(`Found ${sales.length} recent sales from SPARQL for postcode: ${postcode}`);
    return sales;
    
  } catch (error) {
    console.error('Error fetching from Land Registry SPARQL:', error instanceof Error ? error.message : error);
    return [];
  }
}

// Index sales data into Elasticsearch for future caching
async function indexSalesToES(sales: any[]) {
  if (sales.length === 0) return;
  
  try {
    console.log(`Indexing ${sales.length} sales records to Elasticsearch for caching`);
    
    const operations = sales.flatMap(sale => [
      { index: { _index: RECENT_SALES_INDEX, _id: sale.transactionId } },
      {
        ...sale,
        indexedAt: new Date().toISOString()
      }
    ]);
    
    const response = await esClient.bulk({
      body: operations,
      refresh: true
    });
    
    if (response.errors) {
      const errors = response.items.filter((item: any) => item.index?.error);
      console.warn(`Bulk indexing completed with ${errors.length} errors`);
    } else {
      console.log(`Successfully cached ${sales.length} sales records`);
    }
    
  } catch (error) {
    console.error('Error indexing sales to Elasticsearch:', error);
    // Don't throw error - caching failure shouldn't break the API
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postcode = searchParams.get('postcode');
    const limit = parseInt(searchParams.get('limit') || '50');
    const forceRefresh = searchParams.get('refresh') === 'true';
    const skipCache = searchParams.get('skipCache') === 'true';

    if (!postcode) {
      return NextResponse.json(
        { error: 'Missing postcode parameter' },
        { status: 400 }
      );
    }

    console.log(`Recent sales request for postcode: ${postcode}, limit: ${limit}, forceRefresh: ${forceRefresh}`);

    let sales: any[] = [];
    let source = '';

    // Step 1: Try Elasticsearch cache first (unless skipCache is true)
    if (!skipCache && !forceRefresh) {
      sales = await searchRecentSalesFromES(postcode, limit);
      if (sales.length > 0) {
        source = 'elasticsearch_cache';
        console.log(`Found ${sales.length} cached recent sales for ${postcode}`);
      }
    }

    // Step 2: If no cached data or force refresh, fetch from SPARQL
    if (sales.length === 0 || forceRefresh) {
      const sparqlSales = await fetchRecentSalesFromSPARQL(postcode, limit);
      
      if (sparqlSales.length > 0) {
        sales = sparqlSales;
        source = 'land_registry_sparql';
        
        // Cache the results for future use (unless skipCache is true)
        if (!skipCache) {
          await indexSalesToES(sparqlSales);
        }
      }
    }

    if (sales.length === 0) {
      return NextResponse.json(
        { 
          error: 'No recent sales found for postcode',
          postcode,
          source: 'none'
        },
        { status: 404 }
      );
    }

    // Calculate summary statistics
    const totalSales = sales.length;
    const totalValue = sales.reduce((sum, sale) => sum + (sale.pricePaid || 0), 0);
    const averagePrice = totalValue / totalSales;
    const priceRange = {
      min: Math.min(...sales.map(s => s.pricePaid || 0)),
      max: Math.max(...sales.map(s => s.pricePaid || 0))
    };

    // Group by property type
    const propertyTypeStats = sales.reduce((acc, sale) => {
      const type = sale.propertyType || 'Unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, totalValue: 0 };
      }
      acc[type].count++;
      acc[type].totalValue += sale.pricePaid || 0;
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>);

    // Calculate average price by property type
    Object.keys(propertyTypeStats).forEach(type => {
      propertyTypeStats[type].averagePrice = propertyTypeStats[type].totalValue / propertyTypeStats[type].count;
    });

    return NextResponse.json({
      postcode,
      source,
      totalSales,
      summary: {
        totalValue,
        averagePrice: Math.round(averagePrice),
        priceRange,
        propertyTypeStats
      },
      sales: sales.map(sale => ({
        transactionId: sale.transactionId,
        pricePaid: sale.pricePaid,
        dateOfTransfer: sale.dateOfTransfer,
        propertyType: sale.propertyType,
        newBuild: sale.newBuild,
        estateType: sale.estateType,
        address: {
          paon: sale.paon,
          saon: sale.saon,
          street: sale.street,
          locality: sale.locality,
          town: sale.town,
          district: sale.district,
          county: sale.county
        },
        transactionCategory: sale.transactionCategory,
        recordStatus: sale.recordStatus,
        source: sale.source
      }))
    });

  } catch (error) {
    console.error('Error in recent sales API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 