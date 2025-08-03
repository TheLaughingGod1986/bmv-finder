// Debug script for price extraction
// Run this in the browser console on a Rightmove or Zoopla property page

console.log('🔍 BMV Finder: Price Extraction Debug Script');

function debugPriceExtraction() {
  console.log('🔍 Starting price extraction debug...');
  
  const hostname = window.location.hostname;
  console.log('📍 Hostname:', hostname);
  
  // Test all possible price selectors
  const allPriceSelectors = [
    // Rightmove specific
    '[data-testid="price"]',
    '.propertyCard-priceValue',
    '[class*="price"]',
    'h1 + div',
    '.listing-price',
    '.property-price',
    '[data-testid="property-price"]',
    '.property-header-price',
    '.price',
    '[data-testid="price-value"]',
    '.propertyCard-price',
    '.property-header__price',
    '.property-details__price',
    '.price-display',
    '.property-price-value',
    // Zoopla specific
    '.css-1tppcjb',
    '.css-1tppcjb-Text',
    '.css-1tppcjb-Text--price',
    '.css-1tppcjb-Text--large',
    '.css-1tppcjb-Text--bold',
    // Generic
    '[class*="Price"]',
    '[class*="price"]',
    '[class*="value"]',
    '[class*="Value"]',
    // Text-based
    'span',
    'div',
    'p',
    'h1',
    'h2',
    'h3'
  ];
  
  console.log('🔍 Testing', allPriceSelectors.length, 'selectors...');
  
  const foundElements = [];
  
  allPriceSelectors.forEach((selector, index) => {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`✅ Selector ${index + 1}: "${selector}" - Found ${elements.length} elements`);
        
        elements.forEach((element, elemIndex) => {
          const text = element.textContent.trim();
          const hasPrice = text.includes('£');
          const priceMatch = text.match(/£([\d,]+)/);
          
          if (hasPrice || priceMatch) {
            foundElements.push({
              selector: selector,
              elementIndex: elemIndex,
              text: text.substring(0, 100),
              hasPrice: hasPrice,
              priceMatch: priceMatch ? priceMatch[0] : null,
              element: element
            });
            
            console.log(`   💰 Element ${elemIndex}: "${text.substring(0, 50)}..." ${hasPrice ? '✅ HAS PRICE' : ''} ${priceMatch ? `(${priceMatch[0]})` : ''}`);
          }
        });
      }
    } catch (error) {
      console.log(`❌ Selector ${index + 1}: "${selector}" - Error:`, error.message);
    }
  });
  
  console.log('🔍 Summary of price-containing elements:');
  foundElements.forEach((item, index) => {
    console.log(`${index + 1}. Selector: "${item.selector}" - Text: "${item.text}" - Price: ${item.priceMatch || 'None'}`);
  });
  
  // Test page text extraction
  console.log('🔍 Testing page text extraction...');
  const pageText = document.body.textContent;
  const priceMatches = pageText.match(/£[\d,]+/g);
  
  if (priceMatches) {
    console.log('💰 Found price patterns in page text:', priceMatches);
    
    // Filter reasonable property prices
    const prices = priceMatches
      .map(p => parseInt(p.replace(/[£,]/g, '')))
      .filter(p => p > 10000 && p < 10000000);
    
    console.log('💰 Filtered reasonable prices:', prices);
    
    if (prices.length > 0) {
      const maxPrice = Math.max(...prices);
      console.log('💰 Largest reasonable price found:', maxPrice);
    }
  }
  
  // Test specific patterns
  const patterns = [
    /Offers Over £([\d,]+)/i,
    /Guide Price £([\d,]+)/i,
    /Asking Price £([\d,]+)/i,
    /Price £([\d,]+)/i,
    /£([\d,]+) Offers Over/i,
    /£([\d,]+) Guide Price/i,
    /£([\d,]+)/g
  ];
  
  console.log('🔍 Testing specific patterns...');
  patterns.forEach(pattern => {
    const matches = pageText.match(pattern);
    if (matches) {
      console.log(`✅ Pattern ${pattern}:`, matches);
    }
  });
  
  return foundElements;
}

// Auto-run the debug function
const results = debugPriceExtraction();

// Make it available globally for manual testing
window.bmvDebugPriceExtraction = debugPriceExtraction;
window.bmvDebugResults = results;

console.log('🔍 Debug complete! Use window.bmvDebugPriceExtraction() to run again.');
console.log('🔍 Results available at window.bmvDebugResults'); 