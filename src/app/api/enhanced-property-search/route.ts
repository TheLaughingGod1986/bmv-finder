import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';
import { 
  EPCDocument, 
  RecentSaleDocument, 
  HPIDocument,
  ElasticsearchResponse,
  extractSource,
  mapElasticsearchHits
} from '@/types/elasticsearch';
import { checkRateLimit, applyRateLimitHeaders } from '@/lib/rateLimiter';
import { getRentalRate, getRegionCode, getHPIRegion } from '@/lib/marketConfig';



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeRental = searchParams.get('includeRental') !== 'false';
    const includeHPI = searchParams.get('includeHPI') !== 'false';

    if (!postcode) {
      return NextResponse.json(
        { error: 'Missing postcode parameter' },
        { status: 400 }
      );
    }

    console.log('Enhanced property search for postcode:', postcode);

    // 1. PRIMARY SEARCH: EPC Data (28M+ records)
    const epcResults = await searchEPCData(postcode, limit);
    
    if (!epcResults || epcResults.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No properties found for this postcode',
        postcode: postcode,
        suggestions: await getNearbyPostcodes(postcode)
      });
    }

    // 2. ENRICH: Add rental estimates if requested
    let enrichedResults = epcResults;
    if (includeRental) {
      enrichedResults = await enrichWithRentalData(enrichedResults);
    }

    // 3. ENRICH: Add HPI market trends if requested
    if (includeHPI) {
      enrichedResults = await enrichWithHPIData(enrichedResults);
    }

    // 4. ENRICH: Add sold price data if requested
    const includeSoldPrices = searchParams.get('includeSoldPrices') !== 'false';
    if (includeSoldPrices) {
      enrichedResults = await enrichWithSoldPriceData(enrichedResults);
    }

    return NextResponse.json({
      success: true,
      data: {
        properties: enrichedResults,
        total: enrichedResults.length,
        postcode: postcode,
        dataQuality: 'real',
        sources: ['epc_data', ...(includeRental ? ['rental_prices'] : []), ...(includeHPI ? ['house_price_index'] : []), ...(includeSoldPrices ? ['recent_sales'] : [])],
        metadata: {
          timestamp: new Date().toISOString(),
          totalEPCRecords: epcResults.length,
          enrichmentApplied: {
            rental: includeRental,
            hpi: includeHPI,
            soldPrices: includeSoldPrices
          }
        }
      }
    });

  } catch (error) {
    console.error('Enhanced property search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function searchEPCData(postcode: string, limit: number) {
  try {
    const response = await esClient.search({
      index: 'epc_data',
      body: {
        query: {
          bool: {
            should: [
              { match_phrase: { postcode: postcode.toUpperCase().replace(/\s+/g, '') } },
              { match_phrase: { postcode: postcode.toUpperCase() } }
            ],
            minimum_should_match: 1,
            filter: [
              { exists: { field: 'full_address' } },
              { exists: { field: 'total_floor_area' } }
            ]
          }
        },
        size: limit,
        sort: [
          { inspection_date: { order: 'desc' } }
        ]
      }
    });

    return response.hits.hits.map(hit => {
              const source = hit._source as EPCDocument;
      return {
        id: hit._id,
        address: source.full_address || source.address || 'Address not available',
        postcode: source.postcode,
        propertyType: source.property_type || 'Unknown',
        builtForm: source.built_form || 'Unknown',
        tenure: source.tenure || 'Unknown',
        constructionAge: source.construction_age_band || 'Unknown',
        inspectionDate: source.inspection_date,
        localAuthority: source.local_authority_label || source.local_authority,
        constituency: source.constituency_label || source.constituency,
        county: source.county,
        // Energy Performance
        epcRating: source.current_energy_rating || 'Unknown',
        currentEnergyRating: source.current_energy_rating || 'Unknown',
        potentialEnergyRating: source.potential_energy_rating || 'Unknown',
        currentEnergyEfficiency: source.current_energy_efficiency || 0,
        potentialEnergyEfficiency: source.potential_energy_efficiency || 0,
        // Floor Area & Rooms
        totalFloorArea: source.total_floor_area || 0,
        floorArea: source.total_floor_area || 0,
        habitableRooms: source.number_habitable_rooms || 0,
        bedrooms: source.number_habitable_rooms || source.epc_bedrooms || null,
        heatedRooms: source.number_heated_rooms || 0,
        floorLevel: source.floor_level || 0,
        // Energy Costs
        lightingCost: source.lighting_cost_current || 0,
        heatingCost: source.heating_cost_current || 0,
        hotWaterCost: source.hot_water_cost_current || 0,
        totalEnergyCost: source.lighting_cost_current + source.heating_cost_current + source.hot_water_cost_current || 0,
        // Environmental Impact
        co2Emissions: source.co2_emissions_current || 0,
        co2Rating: source.environment_impact_current || 'Unknown',
        // Property Features
        mainHeating: source.mainheat_description || 'Unknown',
        mainHeatingControls: source.mainheatcont_description || 'Unknown',
        windows: source.windows_description || 'Unknown',
        walls: source.walls_description || 'Unknown',
        roof: source.roof_description || 'Unknown',
        floor: source.floor_description || 'Unknown',
        // Additional Details
        mainsGas: source.mains_gas_flag === 'Y',
        lowEnergyLighting: source.low_energy_lighting === 'Y',
        solarWaterHeating: source.solar_water_heating_flag === 'Y',
        // Source tracking
        source: 'epc_data',
        dataQuality: 'real'
      };
    });

  } catch (error) {
    console.error('EPC search error:', error);
    return [];
  }
}

async function enrichWithRentalData(properties: any[]) {
  try {
    const postcodeArea = properties[0]?.postcode?.substring(0, 2) || 'NE';
    const regionCode = getRegionCode(properties[0]?.postcode || 'NE');
    
    const rentalResponse = await esClient.search({
      index: 'rental_prices',
      body: {
        query: {
          bool: {
            must: [
              { term: { geo_code: regionCode } },
              { term: { index_type: 'index' } }
            ]
          }
        },
        size: 1,
        sort: [{ date: { order: 'desc' } }]
      }
    });

    if (rentalResponse.hits.hits.length > 0) {
      const rentalData = rentalResponse.hits.hits[0]._source;
      
      return properties.map(property => {
        // Estimate rental based on property characteristics using config
        const baseRent = estimateBaseRent(property, regionCode);
        const rentalAdjustments = calculateRentalAdjustments(property);
        const estimatedRent = baseRent + rentalAdjustments;
        
        return {
          ...property,
          rentalEstimate: {
            monthly: Math.round(estimatedRent),
            yearly: Math.round(estimatedRent * 12),
            grossYield: 0, // We'll calculate this properly when we have property values
            confidence: 85, // High confidence with real EPC data
            source: 'rental_prices + epc_data',
            calculation: `Based on ${property.bedrooms || property.habitableRooms || 'unknown'} bedroom(s) - market rate for area`,
            note: getRegionCode(property.postcode) === 'E12000007' 
                  ? 'London premium market rates' : 'Bedroom-based estimate for area'
          }
        };
      });
    }

    return properties;

  } catch (error) {
    console.error('Rental enrichment error:', error);
    return properties;
  }
}

async function enrichWithHPIData(properties: any[]) {
  try {
    const localAuthority = properties[0]?.localAuthority || properties[0]?.local_authority || 'Newcastle upon Tyne';
    const hpiRegion = getHPIRegion(localAuthority);
    
    // Fetch HPI data from the correct index: 'house_price_index'
    const hpiResponse = await esClient.search({
      index: 'house_price_index',
      body: {
        query: {
          bool: {
            must: [
              { term: { region: hpiRegion } }
            ]
          }
        },
        size: 1,
        sort: [{ date: { order: 'desc' } }]
      }
    });

    if (hpiResponse.hits.hits.length > 0) {
      const hpiData = hpiResponse.hits.hits[0]._source as HPIDocument;
      
      return properties.map(property => ({
        ...property,
        hpiData: {
          currentIndex: hpiData.hpi_index || hpiData.index_value || null,
          yoyGrowth: hpiData.percentage_change_yearly || hpiData.yearly_change || null,
          averagePrice: hpiData.average_price || hpiData.avg_price || null,
          salesVolume: hpiData.sales_volume || null,
          regionLabel: hpiData.region_label || null,
          lastUpdated: hpiData.date || hpiData.last_updated || new Date().toISOString()
        }
      }));
    }

    // If no HPI data found, return properties with null HPI data
    return properties.map(property => ({
      ...property,
      hpiData: null
    }));

  } catch (error) {
    console.error('HPI enrichment error:', error);
    return properties;
  }
}

async function enrichWithSoldPriceData(properties: any[]) {
  try {
    console.log('Enriching with sold price data...');
    
    for (const property of properties) {
      try {
        // Search for recent sales in the same postcode area
        const salesResponse = await esClient.search({
          index: 'recent_sales',
          body: {
            query: {
              bool: {
                must: [
                  { term: { postcode: property.postcode } },
                  { range: { date_of_transfer: { gte: '2020-01-01' } } }
                ],
                filter: [
                  { exists: { field: 'price' } },
                  { exists: { field: 'property_type' } }
                ]
              }
            },
            size: 10,
            sort: [{ date_of_transfer: { order: 'desc' } }]
          }
        });

        if (salesResponse.hits.hits.length > 0) {
          const sales = salesResponse.hits.hits.map(hit => hit._source as RecentSaleDocument);
          
          // Calculate price statistics
          const prices = sales.map((sale: RecentSaleDocument) => sale.price).filter(price => price > 0);
          const recentPrices = prices.slice(0, 5); // Last 5 sales
          
          if (recentPrices.length > 0) {
            const avgPrice = Math.round(recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length);
            const minPrice = Math.min(...recentPrices);
            const maxPrice = Math.max(...recentPrices);
            
            // Calculate price trend (last 3 sales vs previous 3)
            let priceTrend = 0;
            if (recentPrices.length >= 6) {
              const recentAvg = recentPrices.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
              const previousAvg = recentPrices.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
              priceTrend = previousAvg > 0 ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100) : 0;
            }
            
            property.soldPriceData = {
              recentSales: sales.slice(0, 5).map((sale: RecentSaleDocument) => ({
                address: sale.paon || sale.address || 'Unknown',
                price: sale.price,
                date: sale.date_of_transfer,
                propertyType: sale.property_type || sale.estate_type || 'Unknown',
                newBuild: sale.new_build === 'Y'
              })),
              priceStats: {
                averagePrice: avgPrice,
                minPrice: minPrice,
                maxPrice: maxPrice,
                totalSales: sales.length,
                recentSalesCount: recentPrices.length
              },
              priceTrend: {
                trend: priceTrend,
                direction: priceTrend > 0 ? 'up' : priceTrend < 0 ? 'down' : 'stable',
                confidence: recentPrices.length >= 3 ? 'high' : 'medium'
              },
              source: 'recent_sales',
              lastUpdated: new Date().toISOString()
            };
          }
        }
      } catch (error) {
        console.error('Error enriching property with sold price data:', error);
      }
    }
    
    return properties;
  } catch (error) {
    console.error('Sold price enrichment error:', error);
    return properties;
  }
}

