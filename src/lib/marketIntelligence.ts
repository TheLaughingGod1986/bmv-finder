import { performanceMonitor } from './performanceMonitor';
import { errorHandler } from './errorHandler';
import { redisService } from './redisService';

interface MarketTrend {
  period: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  factors: string[];
  predictedGrowth: number;
  volatility: number;
}

interface PropertyPrediction {
  propertyId: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeHorizon: '3months' | '6months' | '1year' | '3years' | '5years';
  factors: {
    marketTrends: number;
    locationFactors: number;
    propertyFactors: number;
    economicFactors: number;
  };
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    marketRisk: number;
    locationRisk: number;
    propertyRisk: number;
  };
}

interface MarketAnalysis {
  region: string;
  postcode: string;
  currentHPI: number;
  predictedHPI: number;
  marketPhase: 'recovery' | 'growth' | 'peak' | 'decline';
  investmentOpportunity: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
  confidence: number;
}

interface EconomicIndicator {
  name: string;
  value: number;
  change: number;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
}

class MarketIntelligenceEngine {
  private marketData: Map<string, MarketAnalysis> = new Map();
  private predictions: Map<string, PropertyPrediction[]> = new Map();
  private economicIndicators: EconomicIndicator[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.initializeEconomicIndicators();
    this.initializeMarketData();
  }

  // Initialize economic indicators
  private initializeEconomicIndicators(): void {
    this.economicIndicators = [
      {
        name: 'Interest Rates',
        value: 5.25,
        change: 0.25,
        impact: 'negative',
        weight: 0.25
      },
      {
        name: 'Inflation Rate',
        value: 3.2,
        change: -0.3,
        impact: 'positive',
        weight: 0.20
      },
      {
        name: 'GDP Growth',
        value: 2.1,
        change: 0.2,
        impact: 'positive',
        weight: 0.20
      },
      {
        name: 'Unemployment Rate',
        value: 4.2,
        change: -0.1,
        impact: 'positive',
        weight: 0.15
      },
      {
        name: 'Consumer Confidence',
        value: 68.2,
        change: 2.1,
        impact: 'positive',
        weight: 0.20
      }
    ];
  }

