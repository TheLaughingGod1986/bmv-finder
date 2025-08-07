import { NextRequest, NextResponse } from 'next/server';
import { getIndex, estimateUsingHpi, calculateYoYGrowth, HpiRecord } from '@/utils/hpiEstimator';
import { scoreConfidence } from '@/utils/confidenceScorer';
import { esClient } from '@/lib/esClient';
import { postcodeToRegion } from '@/utils/postcodeToRegion';
import { parse, format, differenceInMonths } from 'date-fns';
import { formatPostcode } from '@/utils/formatPostcode';

// Helper: convert frontend property type to database code
function mapPropertyType(frontendType: string): string {
  const typeMap: { [key: string]: string } = {
    'terraced': 'T',
    'semi-detached': 'S', 
    'detached': 'D',
    'flat': 'F',
    'maisonette': 'F',
    'other': 'O'
  };
  return typeMap[frontendType.toLowerCase()] || frontendType;
}

// Helper: normalize postcode format
function normalizePostcode(postcode: string): string {
  return postcode.replace(/\s+/g, ' ').toUpperCase().trim();
}

// Helper: get region from postcode
function getRegionFromPostcode(postcode: string): string {
  return postcodeToRegion(postcode) || 'UK_FALLBACK';
}

// Helper: get HPI data for a region
async function getHPIData(region: string): Promise<HpiRecord[]> {
  try {
    // Convert region name to HPI data format
    const hpiRegion = convertRegionToHpiFormat(region);
    
    const response = await esClient.search({
      index: 'house_price_index',
      body: {
        query: { match: { region: hpiRegion } },
        sort: [{ date: { order: 'asc' } }],
        size: 1000
      }
    });
    
    const hpiData = response.hits.hits.map((hit: any) => hit._source as HpiRecord);
    return hpiData;
  } catch (error) {
    console.error('Error fetching HPI data:', error);
    return [];
  }
}

// Helper: calculate inflation factor
function getInflationFactor(hpiData: HpiRecord[], region: string, saleDate: Date): number {
  if (hpiData.length === 0) return 1.0;
  
  const saleMonth = format(saleDate, 'yyyy-MM');
  const latestMonth = hpiData[hpiData.length - 1].date;
  
  const saleIndex = hpiData.find(h => h.date === saleMonth)?.index;
  const latestIndex = hpiData.find(h => h.date === latestMonth)?.index;
  
  if (!saleIndex || !latestIndex) return 1.0;
  
  return latestIndex / saleIndex;
}

// Helper: calculate confidence score
function calculateConfidence(compsCount: number, avgSimilarity: number, latestYoY: number | null): any {
  let score = 0;
  let rating = 'low';
  let reason = '';

  // Base score from number of comparables
  if (compsCount >= 5) score += 40;
  else if (compsCount >= 3) score += 30;
  else if (compsCount >= 1) score += 20;

  // Similarity score
  if (avgSimilarity >= 80) score += 40;
  else if (avgSimilarity >= 60) score += 30;
  else if (avgSimilarity >= 40) score += 20;

  // Market data availability
  if (latestYoY !== null) score += 20;

  // Determine rating
  if (score >= 80) rating = 'high';
  else if (score >= 60) rating = 'medium';
  else rating = 'low';

  // Generate reason
  if (compsCount < 3) {
    reason = `Limited comparable sales (${compsCount} found). Consider expanding search area.`;
  } else if (avgSimilarity < 60) {
    reason = `Low similarity scores (${avgSimilarity.toFixed(0)}% average). Properties may differ significantly.`;
  } else if (latestYoY === null) {
    reason = `No recent market data available. Using historical averages.`;
  } else {
    reason = `Good data quality with ${compsCount} comparables and ${avgSimilarity.toFixed(0)}% average similarity.`;
  }

  return { score, rating, reason };
}

// Helper: convert region name to HPI data format
function convertRegionToHpiFormat(region: string): string {
  const regionMap: { [key: string]: string } = {
    'London': 'london',
    'South East': 'south-east',
    'South West': 'south-west',
    'East of England': 'east-of-england',
    'West Midlands': 'west-midlands',
    'East Midlands': 'east-midlands',
    'Yorkshire and The Humber': 'yorkshire-and-the-humber',
    'North West': 'north-west',
    'North East': 'north-east',
    'Wales': 'wales',
    'Scotland': 'scotland',
    'Northern Ireland': 'northern-ireland'
  };
  return regionMap[region] || region.toLowerCase().replace(/\s+/g, '-');
}

