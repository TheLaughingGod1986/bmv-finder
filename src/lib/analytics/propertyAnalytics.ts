import { auditLogger } from '../audit/auditLogger';

export interface PropertyAnalyticsData {
  property: {
    id: string;
    address: string;
    postcode: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    price: number;
    area: number;
    yearBuilt?: number;
  };
  market: {
    localAveragePrice: number;
    regionalAveragePrice: number;
    nationalAveragePrice: number;
    pricePerSqFt: number;
    marketTrend: 'rising' | 'falling' | 'stable';
    marketVelocity: number;
  };
  investment: {
    rentalYield: number;
    capitalGrowth: number;
    totalReturn: number;
    riskScore: number;
    investmentGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  };
  location: {
    walkScore: number;
    transportScore: number;
    amenityScore: number;
    schoolScore: number;
    crimeScore: number;
    overallLocationScore: number;
  };
  comparables: {
    similarProperties: Array<{
      address: string;
      price: number;
      bedrooms: number;
      soldDate: string;
      pricePerSqFt: number;
    }>;
    averageComparablePrice: number;
    priceVariance: number;
  };
  predictions: {
    oneYearForecast: {
      price: number;
      confidence: number;
      factors: string[];
    };
    fiveYearForecast: {
      price: number;
      confidence: number;
      factors: string[];
    };
    rentalForecast: {
      monthlyRent: number;
      annualYield: number;
      confidence: number;
    };
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    recommendations: string[];
  };
}

export interface MarketIntelligenceData {
  region: string;
  postcode: string;
  marketOverview: {
    totalListings: number;
    averageDaysOnMarket: number;
    priceReductionRate: number;
    marketActivity: 'hot' | 'warm' | 'cool' | 'cold';
    supplyDemandRatio: number;
  };
  priceAnalysis: {
    currentMedianPrice: number;
    priceChange1Month: number;
    priceChange3Months: number;
    priceChange1Year: number;
    priceVolatility: number;
    priceMomentum: 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down';
  };
  salesActivity: {
    totalSales: number;
    salesVolume: number;
    averageSalePrice: number;
    salesVelocity: number;
    newListings: number;
    withdrawnListings: number;
  };
  demographics: {
    averageAge: number;
    averageIncome: number;
    populationGrowth: number;
    employmentRate: number;
    educationLevel: number;
  };
  infrastructure: {
    transportLinks: number;
    schools: number;
    healthcare: number;
    shopping: number;
    recreation: number;
    overallInfrastructureScore: number;
  };
  trends: {
    emergingTrends: string[];
    marketDrivers: string[];
    riskFactors: string[];
    opportunities: string[];
  };
}

export class PropertyAnalyticsEngine {
  private static instance: PropertyAnalyticsEngine;
  private analyticsCache = new Map<string, { data: PropertyAnalyticsData; timestamp: number }>();
  private marketIntelligenceCache = new Map<string, { data: MarketIntelligenceData; timestamp: number }>();

  private constructor() {
    this.startCacheCleanup();
  }

  public static getInstance(): PropertyAnalyticsEngine {
    if (!PropertyAnalyticsEngine.instance) {
      PropertyAnalyticsEngine.instance = new PropertyAnalyticsEngine();
    }
    return PropertyAnalyticsEngine.instance;
  }

  // Generate comprehensive property analytics
  async generatePropertyAnalytics(
    propertyData: any,
    postcode: string,
    userId?: string
  ): Promise<PropertyAnalyticsData> {
    const cacheKey = `property_${propertyData.id || postcode}`;
    const cached = this.analyticsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 minutes cache
      return cached.data;
    }

