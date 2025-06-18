export interface Property {
  id: string;
  title: string;
  address: string;
  postcode: string;
  price: number;
  imageUrl: string;
  bedrooms: number;
  propertyType: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  listingUrl: string;
  source: 'rightmove' | 'zoopla' | 'onthemarket';
  listedDate: string;
}

export interface SoldPrice {
  address: string;
  postcode: string;
  soldPrice: number;
  soldDate: string;
  propertyType: string;
}

export interface BMVCalculation {
  property: Property;
  averageSoldPrice: number;
  bmvPercentage: number;
  bmvAmount: number;
  rentalYield: number;
  estimatedRent: number;
  areaGrowth: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface RentalData {
  postcode: string;
  averageRent: number;
  propertyType: string;
  bedrooms: number;
}

export interface AreaGrowthData {
  postcode: string;
  growthPercentage: number;
  timeframe: string;
  dataPoints: Array<{
    date: string;
    averagePrice: number;
  }>;
}

export interface ScraperResult {
  properties: Property[];
  soldPrices: SoldPrice[];
  rentalData: RentalData[];
  areaGrowth: AreaGrowthData;
}

export interface ScraperConfig {
  sources: {
    rightmove: boolean;
    zoopla: boolean;
    onthemarket: boolean;
  };
  radius: number; // miles
  propertyTypes: string[];
  priceRange: {
    min: number;
    max: number;
  };
} 