const fs = require('fs');
const fetch = require('node-fetch').default;
const path = require('path');

const SPARQL_ENDPOINT = 'https://landregistry.data.gov.uk/landregistry/query';
const QUERY = `
PREFIX ukhpi: <http://landregistry.data.gov.uk/def/ukhpi/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?regionLabel ?date ?hpiIndex
WHERE {
  ?item ukhpi:refRegion ?region ;
        ukhpi:refMonth ?date ;
        ukhpi:housePriceIndex ?hpiIndex .
  ?region rdfs:label ?regionLabel .
}
ORDER BY ?regionLabel ?date
`;

async function fetchHpiRegionsCsv() {
  const url = SPARQL_ENDPOINT + '?query=' + encodeURIComponent(QUERY);
  const res = await fetch(url, {
    headers: { 'Accept': 'text/csv' }
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  const csv = await res.text();
  const outPath = path.join(__dirname, '../data/hpi-regions.csv');
  fs.writeFileSync(outPath, csv);
  console.log('✅ Downloaded regional HPI data to data/hpi-regions.csv');
}

if (require.main === module) {
  fetchHpiRegionsCsv().catch(err => {
    console.error('❌ Failed to fetch HPI regional data:', err);
    process.exit(1);
  });
} 