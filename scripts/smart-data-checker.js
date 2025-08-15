const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

// Enhanced data source configuration
const DATA_SOURCES = {
  ons: {
    name: 'Office for National Statistics',
    baseUrl: 'https://www.ons.gov.uk',
    endpoints: [
      {
        name: 'HPI New Builds',
        path: '/economy/inflationandpriceindices/datasets/housepriceindices/datasets/housepriceindexfornewbuilds/current/hpinb.xlsx',
        type: 'xlsx',
        checkMethod: 'headers'
      },
      {
        name: 'HPI Main Dataset',
        path: '/economy/inflationandpriceindices/datasets/housepriceindices/datasets/housepriceindex/current/hpi.xlsx',
        type: 'xlsx',
        checkMethod: 'headers'
      }
    ]
  },
  
  landRegistry: {
    name: 'Land Registry',
    baseUrl: 'https://landregistry.data.gov.uk',
    endpoints: [
      {
        name: 'Price Paid Data',
        path: '/app/ppd/ppd_data.csv',
        type: 'csv',
        checkMethod: 'content'
      },
      {
        name: 'HPI Data',
        path: '/data/hpi/hpi_data.csv',
        type: 'csv',
        checkMethod: 'content'
      }
    ]
  },
  
  govUk: {
    name: 'GOV.UK',
    baseUrl: 'https://www.gov.uk',
    endpoints: [
      {
        name: 'Property Data',
        path: '/government/statistical-data-sets/price-paid-data-downloads',
        type: 'html',
        checkMethod: 'scrape'
      }
    ]
  }
};

// Smart data checker class
class SmartDataChecker {
  constructor() {
    this.cacheFile = path.join('data', 'data-source-cache.json');
    this.cache = this.loadCache();
  }

  // Load cached data source information
  loadCache() {
    if (fs.existsSync(this.cacheFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
      } catch (error) {
        console.warn('⚠️  Could not load cache, starting fresh');
      }
    }
    return {};
  }

  // Save cache to file
  saveCache() {
    const cacheDir = path.dirname(this.cacheFile);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
  }

  // Check if a data source has new data
  async checkDataSource(sourceName, endpoint) {
    const url = `${endpoint.baseUrl}${endpoint.path}`;
    const cacheKey = `${sourceName}_${endpoint.name}`;
    
    console.log(`🔍 Checking ${endpoint.name} from ${sourceName}...`);
    
    try {
      const currentInfo = await this.getRemoteFileInfo(url);
      const cachedInfo = this.cache[cacheKey];
      
      if (!cachedInfo) {
        console.log(`📥 First time checking ${endpoint.name}, caching info...`);
        this.cache[cacheKey] = currentInfo;
        this.saveCache();
        return { hasNewData: false, reason: 'First check' };
      }
      
      // Compare with cached info
      const hasNewData = this.detectChanges(cachedInfo, currentInfo);
      
      if (hasNewData) {
        console.log(`✅ New data detected in ${endpoint.name}!`);
        console.log(`   Old: ${cachedInfo.lastModified || 'Unknown'}`);
        console.log(`   New: ${currentInfo.lastModified || 'Unknown'}`);
        console.log(`   Size change: ${this.formatBytes(cachedInfo.contentLength)} → ${this.formatBytes(currentInfo.contentLength)}`);
        
        // Update cache
        this.cache[cacheKey] = currentInfo;
        this.saveCache();
        
        return { 
          hasNewData: true, 
          reason: 'Data changed',
          oldInfo: cachedInfo,
          newInfo: currentInfo,
          url: url,
          endpoint: endpoint
        };
      } else {
        console.log(`ℹ️  No new data in ${endpoint.name}`);
        return { hasNewData: false, reason: 'No changes detected' };
      }
      
    } catch (error) {
      console.error(`❌ Error checking ${endpoint.name}:`, error.message);
      return { hasNewData: false, reason: `Error: ${error.message}` };
    }
  }

