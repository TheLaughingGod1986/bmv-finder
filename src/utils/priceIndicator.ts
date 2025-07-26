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
 * Calculate average price from an array of prices
 */
export function calculateAverage(prices: number[]): number | null {
  if (prices.length === 0) return null;
  const sum = prices.reduce((total, price) => total + price, 0);
  return sum / prices.length;
}

/**
 * Get simplified price indicator based on 24-month average
 * @param price - The price to analyze
 * @param soldPrices - Array of all sold prices in the area
 * @returns Price indicator with simple analysis
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

  // Get sales from last 24 months
  const currentDate = new Date();
  const twentyFourMonthsAgo = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
  
  const recentPrices = soldPrices
    .filter(sale => {
      const saleDate = new Date(sale.dateOfTransfer);
      return saleDate >= twentyFourMonthsAgo;
    })
    .map(sale => sale.price)
    .filter(price => price > 0);
  
  // Use recent prices for average calculation, fallback to all prices if no recent data
  const averagePrice = calculateAverage(recentPrices.length > 0 ? recentPrices : soldPrices.map(p => p.price));
  
  if (!averagePrice) {
    return { 
      label: 'N/A', 
      color: 'gray', 
      bgColor: 'bg-gray-100', 
      textColor: 'text-gray-600', 
      icon: '',
      description: 'Unable to calculate average price'
    };
  }

  const diff = (price - averagePrice) / averagePrice;
  
  if (diff <= -0.10) {
    return { 
      label: 'Excellent Deal', 
      color: 'green', 
      bgColor: 'bg-[#5DA271]', 
      textColor: 'text-white', 
      icon: '↓',
      description: '10%+ below 24-month average'
    };
  } else if (diff <= -0.05) {
    return { 
      label: 'Good Deal', 
      color: 'green', 
      bgColor: 'bg-green-100', 
      textColor: 'text-green-800', 
      icon: '↓',
      description: '5-10% below 24-month average'
    };
  } else if (diff >= 0.10) {
    return { 
      label: 'Overpriced', 
      color: 'red', 
      bgColor: 'bg-red-100', 
      textColor: 'text-red-800', 
      icon: '↑',
      description: '10%+ above 24-month average'
    };
  } else if (diff >= 0.05) {
    return { 
      label: 'Expensive', 
      color: 'orange', 
      bgColor: 'bg-orange-100', 
      textColor: 'text-orange-800', 
      icon: '↑',
      description: '5-10% above 24-month average'
    };
  } else {
    return { 
      label: 'Fair Price', 
      color: 'yellow', 
      bgColor: 'bg-yellow-100', 
      textColor: 'text-yellow-800', 
      icon: '→',
      description: 'Within 5% of 24-month average'
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
      description: '10%+ below 24-month average'
    },
    {
      label: 'Good Deal',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: '↓',
      description: '5-10% below 24-month average'
    },
    {
      label: 'Fair Price',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: '→',
      description: 'Within 5% of 24-month average'
    },
    {
      label: 'Expensive',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      icon: '↑',
      description: '5-10% above 24-month average'
    },
    {
      label: 'Overpriced',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: '↑',
      description: '10%+ above 24-month average'
    }
  ];
} 