import { esClient } from '@/lib/esClient';

// External signals with predictive power ratings
export interface ExternalSignals {
  // High Predictive Power (🔥🔥🔥)
  interestRates: number; // Bank of England base rate
  inflation: number; // CPI from ONS
  
  // Medium Predictive Power (🔥🔥)
  epcScore: string; // A-G rating
  floorArea: number; // Square meters
  timeToSell: number; // Days on market
  planningApplications: number; // Local development activity
  
  // Lower Predictive Power (🔥)
  schoolCatchments: string[]; // Nearby schools
  crimeRate: number; // Local crime statistics
  broadbandSpeed: number; // Mbps
}

export interface MLValuationFeatures {
  // Property characteristics
  postcode: string;
  propertyType: string;
  bedrooms: number;
  floorArea: number;
  epcRating: string;
  constructionYear: number;
  tenure: string;
  
  // Market data
  lastSoldPrice: number;
  lastSoldDate: string;
  hpiData: any[];
  
  // External signals
  externalSignals: ExternalSignals;
  
  // Comparable sales
  comparables: any[];
}

export interface MLValuationResult {
  currentValue: number;
  confidence: number;
  valueRange: { min: number; max: number };
  
  // ML model predictions
  randomForestPrediction: number;
  lstmPrediction: number;
  ensemblePrediction: number;
  
  // Feature importance
  featureImportance: {
    postcode: number;
    bedrooms: number;
    floorArea: number;
    epcRating: number;
    interestRates: number;
    inflation: number;
    timeToSell: number;
  };
  
  // Market insights
  marketInsights: {
    trend: 'rising' | 'falling' | 'stable';
    volatility: 'low' | 'medium' | 'high';
    seasonality: number;
    forecast: {
      threeMonth: number;
      sixMonth: number;
      twelveMonth: number;
    };
  };
  
  // External signal impacts
  signalImpacts: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
}

export class MLValuationModel {
  // External signal weights based on predictive power
  private static readonly SIGNAL_WEIGHTS = {
    // High predictive power (🔥🔥🔥)
    interestRates: 0.15,
    inflation: 0.15,
    
    // Medium predictive power (🔥🔥)
    epcScore: 0.12,
    floorArea: 0.12,
    timeToSell: 0.10,
    planningApplications: 0.08,
    
    // Lower predictive power (🔥)
    schoolCatchments: 0.06,
    crimeRate: 0.06,
    broadbandSpeed: 0.06
  };

  // EPC rating impact on value (enhanced)
  private static readonly EPC_IMPACT = {
    'A': { value: 1.15, energyCost: -40, carbonEmissions: -60 },
    'B': { value: 1.10, energyCost: -30, carbonEmissions: -45 },
    'C': { value: 1.05, energyCost: -20, carbonEmissions: -30 },
    'D': { value: 1.00, energyCost: 0, carbonEmissions: 0 },
    'E': { value: 0.95, energyCost: 20, carbonEmissions: 30 },
    'F': { value: 0.90, energyCost: 40, carbonEmissions: 60 },
    'G': { value: 0.85, energyCost: 60, carbonEmissions: 90 }
  };

  // Interest rate impact on property values
  private static readonly INTEREST_RATE_IMPACT = {
    low: { threshold: 2.0, multiplier: 1.05 },
    medium: { threshold: 4.0, multiplier: 1.00 },
    high: { threshold: 6.0, multiplier: 0.95 },
    veryHigh: { threshold: 8.0, multiplier: 0.90 }
  };

  /**
   * Generate ML-enhanced property valuation
   */
  static async valueProperty(features: MLValuationFeatures): Promise<MLValuationResult> {
    try {
      // 1. Random Forest prediction (handles nonlinear effects)
      const randomForestPrediction = await this.randomForestPrediction(features);
      
      // 2. LSTM time-series prediction
      const lstmPrediction = await this.lstmPrediction(features);
      
      // 3. Ensemble prediction (combine models)
      const ensemblePrediction = this.ensemblePrediction(randomForestPrediction, lstmPrediction);
      
      // 4. Apply external signal adjustments
      const adjustedValue = this.applyExternalSignals(ensemblePrediction, features.externalSignals);
      
      // 5. Calculate confidence and range
      const confidence = this.calculateConfidence(features);
      const valueRange = this.calculateValueRange(adjustedValue, confidence);
      
      // 6. Generate market insights
      const marketInsights = await this.generateMarketInsights(features);
      
      // 7. Calculate feature importance
      const featureImportance = this.calculateFeatureImportance(features);
      
      // 8. Analyze external signal impacts
      const signalImpacts = this.analyzeSignalImpacts(features.externalSignals);
      
      return {
        currentValue: adjustedValue,
        confidence,
        valueRange,
        randomForestPrediction,
        lstmPrediction,
        ensemblePrediction,
        featureImportance,
        marketInsights,
        signalImpacts
      };
      
    } catch (error) {
      console.error('Error in ML valuation:', error);
      throw new Error('Failed to generate ML-enhanced valuation');
    }
  }

