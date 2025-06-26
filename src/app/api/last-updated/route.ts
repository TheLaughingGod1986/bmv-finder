import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const LAND_REGISTRY_SPARQL_ENDPOINT = 'https://landregistry.data.gov.uk/landregistry/query';

async function fetchLatestTransactionDate(): Promise<string | null> {
  const sparqlQuery = `
    PREFIX ppi: <http://landregistry.data.gov.uk/def/ppi/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    
    SELECT (MAX(?date) AS ?latestDate)
    WHERE {
      ?transaction a ppi:TransactionRecord ;
                   ppi:transactionDate ?date .
    }
  `;

  try {
    const response = await fetch(LAND_REGISTRY_SPARQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/sparql-results+json',
      },
      body: sparqlQuery,
    });

    if (!response.ok) {
      throw new Error(`SPARQL request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.results?.bindings?.length > 0) {
      const latestDate = data.results.bindings[0].latestDate?.value;
      if (latestDate) {
        return latestDate;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching latest transaction date from Land Registry:', error);
    return null;
  }
}

export async function GET() {
  try {
    const latestDate = await fetchLatestTransactionDate();
    
    if (latestDate) {
      return NextResponse.json({ 
        lastUpdated: latestDate,
        source: 'Land Registry SPARQL API'
      });
    } else {
      // Fallback to current date if we can't fetch from Land Registry
      return NextResponse.json({ 
        lastUpdated: new Date().toISOString(),
        source: 'fallback',
        note: 'Could not fetch from Land Registry API'
      });
    }
  } catch (error) {
    console.error('Error in last-updated API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch last updated timestamp',
        lastUpdated: new Date().toISOString(),
        source: 'error-fallback'
      },
      { status: 500 }
    );
  }
} 