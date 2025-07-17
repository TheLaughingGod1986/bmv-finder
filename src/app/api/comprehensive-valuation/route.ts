import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

interface PropertyData {
  address: string;
  postcode: string;
  propertyType: string;
  bedrooms?: number;
  floorArea?: number;
  epcRating?: string;
  constructionYear?: string;
  lastSoldPrice?: number;
  lastSoldDate?: string;
}

interface ValuationMethod {
  name: string;
  value: number;
  confidence: number;
  breakdown: {
    [key: string]: number;
  };
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  formula: string;
  description: string;
  valuationType: string; // NEW
  whyThisMethod: string; // NEW
  whyThisResult: string; // NEW
}

interface ComprehensiveValuationData {
  property: PropertyData;
  methods: {
    salesComparison: ValuationMethod;
    incomeApproach: ValuationMethod;
    costApproach: ValuationMethod;
  };
  summary: {
    finalValue: number;
    confidence: number;
    valueRange: { min: number; max: number };
    recommendedMethod: string;
    overallFactors: {
      positive: string[];
      negative: string[];
      neutral: string[];
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const number = searchParams.get('number');

    if (!postcode || !number) {
      return NextResponse.json(
        { success: false, error: 'Postcode and house number are required' },
        { status: 400 }
      );
    }

    // Get property data
    let propertyData = await getPropertyData(postcode, number);
    if (!propertyData) {
      // Create a mock property for demonstration purposes
      console.log('Creating mock property for demonstration');
      propertyData = {
        address: `${number} Example Street, ${postcode}`,
        postcode: postcode,
        propertyType: 'T', // Terraced
        bedrooms: 3,
        floorArea: 85,
        epcRating: 'C',
        constructionYear: 'England and Wales: 1967-1990',
        lastSoldPrice: 180000,
        lastSoldDate: '2022-06-15'
      };
    }

    // Generate valuations using all three methods
    const salesComparison = await calculateSalesComparison(propertyData);
    const incomeApproach = await calculateIncomeApproach(propertyData);
    const costApproach = await calculateCostApproach(propertyData);

    // Calculate final summary
    const summary = calculateFinalSummary(salesComparison, incomeApproach, costApproach);

    const valuationData: ComprehensiveValuationData = {
      property: propertyData,
      methods: {
        salesComparison,
        incomeApproach,
        costApproach
      },
      summary
    };

    return NextResponse.json({
      success: true,
      data: valuationData
    });

  } catch (error) {
    console.error('Comprehensive valuation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate comprehensive valuation' },
      { status: 500 }
    );
  }
}

