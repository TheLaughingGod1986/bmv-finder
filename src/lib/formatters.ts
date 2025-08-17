/**
 * Centralized formatting utilities for the BMV Finder application
 * Consolidates duplicate formatting functions found across components
 */

/**
 * Format price as GBP currency
 */
export function formatPrice(price: number): string {
  // Force GBP locale and ensure pound symbol is displayed
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  
  // Ensure pound symbol is displayed (fallback if browser doesn't respect locale)
  if (!formatted.includes('£')) {
    return `£${price.toLocaleString('en-GB')}`;
  }
  
  return formatted;
}

/**
 * Format currency as GBP (alternative to formatPrice)
 */
export function formatCurrency(value: number): string {
  // Force GBP locale and ensure pound symbol is displayed
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  
  // Ensure pound symbol is displayed (fallback if browser doesn't respect locale)
  if (!formatted.includes('£')) {
    return `£${value.toLocaleString('en-GB')}`;
  }
  
  return formatted;
}

/**
 * Format percentage with specified decimal places
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date in British format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format date in short format (DD/MM/YYYY)
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format date for charts (DD/MM/YY)
 */
export function formatDateChart(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Get month name from month number
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
}

/**
 * Format number with thousands separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-GB').format(value);
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Format postcode consistently
 */
export function formatPostcode(postcode: string): string {
  if (!postcode) return '';
  // Remove spaces and convert to uppercase
  const clean = postcode.replace(/\s+/g, '').toUpperCase();
  // Add space before last 3 characters if not present
  if (clean.length > 3 && !clean.includes(' ')) {
    return clean.slice(0, -3) + ' ' + clean.slice(-3);
  }
  return clean;
}