function estimateBaseRent(property: any, regionCode: string): number {
  const propertyType = property.propertyType || 'Semi-Detached';
  const bedrooms = property.bedrooms || property.habitableRooms || 3;
  
  // Use the centralized configuration function
  return getRentalRate(regionCode, propertyType, bedrooms);
}

function calculateRentalAdjustments(property: any): number {
  let adjustments = 0;
  
  // EPC Rating adjustments
  if (property.currentEnergyRating === 'A' || property.currentEnergyRating === 'B') {
    adjustments += 50; // Higher energy efficiency = higher rent
  } else if (property.currentEnergyRating === 'F' || property.currentEnergyRating === 'G') {
    adjustments -= 100; // Lower energy efficiency = lower rent
  }
  
  // Floor area adjustments
  if (property.totalFloorArea > 100) {
    adjustments += 75; // Larger properties command higher rent
  } else if (property.totalFloorArea < 50) {
    adjustments -= 50; // Smaller properties have lower rent
  }
  
  // Modern features
  if (property.lowEnergyLighting) adjustments += 25;
  if (property.solarWaterHeating) adjustments += 50;
  
  return adjustments;
}

async function getNearbyPostcodes(postcode: string): Promise<string[]> {
  try {
    // Get nearby postcodes for suggestions
    const response = await esClient.search({
      index: 'epc_data',
      body: {
        query: {
          wildcard: {
            postcode: `${postcode.substring(0, 4)}*`
          }
        },
        size: 5,
        aggs: {
          postcodes: {
            terms: {
              field: 'postcode.keyword',
              size: 5
            }
          }
        }
      }
    });

            const buckets = (response.aggregations?.postcodes as { buckets: Array<{ key: string; doc_count: number }> })?.buckets || [];
    return buckets.map((bucket: any) => bucket.key).filter((p: string) => p !== postcode);

  } catch (error) {
    console.error('Nearby postcodes error:', error);
    return [];
  }
}
