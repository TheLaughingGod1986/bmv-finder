// BMV Finder Chrome Extension - Content Script

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
  const propertyData = extractPropertyData();
  
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
}

// Extract property data from the current page
function extractPropertyData() {
  const hostname = window.location.hostname;
  const images = [];
  
  // Initialize property data
  const propertyData = {
    title: document.title || 'Property',
    price: '£0',
    address: '',
    bedrooms: 0,
    bathrooms: 0,
    property_type: 'Unknown',
    tenure: 'Unknown',
    postcode: '',
    latitude: null,
    longitude: null,
    original_url: window.location.href,
    source: hostname,
    agent_name: '',
    agent_phone: '',
    images: [],
    captured_at: new Date().toISOString(),
    notes: '',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Extract bedrooms and bathrooms
  const extractBedroomsBathrooms = () => {
    const pageText = document.body.textContent.toLowerCase();
    
    // Extract bedrooms
    const bedroomMatch = pageText.match(/(\d+)\s*(?:bed|bedroom)/i);
    if (bedroomMatch) {
      propertyData.bedrooms = parseInt(bedroomMatch[1]);
    }
    
    // Extract bathrooms
    const bathroomMatch = pageText.match(/(\d+)\s*(?:bath|bathroom)/i);
    if (bathroomMatch) {
      propertyData.bathrooms = parseInt(bathroomMatch[1]);
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
    // Extract price
    const priceSelectors = [
      '[data-testid="price"]',
      '[data-testid="price-value"]',
      '.css-1tppcjb-Text--price',
      '.property-header__price',
      '.property-details__price',
      '.listing-price',
      '.property-price',
      '.price-display',
      '.price-value',
      'h1',
      'h2',
      'h3'
    ];
    
    for (const selector of priceSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent;
        const priceMatch = text.match(/£[\d,]+/);
        if (priceMatch) {
          const price = priceMatch[0];
          const priceValue = parseInt(price.replace(/[£,]/g, ''));
          if (priceValue > 50000 && priceValue < 1000000) {
            propertyData.price = price;
            break;
          }
        }
      }
      if (propertyData.price !== '£0') break;
    }
    
    // Extract address/title
    const titleSelectors = [
      'h1',
      '[data-testid="address"]',
      '.css-1tppcjb',
      '.property-title',
      '.property-address',
      '.listing-address',
      '.address'
    ];
    
    for (const selector of titleSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim();
        if (text && text.length > 10 && text.length < 200 && !text.includes('Zoopla')) {
          propertyData.address = text;
          break;
        }
      }
      if (propertyData.address) break;
    }
    
    // Extract images
    const imageSelectors = [
      '[data-testid="property-image"]',
      '[data-testid="main-image"]',
      '.css-1tppcjb-Image',
      '.property-header__image',
      '.listing-image',
      '.property-image',
      '.main-image'
    ];
    
    for (const selector of imageSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element.tagName === 'IMG') {
          const imgSrc = element.getAttribute('src');
          if (imgSrc && !images.includes(imgSrc)) {
            images.push(imgSrc);
          }
        }
      }
    }
  }

  // Rightmove extraction
  if (hostname.includes('rightmove.co.uk')) {
    // Extract price
    const priceSelectors = [
      '[data-testid="price"]',
      '[data-testid="price-value"]',
      '.propertyCard-priceValue',
      '.propertyCard-price',
      '.property-header-price',
      '.property-price-value',
      '.price-display',
      '.listing-price',
      '.property-price',
      '.price'
    ];
    
    for (const selector of priceSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent;
        
        // Look for "Guide price" specifically
        if (text.toLowerCase().includes('guide price')) {
          const guidePriceMatch = text.match(/Guide Price £([\d,]+)/i);
          if (guidePriceMatch) {
            propertyData.price = '£' + guidePriceMatch[1];
            break;
          }
        }
        
        // Then look for any price
        const priceMatch = text.match(/£[\d,]+/);
        if (priceMatch) {
          propertyData.price = priceMatch[0];
          break;
        }
      }
      if (propertyData.price !== '£0') break;
    }
    
    // Extract address/title
    const titleSelectors = [
      'h1',
      '[data-testid="property-title"]',
      '.propertyCard-title',
      '.property-title',
      '.address',
      '.property-address'
    ];
    
    for (const selector of titleSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim();
        if (text && text.length > 10 && text.length < 200 && !text.includes('Rightmove')) {
          propertyData.address = text;
          break;
        }
      }
      if (propertyData.address) break;
    }
    
    // Extract images
    const imageSelectors = [
      '[data-testid="property-image"]',
      '[data-testid="main-image"]',
      '.propertyCard-img',
      '.property-header__image',
      '.listing-image',
      '.property-image',
      '.main-image'
    ];
    
    for (const selector of imageSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const imgSrc = element.getAttribute('src');
        const imgAlt = element.getAttribute('alt') || '';
        
        if (imgSrc && !imgSrc.includes('placeholder') && !imgSrc.includes('logo') && 
            !imgSrc.includes('icon') && !imgSrc.includes('avatar')) {
          if (imgAlt.toLowerCase().includes('bedroom') || 
              imgAlt.toLowerCase().includes('living') ||
              imgAlt.toLowerCase().includes('kitchen') ||
              imgAlt.toLowerCase().includes('bathroom')) {
            images.unshift(imgSrc); // Add to beginning for priority
          } else if (imgSrc.startsWith('http') && imgSrc.includes('rightmove')) {
            images.push(imgSrc);
          }
        }
      }
    }
  }

  // Fallback: try to extract from page title
  if (!propertyData.address) {
    const title = document.title;
    if (title && (title.includes('for sale') || title.includes('to rent'))) {
      propertyData.address = title.replace(' - Rightmove', '').replace(' | Zoopla', '');
    }
  }

  // Fallback: try to extract price from any text on page
  if (propertyData.price === '£0') {
    const pageText = document.body.textContent;
    
    // Look for "Guide price" in the page text
    const guidePriceMatch = pageText.match(/Guide Price £([\d,]+)/i);
    if (guidePriceMatch) {
      propertyData.price = '£' + guidePriceMatch[1];
    } else {
      // Look for any price
      const priceMatches = pageText.match(/£[\d,]+/g);
      if (priceMatches && priceMatches.length > 0) {
        const prices = priceMatches
          .map(p => parseInt(p.replace(/[£,]/g, '')))
          .filter(p => p > 10000 && p < 10000000);
        
        if (prices.length > 0) {
          const maxPrice = Math.max(...prices);
          propertyData.price = '£' + maxPrice.toLocaleString();
        }
      }
    }
  }

  // Ensure we have a proper title
  if (!propertyData.address || propertyData.address.length < 5) {
    propertyData.address = document.title || 'Property';
  }

  // Clean up the title/address
  propertyData.address = propertyData.address
    .replace(' - Rightmove', '')
    .replace(' | Zoopla', '')
    .replace(' | OnTheMarket', '')
    .replace(' | PrimeLocation', '')
    .replace(/\d+ bed\s+[^,]+ for sale,?\s*£[\d,]*/gi, '')
    .replace(/for sale/gi, '')
    .replace(/to rent/gi, '')
    .replace(/\s*,\s*£[\d,]*/g, '')
    .replace(/\s*Offers Over\s*£[\d,]*/gi, '')
    .replace(/\s*Guide Price\s*£[\d,]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If no images found, use a default UK property image
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center');
  }

  propertyData.images = images.slice(0, 3);
  return propertyData;
}

