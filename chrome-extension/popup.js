// Popup script for BMV Finder extension
console.log('BMV Finder: Popup script loaded');

// DOM elements
const propertyCount = document.getElementById('property-count');
const lastCapture = document.getElementById('last-capture');
const propertiesList = document.getElementById('properties-list');
const clearAllButton = document.getElementById('clear-all');
const userName = document.getElementById('user-name');
const userMembership = document.getElementById('user-membership');
const captureLimit = document.getElementById('capture-limit');
const progressFill = document.getElementById('progress-fill');
const signInButton = document.getElementById('sign-in-button');
const signOutButton = document.getElementById('sign-out-button');
const watchlistLink = document.querySelector('.watchlist-link');

// User authentication and membership data
let userData = {
  isAuthenticated: false,
  name: 'Not Signed In',
  membership: 'Free Plan',
  captureLimit: 5,
  capturedCount: 0
};

// Save user data to storage
async function saveUserData() {
  try {
    await chrome.storage.local.set({
      userData: userData,
      isAuthenticated: userData.isAuthenticated
    });
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// Load user data and capture limits
async function loadUserData() {
  try {
    // First check local storage for cached auth data
    const authResult = await chrome.storage.local.get(['userData', 'isAuthenticated', 'authToken']);
    
    if (authResult.authToken) {
      // For now, use cached user data if available, otherwise validate token
      if (authResult.userData && authResult.userData.isAuthenticated) {
        userData = {
          ...userData,
          ...authResult.userData,
          isAuthenticated: true
        };
      } else {
        // Try to validate the token with the main application
        try {
          const response = await fetch('https://bmv-finder-git-main-bens-projects-11c93b15.vercel.app/api/user/membership', {
            headers: {
              'Authorization': `Bearer ${authResult.authToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userInfo = await response.json();
            userData = {
              isAuthenticated: true,
              name: userInfo.user?.name || 'Authenticated User',
              membership: userInfo.membership || 'Free Plan',
              captureLimit: userInfo.captureLimit || 5,
              capturedCount: 0
            };
            
            // Save the user data for future use
            await chrome.storage.local.set({ 
              userData: userData,
              isAuthenticated: true 
            });
          } else {
            // Token is invalid, clear it
            await chrome.storage.local.remove(['authToken', 'userData', 'isAuthenticated']);
            throw new Error('Invalid token');
          }
        } catch (apiError) {
          console.error('Error validating token:', apiError);
          // For now, don't clear the token on network errors
          // Just fall back to demo mode
          throw new Error('Token validation failed');
        }
      }
    } else if (authResult.isAuthenticated && authResult.userData) {
      // Fallback to cached data
      userData = {
        ...userData,
        ...authResult.userData,
        isAuthenticated: true
      };
    } else {
      // Demo data for unauthenticated users - preserve existing capture limit if set
      const currentLimit = userData.captureLimit || 5;
      userData = {
        isAuthenticated: false,
        name: 'Demo User',
        membership: 'Free Plan',
        captureLimit: currentLimit,
        capturedCount: 0
      };
    }
    
    updateUserInterface();
    
  } catch (error) {
    console.error('Error loading user data:', error);
    // Set to demo mode on error
    userData = {
      isAuthenticated: false,
      name: 'Demo User',
      membership: 'Free Plan',
      captureLimit: 5,
      capturedCount: 0
    };
    updateUserInterface();
  }
}

// Load and display captured properties
async function loadCapturedProperties() {
  try {
    const result = await chrome.storage.local.get(['capturedProperties']);
    const properties = result.capturedProperties || [];
    
    // Update stats
    propertyCount.textContent = properties.length;
    
    if (properties.length > 0) {
      const lastProperty = properties[properties.length - 1];
      const lastCaptureDate = new Date(lastProperty.capturedAt);
      lastCapture.textContent = lastCaptureDate.toLocaleDateString() + ' ' + lastCaptureDate.toLocaleTimeString();
    } else {
      lastCapture.textContent = 'Never';
    }
    
    // Update user interface with new count
    updateUserInterface();
    
    // Display properties
    displayProperties(properties);
    
  } catch (error) {
    console.error('Error loading properties:', error);
    showError('Failed to load properties');
  }
}

// Update user interface based on authentication status
function updateUserInterface() {
  // Update user info
  userName.textContent = userData.name;
  userMembership.textContent = userData.membership;
  
  // Update sign-in button
  if (userData.isAuthenticated) {
    signInButton.textContent = 'Signed In';
    signInButton.style.background = 'linear-gradient(135deg, #27AE60 0%, #2ECC71 100%)';
    signInButton.disabled = true;
    signOutButton.style.display = 'inline-block'; // Show sign out button
    watchlistLink.style.display = 'inline-block'; // Show watchlist link
  } else {
    signInButton.textContent = 'Sign In';
    signInButton.style.background = 'linear-gradient(135deg, #3A7CA5 0%, #2980b9 100%)';
    signInButton.disabled = false;
    signOutButton.style.display = 'none'; // Hide sign out button
    watchlistLink.style.display = 'none'; // Hide watchlist link
  }
  
  // Update capture limits - use the actual property count, not userData.capturedCount
  const currentCount = parseInt(propertyCount.textContent) || 0;
  const limit = userData.captureLimit;
  
  // Handle unlimited case
  if (limit === -1) {
    captureLimit.textContent = `${currentCount} / Unlimited`;
    progressFill.style.width = '0%';
  } else {
    captureLimit.textContent = `${currentCount} / ${limit}`;
    
    // Update progress bar
    const progressPercentage = limit > 0 ? Math.min((currentCount / limit) * 100, 100) : 0;
    progressFill.style.width = `${progressPercentage}%`;
    
    // Change progress bar color based on usage
    if (progressPercentage >= 90) {
      progressFill.style.background = 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)';
    } else if (progressPercentage >= 75) {
      progressFill.style.background = 'linear-gradient(135deg, #F39C12 0%, #E67E22 100%)';
    } else {
      progressFill.style.background = 'linear-gradient(135deg, #2980b9 0%, #3498db 100%)';
    }
    
    // Show upgrade prompt if approaching limit
    if (progressPercentage >= 80 && !userData.isAuthenticated) {
      showUpgradePrompt();
    }
  }
}

// Show upgrade prompt
function showUpgradePrompt() {
  const upgradeDiv = document.createElement('div');
  upgradeDiv.className = 'upgrade-prompt';
  upgradeDiv.innerHTML = `
    <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); 
                border-radius: 8px; 
                padding: 10px; 
                margin-bottom: 15px; 
                text-align: center; 
                color: #333; 
                font-size: 12px;">
      <strong>🚀 Upgrade to capture more properties!</strong><br>
      <a href="https://bmv-finder-git-main-bens-projects-11c93b15.vercel.app/pricing" target="_blank" 
         style="color: #3A7CA5; text-decoration: none; font-weight: bold;">
        View Plans →
      </a>
    </div>
  `;
  
  // Insert before the stats section
  const statsSection = document.querySelector('.stats');
  statsSection.parentNode.insertBefore(upgradeDiv, statsSection);
}

function displayProperties(properties) {
  if (properties.length === 0) {
    propertiesList.innerHTML = '<div class="empty-state">No properties captured yet. Visit a property page and click "Capture Property" to get started!</div>';
    return;
  }
  
  // Sort by capture date (newest first)
  const sortedProperties = properties.sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
  
  // Display only the 5 most recent properties
  const recentProperties = sortedProperties.slice(0, 5);
  
  propertiesList.innerHTML = recentProperties.map(property => `
    <div class="property-item">
      <div class="property-price">${property.price || 'Price not available'}</div>
      <div class="property-address">${property.address || property.title || 'Address not available'}</div>
      <div class="property-details">
        ${property.bedrooms ? property.bedrooms + ' bed' : ''} 
        ${property.bathrooms ? property.bathrooms + ' bath' : ''} 
        ${property.propertyType ? property.propertyType : ''}
        ${property.source ? ' • ' + property.source : ''}
      </div>
    </div>
  `).join('');
  
  // Show "view more" if there are more properties
  if (properties.length > 5) {
    propertiesList.innerHTML += `
      <div class="property-item" style="text-align: center; color: #666; font-style: italic;">
        +${properties.length - 5} more properties captured
      </div>
    `;
  }
}

// Clear all properties
clearAllButton.addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear all captured properties? This action cannot be undone.')) {
    try {
      await chrome.storage.local.set({ capturedProperties: [] });
      // Reload properties to update the display
      await loadCapturedProperties();
      console.log('All properties cleared');
    } catch (error) {
      console.error('Error clearing properties:', error);
      showError('Failed to clear properties');
    }
  }
});

function showError(message) {
  propertiesList.innerHTML = `
    <div class="empty-state" style="color: #E74C3C;">
      ⚠️ ${message}
    </div>
  `;
}

// Handle sign-in button click
signInButton.addEventListener('click', () => {
  if (!userData.isAuthenticated) {
    // Open sign-in page in new tab with your live deployment URL
    // Include a callback parameter to return to the extension
    const callbackUrl = chrome.runtime.getURL('popup.html');
    const authUrl = `https://bmv-finder-git-main-bens-projects-11c93b15.vercel.app/extension-auth?extension_callback=${encodeURIComponent(callbackUrl)}`;
    chrome.tabs.create({ url: authUrl });
  } else {
    // If already signed in, allow sign out
    if (confirm('Do you want to sign out?')) {
      chrome.storage.local.remove(['authToken', 'userData', 'isAuthenticated']);
      loadUserData();
    }
  }
});

// Handle sign-out button click
signOutButton.addEventListener('click', async () => {
  if (confirm('Are you sure you want to sign out?')) {
    await chrome.storage.local.remove(['authToken', 'userData', 'isAuthenticated']);
    userData = {
      isAuthenticated: false,
      name: 'Demo User',
      membership: 'Free Plan',
      captureLimit: 5,
      capturedCount: 0
    };
    updateUserInterface();
  }
});

// Handle watchlist link click
watchlistLink.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://bmv-finder-git-main-bens-projects-11c93b15.vercel.app/watchlist' });
});

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('BMV Finder: Popup DOM loaded');
  
  try {
    await loadUserData();
    await loadCapturedProperties();
    updateUserInterface();
  } catch (error) {
    console.error('Error initializing popup:', error);
    showError('Failed to load data');
  }
});

// Listen for storage changes to update the popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.capturedProperties) {
    console.log('BMV Finder: Properties updated, refreshing popup');
    loadCapturedProperties();
  }
}); 