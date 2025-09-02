import { Client } from '@elastic/elasticsearch';
import { esClient } from './esClient';
import { 
  RecentSaleDocument,
  EPCDocument,
  HPIDocument,
  ElasticsearchResponse,
  extractSource,
  mapElasticsearchHits
} from '@/types/elasticsearch';

interface SearchFilters {
  priceRange?: { min: number; max: number };
  propertyType?: string[];
  dateRange?: { start: string; end: string };
  radius?: number; // in miles
  area?: string[];
  bedrooms?: { min: number; max: number };
  transactionType?: string[];
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
  lastUsed: string;
  resultCount?: number;
}

interface Property {
  id: string;
  address: string;
  postcode: string;
  propertyType: string;
  price: number;
  dateOfTransfer: string;
  bedrooms?: number;
  floorArea?: number;
  [key: string]: unknown;
}

interface ElasticsearchQuery {
  bool: {
    must: unknown[];
    should?: unknown[];
    filter: unknown[];
  };
}

interface SearchResult {
  properties: Property[];
  total: number;
  aggregations: Record<string, unknown>;
  searchId: string;
  savedSearchId?: string;
}

class AdvancedSearch {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  // Radius search around a postcode
  async radiusSearch(
    centerPostcode: string,
    radius: number,
    filters: SearchFilters = {}
  ): Promise<SearchResult> {
    // First get coordinates for the center postcode
    const centerCoords = await this.getPostcodeCoordinates(centerPostcode);
    
    if (!centerCoords) {
      throw new Error(`Could not find coordinates for postcode: ${centerPostcode}`);
    }

    const query: ElasticsearchQuery = {
      bool: {
        must: [
          {
            geo_distance: {
              distance: `${radius}mi`,
              location: {
                lat: centerCoords.lat,
                lon: centerCoords.lon
              }
            }
          }
        ],
        filter: []
      }
    };

    // Add filters
    this.addFiltersToQuery(query.bool.filter, filters);

    const result = await this.client.search({
      index: 'property_sales',
      size: 100,
      body: {
        query,
        aggs: {
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { to: 100000 },
                { from: 100000, to: 200000 },
                { from: 200000, to: 300000 },
                { from: 300000, to: 500000 },
                { from: 500000 }
              ]
            }
          },
          property_types: {
            terms: {
              field: 'propertyType'
            }
          }
        }
      }
    } as Record<string, any>);

    return {
      properties: result.hits.hits.map((hit: any) => hit._source),
      total: typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total || 0,
      aggregations: result.aggregations,
      searchId: this.generateSearchId()
    };
  }

  // Area-based HPI comparisons
  async areaComparison(
    areas: string[],
    dateRange?: { start: string; end: string }
  ): Promise<any> {
    const comparisonData = [];

    for (const area of areas) {
      try {
        const query: ElasticsearchQuery = {
          bool: {
            must: [
              {
                term: { region: area }
              }
            ],
            filter: []
          }
        };

        if (dateRange) {
          query.bool.must.push({
            range: {
              date_of_transfer: {
                gte: dateRange.start,
                lte: dateRange.end
              }
            }
          });
        }

        const result = await this.client.search({
          index: 'house_price_index',
          size: 0,
          body: {
            query,
            aggs: {
              avg_price: {
                avg: { field: 'index' }
              },
              price_trend: {
                date_histogram: {
                  field: 'date_of_transfer',
                  calendar_interval: 'month',
                  aggs: {
                    avg_price: {
                      avg: { field: 'index' }
                    }
                  }
                }
              }
            }
          }
        } as Record<string, any>);

        comparisonData.push({
          area,
          averagePrice: (result.aggregations?.avg_price as { value: number })?.value || 0,
          priceTrend: (result.aggregations?.price_trend as { buckets: Array<any> })?.buckets || [],
          dataPoints: typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total || 0
        });
      } catch (error) {
        console.error(`Error fetching data for area ${area}:`, error);
        comparisonData.push({
          area,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      areas: comparisonData,
      comparisonDate: new Date().toISOString(),
      totalAreas: areas.length
    };
  }

  // Date range filtering with advanced options
  async dateRangeSearch(
    query: string,
    dateRange: { start: string; end: string },
    filters: SearchFilters = {}
  ): Promise<SearchResult> {
    const searchQuery: ElasticsearchQuery = {
      bool: {
        must: [
          {
            range: {
              date_of_transfer: {
                gte: dateRange.start,
                lte: dateRange.end
              }
            }
          }
        ],
        should: [],
        filter: []
      }
    };

    // Add search query
    if (query) {
      const normalizedQuery = query.trim();
      const postcodeRegex = /^[A-Z]{1,2}[0-9][0-9A-Z]? ?[0-9][A-Z]{2}$/i;
      
      if (postcodeRegex.test(normalizedQuery)) {
        searchQuery.bool.should.push(
          { match_phrase: { postcode: normalizedQuery.toUpperCase() } }
        );
      } else {
        searchQuery.bool.should.push(
          { match: { street: { query: normalizedQuery, fuzziness: 'AUTO' } } },
          { match: { town_city: { query: normalizedQuery, fuzziness: 'AUTO' } } }
        );
      }
    }

    // Add filters
    this.addFiltersToQuery(searchQuery.bool.filter, filters);

    const result = await this.client.search({
      index: 'property_sales',
      size: 50,
      body: {
        query: searchQuery,
        sort: [
          { date_of_transfer: { order: 'desc' } }
        ],
        aggs: {
          monthly_trend: {
            date_histogram: {
              field: 'date_of_transfer',
              calendar_interval: 'month',
              aggs: {
                avg_price: {
                  avg: { field: 'price' }
                },
                count: {
                  value_count: { field: 'price' }
                }
              }
            }
          }
        }
      }
    } as Record<string, any>);

    return {
      properties: result.hits.hits.map((hit: any) => hit._source),
      total: typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total || 0,
      aggregations: result.aggregations,
      searchId: this.generateSearchId()
    };
  }

  // Save search functionality
  async saveSearch(
    name: string,
    query: string,
    filters: SearchFilters
  ): Promise<SavedSearch> {
    const savedSearch: SavedSearch = {
      id: this.generateSearchId(),
      name,
      query,
      filters,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

    // In a real implementation, you'd save this to a database
    // For now, we'll use localStorage or a simple in-memory store
    const savedSearches = this.getSavedSearches();
    savedSearches.push(savedSearch);
    this.setSavedSearches(savedSearches);

    return savedSearch;
  }

  // Get saved searches
  getSavedSearches(): SavedSearch[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const saved = localStorage.getItem('saved_searches');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved searches:', error);
      return [];
    }
  }

  // Update saved search usage
  updateSavedSearchUsage(searchId: string): void {
    const savedSearches = this.getSavedSearches();
    const search = savedSearches.find(s => s.id === searchId);
    
    if (search) {
      search.lastUsed = new Date().toISOString();
      this.setSavedSearches(savedSearches);
    }
  }

  // Delete saved search
  deleteSavedSearch(searchId: string): boolean {
    const savedSearches = this.getSavedSearches();
    const filtered = savedSearches.filter(s => s.id !== searchId);
    
    if (filtered.length !== savedSearches.length) {
      this.setSavedSearches(filtered);
      return true;
    }
    
    return false;
  }

  // Execute saved search
  async executeSavedSearch(searchId: string): Promise<SearchResult | null> {
    const savedSearches = this.getSavedSearches();
    const savedSearch = savedSearches.find(s => s.id === searchId);
    
    if (!savedSearch) {
      return null;
    }

    // Update last used
    this.updateSavedSearchUsage(searchId);

    // Execute the search
    if (savedSearch.filters.radius) {
      // This would need the center postcode from the saved search
      // For now, we'll return a basic search
      return this.dateRangeSearch(savedSearch.query, { start: '2020-01-01', end: '2024-12-31' }, savedSearch.filters);
    } else {
      return this.dateRangeSearch(savedSearch.query, { start: '2020-01-01', end: '2024-12-31' }, savedSearch.filters);
    }
  }

  // Get postcode coordinates (mock implementation)
  private async getPostcodeCoordinates(postcode: string): Promise<{ lat: number; lon: number } | null> {
    // In a real implementation, you'd use a postcode lookup service
    // For now, return mock coordinates for common postcodes
    const mockCoordinates: Record<string, { lat: number; lon: number }> = {
      'M1 1AA': { lat: 53.4808, lon: -2.2426 }, // Manchester
      'SW1A 1AA': { lat: 51.5074, lon: -0.1278 }, // London
      'B1 1AA': { lat: 52.4862, lon: -1.8904 }, // Birmingham
      'L1 1AA': { lat: 53.4084, lon: -2.9916 }, // Liverpool
      'LS1 1AA': { lat: 53.8008, lon: -1.5491 }, // Leeds
    };

    return mockCoordinates[postcode.toUpperCase()] || null;
  }

  // Add filters to query
  private addFiltersToQuery(filterArray: unknown[], filters: SearchFilters): void {
    if (filters.priceRange) {
      filterArray.push({
        range: {
          price: {
            gte: filters.priceRange.min,
            lte: filters.priceRange.max
          }
        }
      });
    }

    if (filters.propertyType && filters.propertyType.length > 0) {
      filterArray.push({
        terms: { propertyType: filters.propertyType }
      });
    }

    if (filters.bedrooms) {
      filterArray.push({
        range: {
          numberOfBedrooms: {
            gte: filters.bedrooms.min,
            lte: filters.bedrooms.max
          }
        }
      });
    }

    if (filters.transactionType && filters.transactionType.length > 0) {
      filterArray.push({
        terms: { transactionType: filters.transactionType }
      });
    }
  }

  // Generate unique search ID
  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save searches to localStorage
  private setSavedSearches(searches: SavedSearch[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('saved_searches', JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving searches:', error);
    }
  }
}

export default AdvancedSearch; 