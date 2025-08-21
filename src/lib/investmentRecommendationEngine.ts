export interface InvestmentRecommendation {
  action: 'BUY' | 'HOLD' | 'SELL' | 'WAIT';
  confidence: number;
  reasoning: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  expectedReturn: number;
  riskFactors: RiskFactor[];
  portfolioImpact: PortfolioImpact;
}

export interface RiskFactor {
  category: string;
  score: number;
  description: string;
  mitigation: string;
}

export interface PortfolioImpact {
  diversification: number;
  riskAdjustment: number;
  correlation: number;
  rebalancing: boolean;
}

export interface InvestmentStrategy {
  name: string;
  description: string;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  timeHorizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  targetReturn: number;
  maxRisk: number;
  recommendations: string[];
}

export class InvestmentRecommendationEngine {
  private marketTrends: any;
  private propertyData: any;
  private marketData: any;

  constructor(marketTrends: any, propertyData: any, marketData: any) {
    this.marketTrends = marketTrends;
    this.propertyData = propertyData;
    this.marketData = marketData;
  }

  generateRecommendation(): InvestmentRecommendation {
    // Analyze market conditions
    const marketPhase = this.analyzeMarketPhase();
    const riskAssessment = this.assessRisk();
    const portfolioImpact = this.analyzePortfolioImpact();
    
    // Generate recommendation based on analysis
    const recommendation = this.calculateRecommendation(marketPhase, riskAssessment);
    
    return {
      action: recommendation.action,
      confidence: recommendation.confidence,
      reasoning: recommendation.reasoning,
      riskLevel: riskAssessment.overallRisk,
      timeHorizon: recommendation.timeHorizon,
      expectedReturn: recommendation.expectedReturn,
      riskFactors: riskAssessment.factors,
      portfolioImpact
    };
  }

  private analyzeMarketPhase(): any {
    if (!this.marketTrends?.cycles) {
      return { phase: 'UNKNOWN', confidence: 0, momentum: 0 };
    }

    const currentCycle = this.marketTrends.cycles[this.marketTrends.cycles.length - 1];
    const momentum = this.marketTrends.trends?.momentum || 0;
    
    return {
      phase: currentCycle?.phase || 'UNKNOWN',
      confidence: currentCycle?.confidence || 0,
      momentum: momentum
    };
  }

  private assessRisk(): { overallRisk: 'LOW' | 'MEDIUM' | 'HIGH'; factors: RiskFactor[] } {
    const factors: RiskFactor[] = [];
    let totalRiskScore = 0;
    let maxRiskScore = 0;

    // Market Risk (0-25 points)
    const marketRisk = this.calculateMarketRisk();
    factors.push(marketRisk);
    totalRiskScore += marketRisk.score;
    maxRiskScore += 25;

    // Property Risk (0-25 points)
    const propertyRisk = this.calculatePropertyRisk();
    factors.push(propertyRisk);
    totalRiskScore += propertyRisk.score;
    maxRiskScore += 25;

    // Liquidity Risk (0-25 points)
    const liquidityRisk = this.calculateLiquidityRisk();
    factors.push(liquidityRisk);
    totalRiskScore += liquidityRisk.score;
    maxRiskScore += 25;

    // Regulatory Risk (0-25 points)
    const regulatoryRisk = this.calculateRegulatoryRisk();
    factors.push(regulatoryRisk);
    totalRiskScore += regulatoryRisk.score;
    maxRiskScore += 25;

    const riskPercentage = (totalRiskScore / maxRiskScore) * 100;
    let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';

    if (riskPercentage <= 33) overallRisk = 'LOW';
    else if (riskPercentage <= 66) overallRisk = 'MEDIUM';
    else overallRisk = 'HIGH';

    return { overallRisk, factors };
  }

