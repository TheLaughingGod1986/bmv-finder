const ElasticsearchService = require('../services/ElasticsearchService');

// Simple logger for the setup script
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta)
};

class CacheSetup {
  constructor() {
    this.elasticsearchService = new ElasticsearchService(logger);
  }

  /**
   * Initialize the cache setup
   */
  async initialize() {
    console.log('🔧 Setting up Property Enrichment Cache...\n');

    try {
      // Check if Elasticsearch is available
      const isAvailable = await this.elasticsearchService.isAvailable();
      if (!isAvailable) {
        console.error('❌ Elasticsearch is not available. Please ensure it is running.');
        console.log('💡 You can start it with: docker-compose up elasticsearch');
        process.exit(1);
      }

      console.log('✅ Elasticsearch is available');

      // Ensure index exists
      await this.elasticsearchService.ensureIndexExists();
      console.log('✅ EPC cache index created/verified');

      // Get initial stats
      const stats = await this.elasticsearchService.getCacheStats();
      if (stats) {
        console.log('📊 Cache Statistics:');
        console.log(`   Documents: ${stats.documentCount}`);
        console.log(`   Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
      }

      console.log('\n🎉 Cache setup completed successfully!');
      console.log('\n📋 Available endpoints:');
      console.log('   GET  /api/property-info?postcode=XXX&number=YY');
      console.log('   GET  /api/cache/stats');
      console.log('   POST /api/cache/clean');
      console.log('   GET  /api/properties/search?postcode=XXX&size=50');

    } catch (error) {
      console.error('❌ Cache setup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanCache() {
    console.log('🧹 Cleaning expired cache entries...\n');

    try {
      const deletedCount = await this.elasticsearchService.cleanExpiredCache();
      console.log(`✅ Cleaned ${deletedCount} expired cache entries`);

      // Get updated stats
      const stats = await this.elasticsearchService.getCacheStats();
      if (stats) {
        console.log('\n📊 Updated Cache Statistics:');
        console.log(`   Documents: ${stats.documentCount}`);
        console.log(`   Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
      }

    } catch (error) {
      console.error('❌ Cache cleaning failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Show cache statistics
   */
  async showStats() {
    console.log('📊 Cache Statistics:\n');

    try {
      const stats = await this.elasticsearchService.getCacheStats();
      if (stats) {
        console.log(`📄 Document Count: ${stats.documentCount}`);
        console.log(`💾 Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`🎯 Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
        console.log(`📅 Last Updated: ${new Date().toISOString()}`);
      } else {
        console.log('❌ Unable to retrieve cache statistics');
      }

    } catch (error) {
      console.error('❌ Failed to get cache statistics:', error.message);
    }
  }

  /**
   * Search cached properties by postcode
   */
  async searchProperties(postcode, size = 10) {
    console.log(`🔍 Searching cached properties for postcode: ${postcode}\n`);

    try {
      const properties = await this.elasticsearchService.searchPropertiesByPostcode(postcode, size);
      
      if (properties.length === 0) {
        console.log('❌ No cached properties found for this postcode');
        return;
      }

      console.log(`✅ Found ${properties.length} cached properties:\n`);
      
      properties.forEach((property, index) => {
        console.log(`${index + 1}. ${property.address}`);
        console.log(`   Bedrooms: ${property.bedrooms || 'N/A'}`);
        console.log(`   EPC Rating: ${property.epc_rating || 'N/A'}`);
        console.log(`   Floor Area: ${property.floor_area_m2 || 'N/A'} m²`);
        console.log(`   Property Type: ${property.property_type || 'N/A'}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Search failed:', error.message);
    }
  }
}

// Main execution
async function main() {
  const setup = new CacheSetup();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
    case 'setup':
      await setup.initialize();
      break;
    
    case 'clean':
      await setup.cleanCache();
      break;
    
    case 'stats':
      await setup.showStats();
      break;
    
    case 'search':
      const postcode = args[1];
      const size = parseInt(args[2]) || 10;
      
      if (!postcode) {
        console.error('❌ Postcode is required for search');
        console.log('Usage: node setup-cache.js search <postcode> [size]');
        process.exit(1);
      }
      
      await setup.searchProperties(postcode, size);
      break;
    
    default:
      console.log('🔧 Property Enrichment Cache Management\n');
      console.log('Usage:');
      console.log('  node setup-cache.js init|setup    - Initialize cache');
      console.log('  node setup-cache.js clean         - Clean expired entries');
      console.log('  node setup-cache.js stats         - Show cache statistics');
      console.log('  node setup-cache.js search <postcode> [size] - Search cached properties');
      console.log('\nExamples:');
      console.log('  node setup-cache.js init');
      console.log('  node setup-cache.js search SW1A1AA 5');
      console.log('  node setup-cache.js clean');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = CacheSetup; 