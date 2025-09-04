#!/usr/bin/env node

/**
 * BMV Finder - Performance Optimization Script
 * 
 * This script identifies performance bottlenecks and provides
 * optimization recommendations for the BMV Finder platform.
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  iterations: 5,
  performanceThresholds: {
    excellent: 500,    // < 500ms
    good: 1000,        // < 1s
    acceptable: 2000,  // < 2s
    slow: 5000         // < 5s
  }
};

// Performance analysis results
const performanceResults = {
  endpoints: {},
  recommendations: [],
  bottlenecks: [],
  optimizations: []
};

// Utility functions
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      timeout: CONFIG.timeout,
      ...options
    }, (res) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            responseTime,
            size: data.length
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            responseTime,
            size: data.length
          });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function benchmarkEndpoint(name, url, iterations = CONFIG.iterations) {
  console.log(`\n🔍 Benchmarking: ${name}`);
  console.log(`   URL: ${url}`);
  
  const results = [];
  let totalTime = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    try {
      const response = await makeRequest(url);
      results.push(response.responseTime);
      totalTime += response.responseTime;
      
      if (response.status >= 200 && response.status < 300) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errorCount++;
      console.log(`   ⚠️  Request ${i + 1} failed: ${error.message}`);
    }
  }
  
  const avgResponseTime = totalTime / iterations;
  const minResponseTime = Math.min(...results);
  const maxResponseTime = Math.max(...results);
  const successRate = (successCount / iterations) * 100;
  
  const performance = {
    name,
    url,
    iterations,
    avgResponseTime: Math.round(avgResponseTime),
    minResponseTime: Math.round(minResponseTime),
    maxResponseTime: Math.round(maxResponseTime),
    successRate: Math.round(successRate),
    results,
    status: getPerformanceStatus(avgResponseTime)
  };
  
  performanceResults.endpoints[name] = performance;
  
  // Log results
  const statusIcon = getStatusIcon(performance.status);
  console.log(`   ${statusIcon} Average: ${Math.round(avgResponseTime)}ms`);
  console.log(`   📊 Min: ${Math.round(minResponseTime)}ms, Max: ${Math.round(maxResponseTime)}ms`);
  console.log(`   ✅ Success Rate: ${Math.round(successRate)}%`);
  
  return performance;
}

function getPerformanceStatus(responseTime) {
  if (responseTime < CONFIG.performanceThresholds.excellent) return 'excellent';
  if (responseTime < CONFIG.performanceThresholds.good) return 'good';
  if (responseTime < CONFIG.performanceThresholds.acceptable) return 'acceptable';
  if (responseTime < CONFIG.performanceThresholds.slow) return 'slow';
  return 'critical';
}

function getStatusIcon(status) {
  const icons = {
    excellent: '🚀',
    good: '✅',
    acceptable: '⚠️',
    slow: '🐌',
    critical: '❌'
  };
  return icons[status] || '❓';
}

// Performance test suites
async function testCorePerformance() {
  console.log('\n🎯 Testing Core Performance...');
  
  const coreEndpoints = [
    { name: 'Health Check', url: '/api/health-check' },
    { name: 'Property Search', url: '/api/property-search?postcode=M1+1AA&limit=10' },
    { name: 'HPI Data', url: '/api/hpi/postcode?postcode=M1+1AA' },
    { name: 'Recent Sales', url: '/api/recent-sales?postcode=M1+1AA&limit=10' },
    { name: 'Market Trends', url: '/api/market-trends?postcode=M1+1AA' }
  ];
  
  for (const endpoint of coreEndpoints) {
    await benchmarkEndpoint(endpoint.name, `${CONFIG.baseUrl}${endpoint.url}`);
  }
}

async function testAdvancedPerformance() {
  console.log('\n🚀 Testing Advanced Features Performance...');
  
  const advancedEndpoints = [
    { name: 'Property Valuation', url: '/api/property-valuation?postcode=M1+1AA&number=1' },
    { name: 'Investment Recommendations', url: '/api/investment-recommendations?postcode=M1+1AA' },
    { name: 'Market Intelligence', url: '/api/analytics/market-intelligence?region=Manchester' },
    { name: 'Portfolio Analytics', url: '/api/portfolio/analytics' },
    { name: 'Comprehensive Valuation', url: '/api/comprehensive-valuation?postcode=M1+1AA&number=1' }
  ];
  
  for (const endpoint of advancedEndpoints) {
    await benchmarkEndpoint(endpoint.name, `${CONFIG.baseUrl}${endpoint.url}`);
  }
}

async function testSystemPerformance() {
  console.log('\n⚡ Testing System Performance...');
  
  const systemEndpoints = [
    { name: 'Performance Dashboard', url: '/api/performance/dashboard' },
    { name: 'Database Performance', url: '/api/performance/database' },
    { name: 'Cache Performance', url: '/api/performance/cache' },
    { name: 'API Performance', url: '/api/performance/api' },
    { name: 'System Health', url: '/api/system-health' }
  ];
  
  for (const endpoint of systemEndpoints) {
    await benchmarkEndpoint(endpoint.name, `${CONFIG.baseUrl}${endpoint.url}`);
  }
}

async function testConcurrentLoad() {
  console.log('\n🔄 Testing Concurrent Load Performance...');
  
  const concurrentTests = [
    { name: 'Concurrent Property Search', url: '/api/property-search?postcode=M1+1AA&limit=5' },
    { name: 'Concurrent HPI Requests', url: '/api/hpi/postcode?postcode=M1+1AA' },
    { name: 'Concurrent Market Data', url: '/api/market-trends?postcode=M1+1AA' }
  ];
  
  for (const test of concurrentTests) {
    console.log(`\n   🔄 Testing: ${test.name}`);
    
    const promises = [];
    const startTime = performance.now();
    
    // Create 10 concurrent requests
    for (let i = 0; i < 10; i++) {
      promises.push(makeRequest(`${CONFIG.baseUrl}${test.url}`));
    }
    
    try {
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      const successCount = results.filter(r => r.status >= 200 && r.status < 300).length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      console.log(`   📊 Total Time: ${Math.round(totalTime)}ms`);
      console.log(`   📈 Average Response: ${Math.round(avgResponseTime)}ms`);
      console.log(`   ✅ Success Rate: ${(successCount / 10) * 100}%`);
      
      performanceResults.endpoints[`${test.name} (Concurrent)`] = {
        name: `${test.name} (Concurrent)`,
        url: test.url,
        totalTime: Math.round(totalTime),
        avgResponseTime: Math.round(avgResponseTime),
        successRate: (successCount / 10) * 100,
        status: getPerformanceStatus(avgResponseTime)
      };
      
    } catch (error) {
      console.log(`   ❌ Concurrent test failed: ${error.message}`);
    }
  }
}

function analyzePerformance() {
  console.log('\n📊 Performance Analysis...');
  
  const endpoints = Object.values(performanceResults.endpoints);
  const slowEndpoints = endpoints.filter(e => e.status === 'slow' || e.status === 'critical');
  const excellentEndpoints = endpoints.filter(e => e.status === 'excellent');
  
  console.log(`\n📈 Performance Summary:`);
  console.log(`   Total Endpoints Tested: ${endpoints.length}`);
  console.log(`   Excellent Performance: ${excellentEndpoints.length} 🚀`);
  console.log(`   Slow/Critical Endpoints: ${slowEndpoints.length} 🐌`);
  
  if (slowEndpoints.length > 0) {
    console.log(`\n🐌 Slow Endpoints Requiring Optimization:`);
    slowEndpoints.forEach(endpoint => {
      console.log(`   - ${endpoint.name}: ${endpoint.avgResponseTime}ms`);
      performanceResults.bottlenecks.push({
        endpoint: endpoint.name,
        responseTime: endpoint.avgResponseTime,
        status: endpoint.status
      });
    });
  }
  
  // Generate recommendations
  generateOptimizationRecommendations();
}

function generateOptimizationRecommendations() {
  console.log('\n💡 Optimization Recommendations...');
  
  const endpoints = Object.values(performanceResults.endpoints);
  
  // Database optimization recommendations
  const dbEndpoints = endpoints.filter(e => 
    e.name.includes('Database') || 
    e.name.includes('Property Search') || 
    e.name.includes('Recent Sales')
  );
  
  if (dbEndpoints.some(e => e.status === 'slow' || e.status === 'critical')) {
    performanceResults.recommendations.push({
      category: 'Database',
      priority: 'High',
      recommendations: [
        'Implement database connection pooling',
        'Add database query caching',
        'Optimize Elasticsearch queries',
        'Add database indexes for frequently queried fields',
        'Implement query result caching'
      ]
    });
  }
  
  // API optimization recommendations
  const apiEndpoints = endpoints.filter(e => 
    e.name.includes('API') || 
    e.name.includes('Performance')
  );
  
  if (apiEndpoints.some(e => e.status === 'slow' || e.status === 'critical')) {
    performanceResults.recommendations.push({
      category: 'API',
      priority: 'High',
      recommendations: [
        'Implement API response caching',
        'Add request deduplication',
        'Optimize API middleware',
        'Implement rate limiting',
        'Add API response compression'
      ]
    });
  }
  
  // Cache optimization recommendations
  const cacheEndpoints = endpoints.filter(e => e.name.includes('Cache'));
  
  if (cacheEndpoints.some(e => e.status === 'slow' || e.status === 'critical')) {
    performanceResults.recommendations.push({
      category: 'Caching',
      priority: 'Medium',
      recommendations: [
        'Implement Redis caching layer',
        'Add memory caching for frequently accessed data',
        'Implement cache warming strategies',
        'Add cache invalidation policies',
        'Optimize cache hit ratios'
      ]
    });
  }
  
  // General optimization recommendations
  performanceResults.recommendations.push({
    category: 'General',
    priority: 'Medium',
    recommendations: [
      'Implement CDN for static assets',
      'Add image optimization and compression',
      'Implement lazy loading for non-critical components',
      'Add service worker for offline caching',
      'Optimize bundle sizes and code splitting'
    ]
  });
  
  // Display recommendations
  performanceResults.recommendations.forEach(rec => {
    const priorityIcon = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟢';
    console.log(`\n${priorityIcon} ${rec.category} (${rec.priority} Priority):`);
    rec.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
  });
}

async function generatePerformanceReport() {
  console.log('\n📋 Generating Performance Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalEndpoints: Object.keys(performanceResults.endpoints).length,
      excellent: Object.values(performanceResults.endpoints).filter(e => e.status === 'excellent').length,
      good: Object.values(performanceResults.endpoints).filter(e => e.status === 'good').length,
      acceptable: Object.values(performanceResults.endpoints).filter(e => e.status === 'acceptable').length,
      slow: Object.values(performanceResults.endpoints).filter(e => e.status === 'slow').length,
      critical: Object.values(performanceResults.endpoints).filter(e => e.status === 'critical').length
    },
    endpoints: performanceResults.endpoints,
    bottlenecks: performanceResults.bottlenecks,
    recommendations: performanceResults.recommendations
  };
  
  const reportPath = path.join(process.cwd(), 'performance-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Performance report saved to: ${reportPath}`);
  
  return report;
}

function displayFinalReport() {
  console.log('\n🎯 PERFORMANCE OPTIMIZATION REPORT');
  console.log('===================================');
  
  const endpoints = Object.values(performanceResults.endpoints);
  const total = endpoints.length;
  const excellent = endpoints.filter(e => e.status === 'excellent').length;
  const slow = endpoints.filter(e => e.status === 'slow' || e.status === 'critical').length;
  
  const performanceScore = total > 0 ? ((excellent / total) * 100).toFixed(1) : 0;
  
  console.log(`\n📊 Performance Score: ${performanceScore}%`);
  console.log(`   Total Endpoints: ${total}`);
  console.log(`   Excellent: ${excellent} 🚀`);
  console.log(`   Slow/Critical: ${slow} 🐌`);
  
  if (performanceResults.bottlenecks.length > 0) {
    console.log(`\n🐌 Critical Bottlenecks:`);
    performanceResults.bottlenecks.forEach(bottleneck => {
      console.log(`   • ${bottleneck.endpoint}: ${bottleneck.responseTime}ms`);
    });
  }
  
  console.log(`\n💡 Optimization Priority:`);
  performanceResults.recommendations.forEach(rec => {
    const priorityIcon = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟢';
    console.log(`   ${priorityIcon} ${rec.category}: ${rec.recommendations.length} recommendations`);
  });
  
  console.log(`\n${performanceScore >= 80 ? '🎉' : '⚠️'} Overall Performance: ${performanceScore >= 80 ? 'EXCELLENT' : 'NEEDS OPTIMIZATION'}`);
  
  return performanceScore >= 80;
}

// Main execution
async function runPerformanceOptimization() {
  console.log('⚡ BMV Finder - Performance Optimization Analysis');
  console.log('================================================');
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Iterations per test: ${CONFIG.iterations}`);
  console.log(`Timeout: ${CONFIG.timeout}ms`);
  
  const startTime = performance.now();
  
  try {
    await testCorePerformance();
    await testAdvancedPerformance();
    await testSystemPerformance();
    await testConcurrentLoad();
    
    analyzePerformance();
    await generatePerformanceReport();
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`\n⏱️  Total Analysis Time: ${Math.round(totalTime)}ms`);
    
    const isOptimized = displayFinalReport();
    
    process.exit(isOptimized ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Performance optimization analysis failed:', error.message);
    process.exit(1);
  }
}

// Run analysis if called directly
if (require.main === module) {
  runPerformanceOptimization();
}

module.exports = {
  runPerformanceOptimization,
  performanceResults
};
