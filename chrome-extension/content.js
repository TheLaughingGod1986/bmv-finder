// BMV Finder Chrome Extension - Content Script
console.log('BMV Finder: Content script loaded');

// Check if this is a property page
function isPropertyPage() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  // Check for property listing pages
  if (hostname.includes('rightmove.co.uk')) {
    return pathname.includes('/properties/') || pathname.includes('/for-sale/');
  }
  
  if (hostname.includes('zoopla.co.uk')) {
    return pathname.includes('/for-sale/') || pathname.includes('/to-rent/');
  }
  
  if (hostname.includes('onthemarket.com')) {
    return pathname.includes('/for-sale/') || pathname.includes('/to-rent/');
  }
  
  if (hostname.includes('primelocation.com')) {
    return pathname.includes('/for-sale/') || pathname.includes('/to-rent/');
  }
  
  // Check for property-related keywords in title
  const title = document.title.toLowerCase();
  const propertyKeywords = ['for sale', 'to rent', 'property', 'house', 'flat', 'apartment'];
  return propertyKeywords.some(keyword => title.includes(keyword));
}

// Test function for debugging
function testCurrentPageExtraction() {
  console.log('BMV Finder: Testing current page extraction...');
  const propertyData = extractPropertyData();
  console.log('BMV Finder: Extracted data:', propertyData);
  
  // Show test results
  const testResults = `
    Title: ${propertyData.title}
    Price: ${propertyData.price}
    Address: ${propertyData.address}
    Bedrooms: ${propertyData.bedrooms}
    Bathrooms: ${propertyData.bathrooms}
    Property Type: ${propertyData.property_type}
    Images: ${propertyData.images.length}
    Source: ${propertyData.source}
  `;
  
  console.log('BMV Finder: Test Results:', testResults);
  showMessage('Test completed - check console for results', true);
}

// Debug function to show page information
function debugPageInfo() {
  console.log('BMV Finder: === DEBUG PAGE INFO ===');
  console.log('BMV Finder: URL:', window.location.href);
  console.log('BMV Finder: Title:', document.title);
  console.log('BMV Finder: Is property page:', isPropertyPage());
  
  // Check for common property elements
  const elementsToCheck = [
    'h1', 'h2', 'h3',
    '[data-testid="price"]',
    '[data-testid="property-price"]',
    '.property-price',
    '.listing-price',
    '.price',
    '[class*="price"]',
    '[class*="Price"]',
    '.property-title',
    '.listing-title'
  ];
  
  elementsToCheck.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`BMV Finder: Found ${elements.length} elements for "${selector}":`);
      elements.forEach((el, index) => {
        console.log(`  ${index}: "${el.textContent.substring(0, 100)}"`);
      });
    }
  });
  
  // Debug image extraction
  console.log('BMV Finder: === IMAGE DEBUG ===');
  const allImages = document.querySelectorAll('img');
  console.log(`BMV Finder: Found ${allImages.length} total images on page`);
  
  allImages.forEach((img, index) => {
    const src = img.getAttribute('src');
    const alt = img.getAttribute('alt') || '';
    const className = img.getAttribute('class') || '';
    const dataTestId = img.getAttribute('data-testid') || '';
    
    if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
      console.log(`BMV Finder: Image ${index}:`, {
        src: src.substring(0, 100),
        alt: alt.substring(0, 50),
        class: className.substring(0, 50),
        dataTestId: dataTestId
      });
    }
  });
  
  console.log('BMV Finder: === END DEBUG ===');
}

// Make debug function available globally
window.bmvFinderDebug = debugPageInfo;

// Add a global test function
window.bmvFinderTest = function() {
  console.log('BMV Finder: === MANUAL TEST TRIGGERED ===');
  console.log('BMV Finder: Current URL:', window.location.href);
  console.log('BMV Finder: Current Title:', document.title);
  console.log('BMV Finder: Is Property Page:', isPropertyPage());
  
  if (isPropertyPage()) {
    console.log('BMV Finder: This should be a property page!');
    testCurrentPageExtraction();
  } else {
    console.log('BMV Finder: This is NOT a property page. Go to a property listing on Zoopla, Rightmove, etc.');
  }
};

