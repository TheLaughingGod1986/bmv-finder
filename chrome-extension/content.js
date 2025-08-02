console.log('BMV Finder: Content script loaded on:', window.location.href);

// Immediate cleanup for localhost pages
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('BMV Finder: Localhost detected, cleaning up any existing buttons immediately');
  
  // Function to clean up all BMV Finder elements
  const cleanupAllBMVElements = () => {
    // Remove any existing BMV Finder buttons immediately
    const existingButtons = document.querySelectorAll('[id*="bmv-capture"], [class*="bmv-capture"], [id*="bmv"], [class*="bmv"]');
    existingButtons.forEach(button => {
      button.remove();
      console.log('BMV Finder: Cleaned up existing button immediately');
    });
    
    // Also remove any containers
    const existingContainers = document.querySelectorAll('[id*="bmv-capture-container"], [id*="bmv-container"]');
    existingContainers.forEach(container => {
      container.remove();
      console.log('BMV Finder: Cleaned up existing container immediately');
    });
    
    // Remove any BMV-related styles
    const bmvStyles = document.querySelectorAll('style[data-bmv], style:contains("bmv-capture")');
    bmvStyles.forEach(style => {
      style.remove();
      console.log('BMV Finder: Cleaned up existing styles immediately');
    });
  };
  
  // Run cleanup immediately
  cleanupAllBMVElements();
  
  // Run cleanup on DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanupAllBMVElements);
  }
  
  // Run cleanup on window load
  window.addEventListener('load', cleanupAllBMVElements);
  
  // Run cleanup periodically for the first few seconds
  let cleanupCount = 0;
  const cleanupInterval = setInterval(() => {
    cleanupAllBMVElements();
    cleanupCount++;
    if (cleanupCount >= 5) {
      clearInterval(cleanupInterval);
    }
  }, 500);
  
  // Don't initialize the extension on localhost
  console.log('BMV Finder: Skipping initialization on localhost');
  return;
}

// Add CSS styles for the button
const style = document.createElement('style');
style.textContent = `
  .bmv-capture-button {
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #3A7CA5 0%, #2C6E91 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 16px 24px;
    margin: 20px 0;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(58, 124, 165, 0.3);
    transition: all 0.3s ease;
    width: 100%;
    max-width: 300px;
    position: relative;
    overflow: hidden;
  }

  .bmv-capture-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(58, 124, 165, 0.4);
  }

  .bmv-capture-button:active {
    transform: translateY(0);
  }

  .bmv-capture-content {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .bmv-capture-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .bmv-capture-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
  }

  .bmv-capture-title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
  }

  .bmv-capture-subtitle {
    font-size: 12px;
    font-weight: 400;
    opacity: 0.9;
    margin-top: 2px;
  }

  .bmv-capture-button.bmv-loading {
    background: linear-gradient(135deg, #5DA271 0%, #3B755D 100%);
    cursor: not-allowed;
  }

  .bmv-capture-button.bmv-success {
    background: linear-gradient(135deg, #5DA271 0%, #3B755D 100%);
  }

  .bmv-capture-button.bmv-error {
    background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
  }

  /* Debug styles to make sure button is visible */
  .bmv-capture-button {
    border: 2px solid #D4AF37 !important;
    z-index: 999999 !important;
  }

  /* Test button styles */
  .bmv-test-button {
    position: fixed !important;
    top: 10px !important;
    left: 10px !important;
    background: red !important;
    color: white !important;
    padding: 10px !important;
    border: 2px solid white !important;
    border-radius: 4px !important;
    font-size: 12px !important;
    z-index: 999999 !important;
    cursor: pointer !important;
  }
`;

// Function to initialize the extension when DOM is ready
function initializeExtension() {
  console.log('BMV Finder: DOM ready, initializing extension');
  
  // Inject styles into the page
  try {
    if (document.head) {
      document.head.appendChild(style);
      console.log('BMV Finder: Styles injected successfully');
    } else {
      console.log('BMV Finder: Document head not available');
      return;
    }
  } catch (error) {
    console.error('BMV Finder: Error injecting styles:', error);
    return;
  }

  // Add a simple test button to verify the extension is working
  addTestButton();

  // Initialize the PropertyCapture class
  new PropertyCapture();
}

// Add a simple test button to verify the extension is working
function addTestButton() {
  const testButton = document.createElement('div');
  testButton.id = 'bmv-test-button';
  testButton.className = 'bmv-test-button';
  testButton.textContent = 'BMV Extension Active';
  testButton.onclick = async () => {
    alert('BMV Finder extension is working! Check console for details.');
    console.log('BMV Finder: Test button clicked - extension is working');
    
    // Test background script communication
    try {
      console.log('BMV Finder: Testing background script communication...');
      const response = await chrome.runtime.sendMessage({
        action: 'captureProperty',
        data: {
          price: '£100,000',
          title: 'Test Property',
          address: 'Test Address',
          source: 'test',
          url: window.location.href,
          capturedAt: new Date().toISOString()
        }
      });
      console.log('BMV Finder: Background script test response:', response);
      if (response && response.success) {
        console.log('BMV Finder: Background script communication working!');
      } else {
        console.error('BMV Finder: Background script communication failed:', response);
      }
    } catch (error) {
      console.error('BMV Finder: Background script test error:', error);
    }
  };
  
  if (document.body) {
    document.body.appendChild(testButton);
    console.log('BMV Finder: Test button added successfully');
  } else {
    console.log('BMV Finder: Could not add test button - no body element');
  }
}

