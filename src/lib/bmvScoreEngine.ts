import { SoldPrice } from '../../types/sold-price';
import { CONFIG } from './config';

export interface BMVScoreData {
  bmvScore: number;
  marketValue: number;
  askingPrice: number;
  rentalYield: number;
  areaGrowth: number;
  postcodeYield: number;
  postcodeGrowth: number;
}

export interface PostcodeMetrics {
  averagePrice: number;
  priceGrowth: number;
  rentalYield: number;
  transactionCount: number;
  hpiData?: {
    currentIndex: number;
    yearOverYearGrowth: number;
    monthOverMonthGrowth: number;
    region: string;
    lastUpdated: string;
  };
}

export class BMVScoreEngine {
  private static readonly BMV_WEIGHTS = {
    priceVsMarket: 0.35,
    rentalYield: 0.25,
    areaGrowth: 0.20,
    propertyType: 0.15,
    transactionVolume: 0.05
  };

  private static readonly PROPERTY_TYPE_MULTIPLIERS = {
    'D': 1.2, // Detached
    'S': 1.1, // Semi-detached
    'T': 1.0, // Terraced
    'F': 0.9, // Flat
    'O': 0.8  // Other
  };

  /**
   * Calculate BMV score for a single property (with HPI data integration)
   */
  static async calculateBMVScore(property: SoldPrice, allProperties: SoldPrice[]): Promise<BMVScoreData> {
    const postcodeMetrics = await this.calculatePostcodeMetrics(property.postcode, allProperties);
    const marketValue = this.calculateMarketValue(property, postcodeMetrics);
    const askingPrice = this.estimateAskingPrice(property, marketValue);
    const rentalYield = this.calculateYield(property, askingPrice);
    const areaGrowth = postcodeMetrics.priceGrowth;
    const bmvScore = this.calculateScore(property, marketValue, askingPrice, rentalYield, areaGrowth, postcodeMetrics);

    return {
      bmvScore,
      marketValue,
      askingPrice,
      rentalYield,
      areaGrowth,
      postcodeYield: postcodeMetrics.rentalYield,
      postcodeGrowth: postcodeMetrics.priceGrowth
    };
  }

  /**
   * Calculate BMV score for a single property (synchronous fallback without HPI data)
   */
  static calculateBMVScoreSync(property: SoldPrice, allProperties: SoldPrice[]): BMVScoreData {
    const postcodeMetrics = this.calculatePostcodeMetricsSync(property.postcode, allProperties);
    const marketValue = this.calculateMarketValue(property, postcodeMetrics);
    const askingPrice = this.estimateAskingPrice(property, marketValue);
    const rentalYield = this.calculateYield(property, askingPrice);
    const areaGrowth = postcodeMetrics.priceGrowth;
    const bmvScore = this.calculateScore(property, marketValue, askingPrice, rentalYield, areaGrowth, postcodeMetrics);

    return {
      bmvScore,
      marketValue,
      askingPrice,
      rentalYield,
      areaGrowth,
      postcodeYield: postcodeMetrics.rentalYield,
      postcodeGrowth: postcodeMetrics.priceGrowth
    };
  }

  /**
   * Calculate market value based on comparable sales and area trends
   */
  private static calculateMarketValue(property: SoldPrice, postcodeMetrics: PostcodeMetrics): number {
    const baseValue = postcodeMetrics.averagePrice;
    const propertyTypeMultiplier = this.PROPERTY_TYPE_MULTIPLIERS[property.propertyType as keyof typeof this.PROPERTY_TYPE_MULTIPLIERS] || 1.0;
    
    // Adjust for property age (newer properties command premium)
    const ageMultiplier = property.old_new === 'Y' ? 1.1 : 1.0;
    
    // Adjust for tenure (freehold typically more valuable)
    const tenureMultiplier = property.duration === 'F' ? 1.05 : 1.0;
    
    return Math.round(baseValue * propertyTypeMultiplier * ageMultiplier * tenureMultiplier);
  }