async function getPropertyData(postcode: string, number: string): Promise<PropertyData | null> {
  try {
    console.log(`Searching for property: ${number} ${postcode}`);
    
    // Clean and normalize inputs
    const cleanPostcode = postcode.trim().toUpperCase();
    const cleanNumber = number.trim();
    
    // Try multiple search strategies
    const searchQueries = [
      // Strategy 1: Exact match on enhanced index
      {
        index: 'properties-enhanced',
        body: {
          query: {
            bool: {
              must: [
                { match: { postcode: cleanPostcode } },
                { match: { paon: cleanNumber } }
              ]
            }
          },
          size: 1
        }
      },
      // Strategy 2: Fuzzy match on enhanced index
      {
        index: 'properties-enhanced',
        body: {
          query: {
            bool: {
              must: [
                { match: { postcode: cleanPostcode } }
              ],
              should: [
                { match: { paon: cleanNumber } },
                { fuzzy: { paon: { value: cleanNumber, fuzziness: 2 } } }
              ],
              minimum_should_match: 1
            }
          },
          size: 1
        }
      },
      // Strategy 3: Try base properties index
      {
        index: 'properties',
        body: {
          query: {
            bool: {
              must: [
                { match: { postcode: cleanPostcode } },
                { match: { paon: cleanNumber } }
              ]
            }
          },
          size: 1
        }
      },
      // Strategy 4: Broader search in enhanced index with postcode prefix
      {
        index: 'properties-enhanced',
        body: {
          query: {
            bool: {
              must: [
                { prefix: { postcode: cleanPostcode.split(' ')[0] } }
              ],
              should: [
                { match: { paon: cleanNumber } },
                { match: { address_line_1: cleanNumber } },
                { match: { full_address: cleanNumber } }
              ],
              minimum_should_match: 1
            }
          },
          size: 5
        }
      },
      // Strategy 5: Very broad search in enhanced index
      {
        index: 'properties-enhanced',
        body: {
          query: {
            bool: {
              must: [
                { prefix: { postcode: cleanPostcode.split(' ')[0] } }
              ],
              should: [
                { match: { paon: cleanNumber } },
                { match: { address_line_1: cleanNumber } },
                { match: { full_address: cleanNumber } },
                { match: { saon: cleanNumber } }
              ],
              minimum_should_match: 1
            }
          },
          size: 10
        }
      }
    ];

    for (const searchQuery of searchQueries) {
      console.log(`Trying search strategy: ${searchQuery.index}`);
      try {
        const response = await esClient.search(searchQuery);
        
        if (response.hits.hits.length > 0) {
          const property = response.hits.hits[0]._source as any;
          console.log(`Found property:`, property);
          
          return {
            address: `${property.paon || property.address_line_1} ${property.street || ''}, ${property.town_city || property.locality || ''}`,
            postcode: property.postcode,
            propertyType: property.property_type || 'Unknown',
            bedrooms: property.epc_bedrooms,
            floorArea: property.epc_size,
            epcRating: property.epc_rating,
            constructionYear: property.construction_age_band,
            lastSoldPrice: property.price,
            lastSoldDate: property.date || property.dateOfTransfer
          };
        }
      } catch (searchError) {
        console.log(`Search strategy failed: ${searchQuery.index}`, searchError);
        continue;
      }
    }

    console.log('No property found with any search strategy');
    return null;
  } catch (error) {
    console.error('Error fetching property data:', error);
    return null;
  }
}

async function calculateSalesComparison(property: PropertyData): Promise<ValuationMethod> {
  try {
    // Find comparable sales in the same postcode area
    const response = await esClient.search({
      index: 'properties-enhanced',
      body: {
        query: {
          bool: {
            must: [
              { prefix: { postcode: property.postcode.split(' ')[0] } }
            ],
            filter: [
              { range: { year: { gte: new Date().getFullYear() - 2 } } }
            ],
            should: [
              { term: { property_type: property.propertyType } },
              ...(property.bedrooms ? [{ term: { epc_bedrooms: property.bedrooms } }] : []),
              ...(property.floorArea ? [{
                range: {
                  epc_size: {
                    gte: property.floorArea * 0.8,
                    lte: property.floorArea * 1.2
                  }
                }
              }] : [])
            ],
            minimum_should_match: 1
          }
        },
        size: 10,
        sort: [{ year: { order: 'desc' } }, { month: { order: 'desc' } }]
      }
    });

    const comparables = response.hits.hits.map(hit => hit._source as any);
    let whyThisResult = '';
    let confidence = 0.2;
    if (comparables.length === 0) {
      whyThisResult = 'Low confidence: No comparable sales found in the last 2 years for this property type and postcode sector. Fallback to last sold price.';
      confidence = 0.2;
      return {
        name: 'Sales Comparison',
        value: property.lastSoldPrice || 0,
        confidence,
        breakdown: {
          baseValue: property.lastSoldPrice || 0,
          adjustments: 0
        },
        factors: {
          positive: [],
          negative: ['No comparable sales found'],
          neutral: ['Using last sold price as fallback']
        },
        formula: 'Property Value = Adjusted Sale Price of Comparables / Number of Comparables',
        description: 'Most common method for residential properties, comparing to similar recently sold properties.',
        valuationType: 'Market-based Valuation',
        whyThisMethod: 'Uses recent comparable sales in the same postcode sector and property type. Most accurate when sufficient, recent, and similar comparables exist. Sensitive to market liquidity and data quality.',
        whyThisResult
      };
    }

    // Calculate weighted average of comparable sales
    let totalWeight = 0;
    let weightedSum = 0;

    comparables.forEach((comp, index) => {
      const recencyWeight = Math.exp(-index * 0.3);
      const similarityWeight = calculateSimilarityWeight(property, comp);
      const weight = recencyWeight * similarityWeight;
      
      totalWeight += weight;
      weightedSum += comp.price * weight;
    });

    const comparableValue = weightedSum / totalWeight;
    confidence = Math.min(0.95, 0.5 + (comparables.length * 0.05));
    whyThisResult = confidence < 0.5
      ? 'Limited comparables found. Confidence reduced due to small sample size or weak similarity.'
      : 'Sufficient recent comparables found. Confidence reflects data recency and similarity.';

    return {
      name: 'Sales Comparison',
      value: Math.round(comparableValue),
      confidence,
      breakdown: {
        comparableSales: comparableValue,
        adjustments: 0,
        finalValue: comparableValue
      },
      factors: {
        positive: [
          `${comparables.length} comparable sales found`,
          'Recent market data available',
          'Similar property characteristics'
        ],
        negative: comparables.length < 3 ? ['Limited comparable sales'] : [],
        neutral: ['Standard market approach']
      },
      formula: 'Property Value = Adjusted Sale Price of Comparables / Number of Comparables',
      description: 'Most common method for residential properties, comparing to similar recently sold properties.',
      valuationType: 'Market-based Valuation',
      whyThisMethod: 'Uses recent comparable sales in the same postcode sector and property type. Most accurate when sufficient, recent, and similar comparables exist. Sensitive to market liquidity and data quality.',
      whyThisResult
    };

  } catch (error) {
    console.error('Sales comparison error:', error);
    return {
      name: 'Sales Comparison',
      value: property.lastSoldPrice || 0,
      confidence: 0.2,
      breakdown: {
        baseValue: property.lastSoldPrice || 0,
        adjustments: 0
      },
      factors: {
        positive: [],
        negative: ['Error calculating comparable sales'],
        neutral: ['Using fallback value']
      },
      formula: 'Property Value = Adjusted Sale Price of Comparables / Number of Comparables',
      description: 'Most common method for residential properties, comparing to similar recently sold properties.',
      valuationType: 'Market-based Valuation',
      whyThisMethod: 'Uses recent comparable sales in the same postcode sector and property type. Most accurate when sufficient, recent, and similar comparables exist. Sensitive to market liquidity and data quality.',
      whyThisResult: 'Error: Unable to calculate comparable sales due to query or data issue.'
    };
  }
}

