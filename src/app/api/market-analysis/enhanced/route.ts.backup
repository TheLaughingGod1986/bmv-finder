import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '../../../../lib/esClient';

interface MarketData {
  region: string;
  currentIndex: number;
  yoyGrowth: number;
  momGrowth: number;
  volatility: number;
  trend: 'rising' | 'falling' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  investmentScore: number;
  lastUpdated: string;
  dataPoints: number;
  timeframeGrowth: number;
  propertyCount: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
    median: number;
  };
}

// Enhanced postcode to region mapping with better alignment
const locationToRegionMap: { [key: string]: string } = {
  // Postcode areas - mapped to actual HPI region names in the data
  'ab': 'aberdeenshire',
  'al': 'st albans',
  'b': 'birmingham',
  'ba': 'bath and north east somerset',
  'bb': 'blackburn with darwen',
  'bd': 'bradford',
  'bh': 'bournemouth',
  'bl': 'bolton',
  'bn': 'brighton and hove',
  'br': 'bromley',
  'bs': 'bristol',
  'bt': 'belfast',
  'ca': 'carlisle',
  'cb': 'cambridge',
  'cf': 'cardiff',
  'ch': 'chester',
  'cm': 'chelmsford',
  'co': 'colchester',
  'cr': 'croydon',
  'ct': 'canterbury',
  'cv': 'coventry',
  'cw': 'crewe',
  'da': 'dartford',
  'dd': 'dundee',
  'de': 'derby',
  'dg': 'dumfries',
  'dh': 'durham',
  'dl': 'darlington',
  'dn': 'doncaster',
  'dt': 'dorchester',
  'dy': 'dudley',
  'e': 'london',
  'ec': 'london',
  'eh': 'edinburgh',
  'en': 'enfield',
  'ex': 'exeter',
  'fk': 'falkirk',
  'fy': 'blackpool',
  'g': 'glasgow',
  'gl': 'gloucester',
  'gu': 'guildford',
  'ha': 'harrow',
  'hd': 'huddersfield',
  'hg': 'harrogate',
  'hp': 'high wycombe',
  'hr': 'hereford',
  'hs': 'outer hebrides',
  'hu': 'hull',
  'hx': 'halifax',
  'ig': 'ilford',
  'ip': 'ipswich',
  'iv': 'inverness',
  'ka': 'kilmarnock',
  'kt': 'kingston upon thames',
  'kw': 'kirkwall',
  'ky': 'kirkcaldy',
  'l': 'liverpool',
  'la': 'lancaster',
  'ld': 'llandrindod wells',
  'le': 'leicester',
  'll': 'llandudno',
  'ln': 'lincoln',
  'ls': 'leeds',
  'lu': 'luton',
  'm': 'manchester',
  'me': 'medway',
  'mk': 'milton keynes',
  'ml': 'motherwell',
  'n': 'london',
  'ne': 'north-east', // Fixed: Newcastle maps to North East (English)
  'ng': 'nottingham',
  'nn': 'northampton',
  'np': 'newport',
  'nr': 'norwich',
  'nw': 'london',
  'ol': 'oldham',
  'ox': 'oxford',
  'pa': 'paisley',
  'pe': 'peterborough',
  'ph': 'perth',
  'pl': 'plymouth',
  'po': 'portsmouth',
  'pr': 'preston',
  'rg': 'reading',
  'rh': 'redhill',
  'rm': 'romford',
  's': 'sheffield',
  'sa': 'swansea',
  'se': 'london',
  'sg': 'stevenage',
  'sk': 'stockport',
  'sl': 'slough',
  'sm': 'sutton',
  'sn': 'swindon',
  'so': 'southampton',
  'sp': 'salisbury',
  'sr': 'sunderland',
  'ss': 'southend on sea',
  'st': 'stoke on trent',
  'sw': 'london',
  'sy': 'shrewsbury',
  'ta': 'taunton',
  'td': 'galashiels',
  'tf': 'telford',
  'tn': 'tunbridge wells',
  'tq': 'torquay',
  'tr': 'truro',
  'ts': 'cleveland',
  'tw': 'twickenham',
  'ub': 'uxbridge',
  'w': 'london',
  'wa': 'warrington',
  'wc': 'london',
  'wd': 'watford',
  'wf': 'wakefield',
  'wn': 'wigan',
  'wr': 'worcester',
  'ws': 'walsall',
  'wv': 'wolverhampton',
  'yo': 'york',
  'ze': 'lerwick'
};

