'use client';

import { PortfolioProperty, Portfolio } from '@/types/portfolio';

export interface PortfolioMetrics {
  totalValue: number;
  totalInvestment: number;
  totalGain: number;
  totalGainPercentage: number;
  annualizedReturn: number;
  currentYield: number;
  averageHoldingPeriod: number;
  propertiesCount: number;
  riskScore: number;
  diversificationScore: number;
}

export interface PropertyPerformance {
  propertyId: string;
  address: string;
  purchasePrice: number;
  currentValue: number;
  gain: number;
  gainPercentage: number;
  holdingPeriod: number;
  annualizedReturn: number;
  rentalYield?: number;
  bmvScore?: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PortfolioInsights {
  topPerformers: PropertyPerformance[];
  underPerformers: PropertyPerformance[];
  riskAnalysis: {
    concentrationRisk: number;
    locationRisk: number;
    marketRisk: number;
    overallRisk: 'low' | 'medium' | 'high';
  };
  marketComparison: {
    benchmarkReturn: number;
    portfolioReturn: number;
    outperformance: number;
    marketCorrelation: number;
  };
  recommendations: {
    type: 'buy' | 'sell' | 'hold' | 'diversify';
    message: string;
    priority: 'low' | 'medium' | 'high';
  }[];
  trends: {
    valueGrowth: number[];
    incomeGrowth: number[];
    timePeriod: string[];
  };
}

export interface BenchmarkData {
  name: string;
  return: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export class PortfolioAnalyticsEngine {
  private portfolio: Portfolio;
  private properties: PortfolioProperty[];

  constructor(portfolio: Portfolio, properties: PortfolioProperty[]) {
    this.portfolio = portfolio;
    this.properties = properties;
  }

  // Calculate comprehensive portfolio metrics
  calculateMetrics(): PortfolioMetrics {
    const totalInvestment = this.properties.reduce((sum, prop) => sum + (prop.purchasePrice || 0), 0);
    const totalValue = this.properties.reduce((sum, prop) => sum + (prop.currentValue || prop.purchasePrice || 0), 0);
    const totalGain = totalValue - totalInvestment;
    const totalGainPercentage = totalInvestment > 0 ? (totalGain / totalInvestment) * 100 : 0;

    // Calculate annualized return
    const averageHoldingPeriod = this.calculateAverageHoldingPeriod();
    const annualizedReturn = this.calculateAnnualizedReturn(totalGainPercentage, averageHoldingPeriod);

    // Calculate current yield (rental income / total value)
    const totalRentalIncome = this.properties.reduce((sum, prop) => sum + (prop.monthlyRent || 0) * 12, 0);
    const currentYield = totalValue > 0 ? (totalRentalIncome / totalValue) * 100 : 0;

    // Calculate risk and diversification scores
    const riskScore = this.calculateRiskScore();
    const diversificationScore = this.calculateDiversificationScore();

    return {
      totalValue,
      totalInvestment,
      totalGain,
      totalGainPercentage,
      annualizedReturn,
      currentYield,
      averageHoldingPeriod,
      propertiesCount: this.properties.length,
      riskScore,
      diversificationScore,
    };
  }

  // Calculate individual property performance
  calculatePropertyPerformance(): PropertyPerformance[] {
    return this.properties.map(property => {
      const purchasePrice = property.purchasePrice || 0;
      const currentValue = property.currentValue || purchasePrice;
      const gain = currentValue - purchasePrice;
      const gainPercentage = purchasePrice > 0 ? (gain / purchasePrice) * 100 : 0;
      
      const holdingPeriod = this.calculateHoldingPeriod(property.purchaseDate);
      const annualizedReturn = this.calculateAnnualizedReturn(gainPercentage, holdingPeriod);
      
      const rentalYield = property.monthlyRent && currentValue > 0 
        ? (property.monthlyRent * 12 / currentValue) * 100 
        : undefined;

      const riskLevel = this.calculatePropertyRiskLevel(property);

      return {
        propertyId: property.id,
        address: property.address,
        purchasePrice,
        currentValue,
        gain,
        gainPercentage,
        holdingPeriod,
        annualizedReturn,
        rentalYield,
        bmvScore: property.bmvScore,
        riskLevel,
      };
    });
  }

  // Generate comprehensive portfolio insights
  generateInsights(): PortfolioInsights {
    const propertyPerformance = this.calculatePropertyPerformance();
    const metrics = this.calculateMetrics();

    // Sort properties by performance
    const sortedByPerformance = [...propertyPerformance].sort((a, b) => b.gainPercentage - a.gainPercentage);
    const topPerformers = sortedByPerformance.slice(0, Math.min(3, sortedByPerformance.length));
    const underPerformers = sortedByPerformance.slice(-Math.min(3, sortedByPerformance.length));

    // Risk analysis
    const riskAnalysis = this.analyzeRisk();

    // Market comparison
    const marketComparison = this.compareToMarket(metrics.annualizedReturn);

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, riskAnalysis, propertyPerformance);

    // Calculate trends
    const trends = this.calculateTrends();

    return {
      topPerformers,
      underPerformers,
      riskAnalysis,
      marketComparison,
      recommendations,
      trends,
    };
  }

