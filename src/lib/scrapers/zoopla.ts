import { Property, SoldPrice, RentalData, AreaGrowthData, ScraperConfig, PropertyScraper } from '@/types';

export class ZooplaScraper implements PropertyScraper {
  async scrapeProperties(postcode: string, config: ScraperConfig): Promise<Property[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      {
        id: 'zp-1',
        title: '2 Bedroom Terraced House',
        address: '67 Station Road',
        postcode: postcode,
        price: 195000,
        imageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop',
        bedrooms: 2,
        propertyType: 'Terraced',
        description: 'Charming period property with modern updates',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        listingUrl: 'https://www.zoopla.co.uk/for-sale/details/property-12345678',
        source: 'zoopla',
        listedDate: '2024-01-12'
      },
      {
        id: 'zp-2',
        title: '3 Bedroom End of Terrace',
        address: '89 Victoria Street',
        postcode: postcode,
        price: 265000,
        imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
        bedrooms: 3,
        propertyType: 'End of Terrace',
        description: 'Well-maintained family home with garden',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        listingUrl: 'https://www.zoopla.co.uk/for-sale/details/property-87654321',
        source: 'zoopla',
        listedDate: '2024-01-08'
      }
    ];
  }

  async scrapeSoldPrices(postcode: string): Promise<SoldPrice[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return [
      {
        address: '67 Station Road',
        postcode: postcode,
        soldPrice: 185000,
        soldDate: '2023-11-20',
        propertyType: 'Terraced'
      },
      {
        address: '89 Victoria Street',
        postcode: postcode,
        soldPrice: 255000,
        soldDate: '2023-10-15',
        propertyType: 'End of Terrace'
      }
    ];
  }

  async scrapeRentalData(postcode: string): Promise<RentalData[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        postcode: postcode,
        averageRent: 850,
        propertyType: 'Terraced',
        bedrooms: 2
      },
      {
        postcode: postcode,
        averageRent: 1100,
        propertyType: 'End of Terrace',
        bedrooms: 3
      }
    ];
  }

  async scrapeAreaGrowth(postcode: string): Promise<AreaGrowthData> {
    await new Promise(resolve => setTimeout(resolve, 350));
    
    return {
      postcode: postcode,
      growthPercentage: 4.8,
      timeframe: '12 months',
      dataPoints: [
        { date: '2023-01', averagePrice: 275000 },
        { date: '2023-04', averagePrice: 280000 },
        { date: '2023-07', averagePrice: 285000 },
        { date: '2023-10', averagePrice: 288000 },
        { date: '2024-01', averagePrice: 292000 }
      ]
    };
  }
} 