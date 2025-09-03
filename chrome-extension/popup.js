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

// Login form elements
const loginForm = document.getElementById('login-form');
const emailTab = document.getElementById('email-tab');
const googleTab = document.getElementById('google-tab');
const emailLogin = document.getElementById('email-login');
const googleLogin = document.getElementById('google-login');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailLoginBtn = document.getElementById('email-login-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const loginError = document.getElementById('login-error');
const checkAuthBtn = document.getElementById('check-auth-btn');

// User authentication and membership data
let userData = {
  isAuthenticated: false,
  name: 'Not Signed In',
  membership: 'Free Plan',
  captureLimit: 5,
  capturedCount: 0
};

// Handle authentication callback from extension-auth page
function handleAuthCallback() {
  console.log('BMV Finder: Checking for authentication callback...');
  console.log('Current URL:', window.location.href);
  
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userDataParam = urlParams.get('userData');
  const mockAuth = urlParams.get('mockAuth');
  
  console.log('URL params:', { token: !!token, userDataParam: !!userDataParam, mockAuth });
  
  if (userDataParam) {
    try {
      // Parse the user data
      const parsedUserData = JSON.parse(decodeURIComponent(userDataParam));
      console.log('Parsed user data:', parsedUserData);
      
      // Store the authentication data
      const authData = {
        userData: parsedUserData,
        isAuthenticated: true,
        lastUpdated: Date.now()
      };
      
      // Add token if available (for real auth)
      if (token) {
        authData.authToken = token;
      }
      
      chrome.storage.local.set(authData, () => {
        console.log('BMV Finder: Authentication data stored successfully');
        
        // Update the current user data
        userData = {
          ...userData,
          ...parsedUserData,
          isAuthenticated: true
        };
        
        // Update the UI
        updateUserInterface();
        loadCapturedProperties();
        
        // Refresh membership data from API if we have a token and it's not mock auth
        if (token && mockAuth !== 'true') {
          refreshMembershipData(token);
        }
        
        // Clear the URL parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Show success message
        const authType = mockAuth ? 'demo' : 'real';
        showMessage(`Successfully signed in with ${authType} authentication!`, true);
      });
      
    } catch (error) {
      console.error('BMV Finder: Error parsing user data:', error);
      showError('Authentication failed. Please try again.');
    }
  } else {
    console.log('BMV Finder: No userData parameter found in URL');
  }
}

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

// Refresh membership data from API
async function refreshMembershipData(authToken) {
  try {
    console.log('BMV Finder: Refreshing membership data from API');
    
    const response = await fetch('https://bmv-finder-jjl77ey7w-bens-projects-11c93b15.vercel.app/api/user/membership', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const membershipData = await response.json();
      
      // Update user data with fresh membership info
      userData = {
        ...userData,
        membership: membershipData.membership || userData.membership,
        captureLimit: membershipData.captureLimit || userData.captureLimit,
        capturedCount: membershipData.capturedCount || userData.capturedCount
      };
      
      // Save updated data to storage
      await chrome.storage.local.set({
        userData: userData,
        isAuthenticated: true,
        lastUpdated: Date.now()
      });
      
      // Update UI with fresh data
      updateUserInterface();
      
      console.log('BMV Finder: Membership data refreshed successfully');
    } else {
      console.warn('BMV Finder: Failed to refresh membership data, using cached data');
    }
  } catch (error) {
    console.error('BMV Finder: Error refreshing membership data:', error);
  }
}

// Clear all cached demo data
async function clearCachedDemoData() {
  try {
    const result = await chrome.storage.local.get(['userData', 'isAuthenticated', 'authToken']);
    
    // Check for any demo data that needs to be cleared
    const hasDemoData = result.userData && (
      result.userData.name === 'John Doe' || 
      result.userData.name === 'Demo User' ||
      result.userData.name === 'Sarah Smith' ||
      result.userData.name === 'Mike Johnson'
    );
    
    if (hasDemoData) {
      console.log('BMV Finder: Clearing all cached demo data');
      await chrome.storage.local.remove(['userData', 'isAuthenticated', 'authToken']);
      return true; // Indicates data was cleared
    }
    
    return false; // No demo data found
  } catch (error) {
    console.error('Error clearing demo data:', error);
    return false;
  }
}

// Load user data and capture limits
async function loadUserData() {
  try {
    // First check local storage for cached auth data
    const authResult = await chrome.storage.local.get(['userData', 'isAuthenticated', 'authToken']);
    
    // Clear any cached demo data that might contain "John Doe"
    if (authResult.userData && authResult.userData.name === 'John Doe') {
      console.log('BMV Finder: Clearing cached demo data');
      await chrome.storage.local.remove(['userData', 'isAuthenticated', 'authToken']);
      // Reset to clean state
      userData = {
        isAuthenticated: false,
        name: 'Not Signed In',
        membership: 'Free Plan',
        captureLimit: 5,
        capturedCount: 0
      };
      updateUserInterface();
      return;
    }
    
    if (authResult.authToken) {
      // For now, use cached user data if available, otherwise validate token
      if (authResult.userData && authResult.userData.isAuthenticated) {
        userData = {
          ...userData,
          ...authResult.userData,
          isAuthenticated: true
        };
        
        // Check if we should refresh membership data (every 5 minutes)
        const lastUpdated = authResult.lastUpdated || 0;
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        if (lastUpdated < fiveMinutesAgo) {
          console.log('BMV Finder: Refreshing stale membership data');
          refreshMembershipData(authResult.authToken);
        }
      } else {
        // Try to validate the token with the main application
        try {
          const response = await fetch('https://bmv-finder-jjl77ey7w-bens-projects-11c93b15.vercel.app/api/user/membership', {
            headers: {
              'Authorization': `Bearer ${authResult.authToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const membershipData = await response.json();
            userData = {
              ...userData,
              ...membershipData,
              isAuthenticated: true
            };
            await saveUserData();
          } else {
            // Token is invalid, clear it
            await chrome.storage.local.remove(['authToken', 'userData', 'isAuthenticated']);
            userData = {
              isAuthenticated: false,
              name: 'Not Signed In',
              membership: 'Free Plan',
              captureLimit: 5,
              capturedCount: 0
            };
          }
        } catch (error) {
          console.error('Error validating token:', error);
          // Clear invalid token
          await chrome.storage.local.remove(['authToken', 'userData', 'isAuthenticated']);
          userData = {
            isAuthenticated: false,
            name: 'Not Signed In',
            membership: 'Free Plan',
            captureLimit: 5,
            capturedCount: 0
          };
        }
      }
    } else {
      // No token found, ensure we're in unauthenticated state
      userData = {
        isAuthenticated: false,
        name: 'Not Signed In',
        membership: 'Free Plan',
        captureLimit: 5,
        capturedCount: 0
      };
    }
    
    updateUserInterface();
  } catch (error) {
    console.error('Error loading user data:', error);
    userData = {
      isAuthenticated: false,
      name: 'Not Signed In',
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
    // If user is not authenticated, show no properties
    if (!userData.isAuthenticated) {
      propertyCount.textContent = '0';
      lastCapture.textContent = 'Never';
      propertiesList.innerHTML = '<div class="empty-state">Sign in to capture and view properties</div>';
      return;
    }
    
    const result = await chrome.storage.local.get(['capturedProperties']);
    const properties = result.capturedProperties || [];
    
    // Filter properties for the current user only
    const userProperties = properties.filter(property => 
      property.userId === userData.name || !property.userId // Include legacy properties without userId
    );
    
    // Update stats
    propertyCount.textContent = userProperties.length;
    
    if (userProperties.length > 0) {
      const lastProperty = userProperties[userProperties.length - 1];
      const lastCaptureDate = new Date(lastProperty.capturedAt);
      lastCapture.textContent = lastCaptureDate.toLocaleDateString() + ' ' + lastCaptureDate.toLocaleTimeString();
    } else {
      lastCapture.textContent = 'Never';
    }
    
    // Update user interface with new count
    updateUserInterface();
    
    // Display properties
    displayProperties(userProperties);
    
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
    signInButton.textContent = 'Sign In Required';
    signInButton.style.background = 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)';
    signInButton.disabled = false;
    signOutButton.style.display = 'none'; // Hide sign out button
    watchlistLink.style.display = 'none'; // Hide watchlist link
    
    // Show authentication requirement message
    showAuthenticationRequirement();
  }
  
  // Update capture limits - use the actual property count, not userData.capturedCount
  const currentCount = parseInt(propertyCount.textContent) || 0;
  
  // For unauthenticated users, show 0 limit
  if (!userData.isAuthenticated) {
    captureLimit.textContent = '0 / 0';
    progressFill.style.width = '0%';
    progressFill.style.background = 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)';
    return;
  }
  
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
    if (progressPercentage >= 80) {
      showUpgradePrompt();
    }
  }
}

// Show authentication requirement message
function showAuthenticationRequirement() {
  // Remove any existing requirement message
  const existingMessage = document.querySelector('.auth-requirement');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const requirementDiv = document.createElement('div');
  requirementDiv.className = 'auth-requirement';
  requirementDiv.innerHTML = `
    <div style="background: linear-gradient(135deg, #FFF3CD 0%, #FFEAA7 100%); 
                border: 1px solid #FFC107;
                border-radius: 8px; 
                padding: 12px; 
                margin-bottom: 15px; 
                text-align: center; 
                color: #856404; 
                font-size: 12px;">
      <strong>🔒 Authentication Required</strong><br>
      You must sign in to capture properties. Properties are only viewable in your account watchlist.
    </div>
  `;
  
  // Insert after the user status section
  const userStatus = document.querySelector('.user-status');
  userStatus.parentNode.insertBefore(requirementDiv, userStatus.nextSibling);
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
              <a href="https://bmv-finder-jjl77ey7w-bens-projects-11c93b15.vercel.app/pricing" target="_blank" 
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
  if (!userData.isAuthenticated) {
    propertiesList.innerHTML = '<div class="empty-state">Sign in to capture and view properties</div>';
    return;
  }
  
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
  if (!userData.isAuthenticated) {
    showMessage('You must be signed in to manage properties', false);
    return;
  }
  
  if (confirm('Are you sure you want to clear all your captured properties? This action cannot be undone.')) {
    try {
      const result = await chrome.storage.local.get(['capturedProperties']);
      const allProperties = result.capturedProperties || [];
      
      // Only clear properties for the current user
      const otherUserProperties = allProperties.filter(property => 
        property.userId !== userData.name && property.userId // Keep properties from other users
      );
      
      await chrome.storage.local.set({ capturedProperties: otherUserProperties });
      // Reload properties to update the display
      await loadCapturedProperties();
      console.log('User properties cleared');
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

function showMessage(message, isSuccess = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'empty-state';
  messageDiv.style.color = isSuccess ? '#5DA271' : '#E74C3C';
  messageDiv.innerHTML = `${isSuccess ? '✅' : '⚠️'} ${message}`;
  
  propertiesList.innerHTML = '';
  propertiesList.appendChild(messageDiv);
  
  // Auto-remove success messages after 3 seconds
  if (isSuccess) {
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
        loadCapturedProperties(); // Refresh the properties list
      }
    }, 3000);
  }
}

// Show login form
function showLoginForm() {
  loginForm.style.display = 'block';
  hideLoginError();
}

// Hide login form
function hideLoginForm() {
  loginForm.style.display = 'none';
  clearLoginForm();
}

// Clear login form
function clearLoginForm() {
  emailInput.value = '';
  passwordInput.value = '';
  hideLoginError();
}

// Show login error
function showLoginError(message) {
  loginError.textContent = message;
  loginError.style.display = 'block';
}

// Hide login error
function hideLoginError() {
  loginError.style.display = 'none';
}

// Handle tab switching
emailTab.addEventListener('click', () => {
  emailTab.classList.add('active');
  googleTab.classList.remove('active');
  emailLogin.style.display = 'block';
  googleLogin.style.display = 'none';
  hideLoginError();
});

googleTab.addEventListener('click', () => {
  googleTab.classList.add('active');
  emailTab.classList.remove('active');
  googleLogin.style.display = 'block';
  emailLogin.style.display = 'none';
  hideLoginError();
});

// Handle email login
emailLoginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!email || !password) {
    showLoginError('Please enter both email and password');
    return;
  }
  
  try {
    emailLoginBtn.disabled = true;
    emailLoginBtn.textContent = 'Signing In...';
    hideLoginError();
    
    // Call the login API
    const response = await fetch('https://bmv-finder-jjl77ey7w-bens-projects-11c93b15.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Store authentication data
      const authData = {
        userData: {
          isAuthenticated: true,
          name: data.user.name || data.user.email,
          email: data.user.email,
          membership: data.user.subscription || 'Free Plan',
          captureLimit: data.user.captureLimit || 5,
          capturedCount: data.user.capturedCount || 0
        },
        authToken: data.token,
        isAuthenticated: true,
        lastUpdated: Date.now()
      };
      
      await chrome.storage.local.set(authData);
      
      // Update UI
      userData = authData.userData;
      updateUserInterface();
      hideLoginForm();
      
      // Refresh membership data
      if (data.token) {
        refreshMembershipData(data.token);
      }
      
      showMessage('Successfully signed in!', true);
    } else {
      showLoginError(data.error || 'Login failed. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    showLoginError('Network error. Please check your connection and try again.');
  } finally {
    emailLoginBtn.disabled = false;
    emailLoginBtn.textContent = 'Sign In';
  }
});

// Handle Google login
googleLoginBtn.addEventListener('click', async () => {
  try {
    googleLoginBtn.disabled = true;
    googleLoginBtn.innerHTML = '<div class="spinner"></div><span>Signing In...</span>';
    hideLoginError();
    
    // Open Google OAuth in a new tab with proper callback
    const callbackUrl = chrome.runtime.getURL('popup.html');
    const authUrl = `https://bmv-finder-jjl77ey7w-bens-projects-11c93b15.vercel.app/auth/google?returnTo=${encodeURIComponent(callbackUrl)}`;
    
    // Open auth in new tab
    chrome.tabs.create({ url: authUrl });
    
    // Close the popup after opening auth
    window.close();
    
  } catch (error) {
    console.error('Google login error:', error);
    showLoginError('Failed to open Google login. Please try again.');
    googleLoginBtn.disabled = false;
    googleLoginBtn.innerHTML = '<div class="google-icon">G</div><span>Sign in with Google</span>';
  }
});

// Handle Enter key in login form
emailInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    emailLoginBtn.click();
  }
});

passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    emailLoginBtn.click();
  }
});