  // Get remote file information
  async getRemoteFileInfo(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.get(url, { 
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'HPI-Data-Checker/1.0'
        }
      }, (res) => {
        if (res.statusCode === 200) {
          const info = {
            url: url,
            statusCode: res.statusCode,
            contentLength: res.headers['content-length'] ? parseInt(res.headers['content-length']) : null,
            lastModified: res.headers['last-modified'] ? new Date(res.headers['last-modified']) : null,
            etag: res.headers['etag'] || null,
            contentType: res.headers['content-type'] || null,
            checkedAt: new Date()
          };
          resolve(info);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  // Detect changes between old and new file info
  detectChanges(oldInfo, newInfo) {
    // Check if file size changed
    if (oldInfo.contentLength && newInfo.contentLength && 
        oldInfo.contentLength !== newInfo.contentLength) {
      return true;
    }
    
    // Check if last modified date changed
    if (oldInfo.lastModified && newInfo.lastModified && 
        oldInfo.lastModified.getTime() !== newInfo.lastModified.getTime()) {
      return true;
    }
    
    // Check if ETag changed
    if (oldInfo.etag && newInfo.etag && oldInfo.etag !== newInfo.etag) {
      return true;
    }
    
    // If we have content length but no other metadata, assume changed
    if (newInfo.contentLength && !oldInfo.lastModified && !oldInfo.etag) {
      return true;
    }
    
    return false;
  }

  // Download file content for content-based checking
  async downloadFileContent(url, maxSize = 1024 * 1024) { // 1MB limit
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      let data = Buffer.alloc(0);
      let contentLength = 0;
      
      const req = client.get(url, { 
        timeout: 15000,
        headers: {
          'User-Agent': 'HPI-Data-Checker/1.0'
        }
      }, (res) => {
        if (res.statusCode === 200) {
          contentLength = parseInt(res.headers['content-length']) || 0;
          
          if (contentLength > maxSize) {
            reject(new Error(`File too large: ${this.formatBytes(contentLength)} (max: ${this.formatBytes(maxSize)})`));
            return;
          }
          
          res.on('data', (chunk) => {
            data = Buffer.concat([data, chunk]);
            
            if (data.length > maxSize) {
              req.destroy();
              reject(new Error(`Downloaded content too large: ${this.formatBytes(data.length)} (max: ${this.formatBytes(maxSize)})`));
            }
          });
          
          res.on('end', () => {
            resolve({
              content: data,
              size: data.length,
              hash: crypto.createHash('md5').update(data).digest('hex')
            });
          });
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  // Check all data sources
  async checkAllSources() {
    console.log('🚀 Starting comprehensive data source check...\n');
    
    const results = {
      timestamp: new Date().toISOString(),
      sources: {},
      summary: {
        total: 0,
        newData: 0,
        errors: 0
      }
    };
    
    for (const [sourceName, source] of Object.entries(DATA_SOURCES)) {
      console.log(`📡 Checking ${source.name}...`);
      results.sources[sourceName] = {
        name: source.name,
        endpoints: {}
      };
      
      for (const endpoint of source.endpoints) {
        try {
          const result = await this.checkDataSource(sourceName, endpoint);
          results.sources[sourceName].endpoints[endpoint.name] = result;
          
          results.summary.total++;
          if (result.hasNewData) {
            results.summary.newData++;
          }
          if (result.reason.startsWith('Error:')) {
            results.summary.errors++;
          }
          
        } catch (error) {
          console.error(`❌ Error checking ${endpoint.name}:`, error.message);
          results.sources[sourceName].endpoints[endpoint.name] = {
            hasNewData: false,
            reason: `Error: ${error.message}`
          };
          results.summary.errors++;
        }
      }
      console.log('');
    }
    
    // Print summary
    console.log('📊 Check Summary:');
    console.log(`   Total endpoints: ${results.summary.total}`);
    console.log(`   New data found: ${results.summary.newData}`);
    console.log(`   Errors: ${results.summary.errors}`);
    
    // Save results
    const resultsFile = path.join('data', `check-results-${Date.now()}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    
    return results;
  }

  // Get recommendations for data sources
  getRecommendations() {
    console.log('\n💡 Data Source Recommendations:');
    
    for (const [sourceName, source] of Object.entries(DATA_SOURCES)) {
      console.log(`\n📡 ${source.name}:`);
      
      for (const endpoint of source.endpoints) {
        const cacheKey = `${sourceName}_${endpoint.name}`;
        const cached = this.cache[cacheKey];
        
        if (cached) {
          const lastCheck = new Date(cached.checkedAt);
          const hoursAgo = Math.round((Date.now() - lastCheck.getTime()) / (1000 * 60 * 60));
          
          console.log(`   • ${endpoint.name}:`);
          console.log(`     - Last checked: ${hoursAgo} hours ago`);
          console.log(`     - File size: ${this.formatBytes(cached.contentLength)}`);
          console.log(`     - Last modified: ${cached.lastModified ? cached.lastModified.toISOString() : 'Unknown'}`);
          
          if (hoursAgo > 24) {
            console.log(`     - ⚠️  Consider checking more frequently`);
          }
        } else {
          console.log(`   • ${endpoint.name}: Never checked`);
        }
      }
    }
  }

  // Format bytes to human readable
  formatBytes(bytes) {
    if (!bytes) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Clean up old cache entries
  cleanupCache(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of Object.entries(this.cache)) {
      if (value.checkedAt && (now - new Date(value.checkedAt).getTime()) > maxAge) {
        delete this.cache[key];
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old cache entries`);
      this.saveCache();
    }
  }
}

// CLI interface
async function main() {
  const checker = new SmartDataChecker();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'check':
        console.log('🔍 Running data source check...\n');
        await checker.checkAllSources();
        checker.getRecommendations();
        break;
      
      case 'status':
        console.log('📊 Data Source Status:\n');
        checker.getRecommendations();
        break;
      
      case 'cleanup':
        console.log('🧹 Cleaning up old cache entries...');
        checker.cleanupCache();
        break;
      
      case 'cache':
        const cacheFile = path.join('data', 'data-source-cache.json');
        if (fs.existsSync(cacheFile)) {
          const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          console.log('📋 Current Cache:');
          console.log(JSON.stringify(cache, null, 2));
        } else {
          console.log('📋 No cache file found');
        }
        break;
      
      default:
        console.log('🔍 Smart Data Source Checker');
        console.log('');
        console.log('Usage:');
        console.log('  node scripts/smart-data-checker.js check    # Check all sources');
        console.log('  node scripts/smart-data-checker.js status   # Show status');
        console.log('  node scripts/smart-data-checker.js cleanup  # Clean old cache');
        console.log('  node scripts/smart-data-checker.js cache    # Show cache contents');
        console.log('');
        console.log('Examples:');
        console.log('  # Check all data sources for updates');
        console.log('  node scripts/smart-data-checker.js check');
        console.log('');
        console.log('  # View current status and recommendations');
        console.log('  node scripts/smart-data-checker.js status');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SmartDataChecker, DATA_SOURCES };