  private calculateMarketRisk(): RiskFactor {
    const marketPhase = this.analyzeMarketPhase();
    let score = 12; // Baseline
    let description = 'Market conditions are stable';
    let mitigation = 'Monitor market trends regularly';

    if (marketPhase.phase === 'PEAK') {
      score = 20;
      description = 'Market at peak - potential for correction';
      mitigation = 'Consider taking profits or reducing exposure';
    } else if (marketPhase.phase === 'TROUGH') {
      score = 8;
      description = 'Market at trough - potential for recovery';
      mitigation = 'Good entry point for long-term investments';
    } else if (marketPhase.phase === 'DECLINE') {
      score = 18;
      description = 'Market declining - increased volatility';
      mitigation = 'Reduce exposure and wait for stabilization';
    } else if (marketPhase.phase === 'RECOVERY') {
      score = 10;
      description = 'Market recovering - improving conditions';
      mitigation = 'Gradual increase in exposure as confidence grows';
    }

    if (Math.abs(marketPhase.momentum) > 0.15) {
      score += 3;
      description += ' with high momentum';
      mitigation += ' - momentum can amplify risks';
    }

    return {
      category: 'Market Risk',
      score: Math.min(score, 25),
      description,
      mitigation
    };
  }

  private calculatePropertyRisk(): RiskFactor {
    let score = 12; // Baseline
    let description = 'Property characteristics are standard';
    let mitigation = 'Regular property maintenance and monitoring';

    // EPC Rating Risk
    const epcRating = this.propertyData?.epcRating;
    if (epcRating === 'F' || epcRating === 'G') {
      score += 8;
      description += ' - Poor energy efficiency increases costs';
      mitigation += ' - Consider energy efficiency improvements';
    } else if (epcRating === 'A' || epcRating === 'B') {
      score -= 3;
      description += ' - Good energy efficiency reduces costs';
      mitigation += ' - Maintain current efficiency standards';
    }

    // Property Type Risk
    const propertyType = this.propertyData?.propertyType;
    if (propertyType === 'Flat') {
      score += 3;
      description += ' - Flats may have higher volatility';
      mitigation += ' - Diversify with different property types';
    } else if (propertyType === 'Detached') {
      score -= 2;
      description += ' - Detached properties typically more stable';
      mitigation += ' - Good for long-term holds';
    }

    // Location Risk (simplified)
    const postcode = this.propertyData?.postcode;
    if (postcode?.startsWith('SE') || postcode?.startsWith('SW')) {
      score -= 1;
      description += ' - London location provides stability';
      mitigation += ' - Monitor London market trends';
    }

    return {
      category: 'Property Risk',
      score: Math.max(0, Math.min(score, 25)),
      description,
      mitigation
    };
  }

  private calculateLiquidityRisk(): RiskFactor {
    let score = 12; // Baseline
    let description = 'Standard liquidity profile';
    let mitigation = 'Maintain emergency funds';

    // Market Activity Risk
    const totalSales = this.marketData?.marketAnalysis?.totalSales || 0;
    if (totalSales < 10) {
      score += 5;
      description += ' - Low sales volume indicates limited liquidity';
      mitigation += ' - May take longer to sell if needed';
    } else if (totalSales > 50) {
      score -= 3;
      description += ' - High sales volume indicates good liquidity';
      mitigation += ' - Easier to sell when needed';
    }

    // Property Type Liquidity
    const propertyType = this.propertyData?.propertyType;
    if (propertyType === 'Flat') {
      score += 2;
      description += ' - Flats typically sell faster';
      mitigation += ' - Good for short-term holds';
    } else if (propertyType === 'Detached') {
      score -= 1;
      description += ' - Detached properties may take longer to sell';
      mitigation += ' - Plan for longer holding periods';
    }

    return {
      category: 'Liquidity Risk',
      score: Math.max(0, Math.min(score, 25)),
      description,
      mitigation
    };
  }

