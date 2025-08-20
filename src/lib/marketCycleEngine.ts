export interface MarketCycle {
  phase: 'Peak' | 'Trough' | 'Recovery' | 'Decline';
  confidence: number; // 0-100
  startDate: string;
  endDate?: string;
  duration: number; // in months
  priceChange: number; // percentage change during cycle
  volumeChange: number; // percentage change in sales volume
  indicators: MarketIndicator[];
}

export interface MarketIndicator {
  name: string;
  value: number;
  threshold: number;
  signal: 'Bullish' | 'Bearish' | 'Neutral';
  weight: number; // 0-1, importance of this indicator
}

export interface TrendAnalysis {
  shortTerm: 'Rising' | 'Falling' | 'Sideways';
  mediumTerm: 'Rising' | 'Falling' | 'Sideways';
  longTerm: 'Rising' | 'Falling' | 'Sideways';
  momentum: number; // -100 to 100
  strength: number; // 0-100
  seasonalPattern?: SeasonalPattern;
}

export interface SeasonalPattern {
  peakMonth: number;
  troughMonth: number;
  seasonalStrength: number; // 0-100
  averagePeakPremium: number; // percentage above average
  averageTroughDiscount: number; // percentage below average
}

export interface MarketTiming {
  recommendation: 'Buy' | 'Sell' | 'Hold' | 'Wait';
  confidence: number;
  reasoning: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  timeHorizon: 'Immediate' | 'Short-term' | 'Medium-term' | 'Long-term';
}

export class MarketCycleEngine {
  private readonly peakThreshold = 0.15; // 15% above trend
  private readonly troughThreshold = -0.10; // 10% below trend
  private readonly recoveryThreshold = 0.05; // 5% above trough
  private readonly declineThreshold = -0.05; // 5% below peak

