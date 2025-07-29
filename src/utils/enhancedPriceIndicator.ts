import { SoldPrice } from '../../types/sold-price';

export interface EnhancedPriceIndicator {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  marketTrend: 'rising' | 'falling' | 'stable';
  hpiAdjusted: boolean;
  comparablesCount: number;
  averagePrice: number;
  priceDifference: number;
  analysis: string[];
  // BMV information
  bmvCategory: 'above' | 'below' | 'neutral';
  bmvLabel: string;
  bmvColor: string;
  bmvBgColor: string;
  bmvTextColor: string;
  bmvIcon: string;
  bmvScore: number;
}

export interface HpiData {
  region: string;
  date: string;
  index: number;
  change?: number;
}

/**
 * Calculate HPI-adjusted price for a property
 */
function adjustPriceForHpi(
  originalPrice: number,
  saleDate: string,
  currentDate: string,
  hpiData: HpiData[]
): number {
  if (!hpiData || hpiData.length === 0) return originalPrice;
  
  // Find HPI values for sale date and current date
  const saleHpi = hpiData.find(h => h.date === saleDate);
  const currentHpi = hpiData.find(h => h.date === currentDate);
  
  if (!saleHpi || !currentHpi) return originalPrice;
  
  // Calculate HPI adjustment factor
  const hpiFactor = currentHpi.index / saleHpi.index;
  return originalPrice * hpiFactor;
}

/**
 * Determine market trend based on HPI data and recent sales patterns
 */
function determineMarketTrend(hpiData: HpiData[], recentSales?: SoldPrice[]): 'rising' | 'falling' | 'stable' {
  let hpiTrend: 'rising' | 'falling' | 'stable' = 'stable';
  let salesTrend: 'rising' | 'falling' | 'stable' = 'stable';
  
  // Analyze HPI data if available
  if (hpiData && hpiData.length >= 3) {
    const recentData = hpiData.slice(0, 3);
    const changes = recentData.map(h => h.change || 0);
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    
    if (avgChange > 0.5) hpiTrend = 'rising';
    else if (avgChange < -0.5) hpiTrend = 'falling';
  }
  
  // Analyze recent sales patterns if available
  if (recentSales && recentSales.length >= 5) {
    // Sort by date and get last 6 months of sales
    const sortedSales = recentSales
      .sort((a, b) => new Date(b.dateOfTransfer).getTime() - new Date(a.dateOfTransfer).getTime())
      .slice(0, 6);
    
    if (sortedSales.length >= 3) {
      const prices = sortedSales.map(s => s.price);
      const midPoint = Math.floor(prices.length / 2);
      const recentPrices = prices.slice(0, midPoint);
      const olderPrices = prices.slice(midPoint);
      
      const recentAvg = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
      const olderAvg = olderPrices.reduce((sum, price) => sum + price, 0) / olderPrices.length;
      
      const priceChange = (recentAvg - olderAvg) / olderAvg;
      
      if (priceChange > 0.02) salesTrend = 'rising'; // 2% increase
      else if (priceChange < -0.02) salesTrend = 'falling'; // 2% decrease
    }
  }
  
  // Combine HPI and sales trends
  if (hpiTrend === salesTrend) return hpiTrend;
  if (hpiTrend === 'stable') return salesTrend;
  if (salesTrend === 'stable') return hpiTrend;
  
  // If trends conflict, use HPI as primary indicator
  return hpiTrend;
}

/**
 * Get comparable properties with HPI adjustment
 */
function getComparableProperties(
  soldPrices: SoldPrice[],
  targetPropertyType: string,
  targetBedrooms?: number,
  hpiData?: HpiData[]
): SoldPrice[] {
  const currentDate = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  return soldPrices
    .filter(sale => {
      // Match property type
      if (sale.propertyType !== targetPropertyType) return false;
      
      // Match bedrooms if available (bedrooms data not available in current SoldPrice type)
      // if (targetBedrooms && sale.bedrooms && sale.bedrooms !== targetBedrooms) return false;
      
      // Include sales from last 24 months for better coverage
      const saleDate = new Date(sale.dateOfTransfer);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      
      return saleDate >= twoYearsAgo && sale.price > 0;
    })
    .map(sale => {
      // Adjust price for HPI if data available
      if (hpiData) {
        const adjustedPrice = adjustPriceForHpi(
          sale.price,
          sale.dateOfTransfer.slice(0, 7),
          currentDate,
          hpiData
        );
        return { ...sale, price: adjustedPrice };
      }
      return sale;
    })
    .sort((a, b) => new Date(b.dateOfTransfer).getTime() - new Date(a.dateOfTransfer).getTime())
    .slice(0, 10); // Take top 10 most recent
}