  private calculateRegulatoryRisk(): RiskFactor {
    let score = 12; // Baseline
    let description = 'Standard regulatory environment';
    let mitigation = 'Stay informed about policy changes';

    // EPC Regulatory Risk
    const epcRating = this.propertyData?.epcRating;
    if (epcRating === 'F' || epcRating === 'G') {
      score += 6;
      description += ' - Poor EPC ratings face regulatory pressure';
      mitigation += ' - Plan for mandatory improvements by 2030';
    }

    // Location Regulatory Risk
    const postcode = this.propertyData?.postcode;
    if (postcode?.startsWith('SE') || postcode?.startsWith('SW')) {
      score += 2;
      description += ' - London has additional regulatory requirements';
      mitigation += ' - Monitor London-specific regulations';
    }

    // Market Phase Regulatory Risk
    const marketPhase = this.analyzeMarketPhase();
    if (marketPhase.phase === 'PEAK') {
      score += 3;
      description += ' - Peak markets may face cooling measures';
      mitigation += ' - Be prepared for potential policy changes';
    }

    return {
      category: 'Regulatory Risk',
      score: Math.max(0, Math.min(score, 25)),
      description,
      mitigation
    };
  }

  private analyzePortfolioImpact(): PortfolioImpact {
    // Simplified portfolio analysis
    const diversification = this.calculateDiversificationScore();
    const riskAdjustment = this.calculateRiskAdjustment();
    const correlation = this.calculateCorrelation();
    const rebalancing = this.shouldRebalance();

    return {
      diversification,
      riskAdjustment,
      correlation,
      rebalancing
    };
  }

  private calculateDiversificationScore(): number {
    // Simplified - in a real system, this would analyze the user's portfolio
    const propertyType = this.propertyData?.propertyType;
    const postcode = this.propertyData?.postcode;
    
    let score = 50; // Baseline

    // Property type diversification
    if (propertyType === 'Detached') score += 20;
    else if (propertyType === 'Semi-Detached') score += 15;
    else if (propertyType === 'Terraced') score += 10;
    else if (propertyType === 'Flat') score += 5;

    // Location diversification
    if (postcode?.startsWith('SE') || postcode?.startsWith('SW')) {
      score += 15; // London premium
    } else if (postcode?.startsWith('NE') || postcode?.startsWith('NW')) {
      score += 10; // Regional diversity
    }

    return Math.min(score, 100);
  }

  private calculateRiskAdjustment(): number {
    const riskAssessment = this.assessRisk();
    const marketPhase = this.analyzeMarketPhase();
    
    let adjustment = 0;

    // Risk-based adjustment
    if (riskAssessment.overallRisk === 'HIGH') adjustment += 20;
    else if (riskAssessment.overallRisk === 'MEDIUM') adjustment += 10;
    else adjustment -= 10;

    // Market phase adjustment
    if (marketPhase.phase === 'PEAK') adjustment += 15;
    else if (marketPhase.phase === 'TROUGH') adjustment -= 15;
    else if (marketPhase.phase === 'DECLINE') adjustment += 10;

    return Math.max(-50, Math.min(50, adjustment));
  }

  private calculateCorrelation(): number {
    // Simplified correlation calculation
    const marketPhase = this.analyzeMarketPhase();
    const propertyType = this.propertyData?.propertyType;
    
    let correlation = 0.5; // Baseline

    // Market phase correlation
    if (marketPhase.phase === 'PEAK') correlation += 0.2;
    else if (marketPhase.phase === 'TROUGH') correlation -= 0.2;
    else if (marketPhase.phase === 'DECLINE') correlation += 0.1;

    // Property type correlation
    if (propertyType === 'Flat') correlation += 0.1;
    else if (propertyType === 'Detached') correlation -= 0.1;

    return Math.max(0, Math.min(1, correlation));
  }

  private shouldRebalance(): boolean {
    const marketPhase = this.analyzeMarketPhase();
    const riskAssessment = this.assessRisk();
    
    // Rebalance if market conditions change significantly
    if (marketPhase.phase === 'PEAK' && riskAssessment.overallRisk === 'HIGH') {
      return true;
    }
    
    if (marketPhase.phase === 'TROUGH' && riskAssessment.overallRisk === 'LOW') {
      return true;
    }

    return false;
  }