  /**
   * Estimate asking price (typically 5-15% above market value)
   */
  private static estimateAskingPrice(property: SoldPrice, marketValue: number): number {
    const markupPercentage = 0.08 + (Math.random() * 0.07); // 8-15% markup
    return Math.round(marketValue * (1 + markupPercentage));
  }

  /**
   * Calculate rental yield based on estimated rent and asking price
   */
  private static calculateYield(property: SoldPrice, askingPrice: number): number {
    // Estimate monthly rent based on property type and location
    const estimatedMonthlyRent = this.estimateMonthlyRent(property);
    const annualRent = estimatedMonthlyRent * 12;
    return (annualRent / askingPrice) * 100;
  }

  /**
   * Estimate monthly rental value
   */
  private static estimateMonthlyRent(property: SoldPrice): number {
    const baseRentPerSqm = 12; // £12 per sqm per month (approximate UK average)
    const estimatedSqm = this.estimatePropertySize(property);
    return Math.round(baseRentPerSqm * estimatedSqm);
  }

  /**
   * Estimate property size based on type and price
   */
  private static estimatePropertySize(property: SoldPrice): number {
    const baseSizes = {
      'F': 65,  // Flat
      'T': 85,  // Terraced
      'S': 110, // Semi-detached
      'D': 140, // Detached
      'O': 100  // Other
    };
    
    const baseSize = baseSizes[property.propertyType as keyof typeof baseSizes] || 100;
    
    // Adjust based on price (more expensive = likely larger)
    const priceAdjustment = Math.min(property.price / 300000, 2); // Cap at 2x
    
    return Math.round(baseSize * priceAdjustment);
  }

