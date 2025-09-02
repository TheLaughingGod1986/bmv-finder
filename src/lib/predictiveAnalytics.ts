// Predictive analytics engine for property market forecasting

import { esClient } from './esClient';
import { advancedCache } from './advancedCache';

interface ForecastConfig {
  enableCaching: boolean;
  cacheTimeout: number; // seconds
  maxForecastPeriod: number; // months
  confidenceThreshold: number; // 0-1
  enableML: boolean;
  enableSeasonalAdjustment: boolean;
}

interface PriceForecast {
  id: string;
  area: string;
  propertyType: string;
  currentPrice: number;
  forecasts: {
    period: string; // e.g., "3M", "6M", "12M"
    predictedPrice: number;
    confidence: number;
    range: {
      lower: number;
      upper: number;
    };
    factors: string[];
  }[];
  lastUpdated: string;
  metadata?: Record<string, any>;
}

interface MarketForecast {
  id: string;
  area: string;
  metric: string;
  currentValue: number;
  forecasts: {
    period: string;
    predictedValue: number;
    confidence: number;
    range: {
      lower: number;
      upper: number;
    };
    trend: 'increasing' | 'decreasing' | 'stable';
    factors: string[];
  }[];
  lastUpdated: string;
  metadata?: Record<string, any>;
}

interface InvestmentRecommendation {
  id: string;
  propertyId: string;
  recommendation: 'buy' | 'hold' | 'sell' | 'watch';
  confidence: number;
  reasoning: string[];
  expectedReturn: {
    period: string;
    return: number;
    confidence: number;
  }[];
  riskFactors: string[];
  opportunityFactors: string[];
  timeframe: string;
  lastUpdated: string;
}

interface PredictiveResult {
  priceForecasts: PriceForecast[];
  marketForecasts: MarketForecast[];
  investmentRecommendations: InvestmentRecommendation[];
  summary: {
    totalForecasts: number;
    avgConfidence: number;
    highConfidenceForecasts: number;
    marketOutlook: 'bullish' | 'bearish' | 'neutral';
    keyDrivers: string[];
  };
  lastUpdated: string;
}

class PredictiveAnalytics {
  private config: ForecastConfig;
  private forecastCache: Map<string, any> = new Map();

  constructor(config?: Partial<ForecastConfig>) {
    this.config = {
      enableCaching: true,
      cacheTimeout: 600, // 10 minutes
      maxForecastPeriod: 24, // 24 months
      confidenceThreshold: 0.7,
      enableML: true,
      enableSeasonalAdjustment: true,
      ...config
    };
  }

  // Main predictive analysis method
  async predictMarket(area?: string, propertyType?: string): Promise<PredictiveResult> {
    const cacheKey = `predictions_${area || 'all'}_${propertyType || 'all'}`;
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = await advancedCache.get<PredictiveResult>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Generate forecasts
      const [priceForecasts, marketForecasts, investmentRecommendations] = await Promise.all([
        this.generatePriceForecasts(area, propertyType),
        this.generateMarketForecasts(area),
        this.generateInvestmentRecommendations(area, propertyType)
      ]);

      // Calculate summary
      const summary = this.calculateForecastSummary(priceForecasts, marketForecasts, investmentRecommendations);

      const result: PredictiveResult = {
        priceForecasts,
        marketForecasts,
        investmentRecommendations,
        summary,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      if (this.config.enableCaching) {
        await advancedCache.set(cacheKey, result, this.config.cacheTimeout);
      }

      return result;

    } catch (error) {
      console.error('Predictive analysis failed:', error);
      throw new Error('Failed to generate market predictions');
    }
  }

  // Generate price forecasts
  private async generatePriceForecasts(area?: string, propertyType?: string): Promise<PriceForecast[]> {
    const forecasts: PriceForecast[] = [];
    
    try {
      // Get historical price data
      const historicalData = await this.getHistoricalPriceData(area, propertyType);
      
      if (historicalData.length < 12) {
        console.warn('Insufficient historical data for reliable forecasting');
        return forecasts;
      }

      // Generate forecasts for different property types if not specified
      const types = propertyType ? [propertyType] : ['House', 'Flat', 'Terraced', 'Semi-detached'];
      
      for (const type of types) {
        const typeData = historicalData.filter(d => d.propertyType === type);
        if (typeData.length < 6) continue;

        const forecast = await this.generatePropertyTypeForecast(type, typeData, area);
        if (forecast) {
          forecasts.push(forecast);
        }
      }

    } catch (error) {
      console.error('Price forecast generation failed:', error);
    }

    return forecasts;
  }

