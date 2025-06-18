import { Property, SoldPrice, RentalData, AreaGrowthData, ScraperConfig } from '@/types';
import { RightmoveScraper } from './rightmove';
import { ZooplaScraper } from './zoopla';
import { OnTheMarketScraper } from './onthemarket';

export interface PropertyScraper {
  scrapeProperties(postcode: string, config: ScraperConfig): Promise<Property[]>;
  scrapeSoldPrices(postcode: string): Promise<SoldPrice[]>;
  scrapeRentalData(postcode: string): Promise<RentalData[]>;
  scrapeAreaGrowth(postcode: string): Promise<AreaGrowthData>;
}

export class ScraperManager {
  private scrapers: Map<string, PropertyScraper> = new Map();

  constructor() {
    this.scrapers.set('rightmove', new RightmoveScraper());
    this.scrapers.set('zoopla', new ZooplaScraper());
    this.scrapers.set('onthemarket', new OnTheMarketScraper());
  }

  async scrapeAll(postcode: string, config: ScraperConfig) {
    const results = {
      properties: [] as Property[],
      soldPrices: [] as SoldPrice[],
      rentalData: [] as RentalData[],
      areaGrowth: null as AreaGrowthData | null,
    };

    // Scrape properties from enabled sources
    for (const [source, enabled] of Object.entries(config.sources)) {
      if (enabled && this.scrapers.has(source)) {
        try {
          const scraper = this.scrapers.get(source)!;
          const properties = await scraper.scrapeProperties(postcode, config);
          results.properties.push(...properties);
        } catch (error) {
          console.error(`Error scraping ${source}:`, error);
        }
      }
    }

    // Get sold prices from first available scraper
    if (this.scrapers.has('rightmove')) {
      try {
        results.soldPrices = await this.scrapers.get('rightmove')!.scrapeSoldPrices(postcode);
      } catch (error) {
        console.error('Error scraping sold prices:', error);
      }
    }

    // Get rental data
    if (this.scrapers.has('zoopla')) {
      try {
        results.rentalData = await this.scrapers.get('zoopla')!.scrapeRentalData(postcode);
      } catch (error) {
        console.error('Error scraping rental data:', error);
      }
    }

    // Get area growth data
    if (this.scrapers.has('rightmove')) {
      try {
        results.areaGrowth = await this.scrapers.get('rightmove')!.scrapeAreaGrowth(postcode);
      } catch (error) {
        console.error('Error scraping area growth:', error);
      }
    }

    return results;
  }
} 