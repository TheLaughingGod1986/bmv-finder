import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatting functions moved to src/lib/formatters.ts

// Formatting functions moved to src/lib/formatters.ts

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
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
  const popularPostcodes = [
    'SW1A 1AA', // Buckingham Palace
    'SW1A 2AA', // 10 Downing Street
    'SW1A 0AA', // Houses of Parliament
    'W1A 1AA',  // BBC Broadcasting House
    'W1A 0AX',  // BBC Television Centre
    'EC1A 1BB', // St Paul's Cathedral
    'EC2A 4BX', // Old Street
    'E1 6AN',   // Brick Lane
    'SE1 9GF',  // London Eye
    'NW1 2DB',  // Camden Market
    'M1 1AA',   // Manchester City Centre
    'B1 1AA',   // Birmingham City Centre
    'L1 1AA',   // Liverpool City Centre
    'LS1 1AA',  // Leeds City Centre
    'S1 1AA',   // Sheffield City Centre
    'G1 1AA',   // Glasgow City Centre
    'EH1 1AA',  // Edinburgh City Centre
    'BS1 1AA',  // Bristol City Centre
    'CF1 1AA',  // Cardiff City Centre
    'NE1 1AA',  // Newcastle City Centre
  ];

  const queryLower = query.toLowerCase().trim();
  
  // If it looks like a postcode, suggest postcodes
  if (/^[a-z]{1,2}[0-9]/i.test(query)) {
    return popularPostcodes
      .filter(postcode => postcode.toLowerCase().includes(queryLower))
      .slice(0, 5);
  }
  
  // Otherwise suggest areas
  const areaSuggestions = popularAreas.filter(area => 
    area.toLowerCase().includes(queryLower)
  );
  
  return areaSuggestions.slice(0, 5);
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