  // Generate market forecasts
  private async generateMarketForecasts(area?: string): Promise<MarketForecast[]> {
    const forecasts: MarketForecast[] = [];
    
    try {
      // Volume forecast
      const volumeForecast = await this.generateVolumeForecast(area);
      if (volumeForecast) forecasts.push(volumeForecast);

      // Market velocity forecast
      const velocityForecast = await this.generateVelocityForecast(area);
      if (velocityForecast) forecasts.push(velocityForecast);

      // BMV opportunity forecast
      const bmvForecast = await this.generateBmvForecast(area);
      if (bmvForecast) forecasts.push(bmvForecast);

    } catch (error) {
      console.error('Market forecast generation failed:', error);
    }

    return forecasts;
  }

  // Generate investment recommendations
  private async generateInvestmentRecommendations(area?: string, propertyType?: string): Promise<InvestmentRecommendation[]> {
    const recommendations: InvestmentRecommendation[] = [];
    
    try {
      // Get properties with high BMV scores
      const highBmvProperties = await this.getHighBmvProperties(area, propertyType);
      
      for (const property of highBmvProperties) {
        const recommendation = await this.analyzeInvestmentPotential(property);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

    } catch (error) {
      console.error('Investment recommendation generation failed:', error);
    }

    return recommendations;
  }

  // Generate property type forecast
  private async generatePropertyTypeForecast(propertyType: string, historicalData: any[], area?: string): Promise<PriceForecast | null> {
    try {
      // Calculate current average price
      const currentPrice = historicalData[historicalData.length - 1].avgPrice;
      
      // Apply forecasting models
      const forecasts = [];
      const periods = ['3M', '6M', '12M', '24M'];
      
      for (const period of periods) {
        const months = this.parsePeriod(period);
        if (months > this.config.maxForecastPeriod) continue;

        const forecast = await this.forecastPrice(historicalData, months, propertyType);
        if (forecast) {
          forecasts.push({
            period,
            predictedPrice: forecast.price,
            confidence: forecast.confidence,
            range: {
              lower: forecast.price * (1 - forecast.uncertainty),
              upper: forecast.price * (1 + forecast.uncertainty)
            },
            factors: forecast.factors
          });
        }
      }

      if (forecasts.length === 0) return null;

      return {
        id: `price_forecast_${propertyType}_${area || 'all'}_${Date.now()}`,
        area: area || 'All Areas',
        propertyType,
        currentPrice,
        forecasts,
        lastUpdated: new Date().toISOString(),
        metadata: {
          dataPoints: historicalData.length,
          model: 'ARIMA',
          seasonalAdjustment: this.config.enableSeasonalAdjustment
        }
      };

    } catch (error) {
      console.error(`Property type forecast failed for ${propertyType}:`, error);
      return null;
    }
  }

  // Forecast price using time series analysis
  private async forecastPrice(historicalData: any[], months: number, propertyType: string): Promise<any> {
    try {
      // Simplified ARIMA-like forecasting
      const prices = historicalData.map(d => d.avgPrice);
      const n = prices.length;
      
      if (n < 3) return null;

      // Calculate trend
      const trend = this.calculateTrend(prices);
      
      // Calculate seasonal component
      const seasonal = this.config.enableSeasonalAdjustment ? this.calculateSeasonalComponent(prices) : 0;
      
      // Calculate volatility
      const volatility = this.calculateVolatility(prices);
      
      // Generate forecast
      const lastPrice = prices[n - 1];
      const predictedPrice = lastPrice * Math.pow(1 + trend, months / 12) + seasonal;
      
      // Calculate confidence based on data quality and volatility
      const confidence = Math.max(0.3, Math.min(0.95, 1 - volatility / lastPrice));
      
      // Calculate uncertainty range
      const uncertainty = Math.min(0.3, volatility / lastPrice * Math.sqrt(months / 12));
      
      // Identify key factors
      const factors = this.identifyPriceFactors(trend, seasonal, volatility, propertyType);

      return {
        price: Math.max(0, predictedPrice),
        confidence,
        uncertainty,
        factors
      };

    } catch (error) {
      console.error('Price forecasting failed:', error);
      return null;
    }
  }

  // Generate volume forecast
  private async generateVolumeForecast(area?: string): Promise<MarketForecast | null> {
    try {
      // Get historical volume data
      const volumeData = await this.getHistoricalVolumeData(area);
      
      if (volumeData.length < 6) return null;

      const currentVolume = volumeData[volumeData.length - 1].volume;
      const forecasts = [];
      const periods = ['3M', '6M', '12M'];
      
      for (const period of periods) {
        const months = this.parsePeriod(period);
        const forecast = await this.forecastVolume(volumeData, months);
        
        if (forecast) {
          forecasts.push({
            period,
            predictedValue: forecast.volume,
            confidence: forecast.confidence,
            range: {
              lower: forecast.volume * (1 - forecast.uncertainty),
              upper: forecast.volume * (1 + forecast.uncertainty)
            },
            trend: forecast.trend,
            factors: forecast.factors
          });
        }
      }

      if (forecasts.length === 0) return null;

      return {
        id: `volume_forecast_${area || 'all'}_${Date.now()}`,
        area: area || 'All Areas',
        metric: 'Sales Volume',
        currentValue: currentVolume,
        forecasts,
        lastUpdated: new Date().toISOString(),
        metadata: {
          dataPoints: volumeData.length,
          model: 'Exponential Smoothing'
        }
      };

    } catch (error) {
      console.error('Volume forecast generation failed:', error);
      return null;
    }
  }

  // Generate velocity forecast
  private async generateVelocityForecast(area?: string): Promise<MarketForecast | null> {
    try {
      // Simulate velocity forecasting
      const currentVelocity = 45; // days on market
      const forecasts = [];
      const periods = ['3M', '6M', '12M'];
      
      for (const period of periods) {
        const months = this.parsePeriod(period);
        const trend = -0.5; // Slight improvement in velocity
        const predictedVelocity = Math.max(20, currentVelocity + trend * months);
        const confidence = Math.max(0.6, 0.9 - months * 0.05);
        const uncertainty = 0.15;
        
        forecasts.push({
          period,
          predictedValue: predictedVelocity,
          confidence,
          range: {
            lower: predictedVelocity * (1 - uncertainty),
            upper: predictedVelocity * (1 + uncertainty)
          },
          trend: trend < 0 ? 'increasing' : 'decreasing',
          factors: ['Market conditions', 'Seasonal patterns', 'Economic indicators']
        });
      }

      return {
        id: `velocity_forecast_${area || 'all'}_${Date.now()}`,
        area: area || 'All Areas',
        metric: 'Market Velocity',
        currentValue: currentVelocity,
        forecasts,
        lastUpdated: new Date().toISOString(),
        metadata: {
          model: 'Trend Analysis'
        }
      };

    } catch (error) {
      console.error('Velocity forecast generation failed:', error);
      return null;
    }
  }

  // Generate BMV forecast
  private async generateBmvForecast(area?: string): Promise<MarketForecast | null> {
    try {
      // Simulate BMV opportunity forecasting
      const currentBmvCount = 25; // Number of high BMV opportunities
      const forecasts = [];
      const periods = ['3M', '6M', '12M'];
      
      for (const period of periods) {
        const months = this.parsePeriod(period);
        const trend = 0.1; // Slight increase in opportunities
        const predictedCount = Math.max(0, currentBmvCount * (1 + trend * months / 12));
        const confidence = Math.max(0.5, 0.8 - months * 0.03);
        const uncertainty = 0.2;
        
        forecasts.push({
          period,
          predictedValue: predictedCount,
          confidence,
          range: {
            lower: predictedCount * (1 - uncertainty),
            upper: predictedCount * (1 + uncertainty)
          },
          trend: trend > 0 ? 'increasing' : 'decreasing',
          factors: ['Market volatility', 'Economic conditions', 'Property supply']
        });
      }

      return {
        id: `bmv_forecast_${area || 'all'}_${Date.now()}`,
        area: area || 'All Areas',
        metric: 'BMV Opportunities',
        currentValue: currentBmvCount,
        forecasts,
        lastUpdated: new Date().toISOString(),
        metadata: {
          model: 'Opportunity Analysis'
        }
      };

    } catch (error) {
      console.error('BMV forecast generation failed:', error);
      return null;
    }
  }

  // Analyze investment potential
  private async analyzeInvestmentPotential(property: any): Promise<InvestmentRecommendation | null> {
    try {
      const bmvScore = property.bmvScore;
      const price = property.price;
      const area = property.area;
      
      // Determine recommendation based on BMV score and other factors
      let recommendation: 'buy' | 'hold' | 'sell' | 'watch';
      let confidence: number;
      let reasoning: string[] = [];
      let expectedReturn: any[] = [];
      let riskFactors: string[] = [];
      let opportunityFactors: string[] = [];

      if (bmvScore >= 85) {
        recommendation = 'buy';
        confidence = 0.85;
        reasoning = [
          'Excellent BMV score indicates strong investment potential',
          'Property significantly below market value',
          'High potential for capital appreciation'
        ];
        opportunityFactors = [
          'Below market value pricing',
          'Strong location fundamentals',
          'Potential for value-add improvements'
        ];
      } else if (bmvScore >= 75) {
        recommendation = 'buy';
        confidence = 0.75;
        reasoning = [
          'Good BMV score shows investment opportunity',
          'Property priced below market average',
          'Moderate potential for returns'
        ];
        opportunityFactors = [
          'Below market value pricing',
          'Decent location'
        ];
      } else if (bmvScore >= 65) {
        recommendation = 'watch';
        confidence = 0.65;
        reasoning = [
          'Moderate BMV score suggests limited opportunity',
          'Property close to market value',
          'Monitor for price changes'
        ];
        riskFactors = [
          'Limited upside potential',
          'Market value pricing'
        ];
      } else {
        recommendation = 'hold';
        confidence = 0.6;
        reasoning = [
          'Low BMV score indicates overpriced property',
          'Limited investment potential',
          'Consider alternative opportunities'
        ];
        riskFactors = [
          'Overpriced relative to market',
          'Limited appreciation potential'
        ];
      }

      // Generate expected return forecasts
      const periods = ['1Y', '3Y', '5Y'];
      for (const period of periods) {
        const years = this.parsePeriod(period) / 12;
        const baseReturn = bmvScore >= 85 ? 0.15 : bmvScore >= 75 ? 0.10 : 0.05;
        const returnRate = baseReturn * years;
        const returnConfidence = Math.max(0.4, confidence - years * 0.1);
        
        expectedReturn.push({
          period,
          return: returnRate * 100, // Convert to percentage
          confidence: returnConfidence
        });
      }

      return {
        id: `investment_${property.id}_${Date.now()}`,
        propertyId: property.id,
        recommendation,
        confidence,
        reasoning,
        expectedReturn,
        riskFactors,
        opportunityFactors,
        timeframe: '12-24 months',
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Investment analysis failed:', error);
      return null;
    }
  }

  // Helper methods
  private async getHistoricalPriceData(area?: string, propertyType?: string): Promise<any[]> {
    try {
      const query = this.buildHistoricalQuery(area, propertyType);
      const response = await esClient.search({
        index: 'recent_sales',
        size: 1000,
        query,
        aggs: {
          monthly_prices: {
            date_histogram: {
              field: 'date_of_transfer',
              calendar_interval: 'month',
              min_doc_count: 1
            },
            aggs: {
              avg_price: { avg: { field: 'price' } },
              property_type: { terms: { field: 'propertyType' } }
            }
          }
        }
      });

      const buckets = response.aggregations?.monthly_prices?.buckets || [];
      return buckets.map(bucket => ({
        date: bucket.key_as_string,
        avgPrice: bucket.avg_price.value,
        propertyType: bucket.property_type.buckets[0]?.key || 'Unknown'
      }));

    } catch (error) {
      console.error('Failed to get historical price data:', error);
      return [];
    }
  }

  private async getHistoricalVolumeData(area?: string): Promise<any[]> {
    try {
      const query = this.buildHistoricalQuery(area);
      const response = await esClient.search({
        index: 'recent_sales',
        size: 1000,
        query,
        aggs: {
          monthly_volume: {
            date_histogram: {
              field: 'date_of_transfer',
              calendar_interval: 'month',
              min_doc_count: 1
            },
            aggs: {
              volume_count: { value_count: { field: 'price' } }
            }
          }
        }
      });

      const buckets = response.aggregations?.monthly_volume?.buckets || [];
      return buckets.map(bucket => ({
        date: bucket.key_as_string,
        volume: bucket.volume_count.value
      }));

    } catch (error) {
      console.error('Failed to get historical volume data:', error);
      return [];
    }
  }

  private async getHighBmvProperties(area?: string, propertyType?: string): Promise<any[]> {
    // This would integrate with the BMV scoring system
    return [
      { id: '1', bmvScore: 87, price: 450000, area: 'SW1A', propertyType: 'House' },
      { id: '2', bmvScore: 92, price: 320000, area: 'E1', propertyType: 'Flat' },
      { id: '3', bmvScore: 78, price: 550000, area: 'N1', propertyType: 'House' }
    ];
  }

  private buildHistoricalQuery(area?: string, propertyType?: string): any {
    const must: any[] = [];

    if (area) {
      must.push({ prefix: { postcode: area } });
    }

    if (propertyType) {
      must.push({ term: { propertyType } });
    }

    // Add date range (last 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    must.push({
      range: {
        date_of_transfer: {
          gte: twoYearsAgo.toISOString().split('T')[0]
        }
      }
    });

    return {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }]
      }
    };
  }

  private calculateTrend(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const n = prices.length;
    const firstPrice = prices[0];
    const lastPrice = prices[n - 1];
    
    return (lastPrice - firstPrice) / firstPrice / (n - 1);
  }

  private calculateSeasonalComponent(prices: number[]): number {
    // Simplified seasonal adjustment
    // In a real implementation, this would use more sophisticated seasonal decomposition
    return 0;
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private identifyPriceFactors(trend: number, seasonal: number, volatility: number, propertyType: string): string[] {
    const factors: string[] = [];
    
    if (Math.abs(trend) > 0.05) {
      factors.push(trend > 0 ? 'Strong upward trend' : 'Declining trend');
    }
    
    if (volatility > 0.1) {
      factors.push('High market volatility');
    }
    
    factors.push(`${propertyType} market conditions`);
    factors.push('Economic indicators');
    
    return factors;
  }

  private async forecastVolume(volumeData: any[], months: number): Promise<any> {
    try {
      const volumes = volumeData.map(d => d.volume);
      const n = volumes.length;
      
      if (n < 3) return null;

      // Simple exponential smoothing
      const alpha = 0.3;
      let forecast = volumes[n - 1];
      
      for (let i = n - 2; i >= 0; i--) {
        forecast = alpha * volumes[i] + (1 - alpha) * forecast;
      }
      
      // Apply trend
      const trend = this.calculateTrend(volumes);
      const predictedVolume = forecast * Math.pow(1 + trend, months / 12);
      
      const confidence = Math.max(0.4, 0.8 - months * 0.05);
      const uncertainty = 0.2;
      
      return {
        volume: Math.max(0, predictedVolume),
        confidence,
        uncertainty,
        trend: trend > 0 ? 'increasing' : 'decreasing',
        factors: ['Historical volume patterns', 'Market trends', 'Seasonal effects']
      };

    } catch (error) {
      console.error('Volume forecasting failed:', error);
      return null;
    }
  }

  private parsePeriod(period: string): number {
    const match = period.match(/(\d+)([MY])/);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    return unit === 'M' ? value : value * 12;
  }

  private calculateForecastSummary(priceForecasts: PriceForecast[], marketForecasts: MarketForecast[], investmentRecommendations: InvestmentRecommendation[]) {
    const totalForecasts = priceForecasts.length + marketForecasts.length + investmentRecommendations.length;
    
    const allConfidences = [
      ...priceForecasts.flatMap(pf => pf.forecasts.map(f => f.confidence)),
      ...marketForecasts.flatMap(mf => mf.forecasts.map(f => f.confidence)),
      ...investmentRecommendations.map(ir => ir.confidence)
    ];
    
    const avgConfidence = allConfidences.length > 0 
      ? allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length 
      : 0;
    
    const highConfidenceForecasts = allConfidences.filter(c => c >= this.config.confidenceThreshold).length;
    
    // Determine market outlook
    const buyRecommendations = investmentRecommendations.filter(ir => ir.recommendation === 'buy').length;
    const totalRecommendations = investmentRecommendations.length;
    const buyRatio = totalRecommendations > 0 ? buyRecommendations / totalRecommendations : 0.5;
    
    let marketOutlook: 'bullish' | 'bearish' | 'neutral';
    if (buyRatio > 0.6) marketOutlook = 'bullish';
    else if (buyRatio < 0.4) marketOutlook = 'bearish';
    else marketOutlook = 'neutral';
    
    const keyDrivers = [
      'Economic indicators',
      'Interest rates',
      'Property supply and demand',
      'Market sentiment'
    ];

    return {
      totalForecasts,
      avgConfidence,
      highConfidenceForecasts,
      marketOutlook,
      keyDrivers
    };
  }
}

// Singleton instance
export const predictiveAnalytics = new PredictiveAnalytics();

// Export types
export type { ForecastConfig, PriceForecast, MarketForecast, InvestmentRecommendation, PredictiveResult };
