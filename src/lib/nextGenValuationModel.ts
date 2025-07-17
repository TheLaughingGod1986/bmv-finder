import { esClient } from './esClient';

export interface NextGenValuationFeatures {
  postcode: string;
  houseNumber: string;
  propertyType: string;
  bedrooms?: number;
  floorArea?: number;
  epcRating?: string;
  lastSoldPrice?: number;
  lastSoldDate?: string;
  constructionYear?: string;
  tenure?: string;
  newBuild?: boolean;
}

export interface ComparableSale {
  price: number;
  date: string;
  propertyType: string;
  bedrooms?: number;
  floorArea?: number;
  epcRating?: string;
  distance: number;
  similarity: number;
  hpiAdjustedPrice: number;
  pricePerSqm?: number;
  pricePerBedroom?: number;
}

export interface ValuationResult {
  currentValue: number;
  confidence: number;
  valueRange: { min: number; max: number };
  breakdown: {
    hpiAdjusted: number;
    comparableSales: number;
    energyEfficiency: number;
    marketTrends: number;
    propertyCharacteristics: number;
  };
  comparables: ComparableSale[];
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  futureProjections: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
    tenYear: number;
  };
  marketInsights: {
    localMarketTrend: 'rising' | 'falling' | 'stable';
    marketVolatility: 'low' | 'medium' | 'high';
    demandIndicator: 'high' | 'medium' | 'low';
    supplyIndicator: 'high' | 'medium' | 'low';
  };
}

export class NextGenValuationModel {
  // Comprehensive UK inflation data (1995-2025)
  private static readonly INFLATION_DATA = {
    1995: 1.8, 1996: 2.4, 1997: 1.8, 1998: 1.6, 1999: 1.3,
    2000: 0.8, 2001: 1.2, 2002: 1.3, 2003: 1.4, 2004: 1.3,
    2005: 2.1, 2006: 2.3, 2007: 2.3, 2008: 3.6, 2009: 2.2,
    2010: 3.3, 2011: 4.5, 2012: 2.8, 2013: 2.6, 2014: 1.5,
    2015: 0.0, 2016: 0.7, 2017: 2.7, 2018: 2.5, 2019: 1.8,
    2020: 0.9, 2021: 2.6, 2022: 9.1, 2023: 6.7, 2024: 3.2,
    2025: 2.0 // Projected
  };

  // EPC rating multipliers (energy efficiency impact on value)
  private static readonly EPC_MULTIPLIERS = {
    'A': 1.12, // 12% premium for excellent energy efficiency
    'B': 1.08, // 8% premium for good energy efficiency
    'C': 1.04, // 4% premium for average energy efficiency
    'D': 1.00, // Baseline
    'E': 0.96, // 4% discount for poor energy efficiency
    'F': 0.92, // 8% discount for very poor energy efficiency
    'G': 0.88  // 12% discount for extremely poor energy efficiency
  };

  // Property type multipliers (market demand)
  private static readonly PROPERTY_TYPE_MULTIPLIERS = {
    'D': 1.15, // Detached - highest demand
    'S': 1.08, // Semi-detached - high demand
    'T': 1.00, // Terraced - baseline
    'F': 0.95, // Flat - slightly lower demand
    'O': 0.90  // Other - lowest demand
  };

  // Bedroom multipliers (market preference)
  private static readonly BEDROOM_MULTIPLIERS = {
    1: 0.85,   // 1 bedroom - 15% discount
    2: 0.95,   // 2 bedrooms - 5% discount
    3: 1.00,   // 3 bedrooms - baseline (most popular)
    4: 1.08,   // 4 bedrooms - 8% premium
    5: 1.15,   // 5 bedrooms - 15% premium
    6: 1.20    // 6+ bedrooms - 20% premium
  };