  // Calculate benchmark comparisons
  calculateBenchmarks(): BenchmarkData[] {
    const metrics = this.calculateMetrics();
    
    return [
      {
        name: 'UK Property Index',
        return: 6.2,
        volatility: 12.5,
        sharpeRatio: 0.5,
        maxDrawdown: -15.2,
      },
      {
        name: 'FTSE 100',
        return: 8.1,
        volatility: 18.3,
        sharpeRatio: 0.44,
        maxDrawdown: -25.8,
      },
      {
        name: 'UK Government Bonds',
        return: 2.8,
        volatility: 3.2,
        sharpeRatio: 0.88,
        maxDrawdown: -5.1,
      },
      {
        name: 'Your Portfolio',
        return: metrics.annualizedReturn,
        volatility: this.calculatePortfolioVolatility(),
        sharpeRatio: this.calculateSharpeRatio(metrics.annualizedReturn),
        maxDrawdown: this.calculateMaxDrawdown(),
      },
    ];
  }

  // Private helper methods
  private calculateAverageHoldingPeriod(): number {
    const totalDays = this.properties.reduce((sum, property) => {
      return sum + this.calculateHoldingPeriod(property.purchaseDate);
    }, 0);
    return this.properties.length > 0 ? totalDays / this.properties.length : 0;
  }

