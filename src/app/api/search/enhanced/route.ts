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
      must.push({ match: { postcode: postcode } });
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
        { date: { order: 'desc' } }
      ]
    };

    // Search for properties in the enhanced index
    const response = await esClient.search({
      index: 'properties-enhanced',
      body: searchBody
    });

    const results = response.hits.hits.map(hit => {
      const source = hit._source as any;
      return {
        // Basic property information
        guid: source.guid,
        address: source.full_address || `${source.paon} ${source.street}, ${source.postcode}`,
        postcode: source.postcode,
        price: source.price,
        date: source.date,
        property_type: source.property_type,
        property_type_label: source.property_type_label,
        new_build: source.new_build,
        new_build_label: source.new_build_label,
        estate_type: source.estate_type,
        estate_type_label: source.estate_type_label,
        transaction_category: source.transaction_category,
        transaction_category_label: source.transaction_category_label,
        
        // Enhanced EPC data
        epc_bedrooms: source.epc_bedrooms,
        epc_size: source.epc_size,
        epc_rating: source.epc_rating,
        match_type: source.match_type,
        match_confidence: source.match_confidence,
        match_score: source.match_score,
        has_epc: source.has_epc,
        energy_efficient: source.energy_efficient,
        
        // Enhanced HPI data
        hpi_value: source.hpi_value,
        hpi_region: source.hpi_region,
        hpi_date: source.hpi_date,
        has_hpi: source.has_hpi,
        
        // Computed fields
        year: source.year,
        month: source.month,
        price_range: source.price_range,
        
        // Additional address fields
        paon: source.paon,
        saon: source.saon,
        street: source.street,
        locality: source.locality,
        town_city: source.town_city,
        district: source.district,
        county: source.county
      };
    });

    return NextResponse.json({
      success: true,
      total: response.hits.total.value,
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
    const { query, filters, size = 10 } = body;

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
      size: Math.min(size, 100),
      sort: [
        { date: { order: 'desc' } }
      ]
    };

    // Add text search if provided
    if (query) {
      searchBody.query.bool.must.push({
        multi_match: {
          query: query,
          fields: ['full_address', 'street', 'locality', 'town_city', 'postcode'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
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
      index: 'properties-enhanced',
      body: searchBody
    });

    const results = response.hits.hits.map(hit => {
      const source = hit._source as any;
      return {
        // Basic property information
        guid: source.guid,
        address: source.full_address || `${source.paon} ${source.street}, ${source.postcode}`,
        postcode: source.postcode,
        price: source.price,
        date: source.date,
        property_type: source.property_type,
        property_type_label: source.property_type_label,
        new_build: source.new_build,
        new_build_label: source.new_build_label,
        estate_type: source.estate_type,
        estate_type_label: source.estate_type_label,
        transaction_category: source.transaction_category,
        transaction_category_label: source.transaction_category_label,
        
        // Enhanced EPC data
        epc_bedrooms: source.epc_bedrooms,
        epc_size: source.epc_size,
        epc_rating: source.epc_rating,
        match_type: source.match_type,
        match_confidence: source.match_confidence,
        match_score: source.match_score,
        has_epc: source.has_epc,
        energy_efficient: source.energy_efficient,
        
        // Enhanced HPI data
        hpi_value: source.hpi_value,
        hpi_region: source.hpi_region,
        hpi_date: source.hpi_date,
        has_hpi: source.has_hpi,
        
        // Computed fields
        year: source.year,
        month: source.month,
        price_range: source.price_range,
        
        // Additional address fields
        paon: source.paon,
        saon: source.saon,
        street: source.street,
        locality: source.locality,
        town_city: source.town_city,
        district: source.district,
        county: source.county
      };
    });

    return NextResponse.json({
      success: true,
      total: response.hits.total.value,
      results: results,
      query: searchBody.query
    });

  } catch (error) {
    console.error('Enhanced search POST error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 