  /**
   * Analyze market data to detect cycles and trends
   */
  analyzeMarket(
    yearlyData: Array<{ year: number; averagePrice: number; count: number }>,
    hpiData: Array<{ date: string; hpiIndex: number; percentageChangeYearly: number }>
  ): {
    cycles: MarketCycle[];
    trends: TrendAnalysis;
    timing: MarketTiming;
    indicators: MarketIndicator[];
  } {
    // Sort data chronologically
    const sortedYearlyData = [...yearlyData].sort((a, b) => a.year - b.year);
    const sortedHPIData = [...hpiData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Detect market cycles
    const cycles = this.detectCycles(sortedYearlyData, sortedHPIData);
    
    // Analyze trends
    const trends = this.analyzeTrends(sortedYearlyData, sortedHPIData);
    
    // Calculate market indicators
    const indicators = this.calculateIndicators(sortedYearlyData, sortedHPIData);
    
    // Generate market timing recommendations
    const timing = this.generateTimingRecommendation(cycles, trends, indicators);

    return { cycles, trends, timing, indicators };
  }

  /**
   * Detect market cycles using peak/trough analysis
   */
  private detectCycles(
    yearlyData: Array<{ year: number; averagePrice: number; count: number }>,
    hpiData: Array<{ date: string; hpiIndex: number; percentageChangeYearly: number }>
  ): MarketCycle[] {
    const cycles: MarketCycle[] = [];
    
    if (yearlyData.length < 3) return cycles;

    // Calculate trend line using linear regression
    const trend = this.calculateTrendLine(yearlyData);
    
    // Find peaks and troughs
    const peaks: number[] = [];
    const troughs: number[] = [];
    
    for (let i = 1; i < yearlyData.length - 1; i++) {
      const current = yearlyData[i];
      const prev = yearlyData[i - 1];
      const next = yearlyData[i + 1];
      
      const currentTrend = trend.slope * current.year + trend.intercept;
      const currentDeviation = (current.averagePrice - currentTrend) / currentTrend;
      
      // Peak detection
      if (currentDeviation > this.peakThreshold && 
          current.averagePrice > prev.averagePrice && 
          current.averagePrice > next.averagePrice) {
        peaks.push(i);
      }
      
      // Trough detection
      if (currentDeviation < this.troughThreshold && 
          current.averagePrice < prev.averagePrice && 
          current.averagePrice < next.averagePrice) {
        troughs.push(i);
      }
    }

    // Generate cycles from peaks and troughs
    const allPoints = [...peaks, ...troughs].sort((a, b) => a - b);
    
    for (let i = 0; i < allPoints.length - 1; i++) {
      const start = allPoints[i];
      const end = allPoints[i + 1];
      const startYear = yearlyData[start];
      const endYear = yearlyData[end];
      
      const isPeakStart = peaks.includes(start);
      const phase = isPeakStart ? 'Decline' : 'Recovery';
      
      const priceChange = ((endYear.averagePrice - startYear.averagePrice) / startYear.averagePrice) * 100;
      const duration = endYear.year - startYear.year;
      
      // Calculate confidence based on deviation from trend
      const startTrend = trend.slope * startYear.year + trend.intercept;
      const startDeviation = Math.abs((startYear.averagePrice - startTrend) / startTrend);
      const confidence = Math.min(100, Math.max(0, 100 - (startDeviation * 100)));
      
      cycles.push({
        phase,
        confidence: Math.round(confidence),
        startDate: `${startYear.year}-01-01`,
        endDate: `${endYear.year}-12-31`,
        duration,
        priceChange: Math.round(priceChange * 100) / 100,
        volumeChange: 0, // Will be calculated if volume data available
        indicators: []
      });
    }

    return cycles;
  }

  /**
   * Analyze market trends across different time horizons
   */
  private analyzeTrends(
    yearlyData: Array<{ year: number; averagePrice: number; count: number }>,
    hpiData: Array<{ date: string; hpiIndex: number; percentageChangeYearly: number }>
  ): TrendAnalysis {
    if (yearlyData.length < 2) {
      return {
        shortTerm: 'Sideways',
        mediumTerm: 'Sideways',
        longTerm: 'Sideways',
        momentum: 0,
        strength: 0
      };
    }

    // Short-term trend (last 2 years)
    const shortTerm = this.calculateTrendDirection(yearlyData.slice(-2));
    
    // Medium-term trend (last 5 years or available data)
    const mediumTerm = this.calculateTrendDirection(yearlyData.slice(-5));
    
    // Long-term trend (all available data)
    const longTerm = this.calculateTrendDirection(yearlyData);
    
    // Calculate momentum (rate of change)
    const momentum = this.calculateMomentum(yearlyData);
    
    // Calculate trend strength
    const strength = this.calculateTrendStrength(yearlyData);
    
    // Detect seasonal patterns if we have enough data
    const seasonalPattern = yearlyData.length >= 8 ? this.detectSeasonalPattern(yearlyData) : undefined;

    return {
      shortTerm,
      mediumTerm,
      longTerm,
      momentum,
      strength,
      seasonalPattern
    };
  }

  /**
   * Calculate market indicators for investment decisions
   */
  private calculateIndicators(
    yearlyData: Array<{ year: number; averagePrice: number; count: number }>,
    hpiData: Array<{ date: string; hpiIndex: number; percentageChangeYearly: number }>
  ): MarketIndicator[] {
    const indicators: MarketIndicator[] = [];
    
    if (yearlyData.length < 2) return indicators;

    // Price Momentum Indicator
    const recentPrices = yearlyData.slice(-3).map(d => d.averagePrice);
    const priceMomentum = this.calculatePriceMomentum(recentPrices);
    indicators.push({
      name: 'Price Momentum',
      value: priceMomentum,
      threshold: 0.05,
      signal: priceMomentum > 0.05 ? 'Bullish' : priceMomentum < -0.05 ? 'Bearish' : 'Neutral',
      weight: 0.3
    });

    // HPI Trend Indicator
    if (hpiData.length >= 2) {
      const hpiTrend = this.calculateHPITrend(hpiData);
      indicators.push({
        name: 'HPI Trend',
        value: hpiTrend,
        threshold: 0.02,
        signal: hpiTrend > 0.02 ? 'Bullish' : hpiTrend < -0.02 ? 'Bearish' : 'Neutral',
        weight: 0.25
      });
    }

    // Volatility Indicator
    const volatility = this.calculateVolatility(yearlyData);
    indicators.push({
      name: 'Market Volatility',
      value: volatility,
      threshold: 0.15,
      signal: volatility < 0.15 ? 'Bullish' : volatility > 0.25 ? 'Bearish' : 'Neutral',
      weight: 0.2
    });

    // Sales Volume Indicator (if available)
    const volumeTrend = this.calculateVolumeTrend(yearlyData);
    indicators.push({
      name: 'Sales Volume',
      value: volumeTrend,
      threshold: 0.1,
      signal: volumeTrend > 0.1 ? 'Bullish' : volumeTrend < -0.1 ? 'Bearish' : 'Neutral',
      weight: 0.15
    });

    // Market Efficiency Indicator
    const efficiency = this.calculateMarketEfficiency(yearlyData);
    indicators.push({
      name: 'Market Efficiency',
      value: efficiency,
      threshold: 0.7,
      signal: efficiency > 0.7 ? 'Bullish' : efficiency < 0.5 ? 'Bearish' : 'Neutral',
      weight: 0.1
    });

    return indicators;
  }

  /**
   * Generate market timing recommendations
   */
  private generateTimingRecommendation(
    cycles: MarketCycle[],
    trends: TrendAnalysis,
    indicators: MarketIndicator[]
  ): MarketTiming {
    // Calculate overall market sentiment
    const sentiment = this.calculateMarketSentiment(cycles, trends, indicators);
    
    // Determine recommendation based on sentiment and current phase
    const currentPhase = cycles.length > 0 ? cycles[cycles.length - 1].phase : 'Recovery';
    const recommendation = this.determineRecommendation(sentiment, currentPhase, trends);
    
    // Calculate confidence based on indicator agreement
    const confidence = this.calculateRecommendationConfidence(indicators);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(cycles, trends, indicators, recommendation);
    
    // Assess risk level
    const riskLevel = this.assessRiskLevel(cycles, trends, indicators);
    
    // Determine time horizon
    const timeHorizon = this.determineTimeHorizon(cycles, trends);

    return {
      recommendation,
      confidence,
      reasoning,
      riskLevel,
      timeHorizon
    };
  }

  // Helper methods
  private calculateTrendLine(data: Array<{ year: number; averagePrice: number }>) {
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.year, 0);
    const sumY = data.reduce((sum, d) => sum + d.averagePrice, 0);
    const sumXY = data.reduce((sum, d) => sum + d.year * d.averagePrice, 0);
    const sumXX = data.reduce((sum, d) => sum + d.year * d.year, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  private calculateTrendDirection(data: Array<{ year: number; averagePrice: number }>): 'Rising' | 'Falling' | 'Sideways' {
    if (data.length < 2) return 'Sideways';
    
    const first = data[0];
    const last = data[data.length - 1];
    const change = (last.averagePrice - first.averagePrice) / first.averagePrice;
    
    if (change > 0.05) return 'Rising';
    if (change < -0.05) return 'Falling';
    return 'Sideways';
  }

  private calculateMomentum(data: Array<{ year: number; averagePrice: number }>): number {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-3);
    const momentum = recent.reduce((sum, d, i) => {
      if (i === 0) return 0;
      return sum + ((d.averagePrice - recent[i - 1].averagePrice) / recent[i - 1].averagePrice);
    }, 0);
    
    return Math.round(momentum * 100);
  }

  private calculateTrendStrength(data: Array<{ year: number; averagePrice: number }>): number {
    if (data.length < 2) return 0;
    
    const trend = this.calculateTrendLine(data);
    const deviations = data.map(d => {
      const expected = trend.slope * d.year + trend.intercept;
      return Math.abs((d.averagePrice - expected) / expected);
    });
    
    const averageDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
    return Math.max(0, Math.min(100, 100 - (averageDeviation * 100)));
  }

  private detectSeasonalPattern(data: Array<{ year: number; averagePrice: number }>): SeasonalPattern | undefined {
    // Simplified seasonal detection - would need monthly data for better accuracy
    return {
      peakMonth: 6, // June (summer)
      troughMonth: 12, // December (winter)
      seasonalStrength: 30, // Moderate seasonal effect
      averagePeakPremium: 5, // 5% above average
      averageTroughDiscount: 3 // 3% below average
    };
  }

  private calculatePriceMomentum(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const momentum = prices.reduce((sum, price, i) => {
      if (i === 0) return 0;
      return sum + ((price - prices[i - 1]) / prices[i - 1]);
    }, 0);
    
    return momentum / (prices.length - 1);
  }

  private calculateHPITrend(hpiData: Array<{ percentageChangeYearly: number }>): number {
    if (hpiData.length < 2) return 0;
    
    const recent = hpiData.slice(-3);
    return recent.reduce((sum, d) => sum + d.percentageChangeYearly, 0) / recent.length;
  }

  private calculateVolatility(data: Array<{ year: number; averagePrice: number }>): number {
    if (data.length < 2) return 0;
    
    const returns = data.slice(1).map((d, i) => {
      const prev = data[i];
      return (d.averagePrice - prev.averagePrice) / prev.averagePrice;
    });
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private calculateVolumeTrend(data: Array<{ year: number; count: number }>): number {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-3);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    return (last.count - first.count) / first.count;
  }

  private calculateMarketEfficiency(data: Array<{ year: number; averagePrice: number }>): number {
    if (data.length < 3) return 0.5;
    
    // Simple efficiency measure based on price predictability
    const trend = this.calculateTrendLine(data);
    const predictions = data.map(d => trend.slope * d.year + trend.intercept);
    const errors = data.map((d, i) => Math.abs((d.averagePrice - predictions[i]) / predictions[i]));
    
    const averageError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    return Math.max(0, Math.min(1, 1 - averageError));
  }

  private calculateMarketSentiment(
    cycles: MarketCycle[],
    trends: TrendAnalysis,
    indicators: MarketIndicator[]
  ): number {
    let sentiment = 50; // Neutral baseline
    
    // Cycle phase impact
    if (cycles.length > 0) {
      const currentPhase = cycles[cycles.length - 1].phase;
      switch (currentPhase) {
        case 'Peak': sentiment -= 20; break;
        case 'Trough': sentiment += 20; break;
        case 'Recovery': sentiment += 10; break;
        case 'Decline': sentiment -= 10; break;
      }
    }
    
    // Trend impact
    if (trends.shortTerm === 'Rising') sentiment += 15;
    else if (trends.shortTerm === 'Falling') sentiment -= 15;
    
    if (trends.longTerm === 'Rising') sentiment += 10;
    else if (trends.longTerm === 'Falling') sentiment -= 10;
    
    // Indicator impact
    const bullishIndicators = indicators.filter(i => i.signal === 'Bullish').length;
    const bearishIndicators = indicators.filter(i => i.signal === 'Bearish').length;
    
    sentiment += (bullishIndicators - bearishIndicators) * 5;
    
    return Math.max(0, Math.min(100, sentiment));
  }

  private determineRecommendation(
    sentiment: number,
    currentPhase: string,
    trends: TrendAnalysis
  ): 'Buy' | 'Sell' | 'Hold' | 'Wait' {
    if (sentiment > 70) return 'Buy';
    if (sentiment < 30) return 'Sell';
    if (currentPhase === 'Trough' && trends.shortTerm === 'Rising') return 'Buy';
    if (currentPhase === 'Peak' && trends.shortTerm === 'Falling') return 'Sell';
    if (sentiment > 50) return 'Hold';
    return 'Wait';
  }

  private calculateRecommendationConfidence(indicators: MarketIndicator[]): number {
    if (indicators.length === 0) return 50;
    
    const agreement = indicators.reduce((sum, indicator) => {
      const signal = indicator.signal;
      const weight = indicator.weight;
      
      if (signal === 'Bullish') return sum + weight;
      if (signal === 'Bearish') return sum - weight;
      return sum;
    }, 0);
    
    const totalWeight = indicators.reduce((sum, i) => sum + i.weight, 0);
    const normalizedAgreement = Math.abs(agreement / totalWeight);
    
    return Math.round(50 + (normalizedAgreement * 50));
  }

  private generateReasoning(
    cycles: MarketCycle[],
    trends: TrendAnalysis,
    indicators: MarketIndicator[],
    recommendation: string
  ): string[] {
    const reasoning: string[] = [];
    
    // Add cycle-based reasoning
    if (cycles.length > 0) {
      const currentCycle = cycles[cycles.length - 1];
      reasoning.push(`Market is in ${currentCycle.phase} phase with ${currentCycle.confidence}% confidence`);
    }
    
    // Add trend-based reasoning
    reasoning.push(`Short-term trend: ${trends.shortTerm}`);
    reasoning.push(`Long-term trend: ${trends.longTerm}`);
    reasoning.push(`Market momentum: ${trends.momentum > 0 ? 'Positive' : 'Negative'} (${trends.momentum}%)`);
    
    // Add indicator-based reasoning
    const bullishCount = indicators.filter(i => i.signal === 'Bullish').length;
    const bearishCount = indicators.filter(i => i.signal === 'Bearish').length;
    
    if (bullishCount > bearishCount) {
      reasoning.push(`${bullishCount} bullish indicators vs ${bearishCount} bearish indicators`);
    } else if (bearishCount > bullishCount) {
      reasoning.push(`${bearishCount} bearish indicators vs ${bullishCount} bullish indicators`);
    } else {
      reasoning.push('Mixed market signals');
    }
    
    // Add recommendation-specific reasoning
    switch (recommendation) {
      case 'Buy':
        reasoning.push('Current market conditions favor buying opportunities');
        break;
      case 'Sell':
        reasoning.push('Market conditions suggest selling or waiting for better entry points');
        break;
      case 'Hold':
        reasoning.push('Market is stable, maintain current positions');
        break;
      case 'Wait':
        reasoning.push('Market uncertainty suggests waiting for clearer signals');
        break;
    }
    
    return reasoning;
  }

  private assessRiskLevel(
    cycles: MarketCycle[],
    trends: TrendAnalysis,
    indicators: MarketIndicator[]
  ): 'Low' | 'Medium' | 'High' {
    let riskScore = 0;
    
    // Volatility risk
    const volatilityIndicator = indicators.find(i => i.name === 'Market Volatility');
    if (volatilityIndicator && volatilityIndicator.value > 0.25) riskScore += 2;
    else if (volatilityIndicator && volatilityIndicator.value < 0.15) riskScore -= 1;
    
    // Trend consistency risk
    if (trends.shortTerm !== trends.longTerm) riskScore += 1;
    
    // Cycle phase risk
    if (cycles.length > 0) {
      const currentPhase = cycles[cycles.length - 1].phase;
      if (currentPhase === 'Peak' || currentPhase === 'Trough') riskScore += 1;
    }
    
    // Market efficiency risk
    const efficiencyIndicator = indicators.find(i => i.name === 'Market Efficiency');
    if (efficiencyIndicator && efficiencyIndicator.value < 0.6) riskScore += 1;
    
    if (riskScore <= 0) return 'Low';
    if (riskScore <= 2) return 'Medium';
    return 'High';
  }

  private determineTimeHorizon(
    cycles: MarketCycle[],
    trends: TrendAnalysis
  ): 'Immediate' | 'Short-term' | 'Medium-term' | 'Long-term' {
    if (cycles.length > 0) {
      const currentCycle = cycles[cycles.length - 1];
      if (currentCycle.phase === 'Trough' && trends.shortTerm === 'Rising') return 'Immediate';
      if (currentCycle.phase === 'Peak' && trends.shortTerm === 'Falling') return 'Immediate';
    }
    
    if (trends.shortTerm === 'Rising' && trends.longTerm === 'Rising') return 'Short-term';
    if (trends.shortTerm === 'Falling' && trends.longTerm === 'Falling') return 'Short-term';
    
    if (trends.longTerm === 'Rising') return 'Medium-term';
    if (trends.longTerm === 'Falling') return 'Medium-term';
    
    return 'Long-term';
  }
}
