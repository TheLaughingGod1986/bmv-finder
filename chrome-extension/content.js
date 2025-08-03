console.log('BMV Finder: Content script loaded on:', window.location.href);

// Test functions for debugging
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
  testDOMExtraction
};

console.log('BMV Finder: Test functions available at window.bmvFinderTest');
console.log('BMV Finder: Run bmvFinderTest.testPropertyExtraction() to test the extension');
console.log('BMV Finder: Run bmvFinderTest.testDOMExtraction() to test DOM extraction');

// Check if we're on a property page
function isPropertyPage() {
  const hostname = window.location.hostname;
  const url = window.location.href;
  
  // Check for property sites
  const propertySites = [
    'rightmove.co.uk',
    'zoopla.co.uk', 
    'onthemarket.com',
    'primelocation.com'
  ];
  
  const isPropertySite = propertySites.some(site => hostname.includes(site));
  
  // Check for property URL patterns
  const propertyPatterns = [
    /\/properties\//,
    /\/property\//,
    /\/for-sale\//,
    /\/to-rent\//,
    /\/buy\//,
    /\/rent\//
  ];
  
  const hasPropertyUrl = propertyPatterns.some(pattern => pattern.test(url));
  
  console.log('BMV Finder: Property page check:', {
    hostname,
    url,
    isPropertySite,
    hasPropertyUrl,
    isPropertyPage: isPropertySite && hasPropertyUrl
  });
  
  return isPropertySite && hasPropertyUrl;
}