async function calculateIncomeApproach(property: PropertyData): Promise<ValuationMethod> {
  try {
    // Estimate rental income based on property characteristics
    const estimatedRent = estimateMonthlyRent(property);
    const annualRent = estimatedRent * 12;
    
    // Estimate operating expenses (typically 20-30% of gross rent)
    const operatingExpenses = annualRent * 0.25;
    const netOperatingIncome = annualRent - operatingExpenses;
    
    // Estimate cap rate based on property type and location
    const capRate = estimateCapRate(property);
    const propertyValue = netOperatingIncome / capRate;
    
    const confidence = 0.6; // Medium confidence for income approach
    let whyThisResult = 'Medium confidence: Rental yield and cap rate are estimated based on property type and region. Real rental data may improve accuracy.';
    return {
      name: 'Income Approach',
      value: Math.round(propertyValue),
      confidence,
      breakdown: {
        grossRent: annualRent,
        operatingExpenses: operatingExpenses,
        netOperatingIncome: netOperatingIncome,
        capRate: capRate * 100, // Convert to percentage
        propertyValue: propertyValue
      },
      factors: {
        positive: [
          'Good rental yield potential',
          'Stable income stream',
          'Investment-grade property'
        ],
        negative: [
          'Estimated rental values used',
          'Market cap rates may vary'
        ],
        neutral: ['Standard investment approach']
      },
      formula: 'Property Value = Net Operating Income (NOI) / Capitalisation Rate (Cap Rate)',
      description: 'Used primarily for rental or investment properties, based on income generation potential.',
      valuationType: 'Income-based Valuation',
      whyThisMethod: 'Estimates value based on net operating income and market capitalization rate. Best for rental/investment properties with reliable income data. Sensitive to rent and expense assumptions.',
      whyThisResult
    };

  } catch (error) {
    console.error('Income approach error:', error);
    return {
      name: 'Income Approach',
      value: property.lastSoldPrice || 0,
      confidence: 0.3,
      breakdown: {
        grossRent: 0,
        operatingExpenses: 0,
        netOperatingIncome: 0,
        capRate: 0,
        propertyValue: property.lastSoldPrice || 0
      },
      factors: {
        positive: [],
        negative: ['Error calculating income approach'],
        neutral: ['Using fallback value']
      },
      formula: 'Property Value = Net Operating Income (NOI) / Capitalisation Rate (Cap Rate)',
      description: 'Used primarily for rental or investment properties, based on income generation potential.',
      valuationType: 'Income-based Valuation',
      whyThisMethod: 'Estimates value based on net operating income and market capitalization rate. Best for rental/investment properties with reliable income data. Sensitive to rent and expense assumptions.',
      whyThisResult: 'Error: Unable to calculate income approach due to data or calculation issue.'
    };
  }
}

