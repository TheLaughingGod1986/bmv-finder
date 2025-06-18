import { Property, SoldPrice, RentalData, AreaGrowthData, ScraperConfig, PropertyScraper } from '@/types';

export class OnTheMarketScraper implements PropertyScraper {
  async scrapeProperties(postcode: string, config: ScraperConfig): Promise<Property[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return [
      {
        id: 'otm-1',
        title: '1 Bedroom Studio Flat',
        address: '15 Queens Road',
        postcode: postcode,
        price: 165000,
        imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
        bedrooms: 1,
        propertyType: 'Studio',
        description: 'Modern studio apartment in prime location',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        listingUrl: 'https://onthemarket.com/property-1',
        source: 'onthemarket',
        listedDate: '2024-01-14'
      }
    ];
  }

  async scrapeSoldPrices(postcode: string): Promise<SoldPrice[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        address: '15 Queens Road',
        postcode: postcode,
        soldPrice: 155000,
        soldDate: '2023-12-10',
        propertyType: 'Studio'
      }
    ];
  }

  async scrapeRentalData(postcode: string): Promise<RentalData[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      {
        postcode: postcode,
        averageRent: 750,
        propertyType: 'Studio',
        bedrooms: 1
      }
    ];
  }

  async scrapeAreaGrowth(postcode: string): Promise<AreaGrowthData> {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    return {
      postcode: postcode,
      growthPercentage: 3.5,
      timeframe: '12 months',
      dataPoints: [
        { date: '2023-01', averagePrice: 270000 },
        { date: '2023-04', averagePrice: 275000 },
        { date: '2023-07', averagePrice: 278000 },
        { date: '2023-10', averagePrice: 280000 },
        { date: '2024-01', averagePrice: 282000 }
      ]
    };
  }
} 