  private calculateRecommendation(marketPhase: any, riskAssessment: any): any {
    let action: 'BUY' | 'HOLD' | 'SELL' | 'WAIT';
    let confidence = 0;
    let reasoning: string[] = [];
    let timeHorizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
    let expectedReturn = 0;

    // Base recommendation on market phase and risk
    if (marketPhase.phase === 'TROUGH' && riskAssessment.overallRisk === 'LOW') {
      action = 'BUY';
      confidence = 85;
      reasoning = [
        'Market is at trough with low risk',
        'Good entry point for long-term investments',
        'Potential for significant upside as market recovers'
      ];
      timeHorizon = 'LONG_TERM';
      expectedReturn = 15;
    } else if (marketPhase.phase === 'PEAK' && riskAssessment.overallRisk === 'HIGH') {
      action = 'SELL';
      confidence = 80;
      reasoning = [
        'Market at peak with high risk',
        'Consider taking profits',
        'Potential for market correction'
      ];
      timeHorizon = 'SHORT_TERM';
      expectedReturn = -5;
    } else if (marketPhase.phase === 'RECOVERY' && riskAssessment.overallRisk === 'MEDIUM') {
      action = 'BUY';
      confidence = 70;
      reasoning = [
        'Market in recovery phase',
        'Moderate risk with growth potential',
        'Good for medium-term investments'
      ];
      timeHorizon = 'MEDIUM_TERM';
      expectedReturn = 10;
    } else if (marketPhase.phase === 'DECLINE' && riskAssessment.overallRisk === 'HIGH') {
      action = 'WAIT';
      confidence = 75;
      reasoning = [
        'Market declining with high risk',
        'Wait for stabilization',
        'Monitor for entry opportunities'
      ];
      timeHorizon = 'SHORT_TERM';
      expectedReturn = 0;
    } else {
      action = 'HOLD';
      confidence = 60;
      reasoning = [
        'Market conditions are neutral',
        'Maintain current positions',
        'Monitor for changes in conditions'
      ];
      timeHorizon = 'MEDIUM_TERM';
      expectedReturn = 5;
    }

    // Adjust confidence based on data quality
    if (marketPhase.confidence < 50) {
      confidence = Math.max(confidence - 20, 30);
      reasoning.push('Low confidence in market analysis');
    }

    return {
      action,
      confidence,
      reasoning,
      timeHorizon,
      expectedReturn
    };
  }

  generateInvestmentStrategies(): InvestmentStrategy[] {
    const strategies: InvestmentStrategy[] = [
      {
        name: 'Conservative Growth',
        description: 'Focus on stable, established areas with steady appreciation',
        riskTolerance: 'CONSERVATIVE',
        timeHorizon: 'LONG_TERM',
        targetReturn: 6,
        maxRisk: 25,
        recommendations: [
          'Invest in properties with good EPC ratings',
          'Focus on established residential areas',
          'Maintain longer holding periods',
          'Diversify across different property types'
        ]
      },
      {
        name: 'Balanced Portfolio',
        description: 'Mix of growth and income properties for balanced returns',
        riskTolerance: 'MODERATE',
        timeHorizon: 'MEDIUM_TERM',
        targetReturn: 10,
        maxRisk: 50,
        recommendations: [
          'Combine capital growth and rental income',
          'Mix of property types and locations',
          'Regular portfolio rebalancing',
          'Monitor market cycles for timing'
        ]
      },
      {
        name: 'Aggressive Growth',
        description: 'High-growth areas with potential for significant appreciation',
        riskTolerance: 'AGGRESSIVE',
        timeHorizon: 'SHORT_TERM',
        targetReturn: 15,
        maxRisk: 75,
        recommendations: [
          'Focus on emerging areas and regeneration zones',
          'Consider properties needing improvement',
          'Active management and quick turnover',
          'Higher risk tolerance for higher returns'
        ]
      }
    ];

    return strategies;
  }
}