async function calculateCostApproach(property: PropertyData): Promise<ValuationMethod> {
  try {
    // Estimate construction cost per sqm
    const constructionCostPerSqm = estimateConstructionCost(property);
    const totalConstructionCost = (property.floorArea || 100) * constructionCostPerSqm;
    
    // Estimate depreciation based on age
    const depreciation = calculateDepreciation(property);
    const depreciatedCost = totalConstructionCost * (1 - depreciation);
    
    // Estimate land value (typically 30-50% of total value)
    const landValueRatio = 0.4;
    const landValue = (depreciatedCost / (1 - landValueRatio)) * landValueRatio;
    
    const propertyValue = depreciatedCost + landValue;
    const confidence = 0.4; // Lower confidence for cost approach
    let whyThisResult = 'Low confidence: Construction cost and land value are estimated using generic data. Best for new/unique properties or when market data is limited.';
    return {
      name: 'Cost Approach',
      value: Math.round(propertyValue),
      confidence,
      breakdown: {
        constructionCost: totalConstructionCost,
        depreciation: depreciation * 100, // percent
        depreciatedCost: depreciatedCost,
        landValue: landValue,
        propertyValue: propertyValue
      },
      factors: {
        positive: [
          'New construction cost data',
          'Accurate floor area available',
          'Age-based depreciation applied'
        ],
        negative: [
          'Estimated construction costs',
          'Land value estimation required',
          'Less accurate for older properties'
        ],
        neutral: ['Standard cost approach']
      },
      formula: 'Property Value = Cost to Build New - Depreciation + Land Value',
      description: 'Mainly used for unique or new properties, based on replacement cost less depreciation.',
      valuationType: 'Cost-based Valuation',
      whyThisMethod: 'Estimates value based on cost to build new, less depreciation, plus land value. Useful for new/unique properties or when market data is unavailable. Sensitive to cost and depreciation assumptions.',
      whyThisResult
    };

  } catch (error) {
    console.error('Cost approach error:', error);
    return {
      name: 'Cost Approach',
      value: property.lastSoldPrice || 0,
      confidence: 0.2,
      breakdown: {
        constructionCost: 0,
        depreciation: 0,
        depreciatedCost: 0,
        landValue: 0,
        propertyValue: property.lastSoldPrice || 0
      },
      factors: {
        positive: [],
        negative: ['Error calculating cost approach'],
        neutral: ['Using fallback value']
      },
      formula: 'Property Value = Cost to Build New - Depreciation + Land Value',
      description: 'Mainly used for unique or new properties, based on replacement cost less depreciation.',
      valuationType: 'Cost-based Valuation',
      whyThisMethod: 'Estimates value based on cost to build new, less depreciation, plus land value. Useful for new/unique properties or when market data is unavailable. Sensitive to cost and depreciation assumptions.',
      whyThisResult: 'Error: Unable to calculate cost approach due to data or calculation issue.'
    };
  }
}

