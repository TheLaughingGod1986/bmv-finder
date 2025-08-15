import { esClient } from './esClient';
import { CONFIG } from './config';

export interface EnhancedPropertyFeatures {
  // Basic property info
  postcode: string;
  propertyType: string;
  bedrooms?: number;
  floorArea?: number;
  
  // Historical data
  lastSoldPrice?: number;
  lastSoldDate?: string;
  historicalSales: Array<{
    price: number;
    date: string;
    propertyType: string;
  }>;
  
  // EPC data
  epcRating?: string;
  energyConsumption?: number;
  heatingCost?: number;
  constructionYear?: string;
  builtForm?: string;
  
  // HPI data
  hpiData: Array<{
    date: string;
    hpiValue: number;
    hpiChange: number;
    region: string;
  }>;
  
  // Market data
  localAveragePrice?: number;
  localPricePerSqm?: number;
  localPricePerBedroom?: number;
  transactionVolume?: number;
  
  // Enhanced economic factors
  inflationRate?: number;
  interestRate?: number;
  inflationData?: Array<{
    year: number;
    rate: number;
    cumulative: number;
  }>;
  economicOutlook?: {
    projectedInflation: number;
    projectedInterestRate: number;
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
  };
}

export interface EnhancedPredictionResult {
  predictedValue: number;
  confidence: number;
  predictionRange: {
    low: number;
    high: number;
  };
  factors: {
    hpiAdjustment: number;
    comparableSales: number;
    energyEfficiency: number;
    marketTrends: number;
    economicFactors: number;
  };
  breakdown: {
    baseValue: number;
    hpiMultiplier: number;
    energyEfficiencyBonus: number;
    marketTrendAdjustment: number;
    inflationAdjustment: number;
  };
  futureProjections: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
    tenYear: number;
  };
  riskFactors: string[];
  recommendations: string[];
}

export class EnhancedPredictionModel {
  // Updated weights to give more importance to inflation
  private static readonly WEIGHTS = {
    hpiAdjustment: 0.30,      // Reduced from 0.35
    comparableSales: 0.25,     // Same
    energyEfficiency: 0.15,    // Same
    marketTrends: 0.15,        // Same
    economicFactors: 0.15      // Increased from 0.10 to include inflation
  };

  // Enhanced EPC multipliers with inflation consideration
  private static readonly EPC_MULTIPLIERS = {
    'A': 1.10, // 10% premium (increased from 8%)
    'B': 1.06, // 6% premium (increased from 5%)
    'C': 1.03, // 3% premium (increased from 2%)
    'D': 1.00, // Baseline
    'E': 0.97, // 3% discount (increased from 2%)
    'F': 0.93, // 7% discount (increased from 5%)
    'G': 0.88  // 12% discount (increased from 8%)
  };

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

  private static readonly PROPERTY_TYPE_MULTIPLIERS = {
    'D': 1.15, // Detached
    'S': 1.08, // Semi-detached
    'T': 1.00, // Terraced
    'F': 0.95, // Flat
    'O': 0.90  // Other
  };

