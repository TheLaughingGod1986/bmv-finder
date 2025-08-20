import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';
import { MarketCycleEngine } from '@/lib/marketCycleEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    
    if (!postcode) {
      return NextResponse.json({ error: 'Postcode is required' }, { status: 400 });
    }

    const marketEngine = new MarketCycleEngine();
    
    // Fetch historical sales data
    const salesResponse = await esClient.search({
      index: 'recent_sales',
      body: {
        query: { term: { postcode: postcode.toUpperCase() } },
        size: 1000,
        sort: [{ date_of_transfer: { order: 'desc' } }]
      }
    });

    // Fetch HPI data
    const hpiResponse = await esClient.search({
      index: 'house_price_index',
      body: {
        query: { term: { region: 'E12000001' } }, // North East region
        size: 100,
        sort: [{ date: { order: 'desc' } }]
      }
    });

    // Process sales data into yearly format
    const yearlyData = processSalesData(salesResponse.hits.hits);
    
    // Process HPI data
    const hpiData = processHPIData(hpiResponse.hits.hits);
    
    // Analyze market using the engine
    const analysis = marketEngine.analyzeMarket(yearlyData, hpiData);
    
    return NextResponse.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Market trends analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze market trends' },
      { status: 500 }
    );
  }
}

function processSalesData(hits: any[]) {
  const yearlyMap = new Map<number, { totalPrice: number; count: number }>();
  
  hits.forEach(hit => {
    const sale = hit._source;
    const year = new Date(sale.date_of_transfer).getFullYear();
    const price = sale.price || 0;
    
    if (price > 0) {
      const existing = yearlyMap.get(year) || { totalPrice: 0, count: 0 };
      yearlyMap.set(year, {
        totalPrice: existing.totalPrice + price,
        count: existing.count + 1
      });
    }
  });
  
  return Array.from(yearlyMap.entries())
    .map(([year, data]) => ({
      year,
      averagePrice: Math.round(data.totalPrice / data.count),
      count: data.count
    }))
    .sort((a, b) => a.year - b.year);
}

function processHPIData(hits: any[]) {
  return hits.map(hit => {
    const hpi = hit._source;
    return {
      date: hpi.date,
      hpiIndex: hpi.hpiIndex || hpi.index_value || 100,
      percentageChangeYearly: hpi.percentageChangeYearly || hpi.yearly_change || 0
    };
  });
}
