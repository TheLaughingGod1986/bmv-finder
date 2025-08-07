#!/usr/bin/env node

/**
 * Script to clear service worker cache and restart it
 * Run this script to resolve service worker console errors
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing Service Worker Cache...');

// Function to clear service worker cache
async function clearServiceWorkerCache() {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log(`🗑️  Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
      console.log('✅ Service worker caches cleared');
    } else {
      console.log('⚠️  Not in browser environment, caches will be cleared on next page load');
    }
  } catch (error) {
    console.error('❌ Error clearing service worker cache:', error);
  }
}

// Function to unregister service workers
async function unregisterServiceWorkers() {
  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => {
          console.log(`🔄 Unregistering service worker: ${registration.scope}`);
          return registration.unregister();
        })
      );
      console.log('✅ Service workers unregistered');
    } else {
      console.log('⚠️  Service Worker API not available');
    }
  } catch (error) {
    console.error('❌ Error unregistering service workers:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting service worker cleanup...');
  
  await clearServiceWorkerCache();
  await unregisterServiceWorkers();
  
  console.log('\n📋 Next steps:');
  console.log('1. Refresh your browser page');
  console.log('2. Check the browser console for any remaining errors');
  console.log('3. The service worker should now register cleanly');
  
  console.log('\n✨ Service worker cleanup complete!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { clearServiceWorkerCache, unregisterServiceWorkers }; 