// Extract property data based on the site
function extractPropertyData() {
  const hostname = window.location.hostname;
  
  let propertyData = {
    title: document.title || 'Property',
    price: '£0',
    address: '',
    source: hostname,
    original_url: window.location.href,
    captured_at: new Date().toISOString()
  };
  
  // Zoopla extraction
  if (hostname.includes('zoopla.co.uk')) {
    console.log('BMV Finder: Extracting Zoopla data...');
    
    // Extract price - try multiple selectors
    const priceSelectors = [
      '[data-testid="price"]',
      '.css-1tppcjb',
      '[class*="price"]',
      'h1 + div',
      '.listing-price',
      '.property-price',
      '.css-1tppcjb',
      '.css-1tppcjb-Text',
      '[data-testid="price-value"]',
      '.property-price-value',
      '.price-display',
      '.listing-price-value',
      '.property-header__price',
      '.property-details__price',
      '.price-value',
      '.css-1tppcjb-Text',
      '.css-1tppcjb-Text--price',
      '.css-1tppcjb-Text--large',
      '.css-1tppcjb-Text--bold'
    ];
    
    for (const selector of priceSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log('BMV Finder: Found', elements.length, 'elements for Zoopla price selector:', selector);
      
      for (const element of elements) {
        const text = element.textContent;
        console.log('BMV Finder: Checking Zoopla price selector:', selector, 'Text:', text.substring(0, 100));
        const priceMatch = text.match(/£[\d,]+/);
        if (priceMatch) {
          propertyData.price = priceMatch[0];
          console.log('BMV Finder: Found Zoopla price:', propertyData.price);
          break;
        }
      }
      if (propertyData.price !== '£0') break;
    }
    
    // Extract address/title - try multiple selectors
    const titleSelectors = [
      'h1',
      '[data-testid="address"]',
      '.css-1tppcjb',
      '[class*="title"]',
      '.listing-title',
      '.css-1tppcjb-Text',
      '.css-1tppcjb-Text--title',
      '.property-title',
      '.property-address',
      '.listing-address',
      '.address',
      '.property-header__title',
      '.property-details__title',
      '.property-header__address',
      '.property-details__address',
      '.css-1tppcjb-Text--address'
    ];
    
    for (const selector of titleSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log('BMV Finder: Found', elements.length, 'elements for Zoopla title selector:', selector);
      
      for (const element of elements) {
        const text = element.textContent.trim();
        console.log('BMV Finder: Checking Zoopla title selector:', selector, 'Text:', text.substring(0, 100));
        if (text && text.length > 10 && text.length < 200 && !text.includes('Zoopla')) {
          propertyData.address = text;
          console.log('BMV Finder: Found Zoopla address:', propertyData.address);
          break;
        }
      }
      if (propertyData.address) break;
    }
  }
  
  // Rightmove extraction
  if (hostname.includes('rightmove.co.uk')) {
    console.log('BMV Finder: Extracting Rightmove data...');
    
    // Extract price - try multiple selectors
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
    
    for (const selector of priceSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log('BMV Finder: Found', elements.length, 'elements for selector:', selector);
      
      for (const element of elements) {
        const text = element.textContent;
        console.log('BMV Finder: Checking price selector:', selector, 'Text:', text.substring(0, 100));
        const priceMatch = text.match(/£[\d,]+/);
        if (priceMatch) {
          propertyData.price = priceMatch[0];
          console.log('BMV Finder: Found Rightmove price:', propertyData.price);
          break;
        }
      }
      if (propertyData.price !== '£0') break;
    }
    
    // Extract address/title - try multiple selectors
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
    
    for (const selector of titleSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log('BMV Finder: Found', elements.length, 'elements for title selector:', selector);
      
      for (const element of elements) {
        const text = element.textContent.trim();
        console.log('BMV Finder: Checking title selector:', selector, 'Text:', text.substring(0, 100));
        if (text && text.length > 10 && text.length < 200 && !text.includes('Rightmove')) {
          propertyData.address = text;
          console.log('BMV Finder: Found Rightmove address:', propertyData.address);
          break;
        }
      }
      if (propertyData.address) break;
    }
  }
  
  // Fallback: try to extract from page title
  if (!propertyData.address) {
    const title = document.title;
    if (title && (title.includes('for sale') || title.includes('to rent'))) {
      propertyData.address = title.replace(' - Rightmove', '').replace(' | Zoopla', '');
      console.log('BMV Finder: Using fallback title:', propertyData.address);
    }
  }
  
  // Fallback: try to extract price from any text on page
  if (propertyData.price === '£0') {
    console.log('BMV Finder: Trying fallback price extraction...');
    const pageText = document.body.textContent;
    
    // Look for Rightmove-specific patterns first
    const rightmovePatterns = [
      /Offers Over £([\d,]+)/i,
      /Guide Price £([\d,]+)/i,
      /Asking Price £([\d,]+)/i,
      /Price £([\d,]+)/i,
      /£([\d,]+) Offers Over/i,
      /£([\d,]+) Guide Price/i
    ];
    
    for (const pattern of rightmovePatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const price = '£' + match[1];
        console.log('BMV Finder: Found Rightmove pattern price:', price, 'from pattern:', pattern);
        propertyData.price = price;
        break;
      }
    }
    
    // Look for Zoopla-specific patterns
    if (propertyData.price === '£0' && hostname.includes('zoopla.co.uk')) {
      const zooplaPatterns = [
        /£([\d,]+) for sale/i,
        /for sale £([\d,]+)/i,
        /£([\d,]+) bed/i,
        /bed £([\d,]+)/i,
        /£([\d,]+) terraced/i,
        /terraced £([\d,]+)/i,
        /£([\d,]+) house/i,
        /house £([\d,]+)/i
      ];
      
      for (const pattern of zooplaPatterns) {
        const match = pageText.match(pattern);
        if (match) {
          const price = '£' + match[1];
          console.log('BMV Finder: Found Zoopla pattern price:', price, 'from pattern:', pattern);
          propertyData.price = price;
          break;
        }
      }
    }
    
    // If still no price, try general price extraction
    if (propertyData.price === '£0') {
      const priceMatches = pageText.match(/£[\d,]+/g);
      if (priceMatches && priceMatches.length > 0) {
        // Find the largest price (likely the property price)
        const prices = priceMatches.map(p => parseInt(p.replace(/[£,]/g, '')));
        const maxPrice = Math.max(...prices);
        if (maxPrice > 10000 && maxPrice < 10000000) { // Reasonable property price range
          propertyData.price = '£' + maxPrice.toLocaleString();
          console.log('BMV Finder: Found fallback price:', propertyData.price);
        }
      }
    }
  }
  
  // Ensure we have a proper title
  if (!propertyData.address || propertyData.address.length < 5) {
    propertyData.address = document.title || 'Property';
    console.log('BMV Finder: Using document title as address:', propertyData.address);
  }
  
  // Clean up the title/address
  propertyData.address = propertyData.address
    .replace(' - Rightmove', '')
    .replace(' | Zoopla', '')
    .replace(' | OnTheMarket', '')
    .replace(' | PrimeLocation', '')
    .trim();
  
  // Clean up common property listing text
  propertyData.address = propertyData.address
    .replace(/\d+ bed\s+[^,]+ for sale,?\s*£[\d,]*/gi, '') // Remove "3 bed terraced house for sale, £109"
    .replace(/for sale/gi, '')
    .replace(/to rent/gi, '')
    .replace(/property for sale/gi, '')
    .replace(/property to rent/gi, '')
    .replace(/house for sale/gi, '')
    .replace(/flat for sale/gi, '')
    .replace(/apartment for sale/gi, '')
    .replace(/\s*,\s*£[\d,]*/g, '') // Remove trailing price
    .replace(/\s*£[\d,]*\s*,/g, ',') // Remove price followed by comma
    .replace(/\s*£[\d,]*$/g, '') // Remove price at end
    .replace(/\s*Offers Over\s*£[\d,]*/gi, '') // Remove "Offers Over £395,000"
    .replace(/\s*Guide Price\s*£[\d,]*/gi, '') // Remove "Guide Price £395,000"
    .replace(/\s*Asking Price\s*£[\d,]*/gi, '') // Remove "Asking Price £395,000"
    .replace(/\s*Price\s*£[\d,]*/gi, '') // Remove "Price £395,000"
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/^,\s*/, '') // Remove leading comma
    .replace(/,\s*$/, '') // Remove trailing comma
    .trim();
  
  // Special handling for Zoopla format like "5, 3 bed terraced house for sale, £109"
  if (hostname.includes('zoopla.co.uk')) {
    // Try to extract just the address part before the first comma
    const commaIndex = propertyData.address.indexOf(',');
    if (commaIndex > 0) {
      const firstPart = propertyData.address.substring(0, commaIndex).trim();
      // Check if first part looks like an address (contains numbers or street names)
      if (firstPart.match(/^\d+/) || firstPart.length > 3) {
        // Find the next comma to get the full address
        const secondCommaIndex = propertyData.address.indexOf(',', commaIndex + 1);
        if (secondCommaIndex > 0) {
          propertyData.address = propertyData.address.substring(0, secondCommaIndex).trim();
        } else {
          propertyData.address = firstPart;
        }
        console.log('BMV Finder: Cleaned Zoopla address to:', propertyData.address);
      }
    }
  }
  
  console.log('BMV Finder: Final extracted property data:', propertyData);
  return propertyData;
}