  /**
   * Random Forest prediction (simulated)
   * In production, this would use a trained Random Forest model
   */
  private static async randomForestPrediction(features: MLValuationFeatures): Promise<number> {
    // Simulate Random Forest prediction using feature engineering
    const baseValue = features.lastSoldPrice || 200000;
    
    // Feature engineering for Random Forest
    const engineeredFeatures = {
      postcodeValue: this.getPostcodeValue(features.postcode),
      bedroomRatio: features.bedrooms / 3, // Normalize to 3-bedroom baseline
      floorAreaRatio: features.floorArea / 100, // Normalize to 100sqm baseline
      epcValue: this.getEPCValue(features.epcRating),
      timeSinceSale: this.getTimeSinceSale(features.lastSoldDate),
      marketTrend: this.getMarketTrend(features.hpiData),
      interestRateImpact: this.getInterestRateImpact(features.externalSignals.interestRates),
      inflationImpact: this.getInflationImpact(features.externalSignals.inflation)
    };
    
    // Simulate Random Forest decision tree logic
    let prediction = baseValue;
    
    // Postcode premium/discount
    prediction *= engineeredFeatures.postcodeValue;
    
    // Property characteristics
    prediction *= (1 + (engineeredFeatures.bedroomRatio - 1) * 0.1);
    prediction *= (1 + (engineeredFeatures.floorAreaRatio - 1) * 0.05);
    prediction *= engineeredFeatures.epcValue;
    
    // Market conditions
    prediction *= (1 + engineeredFeatures.marketTrend * engineeredFeatures.timeSinceSale);
    prediction *= engineeredFeatures.interestRateImpact;
    prediction *= engineeredFeatures.inflationImpact;
    
    return Math.round(prediction);
  }

  /**
   * LSTM time-series prediction (simulated)
   * In production, this would use a trained LSTM model
   */
  private static async lstmPrediction(features: MLValuationFeatures): Promise<number> {
    if (features.hpiData.length < 12) {
      return features.lastSoldPrice || 200000;
    }
    
    // Simulate LSTM prediction using time-series analysis
    const recentHPI = features.hpiData.slice(0, 12); // Last 12 months
    const hpiValues = recentHPI.map(hpi => hpi.hpi_value);
    
    // Calculate trend and seasonality
    const trend = this.calculateTrend(hpiValues);
    const seasonality = this.calculateSeasonality(hpiValues);
    const volatility = this.calculateVolatility(hpiValues);
    
    // LSTM-style prediction
    const baseValue = features.lastSoldPrice || 200000;
    const timeMultiplier = 1 + (trend * 0.1) + (seasonality * 0.05);
    const volatilityAdjustment = 1 + (volatility * 0.02);
    
    return Math.round(baseValue * timeMultiplier * volatilityAdjustment);
  }

  /**
   * Ensemble prediction (combine Random Forest and LSTM)
   */
  private static ensemblePrediction(rfPrediction: number, lstmPrediction: number): number {
    // Weighted ensemble (RF: 60%, LSTM: 40%)
    const rfWeight = 0.6;
    const lstmWeight = 0.4;
    
    return Math.round(rfPrediction * rfWeight + lstmPrediction * lstmWeight);
  }

  /**
   * Apply external signals to adjust prediction
   */
  private static applyExternalSignals(prediction: number, signals: ExternalSignals): number {
    let adjustedValue = prediction;
    
    // High predictive power signals
    adjustedValue *= this.getInterestRateMultiplier(signals.interestRates);
    adjustedValue *= this.getInflationMultiplier(signals.inflation);
    
    // Medium predictive power signals
    adjustedValue *= this.getEPCMultiplier(signals.epcScore);
    adjustedValue *= this.getFloorAreaMultiplier(signals.floorArea);
    adjustedValue *= this.getTimeToSellMultiplier(signals.timeToSell);
    adjustedValue *= this.getPlanningMultiplier(signals.planningApplications);
    
    // Lower predictive power signals
    adjustedValue *= this.getSchoolCatchmentMultiplier(signals.schoolCatchments);
    adjustedValue *= this.getCrimeRateMultiplier(signals.crimeRate);
    adjustedValue *= this.getBroadbandMultiplier(signals.broadbandSpeed);
    
    return Math.round(adjustedValue);
  }

