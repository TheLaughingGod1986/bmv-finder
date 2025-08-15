interface PropertyFeatures {
  postcode: string;
  propertyType: string;
  region: string;
  currentValue?: number;
  historicalData: Array<{
    date: string;
    index: number;
    year: number;
    month: number;
  }>;
}

interface PredictionResult {
  predictedValue: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
  nextMonthPrediction?: number;
  nextQuarterPrediction?: number;
  nextYearPrediction?: number;
}

class PredictiveModel {
  private modelCache = new Map<string, any>();

  // Simple linear regression for trend analysis
  private calculateTrend(historicalData: Array<{ date: string; index: number }>): {
    slope: number;
    intercept: number;
    rSquared: number;
  } {
    if (historicalData.length < 2) {
      return { slope: 0, intercept: 0, rSquared: 0 };
    }

    const n = historicalData.length;
    const xValues = historicalData.map((_, i) => i);
    const yValues = historicalData.map(d => d.index);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = yValues.reduce((sum, y, i) => {
      const predicted = slope * xValues[i] + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    return { slope, intercept, rSquared };
  }

  // Calculate growth rate
  private calculateGrowthRate(historicalData: Array<{ date: string; index: number }>): number {
    if (historicalData.length < 2) return 0;

    const sortedData = historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstValue = sortedData[0].index;
    const lastValue = sortedData[sortedData.length - 1].index;
    const timeSpan = sortedData.length - 1;

    if (timeSpan === 0 || firstValue === 0) return 0;

    return Math.pow(lastValue / firstValue, 1 / timeSpan) - 1;
  }

  // Seasonal adjustment using moving averages
  private calculateSeasonalAdjustment(historicalData: Array<{ date: string; index: number; month: number }>): number {
    if (historicalData.length < 12) return 1;

    const monthlyAverages = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);

    historicalData.forEach(data => {
      monthlyAverages[data.month - 1] += data.index;
      monthlyCounts[data.month - 1]++;
    });

    // Calculate average for each month
    for (let i = 0; i < 12; i++) {
      if (monthlyCounts[i] > 0) {
        monthlyAverages[i] /= monthlyCounts[i];
      }
    }

    // Calculate overall average
    const overallAverage = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 12;

    // Return seasonal factor for current month
    const currentMonth = new Date().getMonth();
    return monthlyAverages[currentMonth] / overallAverage;
  }

  // Predict future value using multiple methods
  async predictPropertyValue(features: PropertyFeatures): Promise<PredictionResult> {
    const cacheKey = `prediction:${features.postcode}:${features.propertyType}`;
    
    // Check cache
    if (this.modelCache.has(cacheKey)) {
      const cached = this.modelCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 minutes
        return cached.result;
      }
    }

    if (features.historicalData.length < 6) {
      return {
        predictedValue: features.currentValue || 0,
        confidence: 0.1,
        trend: 'stable',
        factors: ['Insufficient historical data'],
      };
    }

    // Calculate various metrics
    const trend = this.calculateTrend(features.historicalData);
    const growthRate = this.calculateGrowthRate(features.historicalData);
    const seasonalFactor = this.calculateSeasonalAdjustment(features.historicalData);

    // Get latest value
    const latestValue = features.historicalData[features.historicalData.length - 1].index;

    // Calculate predictions using different methods
    const predictions = {
      trendBased: latestValue * (1 + trend.slope),
      growthBased: latestValue * Math.pow(1 + growthRate, 1),
      seasonalAdjusted: latestValue * seasonalFactor,
    };

    // Weighted average of predictions
    const weights = {
      trendBased: 0.4,
      growthBased: 0.4,
      seasonalAdjusted: 0.2,
    };

    const predictedValue = 
      predictions.trendBased * weights.trendBased +
      predictions.growthBased * weights.growthBased +
      predictions.seasonalAdjusted * weights.seasonalAdjusted;

    // Calculate confidence based on data quality
    const confidence = Math.min(0.95, Math.max(0.1, 
      trend.rSquared * 0.6 + 
      (features.historicalData.length / 24) * 0.3 + 
      0.1
    ));

    // Determine trend direction
    let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (trend.slope > 0.01) trendDirection = 'increasing';
    else if (trend.slope < -0.01) trendDirection = 'decreasing';

    // Calculate future predictions
    const nextMonthPrediction = predictedValue * (1 + trend.slope * 0.083); // 1/12 of a year
    const nextQuarterPrediction = predictedValue * (1 + trend.slope * 0.25);
    const nextYearPrediction = predictedValue * (1 + trend.slope);

    const result: PredictionResult = {
      predictedValue: Math.round(predictedValue),
      confidence: Math.round(confidence * 100) / 100,
      trend: trendDirection,
      factors: [
        `Historical trend (R²: ${Math.round(trend.rSquared * 100) / 100})`,
        `Growth rate: ${Math.round(growthRate * 100 * 100) / 100}%`,
        `Seasonal factor: ${Math.round(seasonalFactor * 100) / 100}`,
        `Data points: ${features.historicalData.length}`,
      ],
      nextMonthPrediction: Math.round(nextMonthPrediction),
      nextQuarterPrediction: Math.round(nextQuarterPrediction),
      nextYearPrediction: Math.round(nextYearPrediction),
    };

    // Cache the result
    this.modelCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    return result;
  }

  // Batch prediction for multiple properties
  async predictBatch(properties: PropertyFeatures[]): Promise<PredictionResult[]> {
    const results: PredictionResult[] = [];
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(property => 
          this.predictPropertyValue(property).catch(error => ({
            predictedValue: property.currentValue || 0,
            confidence: 0,
            trend: 'stable' as const,
            factors: [`Error: ${error.message}`],
          }))
        )
      );
      
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < properties.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // Get market insights for a region
  async getMarketInsights(region: string, historicalData: Array<{ date: string; index: number }>): Promise<{
    marketTrend: 'bull' | 'bear' | 'neutral';
    volatility: number;
    recommendation: string;
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const trend = this.calculateTrend(historicalData);
    const growthRate = this.calculateGrowthRate(historicalData);

    // Calculate volatility (standard deviation of returns)
    const returns = historicalData.slice(1).map((data, i) => {
      const prevValue = historicalData[i].index;
      return (data.index - prevValue) / prevValue;
    });

    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    // Determine market trend
    let marketTrend: 'bull' | 'bear' | 'neutral' = 'neutral';
    if (trend.slope > 0.02 && growthRate > 0.05) marketTrend = 'bull';
    else if (trend.slope < -0.02 || growthRate < -0.05) marketTrend = 'bear';

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (volatility < 0.05) riskLevel = 'low';
    else if (volatility > 0.15) riskLevel = 'high';

    // Generate recommendation
    let recommendation = '';
    if (marketTrend === 'bull') {
      recommendation = 'Market showing strong growth potential. Consider investment opportunities.';
    } else if (marketTrend === 'bear') {
      recommendation = 'Market showing decline. Exercise caution and consider waiting for recovery.';
    } else {
      recommendation = 'Market is stable. Good for long-term investments with moderate expectations.';
    }

    return {
      marketTrend,
      volatility: Math.round(volatility * 100 * 100) / 100,
      recommendation,
      riskLevel,
    };
  }

  // Clear cache
  clearCache(): void {
    this.modelCache.clear();
  }
}

export default PredictiveModel; 