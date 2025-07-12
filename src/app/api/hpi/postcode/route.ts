import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';
import axios from 'axios';
import { postcodeToRegion } from '../../../../utils/postcodeToRegion';
import { hpiCache, cacheKeys, CACHE_TTL } from '@/lib/cache';
import { withRateLimit } from '@/lib/rateLimiter';
import ElasticsearchOptimizer from '@/lib/elasticsearchOptimizer';

const INDEX_NAME = 'house_price_index';
const LAND_REGISTRY_API_BASE = 'https://landregistry.data.gov.uk/data/ppi/';

// Search HPI by postcode (Elasticsearch)
async function searchHpiByPostcode(postcode: string) {
  const result = await esClient.search({
    index: INDEX_NAME,
    size: 100,
    body: {
      query: {
        term: { postcode: postcode },
      },
      sort: [
        { date: { order: 'desc' } },
      ],
    },
  });
  const hits = result.hits.hits;
  return hits.map((hit: any) => hit._source);
}

// Search HPI by region (Elasticsearch)
async function searchHpiByRegion(region: string) {
  const result = await esClient.search({
    index: INDEX_NAME,
    size: 100,
    body: {
      query: {
        term: { region: region },
      },
      sort: [
        { date: { order: 'desc' } },
      ],
    },
  });
  const hits = result.hits.hits;
  return hits.map((hit: any) => hit._source);
}

// Fetch HPI from Land Registry API
async function fetchHpiFromLandRegistry(postcode: string) {
  try {
    const response = await axios.get(`${LAND_REGISTRY_API_BASE}transaction-record.json`, {
      params: {
        postcode: postcode,
      },
      timeout: 30000,
    });
    if (!response.data || !response.data.result || !response.data.result.items) {
      console.log(`No data returned from Land Registry API for postcode: ${postcode}`);
      return [];
    }
    const transactions = response.data.result.items;
    console.log(`Found ${transactions.length} transactions from Land Registry API for ${postcode}`);
    if (transactions.length === 0) {
      return [];
    }
    return transactions.map((transaction: any) => {
      const dateOfTransfer = transaction['http://landregistry.data.gov.uk/def/ppi/dateOfTransfer']?.[0]?.['@value'];
      const pricePaid = transaction['http://landregistry.data.gov.uk/def/ppi/pricePaid']?.[0]?.['@value'];
      const propertyType = transaction['http://landregistry.data.gov.uk/def/ppi/propertyType']?.[0]?.['@value'];
      let date = new Date();
      if (dateOfTransfer) {
        date = new Date(dateOfTransfer);
      }
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      return {
        region: 'Unknown',
        regionCode: '',
        date: `${year}-${month.toString().padStart(2, '0')}`,
        year: year,
        month: month,
        index: parseFloat(pricePaid) || 0,
        postcode: postcode,
        regionType: 'England',
        source: 'Land Registry API',
        lastUpdated: new Date().toISOString(),
        transactionId: transaction['@id'] || '',
        propertyType: propertyType || 'Unknown',
        pricePaid: parseFloat(pricePaid) || 0,
      };
    });
  } catch (error) {
    console.error('Error fetching from Land Registry API:', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postcode = searchParams.get('postcode');
    const regionParam = searchParams.get('region');
    const fetchApi = searchParams.get('fetchApi') !== 'false';

    // If region is provided, search by region
    if (regionParam) {
      const regionResults = await searchHpiByRegion(regionParam);
      if (regionResults.length > 0) {
        return NextResponse.json({ source: 'elasticsearch_region', results: regionResults });
      } else {
        return NextResponse.json({ error: 'No HPI data found for region', results: [] }, { status: 404 });
      }
    }

    // If postcode is provided, try postcode-level, then Land Registry, then region fallback
    if (postcode) {
      // 1. Try postcode-level HPI
      let results = await searchHpiByPostcode(postcode);
      if (results.length > 0) {
        return NextResponse.json({ source: 'elasticsearch_postcode', results });
      }
      // 2. Try Land Registry API
      if (fetchApi) {
        results = await fetchHpiFromLandRegistry(postcode);
        if (results.length > 0) {
          return NextResponse.json({ source: 'land_registry_api', results });
        }
      }
      // 3. Fallback to region HPI
      const region = postcodeToRegion(postcode);
      if (region && region !== 'United Kingdom') {
        results = await searchHpiByRegion(region);
        if (results.length > 0) {
          return NextResponse.json({ source: 'elasticsearch_region_fallback', region, results });
        }
      }
      return NextResponse.json({ error: 'No HPI data found for postcode or region', results: [] }, { status: 404 });
    }

    // If neither provided
    return NextResponse.json({ error: 'Missing postcode or region parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error in HPI search:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 