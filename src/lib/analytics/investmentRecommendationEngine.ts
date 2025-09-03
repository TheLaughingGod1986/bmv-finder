import { PropertyAnalyticsData, MarketIntelligenceData } from './propertyAnalytics';
import { auditLogger } from '../audit/auditLogger';

export interface InvestmentRecommendation {
  id: string;
  propertyId: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL' | 'AVOID';
  confidence: number;
  score: number;
  reasoning: {
    primary: string;
    secondary: string[];
    risks: string[];
    opportunities: string[];
  };
  financial: {
    expectedReturn: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
    investmentType: 'CAPITAL_GROWTH' | 'RENTAL_INCOME' | 'BALANCED';
    targetYield: number;
    breakEvenTime: number;
  };
  market: {
    marketTiming: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    marketCycle: 'EARLY' | 'GROWTH' | 'PEAK' | 'DECLINE';
    competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    demandForecast: 'STRONG' | 'MODERATE' | 'WEAK';
  };
  portfolio: {
    diversification: number;
    correlation: number;
    portfolioFit: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    recommendedAllocation: number;
  };
  timeline: {
    shortTerm: {
      months: number;
      expectedReturn: number;
      keyEvents: string[];
    };
    mediumTerm: {
      months: number;
      expectedReturn: number;
      keyEvents: string[];
    };
    longTerm: {
      months: number;
      expectedReturn: number;
      keyEvents: string[];
    };
  };
  alternatives: Array<{
    type: string;
    description: string;
    expectedReturn: number;
    riskLevel: string;
  }>;
  createdAt: Date;
  expiresAt: Date;
}

export interface PortfolioAnalysis {
  portfolioId: string;
  totalValue: number;
  totalReturn: number;
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
    valueAtRisk: number;
  };
  performance: {
    oneMonth: number;
    threeMonths: number;
    sixMonths: number;
    oneYear: number;
    threeYears: number;
    fiveYears: number;
  };
  allocation: {
    byPropertyType: Record<string, number>;
    byRegion: Record<string, number>;
    byInvestmentType: Record<string, number>;
  };
  recommendations: {
    rebalancing: Array<{
      action: 'BUY' | 'SELL' | 'HOLD';
      propertyId: string;
      amount: number;
      reason: string;
    }>;
    newInvestments: Array<{
      propertyType: string;
      region: string;
      targetAllocation: number;
      reason: string;
    }>;
    riskManagement: Array<{
      action: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
    }>;
  };
  benchmarking: {
    marketIndex: number;
    peerGroup: number;
    riskAdjustedReturn: number;
    alpha: number;
    informationRatio: number;
  };
}

export interface MarketOpportunity {
  id: string;
  type: 'EMERGING_MARKET' | 'UNDERVALUED_AREA' | 'DEVELOPMENT_POTENTIAL' | 'RENTAL_HOTSPOT';
  region: string;
  postcode: string;
  description: string;
  opportunityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  expectedReturn: number;
  keyDrivers: string[];
  risks: string[];
  recommendedAction: string;
  marketData: {
    currentPrices: number;
    priceGrowth: number;
    rentalYields: number;
    demand: number;
    supply: number;
  };
  timeline: {
    discovery: Date;
    peak: Date;
    maturity: Date;
  };
}

export class InvestmentRecommendationEngine {
  private static instance: InvestmentRecommendationEngine;
  private recommendationCache = new Map<string, { recommendation: InvestmentRecommendation; timestamp: number }>();
  private portfolioCache = new Map<string, { analysis: PortfolioAnalysis; timestamp: number }>();
  private opportunitiesCache = new Map<string, { opportunities: MarketOpportunity[]; timestamp: number }>();

  private constructor() {
    this.startCacheCleanup();
  }

  public static getInstance(): InvestmentRecommendationEngine {
    if (!InvestmentRecommendationEngine.instance) {
      InvestmentRecommendationEngine.instance = new InvestmentRecommendationEngine();
    }
    return InvestmentRecommendationEngine.instance;
  }

  // Generate investment recommendation for a property
  async generateRecommendation(
    propertyAnalytics: PropertyAnalyticsData,
    marketIntelligence: MarketIntelligenceData,
    userProfile?: {
      riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
      investmentHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
      portfolioSize: number;
      currentAllocations: Record<string, number>;
    },
    userId?: string
  ): Promise<InvestmentRecommendation> {
    const cacheKey = `recommendation_${propertyAnalytics.property.id}`;
    const cached = this.recommendationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hours cache
      return cached.recommendation;
    }