  private calculateHoldingPeriod(purchaseDate?: string): number {
    if (!purchaseDate) return 0;
    const purchase = new Date(purchaseDate);
    const now = new Date();
    return Math.floor((now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateAnnualizedReturn(totalReturn: number, holdingPeriodDays: number): number {
    if (holdingPeriodDays <= 0) return 0;
    const years = holdingPeriodDays / 365;
    return Math.pow(1 + totalReturn / 100, 1 / years) - 1;
  }

  private calculateRiskScore(): number {
    // Calculate risk based on property concentration, location diversity, and market exposure
    const concentrationRisk = this.calculateConcentrationRisk();
    const locationRisk = this.calculateLocationRisk();
    const marketRisk = this.calculateMarketRisk();
    
    return (concentrationRisk + locationRisk + marketRisk) / 3;
  }

  private calculateDiversificationScore(): number {
    // Calculate diversification based on property types, locations, and sizes
    const typeDiversity = this.calculateTypeDiversity();
    const locationDiversity = this.calculateLocationDiversity();
    const sizeDiversity = this.calculateSizeDiversity();
    
    return (typeDiversity + locationDiversity + sizeDiversity) / 3;
  }

  private calculateConcentrationRisk(): number {
    if (this.properties.length === 0) return 0;
    
    const totalValue = this.properties.reduce((sum, prop) => sum + (prop.currentValue || 0), 0);
    const maxPropertyValue = Math.max(...this.properties.map(prop => prop.currentValue || 0));
    
    return (maxPropertyValue / totalValue) * 100;
  }

  private calculateLocationRisk(): number {
    const locations = new Set(this.properties.map(prop => prop.postcode?.substring(0, 2)));
    const locationConcentration = this.properties.length / locations.size;
    
    return Math.min(locationConcentration * 20, 100);
  }

  private calculateMarketRisk(): number {
    // Simplified market risk calculation based on property types and regions
    const highRiskTypes = ['Flat', 'Apartment'];
    const highRiskCount = this.properties.filter(prop => 
      highRiskTypes.includes(prop.propertyType || '')
    ).length;
    
    return (highRiskCount / this.properties.length) * 100;
  }

  private calculateTypeDiversity(): number {
    const types = new Set(this.properties.map(prop => prop.propertyType));
    return Math.min((types.size / this.properties.length) * 100, 100);
  }

  private calculateLocationDiversity(): number {
    const postcodes = new Set(this.properties.map(prop => prop.postcode?.substring(0, 2)));
    return Math.min((postcodes.size / this.properties.length) * 100, 100);
  }

  private calculateSizeDiversity(): number {
    const sizes = this.properties.map(prop => prop.bedrooms || 0);
    const uniqueSizes = new Set(sizes);
    return Math.min((uniqueSizes.size / this.properties.length) * 100, 100);
  }

  private calculatePropertyRiskLevel(property: PortfolioProperty): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // Property type risk
    if (['Flat', 'Apartment'].includes(property.propertyType || '')) riskScore += 30;
    else if (['Detached', 'Semi-Detached'].includes(property.propertyType || '')) riskScore += 10;
    
    // Location risk (simplified)
    const postcode = property.postcode?.substring(0, 2);
    if (['E', 'N', 'W', 'SW', 'SE'].includes(postcode || '')) riskScore += 20; // London areas
    
    // Size risk
    if ((property.bedrooms || 0) < 2) riskScore += 20;
    
    if (riskScore >= 50) return 'high';
    if (riskScore >= 25) return 'medium';
    return 'low';
  }

  private analyzeRisk() {
    const concentrationRisk = this.calculateConcentrationRisk();
    const locationRisk = this.calculateLocationRisk();
    const marketRisk = this.calculateMarketRisk();
    
    const overallRisk = (concentrationRisk + locationRisk + marketRisk) / 3;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    if (overallRisk >= 60) riskLevel = 'high';
    else if (overallRisk >= 30) riskLevel = 'medium';
    
    return {
      concentrationRisk,
      locationRisk,
      marketRisk,
      overallRisk: riskLevel,
    };
  }

  private compareToMarket(portfolioReturn: number) {
    const benchmarkReturn = 6.2; // UK Property Index average
    const outperformance = portfolioReturn - benchmarkReturn;
    
    // Simplified correlation calculation
    const marketCorrelation = Math.min(Math.max(0.3 + (outperformance / 10), 0), 1);
    
    return {
      benchmarkReturn,
      portfolioReturn,
      outperformance,
      marketCorrelation,
    };
  }

  private generateRecommendations(
    metrics: PortfolioMetrics,
    riskAnalysis: any,
    propertyPerformance: PropertyPerformance[]
  ) {
    const recommendations = [];
    
    // Diversification recommendation
    if (metrics.diversificationScore < 50) {
      recommendations.push({
        type: 'diversify' as const,
        message: 'Consider diversifying your portfolio across different property types and locations',
        priority: 'high' as const,
      });
    }
    
    // Risk management
    if (riskAnalysis.overallRisk === 'high') {
      recommendations.push({
        type: 'hold' as const,
        message: 'High risk detected. Consider reducing concentration in high-risk areas',
        priority: 'high' as const,
      });
    }
    
    // Performance recommendations
    const underPerformers = propertyPerformance.filter(p => p.gainPercentage < 0);
    if (underPerformers.length > 0) {
      recommendations.push({
        type: 'sell' as const,
        message: `${underPerformers.length} properties are underperforming. Consider reviewing their potential`,
        priority: 'medium' as const,
      });
    }
    
    // Yield optimization
    if (metrics.currentYield < 4) {
      recommendations.push({
        type: 'buy' as const,
        message: 'Current yield is below market average. Consider properties with higher rental potential',
        priority: 'medium' as const,
      });
    }
    
    return recommendations;
  }

  private calculateTrends() {
    // Simplified trend calculation - in a real app, this would use historical data
    const months = 12;
    const valueGrowth = [];
    const incomeGrowth = [];
    const timePeriod = [];
    
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - 1 - i));
      
      // Simulate growth (in real app, use actual historical data)
      const growth = Math.random() * 2 - 1; // -1% to 1% monthly
      valueGrowth.push(growth);
      incomeGrowth.push(growth * 0.8); // Income grows slightly slower
      timePeriod.push(date.toISOString().substring(0, 7));
    }
    
    return {
      valueGrowth,
      incomeGrowth,
      timePeriod,
    };
  }

  private calculatePortfolioVolatility(): number {
    // Simplified volatility calculation
    return 15.0; // Placeholder - would calculate from historical returns
  }

  private calculateSharpeRatio(portfolioReturn: number): number {
    const riskFreeRate = 2.5; // UK 10-year bond yield
    const volatility = this.calculatePortfolioVolatility();
    return (portfolioReturn - riskFreeRate) / volatility;
  }

  private calculateMaxDrawdown(): number {
    // Simplified max drawdown calculation
    return -12.5; // Placeholder - would calculate from historical data
  }
}
