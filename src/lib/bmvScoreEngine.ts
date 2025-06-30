import { SoldPrice } from '../../types/sold-price';

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
   * Calculate BMV score for a single property
   */
  static calculateBMVScore(property: SoldPrice, allProperties: SoldPrice[]): BMVScoreData {
    const postcodeMetrics = this.calculatePostcodeMetrics(property.postcode, allProperties);
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
  private static calculatePostcodeMetrics(postcode: string, allProperties: SoldPrice[]): PostcodeMetrics {
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

    // Area Growth Score (20% weight)
    const growthScore = areaGrowth > 10 ? 100 :
                       areaGrowth > 5 ? 80 :
                       areaGrowth > 0 ? 60 :
                       areaGrowth > -5 ? 40 : 20;
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
  static calculateHeatmapData(properties: SoldPrice[]): Array<{
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
      const metrics = this.calculatePostcodeMetrics(postcode, properties);
      const avgBMVScore = postcodeProperties.reduce((sum, p) => {
        const bmvData = this.calculateBMVScore(p, properties);
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