// Show success/error message
function showMessage(message, isSuccess, isHTML = false) {
  // Remove any existing messages
  const existingMessage = document.getElementById('bmv-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.id = 'bmv-message';
  
  if (isHTML) {
    messageDiv.innerHTML = message;
  } else {
    messageDiv.textContent = message;
  }
  
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
    max-width: 350px;
    line-height: 1.4;
  `;
  
  // Style links within the message
  const links = messageDiv.querySelectorAll('a');
  links.forEach(link => {
    link.style.cssText = `
      color: white;
      text-decoration: underline;
      font-weight: bold;
      margin: 0 4px;
    `;
  });
  
  document.body.appendChild(messageDiv);
  
  // Remove after 5 seconds for messages with links, 3 seconds for others
  const timeout = isHTML ? 5000 : 3000;
  setTimeout(function() {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, timeout);
}

// Check authentication status before capturing
async function checkAuthenticationStatus() {
  try {
    // Check if chrome API is available
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      console.error('BMV Finder: Chrome storage API not available');
      return { 
        isAuthenticated: false, 
        hasToken: false,
        message: 'Extension not properly loaded. Please refresh the page and try again.',
        needsRefresh: true
      };
    }

    const result = await chrome.storage.local.get(['authToken', 'isAuthenticated', 'userData']);
    
    // Check if user is properly authenticated with valid data
    const isAuthenticated = result.isAuthenticated && result.authToken && result.userData;
    
    if (!isAuthenticated) {
      return { 
        isAuthenticated: false, 
        hasToken: false,
        message: 'You must sign in to capture properties. Properties are only viewable in your account watchlist.'
      };
    }
    
    return { 
      isAuthenticated: true, 
      hasToken: true,
      userData: result.userData
    };
  } catch (error) {
    console.error('BMV Finder: Error checking auth status:', error);
    return { 
      isAuthenticated: false, 
      hasToken: false,
      message: 'Authentication check failed. Please sign in again.'
    };
  }
}

// Simple function to create and inject button
function injectButton() {
  // Check if Chrome extension APIs are available
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.storage) {
    console.error('BMV Finder: Chrome extension APIs not available');
    return;
  }

  // Only inject on property pages
  if (!isPropertyPage()) {
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
    
    // Check authentication status first
    const authStatus = await checkAuthenticationStatus();
    
    if (!authStatus.isAuthenticated) {
      if (authStatus.needsRefresh) {
        const messageWithLinks = `
          ${authStatus.message}<br><br>
          <a href="#" onclick="window.location.reload(); return false;">Refresh Page</a> | 
          <a href="#" onclick="chrome.tabs.create({url: 'https://bmv-finder-oe3jeqmh2-bens-projects-11c93b15.vercel.app/extension-auth?message=signin_required'}); return false;">Sign In</a>
        `;
        showMessage(messageWithLinks, false, true);
      } else {
        const messageWithLinks = `
          ${authStatus.message}<br><br>
          <a href="#" onclick="chrome.tabs.create({url: 'https://bmv-finder-oe3jeqmh2-bens-projects-11c93b15.vercel.app/extension-auth?message=signin_required'}); return false;">Sign In</a> | 
          <a href="#" onclick="chrome.tabs.create({url: 'https://bmv-finder-oe3jeqmh2-bens-projects-11c93b15.vercel.app/extension-auth?message=register_required'}); return false;">Register</a>
        `;
        showMessage(messageWithLinks, false, true);
      }
      return;
    }
    
    // Verify user has a valid account
    if (!authStatus.userData || !authStatus.userData.name || authStatus.userData.name === 'Not Signed In') {
      const messageWithLinks = `
        Please sign in with a valid account to capture properties.<br><br>
        <a href="#" onclick="chrome.tabs.create({url: 'https://bmv-finder-oe3jeqmh2-bens-projects-11c93b15.vercel.app/extension-auth?message=invalid_account'}); return false;">Sign In</a> | 
        <a href="#" onclick="chrome.tabs.create({url: 'https://bmv-finder-oe3jeqmh2-bens-projects-11c93b15.vercel.app/extension-auth?message=register_required'}); return false;">Register</a>
      `;
      showMessage(messageWithLinks, false, true);
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
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        throw new Error('Chrome runtime API not available');
      }

      chrome.runtime.sendMessage({
        action: 'captureProperty',
        data: propertyData
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('BMV Finder: Runtime error:', chrome.runtime.lastError);
          // Show error state
          button.innerHTML = '<span style="font-size: 14px;">❌</span> Error';
          button.style.background = 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)';
          showMessage('Extension communication error. Please refresh and try again.', false);
          
          // Reset after 3 seconds
          setTimeout(function() {
            button.innerHTML = originalText;
            button.style.background = 'linear-gradient(135deg, #3A7CA5 0%, #2C6E91 100%)';
            button.style.cursor = 'pointer';
          }, 3000);
          return;
        }

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
    } catch (error) {
      console.error('BMV Finder: Error sending message:', error);
      // Show error state
      button.innerHTML = '<span style="font-size: 14px;">❌</span> Error';
      button.style.background = 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)';
      showMessage('Extension error. Please refresh the page and try again.', false);
      
      // Reset after 3 seconds
      setTimeout(function() {
        button.innerHTML = originalText;
        button.style.background = 'linear-gradient(135deg, #3A7CA5 0%, #2C6E91 100%)';
        button.style.cursor = 'pointer';
      }, 3000);
    }
  };
  
  // Add buttons to container
  buttonContainer.appendChild(button);
  buttonContainer.appendChild(testButton);
  
  // Inject container to body
  if (document.body) {
    document.body.appendChild(buttonContainer);
  } else {
    setTimeout(function() {
      if (document.body) {
        document.body.appendChild(buttonContainer);
      }
    }, 1000);
  }
}

// Function to safely inject button with retry logic
function safeInjectButton() {
  // Check if Chrome APIs are available
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.storage) {
    setTimeout(safeInjectButton, 1000);
    return;
  }
  
  injectButton();
}

// Run injection with safety checks
safeInjectButton();

// Also run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInjectButton);
}

// Also run on window load
window.addEventListener('load', safeInjectButton);

 