  /**
   * Generate comprehensive property valuation using multiple data sources
   */
  static async valueProperty(features: NextGenValuationFeatures): Promise<ValuationResult> {
    try {
      // 1. Find comparable sales in the area
      const comparables = await this.findComparableSales(features);
      
      // 2. Calculate HPI-adjusted value
      const hpiAdjusted = await this.calculateHPIAdjustedValue(features);
      
      // 3. Calculate comparable sales value
      const comparableValue = this.calculateComparableValue(comparables);
      
      // 4. Calculate energy efficiency adjustment
      const energyEfficiency = this.calculateEnergyEfficiencyValue(features, comparableValue);
      
      // 5. Calculate market trends adjustment
      const marketTrends = await this.calculateMarketTrendsValue(features);
      
      // 6. Calculate property characteristics adjustment
      const propertyCharacteristics = this.calculatePropertyCharacteristicsValue(features, comparableValue);
      
      // 7. Combine all methods with intelligent weighting
      const finalValue = this.combineValuationMethods({
        hpiAdjusted,
        comparableValue,
        energyEfficiency,
        marketTrends,
        propertyCharacteristics
      }, comparables);
      
      // 8. Calculate confidence and value range
      const confidence = this.calculateConfidence(comparables, features);
      const valueRange = this.calculateValueRange(finalValue, confidence);
      
      // 9. Generate future projections
      const futureProjections = this.calculateFutureProjections(finalValue, features);
      
      // 10. Analyze market insights
      const marketInsights = await this.analyzeMarketInsights(features, comparables);
      
      // 11. Generate factors analysis
      const factors = this.generateFactorsAnalysis(features, comparables, finalValue);
      
      return {
        currentValue: finalValue,
        confidence,
        valueRange,
        breakdown: {
          hpiAdjusted,
          comparableSales: comparableValue,
          energyEfficiency,
          marketTrends,
          propertyCharacteristics
        },
        comparables,
        factors,
        futureProjections,
        marketInsights
      };
      
    } catch (error) {
      console.error('Error in next-gen valuation:', error);
      throw new Error('Failed to generate comprehensive valuation');
    }
  }