  /**
   * Calculate postcode-level metrics
   */
  private static async calculatePostcodeMetrics(postcode: string, allProperties: SoldPrice[]): Promise<PostcodeMetrics> {
    const postcodeProperties = allProperties.filter(p => 
      p.postcode.replace(/\s/g, '').toUpperCase().startsWith(postcode.replace(/\s/g, '').toUpperCase())
    );

    if (postcodeProperties.length === 0) {
      return {
        averagePrice: 250000,
        priceGrowth: 0,
        rentalYield: 4.5,
        transactionCount: 0
      };
    }

    const prices = postcodeProperties.map(p => p.price);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Calculate price growth (comparing recent vs older sales)
    const recentSales = postcodeProperties
      .filter(p => new Date(p.dateOfTransfer) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      .map(p => p.price);
    
    const olderSales = postcodeProperties
      .filter(p => new Date(p.dateOfTransfer) <= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      .map(p => p.price);

    let priceGrowth = 0;
    if (recentSales.length > 0 && olderSales.length > 0) {
      const recentAvg = recentSales.reduce((sum, price) => sum + price, 0) / recentSales.length;
      const olderAvg = olderSales.reduce((sum, price) => sum + price, 0) / olderSales.length;
      priceGrowth = ((recentAvg - olderAvg) / olderAvg) * 100;
    }

    // Estimate yield for the area
    const estimatedRent = this.estimateMonthlyRent({ ...postcodeProperties[0], price: averagePrice }) * 12;
    const rentalYield = (estimatedRent / averagePrice) * 100;

    // Fetch HPI data for enhanced growth calculation
    let hpiData = undefined;
    try {
      hpiData = await this.fetchHPIData(postcode);
    } catch (error) {
      console.warn(`Failed to fetch HPI data for ${postcode}:`, error);
    }

    // Use HPI data if available, otherwise fall back to sales-based growth
    let enhancedPriceGrowth = priceGrowth;
    if (hpiData) {
      // Use year-over-year growth if available and non-zero, otherwise use month-over-month growth
      let hpiGrowth = 0;
      if (hpiData.yearOverYearGrowth !== undefined && hpiData.yearOverYearGrowth !== 0) {
        hpiGrowth = hpiData.yearOverYearGrowth;
      } else if (hpiData.monthOverMonthGrowth !== undefined && hpiData.monthOverMonthGrowth !== 0) {
        hpiGrowth = hpiData.monthOverMonthGrowth * 12; // Annualize monthly growth
      }
      
      if (hpiGrowth !== 0) {
        // Blend HPI data with sales data (70% HPI, 30% sales data for more accurate growth)
        enhancedPriceGrowth = (hpiGrowth * 0.7) + (priceGrowth * 0.3);
      }
    }

    return {
      averagePrice: Math.round(averagePrice),
      priceGrowth: Math.round(enhancedPriceGrowth * 100) / 100,
      rentalYield: Math.round(rentalYield * 100) / 100,
      transactionCount: postcodeProperties.length,
      hpiData
    };
  }

  /**
   * Fetch HPI data for a postcode
   */
  private static async fetchHPIData(postcode: string): Promise<PostcodeMetrics['hpiData']> {
    try {
      const baseUrl = CONFIG.API.BASE_URL;
      
      // First try postcode-level HPI data
      let response = await fetch(`${baseUrl}/api/hpi/postcode?postcode=${encodeURIComponent(postcode)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const latestData = data.results[0];
          return {
            currentIndex: latestData.index,
            yearOverYearGrowth: latestData.yearOverYear || 0,
            monthOverMonthGrowth: latestData.monthOverMonth || 0,
            region: latestData.region,
            lastUpdated: latestData.lastUpdated
          };
        }
      }
      
      // Fallback to region-level HPI data
      const region = this.getRegionFromPostcode(postcode);
      if (region && region !== 'United Kingdom') {
        response = await fetch(`${baseUrl}/api/hpi/postcode?region=${encodeURIComponent(region)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const latestData = data.results[0];
            return {
              currentIndex: latestData.index,
              yearOverYearGrowth: latestData.yearOverYear || 0,
              monthOverMonthGrowth: latestData.monthOverMonth || 0,
              region: latestData.region,
              lastUpdated: latestData.lastUpdated
            };
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching HPI data for ${postcode}:`, error);
    }
    return undefined;
  }

  /**
   * Get region from postcode
   */
  private static getRegionFromPostcode(postcode: string): string {
    if (!postcode || typeof postcode !== 'string') {
      return 'United Kingdom';
    }
    
    // Clean and normalize the postcode
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    
    // Simple region mapping for common postcode areas
    const regionMap: { [key: string]: string } = {
      'E': 'London', 'N': 'London', 'W': 'London', 'SW': 'London', 'SE': 'London', 'NW': 'London',
      'GU': 'South East', 'RG': 'South East', 'SL': 'South East', 'SO': 'South East', 'PO': 'South East',
      'BN': 'South East', 'TN': 'South East', 'CT': 'South East', 'ME': 'South East', 'DA': 'South East',
      'RH': 'South East', 'HP': 'South East', 'LU': 'South East', 'MK': 'South East', 'OX': 'South East',
      'BA': 'South West', 'BS': 'South West', 'DT': 'South West', 'EX': 'South West', 'GL': 'South West',
      'PL': 'South West', 'SN': 'South West', 'SP': 'South West', 'TA': 'South West', 'TQ': 'South West',
      'TR': 'South West', 'AL': 'East of England', 'CB': 'East of England', 'CM': 'East of England',
      'CO': 'East of England', 'IP': 'East of England', 'NR': 'East of England', 'SG': 'East of England',
      'SS': 'East of England', 'B': 'West Midlands', 'CV': 'West Midlands', 'DY': 'West Midlands',
      'HR': 'West Midlands', 'LE': 'West Midlands', 'NG': 'West Midlands', 'ST': 'West Midlands',
      'TF': 'West Midlands', 'WS': 'West Midlands', 'WV': 'West Midlands', 'DE': 'East Midlands',
      'DN': 'East Midlands', 'LN': 'East Midlands', 'PE': 'East Midlands', 'S': 'East Midlands',
      'BD': 'Yorkshire and The Humber', 'HD': 'Yorkshire and The Humber', 'HG': 'Yorkshire and The Humber',
      'HU': 'Yorkshire and The Humber', 'HX': 'Yorkshire and The Humber', 'LS': 'Yorkshire and The Humber',
      'WF': 'Yorkshire and The Humber', 'YO': 'Yorkshire and The Humber', 'BB': 'North West',
      'BL': 'North West', 'CA': 'North West', 'CH': 'North West', 'CW': 'North West', 'FY': 'North West',
      'L': 'North West', 'LA': 'North West', 'M': 'North West', 'OL': 'North West', 'PR': 'North West',
      'SK': 'North West', 'WA': 'North West', 'WN': 'North West', 'DH': 'North East', 'DL': 'North East',
      'NE': 'North East', 'SR': 'North East', 'TS': 'North East', 'CF': 'Wales', 'LD': 'Wales',
      'LL': 'Wales', 'NP': 'Wales', 'SA': 'Wales', 'SY': 'Wales', 'AB': 'Scotland', 'DD': 'Scotland',
      'DG': 'Scotland', 'EH': 'Scotland', 'FK': 'Scotland', 'G': 'Scotland', 'HS': 'Scotland',
      'IV': 'Scotland', 'KA': 'Scotland', 'KW': 'Scotland', 'KY': 'Scotland', 'ML': 'Scotland',
      'PA': 'Scotland', 'PH': 'Scotland', 'TD': 'Scotland', 'ZE': 'Scotland', 'BT': 'Northern Ireland'
    };
    
    // Try 2-letter prefixes first (more specific)
    for (const [prefix, region] of Object.entries(regionMap)) {
      if (prefix.length === 2 && cleanPostcode.startsWith(prefix)) {
        return region;
      }
    }
    
    // Try 1-letter prefixes
    const firstChar = cleanPostcode.charAt(0);
    if (regionMap[firstChar]) {
      return regionMap[firstChar];
    }
    
    // Default fallback
    return 'United Kingdom';
  }

  /**
   * Calculate postcode-level metrics (synchronous version without HPI data)
   */
  private static calculatePostcodeMetricsSync(postcode: string, allProperties: SoldPrice[]): PostcodeMetrics {
    const postcodeProperties = allProperties.filter(p => 
      p.postcode.replace(/\s/g, '').toUpperCase().startsWith(postcode.replace(/\s/g, '').toUpperCase())
    );

    if (postcodeProperties.length === 0) {
      return {
        averagePrice: 250000,
        priceGrowth: 0,
        rentalYield: 4.5,
        transactionCount: 0
      };
    }

    const prices = postcodeProperties.map(p => p.price);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Calculate price growth (comparing recent vs older sales)
    const recentSales = postcodeProperties
      .filter(p => new Date(p.dateOfTransfer) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      .map(p => p.price);
    
    const olderSales = postcodeProperties
      .filter(p => new Date(p.dateOfTransfer) <= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      .map(p => p.price);

    let priceGrowth = 0;
    if (recentSales.length > 0 && olderSales.length > 0) {
      const recentAvg = recentSales.reduce((sum, price) => sum + price, 0) / recentSales.length;
      const olderAvg = olderSales.reduce((sum, price) => sum + price, 0) / olderSales.length;
      priceGrowth = ((recentAvg - olderAvg) / olderAvg) * 100;
    }

    // Estimate yield for the area
    const estimatedRent = this.estimateMonthlyRent({ ...postcodeProperties[0], price: averagePrice }) * 12;
    const rentalYield = (estimatedRent / averagePrice) * 100;

    return {
      averagePrice: Math.round(averagePrice),
      priceGrowth: Math.round(priceGrowth * 100) / 100,
      rentalYield: Math.round(rentalYield * 100) / 100,
      transactionCount: postcodeProperties.length
    };
  }

  /**
   * Calculate overall BMV score (0-100)
   */
  private static calculateScore(
    property: SoldPrice,
    marketValue: number,
    askingPrice: number,
    rentalYield: number,
    areaGrowth: number,
    postcodeMetrics: PostcodeMetrics
  ): number {
    let score = 0;

    // Price vs Market Value (35% weight)
    const priceVsMarketRatio = property.price / marketValue;
    const priceScore = priceVsMarketRatio < 0.9 ? 100 : 
                      priceVsMarketRatio < 0.95 ? 80 :
                      priceVsMarketRatio < 1.0 ? 60 :
                      priceVsMarketRatio < 1.05 ? 40 :
                      priceVsMarketRatio < 1.1 ? 20 : 0;
    score += priceScore * this.BMV_WEIGHTS.priceVsMarket;

    // Yield Score (25% weight)
    const yieldScore = rentalYield > 8 ? 100 :
                      rentalYield > 6 ? 80 :
                      rentalYield > 4 ? 60 :
                      rentalYield > 2 ? 40 : 20;
    score += yieldScore * this.BMV_WEIGHTS.rentalYield;

    // Area Growth Score (20% weight) - Enhanced with HPI data
    let growthScore = areaGrowth > 10 ? 100 :
                     areaGrowth > 5 ? 80 :
                     areaGrowth > 0 ? 60 :
                     areaGrowth > -5 ? 40 : 20;
    
    // Bonus points for strong HPI growth
    if (postcodeMetrics.hpiData) {
      const hpiBonus = this.calculateHPIGrowthBonus(postcodeMetrics.hpiData);
      growthScore = Math.min(100, growthScore + hpiBonus);
    }
    
    score += growthScore * this.BMV_WEIGHTS.areaGrowth;

    // Property Type Score (15% weight)
    const typeScore = property.propertyType === 'T' ? 80 : // Terraced often good value
                     property.propertyType === 'S' ? 70 : // Semi-detached
                     property.propertyType === 'D' ? 60 : // Detached
                     property.propertyType === 'F' ? 50 : // Flat
                     40; // Other
    score += typeScore * this.BMV_WEIGHTS.propertyType;

    // Transaction Volume Score (5% weight)
    const volumeScore = postcodeMetrics.transactionCount > 20 ? 100 :
                       postcodeMetrics.transactionCount > 10 ? 80 :
                       postcodeMetrics.transactionCount > 5 ? 60 :
                       postcodeMetrics.transactionCount > 2 ? 40 : 20;
    score += volumeScore * this.BMV_WEIGHTS.transactionVolume;

    return Math.round(score);
  }

  /**
   * Calculate bonus points for strong HPI growth
   */
  private static calculateHPIGrowthBonus(hpiData: PostcodeMetrics['hpiData']): number {
    if (!hpiData) return 0;
    
    let bonus = 0;
    
    // Year-over-year growth bonus (up to 15 points)
    if (hpiData.yearOverYearGrowth > 10) {
      bonus += 15;
    } else if (hpiData.yearOverYearGrowth > 5) {
      bonus += 10;
    } else if (hpiData.yearOverYearGrowth > 0) {
      bonus += 5;
    }
    
    // Month-over-month growth bonus (up to 5 points)
    if (hpiData.monthOverMonthGrowth > 2) {
      bonus += 5;
    } else if (hpiData.monthOverMonthGrowth > 0) {
      bonus += 2;
    }
    
    return bonus;
  }

  /**
   * Get BMV score category and color
   */
  static getBMVCategory(score: number): { category: string; color: string; description: string } {
    if (score >= 80) {
      return {
        category: 'Excellent BMV',
        color: 'bg-green-500',
        description: 'Exceptional below market value opportunity with high yield potential'
      };
    } else if (score >= 65) {
      return {
        category: 'Good BMV',
        color: 'bg-blue-500',
        description: 'Good below market value opportunity with solid fundamentals'
      };
    } else if (score >= 50) {
      return {
        category: 'Fair Value',
        color: 'bg-yellow-500',
        description: 'Fairly priced with moderate investment potential'
      };
    } else if (score >= 35) {
      return {
        category: 'Overpriced',
        color: 'bg-orange-500',
        description: 'Above market value with limited investment appeal'
      };
    } else {
      return {
        category: 'Poor Value',
        color: 'bg-red-500',
        description: 'Significantly overpriced with poor investment potential'
      };
    }
  }

  /**
   * Calculate heatmap data for postcodes
   */
  static async calculateHeatmapData(properties: SoldPrice[]): Promise<Array<{
    postcode: string;
    rentalYield: number;
    growth: number;
    bmvScore: number;
    transactionCount: number;
    coordinates?: { lat: number; lng: number };
  }>> {
    const postcodeGroups = new Map<string, SoldPrice[]>();
    
    // Group properties by postcode
    properties.forEach(property => {
      const postcode = property.postcode.replace(/\s/g, '').toUpperCase();
      if (!postcodeGroups.has(postcode)) {
        postcodeGroups.set(postcode, []);
      }
      postcodeGroups.get(postcode)!.push(property);
    });

    const heatmapData = [];
    for (const [postcode, postcodeProperties] of postcodeGroups.entries()) {
      const metrics = await this.calculatePostcodeMetrics(postcode, properties);
      let totalBMVScore = 0;
      
      for (const property of postcodeProperties) {
        const bmvData = await this.calculateBMVScore(property, properties);
        totalBMVScore += bmvData.bmvScore;
      }
      
      const avgBMVScore = totalBMVScore / postcodeProperties.length;

      heatmapData.push({
        postcode,
        rentalYield: metrics.rentalYield,
        growth: metrics.priceGrowth,
        bmvScore: Math.round(avgBMVScore),
        transactionCount: metrics.transactionCount
      });
    }

    return heatmapData;
  }

  /**
   * Calculate heatmap data for postcodes (synchronous version without HPI data)
   */
  static calculateHeatmapDataSync(properties: SoldPrice[]): Array<{
    postcode: string;
    rentalYield: number;
    growth: number;
    bmvScore: number;
    transactionCount: number;
    coordinates?: { lat: number; lng: number };
  }> {
    const postcodeGroups = new Map<string, SoldPrice[]>();
    
    // Group properties by postcode
    properties.forEach(property => {
      const postcode = property.postcode.replace(/\s/g, '').toUpperCase();
      if (!postcodeGroups.has(postcode)) {
        postcodeGroups.set(postcode, []);
      }
      postcodeGroups.get(postcode)!.push(property);
    });

    return Array.from(postcodeGroups.entries()).map(([postcode, postcodeProperties]) => {
      const metrics = this.calculatePostcodeMetricsSync(postcode, properties);
      const avgBMVScore = postcodeProperties.reduce((sum, p) => {
        const bmvData = this.calculateBMVScoreSync(p, properties);
        return sum + bmvData.bmvScore;
      }, 0) / postcodeProperties.length;

      return {
        postcode,
        rentalYield: metrics.rentalYield,
        growth: metrics.priceGrowth,
        bmvScore: Math.round(avgBMVScore),
        transactionCount: metrics.transactionCount
      };
    });
  }
} 

// Predicts future property values and growth percentages
export function predictFutureValues(currentValue: number, annualGrowthRate: number) {
  const periods = [2, 5, 10];
  const results = {} as Record<string, { value: number, growth: number }>;
  for (const n of periods) {
    const value = currentValue * Math.pow(1 + annualGrowthRate, n);
    const growth = ((value / currentValue) - 1) * 100;
    results[n] = { value: Math.round(value), growth: parseFloat(growth.toFixed(1)) };
  }
  // High-growth badge: 5-year growth > 25%
  const highGrowth = results[5].growth > 25;
  return {
    now: Math.round(currentValue),
    ...results,
    highGrowth,
    explanation: `Future Value = Current Value × (1 + growth rate)^years. Growth rate used: ${(annualGrowthRate*100).toFixed(2)}% per year.`
  };
} 