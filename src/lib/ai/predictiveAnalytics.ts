import { auditLogger } from '../audit/auditLogger';

export interface PricePrediction {
  id: string;
  propertyId: string;
  currentValue: number;
  predictedValue: number;
  confidence: number; // 0-100
  timeframe: '1_YEAR' | '3_YEAR' | '5_YEAR' | '10_YEAR';
  factors: {
    marketTrend: number;
    locationGrowth: number;
    propertyCondition: number;
    economicFactors: number;
    supplyDemand: number;
  };
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  riskFactors: string[];
  createdAt: string;
  expiresAt: string;
}

export interface MarketForecast {
  id: string;
  region: string;
  timeframe: '1_YEAR' | '3_YEAR' | '5_YEAR';
  predictions: {
    averagePrice: number;
    priceGrowth: number;
    volumeGrowth: number;
    daysOnMarket: number;
  };
  confidence: number;
  keyDrivers: string[];
  risks: string[];
  opportunities: string[];
  createdAt: string;
}

export interface RentalYieldForecast {
  id: string;
  propertyId: string;
  currentYield: number;
  predictedYield: number;
  confidence: number;
  timeframe: '1_YEAR' | '3_YEAR' | '5_YEAR';
  factors: {
    rentalDemand: number;
    supplyGrowth: number;
    economicGrowth: number;
    populationGrowth: number;
  };
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  createdAt: string;
}

export interface InvestmentTiming {
  id: string;
  region: string;
  recommendation: 'BUY_NOW' | 'WAIT' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string[];
  optimalTiming: {
    bestBuyWindow: string;
    bestSellWindow: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  marketIndicators: {
    priceMomentum: number;
    volumeTrend: number;
    inventoryLevel: number;
    economicHealth: number;
  };
  createdAt: string;
}

export interface PredictionRequest {
  propertyId?: string;
  region?: string;
  timeframe: '1_YEAR' | '3_YEAR' | '5_YEAR' | '10_YEAR';
  includeScenarios?: boolean;
  includeRiskFactors?: boolean;
}

export class PredictiveAnalyticsEngine {
  private static instance: PredictiveAnalyticsEngine;
  private predictions: Map<string, PricePrediction[]> = new Map();
  private marketForecasts: Map<string, MarketForecast[]> = new Map();
  private rentalForecasts: Map<string, RentalYieldForecast[]> = new Map();
  private timingRecommendations: Map<string, InvestmentTiming[]> = new Map();

  // Model parameters
  private readonly MODEL_WEIGHTS = {
    historicalTrend: 0.30,
    marketConditions: 0.25,
    locationFactors: 0.20,
    economicIndicators: 0.15,
    supplyDemand: 0.10,
  };

  private readonly CONFIDENCE_FACTORS = {
    dataQuality: 0.40,
    marketStability: 0.30,
    modelAccuracy: 0.20,
    externalFactors: 0.10,
  };

  public static getInstance(): PredictiveAnalyticsEngine {
    if (!PredictiveAnalyticsEngine.instance) {
      PredictiveAnalyticsEngine.instance = new PredictiveAnalyticsEngine();
    }
    return PredictiveAnalyticsEngine.instance;
  }

  // Predict property price
  public async predictPropertyPrice(request: PredictionRequest): Promise<PricePrediction | null> {
    try {
      if (!request.propertyId) return null;

      // Get property data
      const property = await this.getPropertyData(request.propertyId);
      if (!property) return null;

      // Get market context
      const marketContext = await this.getMarketContext(property.region);

      // Calculate prediction factors
      const factors = await this.calculatePredictionFactors(property, marketContext);

      // Generate prediction
      const prediction = await this.generatePricePrediction(property, factors, request);

      // Store prediction
      if (!this.predictions.has(request.propertyId)) {
        this.predictions.set(request.propertyId, []);
      }
      this.predictions.get(request.propertyId)!.push(prediction);

      // Log prediction
      await auditLogger.logSystemEvent('price_prediction_generated', {
        propertyId: request.propertyId,
        timeframe: request.timeframe,
        confidence: prediction.confidence,
        predictedValue: prediction.predictedValue,
        currentValue: prediction.currentValue,
      });

      return prediction;
    } catch (error) {
      console.error('Error predicting property price:', error);
      return null;
    }
  }

  // Generate market forecast
  public async generateMarketForecast(region: string, timeframe: '1_YEAR' | '3_YEAR' | '5_YEAR'): Promise<MarketForecast | null> {
    try {
      // Get market data
      const marketData = await this.getMarketData(region);
      const economicData = await this.getEconomicData(region);

      // Calculate forecast
      const forecast = await this.calculateMarketForecast(region, timeframe, marketData, economicData);

      // Store forecast
      if (!this.marketForecasts.has(region)) {
        this.marketForecasts.set(region, []);
      }
      this.marketForecasts.get(region)!.push(forecast);

      // Log forecast
      await auditLogger.logSystemEvent('market_forecast_generated', {
        region,
        timeframe,
        confidence: forecast.confidence,
        priceGrowth: forecast.predictions.priceGrowth,
      });

      return forecast;
    } catch (error) {
      console.error('Error generating market forecast:', error);
      return null;
    }
  }