// Property county to HPI region mapping
const countyToHpiRegionMap: { [key: string]: string } = {
  'GREATER LONDON': 'london',
  'GREATER MANCHESTER': 'gorllewin-canolbarth-lloegr',
  'WEST MIDLANDS': 'gorllewin-canolbarth-lloegr',
  'WEST YORKSHIRE': 'yorkshire-and-the-humber',
  'KENT': 'de-orllewin-lloegr',
  'ESSEX': 'de-orllewin-lloegr',
  'HAMPSHIRE': 'de-orllewin-lloegr',
  'LANCASHIRE': 'gorllewin-canolbarth-lloegr',
  'SURREY': 'de-orllewin-lloegr',
  'MERSEYSIDE': 'gorllewin-canolbarth-lloegr',
  'TYNE AND WEAR': 'north-east',
  'NORTHUMBERLAND': 'north-east',
  'DURHAM': 'north-east',
  'CLEVELAND': 'north-east',
  'NORTH YORKSHIRE': 'yorkshire-and-the-humber',
  'SOUTH YORKSHIRE': 'yorkshire-and-the-humber',
  'EAST YORKSHIRE': 'yorkshire-and-the-humber',
  'LINCOLNSHIRE': 'east-midlands',
  'NOTTINGHAMSHIRE': 'east-midlands',
  'DERBYSHIRE': 'east-midlands',
  'LEICESTERSHIRE': 'east-midlands',
  'NORTHAMPTONSHIRE': 'east-midlands',
  'CAMBRIDGESHIRE': 'east-of-england',
  'BEDFORDSHIRE': 'east-of-england',
  'BUCKINGHAMSHIRE': 'de-orllewin-lloegr',
  'OXFORDSHIRE': 'de-orllewin-lloegr',
  'BERKSHIRE': 'de-orllewin-lloegr',
  'WILTSHIRE': 'de-orllewin-lloegr',
  'SOMERSET': 'de-orllewin-lloegr',
  'DEVON': 'de-orllewin-lloegr',
  'CORNWALL': 'de-orllewin-lloegr',
  'DORSET': 'de-orllewin-lloegr',
  'GLOUCESTERSHIRE': 'de-orllewin-lloegr',
  'HEREFORDSHIRE': 'de-orllewin-lloegr',
  'WORCESTERSHIRE': 'de-orllewin-lloegr',
  'WARWICKSHIRE': 'gorllewin-canolbarth-lloegr',
  'STAFFORDSHIRE': 'gorllewin-canolbarth-lloegr',
  'SHROPSHIRE': 'gorllewin-canolbarth-lloegr',
  'CHESHIRE': 'gorllewin-canolbarth-lloegr',
  'CUMBRIA': 'gorllewin-canolbarth-lloegr',
  'NORFOLK': 'de-orllewin-lloegr',
  'SUFFOLK': 'de-orllewin-lloegr',
  'HERTFORDSHIRE': 'de-orllewin-lloegr'
};

// Region name normalization function
function normalizeRegionName(region: string): string {
  return region.toLowerCase().trim();
}

