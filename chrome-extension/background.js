console.log('BMV Finder: Background script loaded');

// API configuration - use production server
// const API_BASE_URL = 'http://localhost:3000/api'; // Local development
const API_BASE_URL = 'https://bmv-finder-jjl77ey7w-bens-projects-11c93b15.vercel.app/api'; // Production

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('BMV Finder: Received message:', request);
  
  if (request.action === 'captureProperty') {
    handlePropertyCapture(request.data, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

async function handlePropertyCapture(propertyData, sendResponse) {
  try {
    console.log('BMV Finder: Capturing property:', propertyData);
    
    // Validate property data
    if (!propertyData || !propertyData.title) {
      console.error('BMV Finder: Invalid property data received');
      sendResponse({
        success: false,
        error: 'Invalid property data - title is required'
      });
      return;
    }
    
    // Check authentication status first
    const authResult = await chrome.storage.local.get(['authToken', 'isAuthenticated', 'userData']);
    const isAuthenticated = authResult.isAuthenticated && authResult.userData;
    
    if (!isAuthenticated) {
      console.error('BMV Finder: User not authenticated - cannot capture properties');
      sendResponse({
        success: false,
        error: 'Authentication required. Please sign in to capture properties.',
        requiresAuth: true
      });
      return;
    }
    
    // Verify user has a valid account
    if (!authResult.userData || !authResult.userData.name || authResult.userData.name === 'Not Signed In') {
      console.error('BMV Finder: Invalid user account - cannot capture properties');
      sendResponse({
        success: false,
        error: 'Please sign in with a valid account to capture properties.',
        requiresAuth: true
      });
      return;
    }
    
    // First, store locally as backup
    const result = await chrome.storage.local.get(['capturedProperties']);
    const capturedProperties = result.capturedProperties || [];
    
    // Add the new property
    const newProperty = {
      ...propertyData,
      id: Date.now().toString(),
      capturedAt: new Date().toISOString(),
      userId: authResult.userData.name // Link to user account
    };
    
    capturedProperties.push(newProperty);
    
    // Save back to local storage
    await chrome.storage.local.set({ capturedProperties });
    console.log('BMV Finder: Property saved to local storage');
    
    // Now send to BMV Finder API
    console.log('BMV Finder: Sending property to API...');
    console.log('BMV Finder: API URL:', `${API_BASE_URL}/properties/capture`);
    console.log('BMV Finder: Property data being sent:', newProperty);
    
    try {
      const apiResponse = await fetch(`${API_BASE_URL}/properties/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authResult.authToken}`
        },
        body: JSON.stringify(newProperty)
      });
      
      console.log('BMV Finder: API response status:', apiResponse.status);
      console.log('BMV Finder: API response headers:', Object.fromEntries(apiResponse.headers.entries()));
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('BMV Finder: Property sent to API successfully:', apiData);
        
        sendResponse({
          success: true,
          message: 'Property captured and saved to your watchlist!',
          totalProperties: capturedProperties.length,
          apiData: apiData
        });
      } else {
        const errorText = await apiResponse.text();
        console.error('BMV Finder: API error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.error('BMV Finder: API error data:', errorData);
        } catch (e) {
          console.error('BMV Finder: API error is not JSON:', errorText);
        }
        
        // Still return success for local storage, but note API failure
        sendResponse({
          success: true,
          message: 'Property captured locally (API temporarily unavailable)',
          totalProperties: capturedProperties.length,
          warning: 'Could not sync with main application'
        });
      }
    } catch (apiError) {
      console.error('BMV Finder: API request failed:', apiError);
      
      // Return success for local storage, but note API failure
      sendResponse({
        success: true,
        message: 'Property captured locally (network error)',
        totalProperties: capturedProperties.length,
        warning: 'Could not sync with main application'
      });
    }
    
  } catch (error) {
    console.error('BMV Finder: Error capturing property:', error);
    
    // Try to save locally even if everything else fails
    try {
      const result = await chrome.storage.local.get(['capturedProperties']);
      const capturedProperties = result.capturedProperties || [];
      capturedProperties.push({
        ...propertyData,
        id: Date.now().toString(),
        capturedAt: new Date().toISOString()
      });
      await chrome.storage.local.set({ capturedProperties });
      
      sendResponse({
        success: true,
        message: 'Property captured locally (error occurred)',
        totalProperties: capturedProperties.length,
        warning: 'Could not sync with main application'
      });
    } catch (localError) {
      console.error('BMV Finder: Failed to save locally:', localError);
      sendResponse({
        success: false,
        error: 'Failed to save property: ' + error.message
      });
    }
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('BMV Finder: Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Initialize storage
    chrome.storage.local.set({ capturedProperties: [] });
    console.log('BMV Finder: Storage initialized');
  }
});

// Handle tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a property website
    const propertySites = [
      'rightmove.co.uk',
      'zoopla.co.uk',
      'onthemarket.com',
      'primelocation.com'
    ];
    
    const isPropertySite = propertySites.some(site => tab.url.includes(site));
    
    if (isPropertySite) {
      console.log('BMV Finder: Property site detected:', tab.url);
      // The content script will be automatically injected via manifest
    }
  }
}); 