  // Predict rental yield
  public async predictRentalYield(propertyId: string, timeframe: '1_YEAR' | '3_YEAR' | '5_YEAR'): Promise<RentalYieldForecast | null> {
    try {
      // Get property and rental data
      const property = await this.getPropertyData(propertyId);
      const rentalData = await this.getRentalData(propertyId);

      if (!property || !rentalData) return null;

      // Calculate rental factors
      const factors = await this.calculateRentalFactors(property, rentalData);

      // Generate forecast
      const forecast = await this.generateRentalForecast(propertyId, factors, timeframe);

      // Store forecast
      if (!this.rentalForecasts.has(propertyId)) {
        this.rentalForecasts.set(propertyId, []);
      }
      this.rentalForecasts.get(propertyId)!.push(forecast);

      return forecast;
    } catch (error) {
      console.error('Error predicting rental yield:', error);
      return null;
    }
  }

  // Get investment timing recommendation
  public async getInvestmentTiming(region: string): Promise<InvestmentTiming | null> {
    try {
      // Get market indicators
      const marketIndicators = await this.calculateMarketIndicators(region);
      
      // Generate timing recommendation
      const timing = await this.generateTimingRecommendation(region, marketIndicators);

      // Store recommendation
      if (!this.timingRecommendations.has(region)) {
        this.timingRecommendations.set(region, []);
      }
      this.timingRecommendations.get(region)!.push(timing);

      return timing;
    } catch (error) {
      console.error('Error getting investment timing:', error);
      return null;
    }
  }

  // Calculate prediction factors
  private async calculatePredictionFactors(property: any, marketContext: any): Promise<PricePrediction['factors']> {
    // Market trend factor
    const marketTrend = this.calculateMarketTrendFactor(marketContext);
    
    // Location growth factor
    const locationGrowth = this.calculateLocationGrowthFactor(property);
    
    // Property condition factor
    const propertyCondition = this.calculatePropertyConditionFactor(property);
    
    // Economic factors
    const economicFactors = this.calculateEconomicFactor(marketContext);
    
    // Supply and demand factor
    const supplyDemand = this.calculateSupplyDemandFactor(marketContext);

    return {
      marketTrend,
      locationGrowth,
      propertyCondition,
      economicFactors,
      supplyDemand,
    };
  }

  // Calculate market trend factor
  private calculateMarketTrendFactor(marketContext: any): number {
    const priceGrowth = marketContext.priceGrowth || 0;
    const volumeGrowth = marketContext.volumeGrowth || 0;
    const daysOnMarket = marketContext.daysOnMarket || 30;
    
    // Normalize to 0-100 scale
    const priceScore = Math.min(100, Math.max(0, (priceGrowth + 5) * 10)); // -5% to +5% maps to 0-100
    const volumeScore = Math.min(100, Math.max(0, (volumeGrowth + 10) * 5)); // -10% to +10% maps to 0-100
    const speedScore = Math.min(100, Math.max(0, (60 - daysOnMarket) * 2)); // 0-60 days maps to 0-100
    
    return (priceScore * 0.5) + (volumeScore * 0.3) + (speedScore * 0.2);
  }

  // Calculate location growth factor
  private calculateLocationGrowthFactor(property: any): number {
    const transportScore = property.transportScore || 50;
    const developmentScore = property.developmentScore || 50;
    const amenityScore = property.amenityScore || 50;
    const schoolScore = property.schoolScore || 50;
    
    return (transportScore * 0.3) + (developmentScore * 0.3) + (amenityScore * 0.2) + (schoolScore * 0.2);
  }

  // Calculate property condition factor
  private calculatePropertyConditionFactor(property: any): number {
    const conditionScore = property.conditionScore || 50;
    const ageScore = property.ageScore || 50;
    const renovationScore = property.renovationScore || 50;
    
    return (conditionScore * 0.5) + (ageScore * 0.3) + (renovationScore * 0.2);
  }