// Handle manual authentication check
checkAuthBtn.addEventListener('click', async () => {
  try {
    checkAuthBtn.disabled = true;
    checkAuthBtn.textContent = 'Checking...';
    
    // Check if we have any stored auth data
    const result = await chrome.storage.local.get(['userData', 'isAuthenticated', 'authToken']);
    console.log('Stored auth data:', result);
    
    if (result.authToken) {
      // Try to validate the token
      const response = await fetch('https://bmv-finder-jjl77ey7w-bens-projects-11c93b15.vercel.app/api/user/membership', {
        headers: {
          'Authorization': `Bearer ${result.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const membershipData = await response.json();
        console.log('Valid token, membership data:', membershipData);
        
        // Update user data
        userData = {
          isAuthenticated: true,
          name: membershipData.name || 'User',
          email: membershipData.email || '',
          membership: membershipData.membership || 'Free Plan',
          captureLimit: membershipData.captureLimit || 5,
          capturedCount: membershipData.capturedCount || 0
        };
        
        // Save to storage
        await chrome.storage.local.set({
          userData: userData,
          isAuthenticated: true,
          authToken: result.authToken,
          lastUpdated: Date.now()
        });
        
        // Update UI
        updateUserInterface();
        hideLoginForm();
        
        showMessage('Authentication status updated!', true);
      } else {
        console.log('Token validation failed:', response.status);
        showLoginError('Authentication token is invalid. Please sign in again.');
      }
    } else {
      console.log('No auth token found');
      showLoginError('No authentication data found. Please sign in.');
    }
  } catch (error) {
    console.error('Auth check error:', error);
    showLoginError('Failed to check authentication status.');
  } finally {
    checkAuthBtn.disabled = false;
    checkAuthBtn.textContent = 'Check Authentication Status';
  }
});

// Handle sign-in button click
signInButton.addEventListener('click', async () => {
  console.log('BMV Finder: Sign-in button clicked');
  
  if (!userData.isAuthenticated) {
    // Show the login form instead of redirecting
    showLoginForm();
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
      name: 'Not Signed In',
      membership: 'Free Plan',
      captureLimit: 5,
      capturedCount: 0
    };
    updateUserInterface();
  }
});

// Handle watchlist link click
watchlistLink.addEventListener('click', () => {
          chrome.tabs.create({ url: 'https://bmv-finder-jjl77ey7w-bens-projects-11c93b15.vercel.app/watchlist' });
});

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('BMV Finder: Popup DOM loaded');
  
  try {
    // Handle authentication callback first
    handleAuthCallback();
    
    // Clear any cached demo data first
    const clearedDemoData = await clearCachedDemoData();
    if (clearedDemoData) {
      console.log('BMV Finder: Demo data cleared, starting fresh');
    }
    
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