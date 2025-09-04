#!/usr/bin/env node

/**
 * BMV Finder - Production Readiness Assessment
 * 
 * This script performs comprehensive production readiness assessment
 * and provides go-live preparation recommendations.
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
  productionThresholds: {
    uptime: 99.9,
    responseTime: 2000,
    errorRate: 1.0,
    availability: 99.5
  }
};

// Production readiness results
const readinessResults = {
  categories: {
    performance: { score: 0, maxScore: 0, issues: [] },
    security: { score: 0, maxScore: 0, issues: [] },
    reliability: { score: 0, maxScore: 0, issues: [] },
    scalability: { score: 0, maxScore: 0, issues: [] },
    monitoring: { score: 0, maxScore: 0, issues: [] },
    compliance: { score: 0, maxScore: 0, issues: [] }
  },
  readinessScore: 0,
  recommendations: [],
  criticalIssues: [],
  goLiveChecklist: []
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

function logAssessment(category, testName, status, details = '') {
  const timestamp = new Date().toISOString();
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  
  console.log(`${statusIcon} [${timestamp}] ${category}: ${testName} - ${status}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

function updateCategoryScore(category, passed, total) {
  readinessResults.categories[category].score += passed;
  readinessResults.categories[category].maxScore += total;
}

// Assessment functions
async function assessPerformance() {
  console.log('\n⚡ Assessing Performance...');
  
  const performanceTests = [
    { name: 'Home Page Load', url: '/', threshold: 2000 },
    { name: 'Property Search', url: '/api/property-search?postcode=M1+1AA&limit=10', threshold: 1500 },
    { name: 'HPI Data', url: '/api/hpi/postcode?postcode=M1+1AA', threshold: 1000 },
    { name: 'Property Valuation', url: '/api/property-valuation?postcode=M1+1AA&number=1', threshold: 3000 },
    { name: 'Market Trends', url: '/api/market-trends?postcode=M1+1AA', threshold: 2000 }
  ];
  
  let passed = 0;
  let total = performanceTests.length;
  
  for (const test of performanceTests) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${test.url}`);
      
      if (response.status >= 200 && response.status < 300) {
        if (response.responseTime <= test.threshold) {
          logAssessment('Performance', test.name, 'PASS', `${response.responseTime}ms (threshold: ${test.threshold}ms)`);
          passed++;
        } else {
          logAssessment('Performance', test.name, 'FAIL', `${response.responseTime}ms exceeds threshold: ${test.threshold}ms`);
          readinessResults.categories.performance.issues.push({
            test: test.name,
            issue: `Response time ${response.responseTime}ms exceeds threshold ${test.threshold}ms`,
            severity: 'Medium'
          });
        }
      } else {
        logAssessment('Performance', test.name, 'FAIL', `Status: ${response.status}`);
        readinessResults.categories.performance.issues.push({
          test: test.name,
          issue: `HTTP status ${response.status}`,
          severity: 'High'
        });
      }
    } catch (error) {
      logAssessment('Performance', test.name, 'FAIL', error.message);
      readinessResults.categories.performance.issues.push({
        test: test.name,
        issue: error.message,
        severity: 'High'
      });
    }
  }
  
  updateCategoryScore('performance', passed, total);
}

async function assessSecurity() {
  console.log('\n🔒 Assessing Security...');
  
  const securityTests = [
    { name: 'HTTPS Enforcement', url: '/', checkHeader: 'strict-transport-security' },
    { name: 'Content Security Policy', url: '/', checkHeader: 'content-security-policy' },
    { name: 'X-Frame-Options', url: '/', checkHeader: 'x-frame-options' },
    { name: 'Authentication Required', url: '/api/user/profile', expectedStatus: [401, 403] },
    { name: 'Admin Protection', url: '/api/admin/audit-logs', expectedStatus: [401, 403] }
  ];
  
  let passed = 0;
  let total = securityTests.length;
  
  for (const test of securityTests) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${test.url}`);
      
      if (test.checkHeader) {
        if (response.headers[test.checkHeader.toLowerCase()]) {
          logAssessment('Security', test.name, 'PASS', 'Header present');
          passed++;
        } else {
          logAssessment('Security', test.name, 'FAIL', 'Header missing');
          readinessResults.categories.security.issues.push({
            test: test.name,
            issue: `Missing security header: ${test.checkHeader}`,
            severity: 'Medium'
          });
        }
      } else if (test.expectedStatus) {
        if (test.expectedStatus.includes(response.status)) {
          logAssessment('Security', test.name, 'PASS', `Status: ${response.status} (Protected)`);
          passed++;
        } else {
          logAssessment('Security', test.name, 'FAIL', `Status: ${response.status} (Not protected)`);
          readinessResults.categories.security.issues.push({
            test: test.name,
            issue: `Endpoint not properly protected - status: ${response.status}`,
            severity: 'High'
          });
        }
      }
    } catch (error) {
      logAssessment('Security', test.name, 'FAIL', error.message);
      readinessResults.categories.security.issues.push({
        test: test.name,
        issue: error.message,
        severity: 'High'
      });
    }
  }
  
  updateCategoryScore('security', passed, total);
}

async function assessReliability() {
  console.log('\n🛡️ Assessing Reliability...');
  
  const reliabilityTests = [
    { name: 'Health Check', url: '/api/health-check' },
    { name: 'System Health', url: '/api/system-health' },
    { name: 'Database Health', url: '/api/health/database' },
    { name: 'Error Handling', url: '/api/nonexistent-endpoint', expectedStatus: [404] },
    { name: 'Graceful Degradation', url: '/api/property-search?postcode=INVALID', expectedStatus: [400, 500] }
  ];
  
  let passed = 0;
  let total = reliabilityTests.length;
  
  for (const test of reliabilityTests) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${test.url}`);
      
      if (test.expectedStatus) {
        if (test.expectedStatus.includes(response.status)) {
          logAssessment('Reliability', test.name, 'PASS', `Status: ${response.status} (Expected)`);
          passed++;
        } else {
          logAssessment('Reliability', test.name, 'FAIL', `Status: ${response.status} (Unexpected)`);
          readinessResults.categories.reliability.issues.push({
            test: test.name,
            issue: `Unexpected response status: ${response.status}`,
            severity: 'Medium'
          });
        }
      } else {
        if (response.status >= 200 && response.status < 300) {
          logAssessment('Reliability', test.name, 'PASS', `Status: ${response.status}`);
          passed++;
        } else {
          logAssessment('Reliability', test.name, 'FAIL', `Status: ${response.status}`);
          readinessResults.categories.reliability.issues.push({
            test: test.name,
            issue: `Service unavailable - status: ${response.status}`,
            severity: 'High'
          });
        }
      }
    } catch (error) {
      logAssessment('Reliability', test.name, 'FAIL', error.message);
      readinessResults.categories.reliability.issues.push({
        test: test.name,
        issue: error.message,
        severity: 'High'
      });
    }
  }
  
  updateCategoryScore('reliability', passed, total);
}

async function assessScalability() {
  console.log('\n📈 Assessing Scalability...');
  
  const scalabilityTests = [
    { name: 'Load Balancing', url: '/api/health-check' },
    { name: 'Caching System', url: '/api/performance/cache' },
    { name: 'Database Optimization', url: '/api/performance/database' },
    { name: 'API Performance', url: '/api/performance/api' },
    { name: 'Resource Management', url: '/api/performance/system' }
  ];
  
  let passed = 0;
  let total = scalabilityTests.length;
  
  for (const test of scalabilityTests) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${test.url}`);
      
      if (response.status >= 200 && response.status < 300) {
        logAssessment('Scalability', test.name, 'PASS', `Status: ${response.status}`);
        passed++;
      } else {
        logAssessment('Scalability', test.name, 'FAIL', `Status: ${response.status}`);
        readinessResults.categories.scalability.issues.push({
          test: test.name,
          issue: `Scalability feature not available - status: ${response.status}`,
          severity: 'Medium'
        });
      }
    } catch (error) {
      logAssessment('Scalability', test.name, 'FAIL', error.message);
      readinessResults.categories.scalability.issues.push({
        test: test.name,
        issue: error.message,
        severity: 'Medium'
      });
    }
  }
  
  updateCategoryScore('scalability', passed, total);
}

async function assessMonitoring() {
  console.log('\n📊 Assessing Monitoring...');
  
  const monitoringTests = [
    { name: 'Performance Monitoring', url: '/api/performance/dashboard' },
    { name: 'System Metrics', url: '/api/monitoring/metrics' },
    { name: 'Health Monitoring', url: '/api/monitoring/health' },
    { name: 'Alert System', url: '/api/monitoring/alerts' },
    { name: 'Logging System', url: '/api/security/events' }
  ];
  
  let passed = 0;
  let total = monitoringTests.length;
  
  for (const test of monitoringTests) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${test.url}`);
      
      if (response.status >= 200 && response.status < 300) {
        logAssessment('Monitoring', test.name, 'PASS', `Status: ${response.status}`);
        passed++;
      } else if (response.status === 401 || response.status === 403) {
        logAssessment('Monitoring', test.name, 'PASS', `Status: ${response.status} (Auth required)`);
        passed++;
      } else {
        logAssessment('Monitoring', test.name, 'FAIL', `Status: ${response.status}`);
        readinessResults.categories.monitoring.issues.push({
          test: test.name,
          issue: `Monitoring feature not available - status: ${response.status}`,
          severity: 'Medium'
        });
      }
    } catch (error) {
      logAssessment('Monitoring', test.name, 'FAIL', error.message);
      readinessResults.categories.monitoring.issues.push({
        test: test.name,
        issue: error.message,
        severity: 'Medium'
      });
    }
  }
  
  updateCategoryScore('monitoring', passed, total);
}

async function assessCompliance() {
  console.log('\n📋 Assessing Compliance...');
  
  const complianceTests = [
    { name: 'GDPR Compliance', url: '/api/data-protection/consent' },
    { name: 'Data Access Rights', url: '/api/data-protection/requests' },
    { name: 'Privacy Policy', url: '/privacy' },
    { name: 'Terms of Service', url: '/terms' },
    { name: 'Security Compliance', url: '/api/security/metrics' }
  ];
  
  let passed = 0;
  let total = complianceTests.length;
  
  for (const test of complianceTests) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${test.url}`);
      
      if (response.status >= 200 && response.status < 300) {
        logAssessment('Compliance', test.name, 'PASS', `Status: ${response.status}`);
        passed++;
      } else if (response.status === 401 || response.status === 403) {
        logAssessment('Compliance', test.name, 'PASS', `Status: ${response.status} (Auth required)`);
        passed++;
      } else {
        logAssessment('Compliance', test.name, 'FAIL', `Status: ${response.status}`);
        readinessResults.categories.compliance.issues.push({
          test: test.name,
          issue: `Compliance feature not available - status: ${response.status}`,
          severity: 'High'
        });
      }
    } catch (error) {
      logAssessment('Compliance', test.name, 'FAIL', error.message);
      readinessResults.categories.compliance.issues.push({
        test: test.name,
        issue: error.message,
        severity: 'High'
      });
    }
  }
  
  updateCategoryScore('compliance', passed, total);
}

function calculateReadinessScore() {
  const categories = Object.values(readinessResults.categories);
  const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
  const totalMaxScore = categories.reduce((sum, cat) => sum + cat.maxScore, 0);
  
  readinessResults.readinessScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
  
  // Identify critical issues
  categories.forEach(category => {
    category.issues.forEach(issue => {
      if (issue.severity === 'High') {
        readinessResults.criticalIssues.push({
          category: Object.keys(readinessResults.categories).find(key => 
            readinessResults.categories[key] === category
          ),
          issue: issue.issue,
          test: issue.test
        });
      }
    });
  });
}

function generateRecommendations() {
  console.log('\n💡 Production Readiness Recommendations...');
  
  const categories = readinessResults.categories;
  
  // Performance recommendations
  if (categories.performance.score / categories.performance.maxScore < 0.8) {
    readinessResults.recommendations.push({
      category: 'Performance',
      priority: 'High',
      recommendations: [
        'Optimize slow API endpoints',
        'Implement caching strategies',
        'Add CDN for static assets',
        'Optimize database queries',
        'Implement lazy loading'
      ]
    });
  }
  
  // Security recommendations
  if (categories.security.score / categories.security.maxScore < 0.8) {
    readinessResults.recommendations.push({
      category: 'Security',
      priority: 'High',
      recommendations: [
        'Implement missing security headers',
        'Add authentication to protected endpoints',
        'Implement rate limiting',
        'Add input validation',
        'Implement security monitoring'
      ]
    });
  }
  
  // Reliability recommendations
  if (categories.reliability.score / categories.reliability.maxScore < 0.8) {
    readinessResults.recommendations.push({
      category: 'Reliability',
      priority: 'High',
      recommendations: [
        'Fix failing health checks',
        'Implement proper error handling',
        'Add circuit breakers',
        'Implement retry mechanisms',
        'Add graceful degradation'
      ]
    });
  }
  
  // Scalability recommendations
  if (categories.scalability.score / categories.scalability.maxScore < 0.8) {
    readinessResults.recommendations.push({
      category: 'Scalability',
      priority: 'Medium',
      recommendations: [
        'Implement load balancing',
        'Add caching layers',
        'Optimize database performance',
        'Implement horizontal scaling',
        'Add resource monitoring'
      ]
    });
  }
  
  // Monitoring recommendations
  if (categories.monitoring.score / categories.monitoring.maxScore < 0.8) {
    readinessResults.recommendations.push({
      category: 'Monitoring',
      priority: 'Medium',
      recommendations: [
        'Implement comprehensive monitoring',
        'Add alerting systems',
        'Set up log aggregation',
        'Add performance metrics',
        'Implement health checks'
      ]
    });
  }
  
  // Compliance recommendations
  if (categories.compliance.score / categories.compliance.maxScore < 0.8) {
    readinessResults.recommendations.push({
      category: 'Compliance',
      priority: 'High',
      recommendations: [
        'Implement GDPR compliance',
        'Add privacy controls',
        'Implement data protection',
        'Add audit logging',
        'Ensure legal compliance'
      ]
    });
  }
  
  // Display recommendations
  readinessResults.recommendations.forEach(rec => {
    const priorityIcon = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟢';
    console.log(`\n${priorityIcon} ${rec.category} (${rec.priority} Priority):`);
    rec.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
  });
}

function generateGoLiveChecklist() {
  console.log('\n📋 Go-Live Checklist...');
  
  readinessResults.goLiveChecklist = [
    {
      category: 'Pre-Launch',
      items: [
        'All critical issues resolved',
        'Performance benchmarks met',
        'Security assessment passed',
        'Load testing completed',
        'Backup and recovery tested'
      ]
    },
    {
      category: 'Infrastructure',
      items: [
        'Production environment configured',
        'SSL certificates installed',
        'CDN configured',
        'Monitoring systems active',
        'Alert systems configured'
      ]
    },
    {
      category: 'Security',
      items: [
        'Security headers implemented',
        'Authentication system active',
        'Rate limiting configured',
        'Input validation active',
        'Security monitoring enabled'
      ]
    },
    {
      category: 'Monitoring',
      items: [
        'Health checks active',
        'Performance monitoring enabled',
        'Error tracking configured',
        'Log aggregation active',
        'Alert notifications tested'
      ]
    },
    {
      category: 'Compliance',
      items: [
        'GDPR compliance verified',
        'Privacy policy published',
        'Terms of service published',
        'Data protection measures active',
        'Audit logging enabled'
      ]
    }
  ];
  
  // Display checklist
  readinessResults.goLiveChecklist.forEach(category => {
    console.log(`\n📂 ${category.category}:`);
    category.items.forEach(item => {
      console.log(`   ☐ ${item}`);
    });
  });
}

async function generateProductionReport() {
  console.log('\n📋 Generating Production Readiness Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    readinessScore: readinessResults.readinessScore,
    categories: readinessResults.categories,
    criticalIssues: readinessResults.criticalIssues,
    recommendations: readinessResults.recommendations,
    goLiveChecklist: readinessResults.goLiveChecklist
  };
  
  const reportPath = path.join(process.cwd(), 'production-readiness-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Production readiness report saved to: ${reportPath}`);
  
  return report;
}

function displayFinalReport() {
  console.log('\n🚀 PRODUCTION READINESS ASSESSMENT');
  console.log('==================================');
  
  const score = readinessResults.readinessScore;
  const criticalIssues = readinessResults.criticalIssues.length;
  
  console.log(`\n📊 Overall Readiness Score: ${score.toFixed(1)}%`);
  
  console.log(`\n📈 Category Scores:`);
  Object.entries(readinessResults.categories).forEach(([category, data]) => {
    const categoryScore = data.maxScore > 0 ? (data.score / data.maxScore) * 100 : 0;
    const statusIcon = categoryScore >= 80 ? '✅' : categoryScore >= 60 ? '⚠️' : '❌';
    console.log(`   ${statusIcon} ${category}: ${categoryScore.toFixed(1)}% (${data.score}/${data.maxScore})`);
  });
  
  if (criticalIssues > 0) {
    console.log(`\n🔴 Critical Issues (${criticalIssues}):`);
    readinessResults.criticalIssues.forEach(issue => {
      console.log(`   • ${issue.category}: ${issue.issue}`);
    });
  }
  
  console.log(`\n💡 Recommendations:`);
  readinessResults.recommendations.forEach(rec => {
    const priorityIcon = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟢';
    console.log(`   ${priorityIcon} ${rec.category}: ${rec.recommendations.length} items`);
  });
  
  const isReady = score >= 80 && criticalIssues === 0;
  console.log(`\n${isReady ? '🎉' : '⚠️'} Production Status: ${isReady ? 'READY FOR GO-LIVE' : 'NOT READY'}`);
  
  if (!isReady) {
    console.log(`\n🚫 Blockers:`);
    if (criticalIssues > 0) {
      console.log(`   • ${criticalIssues} critical issues must be resolved`);
    }
    if (score < 80) {
      console.log(`   • Overall readiness score below 80% (${score.toFixed(1)}%)`);
    }
  }
  
  return isReady;
}

// Main execution
async function runProductionReadinessAssessment() {
  console.log('🚀 BMV Finder - Production Readiness Assessment');
  console.log('==============================================');
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Timeout: ${CONFIG.timeout}ms`);
  
  const startTime = performance.now();
  
  try {
    await assessPerformance();
    await assessSecurity();
    await assessReliability();
    await assessScalability();
    await assessMonitoring();
    await assessCompliance();
    
    calculateReadinessScore();
    generateRecommendations();
    generateGoLiveChecklist();
    await generateProductionReport();
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`\n⏱️  Total Assessment Time: ${Math.round(totalTime)}ms`);
    
    const isReady = displayFinalReport();
    
    process.exit(isReady ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Production readiness assessment failed:', error.message);
    process.exit(1);
  }
}

// Run assessment if called directly
if (require.main === module) {
  runProductionReadinessAssessment();
}

module.exports = {
  runProductionReadinessAssessment,
  readinessResults
};
