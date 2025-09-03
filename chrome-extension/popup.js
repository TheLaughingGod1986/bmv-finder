// Popup script for BMV Finder extension
console.log('BMV Finder: Popup script loaded');

// API base URL
const API_BASE_URL = 'https://bmv-finder-imr8cz7u6-bens-projects-11c93b15.vercel.app/api';

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
const signInButtonAlt = document.getElementById('sign-in-button-alt');
const signOutButton = document.getElementById('sign-out-button');
const watchlistLink = document.getElementById('watchlist-link');
const userAvatar = document.getElementById('user-avatar');
const syncToWebsite = document.getElementById('sync-to-website');
const syncToWebsiteBtn = document.getElementById('sync-to-website-btn');

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
const syncWebsiteBtn = document.getElementById('sync-website-btn');

// User authentication and membership data
let userData = {
  isAuthenticated: false,
  name: 'Not Signed In',
  membership: 'Free Plan',
  captureLimit: 5,
  capturedCount: 0
};

// Check authentication status
async function checkAuthStatus() {
  try {
    // First, try to get sync data from the website
    const syncData = await getSyncDataFromWebsite();
    if (syncData) {
      console.log('Found sync data from website:', syncData.user.name);
      return await processSyncData(syncData);
    }

    // Fallback to stored token
    const result = await chrome.storage.local.get(['authToken']);
    
    if (!result.authToken) {
      console.log('No auth token found');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/auth/status`, {
      headers: {
        'Authorization': `Bearer ${result.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.isAuthenticated && data.user) {
        userData = {
          isAuthenticated: true,
          name: data.user.name,
          email: data.user.email,
          membership: data.user.membership,
          captureLimit: data.user.captureLimit,
          capturedCount: data.user.capturedCount
        };
        
        // Save updated user data
        await chrome.storage.local.set({
          userData: userData,
          isAuthenticated: true,
          authToken: result.authToken
        });
        
        console.log('User authenticated:', userData.name);
        return true;
      }
    }
    
    // Token is invalid, clear it
    await chrome.storage.local.remove(['authToken', 'userData', 'isAuthenticated']);
    console.log('Token invalid, cleared');
    return false;
    
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

// Get sync data from the website
async function getSyncDataFromWebsite() {
  try {
    // Check if we're on the BMV Finder website
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (currentTab && currentTab.url && currentTab.url.includes('bmv-finder')) {
      // Try to get sync data from localStorage
      const results = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
          const syncData = localStorage.getItem('bmv-finder-sync');
          if (syncData) {
            try {
              return JSON.parse(syncData);
            } catch (e) {
              return null;
            }
          }
          return null;
        }
      });
      
      if (results && results[0] && results[0].result) {
        return results[0].result;
      }
    }
    
    return null;
  } catch (error) {
    console.log('Could not get sync data from website:', error);
    return null;
  }
}

