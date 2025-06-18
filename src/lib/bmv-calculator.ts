import { Property, SoldPrice, RentalData, BMVCalculation } from '@/types';

export class BMVCalculator {
  calculateBMV(
    property: Property,
    soldPrices: SoldPrice[],
    rentalData: RentalData[]
  ): BMVCalculation {
    // Find similar properties for comparison
    const similarSoldPrices = this.findSimilarProperties(property, soldPrices);
    const similarRentalData = this.findSimilarRentalData(property, rentalData);

    // Calculate average sold price for similar properties
    const averageSoldPrice = similarSoldPrices.length > 0
      ? similarSoldPrices.reduce((sum, sp) => sum + sp.soldPrice, 0) / similarSoldPrices.length
      : property.price * 0.95; // Fallback to 5% below asking price

    // Calculate BMV percentage and amount
    const bmvAmount = averageSoldPrice - property.price;
    const bmvPercentage = (bmvAmount / averageSoldPrice) * 100;

    // Calculate rental yield
    const estimatedRent = similarRentalData.length > 0
      ? similarRentalData.reduce((sum, rd) => sum + rd.averageRent, 0) / similarRentalData.length
      : this.estimateRentFromPrice(property.price);

    const rentalYield = (estimatedRent * 12 / property.price) * 100;

    // Calculate confidence level
    const confidence = this.calculateConfidence(similarSoldPrices.length, similarRentalData.length);

    return {
      property,
      averageSoldPrice: Math.round(averageSoldPrice),
      bmvPercentage: Math.round(bmvPercentage * 100) / 100,
      bmvAmount: Math.round(bmvAmount),
      rentalYield: Math.round(rentalYield * 100) / 100,
      estimatedRent: Math.round(estimatedRent),
      areaGrowth: 5.2, // This would come from area growth data
      confidence
    };
  }

  private findSimilarProperties(property: Property, soldPrices: SoldPrice[]): SoldPrice[] {
    return soldPrices.filter(sp => {
      // Match property type and similar bedroom count
      const typeMatch = sp.propertyType.toLowerCase() === property.propertyType.toLowerCase();
      const bedroomMatch = this.isSimilarBedroomCount(property.bedrooms, sp.propertyType);
      
      return typeMatch && bedroomMatch;
    });
  }

  private findSimilarRentalData(property: Property, rentalData: RentalData[]): RentalData[] {
    return rentalData.filter(rd => {
      const typeMatch = rd.propertyType.toLowerCase() === property.propertyType.toLowerCase();
      const bedroomMatch = rd.bedrooms === property.bedrooms;
      
      return typeMatch && bedroomMatch;
    });
  }

  private isSimilarBedroomCount(bedrooms: number, propertyType: string): boolean {
    // For studio/1-bed properties, consider them similar
    if (propertyType.toLowerCase().includes('studio') && bedrooms === 1) return true;
    if (bedrooms === 1 && propertyType.toLowerCase().includes('studio')) return true;
    
    // For other properties, match exact bedroom count
    return true; // Simplified for MVP
  }

  private estimateRentFromPrice(price: number): number {
    // Rough estimation: 4-5% annual yield
    return (price * 0.045) / 12;
  }

  private calculateConfidence(soldPriceCount: number, rentalDataCount: number): 'high' | 'medium' | 'low' {
    const totalDataPoints = soldPriceCount + rentalDataCount;
    
    if (totalDataPoints >= 5) return 'high';
    if (totalDataPoints >= 2) return 'medium';
    return 'low';
  }

  // Calculate area growth trend
  calculateAreaGrowth(soldPrices: SoldPrice[]): number {
    if (soldPrices.length < 2) return 0;

    // Sort by date
    const sortedPrices = soldPrices
      .sort((a, b) => new Date(a.soldDate).getTime() - new Date(b.soldDate).getTime());

    // Calculate growth rate
    const oldestPrice = sortedPrices[0].soldPrice;
    const newestPrice = sortedPrices[sortedPrices.length - 1].soldPrice;
    const timeDiff = new Date(sortedPrices[sortedPrices.length - 1].soldDate).getTime() - 
                     new Date(sortedPrices[0].soldDate).getTime();
    const yearsDiff = timeDiff / (1000 * 60 * 60 * 24 * 365);

    if (yearsDiff === 0) return 0;

    const growthRate = ((newestPrice - oldestPrice) / oldestPrice) / yearsDiff * 100;
    return Math.round(growthRate * 100) / 100;
  }
} 