import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function getPropertyTypeIcon(type: string): string {
  const icons = {
    'D': '🏠', // Detached
    'S': '🏡', // Semi-detached
    'T': '🏘️', // Terraced
    'F': '🏢', // Flat/Maisonette
    'O': '🏭', // Other
  };
  return icons[type as keyof typeof icons] || '🏠';
}

export function getPropertyTypeLabel(type: string): string {
  const labels = {
    'D': 'Detached',
    'S': 'Semi-detached',
    'T': 'Terraced',
    'F': 'Flat/Maisonette',
    'O': 'Other',
  };
  return labels[type as keyof typeof labels] || type;
}

export function getDurationLabel(duration: string): string {
  return duration === 'F' ? 'Freehold' : 'Leasehold';
}

export function validatePostcode(postcode: string): boolean {
  // Accept both partial and full UK postcodes
  const ukPartialOrFullPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?([ ]?[0-9][A-Z]{2})?$/i;
  return ukPartialOrFullPostcodeRegex.test(postcode.trim());
}

export function getPopularAreas(): string[] {
  return [
    'London',
    'Manchester',
    'Birmingham',
    'Leeds',
    'Liverpool',
    'Sheffield',
    'Glasgow',
    'Edinburgh',
    'Bristol',
    'Cardiff',
    'Newcastle',
    'Belfast',
    'Brighton',
    'Oxford',
    'Cambridge',
    'Bath',
    'York',
    'Chester',
    'Stratford-upon-Avon',
    'Canterbury'
  ];
}

export function getSearchSuggestions(query: string): string[] {
  const popularAreas = getPopularAreas();
  const suggestions = popularAreas.filter(area => 
    area.toLowerCase().includes(query.toLowerCase())
  );
  return suggestions.slice(0, 5);
}

export function calculatePriceChange(oldPrice: number, newPrice: number): {
  change: number;
  percentage: number;
  isIncrease: boolean;
} {
  const change = newPrice - oldPrice;
  const percentage = (change / oldPrice) * 100;
  return {
    change,
    percentage: Math.abs(percentage),
    isIncrease: change > 0,
  };
}

export function getPriceRangeColor(price: number, minPrice: number, maxPrice: number): string {
  const range = maxPrice - minPrice;
  const position = (price - minPrice) / range;
  
  if (position < 0.33) return 'text-green-600';
  if (position < 0.66) return 'text-yellow-600';
  return 'text-red-600';
}

export function generateSkeletonArray(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
} 