// Check if DOM is already ready
if (document.readyState === 'loading') {
  console.log('BMV Finder: DOM loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  console.log('BMV Finder: DOM already ready, initializing immediately');
  // Use setTimeout to ensure DOM is fully ready
  setTimeout(initializeExtension, 100);
}

class PropertyCapture {
  constructor() {
    console.log('BMV Finder: PropertyCapture class initialized');
    this.isCapturing = false;
    this.init();
  }

  init() {
    console.log('BMV Finder: Initializing on:', window.location.href);
    
    // Check if we're on a property page
    if (!this.isPropertyPage()) {
      console.log('BMV Finder: Not a property page, cleaning up any existing buttons');
      // Remove any existing buttons on non-property pages
      this.cleanupButtons();
      return;
    }

    console.log('BMV Finder: Property page detected, setting up capture button');
    
    // Set up the capture button
    this.setupCaptureButton();
    
    // Also try after a delay
    setTimeout(() => {
      this.setupCaptureButton();
    }, 2000);
    
    // Additional delay for slower loading pages
    setTimeout(() => {
      this.setupCaptureButton();
    }, 5000);
  }

  cleanupButtons() {
    // Remove any existing BMV Finder buttons
    const existingButtons = document.querySelectorAll('[id*="bmv-capture"], [class*="bmv-capture"]');
    existingButtons.forEach(button => {
      button.remove();
      console.log('BMV Finder: Cleaned up existing button');
    });
    
    // Also remove any containers
    const existingContainers = document.querySelectorAll('[id*="bmv-capture-container"]');
    existingContainers.forEach(container => {
      container.remove();
      console.log('BMV Finder: Cleaned up existing container');
    });
  }

  isPropertyPage() {
    const url = window.location.href;
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    console.log('BMV Finder: Checking if property page:', { url, hostname, pathname });
    
    // Don't inject on localhost pages (development environment)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('BMV Finder: Skipping injection on localhost development page');
      return false;
    }
    
    // Check URL patterns for property sites
    const propertyUrlPatterns = [
      /\/properties\//,
      /\/property\//,
      /\/for-sale\//,
      /\/to-rent\//,
      /\/buy\//,
      /\/rent\//
    ];
    
    const hasPropertyUrl = propertyUrlPatterns.some(pattern => pattern.test(url));
    
    // Check for specific site patterns
    const isRightmove = hostname.includes('rightmove.co.uk') && hasPropertyUrl;
    const isZoopla = hostname.includes('zoopla.co.uk') && hasPropertyUrl;
    const isOnTheMarket = hostname.includes('onthemarket.com') && hasPropertyUrl;
    const isPrimeLocation = hostname.includes('primelocation.com') && hasPropertyUrl;
    
    const isPropertyPage = isRightmove || isZoopla || isOnTheMarket || isPrimeLocation;
    
    console.log('BMV Finder: Property page check:', {
      url,
      hostname,
      pathname,
      hasPropertyUrl,
      isPropertyPage
    });
    
    return isPropertyPage;
  }

  setupCaptureButton() {
    console.log('BMV Finder: Setting up capture button...');
    
    // Remove existing button if any
    const existingButton = document.getElementById('bmv-capture-button');
    if (existingButton) {
      existingButton.remove();
      console.log('BMV Finder: Removed existing button');
    }

    // Find the property details section
    const propertyDetailsSection = this.findPropertyDetailsSection();
    
    if (!propertyDetailsSection) {
      console.log('BMV Finder: Could not find property details section, trying fallback injection');
      // Try fallback injection directly into body
      this.injectButtonFallback();
      return;
    }

    console.log('BMV Finder: Found injection point:', propertyDetailsSection);

    // Create and inject the button
    this.createAndInjectButton(propertyDetailsSection);
  }

  injectButtonFallback() {
    console.log('BMV Finder: Using fallback injection into body');
    
    // Create a container div for the button
    const container = document.createElement('div');
    container.id = 'bmv-capture-container';
    container.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      z-index: 999999 !important;
      max-width: 300px !important;
      background: rgba(255, 255, 255, 0.95) !important;
      padding: 10px !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      border: 2px solid #D4AF37 !important;
    `;
    
    this.createAndInjectButton(container);
    
    // Add container to body
    if (document.body) {
      document.body.appendChild(container);
      console.log('BMV Finder: Fallback button container injected');
      
      // Force the button to be visible
      setTimeout(() => {
        const button = document.getElementById('bmv-capture-button');
        if (button) {
          button.style.cssText += `
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: linear-gradient(135deg, #3A7CA5 0%, #2C6E91 100%) !important;
            color: white !important;
            border: 2px solid #D4AF37 !important;
            border-radius: 12px !important;
            padding: 16px 24px !important;
            margin: 0 !important;
            cursor: pointer !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 12px rgba(58, 124, 165, 0.3) !important;
            width: 100% !important;
            max-width: 300px !important;
            position: relative !important;
            overflow: hidden !important;
            z-index: 999999 !important;
          `;
          console.log('BMV Finder: Button forced to be visible with inline styles');
        }
      }, 100);
    } else {
      console.log('BMV Finder: ERROR - Document body not available for fallback injection');
    }
  }

  createAndInjectButton(parentElement) {
    // Create the button
    const button = document.createElement('button');
    button.id = 'bmv-capture-button';
    button.className = 'bmv-capture-button';
    button.innerHTML = `
      <div class="bmv-capture-content">
        <div class="bmv-capture-icon">🏠</div>
        <div class="bmv-capture-text">
          <div class="bmv-capture-title">Capture Property</div>
          <div class="bmv-capture-subtitle">Add to your watchlist</div>
        </div>
      </div>
    `;

    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.captureProperty();
    });

    // Insert the button
    try {
      parentElement.appendChild(button);
      console.log('BMV Finder: Button injected successfully into:', parentElement);
      
      // Debug: Check if button is actually in the DOM
      const checkButton = document.getElementById('bmv-capture-button');
      if (checkButton) {
        console.log('BMV Finder: Button confirmed in DOM:', checkButton);
        console.log('BMV Finder: Button styles:', window.getComputedStyle(checkButton));
      } else {
        console.log('BMV Finder: ERROR - Button not found in DOM after injection');
      }
    } catch (error) {
      console.error('BMV Finder: Error injecting button:', error);
      // Try fallback injection
      this.injectButtonFallback();
    }
  }

  findPropertyDetailsSection() {
    console.log('BMV Finder: Finding property details section...');
    
    // Try multiple strategies to find the best injection point
    const injectionStrategies = [
      // Strategy 1: Rightmove specific selectors
      () => {
        const rightmoveSelectors = [
          '[data-testid="property-details"]',
          '.propertyCard-details',
          '.propertyCard-summary',
          '.propertyCard-header',
          '.propertyCard-content',
          '.propertyCard',
          '.property-details',
          '.property-information',
          '.property-overview',
          '.property-summary'
        ];
        
        for (const selector of rightmoveSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            console.log('BMV Finder: Found Rightmove property details container:', selector);
            return element;
          }
        }
        return null;
      },
      
      // Strategy 2: Elements near the price
      () => {
        const priceSelectors = [
          '[data-testid="price"]',
          '.propertyCard-priceValue',
          '[data-testid="property-price"]',
          '[class*="price"]',
          '[class*="Price"]'
        ];
        
        for (const selector of priceSelectors) {
          const priceElements = document.querySelectorAll(selector);
          for (const priceEl of priceElements) {
            const parent = priceEl.closest('div, section, article');
            if (parent) {
              console.log('BMV Finder: Found element near price:', selector, parent);
              return parent;
            }
          }
        }
        return null;
      },
      
      // Strategy 3: Elements near the title/address
      () => {
        const titleSelectors = [
          '[data-testid="property-title"]',
          '.propertyCard-title',
          'h1',
          '[class*="title"]',
          '[class*="Title"]'
        ];
        
        for (const selector of titleSelectors) {
          const titleElements = document.querySelectorAll(selector);
          for (const titleEl of titleElements) {
            const parent = titleEl.closest('div, section, article');
            if (parent) {
              console.log('BMV Finder: Found element near title:', selector, parent);
              return parent;
            }
          }
        }
        return null;
      },
      
      // Strategy 4: Main content areas
      () => {
        const mainSelectors = [
          'main',
          '[role="main"]',
          '.main',
          '.main-content',
          '.content',
          '.container',
          '.wrapper',
          '#content',
          '#main'
        ];
        
        for (const selector of mainSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            console.log('BMV Finder: Found main content area:', selector);
            return element;
          }
        }
        return null;
      },
      
      // Strategy 5: Any element with property-related text
      () => {
        const propertyKeywords = ['price', 'bedroom', 'bathroom', 'property', 'house'];
        const allElements = document.querySelectorAll('div, section, article');
        
        for (const element of allElements) {
          const text = element.textContent.toLowerCase();
          if (propertyKeywords.some(keyword => text.includes(keyword))) {
            console.log('BMV Finder: Found element with property keywords:', element);
            return element;
          }
        }
        return null;
      }
    ];
    
    // Try each strategy
    for (let i = 0; i < injectionStrategies.length; i++) {
      try {
        const result = injectionStrategies[i]();
        if (result) {
          console.log(`BMV Finder: Strategy ${i + 1} successful, found injection point:`, result);
          return result;
        }
      } catch (error) {
        console.log(`BMV Finder: Strategy ${i + 1} failed:`, error);
      }
    }
    
    console.log('BMV Finder: No injection point found');
    return null;
  }

  async captureProperty() {
    if (this.isCapturing) {
      return;
    }

    this.isCapturing = true;
    
    const button = document.getElementById('bmv-capture-button');
    
    try {
      // Show loading state
      this.updateButtonState(button, 'loading', 'Capturing...');
      
      // Extract property data
      console.log('BMV Finder: Starting property data extraction...');
      const propertyData = this.extractPropertyData();
      
      console.log('BMV Finder: Extracted property data:', propertyData);
      
      // More flexible validation - only require either price OR title
      if (!propertyData) {
        throw new Error('No property data extracted');
      }
      
      if (!propertyData.price && !propertyData.title) {
        console.error('BMV Finder: Missing both price and title');
        console.error('BMV Finder: Price:', propertyData.price);
        console.error('BMV Finder: Title:', propertyData.title);
        console.error('BMV Finder: Full data:', propertyData);
        throw new Error('Could not extract price or title from the page. Please make sure you are on a property listing page.');
      }
      
      // If we have at least one required field, proceed
      console.log('BMV Finder: Property data validation passed, sending to background script');

      // Send message to background script to capture
      console.log('BMV Finder: Sending property data to background script...');
      const response = await chrome.runtime.sendMessage({
        action: 'captureProperty',
        data: propertyData
      });

      console.log('BMV Finder: Background script response:', response);

      if (response && response.success) {
        this.updateButtonState(button, 'success', 'Captured!');
        
        // Show a temporary success message on the page
        this.showSuccessMessage('Property captured successfully!');
        
        setTimeout(() => {
          this.updateButtonState(button, 'default', 'Capture Property');
        }, 2000);
      } else {
        const errorMessage = response ? response.error : 'No response from background script';
        throw new Error(errorMessage || 'Failed to capture property');
      }

    } catch (error) {
      console.error('BMV Finder: Error capturing property:', error);
      this.updateButtonState(button, 'error', `Error: ${error.message}`);
      
      // Show error for 3 seconds then reset
      setTimeout(() => {
        this.updateButtonState(button, 'default', 'Capture Property');
      }, 3000);
    } finally {
      this.isCapturing = false;
    }
  }

  updateButtonState(button, state, text) {
    console.log('BMV Finder: Updating button state:', { state, text, buttonFound: !!button });
    
    if (!button) {
      console.error('BMV Finder: No button element provided to updateButtonState');
      return;
    }
    
    // Remove all state classes
    button.classList.remove('bmv-loading', 'bmv-success', 'bmv-error');
    
    // Add current state class
    if (state !== 'default') {
      button.classList.add(`bmv-${state}`);
      console.log('BMV Finder: Added state class:', `bmv-${state}`);
    }
    
    // Update text
    const textElement = button.querySelector('.bmv-capture-title');
    if (textElement) {
      textElement.textContent = text;
      console.log('BMV Finder: Updated button text to:', text);
    } else {
      console.error('BMV Finder: Could not find .bmv-capture-title element in button');
    }
    
    // Force visual update with inline styles for important states
    if (state === 'success') {
      button.style.background = 'linear-gradient(135deg, #5DA271 0%, #3B755D 100%) !important';
      button.style.color = 'white !important';
      console.log('BMV Finder: Applied success styles');
    } else if (state === 'error') {
      button.style.background = 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%) !important';
      button.style.color = 'white !important';
      console.log('BMV Finder: Applied error styles');
    } else if (state === 'loading') {
      button.style.background = 'linear-gradient(135deg, #5DA271 0%, #3B755D 100%) !important';
      button.style.color = 'white !important';
      console.log('BMV Finder: Applied loading styles');
    } else {
      // Reset to default
      button.style.background = '';
      button.style.color = '';
      console.log('BMV Finder: Reset to default styles');
    }
  }

  extractPropertyData() {
    const hostname = window.location.hostname;
    
    let baseData;
    if (hostname.includes('rightmove.co.uk')) {
      baseData = this.extractRightmoveData();
    } else if (hostname.includes('zoopla.co.uk')) {
      baseData = this.extractZooplaData();
    } else if (hostname.includes('onthemarket.com')) {
      baseData = this.extractOnTheMarketData();
    } else if (hostname.includes('primelocation.com')) {
      baseData = this.extractPrimeLocationData();
    } else {
      baseData = this.extractGenericData();
    }
    
    // Apply enhanced data extraction to improve parsing
    if (baseData) {
      return this.extractEnhancedData(baseData);
    }
    
    return baseData;
  }

  // Enhanced data extraction with better parsing
  extractEnhancedData(baseData) {
    // Extract bedrooms from title
    const bedroomMatch = baseData.title.match(/(\d+)\s*(?:bed|bedroom|BR)/i);
    const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : 0;
    
    // Extract property type from title
    const propertyTypeMatch = baseData.title.match(/(Semi-Detached|Detached|Terraced|Flat|Apartment|Bungalow|Maisonette|Studio|Cottage|House)/i);
    const propertyType = propertyTypeMatch ? propertyTypeMatch[1].toLowerCase() : 'house';
    
    // Extract postcode from title or address
    const postcodeMatch = (baseData.title + ' ' + (baseData.address || '')).match(/[A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2}/i);
    const postcode = postcodeMatch ? postcodeMatch[0].toUpperCase() : '';
    
    // Extract address components
    const addressParts = (baseData.address || '').split(',').map(part => part.trim());
    const street = addressParts[0] || '';
    const city = addressParts[addressParts.length - 2] || '';
    
    // Extract size information from description or title
    const sizeMatch = (baseData.description || baseData.title).match(/(\d+(?:\.\d+)?)\s*(sq\s*ft|sq\s*m|square\s*feet|square\s*meters|m²|ft²)/i);
    const totalSize = sizeMatch ? {
      value: parseFloat(sizeMatch[1]),
      unit: sizeMatch[2].toLowerCase().includes('m') ? 'sqm' : 'sqft'
    } : null;
    
    // Extract floor plan links
    const floorPlanLinks = this.extractFloorPlanLinks();
    
    return {
      ...baseData,
      bedrooms: bedrooms,
      property_type: propertyType,
      postcode: postcode,
      address: baseData.address || street,
      street: street,
      city: city,
      total_size: totalSize,
      floor_plan_links: floorPlanLinks
    };
  }

  extractRightmoveData() {
    try {
      console.log('BMV Finder: Extracting Rightmove data...');
      
      // Debug: Let's see what's actually on the page
      this.debugPageStructure();
      
      // Price - try multiple selectors
      const priceSelectors = [
        '[data-testid="price"]',
        '.propertyCard-priceValue',
        '[data-testid="property-price"]',
        '.price',
        '[class*="price"]',
        '[class*="Price"]',
        'h1 + div', // Often price is near the title
        '.propertyCard-price',
        '.listing-price',
        '.property-price',
        '[data-testid="listing-price"]'
      ];
      
      let price = null;
      for (const selector of priceSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          price = this.extractPrice(element.textContent);
          if (price) {
            console.log('BMV Finder: Found price with selector:', selector, price);
            break;
          }
        }
      }
      
      // If no price found, try to extract from page text
      if (!price) {
        const pageText = document.body.textContent;
        price = this.extractPrice(pageText);
        console.log('BMV Finder: Extracted price from page text:', price);
      }

      // Title/Address - try multiple selectors
      const titleSelectors = [
        '[data-testid="property-title"]',
        '.propertyCard-title',
        'h1',
        '[class*="title"]',
        '[class*="Title"]',
        '.property-title',
        '.listing-title',
        '[data-testid="listing-title"]'
      ];
      
      let title = null;
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          title = element.textContent.trim();
          if (title && title.length > 0) {
            console.log('BMV Finder: Found title with selector:', selector, title);
            break;
          }
        }
      }

      // Address - try multiple selectors
      const addressSelectors = [
        '[data-testid="property-address"]',
        '.propertyCard-address',
        '[data-testid="address"]',
        '.address',
        '[class*="address"]',
        '.property-address',
        '.listing-address',
        '[data-testid="listing-address"]'
      ];
      
      let address = null;
      for (const selector of addressSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          address = element.textContent.trim();
          if (address && address.length > 0) {
            console.log('BMV Finder: Found address with selector:', selector, address);
            break;
          }
        }
      }

      // Enhanced Bedrooms extraction - try more specific selectors
      const bedroomSelectors = [
        '[data-testid="property-beds"]',
        '.propertyCard-beds',
        '[data-testid="beds"]',
        '[class*="bed"]',
        '[class*="Bed"]',
        '.bedrooms',
        '.beds',
        '[data-testid="bedrooms"]',
        '.property-beds',
        '.listing-beds',
        // Look for text patterns like "3 bed", "3 bedroom", "3 BR"
        'span:contains("bed"), span:contains("Bed")',
        'div:contains("bed"), div:contains("Bed")'
      ];
      
      let bedrooms = null;
      for (const selector of bedroomSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          // Look for patterns like "3 bed", "3 bedroom", "3 BR"
          const bedMatch = text.match(/(\d+)\s*(?:bed|bedroom|BR)/i);
          if (bedMatch) {
            bedrooms = parseInt(bedMatch[1]);
            console.log('BMV Finder: Found bedrooms with selector:', selector, bedrooms, 'from text:', text);
            break;
          }
          // Also try the general number extraction
          bedrooms = this.extractNumber(text);
          if (bedrooms && bedrooms <= 10) { // Reasonable bedroom count
            console.log('BMV Finder: Found bedrooms with selector:', selector, bedrooms, 'from text:', text);
            break;
          }
        }
        if (bedrooms) break;
      }

      // Enhanced Bathrooms extraction
      const bathroomSelectors = [
        '[data-testid="property-baths"]',
        '.propertyCard-baths',
        '[data-testid="baths"]',
        '[class*="bath"]',
        '[class*="Bath"]',
        '.bathrooms',
        '.baths',
        '[data-testid="bathrooms"]',
        '.property-baths',
        '.listing-baths',
        // Look for text patterns like "2 bath", "2 bathroom", "2 BA"
        'span:contains("bath"), span:contains("Bath")',
        'div:contains("bath"), div:contains("Bath")'
      ];
      
      let bathrooms = null;
      for (const selector of bathroomSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          // Look for patterns like "2 bath", "2 bathroom", "2 BA"
          const bathMatch = text.match(/(\d+)\s*(?:bath|bathroom|BA)/i);
          if (bathMatch) {
            bathrooms = parseInt(bathMatch[1]);
            console.log('BMV Finder: Found bathrooms with selector:', selector, bathrooms, 'from text:', text);
            break;
          }
          // Also try the general number extraction
          bathrooms = this.extractNumber(text);
          if (bathrooms && bathrooms <= 10) { // Reasonable bathroom count
            console.log('BMV Finder: Found bathrooms with selector:', selector, bathrooms, 'from text:', text);
            break;
          }
        }
        if (bathrooms) break;
      }

      // Enhanced Property type extraction
      const typeSelectors = [
        '[data-testid="property-type"]',
        '.propertyCard-propertyType',
        '[data-testid="type"]',
        '[class*="type"]',
        '[class*="Type"]',
        '.property-type',
        '.listing-type',
        '[data-testid="listing-type"]',
        '.propertyCard-propertyType',
        // Look for common property type text
        'span:contains("Semi-Detached"), span:contains("Detached"), span:contains("Terraced"), span:contains("Flat"), span:contains("Apartment")',
        'div:contains("Semi-Detached"), div:contains("Detached"), div:contains("Terraced"), div:contains("Flat"), div:contains("Apartment")'
      ];
      
      let propertyType = null;
      for (const selector of typeSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.trim();
          if (text && text.length > 0) {
            // Look for common property types
            const typeMatch = text.match(/(Semi-Detached|Detached|Terraced|Flat|Apartment|Bungalow|Maisonette|Studio|Cottage|House)/i);
            if (typeMatch) {
              propertyType = typeMatch[1];
              console.log('BMV Finder: Found property type with selector:', selector, propertyType, 'from text:', text);
              break;
            }
            // If no match, use the full text if it's reasonable
            if (text.length < 50) {
              propertyType = text;
              console.log('BMV Finder: Found property type with selector:', selector, propertyType);
              break;
            }
          }
        }
      }

      // NEW: Size extraction (square footage)
      const sizeSelectors = [
        '[data-testid="property-size"]',
        '.propertyCard-size',
        '[data-testid="size"]',
        '[class*="size"]',
        '[class*="Size"]',
        '.property-size',
        '.listing-size',
        '[data-testid="listing-size"]',
        // Look for square footage patterns
        'span:contains("sq ft"), span:contains("sq m"), span:contains("square")',
        'div:contains("sq ft"), div:contains("sq m"), div:contains("square")'
      ];
      
      let size = null;
      for (const selector of sizeSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          // Look for size patterns like "1,200 sq ft", "120 sq m", "1,200 square feet"
          const sizeMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*(?:sq\s*ft|sq\s*m|square\s*feet|square\s*meters)/i);
          if (sizeMatch) {
            size = sizeMatch[0];
            console.log('BMV Finder: Found size with selector:', selector, size, 'from text:', text);
            break;
          }
        }
        if (size) break;
      }

      // NEW: EPC (Energy Performance Certificate) extraction
      const epcSelectors = [
        '[data-testid="epc-rating"]',
        '.propertyCard-epc',
        '[data-testid="epc"]',
        '[class*="epc"]',
        '[class*="EPC"]',
        '.property-epc',
        '.listing-epc',
        '[data-testid="listing-epc"]',
        // Look for EPC patterns
        'span:contains("EPC"), span:contains("Energy"), span:contains("Rating")',
        'div:contains("EPC"), div:contains("Energy"), div:contains("Rating")'
      ];
      
      let epcRating = null;
      let epcScore = null;
      
      for (const selector of epcSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          // Look for EPC rating patterns like "EPC Rating: A", "Energy Rating: B", "A (92)", "B (81-91)"
          const epcMatch = text.match(/(?:EPC|Energy)\s*(?:Rating|Performance)\s*:?\s*([A-G])\s*(?:\((\d+(?:-\d+)?)\))?/i);
          if (epcMatch) {
            epcRating = epcMatch[1].toUpperCase();
            epcScore = epcMatch[2] || null;
            console.log('BMV Finder: Found EPC with selector:', selector, epcRating, epcScore, 'from text:', text);
            break;
          }
          // Also look for just the rating letter
          const simpleEpcMatch = text.match(/\b([A-G])\s*(?:\((\d+(?:-\d+)?)\))?/i);
          if (simpleEpcMatch && text.length < 50) {
            epcRating = simpleEpcMatch[1].toUpperCase();
            epcScore = simpleEpcMatch[2] || null;
            console.log('BMV Finder: Found simple EPC with selector:', selector, epcRating, epcScore, 'from text:', text);
            break;
          }
        }
        if (epcRating) break;
      }

      // Images
      const images = this.extractImages();
      console.log('BMV Finder: Found images:', images.length);

      // Agent - try multiple selectors
      const agentSelectors = [
        '[data-testid="agent-name"]',
        '.propertyCard-agentName',
        '[data-testid="agent"]',
        '[class*="agent"]',
        '[class*="Agent"]',
        '.agent',
        '.listing-agent',
        '[data-testid="listing-agent"]'
      ];
      
      let agent = null;
      for (const selector of agentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          agent = element.textContent.trim();
          if (agent && agent.length > 0) {
            console.log('BMV Finder: Found agent with selector:', selector, agent);
            break;
          }
        }
      }

      // Get the clean property URL (remove any fragments or parameters that might interfere)
      const propertyUrl = this.getCleanPropertyUrl();

      const propertyData = {
        price,
        title,
        address,
        bedrooms,
        bathrooms,
        propertyType,
        size,
        epcRating,
        epcScore,
        images,
        agent,
        source: 'rightmove.co.uk',
        url: propertyUrl,
        capturedAt: new Date().toISOString()
      };

      console.log('BMV Finder: Extracted property data:', propertyData);
      
      // Validate required fields
      if (!price && !title) {
        console.error('BMV Finder: Missing required fields - price and title');
        throw new Error('Could not extract price or title from the page');
      }

      return propertyData;
    } catch (error) {
      console.error('BMV Finder: Error extracting Rightmove data:', error);
      throw new Error('Failed to extract property data from Rightmove: ' + error.message);
    }
  }

  debugPageStructure() {
    console.log('BMV Finder: === DEBUGGING PAGE STRUCTURE ===');
    
    // Check for common elements
    const h1Elements = document.querySelectorAll('h1');
    console.log('BMV Finder: H1 elements found:', h1Elements.length);
    h1Elements.forEach((h1, index) => {
      console.log(`BMV Finder: H1 ${index}:`, h1.textContent.trim());
    });
    
    // Check for price-like elements
    const priceLikeElements = document.querySelectorAll('[class*="price"], [class*="Price"], [class*="cost"], [class*="Cost"]');
    console.log('BMV Finder: Price-like elements found:', priceLikeElements.length);
    priceLikeElements.forEach((el, index) => {
      console.log(`BMV Finder: Price-like ${index}:`, el.textContent.trim(), 'Class:', el.className);
    });
    
    // Check for address-like elements
    const addressLikeElements = document.querySelectorAll('[class*="address"], [class*="Address"], [class*="location"], [class*="Location"]');
    console.log('BMV Finder: Address-like elements found:', addressLikeElements.length);
    addressLikeElements.forEach((el, index) => {
      console.log(`BMV Finder: Address-like ${index}:`, el.textContent.trim(), 'Class:', el.className);
    });
    
    // Check for bedroom/bathroom elements
    const bedBathElements = document.querySelectorAll('[class*="bed"], [class*="Bed"], [class*="bath"], [class*="Bath"]');
    console.log('BMV Finder: Bed/Bath elements found:', bedBathElements.length);
    bedBathElements.forEach((el, index) => {
      console.log(`BMV Finder: Bed/Bath ${index}:`, el.textContent.trim(), 'Class:', el.className);
    });
    
    console.log('BMV Finder: === END DEBUGGING ===');
  }

  extractZooplaData() {
    try {
      console.log('BMV Finder: Extracting Zoopla data...');
      
      // Debug: Let's see what's actually on the page
      this.debugPageStructure();
      
      // Price - try multiple selectors
      const priceSelectors = [
        '[data-testid="price"]',
        '.listing-price',
        '[data-testid="property-price"]',
        '.price',
        '[class*="price"]',
        '[class*="Price"]',
        'h1 + div',
        '.property-price',
        '[data-testid="listing-price"]',
        // Zoopla specific selectors
        '[data-testid="price-value"]',
        '.css-1tppcjb',
        '.css-10b0gli'
      ];
      
      let price = null;
      for (const selector of priceSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          price = this.extractPrice(element.textContent);
          if (price) {
            console.log('BMV Finder: Found price with selector:', selector, price);
            break;
          }
        }
      }
      
      // If no price found, try to extract from page text
      if (!price) {
        const pageText = document.body.textContent;
        price = this.extractPrice(pageText);
        console.log('BMV Finder: Extracted price from page text:', price);
      }

      // Title/Address - try multiple selectors
      const titleSelectors = [
        '[data-testid="property-title"]',
        '.listing-title',
        'h1',
        '[class*="title"]',
        '[class*="Title"]',
        '.property-title',
        '[data-testid="listing-title"]',
        // Zoopla specific selectors
        '[data-testid="address"]',
        '.css-1tppcjb',
        '.css-10b0gli'
      ];
      
      let title = null;
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          title = element.textContent.trim();
          if (title && title.length > 0) {
            console.log('BMV Finder: Found title with selector:', selector, title);
            break;
          }
        }
      }

      // Address - try multiple selectors
      const addressSelectors = [
        '[data-testid="property-address"]',
        '.listing-address',
        '[data-testid="address"]',
        '.address',
        '[class*="address"]',
        '.property-address',
        '[data-testid="listing-address"]',
        // Zoopla specific selectors
        '[data-testid="address-line"]',
        '.css-1tppcjb',
        '.css-10b0gli'
      ];
      
      let address = null;
      for (const selector of addressSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          address = element.textContent.trim();
          if (address && address.length > 0) {
            console.log('BMV Finder: Found address with selector:', selector, address);
            break;
          }
        }
      }

      // Enhanced Bedrooms extraction
      const bedroomSelectors = [
        '[data-testid="property-beds"]',
        '.listing-beds',
        '[data-testid="beds"]',
        '[class*="bed"]',
        '[class*="Bed"]',
        '.bedrooms',
        '.beds',
        '[data-testid="bedrooms"]',
        '.property-beds',
        // Zoopla specific selectors
        '[data-testid="bedroom-count"]',
        '.css-1tppcjb',
        '.css-10b0gli'
      ];
      
      let bedrooms = null;
      for (const selector of bedroomSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          // Look for patterns like "3 bed", "3 bedroom", "3 BR"
          const bedMatch = text.match(/(\d+)\s*(?:bed|bedroom|BR)/i);
          if (bedMatch) {
            bedrooms = parseInt(bedMatch[1]);
            console.log('BMV Finder: Found bedrooms with selector:', selector, bedrooms, 'from text:', text);
            break;
          }
          // Also try the general number extraction
          bedrooms = this.extractNumber(text);
          if (bedrooms && bedrooms <= 10) { // Reasonable bedroom count
            console.log('BMV Finder: Found bedrooms with selector:', selector, bedrooms, 'from text:', text);
            break;
          }
        }
        if (bedrooms) break;
      }

      // Enhanced Bathrooms extraction
      const bathroomSelectors = [
        '[data-testid="property-baths"]',
        '.listing-baths',
        '[data-testid="baths"]',
        '[class*="bath"]',
        '[class*="Bath"]',
        '.bathrooms',
        '.baths',
        '[data-testid="bathrooms"]',
        '.property-baths',
        // Zoopla specific selectors
        '[data-testid="bathroom-count"]',
        '.css-1tppcjb',
        '.css-10b0gli'
      ];
      
      let bathrooms = null;
      for (const selector of bathroomSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          // Look for patterns like "2 bath", "2 bathroom", "2 BA"
          const bathMatch = text.match(/(\d+)\s*(?:bath|bathroom|BA)/i);
          if (bathMatch) {
            bathrooms = parseInt(bathMatch[1]);
            console.log('BMV Finder: Found bathrooms with selector:', selector, bathrooms, 'from text:', text);
            break;
          }
          // Also try the general number extraction
          bathrooms = this.extractNumber(text);
          if (bathrooms && bathrooms <= 10) { // Reasonable bathroom count
            console.log('BMV Finder: Found bathrooms with selector:', selector, bathrooms, 'from text:', text);
            break;
          }
        }
        if (bathrooms) break;
      }

      // Enhanced Property type extraction
      const typeSelectors = [
        '[data-testid="property-type"]',
        '.listing-type',
        '[data-testid="type"]',
        '[class*="type"]',
        '[class*="Type"]',
        '.property-type',
        '[data-testid="listing-type"]',
        // Zoopla specific selectors
        '[data-testid="property-type"]',
        '.css-1tppcjb',
        '.css-10b0gli'
      ];
      
      let propertyType = null;
      for (const selector of typeSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.trim();
          if (text && text.length > 0) {
            // Look for common property types
            const typeMatch = text.match(/(Semi-Detached|Detached|Terraced|Flat|Apartment|Bungalow|Maisonette|Studio|Cottage|House)/i);
            if (typeMatch) {
              propertyType = typeMatch[1];
              console.log('BMV Finder: Found property type with selector:', selector, propertyType, 'from text:', text);
              break;
            }
            // If no match, use the full text if it's reasonable
            if (text.length < 50) {
              propertyType = text;
              console.log('BMV Finder: Found property type with selector:', selector, propertyType);
              break;
            }
          }
        }
      }

      // EPC extraction for Zoopla
      const epcSelectors = [
        '[data-testid="epc-rating"]',
        '.listing-epc',
        '[data-testid="epc"]',
        '[class*="epc"]',
        '[class*="EPC"]',
        '.property-epc',
        '[data-testid="listing-epc"]',
        // Zoopla specific selectors
        '[data-testid="energy-rating"]',
        '.css-1tppcjb',
        '.css-10b0gli'
      ];
      
      let epcRating = null;
      let epcScore = null;
      
      for (const selector of epcSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          // Look for EPC rating patterns like "EPC Rating: A", "Energy Rating: B", "A (92)", "B (81-91)"
          const epcMatch = text.match(/(?:EPC|Energy)\s*(?:Rating|Performance)\s*:?\s*([A-G])\s*(?:\((\d+(?:-\d+)?)\))?/i);
          if (epcMatch) {
            epcRating = epcMatch[1].toUpperCase();
            epcScore = epcMatch[2] || null;
            console.log('BMV Finder: Found EPC with selector:', selector, epcRating, epcScore, 'from text:', text);
            break;
          }
          // Also look for just the rating letter
          const simpleEpcMatch = text.match(/\b([A-G])\s*(?:\((\d+(?:-\d+)?)\))?/i);
          if (simpleEpcMatch && text.length < 50) {
            epcRating = simpleEpcMatch[1].toUpperCase();
            epcScore = simpleEpcMatch[2] || null;
            console.log('BMV Finder: Found simple EPC with selector:', selector, epcRating, epcScore, 'from text:', text);
            break;
          }
        }
        if (epcRating) break;
      }

      // Images
      const images = this.extractImages();
      console.log('BMV Finder: Found images:', images.length);

      // Agent - try multiple selectors
      const agentSelectors = [
        '[data-testid="agent-name"]',
        '.listing-agent',
        '[data-testid="agent"]',
        '[class*="agent"]',
        '[class*="Agent"]',
        '.agent',
        '[data-testid="listing-agent"]',
        // Zoopla specific selectors
        '[data-testid="agent-name"]',
        '.css-1tppcjb',
        '.css-10b0gli'
      ];
      
      let agent = null;
      for (const selector of agentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          agent = element.textContent.trim();
          if (agent && agent.length > 0) {
            console.log('BMV Finder: Found agent with selector:', selector, agent);
            break;
          }
        }
      }

      // Get the clean property URL
      const propertyUrl = this.getCleanPropertyUrl();

      const propertyData = {
        price,
        title,
        address,
        bedrooms,
        bathrooms,
        propertyType,
        epcRating,
        epcScore,
        images,
        agent,
        source: 'zoopla.co.uk',
        url: propertyUrl,
        capturedAt: new Date().toISOString()
      };

      console.log('BMV Finder: Extracted Zoopla property data:', propertyData);
      
      // Validate required fields
      if (!price && !title) {
        console.error('BMV Finder: Missing required fields - price and title');
        throw new Error('Could not extract price or title from the page');
      }

      return propertyData;
    } catch (error) {
      console.error('BMV Finder: Error extracting Zoopla data:', error);
      throw new Error('Failed to extract property data from Zoopla: ' + error.message);
    }
  }

  extractOnTheMarketData() {
    // Similar extraction logic for OnTheMarket
    return this.extractGenericData();
  }

  extractPrimeLocationData() {
    // Similar extraction logic for PrimeLocation
    return this.extractGenericData();
  }

  extractGenericData() {
    try {
      // Generic extraction that works across multiple sites
      const price = this.extractPrice(document.body.textContent);
      const title = document.querySelector('h1')?.textContent.trim() || 
                   document.querySelector('title')?.textContent.trim();
      const address = this.extractAddress();
      const bedrooms = this.extractNumber(document.body.textContent);
      const bathrooms = this.extractNumber(document.body.textContent);
      const propertyType = this.extractPropertyType();
      const images = this.extractImages();
      const agent = this.extractAgent();

      return {
        price,
        title,
        address,
        bedrooms,
        bathrooms,
        propertyType,
        images,
        agent,
        source: window.location.hostname,
        url: window.location.href,
        capturedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error extracting generic data:', error);
      throw new Error('Failed to extract property data');
    }
  }

  extractPrice(text) {
    if (!text) return null;
    
    // Try multiple price patterns
    const pricePatterns = [
      /£[\d,]+/, // £100,000
      /[\d,]+/, // 100,000 (without £)
      /Price:?\s*£?([\d,]+)/i, // Price: £100,000
      /£?([\d,]+)\s*(?:pcm|per month)/i, // £1,000 pcm
      /£?([\d,]+)\s*(?:pw|per week)/i, // £250 pw
    ];
    
    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        let price = match[0];
        
        // Clean up the price
        price = price.replace(/[^\d,]/g, ''); // Remove non-numeric characters except commas
        price = price.replace(/,/g, ''); // Remove commas
        
        // Add £ symbol if not present
        if (!price.startsWith('£')) {
          price = '£' + price;
        }
        
        console.log('BMV Finder: Extracted price:', price, 'from text:', text.substring(0, 100));
        return price;
      }
    }
    
    console.log('BMV Finder: No price found in text:', text.substring(0, 100));
    return null;
  }

  extractNumber(text) {
    if (!text) return null;
    const numberMatch = text.match(/(\d+)/);
    return numberMatch ? parseInt(numberMatch[1]) : null;
  }

  extractAddress() {
    // Try to find address in various elements
    const addressSelectors = [
      '[data-testid="address"]',
      '.address',
      '.property-address',
      '.listing-address'
    ];
    
    for (const selector of addressSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    
    return null;
  }

  extractPropertyType() {
    const typeSelectors = [
      '[data-testid="property-type"]',
      '.property-type',
      '.listing-type'
    ];
    
    for (const selector of typeSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    
    return 'Unknown';
  }

  extractImages() {
    const images = [];
    const hostname = window.location.hostname;
    
    console.log('BMV Finder: Starting image extraction for hostname:', hostname);
    
    // Site-specific image extraction
    if (hostname.includes('rightmove.co.uk')) {
      // Rightmove specific selectors
      const rightmoveSelectors = [
        '.property-header-photo img',
        '.property-header-photo__img',
        '.gallery-item img',
        '.property-gallery img',
        '[data-testid="property-image"] img',
        '.property-header__image img',
        '.photo img',
        '.propertyCard-photo img',
        '.listing-photo img',
        '.property-photo img'
      ];
      
      for (const selector of rightmoveSelectors) {
        const imgElements = document.querySelectorAll(selector);
        console.log(`BMV Finder: Found ${imgElements.length} images with selector: ${selector}`);
        
        imgElements.forEach((img, index) => {
          console.log(`BMV Finder: Image ${index + 1} src:`, img.src);
          console.log(`BMV Finder: Image ${index + 1} naturalWidth:`, img.naturalWidth);
          console.log(`BMV Finder: Image ${index + 1} naturalHeight:`, img.naturalHeight);
          
          if (this.isValidImage(img)) {
            const highResSrc = this.getHighResImageUrl(img.src);
            console.log(`BMV Finder: Adding valid image:`, highResSrc);
            images.push(highResSrc);
          }
        });
      }
    } else if (hostname.includes('zoopla.co.uk')) {
      // Zoopla specific selectors
      const zooplaSelectors = [
        '.photo-tour__image img',
        '.photo-tour__main-image img',
        '.gallery__image img',
        '.property-gallery img',
        '.photo img',
        '[data-testid="property-image"] img',
        '.listing-photo img',
        '.property-photo img',
        '.gallery-item img'
      ];
      
      for (const selector of zooplaSelectors) {
        const imgElements = document.querySelectorAll(selector);
        console.log(`BMV Finder: Found ${imgElements.length} images with selector: ${selector}`);
        
        imgElements.forEach((img, index) => {
          console.log(`BMV Finder: Image ${index + 1} src:`, img.src);
          
          if (this.isValidImage(img)) {
            const highResSrc = this.getHighResImageUrl(img.src);
            console.log(`BMV Finder: Adding valid image:`, highResSrc);
            images.push(highResSrc);
          }
        });
      }
    } else if (hostname.includes('onthemarket.com')) {
      // OnTheMarket specific selectors
      const onTheMarketSelectors = [
        '.property-gallery img',
        '.photo img',
        '.gallery-item img',
        '[data-testid="property-image"] img',
        '.listing-photo img',
        '.property-photo img'
      ];
      
      for (const selector of onTheMarketSelectors) {
        const imgElements = document.querySelectorAll(selector);
        console.log(`BMV Finder: Found ${imgElements.length} images with selector: ${selector}`);
        
        imgElements.forEach((img, index) => {
          console.log(`BMV Finder: Image ${index + 1} src:`, img.src);
          
          if (this.isValidImage(img)) {
            console.log(`BMV Finder: Adding valid image:`, img.src);
            images.push(img.src);
          }
        });
      }
    } else {
      // Generic fallback - look for property-related images
      const genericSelectors = [
        'img[src*="property"]',
        'img[src*="listing"]',
        'img[src*="photo"]',
        'img[src*="image"]',
        '.gallery img',
        '.photos img',
        '.property img',
        'img[src*="house"]',
        'img[src*="home"]'
      ];
      
      for (const selector of genericSelectors) {
        const imgElements = document.querySelectorAll(selector);
        console.log(`BMV Finder: Found ${imgElements.length} images with selector: ${selector}`);
        
        imgElements.forEach((img, index) => {
          console.log(`BMV Finder: Image ${index + 1} src:`, img.src);
          
          if (this.isValidImage(img)) {
            console.log(`BMV Finder: Adding valid image:`, img.src);
            images.push(img.src);
          }
        });
      }
    }
    
    // Remove duplicates and limit to 5 images
    const uniqueImages = [...new Set(images)];
    console.log('BMV Finder: Final unique images:', uniqueImages);
    
    // If no images found, try data attributes (for lazy-loaded images)
    if (uniqueImages.length === 0) {
      console.log('BMV Finder: No images found, trying data attributes...');
      
      const dataAttributeSelectors = [
        'img[data-src]',
        'img[data-lazy-src]',
        'img[data-original]',
        'img[data-srcset]',
        '.lazy img',
        '.lazy-load img'
      ];
      
      for (const selector of dataAttributeSelectors) {
        const imgElements = document.querySelectorAll(selector);
        console.log(`BMV Finder: Found ${imgElements.length} lazy-loaded images with selector: ${selector}`);
        
        imgElements.forEach((img, index) => {
          const dataSrc = img.getAttribute('data-src') || 
                         img.getAttribute('data-lazy-src') || 
                         img.getAttribute('data-original');
          
          console.log(`BMV Finder: Lazy image ${index + 1} data-src:`, dataSrc);
          
          if (dataSrc && this.isValidImageUrl(dataSrc)) {
            console.log(`BMV Finder: Adding valid lazy image:`, dataSrc);
            uniqueImages.push(dataSrc);
          }
        });
      }
    }
    
    const finalImages = uniqueImages.slice(0, 5);
    console.log('BMV Finder: Returning final images:', finalImages);
    return finalImages;
  }

  extractFloorPlanLinks() {
    const floorPlanLinks = [];
    const hostname = window.location.hostname;
    
    console.log('BMV Finder: Extracting floor plan links for hostname:', hostname);
    
    // Site-specific floor plan extraction
    if (hostname.includes('rightmove.co.uk')) {
      const rightmoveSelectors = [
        'a[href*="floorplan"]',
        'a[href*="floor-plan"]',
        'a[href*="floor_plan"]',
        'a[href*="plan"]',
        'a[href*="drawing"]',
        'a[href*="layout"]',
        '.floorplan-link',
        '.floor-plan-link',
        '[data-testid="floorplan"]',
        '[data-testid="floor-plan"]'
      ];
      
      for (const selector of rightmoveSelectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`BMV Finder: Found ${elements.length} floor plan elements with selector: ${selector}`);
        
        elements.forEach((element, index) => {
          const href = element.getAttribute('href');
          const text = element.textContent?.trim();
          
          console.log(`BMV Finder: Floor plan ${index + 1} href:`, href);
          console.log(`BMV Finder: Floor plan ${index + 1} text:`, text);
          
          if (href && href.includes('http')) {
            floorPlanLinks.push({
              url: href,
              text: text || 'Floor Plan'
            });
          }
        });
      }
    } else if (hostname.includes('zoopla.co.uk')) {
      const zooplaSelectors = [
        'a[href*="floorplan"]',
        'a[href*="floor-plan"]',
        'a[href*="plan"]',
        'a[href*="drawing"]',
        '.floorplan-link',
        '.floor-plan-link',
        '[data-testid="floorplan"]',
        '[data-testid="floor-plan"]',
        'a[href*="media"]'
      ];
      
      for (const selector of zooplaSelectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`BMV Finder: Found ${elements.length} floor plan elements with selector: ${selector}`);
        
        elements.forEach((element, index) => {
          const href = element.getAttribute('href');
          const text = element.textContent?.trim();
          
          if (href && href.includes('http')) {
            floorPlanLinks.push({
              url: href,
              text: text || 'Floor Plan'
            });
          }
        });
      }
    } else if (hostname.includes('onthemarket.com')) {
      const onTheMarketSelectors = [
        'a[href*="floorplan"]',
        'a[href*="floor-plan"]',
        'a[href*="plan"]',
        'a[href*="drawing"]',
        '.floorplan-link',
        '.floor-plan-link'
      ];
      
      for (const selector of onTheMarketSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          const href = element.getAttribute('href');
          const text = element.textContent?.trim();
          
          if (href && href.includes('http')) {
            floorPlanLinks.push({
              url: href,
              text: text || 'Floor Plan'
            });
          }
        });
      }
    }
    
    // Remove duplicates
    const uniqueFloorPlanLinks = floorPlanLinks.filter((link, index, self) => 
      index === self.findIndex(l => l.url === link.url)
    );
    
    console.log('BMV Finder: Final floor plan links:', uniqueFloorPlanLinks);
    return uniqueFloorPlanLinks;
  }

  // Helper method to validate if an image element is valid
  isValidImage(img) {
    if (!img.src || !img.src.includes('http')) {
      return false;
    }
    
    // Check for tracking URLs and placeholders
    const invalidPatterns = [
      'bat.bing.com',
      'tracking',
      'placeholder',
      'marker',
      'logo',
      'icon',
      'avatar',
      'profile',
      'banner',
      'advertisement',
      'sponsor',
      'analytics',
      'pixel',
      'beacon',
      'tracker'
    ];
    
    const lowerSrc = img.src.toLowerCase();
    for (const pattern of invalidPatterns) {
      if (lowerSrc.includes(pattern)) {
        console.log(`BMV Finder: Rejecting image with pattern "${pattern}":`, img.src);
        return false;
      }
    }
    
    // Check image dimensions (must be reasonably sized)
    if (img.naturalWidth < 200 || img.naturalHeight < 200) {
      console.log(`BMV Finder: Rejecting small image (${img.naturalWidth}x${img.naturalHeight}):`, img.src);
      return false;
    }
    
    return true;
  }

  // Helper method to validate image URLs
  isValidImageUrl(url) {
    if (!url || !url.includes('http')) {
      return false;
    }
    
    const invalidPatterns = [
      'bat.bing.com',
      'tracking',
      'placeholder',
      'marker',
      'logo',
      'icon',
      'avatar',
      'profile',
      'banner',
      'advertisement',
      'sponsor',
      'analytics',
      'pixel',
      'beacon',
      'tracker'
    ];
    
    const lowerUrl = url.toLowerCase();
    for (const pattern of invalidPatterns) {
      if (lowerUrl.includes(pattern)) {
        console.log(`BMV Finder: Rejecting URL with pattern "${pattern}":`, url);
        return false;
      }
    }
    
    return true;
  }

  // Helper method to get high-resolution image URL
  getHighResImageUrl(src) {
    if (!src) return src;
    
    // Try to get higher resolution versions
    const highResPatterns = [
      /\/\d+x\d+\//g,  // Replace size patterns like /300x200/
      /_small\./g,     // Replace _small with _large
      /_thumb\./g,     // Replace _thumb with _full
      /_medium\./g     // Replace _medium with _large
    ];
    
    let highResSrc = src;
    for (const pattern of highResPatterns) {
      highResSrc = highResSrc.replace(pattern, '/800x600/');
    }
    
    return highResSrc;
  }

  extractAgent() {
    const agentSelectors = [
      '[data-testid="agent"]',
      '.agent',
      '.property-agent',
      '.listing-agent'
    ];
    
    for (const selector of agentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    
    return null;
  }

  showSuccessMessage(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.id = 'bmv-success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: #4CAF50 !important;
      color: white !important;
      padding: 20px 30px !important;
      border-radius: 8px !important;
      font-size: 16px !important;
      font-weight: bold !important;
      z-index: 10000 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      max-width: 300px !important;
      text-align: center !important;
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  }

  getCleanPropertyUrl() {
    // Get the current URL and clean it up
    const url = new URL(window.location.href);
    
    // Remove any fragments (#) that might interfere with the property page
    url.hash = '';
    
    // Remove any unnecessary query parameters that might be tracking or UI-related
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
    paramsToRemove.forEach(param => {
      url.searchParams.delete(param);
    });
    
    // For Rightmove, ensure we have the basic property URL structure
    if (url.hostname.includes('rightmove.co.uk')) {
      // Keep the essential property ID and channel
      const essentialParams = ['channel'];
      const newParams = new URLSearchParams();
      
      essentialParams.forEach(param => {
        if (url.searchParams.has(param)) {
          newParams.set(param, url.searchParams.get(param));
        }
      });
      
      url.search = newParams.toString();
    }
    
    console.log('BMV Finder: Clean property URL:', url.toString());
    return url.toString();
  }
} 