// Helper: fetch HPI data from ES (or cache)
async function fetchHpiData(region: string): Promise<HpiRecord[]> {
  // Example: fetch all HPI records for region from ES
  const resp = await esClient.search({
    index: 'house_price_index',
    size: 10000,
    query: { match: { region } },
    sort: [{ date: { order: 'asc' } }],
  });
  return resp.hits.hits.map((hit: any) => hit._source as HpiRecord);
}

// Helper: fetch comps for a property with enhanced matching
async function fetchComps(
  postcode: string, 
  propertyType: string, 
  bedrooms?: number,
  plotSize?: number,
  condition: string = 'any',
  months = 60
) {
  // Fetch recent sales in the same postcode area within specified months (default 5 years)
  const now = new Date();
  const minDate = format(new Date(now.setMonth(now.getMonth() - months)), 'yyyy-MM');
  
  // Build the base query
  const baseQuery: any = {
    bool: {
      must: [
        { match: { property_type: propertyType } },
        { range: { date: { gte: minDate } } },
      ],
    },
  };

  // Add condition filters
  if (condition !== 'any') {
    switch (condition) {
      case 'new':
        baseQuery.bool.must.push({ term: { new_build: true } });
        break;
      case 'existing':
        baseQuery.bool.must.push({ term: { new_build: false } });
        break;
      case 'energy_efficient':
        baseQuery.bool.must.push({ term: { energy_efficient: true } });
        break;
    }
  }

  // Add bedroom filter if specified
  if (bedrooms && bedrooms > 0) {
    baseQuery.bool.must.push({ term: { epc_bedrooms: bedrooms } });
  }

  // Add plot size filter if specified (within 20% range)
  if (plotSize && plotSize > 0) {
    const minSize = plotSize * 0.8;
    const maxSize = plotSize * 1.2;
    baseQuery.bool.must.push({
      range: { epc_size: { gte: minSize, lte: maxSize } }
    });
  }

  // Search in properties-enhanced index
  const resp = await esClient.search({
    index: 'properties-enhanced',
    size: 200, // Get more results to filter from
    query: baseQuery,
    sort: [{ date: { order: 'desc' } }],
    _source: [
      'price', 'date', 'property_type', 'postcode', 'town_city', 'county', 
      'paon', 'street', 'locality', 'epc_bedrooms', 'epc_size', 'epc_rating',
      'new_build', 'energy_efficient', 'full_address'
    ]
  });
  
  // Filter results by postcode area and calculate similarity scores
  const allComps = resp.hits.hits.map((hit: any) => hit._source);
  const filteredComps = allComps
    .filter((comp: any) => {
      const compPostcode = comp.postcode?.replace(/\s+/g, '').toUpperCase();
      const searchPostcode = postcode.replace(/\s+/g, '').toUpperCase();
      
      // Exact match or same postcode area (first 4 characters)
      return compPostcode === searchPostcode || 
             compPostcode?.startsWith(searchPostcode.substring(0, Math.min(4, searchPostcode.length)));
    })
    .map((comp: any) => {
      // Calculate similarity score based on matching criteria
      let similarityScore = 0;
      let maxScore = 0;
      
      // Postcode similarity (40% weight)
      const compPostcode = comp.postcode?.replace(/\s+/g, '').toUpperCase();
      const searchPostcode = postcode.replace(/\s+/g, '').toUpperCase();
      if (compPostcode === searchPostcode) {
        similarityScore += 40;
      } else if (compPostcode?.startsWith(searchPostcode.substring(0, Math.min(4, searchPostcode.length)))) {
        similarityScore += 30;
      }
      maxScore += 40;
      
      // Bedroom similarity (25% weight)
      if (bedrooms && comp.epc_bedrooms) {
        if (comp.epc_bedrooms === bedrooms) {
          similarityScore += 25;
        } else if (Math.abs(comp.epc_bedrooms - bedrooms) === 1) {
          similarityScore += 15;
        }
        maxScore += 25;
      }
      
      // Plot size similarity (20% weight)
      if (plotSize && comp.epc_size) {
        const sizeDiff = Math.abs(comp.epc_size - plotSize) / plotSize;
        if (sizeDiff <= 0.1) {
          similarityScore += 20;
        } else if (sizeDiff <= 0.2) {
          similarityScore += 10;
        }
        maxScore += 20;
      }
      
      // Condition similarity (15% weight)
      if (condition !== 'any') {
        const conditionMatch = 
          (condition === 'new' && comp.new_build) ||
          (condition === 'existing' && !comp.new_build) ||
          (condition === 'energy_efficient' && comp.energy_efficient);
        if (conditionMatch) {
          similarityScore += 15;
        }
        maxScore += 15;
      }
      
      // Normalize score to percentage
      const normalizedScore = maxScore > 0 ? (similarityScore / maxScore) * 100 : 0;
      
      return {
        ...comp,
        similarityScore: normalizedScore,
        dateOfTransfer: comp.date // Map date field for compatibility
      };
    })
    .sort((a: any, b: any) => b.similarityScore - a.similarityScore) // Sort by similarity
    .slice(0, 20); // Return top 20 most similar
  
  return filteredComps;
}

