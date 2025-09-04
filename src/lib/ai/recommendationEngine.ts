import { auditLogger } from '../audit/auditLogger';

export interface PropertyRecommendation {
  id: string;
  propertyId: string;
  userId: string;
  type: 'INVESTMENT' | 'RENTAL' | 'FLIP' | 'HOLD' | 'SELL' | 'AVOID';
  score: number; // 0-100
  confidence: number; // 0-100
  reasoning: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  expectedReturn: {
    percentage: number;
    amount: number;
    timeframe: string;
  };
  keyFactors: {
    bmvScore: number;
    marketTrend: number;
    locationScore: number;
    rentalYield: number;
    growthPotential: number;
  };
  alternatives: string[];
  createdAt: string;
  expiresAt: string;
}

export interface UserProfile {
  id: string;
  investmentGoals: string[];
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  budget: {
    min: number;
    max: number;
  };
  preferredLocations: string[];
  propertyTypes: string[];
  investmentStrategy: 'BUY_AND_HOLD' | 'FLIP' | 'RENTAL' | 'MIXED';
  experience: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  portfolio: {
    totalValue: number;
    properties: number;
    diversification: number;
  };
}

export interface MarketContext {
  region: string;
  marketTrend: 'BULL' | 'BEAR' | 'STABLE';
  interestRates: number;
  inflation: number;
  unemployment: number;
  gdpGrowth: number;
  propertySupply: number;
  propertyDemand: number;
  averageDaysOnMarket: number;
  priceGrowth: number;
}

export interface RecommendationRequest {
  userId: string;
  userProfile: UserProfile;
  marketContext: MarketContext;
  propertyFilters?: {
    postcodes?: string[];
    propertyTypes?: string[];
    priceRange?: { min: number; max: number };
    bedrooms?: { min: number; max: number };
  };
  limit?: number;
}

export class AIRecommendationEngine {
  private static instance: AIRecommendationEngine;
  private recommendations: Map<string, PropertyRecommendation[]> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private marketContexts: Map<string, MarketContext> = new Map();

  // AI Model weights and thresholds
  private readonly MODEL_WEIGHTS = {
    bmvScore: 0.25,
    marketTrend: 0.20,
    locationScore: 0.20,
    rentalYield: 0.15,
    growthPotential: 0.10,
    riskFactors: 0.10,
  };

  private readonly CONFIDENCE_THRESHOLDS = {
    HIGH: 80,
    MEDIUM: 60,
    LOW: 40,
  };

  private readonly RISK_FACTORS = {
    marketVolatility: 0.3,
    locationRisk: 0.25,
    propertyCondition: 0.20,
    financingRisk: 0.15,
    regulatoryRisk: 0.10,
  };

  public static getInstance(): AIRecommendationEngine {
    if (!AIRecommendationEngine.instance) {
      AIRecommendationEngine.instance = new AIRecommendationEngine();
    }
    return AIRecommendationEngine.instance;
  }

