// Test script for BMV Finder Extension
console.log('BMV Finder: Test script loaded');

// Test function to simulate property data extraction
function testPropertyExtraction() {
  console.log('BMV Finder: Testing property extraction...');
  
  // Simulate Rightmove property data
  const testPropertyData = {
    title: 'Test Property',
    price: '£395,000',
    address: 'Mandarin Close, Chapel Park, Newcastle upon Tyne, Tyne and Wear, NE5 1YP',
    source: 'rightmove.co.uk',
    original_url: 'https://rightmove.co.uk/properties/test',
    captured_at: new Date().toISOString()
  };
  
  console.log('BMV Finder: Test property data:', testPropertyData);
  
  // Test sending to background script
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      action: 'captureProperty',
      data: testPropertyData
    }, function(response) {
      console.log('BMV Finder: Test response:', response);
      if (response && response.success) {
        console.log('BMV Finder: ✅ Test successful!');
        alert('Extension test successful! Check console for details.');
      } else {
        console.log('BMV Finder: ❌ Test failed!');
        alert('Extension test failed! Check console for details.');
      }
    });
  } else {
    console.log('BMV Finder: Chrome runtime not available');
    alert('Chrome runtime not available - make sure this is running in the extension context');
  }
}

// Test function to check if we're on a property page
function testPropertyPageDetection() {
  console.log('BMV Finder: Testing property page detection...');
  
  const hostname = window.location.hostname;
  const url = window.location.href;
  
  console.log('BMV Finder: Current hostname:', hostname);
  console.log('BMV Finder: Current URL:', url);
  
  const propertySites = [
    'rightmove.co.uk',
    'zoopla.co.uk', 
    'onthemarket.com',
    'primelocation.com'
  ];
  
  const isPropertySite = propertySites.some(site => hostname.includes(site));
  console.log('BMV Finder: Is property site:', isPropertySite);
  
  const propertyPatterns = [
    /\/properties\//,
    /\/property\//,
    /\/for-sale\//,
    /\/to-rent\//,
    /\/buy\//,
    /\/rent\//
  ];
  
  const hasPropertyUrl = propertyPatterns.some(pattern => pattern.test(url));
  console.log('BMV Finder: Has property URL pattern:', hasPropertyUrl);
  
  const isPropertyPage = isPropertySite && hasPropertyUrl;
  console.log('BMV Finder: Is property page:', isPropertyPage);
  
  return isPropertyPage;
}

// Test function to check DOM elements
function testDOMExtraction() {
  console.log('BMV Finder: Testing DOM extraction...');
  
  // Test price extraction
  const priceSelectors = [
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
    '.property-price-value'
  ];
  
  console.log('BMV Finder: Testing price selectors...');
  priceSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log('BMV Finder: Found', elements.length, 'elements for selector:', selector);
      elements.forEach((element, index) => {
        const text = element.textContent.substring(0, 100);
        console.log('BMV Finder: Element', index, 'text:', text);
      });
    }
  });
  
  // Test title extraction
  const titleSelectors = [
    'h1',
    '[data-testid="property-title"]',
    '.propertyCard-title',
    '[class*="title"]',
    '.listing-title',
    '[data-testid="address"]',
    '.property-header__title',
    '.property-details__title',
    '.property-title',
    '.address',
    '.property-address',
    '.property-header__address',
    '.property-details__address'
  ];
  
  console.log('BMV Finder: Testing title selectors...');
  titleSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log('BMV Finder: Found', elements.length, 'elements for selector:', selector);
      elements.forEach((element, index) => {
        const text = element.textContent.substring(0, 100);
        console.log('BMV Finder: Element', index, 'text:', text);
      });
    }
  });
}

// Add test functions to window for easy access
window.bmvFinderTest = {
  testPropertyExtraction,
  testPropertyPageDetection,
  testDOMExtraction
};

console.log('BMV Finder: Test functions available at window.bmvFinderTest');
console.log('BMV Finder: Run bmvFinderTest.testPropertyExtraction() to test the extension');
console.log('BMV Finder: Run bmvFinderTest.testPropertyPageDetection() to test page detection');
console.log('BMV Finder: Run bmvFinderTest.testDOMExtraction() to test DOM extraction'); 