  /**
   * Enhanced property value prediction using multiple data sources
   */
  static async predictPropertyValue(features: EnhancedPropertyFeatures): Promise<EnhancedPredictionResult> {
    const predictions: number[] = [];
    const weights: number[] = [];
    const factors: any = {};
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // 1. HPI-Adjusted Prediction (35% weight)
    const hpiPrediction = this.calculateHPIAdjustedPrediction(features);
    if (hpiPrediction) {
      predictions.push(hpiPrediction.value);
      weights.push(this.WEIGHTS.hpiAdjustment);
      factors.hpiAdjustment = hpiPrediction.value;
      
      if (hpiPrediction.riskFactors) {
        riskFactors.push(...hpiPrediction.riskFactors);
      }
    }

    // 2. Comparable Sales Analysis (25% weight)
    const comparablePrediction = await this.calculateComparableSalesPrediction(features);
    if (comparablePrediction) {
      predictions.push(comparablePrediction.value);
      weights.push(this.WEIGHTS.comparableSales);
      factors.comparableSales = comparablePrediction.value;
      
      if (comparablePrediction.riskFactors) {
        riskFactors.push(...comparablePrediction.riskFactors);
      }
    }

    // 3. Energy Efficiency Adjustment (15% weight)
    const energyPrediction = this.calculateEnergyEfficiencyPrediction(features);
    if (energyPrediction) {
      predictions.push(energyPrediction.value);
      weights.push(this.WEIGHTS.energyEfficiency);
      factors.energyEfficiency = energyPrediction.value;
      
      if (energyPrediction.recommendations) {
        recommendations.push(...energyPrediction.recommendations);
      }
    }

    // 4. Market Trends Analysis (15% weight)
    const marketPrediction = this.calculateMarketTrendsPrediction(features);
    if (marketPrediction) {
      predictions.push(marketPrediction.value);
      weights.push(this.WEIGHTS.marketTrends);
      factors.marketTrends = marketPrediction.value;
      
      if (marketPrediction.riskFactors) {
        riskFactors.push(...marketPrediction.riskFactors);
      }
    }

    // 5. Economic Factors (10% weight)
    const economicPrediction = this.calculateEconomicFactorsPrediction(features);
    if (economicPrediction) {
      predictions.push(economicPrediction.value);
      weights.push(this.WEIGHTS.economicFactors);
      factors.economicFactors = economicPrediction.value;
    }

    // Calculate weighted average prediction
    if (predictions.length === 0) {
      throw new Error('Insufficient data for prediction');
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const weightedSum = predictions.reduce((sum, prediction, index) => 
      sum + (prediction * weights[index]), 0);
    
    const predictedValue = Math.round(weightedSum / totalWeight);

    // Calculate confidence based on data quality and consistency
    const confidence = this.calculateConfidence(predictions, features);

    // Calculate prediction range (±10% for high confidence, ±20% for low confidence)
    const rangeMultiplier = confidence > 0.8 ? 0.1 : confidence > 0.6 ? 0.15 : 0.2;
    const predictionRange = {
      low: Math.round(predictedValue * (1 - rangeMultiplier)),
      high: Math.round(predictedValue * (1 + rangeMultiplier))
    };

    // Calculate breakdown
    const breakdown = this.calculateBreakdown(features, predictedValue);

    // Calculate future projections
    const futureProjections = this.calculateFutureProjections(predictedValue, features);

    return {
      predictedValue,
      confidence,
      predictionRange,
      factors,
      breakdown,
      futureProjections,
      riskFactors: [...new Set(riskFactors)], // Remove duplicates
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }

  /**
   * Calculate HPI-adjusted prediction
   */
  private static calculateHPIAdjustedPrediction(features: EnhancedPropertyFeatures) {
    if (!features.lastSoldPrice || !features.lastSoldDate || features.hpiData.length === 0) {
      return null;
    }

    const soldDate = new Date(features.lastSoldDate);
    const currentDate = new Date();

    // Find HPI data closest to sold date and current date
    const soldHPI = features.hpiData.find(hpi => new Date(hpi.date) >= soldDate) || 
                   features.hpiData[features.hpiData.length - 1];
    const currentHPI = features.hpiData[0];

    if (!soldHPI || !currentHPI) {
      return { value: features.lastSoldPrice, riskFactors: ['Insufficient HPI data'] };
    }

    const hpiMultiplier = currentHPI.hpiValue / soldHPI.hpiValue;
    const hpiAdjustedValue = features.lastSoldPrice * hpiMultiplier;

    const riskFactors: string[] = [];
    if (hpiMultiplier < 0.8) {
      riskFactors.push('Significant market decline since last sale');
    } else if (hpiMultiplier > 1.5) {
      riskFactors.push('Rapid market appreciation may not be sustainable');
    }

    return {
      value: hpiAdjustedValue,
      riskFactors
    };
  }

  /**
   * Calculate comparable sales prediction
   */
  private static async calculateComparableSalesPrediction(features: EnhancedPropertyFeatures) {
    if (!features.postcode || !features.propertyType) {
      return null;
    }

    try {
      // Search for comparable properties in the same postcode area
      const response = await esClient.search({
        index: 'properties',
        body: {
          query: {
            bool: {
              must: [
                { match: { postcode: features.postcode.split(' ')[0] } },
                { match: { property_type: features.propertyType } }
              ],
              filter: [
                { range: { price: { gte: features.lastSoldPrice * 0.7, lte: features.lastSoldPrice * 1.3 } } }
              ]
            }
          },
          size: 10,
          sort: [{ date: { order: 'desc' } }]
        }
      });

      const comparableSales: { price: number; date: string; propertyType?: string }[] = response.hits.hits.map(hit => hit._source as { price: number; date: string; propertyType?: string });
      
      if (comparableSales.length === 0) {
        return { value: features.lastSoldPrice || 0, riskFactors: ['No comparable sales found'] };
      }

      // Calculate weighted average based on recency and similarity
      let totalWeight = 0;
      let weightedSum = 0;

      comparableSales.forEach((sale, index) => {
        const recencyWeight = Math.exp(-index * 0.3); // More recent sales get higher weight
        const priceWeight = 1 / (1 + Math.abs(sale.price - (features.lastSoldPrice || 0)) / (features.lastSoldPrice || 1));
        const weight = recencyWeight * priceWeight;
        
        totalWeight += weight;
        weightedSum += sale.price * weight;
      });

      const comparableValue = weightedSum / totalWeight;

      const riskFactors: string[] = [];
      if (comparableSales.length < 3) {
        riskFactors.push('Limited comparable sales data');
      }

      return {
        value: comparableValue,
        riskFactors
      };

    } catch (error) {
      console.error('Error fetching comparable sales:', error);
      return { value: features.lastSoldPrice || 0, riskFactors: ['Error fetching comparable sales'] };
    }
  }

  /**
   * Calculate energy efficiency prediction
   */
  private static calculateEnergyEfficiencyPrediction(features: EnhancedPropertyFeatures) {
    if (!features.epcRating) {
      return null;
    }

    const baseValue = features.lastSoldPrice || features.localAveragePrice || CONFIG.VALUATION.DEFAULT_BASE_VALUE;
    const epcMultiplier = this.EPC_MULTIPLIERS[features.epcRating as keyof typeof this.EPC_MULTIPLIERS] || 1.0;
    
    const energyAdjustedValue = baseValue * epcMultiplier;

    const recommendations: string[] = [];
    if (features.epcRating === 'F' || features.epcRating === 'G') {
      recommendations.push('Consider energy efficiency improvements to increase property value');
    } else if (features.epcRating === 'A' || features.epcRating === 'B') {
      recommendations.push('High energy efficiency rating adds value to the property');
    }

    return {
      value: energyAdjustedValue,
      recommendations
    };
  }

  /**
   * Calculate market trends prediction
   */
  private static calculateMarketTrendsPrediction(features: EnhancedPropertyFeatures) {
    if (features.hpiData.length < 6) {
      return null;
    }

    // Calculate recent market trends
    const recentHPI = features.hpiData.slice(0, 6);
    const averageMonthlyGrowth = recentHPI.reduce((sum, hpi) => sum + hpi.hpiChange, 0) / recentHPI.length;
    
    const baseValue = features.lastSoldPrice || features.localAveragePrice || CONFIG.VALUATION.DEFAULT_BASE_VALUE;
    const trendMultiplier = 1 + (averageMonthlyGrowth / 100) * 6; // 6-month trend
    const trendAdjustedValue = baseValue * trendMultiplier;

    const riskFactors: string[] = [];
    if (averageMonthlyGrowth > 2) {
      riskFactors.push('Rapid market growth may not be sustainable');
    } else if (averageMonthlyGrowth < -1) {
      riskFactors.push('Market decline detected');
    }

    return {
      value: trendAdjustedValue,
      riskFactors
    };
  }

  /**
   * Calculate economic factors prediction with enhanced inflation
   */
  private static calculateEconomicFactorsPrediction(features: EnhancedPropertyFeatures) {
    const baseValue = features.lastSoldPrice || features.localAveragePrice || CONFIG.VALUATION.DEFAULT_BASE_VALUE;
    let economicMultiplier = 1.0;
    let inflationAdjustment = 0;
    let interestRateImpact = 1.0;

    // Enhanced inflation calculation
    if (features.lastSoldDate) {
      const soldYear = new Date(features.lastSoldDate).getFullYear();
      const currentYear = new Date().getFullYear();
      
      // Calculate cumulative inflation from sale date to present
      let cumulativeInflation = 1.0;
      for (let year = soldYear; year < currentYear; year++) {
        const inflationRate = this.INFLATION_DATA[year] || 2.0;
        cumulativeInflation *= (1 + inflationRate / 100);
      }
      
      inflationAdjustment = baseValue * (cumulativeInflation - 1);
      economicMultiplier *= cumulativeInflation;
      
    }

    // Current inflation rate impact on future value
    if (features.inflationRate) {
      const futureInflationMultiplier = 1 + (features.inflationRate / 100);
      economicMultiplier *= futureInflationMultiplier;
    }

    // Interest rate impact (higher rates typically reduce property values)
    if (features.interestRate) {
      const baseRate = 2.0; // Historical average
      const rateDifference = features.interestRate - baseRate;
      interestRateImpact = Math.max(0.90, 1 - (rateDifference * 0.02));
      economicMultiplier *= interestRateImpact;
      
    }

    // Economic outlook adjustment
    if (features.economicOutlook) {
      const sentimentMultiplier = {
        bullish: 1.05,
        neutral: 1.00,
        bearish: 0.95
      }[features.economicOutlook.marketSentiment] || 1.00;
      
      economicMultiplier *= sentimentMultiplier;
    }

    return {
      value: baseValue * economicMultiplier,
      breakdown: {
        baseValue,
        inflationAdjustment,
        interestRateImpact,
        economicMultiplier
      }
    };
  }

  /**
   * Calculate prediction confidence
   */
  private static calculateConfidence(predictions: number[], features: EnhancedPropertyFeatures): number {
    let confidence = 0.5; // Base confidence

    // Data completeness bonus
    if (features.lastSoldPrice && features.lastSoldDate) confidence += 0.1;
    if (features.epcRating) confidence += 0.1;
    if (features.hpiData.length >= 12) confidence += 0.1;
    if (features.bedrooms && features.floorArea) confidence += 0.1;

    // Prediction consistency bonus
    if (predictions.length > 1) {
      const mean = predictions.reduce((sum, p) => sum + p, 0) / predictions.length;
      const variance = predictions.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / predictions.length;
      const coefficientOfVariation = Math.sqrt(variance) / mean;
      
      if (coefficientOfVariation < 0.05) confidence += 0.2; // Very consistent
      else if (coefficientOfVariation < 0.1) confidence += 0.1; // Consistent
      else if (coefficientOfVariation > 0.2) confidence -= 0.1; // Inconsistent
    }

    return Math.min(0.95, Math.max(0.1, confidence));
  }

  /**
   * Calculate detailed breakdown with enhanced inflation
   */
  private static calculateBreakdown(features: EnhancedPropertyFeatures, predictedValue: number) {
    const baseValue = features.lastSoldPrice || features.localAveragePrice || CONFIG.VALUATION.DEFAULT_BASE_VALUE;
    
    // HPI multiplier
    let hpiMultiplier = 1.0;
    if (features.lastSoldDate && features.hpiData.length > 0) {
      const soldDate = new Date(features.lastSoldDate);
      const soldHPI = features.hpiData.find(hpi => new Date(hpi.date) >= soldDate) || 
                     features.hpiData[features.hpiData.length - 1];
      const currentHPI = features.hpiData[0];
      if (soldHPI && currentHPI) {
        hpiMultiplier = currentHPI.hpiValue / soldHPI.hpiValue;
      }
    }

    // Energy efficiency bonus
    let energyEfficiencyBonus = 0;
    if (features.epcRating) {
      const epcMultiplier = this.EPC_MULTIPLIERS[features.epcRating as keyof typeof this.EPC_MULTIPLIERS] || 1.0;
      energyEfficiencyBonus = baseValue * (epcMultiplier - 1);
    }

    // Market trend adjustment
    let marketTrendAdjustment = 0;
    if (features.hpiData.length >= 6) {
      const recentHPI = features.hpiData.slice(0, 6);
      const averageMonthlyGrowth = recentHPI.reduce((sum, hpi) => sum + hpi.hpiChange, 0) / recentHPI.length;
      marketTrendAdjustment = baseValue * (averageMonthlyGrowth / 100) * 6;
    }

    // Enhanced inflation adjustment
    let inflationAdjustment = 0;
    if (features.lastSoldDate) {
      const soldYear = new Date(features.lastSoldDate).getFullYear();
      const currentYear = new Date().getFullYear();
      
      let cumulativeInflation = 1.0;
      for (let year = soldYear; year < currentYear; year++) {
        const inflationRate = this.INFLATION_DATA[year] || 2.0;
        cumulativeInflation *= (1 + inflationRate / 100);
      }
      
      inflationAdjustment = baseValue * (cumulativeInflation - 1);
    }

    return {
      baseValue,
      hpiMultiplier,
      energyEfficiencyBonus,
      marketTrendAdjustment,
      inflationAdjustment
    };
  }

  /**
   * Calculate future projections with inflation
   */
  private static calculateFutureProjections(predictedValue: number, features: EnhancedPropertyFeatures) {
    // Calculate annual growth rate from HPI data
    let annualGrowthRate = 0.03; // Default 3%
    
    if (features.hpiData.length >= 12) {
      const yearlyHPI = features.hpiData.slice(0, 12);
      const totalGrowth = yearlyHPI.reduce((sum, hpi) => sum + hpi.hpiChange, 0);
      annualGrowthRate = totalGrowth / 100;
    }

    // Enhanced inflation adjustment for future projections
    let inflationAdjustedGrowthRate = annualGrowthRate;
    
    if (features.inflationRate) {
      // Ensure growth rate is at least equal to inflation
      inflationAdjustedGrowthRate = Math.max(annualGrowthRate, features.inflationRate / 100);
    }

    // Economic outlook adjustment
    if (features.economicOutlook) {
      const projectedInflation = features.economicOutlook.projectedInflation / 100;
      inflationAdjustedGrowthRate = Math.max(inflationAdjustedGrowthRate, projectedInflation);
    }

    // Calculate projections with inflation-adjusted growth
    const projections = {
      oneYear: Math.round(predictedValue * Math.pow(1 + inflationAdjustedGrowthRate, 1)),
      threeYear: Math.round(predictedValue * Math.pow(1 + inflationAdjustedGrowthRate, 3)),
      fiveYear: Math.round(predictedValue * Math.pow(1 + inflationAdjustedGrowthRate, 5)),
      tenYear: Math.round(predictedValue * Math.pow(1 + inflationAdjustedGrowthRate, 10))
    };


    return projections;
  }

  /**
   * Get enhanced property features from API data
   */
  static async getEnhancedFeatures(postcode: string, number: string): Promise<EnhancedPropertyFeatures> {
    try {
      // Fetch property analysis data
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const analysisResponse = await fetch(`${baseUrl}/api/property-analysis?postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(number)}`);
      const analysisData = await analysisResponse.json();

      // Fetch HPI data
      const hpiResponse = await fetch(`${baseUrl}/api/hpi/postcode?postcode=${encodeURIComponent(postcode)}`);
      const hpiData = await hpiResponse.json();

      // Fetch comparable sales
      const comparableResponse = await fetch(`${baseUrl}/api/recent-sales?postcode=${encodeURIComponent(postcode)}&limit=20`);
      const comparableData = await comparableResponse.json();

      return {
        postcode,
        propertyType: analysisData.property_info?.property_type || 'Unknown',
        bedrooms: analysisData.property_info?.bedrooms,
        floorArea: analysisData.property_info?.floor_area_m2,
        lastSoldPrice: analysisData.deal_metrics?.last_sold_price,
        lastSoldDate: analysisData.sold_prices?.[0]?.date,
        historicalSales: analysisData.sold_prices || [],
        epcRating: analysisData.property_info?.epc_rating,
        energyConsumption: analysisData.property_info?.energy_consumption,
        heatingCost: analysisData.property_info?.heating_cost,
        constructionYear: analysisData.property_info?.construction_year,
        builtForm: analysisData.property_info?.built_form,
        hpiData: hpiData.results || [],
        localAveragePrice: analysisData.market_insights?.average_price,
        localPricePerSqm: analysisData.market_insights?.average_price_per_sqm,
        localPricePerBedroom: analysisData.market_insights?.average_price_per_bedroom,
        transactionVolume: comparableData.length,
        inflationRate: 2.5, // Default UK inflation rate
        interestRate: 5.25  // Default UK base rate
      };

    } catch (error) {
      console.error('Error fetching enhanced features:', error);
      throw new Error('Failed to fetch property data for prediction');
    }
  }
} 