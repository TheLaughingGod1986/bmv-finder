import { adjustForInflation, getRecentAdjustedPrices } from './inflationAdjustment';
import { SoldPrice } from '../../types/sold-price';

export interface PriceIndicator {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  description: string;
}

/**
 * Calculate median price from an array of prices
 */
export function calculateMedian(prices: number[]): number | null {
  if (prices.length === 0) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}

/**
 * Get enhanced price indicator based on inflation-adjusted recent sales
 * @param price - The price to analyze
 * @param soldPrices - Array of all sold prices in the area
 * @param saleYear - The year of the sale being analyzed
 * @returns Price indicator with enhanced analysis
 */
export function getEnhancedPriceIndicator(
  price: number | null, 
  soldPrices: SoldPrice[], 
  saleYear?: number
): PriceIndicator {
  if (!price || soldPrices.length === 0) {
    return { 
      label: 'N/A', 
      color: 'gray', 
      bgColor: 'bg-gray-100', 
      textColor: 'text-gray-600', 
      icon: '',
      description: 'Insufficient data for price analysis'
    };
  }

  // Get recent sales (last 5 years) with inflation adjustment
  const recentAdjustedPrices = getRecentAdjustedPrices(soldPrices);
  
  // Use inflation-adjusted recent prices for median calculation, fallback to all prices
  const medianPrice = calculateMedian(recentAdjustedPrices.length > 0 ? recentAdjustedPrices : soldPrices.map(p => p.price));
  
  if (!medianPrice) {
    return { 
      label: 'N/A', 
      color: 'gray', 
      bgColor: 'bg-gray-100', 
      textColor: 'text-gray-600', 
      icon: '',
      description: 'Unable to calculate median price'
    };
  }

  // Adjust the current price for inflation if it's not from the current year
  const currentYear = new Date().getFullYear();
  const yearToUse = saleYear || currentYear;
  
  // Adjust price for inflation if it's not from current year
  const adjustedPrice = yearToUse < currentYear ? adjustForInflation(price, yearToUse) : price;
  
  const diff = (adjustedPrice - medianPrice) / medianPrice;
  
  if (diff <= -0.10) {
    return { 
      label: 'Excellent Deal', 
      color: 'green', 
      bgColor: 'bg-[#5DA271]', 
      textColor: 'text-white', 
      icon: '↓',
      description: '10%+ below inflation-adjusted median'
    };
  } else if (diff <= -0.05) {
    return { 
      label: 'Good Deal', 
      color: 'green', 
      bgColor: 'bg-green-100', 
      textColor: 'text-green-800', 
      icon: '↓',
      description: '5-10% below inflation-adjusted median'
    };
  } else if (diff >= 0.10) {
    return { 
      label: 'Overpriced', 
      color: 'red', 
      bgColor: 'bg-red-100', 
      textColor: 'text-red-800', 
      icon: '↑',
      description: '10%+ above inflation-adjusted median'
    };
  } else if (diff >= 0.05) {
    return { 
      label: 'Expensive', 
      color: 'orange', 
      bgColor: 'bg-orange-100', 
      textColor: 'text-orange-800', 
      icon: '↑',
      description: '5-10% above inflation-adjusted median'
    };
  } else {
    return { 
      label: 'Fair Price', 
      color: 'yellow', 
      bgColor: 'bg-yellow-100', 
      textColor: 'text-yellow-800', 
      icon: '→',
      description: 'Within 5% of inflation-adjusted median'
    };
  }
}

/**
 * Get price indicator legend data
 */
export function getPriceIndicatorLegend() {
  return [
    {
      label: 'Excellent Deal',
      bgColor: 'bg-[#5DA271]',
      textColor: 'text-white',
      icon: '↓',
      description: '10%+ below inflation-adjusted median'
    },
    {
      label: 'Good Deal',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: '↓',
      description: '5-10% below inflation-adjusted median'
    },
    {
      label: 'Fair Price',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: '→',
      description: 'Within 5% of inflation-adjusted median'
    },
    {
      label: 'Expensive',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      icon: '↑',
      description: '5-10% above inflation-adjusted median'
    },
    {
      label: 'Overpriced',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: '↑',
      description: '10%+ above inflation-adjusted median'
    }
  ];
} 