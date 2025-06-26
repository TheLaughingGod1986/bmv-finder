import { NextRequest, NextResponse } from 'next/server';

// Property type mapping
const PROPERTY_TYPES = {
  'http://landregistry.data.gov.uk/def/common/detached': 'Detached',
  'http://landregistry.data.gov.uk/def/common/semi-detached': 'Semi-detached', 
  'http://landregistry.data.gov.uk/def/common/terraced': 'Terraced',
  'http://landregistry.data.gov.uk/def/common/flat-maisonette': 'Flat/Maisonette',
  'http://landregistry.data.gov.uk/def/common/other': 'Other'
};

// Estate type mapping
const ESTATE_TYPES = {
  'http://landregistry.data.gov.uk/def/common/freehold': 'Freehold',
  'http://landregistry.data.gov.uk/def/common/leasehold': 'Leasehold'
};

// New build mapping
const NEW_BUILD_TYPES = {
  'true': 'Yes',
  'false': 'No'
};

export async function POST(req: NextRequest) {
  const { postcode } = await req.json();
  
  if (!postcode) {
    return NextResponse.json({ error: 'Postcode is required' }, { status: 400 });
  }

  // Normalize input: remove spaces and uppercase
  const normalizedInput = postcode.replace(/\s+/g, '').toUpperCase();

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
      LIMIT 1000
    `;

    console.log('Querying Land Registry API for postcode:', postcode);

    const response = await fetch('https://landregistry.data.gov.uk/landregistry/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/sparql-results+json'
      },
      body: sparqlQuery
    });

    if (!response.ok) {
      throw new Error(`Land Registry API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Land Registry API response:', JSON.stringify(data, null, 2));
    
    // Transform SPARQL results to our format
    const results = data.results.bindings.map((binding: {
      transactionId?: { value: string };
      pricePaid?: { value: string };
      transactionDate?: { value: string };
      postcode?: { value: string };
      propertyType?: { value: string };
      newBuild?: { value: string };
      estateType?: { value: string };
      paon?: { value: string };
      saon?: { value: string };
      street?: { value: string };
      locality?: { value: string };
      town?: { value: string };
      district?: { value: string };
      county?: { value: string };
    }) => ({
      transactionId: binding.transactionId?.value || '',
      price: parseInt(binding.pricePaid?.value || '0') || 0,
      dateOfTransfer: binding.transactionDate?.value || '',
      postcode: binding.postcode?.value || '',
      propertyType: PROPERTY_TYPES[binding.propertyType?.value as keyof typeof PROPERTY_TYPES] || 'Other',
      propertyTypeCode: binding.propertyType?.value || '',
      newBuild: NEW_BUILD_TYPES[binding.newBuild?.value as keyof typeof NEW_BUILD_TYPES] || binding.newBuild?.value || '',
      newBuildCode: binding.newBuild?.value || '',
      estateType: ESTATE_TYPES[binding.estateType?.value as keyof typeof ESTATE_TYPES] || binding.estateType?.value || '',
      estateTypeCode: binding.estateType?.value || '',
      paon: binding.paon?.value || '',
      saon: binding.saon?.value || '',
      street: binding.street?.value || '',
      locality: binding.locality?.value || '',
      town: binding.town?.value || '',
      district: binding.district?.value || '',
      county: binding.county?.value || '',
      // Add formatted address
      fullAddress: [
        binding.paon?.value || '',
        binding.saon?.value || '',
        binding.street?.value || '',
        binding.locality?.value || '',
        binding.town?.value || '',
        binding.postcode?.value || ''
      ].filter(Boolean).join(', ')
    }));

    return NextResponse.json({ 
      data: results, 
      totalFound: results.length,
      source: 'Land Registry SPARQL API',
      query: postcode,
      note: results.length === 0 ? 'No properties found. The Land Registry API may require full postcodes (e.g., "OX3 0JA" instead of "OX3").' : null
    });

  } catch (error) {
    console.error('Error fetching from Land Registry API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch property data from Land Registry',
      details: error instanceof Error ? error.message : 'Unknown error',
      note: 'The Land Registry API may be temporarily unavailable or the postcode format may need adjustment.'
    }, { status: 500 });
  }
} 