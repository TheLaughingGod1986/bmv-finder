import { NextRequest, NextResponse } from 'next/server';

const LAND_REGISTRY_ENDPOINT = 'https://landregistry.data.gov.uk/app/qonsole/query';

async function fetchPropertyHistory(propertyDetails: {
  postcode: string;
  street: string;
  paon: string;
  saon?: string;
}) {
  const { postcode, street, paon, saon } = propertyDetails;
  
  // Build SPARQL query to get all sales for this specific property
  const sparqlQuery = `
    PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
    PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    
    SELECT ?paon ?saon ?street ?locality ?town ?district ?county ?postcode ?pricePaid ?transactionDate ?propertyType ?newBuild ?estateType ?transactionId
    WHERE {
      ?addr lrcommon:postcode ?postcode ;
            lrcommon:street ?street ;
            lrcommon:paon ?paon .
      ${saon ? '?addr lrcommon:saon ?saon .' : 'OPTIONAL { ?addr lrcommon:saon ?saon . }'}
      OPTIONAL { ?addr lrcommon:locality ?locality . }
      OPTIONAL { ?addr lrcommon:town ?town . }
      OPTIONAL { ?addr lrcommon:district ?district . }
      OPTIONAL { ?addr lrcommon:county ?county . }
      
      ?transx lrppi:propertyAddress ?addr ;
              lrppi:pricePaid ?pricePaid ;
              lrppi:transactionDate ?transactionDate .
      OPTIONAL { ?transx lrppi:propertyType ?propertyType . }
      OPTIONAL { ?transx lrppi:newBuild ?newBuild . }
      OPTIONAL { ?transx lrppi:estateType ?estateType . }
      OPTIONAL { ?transx lrppi:transactionId ?transactionId . }
      
      FILTER (
        UCASE(?postcode) = UCASE("${postcode}") &&
        UCASE(?street) = UCASE("${street}") &&
        UCASE(?paon) = UCASE("${paon}")
        ${saon ? `&& UCASE(?saon) = UCASE("${saon}")` : ''}
      )
    }
    ORDER BY ASC(?transactionDate)
  `;

  try {
    const response = await fetch(LAND_REGISTRY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json',
      },
      body: new URLSearchParams({
        'query': sparqlQuery,
        'output': 'json',
        'stylesheet': '',
        'inference': 'true',
        'sameAs': 'false',
        'should-sponge': 'soft'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Land Registry property history error:', response.status, response.statusText, errorText);
      throw new Error(`SPARQL request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the results to match our SoldPrice format
    const results = data.results.bindings.map((binding: Record<string, { value: string }>) => ({
      id: binding.transactionId?.value || `${binding.paon?.value}-${binding.street?.value}-${binding.postcode?.value}-${binding.transactionDate?.value}`,
      paon: binding.paon?.value || '',
      saon: binding.saon?.value || '',
      street: binding.street?.value || '',
      locality: binding.locality?.value || '',
      town_city: binding.town?.value || '',
      county: binding.county?.value || '',
      district: binding.district?.value || '',
      postcode: binding.postcode?.value || '',
      price: parseInt(binding.pricePaid?.value || '0'),
      dateOfTransfer: binding.transactionDate?.value || '',
      propertyType: binding.propertyType?.value || '',
      newBuild: binding.newBuild?.value || '',
      estateType: binding.estateType?.value || '',
      duration: binding.estateType?.value === 'F' ? 'F' : 'L', // Default to Leasehold if not specified
      old_new: binding.newBuild?.value === 'Y' ? 'Y' : 'N',
      ppd_category_type: 'A', // Standard category
      record_status: 'A', // Standard status
    }));

    return results;
  } catch (error) {
    console.error('Error fetching property history:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postcode, street, paon, saon } = body;

    if (!postcode || !street || !paon) {
      return NextResponse.json(
        { error: 'Missing required property details' },
        { status: 400 }
      );
    }

    const history = await fetchPropertyHistory({ postcode, street, paon, saon });
    
    return NextResponse.json({ data: history });
  } catch (error) {
    console.error('Property history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property history' },
      { status: 500 }
    );
  }
} 