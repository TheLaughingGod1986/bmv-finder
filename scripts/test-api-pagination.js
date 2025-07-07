const fetch = require('node-fetch').default;

async function testAPIPagination() {
  const baseURL = 'http://localhost:3002';
  const searchTerm = 'SS9 5EL';
  const pageSize = 5;
  
  console.log(`Testing API search_after pagination for: ${searchTerm}`);
  console.log('='.repeat(50));

  try {
    // First page
    console.log('\n📄 Page 1:');
    const page1Response = await fetch(`${baseURL}/api/property-es`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchTerm,
        page: 1,
        pageSize
      })
    });

    if (!page1Response.ok) {
      throw new Error(`HTTP error! status: ${page1Response.status}`);
    }

    const page1Data = await page1Response.json();
    console.log(`Found ${page1Data.data.length} properties`);
    console.log(`Total count: ${page1Data.totalCount}`);
    console.log(`Has more: ${page1Data.hasMore}`);
    console.log(`Next search after:`, page1Data.nextSearchAfter);
    
    page1Data.data.forEach((property, i) => {
      console.log(`  ${i + 1}. ${property.paon} ${property.street} - £${property.price.toLocaleString()}`);
    });

    if (page1Data.nextSearchAfter && page1Data.hasMore) {
      // Second page
      console.log('\n📄 Page 2:');
      const page2Response = await fetch(`${baseURL}/api/property-es`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTerm,
          page: 2,
          pageSize,
          searchAfter: page1Data.nextSearchAfter
        })
      });

      if (!page2Response.ok) {
        throw new Error(`HTTP error! status: ${page2Response.status}`);
      }

      const page2Data = await page2Response.json();
      console.log(`Found ${page2Data.data.length} properties`);
      console.log(`Has more: ${page2Data.hasMore}`);
      console.log(`Next search after:`, page2Data.nextSearchAfter);
      
      page2Data.data.forEach((property, i) => {
        console.log(`  ${i + 1}. ${property.paon} ${property.street} - £${property.price.toLocaleString()}`);
      });
      
      // Verify no duplicates between pages
      const page1Addresses = page1Data.data.map(p => `${p.paon} ${p.street}`.toLowerCase());
      const page2Addresses = page2Data.data.map(p => `${p.paon} ${p.street}`.toLowerCase());
      const duplicates = page1Addresses.filter(addr => page2Addresses.includes(addr));
      
      console.log('\n✅ Verification:');
      console.log(`Page 1 addresses: ${page1Addresses.length}`);
      console.log(`Page 2 addresses: ${page2Addresses.length}`);
      console.log(`Duplicates between pages: ${duplicates.length}`);
      
      if (duplicates.length === 0) {
        console.log('✅ SUCCESS: No duplicates between pages!');
      } else {
        console.log('❌ FAILURE: Found duplicates between pages!');
        console.log('Duplicates:', duplicates);
      }
    } else {
      console.log('No more pages available');
    }

  } catch (error) {
    console.error('Error testing API pagination:', error);
  }
}

testAPIPagination().catch(console.error); 