/**
 * Calculate BMV score (Below Market Value) - 1-10 scale
 * Higher score = better deal, lower score = overpriced
 */
function calculateBMVScore(
  currentPrice: number,
  marketAverage: number,
  comparablesCount: number,
  marketTrend: 'rising' | 'falling' | 'stable',
  hpiData?: HpiData[]
): number {
  if (comparablesCount === 0) return 5; // Neutral if no comparables
  
  // Base score from price comparison (50% weight)
  const priceRatio = currentPrice / marketAverage;
  let baseScore = 10;
  
  if (priceRatio <= 0.85) baseScore = 10; // 15%+ below market
  else if (priceRatio <= 0.90) baseScore = 9; // 10-15% below
  else if (priceRatio <= 0.95) baseScore = 8; // 5-10% below
  else if (priceRatio <= 1.00) baseScore = 7; // 0-5% below
  else if (priceRatio <= 1.05) baseScore = 6; // 0-5% above
  else if (priceRatio <= 1.10) baseScore = 5; // 5-10% above
  else if (priceRatio <= 1.15) baseScore = 4; // 10-15% above
  else if (priceRatio <= 1.20) baseScore = 3; // 15-20% above
  else baseScore = 2; // 20%+ above
  
  // Comparables confidence bonus (20% weight)
  let confidenceBonus = 0;
  if (comparablesCount >= 10) confidenceBonus = 2;
  else if (comparablesCount >= 5) confidenceBonus = 1;
  else if (comparablesCount >= 3) confidenceBonus = 0.5;
  
  // Market trend adjustment (20% weight)
  let trendAdjustment = 0;
  if (marketTrend === 'falling') {
    // In falling market, being below average is less impressive
    trendAdjustment = -0.5;
  } else if (marketTrend === 'rising') {
    // In rising market, being below average is more impressive
    trendAdjustment = 0.5;
  }
  
  // HPI adjustment bonus (10% weight)
  let hpiBonus = 0;
  if (hpiData && hpiData.length > 0) {
    hpiBonus = 0.5; // Bonus for using HPI-adjusted data
  }
  
  // Calculate final score
  const finalScore = Math.max(1, Math.min(10, 
    (baseScore * 0.5) + (confidenceBonus * 0.2) + (trendAdjustment * 0.2) + (hpiBonus * 0.1)
  ));
  
  return Math.round(finalScore * 10) / 10; // Round to 1 decimal place
}

/**
 * Generate comprehensive market analysis insights
 */
function generateMarketAnalysis(
  currentPrice: number,
  averagePrice: number,
  comparables: SoldPrice[],
  marketTrend: 'rising' | 'falling' | 'stable',
  hpiData?: HpiData[]
): string[] {
  const analysis: string[] = [];
  
  // Price comparison analysis
  const priceDiff = ((currentPrice - averagePrice) / averagePrice) * 100;
  if (priceDiff < -10) {
    analysis.push(`Property priced ${Math.abs(priceDiff).toFixed(1)}% below market average`);
  } else if (priceDiff > 10) {
    analysis.push(`Property priced ${priceDiff.toFixed(1)}% above market average`);
  } else {
    analysis.push(`Property priced close to market average (${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(1)}%)`);
  }
  
  // Market trend analysis
  if (marketTrend === 'rising') {
    analysis.push('Market showing upward trend - values expected to increase');
  } else if (marketTrend === 'falling') {
    analysis.push('Market showing downward trend - values may decrease');
  } else {
    analysis.push('Market showing stable trend - values expected to remain steady');
  }
  
  // Data confidence analysis
  if (comparables.length >= 10) {
    analysis.push(`High confidence analysis based on ${comparables.length} recent sales`);
  } else if (comparables.length >= 5) {
    analysis.push(`Good confidence analysis based on ${comparables.length} recent sales`);
  } else {
    analysis.push(`Limited data - analysis based on ${comparables.length} recent sales`);
  }
  
  // HPI adjustment analysis
  if (hpiData && hpiData.length > 0) {
    analysis.push('Analysis includes HPI adjustments for market inflation');
  }
  
  // Recent sales velocity
  const recentSales = comparables.filter(sale => {
    const saleDate = new Date(sale.dateOfTransfer);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return saleDate >= sixMonthsAgo;
  });
  
  if (recentSales.length >= 5) {
    analysis.push('High sales activity in the area (good liquidity)');
  } else if (recentSales.length >= 2) {
    analysis.push('Moderate sales activity in the area');
  } else {
    analysis.push('Low sales activity in the area (limited liquidity)');
  }
  
  return analysis;
}