  // Initialize market data
  private async initializeMarketData(): Promise<void> {
    try {
      // Load market data from cache or external sources
      const cachedData = await redisService.get<Map<string, MarketAnalysis>>('market_data:analysis');
      if (cachedData) {
        this.marketData = cachedData;
      }

      this.isInitialized = true;
      performanceMonitor.trackMetric('market_intelligence_init', 1, 'status', { status: 'success' });
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'market_intelligence_init',
        method: 'INIT',
        metadata: {}
      });
      this.isInitialized = false;
    }
  }

  // Analyze market trends for a specific region
  async analyzeMarketTrends(
    region: string,
    postcode: string,
    timeHorizon: '3months' | '6months' | '1year' | '3years' | '5years' = '1year'
  ): Promise<MarketAnalysis> {
    const startTime = Date.now();
    const cacheKey = `market_analysis:${region}:${postcode}:${timeHorizon}`;

    try {
      // Check cache first
      const cached = await redisService.get<MarketAnalysis>(cacheKey, 'market_data');
      if (cached) {
        return cached;
      }

      // Perform market analysis
      const analysis = await this.performMarketAnalysis(region, postcode, timeHorizon);
      
      // Cache the result
      await redisService.set(cacheKey, analysis, 'market_data');
      
      // Update local cache
      this.marketData.set(`${region}:${postcode}`, analysis);

      const executionTime = Date.now() - startTime;
      performanceMonitor.trackMetric('market_analysis', executionTime, 'ms', { region, postcode, timeHorizon });
      
      return analysis;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await errorHandler.handleError(error as Error, {
        endpoint: 'market_analysis',
        method: 'ANALYZE',
        metadata: { region, postcode, timeHorizon }
      });

      // Return fallback analysis
      return this.getFallbackMarketAnalysis(region, postcode);
    }
  }

  // Perform comprehensive market analysis
  private async performMarketAnalysis(
    region: string,
    postcode: string,
    timeHorizon: string
  ): Promise<MarketAnalysis> {
    // Simulate complex market analysis
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    const currentHPI = 100 + Math.random() * 50;
    const predictedHPI = currentHPI * (1 + (Math.random() * 0.2 - 0.1));
    
    const marketPhase = this.determineMarketPhase(currentHPI, predictedHPI);
    const investmentOpportunity = this.assessInvestmentOpportunity(currentHPI, predictedHPI, region);
    const confidence = 70 + Math.random() * 25;

    const recommendations = this.generateMarketRecommendations(marketPhase, investmentOpportunity, region);

    return {
      region,
      postcode,
      currentHPI: Math.round(currentHPI * 100) / 100,
      predictedHPI: Math.round(predictedHPI * 100) / 100,
      marketPhase,
      investmentOpportunity,
      recommendations,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  // Determine market phase based on HPI trends
  private determineMarketPhase(currentHPI: number, predictedHPI: number): MarketAnalysis['marketPhase'] {
    const growthRate = (predictedHPI - currentHPI) / currentHPI;
    
    if (growthRate > 0.05) return 'growth';
    if (growthRate > 0.02) return 'recovery';
    if (growthRate < -0.02) return 'decline';
    return 'peak';
  }

  // Assess investment opportunity
  private assessInvestmentOpportunity(
    currentHPI: number,
    predictedHPI: number,
    region: string
  ): MarketAnalysis['investmentOpportunity'] {
    const growthRate = (predictedHPI - currentHPI) / currentHPI;
    const regionMultiplier = this.getRegionMultiplier(region);
    
    const score = growthRate * regionMultiplier * 100;
    
    if (score > 8) return 'excellent';
    if (score > 5) return 'good';
    if (score > 2) return 'fair';
    return 'poor';
  }

  // Get region-specific multiplier
  private getRegionMultiplier(region: string): number {
    const multipliers: Record<string, number> = {
      'London': 1.5,
      'South East': 1.3,
      'South West': 1.2,
      'East of England': 1.1,
      'West Midlands': 1.0,
      'East Midlands': 0.9,
      'North West': 0.8,
      'Yorkshire and The Humber': 0.8,
      'North East': 0.7
    };
    
    return multipliers[region] || 1.0;
  }

  // Generate market recommendations
  private generateMarketRecommendations(
    marketPhase: MarketAnalysis['marketPhase'],
    opportunity: MarketAnalysis['investmentOpportunity'],
    region: string
  ): string[] {
    const recommendations: string[] = [];

    switch (marketPhase) {
      case 'recovery':
        recommendations.push('Market showing signs of recovery - consider early investment opportunities');
        recommendations.push('Focus on properties with strong fundamentals and growth potential');
        break;
      case 'growth':
        recommendations.push('Market in growth phase - excellent time for strategic investments');
        recommendations.push('Consider properties in emerging neighborhoods with good transport links');
        break;
      case 'peak':
        recommendations.push('Market approaching peak - be selective with investments');
        recommendations.push('Focus on properties with unique features or strong rental potential');
        break;
      case 'decline':
        recommendations.push('Market in decline - focus on defensive investments');
        recommendations.push('Consider properties with strong rental yields and stable demand');
        break;
    }

    if (opportunity === 'excellent') {
      recommendations.push('High investment potential in this area');
    } else if (opportunity === 'poor') {
      recommendations.push('Consider alternative investment locations');
    }

    if (region === 'London') {
      recommendations.push('London market typically shows strong long-term growth potential');
    }

    return recommendations;
  }

  // Predict property value
  async predictPropertyValue(
    propertyId: string,
    currentValue: number,
    location: string,
    propertyFeatures: {
      bedrooms: number;
      floorArea: number;
      propertyType: string;
      age: number;
      condition: string;
    },
    timeHorizon: PropertyPrediction['timeHorizon'] = '1year'
  ): Promise<PropertyPrediction> {
    const startTime = Date.now();
    const cacheKey = `property_prediction:${propertyId}:${timeHorizon}`;

    try {
      // Check cache first
      const cached = await redisService.get<PropertyPrediction>(cacheKey, 'market_data');
      if (cached) {
        return cached;
      }

      // Perform prediction
      const prediction = await this.performPropertyPrediction(
        propertyId,
        currentValue,
        location,
        propertyFeatures,
        timeHorizon
      );

      // Cache the result
      await redisService.set(cacheKey, prediction, 'market_data');
      
      // Store in local cache
      if (!this.predictions.has(propertyId)) {
        this.predictions.set(propertyId, []);
      }
      this.predictions.get(propertyId)!.push(prediction);

      const executionTime = Date.now() - startTime;
      performanceMonitor.trackMetric('property_prediction', executionTime, 'ms', { propertyId, timeHorizon });
      
      return prediction;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await errorHandler.handleError(error as Error, {
        endpoint: 'property_prediction',
        method: 'PREDICT',
        metadata: { propertyId, location, timeHorizon }
      });

      // Return fallback prediction
      return this.getFallbackPropertyPrediction(propertyId, currentValue, timeHorizon);
    }
  }

  // Perform property value prediction
  private async performPropertyPrediction(
    propertyId: string,
    currentValue: number,
    location: string,
    propertyFeatures: any,
    timeHorizon: string
  ): Promise<PropertyPrediction> {
    // Simulate complex prediction algorithm
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));

    // Calculate prediction factors
    const marketTrends = this.calculateMarketTrendsFactor(location);
    const locationFactors = this.calculateLocationFactors(location);
    const propertyFactors = this.calculatePropertyFactors(propertyFeatures);
    const economicFactors = this.calculateEconomicFactors();

    // Calculate predicted value
    const totalFactor = (marketTrends + locationFactors + propertyFactors + economicFactors) / 4;
    const timeMultiplier = this.getTimeHorizonMultiplier(timeHorizon);
    const predictedValue = currentValue * (1 + totalFactor * timeMultiplier);

    // Calculate confidence
    const confidence = Math.min(95, 70 + Math.random() * 25);

    // Assess risk
    const riskAssessment = this.assessPropertyRisk(marketTrends, locationFactors, propertyFactors);

    return {
      propertyId,
      currentValue,
      predictedValue: Math.round(predictedValue),
      confidence: Math.round(confidence * 100) / 100,
      timeHorizon: timeHorizon as PropertyPrediction['timeHorizon'],
      factors: {
        marketTrends: Math.round(marketTrends * 1000) / 1000,
        locationFactors: Math.round(locationFactors * 1000) / 1000,
        propertyFactors: Math.round(propertyFactors * 1000) / 1000,
        economicFactors: Math.round(economicFactors * 1000) / 1000
      },
      riskAssessment
    };
  }

  // Calculate market trends factor
  private calculateMarketTrendsFactor(location: string): number {
    const baseFactor = 0.02; // 2% base growth
    const locationBonus = this.getLocationBonus(location);
    return baseFactor + locationBonus + (Math.random() * 0.03 - 0.015);
  }

  // Calculate location factors
  private calculateLocationFactors(location: string): number {
    const baseFactor = 0.015;
    const transportBonus = location.includes('Station') ? 0.01 : 0;
    const schoolBonus = location.includes('School') ? 0.008 : 0;
    return baseFactor + transportBonus + schoolBonus + (Math.random() * 0.02 - 0.01);
  }

  // Calculate property factors
  private calculatePropertyFactors(features: any): number {
    let factor = 0.01; // Base factor
    
    // Bedroom factor
    if (features.bedrooms >= 3) factor += 0.005;
    if (features.bedrooms >= 4) factor += 0.003;
    
    // Property type factor
    if (features.propertyType === 'Detached') factor += 0.008;
    if (features.propertyType === 'Semi-Detached') factor += 0.005;
    
    // Age factor
    if (features.age < 10) factor += 0.003;
    if (features.age > 50) factor += 0.002;
    
    return factor + (Math.random() * 0.01 - 0.005);
  }

  // Calculate economic factors
  private calculateEconomicFactors(): number {
    let factor = 0;
    
    for (const indicator of this.economicIndicators) {
      const impact = indicator.impact === 'positive' ? 1 : indicator.impact === 'negative' ? -1 : 0;
      factor += (indicator.change / 100) * impact * indicator.weight;
    }
    
    return factor + (Math.random() * 0.01 - 0.005);
  }

  // Get time horizon multiplier
  private getTimeHorizonMultiplier(timeHorizon: string): number {
    const multipliers: Record<string, number> = {
      '3months': 0.25,
      '6months': 0.5,
      '1year': 1.0,
      '3years': 3.0,
      '5years': 5.0
    };
    
    return multipliers[timeHorizon] || 1.0;
  }

  // Get location bonus
  private getLocationBonus(location: string): number {
    if (location.includes('London')) return 0.01;
    if (location.includes('Manchester') || location.includes('Birmingham')) return 0.008;
    if (location.includes('Leeds') || location.includes('Liverpool')) return 0.006;
    return 0.003;
  }

  // Assess property risk
  private assessPropertyRisk(
    marketTrends: number,
    locationFactors: number,
    propertyFactors: number
  ): PropertyPrediction['riskAssessment'] {
    const marketRisk = Math.max(0, 1 - marketTrends * 50);
    const locationRisk = Math.max(0, 1 - locationFactors * 50);
    const propertyRisk = Math.max(0, 1 - propertyFactors * 50);
    
    const overallRisk = (marketRisk + locationRisk + propertyRisk) / 3;
    
    let riskLevel: 'low' | 'medium' | 'high';
    if (overallRisk < 0.3) riskLevel = 'low';
    else if (overallRisk < 0.6) riskLevel = 'medium';
    else riskLevel = 'high';

    return {
      overallRisk: riskLevel,
      marketRisk: Math.round(marketRisk * 100),
      locationRisk: Math.round(locationRisk * 100),
      propertyRisk: Math.round(propertyRisk * 100)
    };
  }

  // Get fallback market analysis
  private getFallbackMarketAnalysis(region: string, postcode: string): MarketAnalysis {
    return {
      region,
      postcode,
      currentHPI: 100,
      predictedHPI: 102,
      marketPhase: 'neutral',
      investmentOpportunity: 'fair',
      recommendations: ['Market data temporarily unavailable - use with caution'],
      confidence: 50
    };
  }

  // Get fallback property prediction
  private getFallbackPropertyPrediction(
    propertyId: string,
    currentValue: number,
    timeHorizon: string
  ): PropertyPrediction {
    return {
      propertyId,
      currentValue,
      predictedValue: currentValue,
      confidence: 50,
      timeHorizon: timeHorizon as PropertyPrediction['timeHorizon'],
      factors: {
        marketTrends: 0,
        locationFactors: 0,
        propertyFactors: 0,
        economicFactors: 0
      },
      riskAssessment: {
        overallRisk: 'medium',
        marketRisk: 50,
        locationRisk: 50,
        propertyRisk: 50
      }
    };
  }

  // Get market intelligence summary
  async getMarketIntelligenceSummary(region?: string): Promise<{
    totalAnalyses: number;
    totalPredictions: number;
    averageConfidence: number;
    marketTrends: MarketTrend[];
    topOpportunities: MarketAnalysis[];
    riskAlerts: PropertyPrediction[];
  }> {
    try {
      const analyses = Array.from(this.marketData.values());
      const allPredictions = Array.from(this.predictions.values()).flat();
      
      const filteredAnalyses = region ? analyses.filter(a => a.region === region) : analyses;
      const filteredPredictions = region ? allPredictions.filter(p => 
        this.marketData.has(region) // Simple region check
      ) : allPredictions;

      const averageConfidence = analyses.length > 0 ? 
        analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length : 0;

      const marketTrends = this.generateMarketTrends(analyses);
      const topOpportunities = this.identifyTopOpportunities(filteredAnalyses);
      const riskAlerts = this.identifyRiskAlerts(filteredPredictions);

      return {
        totalAnalyses: filteredAnalyses.length,
        totalPredictions: filteredPredictions.length,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        marketTrends,
        topOpportunities,
        riskAlerts
      };
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        endpoint: 'market_intelligence_summary',
        method: 'SUMMARY',
        metadata: { region }
      });

      return {
        totalAnalyses: 0,
        totalPredictions: 0,
        averageConfidence: 0,
        marketTrends: [],
        topOpportunities: [],
        riskAlerts: []
      };
    }
  }

  // Generate market trends
  private generateMarketTrends(analyses: MarketAnalysis[]): MarketTrend[] {
    const trends: MarketTrend[] = [];
    const periods = ['3months', '6months', '1year', '3years', '5years'];
    
    for (const period of periods) {
      const periodAnalyses = analyses.filter(a => a.confidence > 70);
      if (periodAnalyses.length === 0) continue;

      const avgGrowth = periodAnalyses.reduce((sum, a) => 
        sum + (a.predictedHPI - a.currentHPI) / a.currentHPI, 0
      ) / periodAnalyses.length;

      const trend: MarketTrend = {
        period,
        trend: avgGrowth > 0.02 ? 'bullish' : avgGrowth < -0.02 ? 'bearish' : 'neutral',
        confidence: periodAnalyses.reduce((sum, a) => sum + a.confidence, 0) / periodAnalyses.length,
        factors: this.identifyTrendFactors(avgGrowth),
        predictedGrowth: Math.round(avgGrowth * 10000) / 100,
        volatility: Math.random() * 5 + 2
      };

      trends.push(trend);
    }

    return trends;
  }

  // Identify trend factors
  private identifyTrendFactors(growthRate: number): string[] {
    const factors: string[] = [];
    
    if (growthRate > 0.05) {
      factors.push('Strong economic growth');
      factors.push('Low interest rates');
      factors.push('High demand');
    } else if (growthRate > 0.02) {
      factors.push('Moderate economic growth');
      factors.push('Stable demand');
    } else if (growthRate < -0.02) {
      factors.push('Economic uncertainty');
      factors.push('Rising interest rates');
      factors.push('Decreased demand');
    } else {
      factors.push('Market stability');
      factors.push('Balanced supply and demand');
    }

    return factors;
  }

  // Identify top opportunities
  private identifyTopOpportunities(analyses: MarketAnalysis[]): MarketAnalysis[] {
    return analyses
      .filter(a => a.investmentOpportunity === 'excellent' || a.investmentOpportunity === 'good')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  // Identify risk alerts
  private identifyRiskAlerts(predictions: PropertyPrediction[]): PropertyPrediction[] {
    return predictions
      .filter(p => p.riskAssessment.overallRisk === 'high')
      .sort((a, b) => b.riskAssessment.marketRisk - a.riskAssessment.marketRisk)
      .slice(0, 5);
  }

  // Update economic indicators
  updateEconomicIndicators(newIndicators: EconomicIndicator[]): void {
    this.economicIndicators = newIndicators;
  }

  // Get economic indicators
  getEconomicIndicators(): EconomicIndicator[] {
    return [...this.economicIndicators];
  }

  // Check if system is initialized
  isSystemInitialized(): boolean {
    return this.isInitialized;
  }

  // Clear all data
  clearData(): void {
    this.marketData.clear();
    this.predictions.clear();
  }
}

// Create singleton instance
export const marketIntelligence = new MarketIntelligenceEngine();

// Export types and utilities
export type { MarketTrend, PropertyPrediction, MarketAnalysis, EconomicIndicator };
export { MarketIntelligenceEngine };

export default marketIntelligence;
