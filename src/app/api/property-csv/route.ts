import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

export async function POST(req: NextRequest) {
  const { postcode, page = 1, pageSize = 20 } = await req.json();
  
  if (!postcode) {
    return NextResponse.json({ error: 'Postcode is required' }, { status: 400 });
  }

  // Normalize input: remove spaces and uppercase
  const normalizedInput = postcode.replace(/\s/g, '').toUpperCase();

  // Pagination
  const limit = Math.max(1, Math.min(pageSize, 100)); // Max 100 per page
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
    // SPARQL query to get property data from Land Registry
    const sparqlQuery = `
      PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
      PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
      
      SELECT ?paon ?saon ?street ?locality ?town ?district ?county ?postcode ?pricePaid ?transactionDate ?propertyType ?newBuild ?estateType ?transactionId
      WHERE {
        ?addr lrcommon:postcode ?postcode .
        FILTER STRSTARTS(REPLACE(UCASE(?postcode), " ", ""), UCASE("${normalizedInput}"))
        ?transx lrppi:propertyAddress ?addr ;
                lrppi:pricePaid ?pricePaid ;
                lrppi:transactionDate ?transactionDate ;
                lrppi:propertyType ?propertyType ;
                lrppi:newBuild ?newBuild ;
                lrppi:estateType ?estateType ;
                lrppi:transactionId ?transactionId .
        
        ?addr lrcommon:paon ?paon .
        OPTIONAL { ?addr lrcommon:saon ?saon . }
        ?addr lrcommon:street ?street .
        OPTIONAL { ?addr lrcommon:locality ?locality . }
        ?addr lrcommon:town ?town .
        ?addr lrcommon:district ?district .
        ?addr lrcommon:county ?county .
      }
      ORDER BY DESC(?transactionDate)
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `;

    const response = await fetch('https://landregistry.data.gov.uk/landregistry/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/sparql-results+json'
      },
      body: sparqlQuery
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Land Registry API error:', response.status, response.statusText, errorText);
      console.error('SPARQL Query:', sparqlQuery);
      // If 503 and cache exists, serve stale cache
      if (response.status === 503 && cache.has(cacheKey)) {
        const { data } = cache.get(cacheKey)!;
        return NextResponse.json({ data, page, pageSize: limit, cache: 'stale', warning: 'Land Registry API is rate limited. Showing cached results.' });
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

    return NextResponse.json({ data: properties, page, pageSize: limit, hasMore });

  } catch (error) {
    // On error, serve stale cache if available
    if (cache.has(cacheKey)) {
      const { data } = cache.get(cacheKey)!;
      return NextResponse.json({ data, page, pageSize: limit, cache: 'stale', warning: 'Land Registry API is unavailable. Showing cached results.' });
    }
    console.error('Error fetching property data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property data', details: String(error) },
      { status: 500 }
    );
  }
} 