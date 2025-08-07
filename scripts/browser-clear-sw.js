/**
 * Browser Console Script to Clear Service Worker
 * 
 * Copy and paste this entire script into your browser's developer console
 * to clear service worker cache and resolve console errors.
 */

(function() {
  console.log('🧹 Starting Service Worker Cleanup...');
  
  // Function to clear all caches
  async function clearAllCaches() {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`Found ${cacheNames.length} caches to clear`);
        
        await Promise.all(
          cacheNames.map(async (cacheName) => {
            console.log(`🗑️  Deleting cache: ${cacheName}`);
            const deleted = await caches.delete(cacheName);
            console.log(`   ${deleted ? '✅' : '❌'} Cache ${cacheName} ${deleted ? 'deleted' : 'failed to delete'}`);
            return deleted;
          })
        );
        
        console.log('✅ All caches cleared successfully');
      } else {
        console.log('⚠️  Cache API not available');
      }
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
    }
  }
  
  // Function to unregister all service workers
  async function unregisterAllServiceWorkers() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`Found ${registrations.length} service workers to unregister`);
        
        await Promise.all(
          registrations.map(async (registration) => {
            console.log(`🔄 Unregistering service worker: ${registration.scope}`);
            const unregistered = await registration.unregister();
            console.log(`   ${unregistered ? '✅' : '❌'} Service worker ${registration.scope} ${unregistered ? 'unregistered' : 'failed to unregister'}`);
            return unregistered;
          })
        );
        
        console.log('✅ All service workers unregistered');
      } else {
        console.log('⚠️  Service Worker API not available');
      }
    } catch (error) {
      console.error('❌ Error unregistering service workers:', error);
    }
  }
  
  // Function to clear IndexedDB (if needed)
  async function clearIndexedDB() {
    try {
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        console.log(`Found ${databases.length} IndexedDB databases`);
        
        for (const db of databases) {
          console.log(`🗑️  Deleting IndexedDB: ${db.name}`);
          await indexedDB.deleteDatabase(db.name);
        }
        
        console.log('✅ IndexedDB cleared');
      } else {
        console.log('⚠️  IndexedDB not available');
      }
    } catch (error) {
      console.error('❌ Error clearing IndexedDB:', error);
    }
  }
  
  // Main cleanup function
  async function performCleanup() {
    console.log('🚀 Starting comprehensive cleanup...');
    
    await clearAllCaches();
    await unregisterAllServiceWorkers();
    await clearIndexedDB();
    
    console.log('\n📋 Cleanup Complete! Next steps:');
    console.log('1. Refresh this page (Ctrl+R or Cmd+R)');
    console.log('2. Check the console for any remaining errors');
    console.log('3. The service worker should register cleanly on page load');
    
    console.log('\n✨ If you still see errors, try:');
    console.log('- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('- Clear browser cache completely');
    console.log('- Open in incognito/private mode');
  }
  
  // Execute the cleanup
  performCleanup().catch(console.error);
})(); 