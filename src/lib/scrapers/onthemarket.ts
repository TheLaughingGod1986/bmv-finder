import { Property, SoldPrice, RentalData, AreaGrowthData, ScraperConfig, PropertyScraper } from '@/types';

export class OnTheMarketScraper implements PropertyScraper {
  async scrapeProperties(postcode: string, config: ScraperConfig): Promise<Property[]> {
    console.log('OnTheMarket scraper not implemented yet for postcode:', postcode);
    return [];
  }

  async scrapeSoldPrices(postcode: string): Promise<SoldPrice[]> {
    console.log('OnTheMarket sold prices not implemented yet for postcode:', postcode);
    return [];
  }

  async scrapeRentalData(postcode: string): Promise<RentalData[]> {
    console.log('OnTheMarket rental data not implemented yet for postcode:', postcode);
    return [];
  }

  async scrapeAreaGrowth(postcode: string): Promise<AreaGrowthData> {
    console.log('OnTheMarket area growth not implemented yet for postcode:', postcode);
    return {
      postcode,
      growthPercentage: 0,
      timeframe: '12 months',
      dataPoints: []
    };
  }

  async getNearbyProperties(originalPostcode: string): Promise<{ postcode: string; properties: Property[] }[]> {
    console.log('OnTheMarket nearby properties not implemented yet for postcode:', originalPostcode);
    return [];
  }
} 