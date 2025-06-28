import { NextRequest, NextResponse } from 'next/server';

// Define proper types for cache data
interface CacheData {
  data: Array<{
    id: string;
    price: number;
    dateOfTransfer: string;
    postcode: string;
    propertyType: string;
    street: string;
    town_city: string;
    county: string;
    paon: string;
    saon: string;
    duration: string;
    old_new: string;
    locality: string;
    ppd_category_type: string;
    record_status: string;
  }>;
  timestamp: number;
}

// Simple in-memory cache
const cache = new Map<string, CacheData>();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

// Retry configuration
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000; // 30 seconds timeout

// Helper function to fetch with timeout and retries
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch {
      if (i === retries) throw new Error('Max retries exceeded');
      // Exponential backoff: wait 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(req: NextRequest) {
  const { postcode, page = 1, pageSize = 20 } = await req.json();
  
  if (!postcode) {
    return NextResponse.json({ error: 'Postcode is required' }, { status: 400 });
  }

  // Normalize input: remove spaces and uppercase
  const normalizedInput = postcode.replace(/\s/g, '').toUpperCase();

  // Pagination
  const limit = Math.max(1, Math.min(pageSize, 50)); // Reduced max to 50 for better performance
  const offset = (Math.max(1, page) - 1) * limit;

  // Check cache first (cache key includes page/size)
  const cacheKey = `${normalizedInput}|${page}|${limit}`;
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey)!;
    if (Date.now() - timestamp < CACHE_TTL) {
      return NextResponse.json({ data, page, pageSize: limit, cache: true });
    }
  }

  try {
    // Optimized SPARQL query - more efficient and less likely to timeout
    const sparqlQuery = `
      PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
      PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      
      SELECT ?paon ?saon ?street ?locality ?town ?district ?county ?postcode ?pricePaid ?transactionDate ?propertyType ?newBuild ?estateType ?transactionId
      WHERE {
        ?transx lrppi:propertyAddress ?addr ;
                lrppi:pricePaid ?pricePaid ;
                lrppi:transactionDate ?transactionDate .
        
        ?addr lrcommon:postcode ?postcode .
        FILTER STRSTARTS(REPLACE(UCASE(?postcode), " ", ""), UCASE("${normalizedInput}"))
        FILTER (?transactionDate >= "2015-01-01"^^xsd:date)
        
        OPTIONAL { ?transx lrppi:propertyType ?propertyType . }
        OPTIONAL { ?transx lrppi:newBuild ?newBuild . }
        OPTIONAL { ?transx lrppi:estateType ?estateType . }
        OPTIONAL { ?transx lrppi:transactionId ?transactionId . }
        OPTIONAL { ?addr lrcommon:paon ?paon . }
        OPTIONAL { ?addr lrcommon:saon ?saon . }
        OPTIONAL { ?addr lrcommon:street ?street . }
        OPTIONAL { ?addr lrcommon:locality ?locality . }
        OPTIONAL { ?addr lrcommon:town ?town . }
        OPTIONAL { ?addr lrcommon:district ?district . }
        OPTIONAL { ?addr lrcommon:county ?county . }
      }
      ORDER BY DESC(?transactionDate)
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `;

    // Fallback query for when main query fails
    const fallbackQuery = `
      PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
      PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
      
      SELECT ?paon ?saon ?street ?locality ?town ?district ?county ?postcode ?pricePaid ?transactionDate ?propertyType ?newBuild ?estateType ?transactionId
      WHERE {
        ?transx lrppi:propertyAddress ?addr ;
                lrppi:pricePaid ?pricePaid ;
                lrppi:transactionDate ?transactionDate .
        
        ?addr lrcommon:postcode ?postcode .
        FILTER STRSTARTS(REPLACE(UCASE(?postcode), " ", ""), UCASE("${normalizedInput}"))
        
        OPTIONAL { ?transx lrppi:propertyType ?propertyType . }
        OPTIONAL { ?transx lrppi:newBuild ?newBuild . }
        OPTIONAL { ?transx lrppi:estateType ?estateType . }
        OPTIONAL { ?transx lrppi:transactionId ?transactionId . }
        OPTIONAL { ?addr lrcommon:paon ?paon . }
        OPTIONAL { ?addr lrcommon:saon ?saon . }
        OPTIONAL { ?addr lrcommon:street ?street . }
        OPTIONAL { ?addr lrcommon:locality ?locality . }
        OPTIONAL { ?addr lrcommon:town ?town . }
        OPTIONAL { ?addr lrcommon:district ?district . }
        OPTIONAL { ?addr lrcommon:county ?county . }
      }
      ORDER BY DESC(?transactionDate)
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `;

    let response: Response;
    let usedFallback = false;

    try {
      // Try main query first
      response = await fetchWithRetry('https://landregistry.data.gov.uk/landregistry/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sparql-query',
          'Accept': 'application/sparql-results+json'
        },
        body: sparqlQuery
      });
    } catch {
      console.log('Main query failed, trying fallback query...');
      usedFallback = true;
      response = await fetchWithRetry('https://landregistry.data.gov.uk/landregistry/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sparql-query',
          'Accept': 'application/sparql-results+json'
        },
        body: fallbackQuery
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Land Registry API error:', response.status, response.statusText, errorText);
      console.error('SPARQL Query:', usedFallback ? fallbackQuery : sparqlQuery);
      
      // If 503 and cache exists, serve stale cache
      if (response.status === 503 && cache.has(cacheKey)) {
        const { data } = cache.get(cacheKey)!;
        return NextResponse.json({ 
          data, 
          page, 
          pageSize: limit, 
          cache: 'stale', 
          warning: 'Land Registry API is rate limited. Showing cached results.' 
        });
      }
      throw new Error(`Land Registry API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.results || !data.results.bindings) {
      return NextResponse.json({ data: [], page, pageSize: limit });
    }

    // Check if there are more results
    const hasMore = data.results.bindings.length > limit;
    const bindings = hasMore ? data.results.bindings.slice(0, limit) : data.results.bindings;

    const properties = bindings.map((binding: Record<string, { value: string }>) => ({
      id: binding.transactionId?.value || '',
      price: parseInt(binding.pricePaid?.value || '0'),
      dateOfTransfer: binding.transactionDate?.value?.split('T')[0] || '',
      postcode: binding.postcode?.value || '',
      propertyType: binding.propertyType?.value?.split('/').pop() || '',
      street: binding.street?.value || '',
      town_city: binding.town?.value || '',
      county: binding.county?.value || '',
      paon: binding.paon?.value || '',
      saon: binding.saon?.value || '',
      duration: binding.estateType?.value?.split('/').pop() || '',
      old_new: binding.newBuild?.value?.split('/').pop() || '',
      locality: binding.locality?.value || '',
      ppd_category_type: 'A',
      record_status: 'A'
    }));

    // Set cache
    cache.set(cacheKey, { data: properties, timestamp: Date.now() });

    return NextResponse.json({ 
      data: properties, 
      page, 
      pageSize: limit, 
      hasMore,
      usedFallback 
    });

  } catch (error) {
    // On error, serve stale cache if available
    if (cache.has(cacheKey)) {
      const { data } = cache.get(cacheKey)!;
      return NextResponse.json({ 
        data, 
        page, 
        pageSize: limit, 
        cache: 'stale', 
        warning: 'Land Registry API is unavailable. Showing cached results.' 
      });
    }
    console.error('Error fetching property data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property data', details: String(error) },
      { status: 500 }
    );
  }
} 