  // Calculate economic factor
  private calculateEconomicFactor(marketContext: any): number {
    const gdpGrowth = marketContext.gdpGrowth || 0;
    const inflation = marketContext.inflation || 0;
    const interestRates = marketContext.interestRates || 0;
    const unemployment = marketContext.unemployment || 0;
    
    // Normalize economic indicators
    const gdpScore = Math.min(100, Math.max(0, (gdpGrowth + 2) * 25)); // -2% to +2% maps to 0-100
    const inflationScore = Math.min(100, Math.max(0, (3 - inflation) * 33)); // 0-3% maps to 100-0
    const interestScore = Math.min(100, Math.max(0, (8 - interestRates) * 12.5)); // 0-8% maps to 100-0
    const unemploymentScore = Math.min(100, Math.max(0, (10 - unemployment) * 10)); // 0-10% maps to 100-0
    
    return (gdpScore * 0.3) + (inflationScore * 0.25) + (interestScore * 0.25) + (unemploymentScore * 0.2);
  }

  // Calculate supply and demand factor
  private calculateSupplyDemandFactor(marketContext: any): number {
    const supply = marketContext.propertySupply || 100;
    const demand = marketContext.propertyDemand || 100;
    const inventory = marketContext.inventoryLevel || 6;
    
    const demandSupplyRatio = demand / supply;
    const inventoryScore = Math.min(100, Math.max(0, (12 - inventory) * 8.33)); // 0-12 months maps to 100-0
    
    return Math.min(100, (demandSupplyRatio * 50) + (inventoryScore * 0.5));
  }

  // Generate price prediction
  private async generatePricePrediction(
    property: any,
    factors: PricePrediction['factors'],
    request: PredictionRequest
  ): Promise<PricePrediction> {
    const currentValue = property.price || 250000;
    
    // Calculate weighted factor score
    const weightedScore = 
      (factors.marketTrend * this.MODEL_WEIGHTS.marketConditions) +
      (factors.locationGrowth * this.MODEL_WEIGHTS.locationFactors) +
      (factors.propertyCondition * this.MODEL_WEIGHTS.historicalTrend) +
      (factors.economicFactors * this.MODEL_WEIGHTS.economicIndicators) +
      (factors.supplyDemand * this.MODEL_WEIGHTS.supplyDemand);

    // Convert to growth rate
    const growthRate = (weightedScore - 50) / 1000; // -5% to +5% range
    
    // Apply timeframe multiplier
    const years = this.getTimeframeYears(request.timeframe);
    const totalGrowth = Math.pow(1 + growthRate, years);
    
    const predictedValue = currentValue * totalGrowth;
    
    // Calculate confidence
    const confidence = this.calculatePredictionConfidence(property, factors);
    
    // Generate scenarios
    const scenarios = this.generateScenarios(currentValue, growthRate, years);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(factors, property);

    return {
      id: this.generateId(),
      propertyId: request.propertyId!,
      currentValue,
      predictedValue: Math.round(predictedValue),
      confidence,
      timeframe: request.timeframe,
      factors,
      scenarios,
      riskFactors,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };
  }

  // Calculate prediction confidence
  private calculatePredictionConfidence(property: any, factors: PricePrediction['factors']): number {
    let confidence = 50; // Base confidence

    // Data quality
    if (property.dataCompleteness >= 0.8) confidence += 20;
    if (property.recentSales >= 5) confidence += 15;
    if (property.marketDataAge < 30) confidence += 10;

    // Factor consistency
    const factorVariance = this.calculateFactorVariance(factors);
    if (factorVariance < 20) confidence += 15;

    // Market stability
    if (factors.marketTrend > 40 && factors.marketTrend < 80) confidence += 10;

    return Math.min(100, Math.max(0, confidence));
  }