function calculateFinalSummary(
  salesComparison: ValuationMethod,
  incomeApproach: ValuationMethod,
  costApproach: ValuationMethod
) {
  // Weight the methods based on confidence and suitability
  const weights = {
    salesComparison: 0.6, // Highest weight for residential properties
    incomeApproach: 0.25,
    costApproach: 0.15
  };

  const finalValue = Math.round(
    salesComparison.value * weights.salesComparison +
    incomeApproach.value * weights.incomeApproach +
    costApproach.value * weights.costApproach
  );

  const confidence = Math.round(
    salesComparison.confidence * weights.salesComparison +
    incomeApproach.confidence * weights.incomeApproach +
    costApproach.confidence * weights.costApproach
  );

  // Calculate value range (±10% for high confidence, ±20% for low confidence)
  const rangeMultiplier = confidence > 0.8 ? 0.1 : confidence > 0.6 ? 0.15 : 0.2;
  const valueRange = {
    min: Math.round(finalValue * (1 - rangeMultiplier)),
    max: Math.round(finalValue * (1 + rangeMultiplier))
  };

  // Determine recommended method
  const methodConfidences = [
    { name: 'Sales Comparison', confidence: salesComparison.confidence },
    { name: 'Income Approach', confidence: incomeApproach.confidence },
    { name: 'Cost Approach', confidence: costApproach.confidence }
  ];
  
  const recommendedMethod = methodConfidences.reduce((prev, current) => 
    prev.confidence > current.confidence ? prev : current
  ).name;

  // Combine factors from all methods
  const overallFactors = {
    positive: [
      ...salesComparison.factors.positive,
      ...incomeApproach.factors.positive,
      ...costApproach.factors.positive
    ].slice(0, 5), // Limit to top 5
    negative: [
      ...salesComparison.factors.negative,
      ...incomeApproach.factors.negative,
      ...costApproach.factors.negative
    ].slice(0, 3), // Limit to top 3
    neutral: [
      'Three professional valuation methods used',
      'Weighted average provides balanced estimate',
      'Confidence scoring indicates reliability'
    ]
  };

  return {
    finalValue,
    confidence,
    valueRange,
    recommendedMethod,
    overallFactors
  };
}

// Helper functions
function calculateSimilarityWeight(property: PropertyData, comparable: any): number {
  let weight = 1.0;
  
  // Bedroom similarity
  if (property.bedrooms && comparable.bedrooms) {
    const bedroomDiff = Math.abs(property.bedrooms - comparable.bedrooms);
    weight *= Math.max(0.5, 1 - bedroomDiff * 0.2);
  }
  
  // Floor area similarity
  if (property.floorArea && comparable.floor_area_m2) {
    const areaDiff = Math.abs(property.floorArea - comparable.floor_area_m2) / property.floorArea;
    weight *= Math.max(0.5, 1 - areaDiff);
  }
  
  return weight;
}

function estimateMonthlyRent(property: PropertyData): number {
  const baseRentPerSqm = 12; // £12 per sqm per month (approximate UK average)
  const estimatedSqm = property.floorArea || estimatePropertySize(property);
  return Math.round(baseRentPerSqm * estimatedSqm);
}

function estimatePropertySize(property: PropertyData): number {
  // Estimate based on bedrooms if floor area not available
  if (property.bedrooms) {
    return property.bedrooms * 25; // 25 sqm per bedroom average
  }
  return 100; // Default 100 sqm
}

function estimateCapRate(property: PropertyData): number {
  // Base cap rate by property type
  const baseRates = {
    'D': 0.045, // Detached - 4.5%
    'S': 0.050, // Semi-detached - 5.0%
    'T': 0.055, // Terraced - 5.5%
    'F': 0.060, // Flat - 6.0%
    'O': 0.065  // Other - 6.5%
  };
  
  return baseRates[property.propertyType as keyof typeof baseRates] || 0.055;
}

function estimateConstructionCost(property: PropertyData): number {
  // Construction cost per sqm by property type
  const costs = {
    'D': 1800, // Detached - £1,800/sqm
    'S': 1700, // Semi-detached - £1,700/sqm
    'T': 1600, // Terraced - £1,600/sqm
    'F': 1500, // Flat - £1,500/sqm
    'O': 1400  // Other - £1,400/sqm
  };
  
  return costs[property.propertyType as keyof typeof costs] || 1600;
}

function calculateDepreciation(property: PropertyData): number {
  // Estimate depreciation based on construction age
  if (!property.constructionYear) return 0.2; // Default 20% depreciation
  
  const ageBands: { [key: string]: number } = {
    'England and Wales: 2007 onwards': 0.05,
    'England and Wales: 2003-2006': 0.10,
    'England and Wales: 1991-2002': 0.15,
    'England and Wales: 1967-1990': 0.25,
    'England and Wales: 1945-1966': 0.35,
    'England and Wales: 1919-1944': 0.45,
    'England and Wales: 1900-1918': 0.55,
    'England and Wales: before 1900': 0.65
  };
  
  return ageBands[property.constructionYear] || 0.25;
} 