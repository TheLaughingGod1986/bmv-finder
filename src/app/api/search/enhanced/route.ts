import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '../../../../lib/esClient';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get('postcode');
  const number = searchParams.get('number');
  const street = searchParams.get('street');
  const locality = searchParams.get('locality');
  const town = searchParams.get('town');
  const propertyType = searchParams.get('property_type');
  const priceMin = searchParams.get('price_min');
  const priceMax = searchParams.get('price_max');
  const epcRating = searchParams.get('epc_rating');
  const bedrooms = searchParams.get('bedrooms');
  const hasEpc = searchParams.get('has_epc');
  const energyEfficient = searchParams.get('energy_efficient');
  const size = parseInt(searchParams.get('size') || '10');

  try {
    // Build query based on available parameters
    const must: any[] = [];
    const filter: any[] = [];

    // Required parameters
    if (postcode) {
      must.push({ match_phrase: { postcode: postcode } });
    }

    if (number) {
      must.push({ match: { paon: number } });
    }

    // Optional parameters
    if (street) {
      must.push({ match: { street: street } });
    }

    if (locality) {
      must.push({ match: { locality: locality } });
    }

    if (town) {
      must.push({ match: { town_city: town } });
    }

    if (propertyType) {
      filter.push({ term: { property_type: propertyType } });
    }

    if (priceMin) {
      filter.push({ range: { price: { gte: parseInt(priceMin) } } });
    }

    if (priceMax) {
      filter.push({ range: { price: { lte: parseInt(priceMax) } } });
    }

    if (epcRating) {
      filter.push({ term: { epc_rating: epcRating } });
    }

    if (bedrooms) {
      filter.push({ term: { epc_bedrooms: parseInt(bedrooms) } });
    }

    if (hasEpc === 'true') {
      filter.push({ term: { has_epc: true } });
    }

    if (energyEfficient === 'true') {
      filter.push({ term: { energy_efficient: true } });
    }

    // Build the search query
    const searchBody: any = {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter: filter
        }
      },
      size: Math.min(size, 100), // Limit to 100 results
      sort: [
        { date_of_transfer: { order: 'desc' } }
      ]
    };

    // Search for properties in the recent_sales index
    console.log('Elasticsearch query:', JSON.stringify(searchBody, null, 2));
    const response = await esClient.search({
      index: 'recent_sales',
      body: searchBody
    });
    console.log('Elasticsearch response:', response.hits.total, 'total hits');

    const results = response.hits.hits.map(hit => {
      const source = hit._source as any;
      return {
        // Basic property information
        guid: source.transaction_id || source.guid,
        address: source.full_address || `${source.paon || ''} ${source.street || ''}, ${source.postcode || ''}`.trim(),
        postcode: source.postcode,
        price: source.price,
        date: source.date_of_transfer || source.date,
        property_type: source.property_type,
        property_type_label: source.property_type_label || source.property_type,
        new_build: source.old_new === 'Y',
        new_build_label: source.old_new === 'Y' ? 'New Build' : 'Existing',
        estate_type: source.estate_type,
        estate_type_label: source.estate_type_label || source.estate_type,
        transaction_category: source.transaction_category,
        transaction_category_label: source.transaction_category_label || source.transaction_category,
        
        // Enhanced EPC data (will be populated when we integrate EPC data)
        epc_bedrooms: source.epc_bedrooms || null,
        epc_size: source.epc_size || null,
        epc_rating: source.epc_rating || null,
        match_type: source.match_type || null,
        match_confidence: source.match_confidence || null,
        match_score: source.match_score || null,
        has_epc: source.has_epc || false,
        energy_efficient: source.energy_efficient || false,
        
        // Enhanced HPI data (will be populated when we integrate HPI data)
        hpi_value: source.hpi_value || null,
        hpi_region: source.hpi_region || null,
        hpi_date: source.hpi_date || null,
        has_hpi: source.has_hpi || false,
        
        // Computed fields
        year: source.year || (source.date_of_transfer ? new Date(source.date_of_transfer).getFullYear() : null),
        month: source.month || (source.date_of_transfer ? new Date(source.date_of_transfer).getMonth() + 1 : null),
        price_range: source.price_range || null,
        
        // Additional address fields
        paon: source.paon,
        saon: source.saon,
        street: source.street,
        locality: source.locality,
        town_city: source.town || source.town_city,
        district: source.district,
        county: source.county
      };
    });

    return NextResponse.json({
      success: true,
      total: typeof response.hits.total === 'object' ? response.hits.total.value : response.hits.total,
      results: results,
      query: searchBody.query
    });

  } catch (error) {
    console.error('Enhanced search error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters, page = 1, size = 10 } = body;
    
    console.log('Enhanced search request:', { query, filters, page, size });

    // Build advanced search query
    const searchBody: any = {
      query: {
        bool: {
          must: [],
          filter: [],
          should: [],
          must_not: []
        }
      },
      size: Math.min(size * 10, 1000), // Get more results to group client-side
      sort: [
        { date_of_transfer: { order: 'desc' } }
      ]
    };

    // Add text search if provided
    if (query) {
      // Check if query looks like a postcode
      const postcodePattern = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i;
      if (postcodePattern.test(query.trim())) {
        // For postcodes, use exact matching
        const normalizedPostcode = query.trim().toUpperCase();
        searchBody.query.bool.must.push({
          bool: {
            should: [
              { match_phrase: { postcode: normalizedPostcode } },
              { match_phrase: { postcode: normalizedPostcode.replace(/\s/g, '') } }
            ],
            minimum_should_match: 1
          }
        });
      } else {
        // For other searches, use fuzzy matching
        searchBody.query.bool.must.push({
          multi_match: {
            query: query,
            fields: ['full_address', 'street', 'locality', 'town', 'postcode'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      }
    }

    // Add filters
    if (filters) {
      if (filters.price_min) {
        searchBody.query.bool.filter.push({ range: { price: { gte: filters.price_min } } });
      }
      if (filters.price_max) {
        searchBody.query.bool.filter.push({ range: { price: { lte: filters.price_max } } });
      }
      if (filters.property_type) {
        searchBody.query.bool.filter.push({ term: { property_type: filters.property_type } });
      }
      if (filters.epc_rating) {
        searchBody.query.bool.filter.push({ term: { epc_rating: filters.epc_rating } });
      }
      if (filters.bedrooms) {
        searchBody.query.bool.filter.push({ term: { epc_bedrooms: filters.bedrooms } });
      }
      if (filters.has_epc === true) {
        searchBody.query.bool.filter.push({ term: { has_epc: true } });
      }
      if (filters.energy_efficient === true) {
        searchBody.query.bool.filter.push({ term: { energy_efficient: true } });
      }
      if (filters.year_min) {
        searchBody.query.bool.filter.push({ range: { year: { gte: filters.year_min } } });
      }
      if (filters.year_max) {
        searchBody.query.bool.filter.push({ range: { year: { lte: filters.year_max } } });
      }
    }

    // If no query provided, use match_all
    if (searchBody.query.bool.must.length === 0) {
      searchBody.query.bool.must.push({ match_all: {} });
    }

    const response = await esClient.search({
      index: 'recent_sales',
      body: searchBody
    });

    const allHits = response.hits.hits.map(hit => {
      const source = hit._source as any;
      return {
        // Basic property information
        guid: source.transaction_id || source.guid,
        address: source.full_address || `${source.paon || ''} ${source.street || ''}, ${source.postcode || ''}`.trim(),
        postcode: source.postcode,
        price: source.price,
        date: source.date_of_transfer || source.date,
        property_type: source.property_type,
        property_type_label: source.property_type_label || source.property_type,
        new_build: source.old_new === 'Y',
        new_build_label: source.old_new === 'Y' ? 'New Build' : 'Existing',
        estate_type: source.estate_type,
        estate_type_label: source.estate_type_label || source.estate_type,
        transaction_category: source.transaction_category,
        transaction_category_label: source.transaction_category_label || source.transaction_category,
        
        // Enhanced EPC data (will be populated when we integrate EPC data)
        epc_bedrooms: source.epc_bedrooms || null,
        epc_size: source.epc_size || null,
        epc_rating: source.epc_rating || null,
        match_type: source.match_type || null,
        match_confidence: source.match_confidence || null,
        match_score: source.match_score || null,
        has_epc: source.has_epc || false,
        energy_efficient: source.energy_efficient || false,
        
        // Enhanced HPI data (will be populated when we integrate HPI data)
        hpi_value: source.hpi_value || null,
        hpi_region: source.hpi_region || null,
        hpi_date: source.hpi_date || null,
        has_hpi: source.has_hpi || false,
        
        // Computed fields
        year: source.year || (source.date_of_transfer ? new Date(source.date_of_transfer).getFullYear() : null),
        month: source.month || (source.date_of_transfer ? new Date(source.date_of_transfer).getMonth() + 1 : null),
        price_range: source.price_range || null,
        
        // Additional address fields
        paon: source.paon,
        saon: source.saon,
        street: source.street,
        locality: source.locality,
        town_city: source.town || source.town_city,
        district: source.district,
        county: source.county
      };
    });

    // Group results by year and calculate averages
    const groupedResults = groupResultsByYear(allHits);
    
    // Apply pagination
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const paginatedResults = groupedResults.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      total: groupedResults.length,
      results: paginatedResults,
      pagination: {
        page,
        size,
        has_more: endIndex < groupedResults.length,
        after_key: endIndex < groupedResults.length ? endIndex : null
      },
      query: searchBody.query
    });

  } catch (error) {
    console.error('Enhanced search error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Helper function to group results by year and calculate averages
function groupResultsByYear(properties: any[]): any[] {
  const yearGroups: { [key: number]: any[] } = {};
  
  properties.forEach(property => {
    const year = property.year;
    if (year && !isNaN(year)) {
      if (!yearGroups[year]) {
        yearGroups[year] = [];
      }
      yearGroups[year].push(property);
    }
  });

  return Object.keys(yearGroups).map(year => {
    const yearNum = parseInt(year);
    const propertiesInYear = yearGroups[yearNum];
    const avgPrice = propertiesInYear.reduce((sum, p) => sum + (p.price || 0), 0) / propertiesInYear.length;
    
    return {
      year: yearNum,
      count: propertiesInYear.length,
      avgPrice: Math.round(avgPrice),
      properties: propertiesInYear.slice(0, 5), // Show first 5 properties for the year
      priceRange: {
        min: Math.min(...propertiesInYear.map(p => p.price || 0)),
        max: Math.max(...propertiesInYear.map(p => p.price || 0))
      }
    };
  }).sort((a, b) => b.year - a.year); // Sort by year descending
} 