// Show success/error message
function showMessage(message, isSuccess) {
  // Remove any existing messages
  const existingMessage = document.getElementById('bmv-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.id = 'bmv-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 999999;
    background: ${isSuccess ? '#4CAF50' : '#f44336'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
  `;
  
  document.body.appendChild(messageDiv);
  
  // Remove after 3 seconds
  setTimeout(function() {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 3000);
}

// Simple function to create and inject button
function injectButton() {
  console.log('BMV Finder: Injecting button...');
  
  // Only inject on property pages
  if (!isPropertyPage()) {
    console.log('BMV Finder: Not a property page, skipping injection');
    return;
  }
  
  // Remove any existing buttons
  const existingButton = document.getElementById('bmv-capture-button');
  if (existingButton) {
    existingButton.remove();
  }
  
  // Create button element
  const button = document.createElement('button');
  button.id = 'bmv-capture-button';
  button.innerHTML = '<span style="font-size: 14px;">🏠</span> Capture Property';
  
  // Apply professional styles
  button.style.position = 'fixed';
  button.style.top = '20px';
  button.style.right = '20px';
  button.style.zIndex = '999999';
  button.style.background = 'linear-gradient(135deg, #3A7CA5 0%, #2C6E91 100%)';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '8px';
  button.style.padding = '12px 16px';
  button.style.fontSize = '14px';
  button.style.fontWeight = '600';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 8px rgba(58, 124, 165, 0.2)';
  button.style.fontFamily = 'Arial, sans-serif';
  button.style.transition = 'all 0.3s ease';
  
  // Hover effect
  button.onmouseover = function() {
    this.style.transform = 'translateY(-1px)';
    this.style.boxShadow = '0 4px 12px rgba(58, 124, 165, 0.3)';
  };
  
  button.onmouseout = function() {
    this.style.transform = 'translateY(0)';
    this.style.boxShadow = '0 2px 8px rgba(58, 124, 165, 0.2)';
  };
  
  // Add click handler
  button.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('BMV Finder: Button clicked!');
    
    // Show loading state
    const originalText = this.innerHTML;
    this.innerHTML = '<span style="font-size: 14px;">⏳</span> Capturing...';
    this.style.background = 'linear-gradient(135deg, #5DA271 0%, #3B755D 100%)';
    this.style.cursor = 'not-allowed';
    
    // Extract property data
    const propertyData = extractPropertyData();
    
    // Send to background script
    chrome.runtime.sendMessage({
      action: 'captureProperty',
      data: propertyData
    }, function(response) {
      console.log('BMV Finder: Background response:', response);
      
      if (response && response.success) {
        // Show success state
        button.innerHTML = '<span style="font-size: 14px;">✅</span> Captured!';
        button.style.background = 'linear-gradient(135deg, #5DA271 0%, #3B755D 100%)';
        showMessage('Property captured successfully!', true);
        
        // Reset after 2 seconds
        setTimeout(function() {
          button.innerHTML = originalText;
          button.style.background = 'linear-gradient(135deg, #3A7CA5 0%, #2C6E91 100%)';
          button.style.cursor = 'pointer';
        }, 2000);
      } else {
        // Show error state
        button.innerHTML = '<span style="font-size: 14px;">❌</span> Error';
        button.style.background = 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)';
        showMessage('Failed to capture property. Please try again.', false);
        
        // Reset after 3 seconds
        setTimeout(function() {
          button.innerHTML = originalText;
          button.style.background = 'linear-gradient(135deg, #3A7CA5 0%, #2C6E91 100%)';
          button.style.cursor = 'pointer';
        }, 3000);
      }
    });
  };
  
  // Inject to body
  if (document.body) {
    document.body.appendChild(button);
    console.log('BMV Finder: Button injected successfully');
  } else {
    console.log('BMV Finder: No body element, waiting...');
    setTimeout(function() {
      if (document.body) {
        document.body.appendChild(button);
        console.log('BMV Finder: Button injected (delayed)');
      }
    }, 1000);
  }
}

// Run immediately
console.log('BMV Finder: Starting injection...');
injectButton();

// Also run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('BMV Finder: DOM ready, injecting...');
    injectButton();
  });
}

// Also run after delay
setTimeout(function() {
  console.log('BMV Finder: Delayed injection...');
  injectButton();
}, 2000);

// Also run on window load
window.addEventListener('load', function() {
  console.log('BMV Finder: Window loaded, injecting...');
  injectButton();
});

console.log('BMV Finder: Content script setup complete'); 