  /**
   * Find comparable sales in the same postcode area
   */
  private static async findComparableSales(features: NextGenValuationFeatures): Promise<ComparableSale[]> {
    try {
      const postcodePrefix = features.postcode.split(' ')[0];
      
      // Build sophisticated query for comparable properties
      const query = {
        bool: {
          must: [
            { prefix: { postcode: postcodePrefix } },
            { term: { propertyType: features.propertyType } }
          ],
          filter: [
            { range: { dateOfTransfer: { gte: 'now-2y' } } } // Last 2 years
          ],
          should: [
            // Prioritize same number of bedrooms
            ...(features.bedrooms ? [{
              term: { bedrooms: features.bedrooms },
              boost: 3.0
            }] : []),
            // Prioritize similar floor area (±20%)
            ...(features.floorArea ? [{
              range: {
                floor_area_m2: {
                  gte: features.floorArea * 0.8,
                  lte: features.floorArea * 1.2,
                  boost: 2.0
                }
              }
            }] : []),
            // Prioritize same EPC rating
            ...(features.epcRating ? [{
              term: { epc_rating: features.epcRating },
              boost: 1.5
            }] : [])
          ]
        }
      };

      const response = await esClient.search({
        index: 'properties',
        body: {
          query,
          size: 20,
          sort: [
            { dateOfTransfer: { order: 'desc' } },
            { _score: { order: 'desc' } }
          ]
        }
      });

      const sales = response.hits.hits.map(hit => {
        const source = hit._source as any;
        const score = hit._score || 0;
        
        // Calculate similarity score (0-100)
        let similarity = 50; // Base similarity
        
        // Adjust for bedrooms
        if (features.bedrooms && source.bedrooms) {
          const bedroomDiff = Math.abs(features.bedrooms - source.bedrooms);
          similarity -= bedroomDiff * 10;
        }
        
        // Adjust for floor area
        if (features.floorArea && source.floor_area_m2) {
          const areaDiff = Math.abs(features.floorArea - source.floor_area_m2) / features.floorArea;
          similarity -= areaDiff * 20;
        }
        
        // Adjust for EPC rating
        if (features.epcRating && source.epc_rating) {
          if (features.epcRating === source.epc_rating) {
            similarity += 10;
          } else {
            const ratingDiff = Math.abs(
              this.getEPCRatingValue(features.epcRating) - 
              this.getEPCRatingValue(source.epc_rating)
            );
            similarity -= ratingDiff * 5;
          }
        }
        
        // Clamp similarity to 0-100
        similarity = Math.max(0, Math.min(100, similarity));
        
        return {
          price: source.price,
          date: source.dateOfTransfer,
          propertyType: source.propertyType,
          bedrooms: source.bedrooms,
          floorArea: source.floor_area_m2,
          epcRating: source.epc_rating,
          distance: 0, // Would calculate actual distance if we had coordinates
          similarity,
          hpiAdjustedPrice: source.price, // Will be calculated later
          pricePerSqm: source.floor_area_m2 ? source.price / source.floor_area_m2 : undefined,
          pricePerBedroom: source.bedrooms ? source.price / source.bedrooms : undefined
        };
      });

      // Sort by similarity and recency
      return sales.sort((a, b) => {
        if (a.similarity !== b.similarity) {
          return b.similarity - a.similarity;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }).slice(0, 10); // Take top 10 most similar

    } catch (error) {
      console.error('Error finding comparable sales:', error);
      return [];
    }
  }

  /**
   * Calculate HPI-adjusted value
   */
  private static async calculateHPIAdjustedValue(features: NextGenValuationFeatures): Promise<number> {
    if (!features.lastSoldPrice || !features.lastSoldDate) {
      return 0;
    }

    try {
      // Get HPI data for the region
      const region = this.getRegionFromPostcode(features.postcode);
      const hpiResponse = await esClient.search({
        index: 'hpi_data',
        body: {
          query: {
            bool: {
              must: [
                { term: { region: region } }
              ]
            }
          },
          size: 100,
          sort: [{ date: { order: 'desc' } }]
        }
      });

      const hpiData = hpiResponse.hits.hits.map(hit => hit._source as any);
      
      if (hpiData.length === 0) {
        return features.lastSoldPrice;
      }

      // Find HPI values for sale date and current date
      const soldYearMonth = features.lastSoldDate.substring(0, 7);
      const soldHPI = hpiData.find(hpi => hpi.date === soldYearMonth) || hpiData[hpiData.length - 1];
      const currentHPI = hpiData[0];

      if (soldHPI && currentHPI) {
        const hpiMultiplier = currentHPI.hpi_value / soldHPI.hpi_value;
        return features.lastSoldPrice * hpiMultiplier;
      }

      return features.lastSoldPrice;

    } catch (error) {
      console.error('Error calculating HPI-adjusted value:', error);
      return features.lastSoldPrice || 0;
    }
  }

  /**
   * Calculate value based on comparable sales
   */
  private static calculateComparableValue(comparables: ComparableSale[]): number {
    if (comparables.length === 0) {
      return 0;
    }

    // Calculate weighted average based on similarity and recency
    let totalWeight = 0;
    let weightedSum = 0;

    comparables.forEach((sale, index) => {
      const recencyWeight = Math.exp(-index * 0.2); // More recent sales get higher weight
      const similarityWeight = sale.similarity / 100;
      const weight = recencyWeight * similarityWeight;
      
      totalWeight += weight;
      weightedSum += sale.price * weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate energy efficiency adjustment
   */
  private static calculateEnergyEfficiencyValue(features: NextGenValuationFeatures, baseValue: number): number {
    if (!features.epcRating || !baseValue) {
      return baseValue;
    }

    const multiplier = this.EPC_MULTIPLIERS[features.epcRating as keyof typeof this.EPC_MULTIPLIERS] || 1.0;
    return baseValue * multiplier;
  }

  /**
   * Calculate market trends adjustment
   */
  private static async calculateMarketTrendsValue(features: NextGenValuationFeatures): Promise<number> {
    try {
      const region = this.getRegionFromPostcode(features.postcode);
      
      // Get recent HPI data to calculate trends
      const hpiResponse = await esClient.search({
        index: 'hpi_data',
        body: {
          query: {
            bool: {
              must: [
                { term: { region: region } }
              ]
            }
          },
          size: 12, // Last 12 months
          sort: [{ date: { order: 'desc' } }]
        }
      });

      const hpiData = hpiResponse.hits.hits.map(hit => hit._source as any);
      
      if (hpiData.length < 2) {
        return 0;
      }

      // Calculate 6-month and 12-month growth rates
      const currentHPI = hpiData[0].hpi_value;
      const sixMonthHPI = hpiData[5]?.hpi_value || currentHPI;
      const twelveMonthHPI = hpiData[11]?.hpi_value || currentHPI;

      const sixMonthGrowth = (currentHPI - sixMonthHPI) / sixMonthHPI;
      const twelveMonthGrowth = (currentHPI - twelveMonthHPI) / twelveMonthHPI;

      // Average growth rate
      const avgGrowthRate = (sixMonthGrowth + twelveMonthGrowth) / 2;
      
      // Apply growth adjustment (conservative approach)
      return avgGrowthRate * 0.5; // Only apply 50% of growth rate to be conservative

    } catch (error) {
      console.error('Error calculating market trends:', error);
      return 0;
    }
  }

  /**
   * Calculate property characteristics adjustment
   */
  private static calculatePropertyCharacteristicsValue(features: NextGenValuationFeatures, baseValue: number): number {
    if (!baseValue) {
      return 0;
    }

    let multiplier = 1.0;

    // Property type adjustment
    const typeMultiplier = this.PROPERTY_TYPE_MULTIPLIERS[features.propertyType as keyof typeof this.PROPERTY_TYPE_MULTIPLIERS] || 1.0;
    multiplier *= typeMultiplier;

    // Bedroom adjustment
    if (features.bedrooms) {
      const bedroomMultiplier = this.BEDROOM_MULTIPLIERS[features.bedrooms as keyof typeof this.BEDROOM_MULTIPLIERS] || 1.0;
      multiplier *= bedroomMultiplier;
    }

    // New build adjustment
    if (features.newBuild) {
      multiplier *= 1.05; // 5% premium for new builds
    }

    // Tenure adjustment
    if (features.tenure === 'F') { // Freehold
      multiplier *= 1.03; // 3% premium for freehold
    }

    return baseValue * multiplier;
  }

  /**
   * Combine all valuation methods with intelligent weighting
   */
  private static combineValuationMethods(
    values: {
      hpiAdjusted: number;
      comparableValue: number;
      energyEfficiency: number;
      marketTrends: number;
      propertyCharacteristics: number;
    },
    comparables: ComparableSale[]
  ): number {
    const weights = {
      hpiAdjusted: 0.25,
      comparableValue: 0.35,
      energyEfficiency: 0.15,
      marketTrends: 0.10,
      propertyCharacteristics: 0.15
    };

    // Adjust weights based on data quality
    if (comparables.length < 3) {
      weights.comparableValue *= 0.5;
      weights.hpiAdjusted *= 1.5;
    }

    if (values.hpiAdjusted === 0) {
      weights.hpiAdjusted = 0;
      weights.comparableValue *= 1.2;
    }

    // Normalize weights
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(weights).forEach(key => {
      weights[key as keyof typeof weights] /= totalWeight;
    });

    // Calculate weighted average
    return (
      values.hpiAdjusted * weights.hpiAdjusted +
      values.comparableValue * weights.comparableValue +
      values.energyEfficiency * weights.energyEfficiency +
      values.marketTrends * weights.marketTrends +
      values.propertyCharacteristics * weights.propertyCharacteristics
    );
  }

  /**
   * Calculate confidence score (0-100)
   */
  private static calculateConfidence(comparables: ComparableSale[], features: NextGenValuationFeatures): number {
    let confidence = 50; // Base confidence

    // More comparables = higher confidence
    if (comparables.length >= 5) {
      confidence += 20;
    } else if (comparables.length >= 3) {
      confidence += 10;
    } else if (comparables.length < 2) {
      confidence -= 20;
    }

    // Higher similarity scores = higher confidence
    const avgSimilarity = comparables.reduce((sum, comp) => sum + comp.similarity, 0) / comparables.length;
    confidence += (avgSimilarity - 50) * 0.2;

    // More property features = higher confidence
    let featureCount = 0;
    if (features.bedrooms) featureCount++;
    if (features.floorArea) featureCount++;
    if (features.epcRating) featureCount++;
    if (features.lastSoldPrice) featureCount++;
    
    confidence += featureCount * 5;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Calculate value range based on confidence
   */
  private static calculateValueRange(value: number, confidence: number): { min: number; max: number } {
    const uncertainty = (100 - confidence) / 100;
    const range = value * uncertainty * 0.2; // 20% range at 0% confidence
    
    return {
      min: Math.round(value - range),
      max: Math.round(value + range)
    };
  }

  /**
   * Calculate future projections
   */
  private static calculateFutureProjections(currentValue: number, features: NextGenValuationFeatures): {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
    tenYear: number;
  } {
    // Conservative growth rates based on historical UK property market
    const annualGrowthRate = 0.035; // 3.5% annual growth (conservative)
    const inflationRate = 0.025; // 2.5% annual inflation
    
    // Real growth rate (above inflation)
    const realGrowthRate = annualGrowthRate - inflationRate;

    return {
      oneYear: Math.round(currentValue * (1 + realGrowthRate)),
      threeYear: Math.round(currentValue * Math.pow(1 + realGrowthRate, 3)),
      fiveYear: Math.round(currentValue * Math.pow(1 + realGrowthRate, 5)),
      tenYear: Math.round(currentValue * Math.pow(1 + realGrowthRate, 10))
    };
  }

  /**
   * Analyze market insights
   */
  private static async analyzeMarketInsights(features: NextGenValuationFeatures, comparables: ComparableSale[]): Promise<{
    localMarketTrend: 'rising' | 'falling' | 'stable';
    marketVolatility: 'low' | 'medium' | 'high';
    demandIndicator: 'high' | 'medium' | 'low';
    supplyIndicator: 'high' | 'medium' | 'low';
  }> {
    // Analyze recent sales trends
    const recentPrices = comparables.slice(0, 5).map(c => c.price);
    const olderPrices = comparables.slice(5, 10).map(c => c.price);
    
    const recentAvg = recentPrices.length > 0 ? recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length : 0;
    const olderAvg = olderPrices.length > 0 ? olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length : 0;
    
    let localMarketTrend: 'rising' | 'falling' | 'stable' = 'stable';
    if (recentAvg > olderAvg * 1.05) {
      localMarketTrend = 'rising';
    } else if (recentAvg < olderAvg * 0.95) {
      localMarketTrend = 'falling';
    }

    // Calculate volatility
    const prices = comparables.map(c => c.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    let marketVolatility: 'low' | 'medium' | 'high' = 'medium';
    if (coefficientOfVariation < 0.1) {
      marketVolatility = 'low';
    } else if (coefficientOfVariation > 0.2) {
      marketVolatility = 'high';
    }

    // Demand indicator based on sales frequency and price trends
    const demandIndicator: 'high' | 'medium' | 'low' = 
      comparables.length >= 5 && localMarketTrend === 'rising' ? 'high' :
      comparables.length >= 3 ? 'medium' : 'low';

    // Supply indicator (simplified - would need more data for accurate assessment)
    const supplyIndicator: 'high' | 'medium' | 'low' = 'medium';

    return {
      localMarketTrend,
      marketVolatility,
      demandIndicator,
      supplyIndicator
    };
  }

  /**
   * Generate factors analysis
   */
  private static generateFactorsAnalysis(
    features: NextGenValuationFeatures,
    comparables: ComparableSale[],
    finalValue: number
  ): {
    positive: string[];
    negative: string[];
    neutral: string[];
  } {
    const factors = {
      positive: [] as string[],
      negative: [] as string[],
      neutral: [] as string[]
    };

    // EPC rating analysis
    if (features.epcRating) {
      if (['A', 'B'].includes(features.epcRating)) {
        factors.positive.push(`Excellent energy efficiency (EPC ${features.epcRating})`);
      } else if (['E', 'F', 'G'].includes(features.epcRating)) {
        factors.negative.push(`Poor energy efficiency (EPC ${features.epcRating}) - may need improvements`);
      } else {
        factors.neutral.push(`Average energy efficiency (EPC ${features.epcRating})`);
      }
    }

    // Property type analysis
    if (features.propertyType === 'D') {
      factors.positive.push('Detached property - typically commands premium');
    } else if (features.propertyType === 'F') {
      factors.neutral.push('Flat - may have service charges and leasehold considerations');
    }

    // Bedroom analysis
    if (features.bedrooms) {
      if (features.bedrooms >= 4) {
        factors.positive.push(`${features.bedrooms} bedrooms - family-friendly size`);
      } else if (features.bedrooms === 3) {
        factors.neutral.push('3 bedrooms - most popular size for families');
      } else {
        factors.neutral.push(`${features.bedrooms} bedroom property`);
      }
    }

    // New build analysis
    if (features.newBuild) {
      factors.positive.push('New build property - modern standards and warranties');
    }

    // Comparable sales analysis
    if (comparables.length >= 5) {
      factors.positive.push(`Strong comparable sales data (${comparables.length} recent sales)`);
    } else if (comparables.length < 3) {
      factors.negative.push('Limited comparable sales data - lower confidence in valuation');
    }

    // Market trend analysis
    const recentPrices = comparables.slice(0, 3).map(c => c.price);
    const olderPrices = comparables.slice(-3).map(c => c.price);
    if (recentPrices.length > 0 && olderPrices.length > 0) {
      const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
      const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length;
      
      if (recentAvg > olderAvg * 1.05) {
        factors.positive.push('Rising local market - positive price momentum');
      } else if (recentAvg < olderAvg * 0.95) {
        factors.negative.push('Declining local market - negative price momentum');
      }
    }

    return factors;
  }

  /**
   * Helper method to get EPC rating numeric value
   */
  private static getEPCRatingValue(rating: string): number {
    const values = { 'A': 7, 'B': 6, 'C': 5, 'D': 4, 'E': 3, 'F': 2, 'G': 1 };
    return values[rating as keyof typeof values] || 4;
  }

  /**
   * Helper method to get region from postcode
   */
  private static getRegionFromPostcode(postcode: string): string {
    // Simplified region mapping - would need comprehensive mapping
    const firstChar = postcode.charAt(0).toUpperCase();
    
    const regionMap: { [key: string]: string } = {
      'B': 'west-midlands',
      'L': 'north-west',
      'M': 'north-west',
      'N': 'london',
      'S': 'yorkshire-and-the-humber',
      'T': 'east-midlands',
      'W': 'london',
      'Y': 'yorkshire-and-the-humber'
    };

    return regionMap[firstChar] || 'england';
  }
} 