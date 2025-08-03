// BMV Finder Extension Debug Script
// Run this in the browser console on a property page to test the extension

console.log('🔍 BMV Finder Debug Script Loaded');

// Test 1: Check if extension is loaded
function testExtensionLoaded() {
  console.log('📋 Test 1: Checking if extension is loaded...');
  
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome runtime available');
    console.log('✅ Extension context detected');
    return true;
  } else {
    console.log('❌ Chrome runtime not available');
    console.log('❌ Not running in extension context');
    return false;
  }
}

// Test 2: Check if content script is working
function testContentScript() {
  console.log('📋 Test 2: Checking content script functionality...');
  
  // Look for BMV button
  const bmvButton = document.querySelector('#bmv-capture-button');
  if (bmvButton) {
    console.log('✅ BMV capture button found');
    console.log('✅ Content script is working');
    return true;
  } else {
    console.log('❌ BMV capture button not found');
    console.log('❌ Content script may not be working');
    return false;
  }
}

// Test 3: Test property data extraction
function testPropertyExtraction() {
  console.log('📋 Test 3: Testing property data extraction...');
  
  // Simulate property data
  const testData = {
    title: 'Test Property',
    price: 395000,
    address: 'Test Address, Test City',
    source: window.location.hostname,
    original_url: window.location.href,
    captured_at: new Date().toISOString()
  };
  
  console.log('📊 Test data:', testData);
  
  // Try to send to background script
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      action: 'captureProperty',
      data: testData
    }, function(response) {
      console.log('📤 Background script response:', response);
      if (response && response.success) {
        console.log('✅ Property capture test successful!');
      } else {
        console.log('❌ Property capture test failed!');
        console.log('❌ Error:', response ? response.error : 'No response');
      }
    });
  } else {
    console.log('❌ Cannot test property capture - not in extension context');
  }
}

// Test 4: Check API connectivity
async function testAPIConnectivity() {
  console.log('📋 Test 4: Testing API connectivity...');
  
  const apiUrl = 'https://bmv-finder-5ivoe051a-bens-projects-11c93b15.vercel.app/api/health-check';
  
  try {
    const response = await fetch(apiUrl);
    console.log('📡 API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API is accessible');
      console.log('📊 API Response:', data);
    } else {
      console.log('❌ API returned error status:', response.status);
    }
  } catch (error) {
    console.log('❌ API connectivity test failed:', error.message);
  }
}

// Test 5: Check local storage
async function testLocalStorage() {
  console.log('📋 Test 5: Testing local storage...');
  
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const result = await chrome.storage.local.get(['capturedProperties']);
      const properties = result.capturedProperties || [];
      console.log('✅ Local storage accessible');
      console.log('📊 Stored properties:', properties.length);
      return true;
    } catch (error) {
      console.log('❌ Local storage test failed:', error.message);
      return false;
    }
  } else {
    console.log('❌ Chrome storage not available');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting BMV Finder Extension Debug Tests...');
  console.log('='.repeat(50));
  
  const results = {
    extensionLoaded: testExtensionLoaded(),
    contentScript: testContentScript(),
    apiConnectivity: await testAPIConnectivity(),
    localStorage: await testLocalStorage()
  };
  
  // Test property extraction if extension is loaded
  if (results.extensionLoaded) {
    testPropertyExtraction();
  }
  
  console.log('='.repeat(50));
  console.log('📊 Test Results Summary:');
  console.log('Extension Loaded:', results.extensionLoaded ? '✅' : '❌');
  console.log('Content Script:', results.contentScript ? '✅' : '❌');
  console.log('API Connectivity:', results.apiConnectivity ? '✅' : '❌');
  console.log('Local Storage:', results.localStorage ? '✅' : '❌');
  
  return results;
}

// Make functions available globally
window.bmvDebug = {
  testExtensionLoaded,
  testContentScript,
  testPropertyExtraction,
  testAPIConnectivity,
  testLocalStorage,
  runAllTests
};

console.log('🔧 Debug functions available as window.bmvDebug');
console.log('💡 Run: bmvDebug.runAllTests() to test everything');

// Auto-run tests after a short delay
setTimeout(() => {
  console.log('🔄 Auto-running tests in 3 seconds...');
  setTimeout(runAllTests, 3000);
}, 1000); 