    try {
      const analytics: PropertyAnalyticsData = {
        property: {
          id: propertyData.id || crypto.randomUUID(),
          address: propertyData.address || '',
          postcode: postcode,
          propertyType: propertyData.propertyType || 'Unknown',
          bedrooms: propertyData.bedrooms || 0,
          bathrooms: propertyData.bathrooms || 0,
          price: propertyData.price || 0,
          area: propertyData.area || 0,
          yearBuilt: propertyData.yearBuilt
        },
        market: await this.analyzeMarketData(propertyData, postcode),
        investment: await this.analyzeInvestmentMetrics(propertyData, postcode),
        location: await this.analyzeLocationMetrics(postcode),
        comparables: await this.findComparableProperties(propertyData, postcode),
        predictions: await this.generatePredictions(propertyData, postcode),
        insights: await this.generateInsights(propertyData, postcode)
      };

      // Cache the results
      this.analyticsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      // Log analytics generation
      if (userId) {
        await auditLogger.logUserAction('property_analytics_generated', {
          propertyId: analytics.property.id,
          postcode: postcode,
          analyticsType: 'comprehensive'
        }, userId);
      }

      return analytics;
    } catch (error) {
      console.error('Error generating property analytics:', error);
      throw error;
    }
  }

  // Generate market intelligence data
  async generateMarketIntelligence(
    postcode: string,
    region: string,
    userId?: string
  ): Promise<MarketIntelligenceData> {
    const cacheKey = `market_${postcode}_${region}`;
    const cached = this.marketIntelligenceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) { // 1 hour cache
      return cached.data;
    }

    try {
      const intelligence: MarketIntelligenceData = {
        region,
        postcode,
        marketOverview: await this.analyzeMarketOverview(postcode, region),
        priceAnalysis: await this.analyzePriceTrends(postcode, region),
        salesActivity: await this.analyzeSalesActivity(postcode, region),
        demographics: await this.analyzeDemographics(postcode, region),
        infrastructure: await this.analyzeInfrastructure(postcode, region),
        trends: await this.identifyMarketTrends(postcode, region)
      };

      // Cache the results
      this.marketIntelligenceCache.set(cacheKey, {
        data: intelligence,
        timestamp: Date.now()
      });

      // Log market intelligence generation
      if (userId) {
        await auditLogger.logUserAction('market_intelligence_generated', {
          postcode: postcode,
          region: region,
          intelligenceType: 'comprehensive'
        }, userId);
      }

      return intelligence;
    } catch (error) {
      console.error('Error generating market intelligence:', error);
      throw error;
    }
  }

  // Private helper methods
  private async analyzeMarketData(propertyData: any, postcode: string) {
    // Mock market analysis - in production, this would use real data
    const basePrice = propertyData.price || 250000;
    const region = this.getRegionFromPostcode(postcode);
    
    return {
      localAveragePrice: basePrice * (0.9 + Math.random() * 0.2),
      regionalAveragePrice: basePrice * (0.85 + Math.random() * 0.3),
      nationalAveragePrice: 250000,
      pricePerSqFt: basePrice / (propertyData.area || 1000),
      marketTrend: this.getRandomMarketTrend(),
      marketVelocity: Math.random() * 100
    };
  }

  private async analyzeInvestmentMetrics(propertyData: any, postcode: string) {
    const basePrice = propertyData.price || 250000;
    const rentalYield = 3 + Math.random() * 4; // 3-7% yield
    const capitalGrowth = 1 + Math.random() * 6; // 1-7% growth
    const totalReturn = rentalYield + capitalGrowth;
    const riskScore = Math.random() * 100;
    
    return {
      rentalYield,
      capitalGrowth,
      totalReturn,
      riskScore,
      investmentGrade: this.calculateInvestmentGrade(totalReturn, riskScore)
    };
  }

  private async analyzeLocationMetrics(postcode: string) {
    // Mock location analysis
    return {
      walkScore: Math.floor(Math.random() * 100),
      transportScore: Math.floor(Math.random() * 100),
      amenityScore: Math.floor(Math.random() * 100),
      schoolScore: Math.floor(Math.random() * 100),
      crimeScore: Math.floor(Math.random() * 100),
      overallLocationScore: Math.floor(Math.random() * 100)
    };
  }

  private async findComparableProperties(propertyData: any, postcode: string) {
    // Mock comparable properties
    const comparables = Array.from({ length: 5 }, (_, i) => ({
      address: `${i + 1} Example Street, ${postcode}`,
      price: (propertyData.price || 250000) * (0.8 + Math.random() * 0.4),
      bedrooms: propertyData.bedrooms || 3,
      soldDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      pricePerSqFt: Math.random() * 500 + 200
    }));

    const averagePrice = comparables.reduce((sum, comp) => sum + comp.price, 0) / comparables.length;
    const priceVariance = ((propertyData.price || 250000) - averagePrice) / averagePrice * 100;

    return {
      similarProperties: comparables,
      averageComparablePrice: averagePrice,
      priceVariance
    };
  }

  private async generatePredictions(propertyData: any, postcode: string) {
    const basePrice = propertyData.price || 250000;
    const growthRate = 0.02 + Math.random() * 0.06; // 2-8% annual growth

    return {
      oneYearForecast: {
        price: basePrice * (1 + growthRate),
        confidence: 70 + Math.random() * 20,
        factors: ['Market trends', 'Local development', 'Economic indicators']
      },
      fiveYearForecast: {
        price: basePrice * Math.pow(1 + growthRate, 5),
        confidence: 50 + Math.random() * 30,
        factors: ['Long-term market trends', 'Infrastructure development', 'Demographic changes']
      },
      rentalForecast: {
        monthlyRent: basePrice * 0.004 * (0.8 + Math.random() * 0.4),
        annualYield: 3 + Math.random() * 4,
        confidence: 60 + Math.random() * 25
      }
    };
  }

  private async generateInsights(propertyData: any, postcode: string) {
    const insights = {
      strengths: [
        'Good transport links',
        'Growing local economy',
        'Strong rental demand'
      ],
      weaknesses: [
        'Limited parking',
        'Older property',
        'Higher crime rate'
      ],
      opportunities: [
        'Development potential',
        'Rental market growth',
        'Infrastructure improvements'
      ],
      threats: [
        'Market volatility',
        'Interest rate changes',
        'Economic uncertainty'
      ],
      recommendations: [
        'Consider rental investment',
        'Monitor market trends',
        'Evaluate renovation potential'
      ]
    };

    return insights;
  }

  private async analyzeMarketOverview(postcode: string, region: string) {
    return {
      totalListings: Math.floor(Math.random() * 100) + 50,
      averageDaysOnMarket: Math.floor(Math.random() * 60) + 30,
      priceReductionRate: Math.random() * 20,
      marketActivity: this.getRandomMarketActivity(),
      supplyDemandRatio: 0.5 + Math.random() * 1.5
    };
  }

  private async analyzePriceTrends(postcode: string, region: string) {
    const basePrice = 250000;
    const change1Month = (Math.random() - 0.5) * 5;
    const change3Months = (Math.random() - 0.5) * 10;
    const change1Year = (Math.random() - 0.5) * 20;

    return {
      currentMedianPrice: basePrice * (0.8 + Math.random() * 0.4),
      priceChange1Month: change1Month,
      priceChange3Months: change3Months,
      priceChange1Year: change1Year,
      priceVolatility: Math.random() * 30,
      priceMomentum: this.getPriceMomentum(change1Year)
    };
  }

  private async analyzeSalesActivity(postcode: string, region: string) {
    return {
      totalSales: Math.floor(Math.random() * 50) + 20,
      salesVolume: Math.random() * 10000000 + 5000000,
      averageSalePrice: 250000 * (0.8 + Math.random() * 0.4),
      salesVelocity: Math.random() * 100,
      newListings: Math.floor(Math.random() * 30) + 10,
      withdrawnListings: Math.floor(Math.random() * 10) + 5
    };
  }

  private async analyzeDemographics(postcode: string, region: string) {
    return {
      averageAge: 30 + Math.random() * 20,
      averageIncome: 30000 + Math.random() * 40000,
      populationGrowth: (Math.random() - 0.5) * 10,
      employmentRate: 80 + Math.random() * 15,
      educationLevel: 60 + Math.random() * 30
    };
  }

  private async analyzeInfrastructure(postcode: string, region: string) {
    const transportLinks = Math.floor(Math.random() * 100);
    const schools = Math.floor(Math.random() * 100);
    const healthcare = Math.floor(Math.random() * 100);
    const shopping = Math.floor(Math.random() * 100);
    const recreation = Math.floor(Math.random() * 100);
    const overallScore = (transportLinks + schools + healthcare + shopping + recreation) / 5;

    return {
      transportLinks,
      schools,
      healthcare,
      shopping,
      recreation,
      overallInfrastructureScore: overallScore
    };
  }

  private async identifyMarketTrends(postcode: string, region: string) {
    return {
      emergingTrends: [
        'Increased remote working',
        'Sustainability focus',
        'Smart home technology'
      ],
      marketDrivers: [
        'Population growth',
        'Infrastructure investment',
        'Economic development'
      ],
      riskFactors: [
        'Interest rate changes',
        'Economic uncertainty',
        'Regulatory changes'
      ],
      opportunities: [
        'Development potential',
        'Rental market growth',
        'Technology integration'
      ]
    };
  }

  // Utility methods
  private getRegionFromPostcode(postcode: string): string {
    const regionMap: Record<string, string> = {
      'E': 'London',
      'SW': 'London',
      'SE': 'London',
      'N': 'London',
      'W': 'London',
      'NW': 'London',
      'NE': 'North East',
      'M': 'North West',
      'L': 'North West',
      'B': 'West Midlands',
      'CV': 'West Midlands',
      'LE': 'East Midlands',
      'NG': 'East Midlands',
      'CB': 'East of England',
      'IP': 'East of England',
      'GU': 'South East',
      'PO': 'South East',
      'RG': 'South East',
      'SL': 'South East',
      'SO': 'South East',
      'TN': 'South East',
      'BH': 'South West',
      'BS': 'South West',
      'DT': 'South West',
      'EX': 'South West',
      'GL': 'South West',
      'PL': 'South West',
      'SN': 'South West',
      'TA': 'South West',
      'TR': 'South West',
      'YO': 'Yorkshire and The Humber',
      'LS': 'Yorkshire and The Humber',
      'BD': 'Yorkshire and The Humber',
      'HD': 'Yorkshire and The Humber',
      'HX': 'Yorkshire and The Humber',
      'HU': 'Yorkshire and The Humber',
      'WF': 'Yorkshire and The Humber'
    };

    const prefix = postcode.substring(0, 2).toUpperCase();
    return regionMap[prefix] || 'Unknown';
  }

  private getRandomMarketTrend(): 'rising' | 'falling' | 'stable' {
    const trends = ['rising', 'falling', 'stable'];
    return trends[Math.floor(Math.random() * trends.length)] as 'rising' | 'falling' | 'stable';
  }

  private getRandomMarketActivity(): 'hot' | 'warm' | 'cool' | 'cold' {
    const activities = ['hot', 'warm', 'cool', 'cold'];
    return activities[Math.floor(Math.random() * activities.length)] as 'hot' | 'warm' | 'cool' | 'cold';
  }

  private getPriceMomentum(change1Year: number): 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down' {
    if (change1Year > 10) return 'strong_up';
    if (change1Year > 2) return 'up';
    if (change1Year < -10) return 'strong_down';
    if (change1Year < -2) return 'down';
    return 'neutral';
  }

  private calculateInvestmentGrade(totalReturn: number, riskScore: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' {
    const score = (totalReturn * 10) - (riskScore * 0.1);
    
    if (score >= 80) return 'A+';
    if (score >= 70) return 'A';
    if (score >= 60) return 'B+';
    if (score >= 50) return 'B';
    if (score >= 40) return 'C+';
    if (score >= 30) return 'C';
    return 'D';
  }

  private startCacheCleanup(): void {
    // Clean up cache every hour
    setInterval(() => {
      const now = Date.now();
      
      // Clean property analytics cache (30 minutes TTL)
      for (const [key, cached] of this.analyticsCache) {
        if (now - cached.timestamp > 30 * 60 * 1000) {
          this.analyticsCache.delete(key);
        }
      }
      
      // Clean market intelligence cache (1 hour TTL)
      for (const [key, cached] of this.marketIntelligenceCache) {
        if (now - cached.timestamp > 60 * 60 * 1000) {
          this.marketIntelligenceCache.delete(key);
        }
      }
    }, 60 * 60 * 1000);
  }
}

// Export singleton instance
export const propertyAnalyticsEngine = PropertyAnalyticsEngine.getInstance();
