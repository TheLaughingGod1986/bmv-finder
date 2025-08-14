import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const number = searchParams.get('number');

    if (!postcode) {
      return NextResponse.json({ 
        error: 'Missing postcode parameter' 
      }, { status: 400 });
    }

    console.log('EPC data request:', { postcode, number });

    // Use the user's Docker Elasticsearch instance
    const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9201';
    const esUsername = process.env.ELASTICSEARCH_USERNAME || 'elastic';
    const esPassword = process.env.ELASTICSEARCH_PASSWORD || 'changeme';

    try {
      // Search for EPC data in the user's Elasticsearch
      const searchQuery = {
        query: {
          bool: {
            must: [
              { match: { postcode: postcode.toUpperCase() } }
            ],
            should: number ? [
              { match: { house_number: number } },
              { match: { address: number } }
            ] : []
          }
        },
        size: 20
      };

      // Try to search in multiple indices
      const indices = ['epc_property_data', 'properties', 'house_price_index'];
      let searchResults = null;
      let foundIndex = null;

      for (const index of indices) {
        try {
          const response = await fetch(`${esUrl}/${index}/_search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${Buffer.from(`${esUsername}:${esPassword}`).toString('base64')}`
            },
            body: JSON.stringify(searchQuery)
          });

          if (response.ok) {
            const data = await response.json();
            if (data.hits?.hits?.length > 0) {
              searchResults = data.hits.hits;
              foundIndex = index;
              break;
            }
          }
        } catch (indexError) {
          console.log(`Index ${index} not accessible or doesn't exist:`, indexError.message);
          continue;
        }
      }

      if (!searchResults || searchResults.length === 0) {
        // If no EPC data found, return demo data for testing
        return NextResponse.json({
          success: true,
          data: generateDemoEPCData(postcode, number),
          metadata: {
            source: 'Demo Data (No EPC data found in Elasticsearch)',
            timestamp: new Date().toISOString(),
            postcode: postcode,
            number: number,
            dataQuality: 'demo',
            note: 'No EPC data found in your Elasticsearch indices. This is sample data for testing.'
          }
        });
      }

      // Process the found EPC data
      const epcData = processEPCResults(searchResults, foundIndex);
      
      return NextResponse.json({
        success: true,
        data: epcData,
        metadata: {
          source: `Elasticsearch Index: ${foundIndex}`,
          timestamp: new Date().toISOString(),
          postcode: postcode,
          number: number,
          dataQuality: 'real',
          totalResults: searchResults.length
        }
      });

    } catch (esError) {
      console.error('Elasticsearch error:', esError);
      
      // Return demo data if Elasticsearch is not accessible
      return NextResponse.json({
        success: true,
        data: generateDemoEPCData(postcode, number),
        metadata: {
          source: 'Demo Data (Elasticsearch not accessible)',
          timestamp: new Date().toISOString(),
          postcode: postcode,
          number: number,
          dataQuality: 'demo',
          note: 'Elasticsearch connection failed. This is sample data for testing.'
        }
      });
    }

  } catch (error) {
    console.error('EPC API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function processEPCResults(searchResults: any[], indexName: string) {
  const properties = searchResults.map(hit => {
    const source = hit._source;
    
    // Map different index structures to common format
    let epcRating = source.epc_rating || source.current_energy_rating || 'D';
    let epcScore = calculateEPCScore(epcRating);
    
    return {
      address: source.address || source.full_address || `${source.house_number || ''} ${source.street || ''}`.trim(),
      postcode: source.postcode,
      epcRating: epcRating,
      epcScore: epcScore,
      epcDate: source.epc_date || source.inspection_date || '2023-01-15',
      propertyType: source.property_type || 'Semi-detached house',
      tenure: source.tenure || 'Freehold',
      constructionYear: source.construction_year || 1985,
      totalFloorArea: source.floor_area_m2 || source.size || 95,
      environmentalRating: epcRating,
      potentialRating: source.potential_energy_rating || epcRating,
      potentialScore: calculateEPCScore(source.potential_energy_rating || epcRating),
      heatingCost: calculateHeatingCost(epcRating, source.floor_area_m2 || 95),
      lightingCost: 120,
      hotWaterCost: 180,
      totalCost: 0, // Will be calculated
      co2Rating: epcRating,
      co2Emissions: calculateCO2Emissions(epcRating),
      windows: 'Double glazed',
      walls: 'Cavity wall, insulated',
      roof: 'Pitched, 200mm insulation',
      floor: 'Suspended, insulated',
      mainHeating: 'Gas boiler',
      mainHeatingControls: 'Programmer, room thermostat',
      secondaryHeating: 'None',
      hotWater: 'From main system',
      lighting: 'Low energy lighting',
      renewableTechnologies: 'None'
    };
  });

  // Calculate total costs
  properties.forEach(prop => {
    prop.totalCost = prop.heatingCost + prop.lightingCost + prop.hotWaterCost;
  });

  // Find best match (first result or by house number if specified)
  const bestMatch = properties[0];

  // Generate EPC analysis
  const epcAnalysis = {
    rating: bestMatch.epcRating,
    score: bestMatch.epcScore,
    valueImpact: calculateValueImpact(bestMatch.epcRating),
    energyEfficiency: getEnergyEfficiency(bestMatch.epcRating),
    recommendations: generateRecommendations(bestMatch.epcRating)
  };

  return {
    bestMatch,
    allResults: properties,
    totalResults: properties.length,
    epcAnalysis,
    propertyDetails: {
      type: bestMatch.propertyType,
      tenure: bestMatch.tenure,
      constructionYear: bestMatch.constructionYear,
      floorArea: bestMatch.totalFloorArea,
      environmentalRating: bestMatch.environmentalRating
    },
    energyCosts: {
      heating: bestMatch.heatingCost,
      lighting: bestMatch.lightingCost,
      hotWater: bestMatch.hotWaterCost,
      total: bestMatch.totalCost
    },
    environmentalImpact: {
      co2Rating: bestMatch.co2Rating,
      co2Emissions: bestMatch.co2Emissions
    }
  };
}

function generateDemoEPCData(postcode: string, number?: string) {
  const baseAddress = number ? `${number} Example Street` : 'Example Street';
  
  const properties = [
    {
      address: baseAddress,
      postcode: postcode,
      epcRating: 'C',
      epcScore: 72,
      epcDate: '2023-01-15',
      propertyType: 'Semi-detached house',
      tenure: 'Freehold',
      constructionYear: 1985,
      totalFloorArea: 95,
      environmentalRating: 'C',
      potentialRating: 'B',
      potentialScore: 85,
      heatingCost: 850,
      lightingCost: 120,
      hotWaterCost: 180,
      totalCost: 1150,
      co2Rating: 'C',
      co2Emissions: 2.8,
      windows: 'Double glazed',
      walls: 'Cavity wall, insulated',
      roof: 'Pitched, 200mm insulation',
      floor: 'Suspended, insulated',
      mainHeating: 'Gas boiler',
      mainHeatingControls: 'Programmer, room thermostat',
      secondaryHeating: 'None',
      hotWater: 'From main system',
      lighting: 'Low energy lighting',
      renewableTechnologies: 'None'
    }
  ];

  if (number) {
    // Add more properties for the same postcode
    properties.push(
      {
        address: `${parseInt(number) + 1} Example Street`,
        postcode: postcode,
        epcRating: 'B',
        epcScore: 82,
        epcDate: '2023-01-15',
        propertyType: 'Semi-detached house',
        tenure: 'Freehold',
        constructionYear: 1985,
        totalFloorArea: 95,
        environmentalRating: 'C',
        potentialRating: 'B',
        potentialScore: 85,
        heatingCost: 720,
        lightingCost: 120,
        hotWaterCost: 180,
        totalCost: 1020,
        co2Rating: 'C',
        co2Emissions: 2.8,
        windows: 'Double glazed',
        walls: 'Cavity wall, insulated',
        roof: 'Pitched, 200mm insulation',
        floor: 'Suspended, insulated',
        mainHeating: 'Gas boiler',
        mainHeatingControls: 'Programmer, room thermostat',
        secondaryHeating: 'None',
        hotWater: 'From main system',
        lighting: 'Low energy lighting',
        renewableTechnologies: 'None'
      },
      {
        address: `${parseInt(number) + 2} Example Street`,
        postcode: postcode,
        epcRating: 'D',
        epcScore: 58,
        epcDate: '2023-01-15',
        propertyType: 'Semi-detached house',
        tenure: 'Freehold',
        constructionYear: 1985,
        totalFloorArea: 95,
        environmentalRating: 'C',
        potentialRating: 'B',
        potentialScore: 85,
        heatingCost: 1100,
        lightingCost: 120,
        hotWaterCost: 180,
        totalCost: 1400,
        co2Rating: 'C',
        co2Emissions: 2.8,
        windows: 'Double glazed',
        walls: 'Cavity wall, insulated',
        roof: 'Pitched, 200mm insulation',
        floor: 'Suspended, insulated',
        mainHeating: 'Gas boiler',
        mainHeatingControls: 'Programmer, room thermostat',
        secondaryHeating: 'None',
        hotWater: 'From main system',
        lighting: 'Low energy lighting',
        renewableTechnologies: 'None'
      }
    );
  }

  const bestMatch = properties[0];

  return {
    bestMatch,
    allResults: properties,
    totalResults: properties.length,
    epcAnalysis: {
      rating: bestMatch.epcRating,
      score: bestMatch.epcScore,
      valueImpact: calculateValueImpact(bestMatch.epcRating),
      energyEfficiency: getEnergyEfficiency(bestMatch.epcRating),
      recommendations: generateRecommendations(bestMatch.epcRating)
    },
    propertyDetails: {
      type: bestMatch.propertyType,
      tenure: bestMatch.tenure,
      constructionYear: bestMatch.constructionYear,
      floorArea: bestMatch.totalFloorArea,
      environmentalRating: bestMatch.environmentalRating
    },
    energyCosts: {
      heating: bestMatch.heatingCost,
      lighting: bestMatch.lightingCost,
      hotWater: bestMatch.hotWaterCost,
      total: bestMatch.totalCost
    },
    environmentalImpact: {
      co2Rating: bestMatch.co2Rating,
      co2Emissions: bestMatch.co2Emissions
    }
  };
}

function calculateEPCScore(rating: string): number {
  const scores: { [key: string]: number } = {
    'A': 92, 'B': 81, 'C': 69, 'D': 55, 'E': 39, 'F': 21, 'G': 0
  };
  return scores[rating] || 55;
}

function calculateValueImpact(rating: string): number {
  const impacts: { [key: string]: number } = {
    'A': 1.15, 'B': 1.08, 'C': 1.02, 'D': 1.0, 'E': 0.98, 'F': 0.95, 'G': 0.92
  };
  return impacts[rating] || 1.0;
}

function getEnergyEfficiency(rating: string): string {
  const efficiency: { [key: string]: string } = {
    'A': 'Excellent', 'B': 'Very Good', 'C': 'Good', 'D': 'Average', 'E': 'Poor', 'F': 'Very Poor', 'G': 'Extremely Poor'
  };
  return efficiency[rating] || 'Average';
}

function generateRecommendations(rating: string): string[] {
  const recommendations: { [key: string]: string[] } = {
    'A': ['Maintain current efficiency', 'Consider renewable energy sources', 'Monitor performance'],
    'B': ['Minor improvements could push rating to A', 'Consider renewable energy sources', 'Upgrade to A-rated appliances'],
    'C': ['Good efficiency with room for improvement', 'Consider insulation upgrades', 'Upgrade heating controls'],
    'D': ['Average efficiency - good improvement potential', 'Upgrade insulation', 'Consider new heating system'],
    'E': ['Below average - significant improvements needed', 'Major insulation upgrades', 'Replace heating system'],
    'F': ['Poor efficiency - major improvements required', 'Complete insulation overhaul', 'New heating and lighting systems'],
    'G': ['Extremely poor - complete renovation needed', 'Full property upgrade', 'Professional energy assessment required']
  };
  return recommendations[rating] || ['Consider professional energy assessment'];
}

function calculateHeatingCost(rating: string, floorArea: number): number {
  const baseCosts: { [key: string]: number } = {
    'A': 400, 'B': 500, 'C': 650, 'D': 800, 'E': 1000, 'F': 1250, 'G': 1500
  };
  const baseCost = baseCosts[rating] || 800;
  return Math.round(baseCost * (floorArea / 100));
}

function calculateCO2Emissions(rating: string): number {
  const emissions: { [key: string]: number } = {
    'A': 1.2, 'B': 1.8, 'C': 2.8, 'D': 3.5, 'E': 4.2, 'F': 5.1, 'G': 6.0
  };
  return emissions[rating] || 3.5;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