  // Generate property recommendations
  public async generateRecommendations(request: RecommendationRequest): Promise<PropertyRecommendation[]> {
    try {
      const { userId, userProfile, marketContext, propertyFilters, limit = 10 } = request;

      // Store user profile and market context
      this.userProfiles.set(userId, userProfile);
      this.marketContexts.set(userId, marketContext);

      // Get candidate properties (in a real implementation, this would query the database)
      const candidateProperties = await this.getCandidateProperties(propertyFilters);

      // Generate recommendations for each property
      const recommendations: PropertyRecommendation[] = [];
      
      for (const property of candidateProperties) {
        const recommendation = await this.analyzeProperty(property, userProfile, marketContext);
        if (recommendation && recommendation.confidence >= this.CONFIDENCE_THRESHOLDS.LOW) {
          recommendations.push(recommendation);
        }
      }

      // Sort by score and confidence
      recommendations.sort((a, b) => {
        const scoreA = (a.score * 0.7) + (a.confidence * 0.3);
        const scoreB = (b.score * 0.7) + (b.confidence * 0.3);
        return scoreB - scoreA;
      });

      // Limit results
      const finalRecommendations = recommendations.slice(0, limit);

      // Store recommendations
      this.recommendations.set(userId, finalRecommendations);

      // Log recommendation generation
      await auditLogger.logSystemEvent('ai_recommendations_generated', {
        userId,
        count: finalRecommendations.length,
        averageScore: finalRecommendations.reduce((sum, r) => sum + r.score, 0) / finalRecommendations.length,
        averageConfidence: finalRecommendations.reduce((sum, r) => sum + r.confidence, 0) / finalRecommendations.length,
      });

      return finalRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  // Analyze individual property
  private async analyzeProperty(
    property: any,
    userProfile: UserProfile,
    marketContext: MarketContext
  ): Promise<PropertyRecommendation | null> {
    try {
      // Calculate key factors
      const keyFactors = await this.calculateKeyFactors(property, marketContext);
      
      // Determine recommendation type
      const recommendationType = this.determineRecommendationType(property, userProfile, keyFactors);
      
      // Calculate overall score
      const score = this.calculateOverallScore(keyFactors, userProfile);
      
      // Calculate confidence
      const confidence = this.calculateConfidence(property, keyFactors, marketContext);
      
      // Generate reasoning
      const reasoning = this.generateReasoning(property, keyFactors, userProfile, marketContext);
      
      // Assess risk level
      const riskLevel = this.assessRiskLevel(property, keyFactors, marketContext);
      
      // Determine time horizon
      const timeHorizon = this.determineTimeHorizon(recommendationType, userProfile);
      
      // Calculate expected return
      const expectedReturn = this.calculateExpectedReturn(property, keyFactors, timeHorizon);
      
      // Find alternatives
      const alternatives = await this.findAlternatives(property, userProfile);

      const recommendation: PropertyRecommendation = {
        id: this.generateId(),
        propertyId: property.id,
        userId: userProfile.id,
        type: recommendationType,
        score,
        confidence,
        reasoning,
        riskLevel,
        timeHorizon,
        expectedReturn,
        keyFactors,
        alternatives,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      return recommendation;
    } catch (error) {
      console.error('Error analyzing property:', error);
      return null;
    }
  }

  // Calculate key factors for property analysis
  private async calculateKeyFactors(property: any, marketContext: MarketContext): Promise<PropertyRecommendation['keyFactors']> {
    // BMV Score (0-100)
    const bmvScore = this.calculateBMVScore(property);
    
    // Market Trend Score (0-100)
    const marketTrend = this.calculateMarketTrendScore(marketContext);
    
    // Location Score (0-100)
    const locationScore = this.calculateLocationScore(property);
    
    // Rental Yield (0-100)
    const rentalYield = this.calculateRentalYieldScore(property);
    
    // Growth Potential (0-100)
    const growthPotential = this.calculateGrowthPotential(property, marketContext);

    return {
      bmvScore,
      marketTrend,
      locationScore,
      rentalYield,
      growthPotential,
    };
  }

  // Calculate BMV Score
  private calculateBMVScore(property: any): number {
    // In a real implementation, this would use the existing BMV scoring logic
    const baseScore = property.bmvScore || 50;
    const priceVsMarket = property.priceVsMarket || 1.0;
    const conditionScore = property.conditionScore || 50;
    
    return Math.min(100, Math.max(0, (baseScore * 0.5) + ((1 - priceVsMarket) * 30) + (conditionScore * 0.2)));
  }

  // Calculate Market Trend Score
  private calculateMarketTrendScore(marketContext: MarketContext): number {
    const trendScore = marketContext.marketTrend === 'BULL' ? 80 : 
                      marketContext.marketTrend === 'STABLE' ? 60 : 40;
    
    const growthBonus = Math.min(20, marketContext.priceGrowth * 2);
    const demandBonus = Math.min(10, (marketContext.propertyDemand / marketContext.propertySupply) * 10);
    
    return Math.min(100, trendScore + growthBonus + demandBonus);
  }

  // Calculate Location Score
  private calculateLocationScore(property: any): number {
    const transportScore = property.transportScore || 50;
    const schoolScore = property.schoolScore || 50;
    const amenityScore = property.amenityScore || 50;
    const crimeScore = property.crimeScore || 50;
    
    return (transportScore * 0.3) + (schoolScore * 0.25) + (amenityScore * 0.25) + (crimeScore * 0.2);
  }

  // Calculate Rental Yield Score
  private calculateRentalYieldScore(property: any): number {
    const rentalYield = property.rentalYield || 4.5;
    const targetYield = 6.0; // Target yield for good investment
    
    if (rentalYield >= targetYield) return 100;
    if (rentalYield >= targetYield * 0.8) return 80;
    if (rentalYield >= targetYield * 0.6) return 60;
    return 40;
  }

  // Calculate Growth Potential
  private calculateGrowthPotential(property: any, marketContext: MarketContext): number {
    const historicalGrowth = property.historicalGrowth || 2.5;
    const marketGrowth = marketContext.priceGrowth;
    const developmentPotential = property.developmentPotential || 0;
    
    const baseScore = Math.min(100, (historicalGrowth + marketGrowth) * 10);
    const developmentBonus = Math.min(20, developmentPotential * 20);
    
    return Math.min(100, baseScore + developmentBonus);
  }

  // Determine recommendation type
  private determineRecommendationType(
    property: any,
    userProfile: UserProfile,
    keyFactors: PropertyRecommendation['keyFactors']
  ): PropertyRecommendation['type'] {
    const { bmvScore, rentalYield, growthPotential } = keyFactors;
    const { investmentStrategy, riskTolerance } = userProfile;

    // High BMV score suggests investment opportunity
    if (bmvScore >= 80) {
      if (rentalYield >= 70 && investmentStrategy === 'RENTAL') return 'RENTAL';
      if (growthPotential >= 70 && investmentStrategy === 'BUY_AND_HOLD') return 'HOLD';
      return 'INVESTMENT';
    }

    // Medium scores with specific strategies
    if (bmvScore >= 60) {
      if (investmentStrategy === 'FLIP' && growthPotential >= 60) return 'FLIP';
      if (rentalYield >= 60) return 'RENTAL';
      return 'HOLD';
    }

    // Low scores
    if (bmvScore < 40) return 'AVOID';
    
    return 'HOLD';
  }

  // Calculate overall score
  private calculateOverallScore(
    keyFactors: PropertyRecommendation['keyFactors'],
    userProfile: UserProfile
  ): number {
    const { bmvScore, marketTrend, locationScore, rentalYield, growthPotential } = keyFactors;
    
    // Adjust weights based on user profile
    let weights = { ...this.MODEL_WEIGHTS };
    
    if (userProfile.investmentStrategy === 'RENTAL') {
      weights.rentalYield = 0.30;
      weights.bmvScore = 0.20;
    } else if (userProfile.investmentStrategy === 'FLIP') {
      weights.growthPotential = 0.25;
      weights.bmvScore = 0.30;
    }

    const score = 
      (bmvScore * weights.bmvScore) +
      (marketTrend * weights.marketTrend) +
      (locationScore * weights.locationScore) +
      (rentalYield * weights.rentalYield) +
      (growthPotential * weights.growthPotential);

    return Math.round(score);
  }

  // Calculate confidence level
  private calculateConfidence(
    property: any,
    keyFactors: PropertyRecommendation['keyFactors'],
    marketContext: MarketContext
  ): number {
    let confidence = 50; // Base confidence

    // Data quality factors
    if (property.dataCompleteness >= 0.8) confidence += 20;
    if (property.recentSales >= 5) confidence += 15;
    if (property.marketDataAge < 30) confidence += 10;

    // Market stability
    if (marketContext.marketTrend === 'STABLE') confidence += 10;
    if (marketContext.priceGrowth > 0 && marketContext.priceGrowth < 10) confidence += 5;

    // Factor consistency
    const factorVariance = this.calculateFactorVariance(keyFactors);
    if (factorVariance < 20) confidence += 10;

    return Math.min(100, Math.max(0, confidence));
  }

  // Calculate factor variance
  private calculateFactorVariance(keyFactors: PropertyRecommendation['keyFactors']): number {
    const factors = Object.values(keyFactors);
    const mean = factors.reduce((sum, val) => sum + val, 0) / factors.length;
    const variance = factors.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / factors.length;
    return Math.sqrt(variance);
  }

  // Generate reasoning
  private generateReasoning(
    property: any,
    keyFactors: PropertyRecommendation['keyFactors'],
    userProfile: UserProfile,
    marketContext: MarketContext
  ): string[] {
    const reasoning: string[] = [];

    // BMV reasoning
    if (keyFactors.bmvScore >= 80) {
      reasoning.push('Excellent below-market-value opportunity with significant potential savings');
    } else if (keyFactors.bmvScore >= 60) {
      reasoning.push('Good value proposition with reasonable below-market pricing');
    } else if (keyFactors.bmvScore < 40) {
      reasoning.push('Property appears overpriced relative to market value');
    }

    // Market trend reasoning
    if (keyFactors.marketTrend >= 80) {
      reasoning.push('Strong market conditions favor property investment');
    } else if (keyFactors.marketTrend < 40) {
      reasoning.push('Market conditions are challenging, consider timing carefully');
    }

    // Location reasoning
    if (keyFactors.locationScore >= 80) {
      reasoning.push('Prime location with excellent amenities and transport links');
    } else if (keyFactors.locationScore < 40) {
      reasoning.push('Location may have limitations affecting long-term value');
    }

    // Rental yield reasoning
    if (keyFactors.rentalYield >= 80) {
      reasoning.push('Strong rental yield potential for income generation');
    } else if (keyFactors.rentalYield < 40) {
      reasoning.push('Rental yield may be below optimal for income-focused strategy');
    }

    // Growth potential reasoning
    if (keyFactors.growthPotential >= 80) {
      reasoning.push('High growth potential based on historical trends and market conditions');
    }

    // User profile alignment
    if (userProfile.investmentStrategy === 'RENTAL' && keyFactors.rentalYield >= 70) {
      reasoning.push('Aligns well with your rental investment strategy');
    }

    if (userProfile.riskTolerance === 'CONSERVATIVE' && keyFactors.bmvScore >= 70) {
      reasoning.push('Conservative investment with good downside protection');
    }

    return reasoning;
  }

  // Assess risk level
  private assessRiskLevel(
    property: any,
    keyFactors: PropertyRecommendation['keyFactors'],
    marketContext: MarketContext
  ): PropertyRecommendation['riskLevel'] {
    let riskScore = 50; // Base risk

    // Market risk
    if (marketContext.marketTrend === 'BEAR') riskScore += 30;
    if (marketContext.priceGrowth < 0) riskScore += 20;

    // Property risk
    if (keyFactors.locationScore < 40) riskScore += 20;
    if (property.conditionScore < 40) riskScore += 15;

    // Data risk
    if (property.dataCompleteness < 0.6) riskScore += 15;

    if (riskScore >= 70) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    return 'LOW';
  }

  // Determine time horizon
  private determineTimeHorizon(
    type: PropertyRecommendation['type'],
    userProfile: UserProfile
  ): PropertyRecommendation['timeHorizon'] {
    if (type === 'FLIP') return 'SHORT';
    if (type === 'RENTAL' || type === 'HOLD') return 'LONG';
    if (userProfile.experience === 'BEGINNER') return 'LONG';
    return 'MEDIUM';
  }

  // Calculate expected return
  private calculateExpectedReturn(
    property: any,
    keyFactors: PropertyRecommendation['keyFactors'],
    timeHorizon: PropertyRecommendation['timeHorizon']
  ): PropertyRecommendation['expectedReturn'] {
    const basePrice = property.price || 250000;
    const annualGrowth = (keyFactors.growthPotential / 100) * 0.05; // 5% base growth
    const rentalYield = (keyFactors.rentalYield / 100) * 0.06; // 6% base yield

    let years = 1;
    if (timeHorizon === 'MEDIUM') years = 3;
    if (timeHorizon === 'LONG') years = 5;

    const capitalGrowth = basePrice * Math.pow(1 + annualGrowth, years) - basePrice;
    const rentalIncome = basePrice * rentalYield * years;
    const totalReturn = capitalGrowth + rentalIncome;
    const percentage = (totalReturn / basePrice) * 100;

    return {
      percentage: Math.round(percentage),
      amount: Math.round(totalReturn),
      timeframe: `${years} year${years > 1 ? 's' : ''}`,
    };
  }

  // Find alternative properties
  private async findAlternatives(property: any, userProfile: UserProfile): Promise<string[]> {
    // In a real implementation, this would find similar properties
    return [
      `Similar ${property.propertyType} in ${property.postcode}`,
      `Alternative investment in nearby area`,
      `Higher yield option in same location`,
    ];
  }

  // Get candidate properties
  private async getCandidateProperties(filters?: any): Promise<any[]> {
    // In a real implementation, this would query the database
    // For now, return mock data
    return [
      {
        id: 'prop-1',
        price: 250000,
        postcode: 'SW1A 1AA',
        propertyType: 'Flat',
        bedrooms: 2,
        bmvScore: 85,
        priceVsMarket: 0.85,
        conditionScore: 75,
        transportScore: 90,
        schoolScore: 80,
        amenityScore: 85,
        crimeScore: 70,
        rentalYield: 5.5,
        historicalGrowth: 3.2,
        developmentPotential: 0.3,
        dataCompleteness: 0.9,
        recentSales: 8,
        marketDataAge: 15,
      },
      // Add more mock properties...
    ];
  }

  // Get user recommendations
  public async getUserRecommendations(userId: string): Promise<PropertyRecommendation[]> {
    return this.recommendations.get(userId) || [];
  }

  // Update recommendation feedback
  public async updateRecommendationFeedback(
    recommendationId: string,
    userId: string,
    feedback: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  ): Promise<boolean> {
    try {
      const recommendations = this.recommendations.get(userId);
      if (!recommendations) return false;

      const recommendation = recommendations.find(r => r.id === recommendationId);
      if (!recommendation) return false;

      // Log feedback
      await auditLogger.logSystemEvent('recommendation_feedback', {
        recommendationId,
        userId,
        feedback,
        recommendationType: recommendation.type,
        score: recommendation.score,
        confidence: recommendation.confidence,
      });

      return true;
    } catch (error) {
      console.error('Error updating recommendation feedback:', error);
      return false;
    }
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const aiRecommendationEngine = AIRecommendationEngine.getInstance();