// Process sync data from website
async function processSyncData(syncData) {
  try {
    if (syncData.user && syncData.token) {
      userData = {
        isAuthenticated: true,
        name: syncData.user.name,
        email: syncData.user.email,
        membership: syncData.user.membership,
        captureLimit: syncData.user.captureLimit,
        capturedCount: syncData.user.capturedCount
      };
      
      // Save to storage
      await chrome.storage.local.set({
        userData: userData,
        isAuthenticated: true,
        authToken: syncData.token
      });
      
      console.log('Processed sync data for:', userData.name);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error processing sync data:', error);
    return false;
  }
}

// Sign in with email and password
async function signInWithEmail(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/extension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success && data.user && data.token) {
      // Store authentication data
      await chrome.storage.local.set({
        userData: data.user,
        isAuthenticated: true,
        authToken: data.token
      });

      // Update current user data
      userData = {
        isAuthenticated: true,
        name: data.user.name,
        email: data.user.email,
        membership: data.user.membership,
        captureLimit: data.user.captureLimit,
        capturedCount: data.user.capturedCount
      };

      console.log('Successfully signed in:', userData.name);
      return true;
    } else {
      throw new Error(data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

// Sign in with Google (opens website)
function signInWithGoogle() {
  const syncUrl = 'https://bmv-finder-imr8cz7u6-bens-projects-11c93b15.vercel.app/extension-sync';
  chrome.tabs.create({ url: syncUrl });
  
  // Show instructions
  showLoginError('Please sign in on the website that just opened, then return to this extension and click "Check Authentication Status".');
}

// Sign out
async function signOut() {
  await chrome.storage.local.remove(['authToken', 'userData', 'isAuthenticated']);
  userData = {
    isAuthenticated: false,
    name: 'Not Signed In',
    membership: 'Free Plan',
    captureLimit: 5,
    capturedCount: 0
  };
  console.log('Signed out');
}

// Update user interface
function updateUserInterface() {
  // Update user info
  userName.textContent = userData.name;
  userMembership.textContent = userData.membership;
  
  // Update avatar
  if (userData.isAuthenticated && userData.name) {
    userAvatar.textContent = userData.name.charAt(0).toUpperCase();
  } else {
    userAvatar.textContent = '?';
  }
  
  // Update authentication buttons
  if (userData.isAuthenticated) {
    signInButton.style.display = 'flex';
    signInButtonAlt.style.display = 'none';
    signOutButton.style.display = 'flex';
    watchlistLink.style.display = 'flex';
    syncToWebsite.style.display = 'block';
    loginForm.style.display = 'none';
  } else {
    signInButton.style.display = 'none';
    signInButtonAlt.style.display = 'flex';
    signOutButton.style.display = 'none';
    watchlistLink.style.display = 'none';
    syncToWebsite.style.display = 'none';
  }
  
  // Update capture limits
  const currentCount = parseInt(propertyCount.textContent) || 0;
  
  if (!userData.isAuthenticated) {
    captureLimit.textContent = '0 / 0';
    progressFill.style.width = '0%';
    progressFill.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  } else {
    const limit = userData.captureLimit;
    
    if (limit === -1) {
      captureLimit.textContent = `${currentCount} / Unlimited`;
      progressFill.style.width = '0%';
    } else {
      captureLimit.textContent = `${currentCount} / ${limit}`;
      
      const progressPercentage = limit > 0 ? Math.min((currentCount / limit) * 100, 100) : 0;
      progressFill.style.width = `${progressPercentage}%`;
      
      if (progressPercentage >= 90) {
        progressFill.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      } else if (progressPercentage >= 75) {
        progressFill.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      } else {
        progressFill.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }
    }
  }
}

// Load captured properties
async function loadCapturedProperties() {
  try {
    if (!userData.isAuthenticated) {
      propertyCount.textContent = '0';
      lastCapture.textContent = 'Never';
      propertiesList.innerHTML = '<div class="empty-state">Sign in to capture and view properties</div>';
      return;
    }
    
    const result = await chrome.storage.local.get(['capturedProperties']);
    const properties = result.capturedProperties || [];
    
    const userProperties = properties.filter(property => 
      property.userId === userData.name || !property.userId
    );
    
    propertyCount.textContent = userProperties.length;
    
    if (userProperties.length > 0) {
      const lastProperty = userProperties[userProperties.length - 1];
      const lastCaptureDate = new Date(lastProperty.capturedAt);
      // Format date more compactly to prevent truncation
      const dateStr = lastCaptureDate.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      });
      const timeStr = lastCaptureDate.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      lastCapture.textContent = `${dateStr} ${timeStr}`;
    } else {
      lastCapture.textContent = 'Never';
    }
    
    displayProperties(userProperties);
    
  } catch (error) {
    console.error('Error loading properties:', error);
    showError('Failed to load properties');
  }
}

// Display properties
function displayProperties(properties) {
  if (!userData.isAuthenticated) {
    propertiesList.innerHTML = '<div class="empty-state">Sign in to capture and view properties</div>';
    return;
  }
  
  if (properties.length === 0) {
    propertiesList.innerHTML = '<div class="empty-state">No properties captured yet. Visit a property page and click "Capture Property" to get started!</div>';
    return;
  }
  
  const sortedProperties = properties.sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
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
  
  if (properties.length > 5) {
    propertiesList.innerHTML += `
      <div class="property-item" style="text-align: center; color: #666; font-style: italic;">
        +${properties.length - 5} more properties captured
      </div>
    `;
  }
}

// Show/hide login form
function showLoginForm() {
  loginForm.style.display = 'block';
  hideLoginError();
}

function hideLoginForm() {
  loginForm.style.display = 'none';
  clearLoginForm();
}

function clearLoginForm() {
  emailInput.value = '';
  passwordInput.value = '';
  hideLoginError();
}

// Show/hide login error
function showLoginError(message) {
  loginError.textContent = message;
  loginError.style.display = 'block';
}

function hideLoginError() {
  loginError.style.display = 'none';
}

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
  
  if (isSuccess) {
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
        loadCapturedProperties();
      }
    }, 3000);
  }
}

