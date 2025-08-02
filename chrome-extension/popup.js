// Popup script for BMV Finder extension
console.log('BMV Finder: Popup script loaded');

// DOM elements
const propertyCount = document.getElementById('property-count');
const lastCapture = document.getElementById('last-capture');
const propertiesList = document.getElementById('properties-list');
const clearAllButton = document.getElementById('clear-all');

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
    
    // Display properties
    displayProperties(properties);
    
  } catch (error) {
    console.error('Error loading properties:', error);
    showError('Failed to load properties');
  }
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
      loadCapturedProperties();
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

// Load properties when popup opens
document.addEventListener('DOMContentLoaded', () => {
  console.log('BMV Finder: Popup DOM loaded, loading properties');
  loadCapturedProperties();
});

// Listen for storage changes to update the popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.capturedProperties) {
    console.log('BMV Finder: Properties updated, refreshing popup');
    loadCapturedProperties();
  }
}); 