    try {
      const recommendation: InvestmentRecommendation = {
        id: crypto.randomUUID(),
        propertyId: propertyAnalytics.property.id,
        recommendation: this.calculateRecommendation(propertyAnalytics, marketIntelligence, userProfile),
        confidence: this.calculateConfidence(propertyAnalytics, marketIntelligence),
        score: this.calculateScore(propertyAnalytics, marketIntelligence),
        reasoning: this.generateReasoning(propertyAnalytics, marketIntelligence),
        financial: this.calculateFinancialMetrics(propertyAnalytics, marketIntelligence),
        market: this.analyzeMarketConditions(marketIntelligence),
        portfolio: this.analyzePortfolioFit(propertyAnalytics, userProfile),
        timeline: this.generateTimeline(propertyAnalytics, marketIntelligence),
        alternatives: this.generateAlternatives(propertyAnalytics, marketIntelligence),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      // Cache the recommendation
      this.recommendationCache.set(cacheKey, {
        recommendation,
        timestamp: Date.now()
      });

      // Log recommendation generation
      if (userId) {
        await auditLogger.logUserAction('investment_recommendation_generated', {
          propertyId: propertyAnalytics.property.id,
          recommendation: recommendation.recommendation,
          confidence: recommendation.confidence,
          score: recommendation.score
        }, userId);
      }

      return recommendation;
    } catch (error) {
      console.error('Error generating investment recommendation:', error);
      throw error;
    }
  }

  // Analyze portfolio performance and provide recommendations
  async analyzePortfolio(
    portfolioData: Array<{
      propertyId: string;
      propertyType: string;
      region: string;
      currentValue: number;
      purchasePrice: number;
      purchaseDate: Date;
      monthlyRent?: number;
      expenses?: number;
    }>,
    userId?: string
  ): Promise<PortfolioAnalysis> {
    const portfolioId = crypto.randomUUID();
    const cacheKey = `portfolio_${portfolioId}`;
    const cached = this.portfolioCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hours cache
      return cached.analysis;
    }

    try {
      const analysis: PortfolioAnalysis = {
        portfolioId,
        totalValue: portfolioData.reduce((sum, prop) => sum + prop.currentValue, 0),
        totalReturn: this.calculateTotalReturn(portfolioData),
        riskMetrics: this.calculateRiskMetrics(portfolioData),
        performance: this.calculatePerformanceMetrics(portfolioData),
        allocation: this.calculateAllocation(portfolioData),
        recommendations: this.generatePortfolioRecommendations(portfolioData),
        benchmarking: this.calculateBenchmarking(portfolioData)
      };

      // Cache the analysis
      this.portfolioCache.set(cacheKey, {
        analysis,
        timestamp: Date.now()
      });

      // Log portfolio analysis
      if (userId) {
        await auditLogger.logUserAction('portfolio_analysis_generated', {
          portfolioId,
          totalValue: analysis.totalValue,
          totalReturn: analysis.totalReturn,
          propertyCount: portfolioData.length
        }, userId);
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      throw error;
    }
  }

  // Identify market opportunities
  async identifyMarketOpportunities(
    regions: string[],
    investmentCriteria: {
      minYield: number;
      maxRisk: 'LOW' | 'MEDIUM' | 'HIGH';
      timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
      budget: number;
    },
    userId?: string
  ): Promise<MarketOpportunity[]> {
    const cacheKey = `opportunities_${regions.join('_')}_${JSON.stringify(investmentCriteria)}`;
    const cached = this.opportunitiesCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) { // 6 hours cache
      return cached.opportunities;
    }

