import { SearchFilters, AdvancedSearchResult } from '@/types/search';

export class AdvancedSearchEngine {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_ELASTICSEARCH_URL || 'http://localhost:9200';
    this.apiKey = process.env.ELASTICSEARCH_API_KEY || '';
  }

  /**
   * Build Elasticsearch query from search filters
   */
  private buildElasticsearchQuery(filters: SearchFilters): any {
    const must: any[] = [];
    const should: any[] = [];
    const filter: any[] = [];
    const aggs: any = {};

    // Location filters
    if (filters.location) {
      if (filters.location.postcode) {
        must.push({
          match: {
            postcode: {
              query: filters.location.postcode,
              fuzziness: 'AUTO'
            }
          }
        });
      }

      if (filters.location.area) {
        should.push({
          match: {
            address: {
              query: filters.location.area,
              fuzziness: 'AUTO'
            }
          }
        });
      }

      if (filters.location.coordinates && filters.location.radius) {
        filter.push({
          geo_distance: {
            distance: `${filters.location.radius}mi`,
            location: {
              lat: filters.location.coordinates.lat,
              lon: filters.location.coordinates.lng
            }
          }
        });
      }
    }

    // Property type filters
    if (filters.propertyType && filters.propertyType.length > 0) {
      filter.push({
        terms: {
          property_type: filters.propertyType
        }
      });
    }

    // Price filters
    if (filters.price) {
      const priceRange: any = {};
      if (filters.price.min) priceRange.gte = filters.price.min;
      if (filters.price.max) priceRange.lte = filters.price.max;

      if (Object.keys(priceRange).length > 0) {
        filter.push({
          range: {
            price: priceRange
          }
        });
      }

      // Price per square foot
      if (filters.price.pricePerSqFt) {
        const pricePerSqFtRange: any = {};
        if (filters.price.pricePerSqFt.min) pricePerSqFtRange.gte = filters.price.pricePerSqFt.min;
        if (filters.price.pricePerSqFt.max) pricePerSqFtRange.lte = filters.price.pricePerSqFt.max;

        if (Object.keys(pricePerSqFtRange).length > 0) {
          filter.push({
            range: {
              price_per_sqft: pricePerSqFtRange
            }
          });
        }
      }
    }

    // Size filters
    if (filters.size) {
      if (filters.size.bedrooms) {
        const bedroomRange: any = {};
        if (filters.size.bedrooms.min) bedroomRange.gte = filters.size.bedrooms.min;
        if (filters.size.bedrooms.max) bedroomRange.lte = filters.size.bedrooms.max;

        if (Object.keys(bedroomRange).length > 0) {
          filter.push({
            range: {
              bedrooms: bedroomRange
            }
          });
        }
      }

      if (filters.size.bathrooms) {
        const bathroomRange: any = {};
        if (filters.size.bathrooms.min) bathroomRange.gte = filters.size.bathrooms.min;
        if (filters.size.bathrooms.max) bathroomRange.lte = filters.size.bathrooms.max;

        if (Object.keys(bathroomRange).length > 0) {
          filter.push({
            range: {
              bathrooms: bathroomRange
            }
          });
        }
      }

      if (filters.size.floorArea) {
        const floorAreaRange: any = {};
        if (filters.size.floorArea.min) floorAreaRange.gte = filters.size.floorArea.min;
        if (filters.size.floorArea.max) floorAreaRange.lte = filters.size.floorArea.max;

        if (Object.keys(floorAreaRange).length > 0) {
          filter.push({
            range: {
              floor_area: floorAreaRange
            }
          });
        }
      }
    }

    // Date filters
    if (filters.dateRange) {
      if (filters.dateRange.soldAfter || filters.dateRange.soldBefore) {
        const dateRange: any = {};
        if (filters.dateRange.soldAfter) dateRange.gte = filters.dateRange.soldAfter;
        if (filters.dateRange.soldBefore) dateRange.lte = filters.dateRange.soldBefore;

        filter.push({
          range: {
            date_of_transfer: dateRange
          }
        });
      }

      if (filters.dateRange.builtAfter || filters.dateRange.builtBefore) {
        const builtRange: any = {};
        if (filters.dateRange.builtAfter) builtRange.gte = filters.dateRange.builtAfter;
        if (filters.dateRange.builtBefore) builtRange.lte = filters.dateRange.builtBefore;

        filter.push({
          range: {
            built_year: builtRange
          }
        });
      }
    }

    // Investment filters
    if (filters.investment) {
      if (filters.investment.bmvScore) {
        const bmvRange: any = {};
        if (filters.investment.bmvScore.min) bmvRange.gte = filters.investment.bmvScore.min;
        if (filters.investment.bmvScore.max) bmvRange.lte = filters.investment.bmvScore.max;

        filter.push({
          range: {
            bmv_score: bmvRange
          }
        });
      }

      if (filters.investment.rentalYield) {
        const yieldRange: any = {};
        if (filters.investment.rentalYield.min) yieldRange.gte = filters.investment.rentalYield.min;
        if (filters.investment.rentalYield.max) yieldRange.lte = filters.investment.rentalYield.max;

        filter.push({
          range: {
            rental_yield: yieldRange
          }
        });
      }

      if (filters.investment.marketTrend && filters.investment.marketTrend !== 'any') {
        filter.push({
          term: {
            market_trend: filters.investment.marketTrend
          }
        });
      }
    }

    // Property features
    if (filters.features) {
      const featureFilters: any[] = [];

      Object.entries(filters.features).forEach(([key, value]) => {
        if (typeof value === 'boolean' && value) {
          featureFilters.push({
            term: {
              [`features.${key}`]: true
            }
          });
        } else if (Array.isArray(value) && value.length > 0) {
          featureFilters.push({
            terms: {
              [`features.${key}`]: value
            }
          });
        }
      });

      if (featureFilters.length > 0) {
        filter.push({
          bool: {
            must: featureFilters
          }
        });
      }
    }

    // EPC filters
    if (filters.epc) {
      if (filters.epc.rating && filters.epc.rating.length > 0) {
        filter.push({
          terms: {
            'epc.rating': filters.epc.rating
          }
        });
      }

      if (filters.epc.energyEfficiency) {
        const efficiencyRange: any = {};
        if (filters.epc.energyEfficiency.min) efficiencyRange.gte = filters.epc.energyEfficiency.min;
        if (filters.epc.energyEfficiency.max) efficiencyRange.lte = filters.epc.energyEfficiency.max;

        filter.push({
          range: {
            'epc.energy_efficiency': efficiencyRange
          }
        });
      }
    }

    // Build aggregations for filter options
    aggs.property_types = {
      terms: {
        field: 'property_type',
        size: 20
      }
    };

    aggs.price_ranges = {
      range: {
        field: 'price',
        ranges: [
          { to: 100000 },
          { from: 100000, to: 200000 },
          { from: 200000, to: 300000 },
          { from: 300000, to: 500000 },
          { from: 500000, to: 750000 },
          { from: 750000, to: 1000000 },
          { from: 1000000 }
        ]
      }
    };

    aggs.bedrooms = {
      terms: {
        field: 'bedrooms',
        size: 10
      }
    };

    aggs.bmv_scores = {
      range: {
        field: 'bmv_score',
        ranges: [
          { to: 20 },
          { from: 20, to: 40 },
          { from: 40, to: 60 },
          { from: 60, to: 80 },
          { from: 80 }
        ]
      }
    };

    // Build the final query
    const query: any = {
      bool: {}
    };

    if (must.length > 0) query.bool.must = must;
    if (should.length > 0) query.bool.should = should;
    if (filter.length > 0) query.bool.filter = filter;

    return {
      query,
      aggs,
      size: filters.preferences?.limit || 20,
      from: filters.preferences?.offset || 0,
      sort: this.buildSortQuery(filters.preferences)
    };
  }

  /**
   * Build sort query from preferences
   */
  private buildSortQuery(preferences?: SearchFilters['preferences']): any[] {
    if (!preferences?.sortBy) {
      return [{ date_of_transfer: { order: 'desc' } }];
    }

    const sortField = preferences.sortBy === 'bmvScore' ? 'bmv_score' : preferences.sortBy;
    const order = preferences.sortOrder || 'desc';

    return [{ [sortField]: { order } }];
  }

  /**
   * Execute advanced search
   */
  async search(filters: SearchFilters): Promise<AdvancedSearchResult> {
    const startTime = Date.now();
    
    try {
      const query = this.buildElasticsearchQuery(filters);
      
      const response = await fetch(`${this.baseUrl}/properties/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      const searchTime = Date.now() - startTime;

      // Process results
      const properties = data.hits.hits.map((hit: any) => ({
        ...hit._source,
        _id: hit._id,
        _score: hit._score
      }));

      // Process aggregations for filter options
      const aggregations = data.aggregations || {};

      return {
        properties,
        totalCount: data.hits.total.value || data.hits.total,
        appliedFilters: filters,
        searchMetadata: {
          searchTime,
          filtersApplied: this.countActiveFilters(filters),
          resultsPerPage: filters.preferences?.limit || 20,
          currentPage: Math.floor((filters.preferences?.offset || 0) / (filters.preferences?.limit || 20)) + 1,
          totalPages: Math.ceil((data.hits.total.value || data.hits.total) / (filters.preferences?.limit || 20))
        },
        suggestions: {
          similarProperties: properties.slice(0, 3), // Top 3 similar properties
          alternativeFilters: this.generateAlternativeFilters(aggregations, filters)
        }
      };
    } catch (error) {
      console.error('Advanced search error:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count active filters
   */
  private countActiveFilters(filters: SearchFilters): number {
    let count = 0;

    if (filters.location?.postcode) count++;
    if (filters.location?.area) count++;
    if (filters.location?.radius) count++;
    if (filters.propertyType?.length) count++;
    if (filters.price?.min || filters.price?.max) count++;
    if (filters.size?.bedrooms?.min || filters.size?.bedrooms?.max) count++;
    if (filters.size?.bathrooms?.min || filters.size?.bathrooms?.max) count++;
    if (filters.dateRange?.soldAfter || filters.dateRange?.soldBefore) count++;
    if (filters.investment?.bmvScore?.min || filters.investment?.bmvScore?.max) count++;
    if (filters.features) {
      Object.values(filters.features).forEach(value => {
        if (typeof value === 'boolean' && value) count++;
        if (Array.isArray(value) && value.length > 0) count++;
      });
    }

    return count;
  }

  /**
   * Generate alternative filter suggestions
   */
  private generateAlternativeFilters(aggregations: any, currentFilters: SearchFilters): any[] {
    const alternatives: any[] = [];

    // Suggest price range alternatives
    if (aggregations.price_ranges) {
      alternatives.push({
        id: 'price_alternatives',
        label: 'Alternative Price Ranges',
        type: 'range',
        options: aggregations.price_ranges.buckets.map((bucket: any) => ({
          value: `${bucket.from || 0}-${bucket.to || '∞'}`,
          label: `£${(bucket.from || 0).toLocaleString()} - £${bucket.to ? bucket.to.toLocaleString() : '∞'}`,
          count: bucket.doc_count
        }))
      });
    }

    // Suggest property type alternatives
    if (aggregations.property_types) {
      alternatives.push({
        id: 'property_type_alternatives',
        label: 'Popular Property Types',
        type: 'multiselect',
        options: aggregations.property_types.buckets.map((bucket: any) => ({
          value: bucket.key,
          label: bucket.key,
          count: bucket.doc_count
        }))
      });
    }

    return alternatives;
  }

  /**
   * Get filter options for a specific field
   */
  async getFilterOptions(field: string, currentFilters?: SearchFilters): Promise<any[]> {
    try {
      const query = {
        size: 0,
        aggs: {
          [field]: {
            terms: {
              field,
              size: 100
            }
          }
        },
        ...(currentFilters && { query: this.buildElasticsearchQuery(currentFilters).query })
      };

      const response = await fetch(`${this.baseUrl}/properties/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`Filter options request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.aggregations?.[field]?.buckets || [];
    } catch (error) {
      console.error('Get filter options error:', error);
      return [];
    }
  }

  /**
   * Save search as a saved search
   */
  async saveSearch(filters: SearchFilters, name: string, userId: string): Promise<string> {
    try {
      const savedSearch = {
        name,
        filters,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(`${this.baseUrl}/saved_searches/_doc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(savedSearch)
      });

      if (!response.ok) {
        throw new Error(`Save search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data._id;
    } catch (error) {
      console.error('Save search error:', error);
      throw new Error(`Failed to save search: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get saved searches for a user
   */
  async getSavedSearches(userId: string): Promise<any[]> {
    try {
      const query = {
        query: {
          term: {
            userId
          }
        },
        sort: [
          { updatedAt: { order: 'desc' } }
        ]
      };

      const response = await fetch(`${this.baseUrl}/saved_searches/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`Get saved searches failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source
      }));
    } catch (error) {
      console.error('Get saved searches error:', error);
      return [];
    }
  }
}

export const advancedSearchEngine = new AdvancedSearchEngine();