  // Calculate factor variance
  private calculateFactorVariance(factors: PricePrediction['factors']): number {
    const values = Object.values(factors);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // Generate scenarios
  private generateScenarios(currentValue: number, baseGrowthRate: number, years: number): PricePrediction['scenarios'] {
    const optimisticRate = baseGrowthRate * 1.5;
    const pessimisticRate = baseGrowthRate * 0.5;
    
    return {
      optimistic: Math.round(currentValue * Math.pow(1 + optimisticRate, years)),
      realistic: Math.round(currentValue * Math.pow(1 + baseGrowthRate, years)),
      pessimistic: Math.round(currentValue * Math.pow(1 + pessimisticRate, years)),
    };
  }

  // Identify risk factors
  private identifyRiskFactors(factors: PricePrediction['factors'], property: any): string[] {
    const risks: string[] = [];

    if (factors.marketTrend < 40) {
      risks.push('Weak market conditions may impact growth');
    }
    if (factors.economicFactors < 40) {
      risks.push('Economic headwinds could affect property values');
    }
    if (factors.supplyDemand < 40) {
      risks.push('High supply relative to demand may pressure prices');
    }
    if (property.conditionScore < 40) {
      risks.push('Property condition may require significant investment');
    }
    if (property.dataCompleteness < 0.6) {
      risks.push('Limited data may affect prediction accuracy');
    }

    return risks;
  }

  // Get timeframe in years
  private getTimeframeYears(timeframe: string): number {
    switch (timeframe) {
      case '1_YEAR': return 1;
      case '3_YEAR': return 3;
      case '5_YEAR': return 5;
      case '10_YEAR': return 10;
      default: return 1;
    }
  }

  // Mock data methods (in real implementation, these would query databases)
  private async getPropertyData(propertyId: string): Promise<any> {
    // Mock property data
    return {
      id: propertyId,
      price: 250000,
      region: 'London',
      transportScore: 85,
      developmentScore: 70,
      amenityScore: 80,
      schoolScore: 75,
      conditionScore: 80,
      ageScore: 70,
      renovationScore: 60,
      dataCompleteness: 0.9,
      recentSales: 8,
      marketDataAge: 15,
    };
  }

  private async getMarketContext(region: string): Promise<any> {
    // Mock market context
    return {
      priceGrowth: 2.5,
      volumeGrowth: 5.0,
      daysOnMarket: 25,
      gdpGrowth: 1.8,
      inflation: 2.1,
      interestRates: 4.5,
      unemployment: 4.2,
      propertySupply: 120,
      propertyDemand: 150,
      inventoryLevel: 4.5,
    };
  }

  private async getMarketData(region: string): Promise<any> {
    // Mock market data
    return {
      region,
      averagePrice: 450000,
      priceGrowth: 2.5,
      volumeGrowth: 5.0,
      daysOnMarket: 25,
    };
  }

  private async getEconomicData(region: string): Promise<any> {
    // Mock economic data
    return {
      region,
      gdpGrowth: 1.8,
      inflation: 2.1,
      interestRates: 4.5,
      unemployment: 4.2,
    };
  }

  private async getRentalData(propertyId: string): Promise<any> {
    // Mock rental data
    return {
      propertyId,
      currentRent: 1200,
      rentalGrowth: 3.0,
      vacancyRate: 2.5,
    };
  }

  private async calculateRentalFactors(property: any, rentalData: any): Promise<RentalYieldForecast['factors']> {
    return {
      rentalDemand: 75,
      supplyGrowth: 60,
      economicGrowth: 70,
      populationGrowth: 65,
    };
  }

  private async generateRentalForecast(propertyId: string, factors: any, timeframe: string): Promise<RentalYieldForecast> {
    return {
      id: this.generateId(),
      propertyId,
      currentYield: 5.5,
      predictedYield: 6.2,
      confidence: 75,
      timeframe: timeframe as any,
      factors,
      scenarios: {
        optimistic: 7.0,
        realistic: 6.2,
        pessimistic: 5.0,
      },
      createdAt: new Date().toISOString(),
    };
  }

  private async calculateMarketForecast(region: string, timeframe: string, marketData: any, economicData: any): Promise<MarketForecast> {
    return {
      id: this.generateId(),
      region,
      timeframe: timeframe as any,
      predictions: {
        averagePrice: 475000,
        priceGrowth: 3.2,
        volumeGrowth: 6.5,
        daysOnMarket: 22,
      },
      confidence: 80,
      keyDrivers: ['Economic growth', 'Population increase', 'Infrastructure development'],
      risks: ['Interest rate rises', 'Economic uncertainty'],
      opportunities: ['Regeneration projects', 'Transport improvements'],
      createdAt: new Date().toISOString(),
    };
  }

  private async calculateMarketIndicators(region: string): Promise<InvestmentTiming['marketIndicators']> {
    return {
      priceMomentum: 75,
      volumeTrend: 70,
      inventoryLevel: 60,
      economicHealth: 80,
    };
  }

  private async generateTimingRecommendation(region: string, indicators: any): Promise<InvestmentTiming> {
    const overallScore = (indicators.priceMomentum + indicators.volumeTrend + indicators.economicHealth - indicators.inventoryLevel) / 4;
    
    let recommendation: InvestmentTiming['recommendation'];
    if (overallScore >= 70) recommendation = 'BUY_NOW';
    else if (overallScore >= 50) recommendation = 'HOLD';
    else if (overallScore >= 30) recommendation = 'WAIT';
    else recommendation = 'SELL';

    return {
      id: this.generateId(),
      region,
      recommendation,
      confidence: Math.round(overallScore),
      reasoning: [
        'Market indicators suggest favorable conditions',
        'Economic fundamentals remain strong',
        'Supply-demand balance is healthy',
      ],
      optimalTiming: {
        bestBuyWindow: 'Next 3-6 months',
        bestSellWindow: 'Next 12-18 months',
        riskLevel: overallScore >= 70 ? 'LOW' : overallScore >= 50 ? 'MEDIUM' : 'HIGH',
      },
      marketIndicators: indicators,
      createdAt: new Date().toISOString(),
    };
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const predictiveAnalyticsEngine = PredictiveAnalyticsEngine.getInstance();
