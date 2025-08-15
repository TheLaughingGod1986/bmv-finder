// UK Inflation Data (CPI) - Annual averages
// Source: Office for National Statistics (ONS)
const INFLATION_DATA: { [year: number]: number } = {
  1995: 1.8,
  1996: 2.4,
  1997: 1.8,
  1998: 1.6,
  1999: 1.3,
  2000: 0.8,
  2001: 1.2,
  2002: 1.3,
  2003: 1.4,
  2004: 1.3,
  2005: 2.1,
  2006: 2.3,
  2007: 2.3,
  2008: 3.6,
  2009: 2.2,
  2010: 3.3,
  2011: 4.5,
  2012: 2.8,
  2013: 2.6,
  2014: 1.5,
  2015: 0.0,
  2016: 0.7,
  2017: 2.7,
  2018: 2.5,
  2019: 1.8,
  2020: 0.9,
  2021: 2.6,
  2022: 9.1,
  2023: 6.7,
  2024: 3.2, // Estimate for 2024
  2025: 2.0, // Estimate for 2025
};

/**
 * Adjust a price for inflation from a given year to the current year (2025)
 * @param price - The original price
 * @param year - The year of the original price
 * @returns The inflation-adjusted price
 */
export function adjustForInflation(price: number, year: number): number {
  if (year >= 2025) return price;
  
  let adjustedPrice = price;
  let currentYear = year;
  
  // Apply inflation year by year from the original year to 2025
  while (currentYear < 2025) {
    const inflationRate = INFLATION_DATA[currentYear] || 2.0; // Default to 2% if no data
    adjustedPrice = adjustedPrice * (1 + inflationRate / 100);
    currentYear++;
  }
  
  return Math.round(adjustedPrice);
}

/**
 * Get the current year (2025) for inflation calculations
 */
export function getCurrentYear(): number {
  return 2025;
}

/**
 * Check if a date is within the last 5 years
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns boolean indicating if the date is within last 5 years
 */
export function isWithinLast5Years(dateString: string): boolean {
  const date = new Date(dateString);
  const currentYear = getCurrentYear();
  const year = date.getFullYear();
  return year >= currentYear - 5;
}

/**
 * Filter and adjust prices for recent sales (last 5 years) with inflation adjustment
 * @param soldPrices - Array of sold price objects
 * @returns Array of prices adjusted for inflation, only including last 5 years
 */
export function getRecentAdjustedPrices(soldPrices: Array<{ price: number; dateOfTransfer: string }>): number[] {
  const currentYear = getCurrentYear();
  
  return soldPrices
    .filter(sale => {
      const saleYear = new Date(sale.dateOfTransfer).getFullYear();
      return saleYear >= currentYear - 5;
    })
    .map(sale => {
      const saleYear = new Date(sale.dateOfTransfer).getFullYear();
      return adjustForInflation(sale.price, saleYear);
    })
    .filter(price => !isNaN(price) && price > 0);
} 