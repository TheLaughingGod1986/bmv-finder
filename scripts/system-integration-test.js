#!/usr/bin/env node

/**
 * BMV Finder - System Integration Test
 * 
 * This script performs comprehensive system integration testing
 * to validate all components work together seamlessly.
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 3,
  performanceThresholds: {
    pageLoad: 3000,      // 3 seconds
    apiResponse: 1000,   // 1 second
    searchQuery: 2000,   // 2 seconds
    valuation: 5000      // 5 seconds
  }
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  performance: {},
  errors: []
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
            responseTime
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            responseTime
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

async function retryRequest(url, options = {}, retries = CONFIG.retries) {
  for (let i = 0; i < retries; i++) {
    try {
      return await makeRequest(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

function logTest(testName, status, details = '') {
  const timestamp = new Date().toISOString();
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  
  console.log(`${statusIcon} [${timestamp}] ${testName}: ${status}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

function logPerformance(testName, responseTime, threshold) {
  testResults.performance[testName] = {
    responseTime: Math.round(responseTime),
    threshold,
    status: responseTime <= threshold ? 'GOOD' : 'SLOW'
  };
  
  const status = responseTime <= threshold ? 'GOOD' : 'SLOW';
  const icon = status === 'GOOD' ? '🚀' : '🐌';
  console.log(`${icon} Performance: ${testName} - ${Math.round(responseTime)}ms (threshold: ${threshold}ms)`);
}

// Test suites
async function testCoreAPIs() {
  console.log('\n🔍 Testing Core APIs...');
  
  const coreAPIs = [
    { name: 'Health Check', url: '/api/health-check', threshold: CONFIG.performanceThresholds.apiResponse },
    { name: 'System Health', url: '/api/system-health', threshold: CONFIG.performanceThresholds.apiResponse },
    { name: 'Property Search', url: '/api/property-search?postcode=M1+1AA&limit=5', threshold: CONFIG.performanceThresholds.searchQuery },
    { name: 'HPI Data', url: '/api/hpi/postcode?postcode=M1+1AA', threshold: CONFIG.performanceThresholds.apiResponse },
    { name: 'Market Trends', url: '/api/market-trends?postcode=M1+1AA', threshold: CONFIG.performanceThresholds.apiResponse },
    { name: 'Recent Sales', url: '/api/recent-sales?postcode=M1+1AA&limit=5', threshold: CONFIG.performanceThresholds.apiResponse }
  ];
  
  for (const api of coreAPIs) {
    try {
      const response = await retryRequest(`${CONFIG.baseUrl}${api.url}`);
      
      if (response.status >= 200 && response.status < 300) {
        logTest(`API: ${api.name}`, 'PASS', `Status: ${response.status}`);
        logPerformance(`API: ${api.name}`, response.responseTime, api.threshold);
      } else {
        logTest(`API: ${api.name}`, 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      logTest(`API: ${api.name}`, 'FAIL', error.message);
      testResults.errors.push({ test: api.name, error: error.message });
    }
  }
}

async function testAdvancedFeatures() {
  console.log('\n🚀 Testing Advanced Features...');
  
  const advancedAPIs = [
    { name: 'Property Valuation', url: '/api/property-valuation?postcode=M1+1AA&number=1', threshold: CONFIG.performanceThresholds.valuation },
    { name: 'Investment Recommendations', url: '/api/investment-recommendations?postcode=M1+1AA', threshold: CONFIG.performanceThresholds.apiResponse },
    { name: 'Market Intelligence', url: '/api/analytics/market-intelligence?region=Manchester', threshold: CONFIG.performanceThresholds.apiResponse },
    { name: 'Portfolio Analytics', url: '/api/portfolio/analytics', threshold: CONFIG.performanceThresholds.apiResponse },
    { name: 'Performance Dashboard', url: '/api/performance/dashboard', threshold: CONFIG.performanceThresholds.apiResponse }
  ];
  
  for (const api of advancedAPIs) {
    try {
      const response = await retryRequest(`${CONFIG.baseUrl}${api.url}`);
      
      if (response.status >= 200 && response.status < 300) {
        logTest(`Advanced: ${api.name}`, 'PASS', `Status: ${response.status}`);
        logPerformance(`Advanced: ${api.name}`, response.responseTime, api.threshold);
      } else {
        logTest(`Advanced: ${api.name}`, 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      logTest(`Advanced: ${api.name}`, 'FAIL', error.message);
      testResults.errors.push({ test: api.name, error: error.message });
    }
  }
}

async function testUserJourneys() {
  console.log('\n👤 Testing User Journeys...');
  
  const journeys = [
    {
      name: 'Property Search Journey',
      steps: [
        { name: 'Search Properties', url: '/api/property-search?postcode=M1+1AA&limit=10' },
        { name: 'Get Property Details', url: '/api/enhanced-property-search?postcode=M1+1AA&includeRental=true' },
        { name: 'Calculate Valuation', url: '/api/property-valuation?postcode=M1+1AA&number=1' },
        { name: 'Get Investment Advice', url: '/api/investment-recommendations?postcode=M1+1AA' }
      ]
    },
    {
      name: 'Portfolio Management Journey',
      steps: [
        { name: 'Get Portfolio', url: '/api/portfolio' },
        { name: 'Portfolio Analytics', url: '/api/portfolio/analytics' },
        { name: 'Performance Report', url: '/api/performance/dashboard' }
      ]
    },
    {
      name: 'Market Analysis Journey',
      steps: [
        { name: 'HPI Data', url: '/api/hpi/postcode?postcode=M1+1AA' },
        { name: 'Market Trends', url: '/api/market-trends?postcode=M1+1AA' },
        { name: 'Market Intelligence', url: '/api/analytics/market-intelligence?region=Manchester' }
      ]
    }
  ];
  
  for (const journey of journeys) {
    console.log(`\n  📋 ${journey.name}:`);
    let journeySuccess = true;
    
    for (const step of journey.steps) {
      try {
        const response = await retryRequest(`${CONFIG.baseUrl}${step.url}`);
        
        if (response.status >= 200 && response.status < 300) {
          logTest(`  ${step.name}`, 'PASS', `Status: ${response.status}`);
        } else {
          logTest(`  ${step.name}`, 'FAIL', `Status: ${response.status}`);
          journeySuccess = false;
        }
      } catch (error) {
        logTest(`  ${step.name}`, 'FAIL', error.message);
        journeySuccess = false;
      }
    }
    
    if (journeySuccess) {
      logTest(`Journey: ${journey.name}`, 'PASS');
    } else {
      logTest(`Journey: ${journey.name}`, 'FAIL');
    }
  }
}

async function testPerformanceOptimization() {
  console.log('\n⚡ Testing Performance Optimization...');
  
  const performanceTests = [
    {
      name: 'Cache Performance',
      url: '/api/performance/cache',
      threshold: 500
    },
    {
      name: 'Database Performance',
      url: '/api/performance/database',
      threshold: 1000
    },
    {
      name: 'API Performance',
      url: '/api/performance/api',
      threshold: 500
    },
    {
      name: 'System Performance',
      url: '/api/performance/system',
      threshold: 1000
    }
  ];
  
  for (const test of performanceTests) {
    try {
      const response = await retryRequest(`${CONFIG.baseUrl}${test.url}`);
      
      if (response.status >= 200 && response.status < 300) {
        logTest(`Performance: ${test.name}`, 'PASS', `Status: ${response.status}`);
        logPerformance(`Performance: ${test.name}`, response.responseTime, test.threshold);
        
        // Check if performance data is available
        if (response.data && response.data.success) {
          logTest(`Performance Data: ${test.name}`, 'PASS', 'Performance metrics available');
        } else {
          logTest(`Performance Data: ${test.name}`, 'WARN', 'No performance metrics returned');
        }
      } else {
        logTest(`Performance: ${test.name}`, 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      logTest(`Performance: ${test.name}`, 'FAIL', error.message);
      testResults.errors.push({ test: test.name, error: error.message });
    }
  }
}

async function testSecurityFeatures() {
  console.log('\n🔒 Testing Security Features...');
  
  const securityTests = [
    { name: 'Security Metrics', url: '/api/security/metrics' },
    { name: 'Security Events', url: '/api/security/events' },
    { name: 'Rate Limiting', url: '/api/security/rate-limit' },
    { name: 'Data Protection', url: '/api/data-protection/consent' }
  ];
  
  for (const test of securityTests) {
    try {
      const response = await retryRequest(`${CONFIG.baseUrl}${test.url}`);
      
      if (response.status >= 200 && response.status < 300) {
        logTest(`Security: ${test.name}`, 'PASS', `Status: ${response.status}`);
      } else if (response.status === 401 || response.status === 403) {
        logTest(`Security: ${test.name}`, 'PASS', `Status: ${response.status} (Expected auth required)`);
      } else {
        logTest(`Security: ${test.name}`, 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      logTest(`Security: ${test.name}`, 'FAIL', error.message);
      testResults.errors.push({ test: test.name, error: error.message });
    }
  }
}

async function testIntegrationFeatures() {
  console.log('\n🔗 Testing Integration Features...');
  
  const integrationTests = [
    { name: 'Integrations List', url: '/api/integrations' },
    { name: 'Webhooks', url: '/api/webhooks' },
    { name: 'Monitoring Config', url: '/api/monitoring/configs' },
    { name: 'Documentation', url: '/api/documentation' }
  ];
  
  for (const test of integrationTests) {
    try {
      const response = await retryRequest(`${CONFIG.baseUrl}${test.url}`);
      
      if (response.status >= 200 && response.status < 300) {
        logTest(`Integration: ${test.name}`, 'PASS', `Status: ${response.status}`);
      } else if (response.status === 401 || response.status === 403) {
        logTest(`Integration: ${test.name}`, 'PASS', `Status: ${response.status} (Expected auth required)`);
      } else {
        logTest(`Integration: ${test.name}`, 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      logTest(`Integration: ${test.name}`, 'FAIL', error.message);
      testResults.errors.push({ test: test.name, error: error.message });
    }
  }
}

function generateReport() {
  console.log('\n📊 SYSTEM INTEGRATION TEST REPORT');
  console.log('=====================================');
  
  const total = testResults.passed + testResults.failed + testResults.warnings;
  const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`\n📈 Summary:`);
  console.log(`   Total Tests: ${total}`);
  console.log(`   Passed: ${testResults.passed} ✅`);
  console.log(`   Failed: ${testResults.failed} ❌`);
  console.log(`   Warnings: ${testResults.warnings} ⚠️`);
  console.log(`   Success Rate: ${successRate}%`);
  
  console.log(`\n⚡ Performance Summary:`);
  for (const [test, metrics] of Object.entries(testResults.performance)) {
    const status = metrics.status === 'GOOD' ? '✅' : '🐌';
    console.log(`   ${status} ${test}: ${metrics.responseTime}ms (threshold: ${metrics.threshold}ms)`);
  }
  
  if (testResults.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    testResults.errors.forEach(error => {
      console.log(`   ${error.test}: ${error.error}`);
    });
  }
  
  console.log(`\n🎯 Recommendations:`);
  if (testResults.failed > 0) {
    console.log(`   - Fix ${testResults.failed} failing tests before production deployment`);
  }
  
  const slowTests = Object.entries(testResults.performance)
    .filter(([_, metrics]) => metrics.status === 'SLOW');
  
  if (slowTests.length > 0) {
    console.log(`   - Optimize ${slowTests.length} slow endpoints for better performance`);
    slowTests.forEach(([test, _]) => {
      console.log(`     * ${test}`);
    });
  }
  
  if (testResults.warnings > 0) {
    console.log(`   - Address ${testResults.warnings} warnings for better reliability`);
  }
  
  console.log(`\n${successRate >= 90 ? '🎉' : '⚠️'} Overall Status: ${successRate >= 90 ? 'READY FOR PRODUCTION' : 'NEEDS ATTENTION'}`);
  
  return successRate >= 90;
}

// Main execution
async function runIntegrationTests() {
  console.log('🚀 BMV Finder - System Integration Test');
  console.log('========================================');
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Timeout: ${CONFIG.timeout}ms`);
  console.log(`Retries: ${CONFIG.retries}`);
  
  const startTime = performance.now();
  
  try {
    await testCoreAPIs();
    await testAdvancedFeatures();
    await testUserJourneys();
    await testPerformanceOptimization();
    await testSecurityFeatures();
    await testIntegrationFeatures();
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`\n⏱️  Total Test Time: ${Math.round(totalTime)}ms`);
    
    const isReady = generateReport();
    
    process.exit(isReady ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Integration test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runIntegrationTests();
}

module.exports = {
  runIntegrationTests,
  testResults
};