    try {
      const opportunities: MarketOpportunity[] = [];

      for (const region of regions) {
        const regionOpportunities = await this.analyzeRegionOpportunities(region, investmentCriteria);
        opportunities.push(...regionOpportunities);
      }

      // Sort by opportunity score
      opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

      // Cache the opportunities
      this.opportunitiesCache.set(cacheKey, {
        opportunities,
        timestamp: Date.now()
      });

      // Log opportunity identification
      if (userId) {
        await auditLogger.logUserAction('market_opportunities_identified', {
          regions,
          opportunityCount: opportunities.length,
          criteria: investmentCriteria
        }, userId);
      }

      return opportunities;
    } catch (error) {
      console.error('Error identifying market opportunities:', error);
      throw error;
    }
  }

  // Private helper methods
  private calculateRecommendation(
    propertyAnalytics: PropertyAnalyticsData,
    marketIntelligence: MarketIntelligenceData,
    userProfile?: any
  ): 'BUY' | 'HOLD' | 'SELL' | 'AVOID' {
    const score = this.calculateScore(propertyAnalytics, marketIntelligence);
    const marketActivity = marketIntelligence.marketOverview.marketActivity;
    const priceMomentum = marketIntelligence.priceAnalysis.priceMomentum;

    // Adjust score based on user profile
    let adjustedScore = score;
    if (userProfile) {
      if (userProfile.riskTolerance === 'CONSERVATIVE' && propertyAnalytics.investment.riskScore > 60) {
        adjustedScore -= 20;
      } else if (userProfile.riskTolerance === 'AGGRESSIVE' && propertyAnalytics.investment.riskScore < 40) {
        adjustedScore += 10;
      }
    }

    if (adjustedScore >= 80 && marketActivity === 'hot' && priceMomentum === 'strong_up') {
      return 'BUY';
    } else if (adjustedScore >= 60 && (marketActivity === 'warm' || marketActivity === 'hot')) {
      return 'BUY';
    } else if (adjustedScore >= 40 && marketActivity === 'cool') {
      return 'HOLD';
    } else if (adjustedScore < 40 || marketActivity === 'cold') {
      return 'AVOID';
    } else {
      return 'HOLD';
    }
  }

  private calculateConfidence(
    propertyAnalytics: PropertyAnalyticsData,
    marketIntelligence: MarketIntelligenceData
  ): number {
    const dataQuality = this.assessDataQuality(propertyAnalytics, marketIntelligence);
    const marketStability = this.assessMarketStability(marketIntelligence);
    const propertyStability = this.assessPropertyStability(propertyAnalytics);

    return (dataQuality + marketStability + propertyStability) / 3;
  }

  private calculateScore(
    propertyAnalytics: PropertyAnalyticsData,
    marketIntelligence: MarketIntelligenceData
  ): number {
    const investmentScore = this.scoreInvestmentMetrics(propertyAnalytics.investment);
    const locationScore = this.scoreLocationMetrics(propertyAnalytics.location);
    const marketScore = this.scoreMarketConditions(marketIntelligence);
    const comparableScore = this.scoreComparables(propertyAnalytics.comparables);

    return (investmentScore * 0.4 + locationScore * 0.3 + marketScore * 0.2 + comparableScore * 0.1);
  }

  private generateReasoning(
    propertyAnalytics: PropertyAnalyticsData,
    marketIntelligence: MarketIntelligenceData
  ) {
    const primary = this.getPrimaryReason(propertyAnalytics, marketIntelligence);
    const secondary = this.getSecondaryReasons(propertyAnalytics, marketIntelligence);
    const risks = this.identifyRisks(propertyAnalytics, marketIntelligence);
    const opportunities = this.identifyOpportunities(propertyAnalytics, marketIntelligence);

    return {
      primary,
      secondary,
      risks,
      opportunities
    };
  }

  private calculateFinancialMetrics(
    propertyAnalytics: PropertyAnalyticsData,
    marketIntelligence: MarketIntelligenceData
  ) {
    const expectedReturn = propertyAnalytics.investment.totalReturn;
    const riskLevel = this.calculateRiskLevel(propertyAnalytics.investment.riskScore);
    const timeHorizon = this.calculateTimeHorizon(marketIntelligence);
    const investmentType = this.determineInvestmentType(propertyAnalytics);
    const targetYield = propertyAnalytics.investment.rentalYield;
    const breakEvenTime = this.calculateBreakEvenTime(propertyAnalytics);

    return {
      expectedReturn,
      riskLevel,
      timeHorizon,
      investmentType,
      targetYield,
      breakEvenTime
    };
  }

  private analyzeMarketConditions(marketIntelligence: MarketIntelligenceData) {
    const marketTiming = this.assessMarketTiming(marketIntelligence);
    const marketCycle = this.determineMarketCycle(marketIntelligence);
    const competitionLevel = this.assessCompetition(marketIntelligence);
    const demandForecast = this.forecastDemand(marketIntelligence);

    return {
      marketTiming,
      marketCycle,
      competitionLevel,
      demandForecast
    };
  }

  private analyzePortfolioFit(
    propertyAnalytics: PropertyAnalyticsData,
    userProfile?: any
  ) {
    const diversification = this.calculateDiversification(propertyAnalytics, userProfile);
    const correlation = this.calculateCorrelation(propertyAnalytics, userProfile);
    const portfolioFit = this.assessPortfolioFit(diversification, correlation);
    const recommendedAllocation = this.calculateRecommendedAllocation(propertyAnalytics, userProfile);

    return {
      diversification,
      correlation,
      portfolioFit,
      recommendedAllocation
    };
  }

  private generateTimeline(
    propertyAnalytics: PropertyAnalyticsData,
    marketIntelligence: MarketIntelligenceData
  ) {
    return {
      shortTerm: {
        months: 12,
        expectedReturn: propertyAnalytics.predictions.oneYearForecast.price - propertyAnalytics.property.price,
        keyEvents: ['Market assessment', 'Property inspection', 'Due diligence']
      },
      mediumTerm: {
        months: 36,
        expectedReturn: propertyAnalytics.predictions.fiveYearForecast.price * 0.6 - propertyAnalytics.property.price,
        keyEvents: ['Rental optimization', 'Market positioning', 'Value enhancement']
      },
      longTerm: {
        months: 60,
        expectedReturn: propertyAnalytics.predictions.fiveYearForecast.price - propertyAnalytics.property.price,
        keyEvents: ['Portfolio rebalancing', 'Exit strategy', 'Tax optimization']
      }
    };
  }

  private generateAlternatives(
    propertyAnalytics: PropertyAnalyticsData,
    marketIntelligence: MarketIntelligenceData
  ) {
    return [
      {
        type: 'REIT Investment',
        description: 'Real Estate Investment Trust in similar market',
        expectedReturn: propertyAnalytics.investment.totalReturn * 0.8,
        riskLevel: 'MEDIUM'
      },
      {
        type: 'Property Development',
        description: 'Development opportunity in same area',
        expectedReturn: propertyAnalytics.investment.totalReturn * 1.5,
        riskLevel: 'HIGH'
      },
      {
        type: 'Rental Portfolio',
        description: 'Multiple smaller properties for diversification',
        expectedReturn: propertyAnalytics.investment.totalReturn * 0.9,
        riskLevel: 'MEDIUM'
      }
    ];
  }

  // Additional helper methods for calculations
  private assessDataQuality(propertyAnalytics: PropertyAnalyticsData, marketIntelligence: MarketIntelligenceData): number {
    // Mock data quality assessment
    return 75 + Math.random() * 20;
  }

  private assessMarketStability(marketIntelligence: MarketIntelligenceData): number {
    const volatility = marketIntelligence.priceAnalysis.priceVolatility;
    return Math.max(0, 100 - volatility);
  }

  private assessPropertyStability(propertyAnalytics: PropertyAnalyticsData): number {
    return propertyAnalytics.location.overallLocationScore;
  }

  private scoreInvestmentMetrics(investment: any): number {
    return (investment.rentalYield * 10) + (investment.capitalGrowth * 10) - (investment.riskScore * 0.5);
  }

  private scoreLocationMetrics(location: any): number {
    return location.overallLocationScore;
  }

  private scoreMarketConditions(marketIntelligence: MarketIntelligenceData): number {
    const activityScore = marketIntelligence.marketOverview.marketActivity === 'hot' ? 100 :
                         marketIntelligence.marketOverview.marketActivity === 'warm' ? 75 :
                         marketIntelligence.marketOverview.marketActivity === 'cool' ? 50 : 25;
    
    const momentumScore = marketIntelligence.priceAnalysis.priceMomentum === 'strong_up' ? 100 :
                         marketIntelligence.priceAnalysis.priceMomentum === 'up' ? 75 :
                         marketIntelligence.priceAnalysis.priceMomentum === 'neutral' ? 50 :
                         marketIntelligence.priceAnalysis.priceMomentum === 'down' ? 25 : 0;

    return (activityScore + momentumScore) / 2;
  }

  private scoreComparables(comparables: any): number {
    const variance = Math.abs(comparables.priceVariance);
    return Math.max(0, 100 - variance);
  }

  private getPrimaryReason(propertyAnalytics: PropertyAnalyticsData, marketIntelligence: MarketIntelligenceData): string {
    if (propertyAnalytics.investment.investmentGrade.startsWith('A')) {
      return 'Excellent investment fundamentals with strong returns and low risk';
    } else if (propertyAnalytics.investment.investmentGrade.startsWith('B')) {
      return 'Good investment opportunity with solid fundamentals';
    } else if (propertyAnalytics.investment.investmentGrade.startsWith('C')) {
      return 'Moderate investment with some concerns';
    } else {
      return 'High-risk investment with significant concerns';
    }
  }

  private getSecondaryReasons(propertyAnalytics: PropertyAnalyticsData, marketIntelligence: MarketIntelligenceData): string[] {
    const reasons = [];
    
    if (propertyAnalytics.investment.rentalYield > 5) {
      reasons.push('Strong rental yield potential');
    }
    
    if (propertyAnalytics.location.overallLocationScore > 80) {
      reasons.push('Excellent location with high amenity scores');
    }
    
    if (marketIntelligence.marketOverview.marketActivity === 'hot') {
      reasons.push('Active market with high demand');
    }
    
    if (propertyAnalytics.comparables.priceVariance < -10) {
      reasons.push('Property appears undervalued compared to comparables');
    }

    return reasons;
  }

  private identifyRisks(propertyAnalytics: PropertyAnalyticsData, marketIntelligence: MarketIntelligenceData): string[] {
    const risks = [];
    
    if (propertyAnalytics.investment.riskScore > 70) {
      risks.push('High risk investment');
    }
    
    if (marketIntelligence.priceAnalysis.priceVolatility > 20) {
      risks.push('High market volatility');
    }
    
    if (propertyAnalytics.location.crimeScore > 70) {
      risks.push('High crime area');
    }
    
    if (marketIntelligence.marketOverview.supplyDemandRatio > 1.5) {
      risks.push('Oversupplied market');
    }

    return risks;
  }

  private identifyOpportunities(propertyAnalytics: PropertyAnalyticsData, marketIntelligence: MarketIntelligenceData): string[] {
    const opportunities = [];
    
    if (propertyAnalytics.predictions.oneYearForecast.confidence > 80) {
      opportunities.push('Strong price growth forecast');
    }
    
    if (propertyAnalytics.investment.rentalYield > 6) {
      opportunities.push('High rental yield potential');
    }
    
    if (marketIntelligence.trends.opportunities.length > 0) {
      opportunities.push(...marketIntelligence.trends.opportunities);
    }

    return opportunities;
  }

  private calculateRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (riskScore < 40) return 'LOW';
    if (riskScore < 70) return 'MEDIUM';
    return 'HIGH';
  }

  private calculateTimeHorizon(marketIntelligence: MarketIntelligenceData): 'SHORT' | 'MEDIUM' | 'LONG' {
    const marketCycle = marketIntelligence.priceAnalysis.priceMomentum;
    if (marketCycle === 'strong_up' || marketCycle === 'up') return 'SHORT';
    if (marketCycle === 'neutral') return 'MEDIUM';
    return 'LONG';
  }

  private determineInvestmentType(propertyAnalytics: PropertyAnalyticsData): 'CAPITAL_GROWTH' | 'RENTAL_INCOME' | 'BALANCED' {
    const rentalYield = propertyAnalytics.investment.rentalYield;
    const capitalGrowth = propertyAnalytics.investment.capitalGrowth;
    
    if (rentalYield > capitalGrowth * 1.5) return 'RENTAL_INCOME';
    if (capitalGrowth > rentalYield * 1.5) return 'CAPITAL_GROWTH';
    return 'BALANCED';
  }

  private calculateBreakEvenTime(propertyAnalytics: PropertyAnalyticsData): number {
    const monthlyRent = propertyAnalytics.predictions.rentalForecast.monthlyRent;
    const annualExpenses = propertyAnalytics.property.price * 0.02; // 2% annual expenses
    const netAnnualIncome = (monthlyRent * 12) - annualExpenses;
    
    if (netAnnualIncome <= 0) return -1; // Never breaks even
    
    return propertyAnalytics.property.price / netAnnualIncome;
  }

  private assessMarketTiming(marketIntelligence: MarketIntelligenceData): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
    const activity = marketIntelligence.marketOverview.marketActivity;
    const momentum = marketIntelligence.priceAnalysis.priceMomentum;
    
    if (activity === 'hot' && momentum === 'strong_up') return 'EXCELLENT';
    if (activity === 'warm' && (momentum === 'up' || momentum === 'strong_up')) return 'GOOD';
    if (activity === 'cool' && momentum === 'neutral') return 'FAIR';
    return 'POOR';
  }

  private determineMarketCycle(marketIntelligence: MarketIntelligenceData): 'EARLY' | 'GROWTH' | 'PEAK' | 'DECLINE' {
    const momentum = marketIntelligence.priceAnalysis.priceMomentum;
    const activity = marketIntelligence.marketOverview.marketActivity;
    
    if (momentum === 'strong_up' && activity === 'hot') return 'PEAK';
    if (momentum === 'up' && activity === 'warm') return 'GROWTH';
    if (momentum === 'down' || momentum === 'strong_down') return 'DECLINE';
    return 'EARLY';
  }

  private assessCompetition(marketIntelligence: MarketIntelligenceData): 'LOW' | 'MEDIUM' | 'HIGH' {
    const supplyDemandRatio = marketIntelligence.marketOverview.supplyDemandRatio;
    
    if (supplyDemandRatio < 0.8) return 'HIGH';
    if (supplyDemandRatio < 1.2) return 'MEDIUM';
    return 'LOW';
  }

  private forecastDemand(marketIntelligence: MarketIntelligenceData): 'STRONG' | 'MODERATE' | 'WEAK' {
    const activity = marketIntelligence.marketOverview.marketActivity;
    const momentum = marketIntelligence.priceAnalysis.priceMomentum;
    
    if (activity === 'hot' && momentum === 'up') return 'STRONG';
    if (activity === 'warm' || momentum === 'neutral') return 'MODERATE';
    return 'WEAK';
  }

  private calculateDiversification(propertyAnalytics: PropertyAnalyticsData, userProfile?: any): number {
    // Mock diversification calculation
    return 60 + Math.random() * 30;
  }

  private calculateCorrelation(propertyAnalytics: PropertyAnalyticsData, userProfile?: any): number {
    // Mock correlation calculation
    return Math.random() * 0.8;
  }

  private assessPortfolioFit(diversification: number, correlation: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
    const score = (diversification / 100) * (1 - correlation);
    
    if (score > 0.7) return 'EXCELLENT';
    if (score > 0.5) return 'GOOD';
    if (score > 0.3) return 'FAIR';
    return 'POOR';
  }

  private calculateRecommendedAllocation(propertyAnalytics: PropertyAnalyticsData, userProfile?: any): number {
    // Mock allocation calculation
    return 5 + Math.random() * 15; // 5-20% allocation
  }

  // Portfolio analysis methods
  private calculateTotalReturn(portfolioData: any[]): number {
    return portfolioData.reduce((total, prop) => {
      const returnRate = (prop.currentValue - prop.purchasePrice) / prop.purchasePrice;
      return total + returnRate;
    }, 0) / portfolioData.length * 100;
  }

  private calculateRiskMetrics(portfolioData: any[]): any {
    // Mock risk metrics calculation
    return {
      volatility: 15 + Math.random() * 10,
      sharpeRatio: 0.5 + Math.random() * 1.5,
      maxDrawdown: 5 + Math.random() * 15,
      beta: 0.8 + Math.random() * 0.4,
      valueAtRisk: 2 + Math.random() * 8
    };
  }

  private calculatePerformanceMetrics(portfolioData: any[]): any {
    // Mock performance metrics
    return {
      oneMonth: (Math.random() - 0.5) * 10,
      threeMonths: (Math.random() - 0.5) * 20,
      sixMonths: (Math.random() - 0.5) * 30,
      oneYear: (Math.random() - 0.5) * 40,
      threeYears: (Math.random() - 0.5) * 60,
      fiveYears: (Math.random() - 0.5) * 80
    };
  }

  private calculateAllocation(portfolioData: any[]): any {
    const byPropertyType: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    const byInvestmentType: Record<string, number> = {};

    portfolioData.forEach(prop => {
      byPropertyType[prop.propertyType] = (byPropertyType[prop.propertyType] || 0) + prop.currentValue;
      byRegion[prop.region] = (byRegion[prop.region] || 0) + prop.currentValue;
      byInvestmentType['RESIDENTIAL'] = (byInvestmentType['RESIDENTIAL'] || 0) + prop.currentValue;
    });

    const totalValue = portfolioData.reduce((sum, prop) => sum + prop.currentValue, 0);

    Object.keys(byPropertyType).forEach(key => {
      byPropertyType[key] = (byPropertyType[key] / totalValue) * 100;
    });

    Object.keys(byRegion).forEach(key => {
      byRegion[key] = (byRegion[key] / totalValue) * 100;
    });

    Object.keys(byInvestmentType).forEach(key => {
      byInvestmentType[key] = (byInvestmentType[key] / totalValue) * 100;
    });

    return {
      byPropertyType,
      byRegion,
      byInvestmentType
    };
  }

  private generatePortfolioRecommendations(portfolioData: any[]): any {
    // Mock portfolio recommendations
    return {
      rebalancing: [
        {
          action: 'SELL' as const,
          propertyId: 'prop1',
          amount: 100000,
          reason: 'Overweight in high-risk area'
        }
      ],
      newInvestments: [
        {
          propertyType: 'Commercial',
          region: 'London',
          targetAllocation: 20,
          reason: 'Diversification opportunity'
        }
      ],
      riskManagement: [
        {
          action: 'Hedge against interest rate risk',
          priority: 'HIGH' as const,
          description: 'Consider fixed-rate financing'
        }
      ]
    };
  }

  private calculateBenchmarking(portfolioData: any[]): any {
    // Mock benchmarking
    return {
      marketIndex: 8.5,
      peerGroup: 7.2,
      riskAdjustedReturn: 6.8,
      alpha: 1.3,
      informationRatio: 0.8
    };
  }

  private async analyzeRegionOpportunities(region: string, criteria: any): Promise<MarketOpportunity[]> {
    // Mock region opportunity analysis
    const opportunities: MarketOpportunity[] = [];

    if (Math.random() > 0.5) {
      opportunities.push({
        id: crypto.randomUUID(),
        type: 'EMERGING_MARKET',
        region,
        postcode: `${region.substring(0, 2)}1 1AA`,
        description: `Emerging market opportunity in ${region}`,
        opportunityScore: 70 + Math.random() * 25,
        riskLevel: 'MEDIUM',
        timeHorizon: 'MEDIUM',
        expectedReturn: 8 + Math.random() * 7,
        keyDrivers: ['Population growth', 'Infrastructure development'],
        risks: ['Market volatility', 'Regulatory changes'],
        recommendedAction: 'Consider phased investment approach',
        marketData: {
          currentPrices: 200000 + Math.random() * 300000,
          priceGrowth: 2 + Math.random() * 8,
          rentalYields: 4 + Math.random() * 4,
          demand: 60 + Math.random() * 30,
          supply: 40 + Math.random() * 30
        },
        timeline: {
          discovery: new Date(),
          peak: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          maturity: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000)
        }
      });
    }

    return opportunities;
  }

  private startCacheCleanup(): void {
    // Clean up cache every 6 hours
    setInterval(() => {
      const now = Date.now();
      
      // Clean recommendation cache (24 hours TTL)
      for (const [key, cached] of this.recommendationCache) {
        if (now - cached.timestamp > 24 * 60 * 60 * 1000) {
          this.recommendationCache.delete(key);
        }
      }
      
      // Clean portfolio cache (24 hours TTL)
      for (const [key, cached] of this.portfolioCache) {
        if (now - cached.timestamp > 24 * 60 * 60 * 1000) {
          this.portfolioCache.delete(key);
        }
      }
      
      // Clean opportunities cache (6 hours TTL)
      for (const [key, cached] of this.opportunitiesCache) {
        if (now - cached.timestamp > 6 * 60 * 60 * 1000) {
          this.opportunitiesCache.delete(key);
        }
      }
    }, 6 * 60 * 60 * 1000);
  }
}

// Export singleton instance
export const investmentRecommendationEngine = InvestmentRecommendationEngine.getInstance();