// Event listeners
signInButton.addEventListener('click', () => {
  // Already signed in, do nothing
});

signInButtonAlt.addEventListener('click', () => {
  showLoginForm();
});

signOutButton.addEventListener('click', async () => {
  if (confirm('Are you sure you want to sign out?')) {
    await signOut();
    updateUserInterface();
    loadCapturedProperties();
  }
});

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
    
    await signInWithEmail(email, password);
    
    updateUserInterface();
    loadCapturedProperties();
    hideLoginForm();
    
    showMessage('Successfully signed in!', true);
    
  } catch (error) {
    showLoginError(error.message || 'Login failed. Please try again.');
  } finally {
    emailLoginBtn.disabled = false;
    emailLoginBtn.textContent = 'Sign In';
  }
});

googleLoginBtn.addEventListener('click', () => {
  signInWithGoogle();
});

checkAuthBtn.addEventListener('click', async () => {
  try {
    checkAuthBtn.disabled = true;
    checkAuthBtn.textContent = 'Checking...';
    hideLoginError();
    
    const isAuthenticated = await checkAuthStatus();
    
    if (isAuthenticated) {
      updateUserInterface();
      loadCapturedProperties();
      hideLoginForm();
      showMessage('Authentication status updated!', true);
    } else {
      showLoginError('Not authenticated. Please sign in.');
    }
  } catch (error) {
    showLoginError('Failed to check authentication status.');
  } finally {
    checkAuthBtn.disabled = false;
    checkAuthBtn.textContent = 'Check Authentication Status';
  }
});

syncWebsiteBtn.addEventListener('click', () => {
  const syncUrl = 'https://bmv-finder-imr8cz7u6-bens-projects-11c93b15.vercel.app/extension-sync';
  chrome.tabs.create({ url: syncUrl });
  showLoginError('Please sign in on the website that just opened, then return to this extension and click "Check Authentication Status".');
});

clearAllButton.addEventListener('click', async () => {
  if (!userData.isAuthenticated) {
    showMessage('You must be signed in to manage properties', false);
    return;
  }
  
  if (confirm('Are you sure you want to clear all your captured properties? This action cannot be undone.')) {
    try {
      const result = await chrome.storage.local.get(['capturedProperties']);
      const allProperties = result.capturedProperties || [];
      
      const otherUserProperties = allProperties.filter(property => 
        property.userId !== userData.name && property.userId
      );
      
      await chrome.storage.local.set({ capturedProperties: otherUserProperties });
      await loadCapturedProperties();
      console.log('User properties cleared');
    } catch (error) {
      console.error('Error clearing properties:', error);
      showError('Failed to clear properties');
    }
  }
});

watchlistLink.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://bmv-finder-imr8cz7u6-bens-projects-11c93b15.vercel.app/watchlist' });
});

syncToWebsiteBtn.addEventListener('click', async () => {
  try {
    syncToWebsiteBtn.disabled = true;
    syncToWebsiteBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Syncing...</span>';
    
    // Get the current auth token
    const result = await chrome.storage.local.get(['authToken']);
    
    if (!result.authToken) {
      throw new Error('No authentication token found');
    }
    
    // Open the website with the auth token
    const websiteUrl = `https://bmv-finder-imr8cz7u6-bens-projects-11c93b15.vercel.app/auth/extension?auth_token=${encodeURIComponent(result.authToken)}`;
    chrome.tabs.create({ url: websiteUrl });
    
    // Show success message
    showMessage('Opening website with your authentication...', true);
    
  } catch (error) {
    console.error('Sync to website error:', error);
    showLoginError('Failed to sync to website. Please try again.');
  } finally {
    syncToWebsiteBtn.disabled = false;
    syncToWebsiteBtn.innerHTML = '<span class="btn-icon">🌐</span><span class="btn-text">Sync to Website</span>';
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

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('BMV Finder: Popup DOM loaded');
  
  try {
    // Check authentication status
    await checkAuthStatus();
    
    // Update UI
    updateUserInterface();
    await loadCapturedProperties();
    
  } catch (error) {
    console.error('Error initializing popup:', error);
    showError('Failed to load data');
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.capturedProperties) {
    console.log('BMV Finder: Properties updated, refreshing popup');
    loadCapturedProperties();
  }
});