// Helper: calculate market growth using HPI data and inflation
async function calculateMarketGrowth(region: string, comps: any[]): Promise<{ growth: number | null, latestYoY: number | null }> {
  try {
    // Get HPI data for the region
    const hpiData = await getHPIData(region);
    if (!hpiData || hpiData.length === 0) {
      return { growth: null, latestYoY: null };
    }

    // Sort HPI data by date
    const sortedHpiData = hpiData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Get the most recent HPI data point
    const latestHpi = sortedHpiData[sortedHpiData.length - 1];
    
    // Find HPI data from exactly 12 months ago (not just any data from the past)
    const oneYearAgo = new Date(latestHpi.date);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = format(oneYearAgo, 'yyyy-MM');
    
    const oneYearAgoHpi = sortedHpiData.find(h => h.date === oneYearAgoStr);
    
    let latestYoY = null;
    if (oneYearAgoHpi) {
      latestYoY = ((latestHpi.index - oneYearAgoHpi.index) / oneYearAgoHpi.index) * 100;
      // Cap extreme values to reasonable ranges
      latestYoY = Math.max(-50, Math.min(50, latestYoY));
    }

    // Calculate 5-year average growth (but cap at reasonable ranges)
    const fiveYearsAgo = new Date(latestHpi.date);
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const fiveYearsAgoStr = format(fiveYearsAgo, 'yyyy-MM');
    
    const fiveYearsAgoHpi = sortedHpiData.find(h => h.date === fiveYearsAgoStr);
    
    let longTermGrowth = null;
    if (fiveYearsAgoHpi) {
      const totalGrowth = ((latestHpi.index - fiveYearsAgoHpi.index) / fiveYearsAgoHpi.index) * 100;
      longTermGrowth = totalGrowth / 5; // Average annual growth over 5 years
      // Cap extreme values to reasonable ranges
      longTermGrowth = Math.max(-20, Math.min(20, longTermGrowth));
    }

    return { 
      growth: longTermGrowth || latestYoY, 
      latestYoY 
    };
  } catch (error) {
    return { growth: null, latestYoY: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postcode, propertyType, offerMargin = 0.85, bedrooms, plotSize, condition = 'any', epcRating, searchRadius = 0 } = body;

    if (!postcode || !propertyType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedPostcode = formatPostcode(postcode);
    const mappedPropertyType = mapPropertyType(propertyType);

    // Build basic search query (without EPC filters)
    const must: any[] = [
      { term: { property_type: mappedPropertyType } }
    ];

    // Add postcode search based on radius
    if (searchRadius === 0) {
      // Exact postcode match
      must.push({ match_phrase: { postcode: normalizedPostcode } });
    } else {
      // Radius-based search - we'll need to implement this with geospatial data
      // For now, we'll search for nearby postcodes that start with the same prefix
      const postcodePrefix = normalizedPostcode.split(' ')[0]; // Get the first part (e.g., "NE5" from "NE5 4PR")
      must.push({ 
        wildcard: { 
          postcode: `${postcodePrefix}*` 
        } 
      });
    }

    const filter: any[] = [];

    // Basic condition filters (these exist in properties index)
    if (condition === 'new') {
      filter.push({ term: { old_new: 'Y' } });
    } else if (condition === 'existing') {
      filter.push({ term: { old_new: 'N' } });
    }

    // Build the search query
    const searchBody: any = {
      query: {
        bool: {
          must: must,
          filter: filter
        }
      },
      size: searchRadius > 0 ? 100 : 50, // Get more results for radius searches
      sort: [
        { year: { order: 'desc' } },
        { month: { order: 'desc' } }
      ]
    };


    // Search for properties in the enhanced properties index
    const response = await esClient.search({
      index: 'properties-enhanced',
      body: searchBody
    });

    const properties = response.hits.hits.map(hit => hit._source as any);

    if (properties.length === 0) {
      return NextResponse.json({ error: 'No properties found matching your criteria' }, { status: 404 });
    }

    // Enrich properties with EPC data from enhanced index
    const enrichedProperties = await Promise.all(
      properties.map(async (property) => {
        try {
          // Try to find EPC data for this property
          const epcResponse = await esClient.search({
            index: 'properties-enhanced',
            body: {
              query: {
                bool: {
                  should: [
                    { match: { full_address: property.full_address || `${property.paon} ${property.street}` } },
                    { match: { postcode: property.postcode } }
                  ],
                  minimum_should_match: 1
                }
              },
              size: 1
            }
          });

          const epcData = epcResponse.hits.hits[0]?._source as any;
          
          return {
            ...property,
            epc_bedrooms: epcData?.epc_bedrooms || null,
            epc_size: epcData?.epc_size || null,
            epc_rating: epcData?.epc_rating || null,
            has_epc: !!epcData?.epc_rating,
            energy_efficient: epcData?.energy_efficient || false,
            new_build: property.old_new === 'Y'
          };
        } catch (error) {
          return {
            ...property,
            epc_bedrooms: null,
            epc_size: null,
            epc_rating: null,
            has_epc: false,
            energy_efficient: false,
            new_build: property.old_new === 'Y'
          };
        }
      })
    );

    // Apply EPC-based filters after enrichment
    let filteredProperties = enrichedProperties;

    if (bedrooms) {
      filteredProperties = filteredProperties.filter(p => p.epc_bedrooms === bedrooms);
    }

    if (plotSize) {
      const sizeRange = plotSize * 0.2;
      filteredProperties = filteredProperties.filter(p => 
        p.epc_size && p.epc_size >= plotSize - sizeRange && p.epc_size <= plotSize + sizeRange
      );
    }

    if (epcRating) {
      filteredProperties = filteredProperties.filter(p => p.epc_rating === epcRating);
    }

    if (condition === 'energy_efficient') {
      filteredProperties = filteredProperties.filter(p => p.energy_efficient);
    }


    if (filteredProperties.length === 0) {
      return NextResponse.json({ error: 'No properties found matching your enhanced criteria' }, { status: 404 });
    }

    // Calculate similarity scores for each property
    const propertiesWithScores = filteredProperties.map(property => {
      let similarityScore = 100; // Start with perfect score
      let scoreBreakdown = [];

      // Bedroom similarity (40% weight)
      if (bedrooms && property.epc_bedrooms) {
        const bedroomDiff = Math.abs(property.epc_bedrooms - bedrooms);
        const bedroomScore = Math.max(0, 100 - (bedroomDiff * 20)); // -20 points per bedroom difference
        similarityScore = similarityScore * 0.6 + bedroomScore * 0.4;
        scoreBreakdown.push(`Bedrooms: ${bedroomScore.toFixed(0)}% (${property.epc_bedrooms} vs ${bedrooms})`);
      }

      // Size similarity (30% weight)
      if (plotSize && property.epc_size) {
        const sizeDiff = Math.abs(property.epc_size - plotSize) / plotSize;
        const sizeScore = Math.max(0, 100 - (sizeDiff * 100)); // -100 points per 1% difference
        similarityScore = similarityScore * 0.7 + sizeScore * 0.3;
        scoreBreakdown.push(`Size: ${sizeScore.toFixed(0)}% (${property.epc_size}m² vs ${plotSize}m²)`);
      }

      // EPC rating similarity (20% weight)
      if (epcRating && property.epc_rating) {
        const ratingOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const targetIndex = ratingOrder.indexOf(epcRating);
        const propertyIndex = ratingOrder.indexOf(property.epc_rating);
        const ratingDiff = Math.abs(targetIndex - propertyIndex);
        const ratingScore = Math.max(0, 100 - (ratingDiff * 25)); // -25 points per rating difference
        similarityScore = similarityScore * 0.8 + ratingScore * 0.2;
        scoreBreakdown.push(`EPC: ${ratingScore.toFixed(0)}% (${property.epc_rating} vs ${epcRating})`);
      }

      // Property type similarity (10% weight) - already matched in query
      scoreBreakdown.push(`Type: 100% (${property.propertyTypeLabel})`);

      return {
        ...property,
        similarityScore: Math.round(similarityScore),
        scoreBreakdown
      };
    });

    // Sort by similarity score and take top 5
    const topComps = propertiesWithScores
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5);

    console.log('🔍 Top comparables with similarity scores:', topComps.map(c => ({
      address: c.fullAddress,
      price: c.price,
      similarityScore: c.similarityScore,
      scoreBreakdown: c.scoreBreakdown
    })));

    // For now, skip HPI adjustments and return basic data
    const adjustedComps = topComps.map(comp => ({
      ...comp,
      hpiAdjusted: comp.price,
      inflationFactor: 1.0,
      originalPrice: comp.price,
      saleDate: comp.dateOfTransfer
    }));

    // Calculate weighted average based on similarity scores
    const totalWeight = adjustedComps.reduce((sum, comp) => sum + comp.similarityScore, 0);
    const avgValue = adjustedComps.reduce((sum, comp) => sum + (comp.hpiAdjusted * comp.similarityScore), 0) / totalWeight;
    const suggestedOffer = avgValue * offerMargin;

    // Calculate confidence based on data quality and similarity
    const avgSimilarity = adjustedComps.reduce((sum, comp) => sum + comp.similarityScore, 0) / adjustedComps.length;
    const confidence = calculateConfidence(adjustedComps.length, avgSimilarity, null);

    // Calculate market growth using HPI data
    const region = getRegionFromPostcode(normalizedPostcode);
    const { growth, latestYoY } = await calculateMarketGrowth(region, adjustedComps);

    // Get recent sales count for ALL property types in the postcode (considering radius)
    const twentyFourMonthsAgo = format(new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    
    let recentSalesQuery: any = {
      bool: {
        filter: [
          {
            range: {
              dateOfTransfer: {
                gte: twentyFourMonthsAgo
              }
            }
          }
        ]
      }
    };

    // Add postcode filter based on radius
    if (searchRadius === 0) {
      recentSalesQuery.bool.must = [{ match_phrase: { postcode: normalizedPostcode } }];
    } else {
      const postcodePrefix = normalizedPostcode.split(' ')[0];
      recentSalesQuery.bool.must = [{ wildcard: { postcode: `${postcodePrefix}*` } }];
    }

    const recentSalesResponse = await esClient.search({
      index: 'properties',
      body: {
        query: recentSalesQuery,
        size: 0
      }
    });
    const recentSalesCount = typeof recentSalesResponse.hits.total === 'number' 
      ? recentSalesResponse.hits.total 
      : recentSalesResponse.hits.total.value;

    // Calculate additional market insights
    const priceRange = {
      min: Math.min(...adjustedComps.map((c: any) => c.hpiAdjusted)),
      max: Math.max(...adjustedComps.map((c: any) => c.hpiAdjusted)),
      median: adjustedComps.sort((a: any, b: any) => a.hpiAdjusted - b.hpiAdjusted)[Math.floor(adjustedComps.length / 2)]?.hpiAdjusted
    };

    const marketInsights = {
      priceVariability: ((priceRange.max - priceRange.min) / avgValue) * 100,
      recentSalesCount: recentSalesCount,
      averageSimilarity: avgSimilarity,
      highQualityMatches: adjustedComps.filter((c: any) => c.similarityScore >= 80).length,
      marketGrowth: growth,
      marketGrowthPeriod: '24 months',
      searchRadius: searchRadius
    };

    // Response
    return NextResponse.json({
      region,
      comps: adjustedComps,
      avgValue,
      suggestedOffer,
      offerMargin,
      confidence,
      latestYoY,
      searchCriteria: {
        postcode,
        propertyType,
        bedrooms,
        plotSize,
        condition,
        epcRating,
        searchRadius
      },
      marketInsights,
      priceRange
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}