// Add a global force injection function for testing
window.bmvFinderForceInject = function() {
  console.log('BMV Finder: === FORCE INJECTION TRIGGERED ===');
  injectButton();
};

// Add a global test capture function
window.bmvFinderTestCapture = function() {
  console.log('BMV Finder: === TEST CAPTURE TRIGGERED ===');
  const testProperty = {
    title: 'Test Property - 4 bed detached house',
    price: '£475,000',
    address: 'Test Street, Test City, TE1 1ST',
    description: 'This is a test property for debugging',
    bedrooms: 4,
    bathrooms: 2,
    propertyType: 'Detached House',
    tenure: 'Freehold',
    postcode: 'TE1 1ST',
    original_url: window.location.href,
    source: 'test',
    agent_name: 'Test Agent',
    agent_phone: '01234 567890',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center']
  };
  
  // Send to background script
  chrome.runtime.sendMessage({
    action: 'captureProperty',
    data: testProperty
  }, function(response) {
    console.log('BMV Finder: Test capture response:', response);
    if (response && response.success) {
      alert('Test property captured successfully! Check your watchlist.');
    } else {
      alert('Test capture failed: ' + (response?.error || 'Unknown error'));
    }
  });
};

// Extract property data based on the site
function extractPropertyData() {
  const hostname = window.location.hostname;
  
  let propertyData = {
    title: document.title || 'Property',
    price: '£0',
    address: '',
    bedrooms: 0,
    bathrooms: 0,
    property_type: 'Property',
    source: hostname,
    original_url: window.location.href,
    images: [],
    captured_at: new Date().toISOString()
  };
  
  // Extract bedrooms and bathrooms from title or page content
  const extractBedroomsBathrooms = () => {
    const pageText = document.body.textContent || '';
    const title = document.title || '';
    
    // Look for bedroom patterns
    const bedroomPatterns = [
      /(\d+)\s*bedroom/i,
      /(\d+)\s*bed/i,
      /(\d+)\s*br/i
    ];
    
    for (const pattern of bedroomPatterns) {
      const match = (title + ' ' + pageText).match(pattern);
      if (match) {
        propertyData.bedrooms = parseInt(match[1]);
        break;
      }
    }
    
    // Look for bathroom patterns
    const bathroomPatterns = [
      /(\d+)\s*bathroom/i,
      /(\d+)\s*bath/i,
      /(\d+)\s*en\s*suite/i
    ];
    
    for (const pattern of bathroomPatterns) {
      const match = (title + ' ' + pageText).match(pattern);
      if (match) {
        propertyData.bathrooms = parseInt(match[1]);
        break;
      }
    }
    
    // Determine property type based on bedrooms and title
    if (propertyData.bedrooms === 0) {
      if (title.toLowerCase().includes('studio') || title.toLowerCase().includes('bedsit')) {
        propertyData.property_type = 'Studio';
        propertyData.bedrooms = 1;
      } else if (title.toLowerCase().includes('apartment') || title.toLowerCase().includes('flat')) {
        propertyData.property_type = 'Apartment';
      } else if (title.toLowerCase().includes('house')) {
        propertyData.property_type = 'House';
      }
    } else if (propertyData.bedrooms === 1) {
      propertyData.property_type = 'Apartment';
    } else {
      propertyData.property_type = 'House';
    }
  };
  
  // Extract address from title or page content
  const extractAddress = () => {
    const title = document.title || '';
    
    // Common address patterns in property titles
    const addressPatterns = [
      /for sale in (.+?)(?:,|$)/i,
      /in (.+?)(?:,|$)/i,
      /at (.+?)(?:,|$)/i
    ];
    
    for (const pattern of addressPatterns) {
      const match = title.match(pattern);
      if (match && match[1].length > 5 && match[1].length < 100) {
        propertyData.address = match[1].trim();
        break;
      }
    }
    
    // If no address found in title, try to extract from page content
    if (!propertyData.address) {
      const addressSelectors = [
        '[data-testid="address"]',
        '.property-address',
        '.listing-address',
        '.address',
        'h1',
        'h2'
      ];
      
      for (const selector of addressSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent?.trim();
          if (text && text.length > 10 && text.length < 100 && 
              !text.includes('Rightmove') && !text.includes('Zoopla') && 
              !text.includes('OnTheMarket')) {
            propertyData.address = text;
            break;
          }
        }
        if (propertyData.address) break;
      }
    }
  };
  
  // Extract bedrooms, bathrooms, and address
  extractBedroomsBathrooms();
  extractAddress();
  
  // Zoopla extraction
  if (hostname.includes('zoopla.co.uk')) {
    console.log('BMV Finder: Extracting Zoopla data...');
    
    // Extract price - collect all prices first, then select the best one
    const allPrices = [];
    const priceSelectors = [
      // Zoopla-specific selectors for main price (most specific first)
      '[data-testid="price"]',
      '[data-testid="price-value"]',
      '.css-1tppcjb-Text--price',
      '.css-1tppcjb-Text--large',
      '.css-1tppcjb-Text--bold',
      '.css-1tppcjb',
      // Property header area selectors
      '.property-header__price',
      '.property-details__price',
      '.listing-price',
      '.property-price',
      '.property-price-value',
      '.price-display',
      '.listing-price-value',
      '.price-value',
      // Main content area selectors
      'h1',
      'h2',
      'h3',
      // Look for elements containing price text
      'span',
      'div',
      'p',
      // More generic selectors
      '[class*="price"]',
      '[class*="Price"]',
      '[class*="value"]',
      '[class*="Value"]'
    ];
    
    // Collect all prices from all selectors
    for (const selector of priceSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log('BMV Finder: Found', elements.length, 'elements for Zoopla price selector:', selector);
      
      for (const element of elements) {
        const text = element.textContent;
        console.log('BMV Finder: Checking Zoopla price selector:', selector, 'Text:', text.substring(0, 100));
        
        // Look for price patterns
        const priceMatch = text.match(/£[\d,]+/);
        if (priceMatch) {
          const price = priceMatch[0];
          const priceValue = parseInt(price.replace(/[£,]/g, ''));
          
          // Only collect reasonable property prices (between £50,000 and £1,000,000)
          if (priceValue > 50000 && priceValue < 1000000) {
            allPrices.push({
              price: price,
              value: priceValue,
              selector: selector,
              text: text.substring(0, 50)
            });
            console.log('BMV Finder: Collected price:', price, 'from selector:', selector);
          }
        }
      }
    }
    
    // Select the best price - prioritize by selector specificity, not value
    if (allPrices.length > 0) {
      // Remove duplicates by value
      const uniquePrices = allPrices.filter((item, index, self) => 
        index === self.findIndex(t => t.value === item.value)
      );
      
      console.log('BMV Finder: All collected prices:', uniquePrices);
      
      // Define selector priority (most specific first)
      const selectorPriority = [
        '[data-testid="price"]',
        '[data-testid="price-value"]', 
        '.css-1tppcjb-Text--price',
        '.css-1tppcjb-Text--large',
        '.css-1tppcjb-Text--bold',
        '.css-1tppcjb',
        '.property-header__price',
        '.property-details__price',
        '.listing-price',
        '.property-price',
        '.property-price-value',
        '.price-display',
        '.listing-price-value',
        '.price-value',
        'h1',
        'h2',
        'h3',
        'span',
        'p',
        'div'  // Generic selectors last
      ];
      
      // Find the price from the most specific selector (don't sort by value)
      let selectedPrice = null;
      for (const prioritySelector of selectorPriority) {
        const priorityPrice = uniquePrices.find(p => p.selector === prioritySelector);
        if (priorityPrice) {
          selectedPrice = priorityPrice;
          console.log('BMV Finder: Found price from priority selector:', prioritySelector, 'value:', priorityPrice.price);
          break;
        }
      }
      
      // If no price found from priority selectors, use the first reasonable one
      if (!selectedPrice) {
        const reasonablePrices = uniquePrices.filter(p => p.value > 50000 && p.value < 1000000);
        if (reasonablePrices.length > 0) {
          selectedPrice = reasonablePrices[0];
          console.log('BMV Finder: Selected reasonable price as fallback:', selectedPrice.price);
        }
      }
      
      // Sanity check: Don't select obviously wrong prices
      if (selectedPrice && selectedPrice.value > 1000000) {
        console.log('BMV Finder: Rejecting obviously wrong price:', selectedPrice.price, 'looking for alternative...');
        
        // Find the next best price that's reasonable
        const reasonablePrices = uniquePrices.filter(p => p.value > 50000 && p.value < 1000000);
        if (reasonablePrices.length > 0) {
          selectedPrice = reasonablePrices[0];
          console.log('BMV Finder: Selected alternative reasonable price:', selectedPrice.price);
        }
      }
      
      if (selectedPrice) {
        propertyData.price = selectedPrice.price;
        console.log('BMV Finder: Selected Zoopla price:', propertyData.price, 'from:', selectedPrice.selector);
      }
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
    
    // Helper function to filter out logos and non-property images
function isValidPropertyImage(img) {
  const src = img.src || '';
  const alt = img.alt || '';
  const className = img.className || '';
  
  // Skip if it's clearly a logo or agent image
  if (src.includes('logo') || src.includes('icon') || src.includes('halifax') || 
      src.includes('agent') || src.includes('brand') || src.includes('partner')) {
    return false;
  }
  
  // Skip if alt text indicates it's not a property photo
  if (alt.toLowerCase().includes('logo') || alt.toLowerCase().includes('agent') || 
      alt.toLowerCase().includes('brand') || alt.toLowerCase().includes('partner')) {
    return false;
  }
  
  // Skip if class name indicates it's not a property photo
  if (className.toLowerCase().includes('logo') || className.toLowerCase().includes('agent') || 
      className.toLowerCase().includes('brand') || className.toLowerCase().includes('partner')) {
    return false;
  }
  
  // Must be an actual image URL
  return src.startsWith('http') && (src.includes('.jpg') || src.includes('.jpeg') || 
         src.includes('.png') || src.includes('.webp') || src.includes('.gif'));
}

// Extract images for Zoopla
const imageSelectors = [
  // Most specific selectors first - prioritize actual property photos
  '[data-testid="property-image"]',
  '[data-testid="main-image"]',
  '[data-testid="hero-image"]',
  '.css-1tppcjb-Image',
  '.property-header__image',
  '.property-details__image',
  '.listing-image',
  '.property-image',
  '.main-image',
  '.hero-image',
  // Gallery images
  '.gallery-image',
  '.photo-gallery img',
  '.property-gallery img',
  // More specific selectors
  'img[data-testid*="image"]',
  'img[data-testid*="photo"]',
  'img[class*="property"]',
  'img[class*="listing"]',
  'img[class*="main"]',
  'img[class*="hero"]',
  // Avoid generic images and logos
  'img[src*="zoopla"]:not([src*="logo"]):not([src*="icon"]):not([src*="halifax"]):not([src*="agent"])',
  'img[alt*="property"]:not([alt*="street"]):not([alt*="view"]):not([alt*="logo"]):not([alt*="agent"])',
  'img[alt*="house"]:not([alt*="street"]):not([alt*="view"]):not([alt*="logo"]):not([alt*="agent"])',
  'img[alt*="apartment"]:not([alt*="street"]):not([alt*="view"]):not([alt*="logo"]):not([alt*="agent"])',
  'img[alt*="flat"]:not([alt*="street"]):not([alt*="view"]):not([alt*="logo"]):not([alt*="agent"])'
];
    
    for (const selector of imageSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log('BMV Finder: Found', elements.length, 'image elements for Zoopla selector:', selector);
      
      for (const element of elements) {
        if (element.tagName === 'IMG' && isValidPropertyImage(element)) {
          const imgSrc = element.getAttribute('src');
          if (imgSrc && !images.includes(imgSrc)) {
            images.push(imgSrc);
            console.log('BMV Finder: Found valid Zoopla property image:', imgSrc.substring(0, 100));
          }
        }
      }
    }
    
    // If no images found with selectors, try a broader search but still filter
    if (images.length === 0) {
      console.log('BMV Finder: No images found with selectors, trying broader search...');
      const allImages = document.querySelectorAll('img');
      for (const img of allImages) {
        if (isValidPropertyImage(img)) {
          const src = img.src;
          if (src && !images.includes(src)) {
            images.push(src);
            console.log('BMV Finder: Found property image via broad search:', src.substring(0, 100));
          }
        }
      }
    }
    
    // Limit to first 3 images
    propertyData.images = images.slice(0, 3);
    console.log('BMV Finder: Final Zoopla images:', propertyData.images);
  }
  
  // Rightmove extraction
  if (hostname.includes('rightmove.co.uk')) {
    console.log('BMV Finder: Extracting Rightmove data...');
    
    // Extract price - try multiple selectors
    const priceSelectors = [
      // Specific Rightmove selectors for current layout
      '[data-testid="price"]',
      '[data-testid="price-value"]',
      '[data-testid="property-price"]',
      '.propertyCard-priceValue',
      '.propertyCard-price',
      '.property-header-price',
      '.property-header__price',
      '.property-details__price',
      '.property-price-value',
      '.price-display',
      '.listing-price',
      '.property-price',
      '.price',
      // Look for elements containing "Guide price" specifically
      'span',
      'div',
      'p',
      'h2',
      'h3',
      // Look for elements containing price text
      'span',
      'div',
      'p',
      'h1 + div',
      // More generic selectors
      '[class*="price"]',
      '[class*="Price"]',
      '[class*="value"]',
      '[class*="Value"]'
    ];
    
    for (const selector of priceSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log('BMV Finder: Found', elements.length, 'elements for selector:', selector);
      
      for (const element of elements) {
        const text = element.textContent;
        console.log('BMV Finder: Checking price selector:', selector, 'Text:', text.substring(0, 100));
        
        // First, look for "Guide price" specifically
        if (text.toLowerCase().includes('guide price')) {
          const guidePriceMatch = text.match(/Guide Price £([\d,]+)/i);
          if (guidePriceMatch) {
            propertyData.price = '£' + guidePriceMatch[1];
            console.log('BMV Finder: Found Rightmove Guide price:', propertyData.price);
            break;
          }
        }
        
        // Then look for any price
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
    
    // Extract images
    const imageSelectors = [
      // Most specific selectors first
      '[data-testid="property-image"]',
      '[data-testid="main-image"]',
      '[data-testid="hero-image"]',
      '.propertyCard-img',
      '.property-header__image',
      '.property-details__image',
      '.listing-image',
      '.property-image',
      '.main-image',
      '.hero-image',
      // Gallery images
      '.gallery-image',
      '.photo-gallery img',
      '.property-gallery img',
      // More specific selectors
      'img[data-testid*="image"]',
      'img[data-testid*="photo"]',
      'img[class*="property"]',
      'img[class*="listing"]',
      'img[class*="main"]',
      'img[class*="hero"]',
      // Avoid generic images and logos
      'img[src*="rightmove"]:not([src*="logo"]):not([src*="icon"]):not([src*="agent"])',
      'img[alt*="property"]:not([alt*="street"]):not([alt*="view"]):not([alt*="logo"]):not([alt*="agent"])',
      'img[alt*="house"]:not([alt*="street"]):not([alt*="view"]):not([alt*="logo"]):not([alt*="agent"])',
      'img[alt*="apartment"]:not([alt*="street"]):not([alt*="view"]):not([alt*="logo"]):not([alt*="agent"])',
      'img[alt*="flat"]:not([alt*="street"]):not([alt*="view"]):not([alt*="logo"]):not([alt*="agent"])'
    ];
    
    for (const selector of imageSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log('BMV Finder: Found', elements.length, 'image elements for selector:', selector);
      
      for (const element of elements) {
        const imgSrc = element.getAttribute('src');
        const imgAlt = element.getAttribute('alt') || '';
        
        // Skip if no src or if it's a placeholder/logo/icon
        if (!imgSrc || 
            imgSrc.includes('placeholder') || 
            imgSrc.includes('logo') || 
            imgSrc.includes('icon') ||
            imgSrc.includes('avatar') ||
            imgSrc.includes('profile')) {
          continue;
        }
        
        // Skip street views, building exteriors, and generic images
        if (imgAlt.toLowerCase().includes('street') || 
            imgAlt.toLowerCase().includes('view') ||
            imgAlt.toLowerCase().includes('exterior') ||
            imgAlt.toLowerCase().includes('building') ||
            imgAlt.toLowerCase().includes('outside') ||
            imgAlt.toLowerCase().includes('front') ||
            imgAlt.toLowerCase().includes('back') ||
            imgAlt.toLowerCase().includes('garden') ||
            imgAlt.toLowerCase().includes('driveway') ||
            imgAlt.toLowerCase().includes('parking')) {
          console.log('BMV Finder: Skipping street/exterior image:', imgAlt);
          continue;
        }
        
        // Prefer interior images
        if (imgAlt.toLowerCase().includes('bedroom') || 
            imgAlt.toLowerCase().includes('living') ||
            imgAlt.toLowerCase().includes('kitchen') ||
            imgAlt.toLowerCase().includes('bathroom') ||
            imgAlt.toLowerCase().includes('interior') ||
            imgAlt.toLowerCase().includes('inside')) {
          propertyData.images.unshift(imgSrc); // Add to beginning for priority
          console.log('BMV Finder: Found priority interior image:', imgSrc, 'alt:', imgAlt);
        } else if (imgSrc.startsWith('http') && imgSrc.includes('rightmove')) {
          propertyData.images.push(imgSrc);
          console.log('BMV Finder: Found Rightmove image:', imgSrc, 'alt:', imgAlt);
        }
      }
      
      // Limit to first 3 images
      if (propertyData.images.length >= 3) break;
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
    
    // First, specifically look for "Guide price" in the page text
    const guidePriceMatch = pageText.match(/Guide Price £([\d,]+)/i);
    if (guidePriceMatch) {
      propertyData.price = '£' + guidePriceMatch[1];
      console.log('BMV Finder: Found Guide price in page text:', propertyData.price);
    }
    
    // Look for Rightmove-specific patterns first
    const rightmovePatterns = [
      /Guide Price £([\d,]+)/i,  // Prioritize Guide Price
      /Offers Over £([\d,]+)/i,
      /Asking Price £([\d,]+)/i,
      /Price £([\d,]+)/i,
      /£([\d,]+) Guide Price/i,
      /£([\d,]+) Offers Over/i,
      // Add more patterns for current layouts
      /Price:?\s*£([\d,]+)/i,
      /Guide price:?\s*£([\d,]+)/i,
      /Asking price:?\s*£([\d,]+)/i,
      /£([\d,]+)/g  // Simple £ followed by numbers (fallback)
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

    // If still no price, try general price extraction with better logic
    if (propertyData.price === '£0') {
      console.log('BMV Finder: Trying general price extraction...');
      const priceMatches = pageText.match(/£[\d,]+/g);
      if (priceMatches && priceMatches.length > 0) {
        console.log('BMV Finder: Found price matches:', priceMatches);
        
        // Convert to numbers and filter reasonable property prices
        const prices = priceMatches
          .map(p => parseInt(p.replace(/[£,]/g, '')))
          .filter(p => p > 10000 && p < 10000000); // Reasonable property price range
        
        if (prices.length > 0) {
          // Sort prices in descending order and pick the most reasonable one
          const sortedPrices = prices.sort((a, b) => b - a);
          console.log('BMV Finder: Sorted prices:', sortedPrices);
          
          // For Zoopla, look for prices around the expected range (likely the first one)
          // For Rightmove, prefer larger prices
          let selectedPrice;
          if (hostname.includes('zoopla.co.uk')) {
            // For Zoopla, prefer the first (largest) price that's reasonable
            selectedPrice = sortedPrices[0];
          } else {
            // For Rightmove, prefer the largest price
            selectedPrice = sortedPrices[0];
          }
          
          propertyData.price = '£' + selectedPrice.toLocaleString();
          console.log('BMV Finder: Found fallback price:', propertyData.price, 'from sorted prices:', sortedPrices);
        }
      }
    }
    
    // Last resort: search for any number that looks like a property price
    if (propertyData.price === '£0') {
      console.log('BMV Finder: Trying last resort price extraction...');
      const numberMatches = pageText.match(/(\d{5,6})/g); // 5-6 digit numbers
      if (numberMatches) {
        const prices = numberMatches
          .map(p => parseInt(p))
          .filter(p => p > 10000 && p < 1000000);
        
        if (prices.length > 0) {
          const maxPrice = Math.max(...prices);
          propertyData.price = '£' + maxPrice.toLocaleString();
          console.log('BMV Finder: Found last resort price:', propertyData.price);
        }
      }
    }
    
    // Ultra aggressive: search through all text nodes for price patterns
    if (propertyData.price === '£0') {
      console.log('BMV Finder: Trying ultra aggressive price extraction...');
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
      
      for (const textNode of textNodes) {
        const text = textNode.textContent;
        const priceMatch = text.match(/£([\d,]+)/);
        if (priceMatch) {
          const price = parseInt(priceMatch[1].replace(/,/g, ''));
          if (price > 10000 && price < 10000000) {
            propertyData.price = '£' + price.toLocaleString();
            console.log('BMV Finder: Found price in text node:', propertyData.price, 'from text:', text.substring(0, 50));
            break;
          }
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
  
  // If no images found, use a default UK property image
  if (propertyData.images.length === 0) {
    propertyData.images.push('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center');
    console.log('BMV Finder: Using default UK property image');
  }
  
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

// Check authentication status before capturing
async function checkAuthenticationStatus() {
  try {
    const result = await chrome.storage.local.get(['authToken', 'isAuthenticated']);
    return {
      isAuthenticated: result.isAuthenticated || false,
      hasToken: !!result.authToken
    };
  } catch (error) {
    console.error('BMV Finder: Error checking auth status:', error);
    return { isAuthenticated: false, hasToken: false };
  }
}

// Simple function to create and inject button
function injectButton() {
  console.log('BMV Finder: Injecting button...');
  
  // Only inject on property pages
  if (!isPropertyPage()) {
    console.log('BMV Finder: Not a property page, skipping injection');
    return;
  }
  
  // Remove any existing button containers
  const existingContainer = document.getElementById('bmv-button-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'bmv-button-container';
  buttonContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;
  
  // Create main capture button
  const button = document.createElement('button');
  button.id = 'bmv-capture-button';
  button.innerHTML = '<span style="font-size: 14px;">🏠</span> Capture Property';
  
  // Create test button
  const testButton = document.createElement('button');
  testButton.id = 'bmv-test-button';
  testButton.innerHTML = '<span style="font-size: 14px;">🔍</span> Test Extraction';
  testButton.style.cssText = `
    background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.2);
    font-family: Arial, sans-serif;
    transition: all 0.3s ease;
  `;
  
  testButton.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    testCurrentPageExtraction();
  };
  
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
  button.onclick = async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('BMV Finder: Button clicked!');
    
    // Check authentication status first
    const authStatus = await checkAuthenticationStatus();
    
    if (!authStatus.isAuthenticated) {
      showMessage('Please sign in to your BMV Finder account first!', false);
      // Open sign-in page
      chrome.tabs.create({ 
        url: 'https://bmv-finder-git-main-bens-projects-11c93b15.vercel.app/extension-auth' 
      });
      return;
    }
    
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
  
  // Add buttons to container
  buttonContainer.appendChild(button);
  buttonContainer.appendChild(testButton);
  
  // Inject container to body
  if (document.body) {
    document.body.appendChild(buttonContainer);
    console.log('BMV Finder: Buttons injected successfully');
  } else {
    console.log('BMV Finder: No body element, waiting...');
    setTimeout(function() {
      if (document.body) {
        document.body.appendChild(buttonContainer);
        console.log('BMV Finder: Buttons injected (delayed)');
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