/**
 * Calculate weighted average price with more weight to recent sales
 */
function calculateWeightedAverage(prices: number[], dates: string[]): number {
  if (prices.length === 0) return 0;
  
  const currentDate = new Date();
  const weights = dates.map(date => {
    const saleDate = new Date(date);
    const monthsAgo = (currentDate.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return Math.max(0.1, 1 - (monthsAgo * 0.1)); // More recent = higher weight
  });
  
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const weightedSum = prices.reduce((sum, price, index) => sum + (price * weights[index]), 0);
  
  return weightedSum / totalWeight;
}

/**
 * Enhanced price indicator with HPI adjustment and market trends
 */
export function getOptimizedPriceIndicator(
  price: number | null,
  soldPrices: SoldPrice[],
  propertyType: string,
  bedrooms?: number,
  hpiData?: HpiData[]
): EnhancedPriceIndicator {
  if (!price || soldPrices.length === 0) {
    return {
      label: 'N/A',
      color: 'gray',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      icon: '',
      description: 'Insufficient data for price analysis',
      confidence: 'low',
      marketTrend: 'stable',
      hpiAdjusted: false,
      comparablesCount: 0,
      averagePrice: 0,
      priceDifference: 0,
      analysis: ['No comparable sales data available']
    };
  }

  // Get comparable properties
  const comparables = getComparableProperties(soldPrices, propertyType, bedrooms, hpiData);
  
  if (comparables.length === 0) {
    return {
      label: 'N/A',
      color: 'gray',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      icon: '',
      description: 'No comparable properties found',
      confidence: 'low',
      marketTrend: 'stable',
      hpiAdjusted: false,
      comparablesCount: 0,
      averagePrice: 0,
      priceDifference: 0,
      analysis: ['No similar properties sold recently in this area']
    };
  }

  // Calculate weighted average price
  const prices = comparables.map(c => c.price);
  const dates = comparables.map(c => c.dateOfTransfer);
  const averagePrice = calculateWeightedAverage(prices, dates);
  
  // Determine market trend
  const marketTrend = determineMarketTrend(hpiData || [], soldPrices);
  
  // Calculate price difference
  const priceDifference = (price - averagePrice) / averagePrice;
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (comparables.length >= 5) confidence = 'high';
  else if (comparables.length >= 3) confidence = 'medium';
  
  // Adjust thresholds based on market trend
  let excellentThreshold = -0.10;
  let goodThreshold = -0.05;
  let expensiveThreshold = 0.05;
  let overpricedThreshold = 0.10;
  
  // Adjust thresholds for market conditions
  if (marketTrend === 'rising') {
    excellentThreshold = -0.08; // Easier to get excellent deals in rising market
    goodThreshold = -0.03;
    expensiveThreshold = 0.08; // Higher tolerance for expensive in rising market
    overpricedThreshold = 0.15;
  } else if (marketTrend === 'falling') {
    excellentThreshold = -0.12; // Harder to get excellent deals in falling market
    goodThreshold = -0.07;
    expensiveThreshold = 0.03; // Lower tolerance for expensive in falling market
    overpricedThreshold = 0.08;
  }
  
  // Calculate BMV score (Below Market Value)
  const bmvScore = calculateBMVScore(price, averagePrice, comparables.length, marketTrend, hpiData);
  
  // Generate market analysis insights
  const analysis = generateMarketAnalysis(price, averagePrice, comparables, marketTrend, hpiData);
  
  // Determine BMV category based on score
  let bmvCategory: 'above' | 'below' | 'neutral';
  let bmvLabel: string;
  let bmvColor: string;
  let bmvBgColor: string;
  let bmvTextColor: string;
  let bmvIcon: string;
  
  if (bmvScore >= 7) {
    bmvCategory = 'below';
    bmvLabel = 'Below Market Value';
    bmvColor = 'green';
    bmvBgColor = 'bg-green-100';
    bmvTextColor = 'text-green-800';
    bmvIcon = '↓';
  } else if (bmvScore <= 3) {
    bmvCategory = 'above';
    bmvLabel = 'Above Market Value';
    bmvColor = 'red';
    bmvBgColor = 'bg-red-100';
    bmvTextColor = 'text-red-800';
    bmvIcon = '↑';
  } else {
    bmvCategory = 'neutral';
    bmvLabel = 'Market Value';
    bmvColor = 'gray';
    bmvBgColor = 'bg-gray-100';
    bmvTextColor = 'text-gray-800';
    bmvIcon = '→';
  }
  
  // Determine detailed indicator
  let label: string;
  let color: string;
  let bgColor: string;
  let textColor: string;
  let icon: string;
  let description: string;
  
  if (priceDifference <= excellentThreshold) {
    label = 'Excellent Deal';
    color = 'green';
    bgColor = 'bg-[#5DA271]';
    textColor = 'text-white';
    icon = '💡';
    description = `${Math.abs(priceDifference * 100).toFixed(1)}% below market average`;

  } else if (priceDifference <= goodThreshold) {
    label = 'Good Deal';
    color = 'green';
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
    icon = '↓';
    description = `${Math.abs(priceDifference * 100).toFixed(1)}% below market average`;

  } else if (priceDifference >= overpricedThreshold) {
    label = 'Overpriced';
    color = 'red';
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
    icon = '↑';
    description = `${(priceDifference * 100).toFixed(1)}% above market average`;

  } else if (priceDifference >= expensiveThreshold) {
    label = 'Expensive';
    color = 'orange';
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-800';
    icon = '⚠️';
    description = `${(priceDifference * 100).toFixed(1)}% above market average`;

  } else {
    label = 'Fair Price';
    color = 'yellow';
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-800';
    icon = '→';
    description = `Within ${Math.abs(priceDifference * 100).toFixed(1)}% of market average`;

  }
  

  
  return {
    label,
    color,
    bgColor,
    textColor,
    icon,
    description,
    confidence,
    marketTrend,
    hpiAdjusted: hpiData !== undefined && hpiData.length > 0,
    comparablesCount: comparables.length,
    averagePrice: Math.round(averagePrice),
    priceDifference,
    analysis,
    // BMV information
    bmvCategory,
    bmvLabel,
    bmvColor,
    bmvBgColor,
    bmvTextColor,
    bmvIcon,
    bmvScore
  };
}

/**
 * Get enhanced price indicator legend with market context
 */
export function getEnhancedPriceIndicatorLegend(): Array<{
  label: string;
  bgColor: string;
  textColor: string;
  icon: string;
  description: string;
  marketContext: string;
}> {
  return [
    {
      label: 'Excellent Deal',
      bgColor: 'bg-[#5DA271]',
      textColor: 'text-white',
      icon: '💡',
      description: '8-12% below market average',
      marketContext: 'Best investment opportunities, often need renovation or have been on market longer'
    },
    {
      label: 'Good Deal',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: '↓',
      description: '3-8% below market average',
      marketContext: 'Good value compared to market, solid investment potential'
    },
    {
      label: 'Fair Price',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: '→',
      description: 'Within 3% of market average',
      marketContext: 'Priced appropriately for current market conditions'
    },
    {
      label: 'Expensive',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      icon: '⚠️',
      description: '3-10% above market average',
      marketContext: 'May have premium features or be in desirable location'
    },
    {
      label: 'Overpriced',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: '↑',
      description: '10%+ above market average',
      marketContext: 'Significantly overpriced, poor investment value'
    }
  ];
} 