  /**
   * Calculate feature importance (simulated)
   */
  private static calculateFeatureImportance(features: MLValuationFeatures) {
    return {
      postcode: 0.25,
      bedrooms: 0.20,
      floorArea: 0.15,
      epcRating: 0.12,
      interestRates: 0.10,
      inflation: 0.10,
      timeToSell: 0.08
    };
  }

  /**
   * Generate market insights using ML analysis
   */
  private static async generateMarketInsights(features: MLValuationFeatures) {
    const hpiData = features.hpiData;
    const recentHPI = hpiData.slice(0, 6);
    
    // Calculate trend
    const trend = this.calculateTrend(recentHPI.map(hpi => hpi.hpi_value));
    const trendDirection = trend > 0.01 ? 'rising' : trend < -0.01 ? 'falling' : 'stable';
    
    // Calculate volatility
    const volatility = this.calculateVolatility(recentHPI.map(hpi => hpi.hpi_value));
    const volatilityLevel = volatility > 0.05 ? 'high' : volatility > 0.02 ? 'medium' : 'low';
    
    // Calculate seasonality
    const seasonality = this.calculateSeasonality(recentHPI.map(hpi => hpi.hpi_value));
    
    // Generate forecasts
    const baseValue = features.lastSoldPrice || 200000;
    const forecast = {
      threeMonth: Math.round(baseValue * (1 + trend * 0.25)),
      sixMonth: Math.round(baseValue * (1 + trend * 0.5)),
      twelveMonth: Math.round(baseValue * (1 + trend))
    };
    
    return {
      trend: trendDirection,
      volatility: volatilityLevel,
      seasonality,
      forecast
    };
  }

  /**
   * Analyze external signal impacts
   */
  private static analyzeSignalImpacts(signals: ExternalSignals) {
    const positive: string[] = [];
    const negative: string[] = [];
    const neutral: string[] = [];
    
    // Interest rates
    if (signals.interestRates < 3.0) {
      positive.push('Low interest rates supporting property values');
    } else if (signals.interestRates > 6.0) {
      negative.push('High interest rates may dampen demand');
    } else {
      neutral.push('Interest rates at normal levels');
    }
    
    // Inflation
    if (signals.inflation < 2.0) {
      positive.push('Low inflation environment');
    } else if (signals.inflation > 5.0) {
      negative.push('High inflation may impact affordability');
    } else {
      neutral.push('Inflation at target levels');
    }
    
    // EPC rating
    if (signals.epcScore === 'A' || signals.epcScore === 'B') {
      positive.push('High energy efficiency rating');
    } else if (signals.epcScore === 'F' || signals.epcScore === 'G') {
      negative.push('Poor energy efficiency may reduce value');
    } else {
      neutral.push('Average energy efficiency');
    }
    
    // Time to sell
    if (signals.timeToSell < 30) {
      positive.push('Fast-selling market');
    } else if (signals.timeToSell > 90) {
      negative.push('Slow market conditions');
    } else {
      neutral.push('Normal market conditions');
    }
    
    return { positive, negative, neutral };
  }

  // Helper methods for feature engineering
  private static getPostcodeValue(postcode: string): number {
    // Simulate postcode value based on area desirability
    const areaCodes = ['SW1', 'W1', 'SW3', 'W8', 'SW7']; // High-value areas
    const prefix = postcode.substring(0, 3).toUpperCase();
    
    if (areaCodes.includes(prefix)) return 1.3;
    if (prefix.startsWith('SW') || prefix.startsWith('W')) return 1.2;
    if (prefix.startsWith('N') || prefix.startsWith('E')) return 1.1;
    if (prefix.startsWith('SE') || prefix.startsWith('S')) return 1.05;
    return 1.0;
  }

  private static getEPCValue(epcRating: string): number {
    return this.EPC_IMPACT[epcRating as keyof typeof this.EPC_IMPACT]?.value || 1.0;
  }