// Function to find matching regions between indices
function findMatchingRegions(propertyRegions: string[], hpiRegions: string[]): { [key: string]: string } {
  const mapping: { [key: string]: string } = {};
  
  for (const propRegion of propertyRegions) {
    const normalizedProp = normalizeRegionName(propRegion);
    
    // Try exact match first
    let match = hpiRegions.find(hpiRegion => 
      normalizeRegionName(hpiRegion) === normalizedProp
    );
    
    // Try county mapping if no exact match
    if (!match) {
      const mappedHpiRegion = countyToHpiRegionMap[propRegion];
      if (mappedHpiRegion) {
        match = hpiRegions.find(hpiRegion => 
          normalizeRegionName(hpiRegion) === normalizeRegionName(mappedHpiRegion)
        );
      }
    }
    
    // Try variations if still no match
    if (!match) {
      match = hpiRegions.find(hpiRegion => {
        const normalizedHpi = normalizeRegionName(hpiRegion);
        return normalizedHpi.includes(normalizedProp) || normalizedProp.includes(normalizedHpi);
      });
    }
    
    if (match) {
      mapping[propRegion] = match;
    }
  }
  
  return mapping;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('search');
  const timeframe = searchParams.get('timeframe') || '1y';

  try {
    let targetRegion = null;

    // If search term provided, map to region
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      
      // Try postcode prefix mapping first
      if (term.length >= 2) {
        const prefix = term.substring(0, 2);
        const mappedRegion = locationToRegionMap[prefix];
        if (mappedRegion) {
          targetRegion = mappedRegion;
        }
      }
      
      // If no postcode match, try direct region match
      if (!targetRegion) {
        targetRegion = term;
      }
    }

    // First, get all available regions from both indices for debugging
    const propertyRegionsResponse = await esClient.search({
      index: 'properties',
      body: {
        size: 0,
        aggs: {
          regions: {
            terms: { field: 'county', size: 200 }
          }
        }
      }
    });

    const hpiRegionsResponse = await esClient.search({
      index: 'house_price_index',
      body: {
        size: 0,
        aggs: {
          regions: {
            terms: { field: 'region', size: 100 }
          }
        }
      }
    });

    // Find region mappings
    const propertyRegions = (propertyRegionsResponse.aggregations?.regions && 'buckets' in propertyRegionsResponse.aggregations.regions)
      ? (propertyRegionsResponse.aggregations.regions.buckets as any[]).map((b: any) => b.key)
      : [];
    const hpiRegions = (hpiRegionsResponse.aggregations?.regions && 'buckets' in hpiRegionsResponse.aggregations.regions)
      ? (hpiRegionsResponse.aggregations.regions.buckets as any[]).map((b: any) => b.key)
      : [];

    // Find region mappings
    const regionMappings = findMatchingRegions(propertyRegions, hpiRegions);

    // Get enhanced property data for the region
    const propertyQuery: any = {
      size: 0, // We only need aggregations
      aggs: {
        regions: {
          terms: { field: 'county', size: 200 },
          aggs: {
            price_stats: {
              stats: { field: 'price' }
            },
            property_count: {
              value_count: { field: 'price' }
            }
          }
        }
      }
    };

    // Only filter by region if we don't have a search term (to get all data for mapping)
    if (targetRegion && !searchTerm) {
      propertyQuery.query = {
        bool: {
          should: [
            { term: { county: targetRegion.toLowerCase() } },
            { term: { county: targetRegion.toLowerCase().replace(/\s+/g, '-') } },
            { term: { county: targetRegion.toLowerCase().replace(/\s+/g, '_') } }
          ]
        }
      };
    }

    const propertyResponse = await esClient.search({
      index: 'properties',
      body: propertyQuery
    });

    // Get HPI data for the same regions
    const hpiQuery: any = {
      size: 0,
      aggs: {
        regions: {
          terms: { field: 'region', size: 50 },
          aggs: {
            latest_data: {
              top_hits: {
                size: 1,
                sort: [{ date: { order: 'desc' } }]
              }
            }
          }
        }
      }
    };

    if (targetRegion) {
      hpiQuery.query = {
        bool: {
          should: [
            { term: { region: targetRegion.toLowerCase() } },
            { term: { region: targetRegion.toLowerCase().replace(/\s+/g, '-') } },
            { term: { regionLabel: targetRegion } }
          ]
        }
      };
    }

    const hpiResponse = await esClient.search({
      index: 'house_price_index',
      body: hpiQuery
    });

    // Combine and process the data
    const marketData: MarketData[] = [];

    // Process HPI data
    const hpiRegionsData = (hpiResponse.aggregations?.regions && 'buckets' in hpiResponse.aggregations.regions)
      ? (hpiResponse.aggregations.regions.buckets as any[])
      : [];
    
    for (const hpiRegion of hpiRegionsData) {
      const regionName = hpiRegion.key;
      const latestData = hpiRegion.latest_data?.hits?.hits?.[0]?._source;

      if (latestData) {
        // Get historical HPI data for growth calculation
        const timeframeMonths = timeframe === '1y' ? 12 : timeframe === '2y' ? 24 : 60;
        const endDate = new Date(latestData.date);
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - timeframeMonths);
        
        const historicalQuery = {
          size: 1000,
          query: {
            bool: {
              must: [
                { term: { region: regionName } },
                { range: { date: { gte: startDate.toISOString().slice(0, 7), lte: endDate.toISOString().slice(0, 7) } } }
              ]
            }
          },
          sort: [{ date: 'asc' }]
        };

        const historicalResponse = await esClient.search({
          index: 'house_price_index',
          body: historicalQuery
        });

        const historicalData = historicalResponse.hits.hits.map((hit: any) => hit._source);
        
        // Find corresponding property data using region mappings
        let propertyRegion = null;
        
        // Try direct match first
        const propertyBuckets = (propertyResponse.aggregations?.regions && 'buckets' in propertyResponse.aggregations.regions)
          ? (propertyResponse.aggregations.regions.buckets as any[])
          : [];
        propertyRegion = propertyBuckets.find(
          (p: any) => normalizeRegionName(p.key) === normalizeRegionName(regionName)
        );
        
        // Try mapped region if no direct match
        if (!propertyRegion) {
          const mappedPropertyRegion = Object.keys(regionMappings).find(
            propRegion => normalizeRegionName(regionMappings[propRegion]) === normalizeRegionName(regionName)
          );
          if (mappedPropertyRegion) {
            const propertyBuckets = (propertyResponse.aggregations?.regions && 'buckets' in propertyResponse.aggregations.regions)
              ? (propertyResponse.aggregations.regions.buckets as any[])
              : [];
            propertyRegion = propertyBuckets.find(
              (p: any) => normalizeRegionName(p.key) === normalizeRegionName(mappedPropertyRegion)
            );
          }
        }
        
        // Calculate growth rates
        let timeframeGrowth = 0;
        let yoyGrowth = 0;
        let momGrowth = 0;
        
        if (historicalData.length >= 2) {
          const startIndex = historicalData[0]?.hpiIndex || latestData.hpiIndex;
          const endIndex = latestData.hpiIndex;
          timeframeGrowth = startIndex !== 0 ? ((endIndex - startIndex) / startIndex) * 100 : 0;
          
          // Calculate YoY growth (12 months ago vs current)
          if (historicalData.length >= 12) {
            const oneYearAgoIndex = historicalData[historicalData.length - 12]?.hpiIndex || endIndex;
            yoyGrowth = oneYearAgoIndex !== 0 ? ((endIndex - oneYearAgoIndex) / oneYearAgoIndex) * 100 : 0;
          } else {
            // Fallback to using the timeframe growth if we don't have 12 months of data
            yoyGrowth = timeframeGrowth;
          }
          
          // Calculate MoM growth (1 month ago vs current)
          if (historicalData.length >= 2) {
            const oneMonthAgoIndex = historicalData[historicalData.length - 2]?.hpiIndex || endIndex;
            momGrowth = oneMonthAgoIndex !== 0 ? ((endIndex - oneMonthAgoIndex) / oneMonthAgoIndex) * 100 : 0;
          }
        }

        // Calculate volatility
        const monthlyChanges = [];
        for (let i = 1; i < historicalData.length; i++) {
          const prev = historicalData[i - 1]?.hpiIndex || 0;
          const curr = historicalData[i]?.hpiIndex || 0;
          if (prev !== 0) {
            monthlyChanges.push(((curr - prev) / prev) * 100);
          }
        }

        const volatility = monthlyChanges.length > 0 
          ? Math.sqrt(monthlyChanges.reduce((sum, change) => sum + Math.pow(change - (monthlyChanges.reduce((a, b) => a + b, 0) / monthlyChanges.length), 2), 0) / monthlyChanges.length)
          : 0;

        // Determine trend and risk
        const trend = timeframeGrowth > 5 ? 'rising' : timeframeGrowth < -2 ? 'falling' : 'stable';
        const riskLevel = volatility < 2 ? 'low' : volatility < 5 ? 'medium' : 'high';

        // Calculate investment score
        const investmentScore = Math.max(0, Math.min(100, Math.round(50 + (timeframeGrowth * 3) - (volatility * 5))));

        marketData.push({
          region: regionName,
          currentIndex: latestData.hpiIndex || 0,
          yoyGrowth: parseFloat(yoyGrowth.toFixed(2)),
          momGrowth: parseFloat(momGrowth.toFixed(2)),
          volatility: parseFloat(volatility.toFixed(2)),
          trend,
          riskLevel,
          investmentScore,
          lastUpdated: latestData.date,
          dataPoints: historicalData.length,
          timeframeGrowth: parseFloat(timeframeGrowth.toFixed(2)),
          propertyCount: propertyRegion?.doc_count || 0,
          averagePrice: propertyRegion?.price_stats?.avg || 0,
          priceRange: {
            min: propertyRegion?.price_stats?.min || 0,
            max: propertyRegion?.price_stats?.max || 0,
            median: propertyRegion?.price_stats?.percentiles?.['50.0'] || 0
          }
        });
      }
    }

    // Sort by investment score
    marketData.sort((a, b) => b.investmentScore - a.investmentScore);

    return NextResponse.json({
      success: true,
      data: marketData,
      searchTerm,
      targetRegion,
      timeframe,
      total: marketData.length,
      debug: {
        propertyRegions: propertyRegions.slice(0, 10), // First 10 for debugging
        hpiRegions: hpiRegions.slice(0, 10), // First 10 for debugging
        regionMappings: Object.fromEntries(
          Object.entries(regionMappings).slice(0, 10) // First 10 for debugging
        )
      }
    });

  } catch (error) {
    console.error('Enhanced market analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Market analysis failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 