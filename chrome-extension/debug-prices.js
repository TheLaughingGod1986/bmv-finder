// Debug script to find all prices on Zoopla page
function debugAllPrices() {
  console.log('=== BMV Finder: Debugging All Prices on Page ===');
  
  // Get all text content from the page
  const pageText = document.body.textContent;
  
  // Find all price patterns
  const priceMatches = pageText.match(/£[\d,]+/g);
  
  if (priceMatches) {
    console.log('All price matches found:', priceMatches);
    
    // Convert to numbers and show details
    const priceDetails = priceMatches.map(price => {
      const value = parseInt(price.replace(/[£,]/g, ''));
      return {
        original: price,
        value: value,
        reasonable: value > 10000 && value < 10000000
      };
    });
    
    console.log('Price details:', priceDetails);
    
    // Show reasonable prices
    const reasonablePrices = priceDetails.filter(p => p.reasonable);
    console.log('Reasonable property prices:', reasonablePrices);
    
    // Show the highest price
    if (reasonablePrices.length > 0) {
      const highest = reasonablePrices.reduce((max, p) => p.value > max.value ? p : max);
      console.log('Highest reasonable price:', highest);
    }
  }
  
  // Also check specific elements
  console.log('=== Checking Specific Elements ===');
  
  const selectors = [
    '[data-testid="price"]',
    '[data-testid="price-value"]',
    '.css-1tppcjb',
    '.css-1tppcjb-Text',
    'h1',
    'h2',
    'h3',
    'span',
    'div'
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`Selector "${selector}": ${elements.length} elements`);
    
    elements.forEach((el, index) => {
      const text = el.textContent.trim();
      if (text.includes('£')) {
        console.log(`  ${selector}[${index}]: "${text.substring(0, 100)}"`);
      }
    });
  });
}

// Run the debug function
debugAllPrices(); 