  private static getTimeSinceSale(lastSoldDate: string): number {
    if (!lastSoldDate) return 1.0;
    const soldDate = new Date(lastSoldDate);
    const currentDate = new Date();
    const yearsSinceSale = (currentDate.getTime() - soldDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.min(yearsSinceSale, 10); // Cap at 10 years
  }

  private static getMarketTrend(hpiData: any[]): number {
    if (hpiData.length < 6) return 0;
    const recent = hpiData.slice(0, 6);
    const older = hpiData.slice(6, 12);
    
    if (older.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, hpi) => sum + hpi.hpi_value, 0) / recent.length;
    const olderAvg = older.reduce((sum, hpi) => sum + hpi.hpi_value, 0) / older.length;
    
    return (recentAvg - olderAvg) / olderAvg;
  }

  private static getInterestRateImpact(rate: number): number {
    if (rate <= 2.0) return 1.05;
    if (rate <= 4.0) return 1.00;
    if (rate <= 6.0) return 0.95;
    return 0.90;
  }

  private static getInflationImpact(inflation: number): number {
    if (inflation <= 2.0) return 1.02;
    if (inflation <= 4.0) return 1.00;
    if (inflation <= 6.0) return 0.98;
    return 0.95;
  }

  // Statistical helper methods
  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
    const sumX2 = values.reduce((sum, val, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope / values[0]; // Normalize by first value
  }

  private static calculateSeasonality(values: number[]): number {
    if (values.length < 12) return 0;
    // Simple seasonality calculation
    const monthlyAverages = new Array(12).fill(0);
    const counts = new Array(12).fill(0);
    
    values.forEach((value, index) => {
      const month = index % 12;
      monthlyAverages[month] += value;
      counts[month]++;
    });
    
    monthlyAverages.forEach((sum, month) => {
      monthlyAverages[month] = sum / counts[month];
    });
    
    const overallAverage = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 12;
    const seasonality = monthlyAverages.reduce((sum, avg) => sum + Math.abs(avg - overallAverage), 0) / 12;
    
    return seasonality / overallAverage;
  }

  private static calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  // External signal multipliers
  private static getInterestRateMultiplier(rate: number): number {
    return this.getInterestRateImpact(rate);
  }

  private static getInflationMultiplier(inflation: number): number {
    return this.getInflationImpact(inflation);
  }

  private static getEPCMultiplier(epcScore: string): number {
    return this.getEPCValue(epcScore);
  }

  private static getFloorAreaMultiplier(floorArea: number): number {
    if (!floorArea) return 1.0;
    // Larger properties typically have lower price per sqm
    const normalizedArea = floorArea / 100;
    return 1.0 + (normalizedArea - 1) * 0.05;
  }

  private static getTimeToSellMultiplier(timeToSell: number): number {
    if (!timeToSell) return 1.0;
    if (timeToSell < 30) return 1.05; // Fast market
    if (timeToSell > 90) return 0.95; // Slow market
    return 1.0;
  }

  private static getPlanningMultiplier(planningApplications: number): number {
    if (!planningApplications) return 1.0;
    // More planning activity suggests area development
    return 1.0 + (planningApplications / 100) * 0.02;
  }

  private static getSchoolCatchmentMultiplier(schools: string[]): number {
    if (!schools || schools.length === 0) return 1.0;
    // Good schools increase property values
    return 1.0 + (schools.length * 0.01);
  }

  private static getCrimeRateMultiplier(crimeRate: number): number {
    if (!crimeRate) return 1.0;
    // Lower crime rates increase property values
    const normalizedRate = crimeRate / 1000; // Per 1000 people
    return 1.0 - (normalizedRate * 0.02);
  }

  private static getBroadbandMultiplier(broadbandSpeed: number): number {
    if (!broadbandSpeed) return 1.0;
    // Faster broadband increases property values
    if (broadbandSpeed > 100) return 1.03;
    if (broadbandSpeed > 50) return 1.02;
    if (broadbandSpeed > 25) return 1.01;
    return 1.0;
  }

  private static calculateConfidence(features: MLValuationFeatures): number {
    let confidence = 0.5; // Base confidence
    
    // Data quality factors
    if (features.lastSoldPrice) confidence += 0.2;
    if (features.hpiData.length >= 12) confidence += 0.1;
    if (features.comparables.length >= 5) confidence += 0.1;
    if (features.externalSignals.epcScore) confidence += 0.05;
    if (features.externalSignals.interestRates) confidence += 0.05;
    
    return Math.min(confidence, 0.95);
  }

  private static calculateValueRange(value: number, confidence: number): { min: number; max: number } {
    const rangeMultiplier = confidence > 0.8 ? 0.05 : confidence > 0.6 ? 0.10 : 0.15;
    return {
      min: Math.round(value * (1 - rangeMultiplier)),
      max: Math.round(value * (1 + rangeMultiplier))
    };
  }
} 