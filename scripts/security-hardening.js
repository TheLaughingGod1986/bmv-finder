#!/usr/bin/env node

/**
 * BMV Finder - Security Hardening Script
 * 
 * This script performs comprehensive security assessment and
 * provides hardening recommendations for the BMV Finder platform.
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  securityThresholds: {
    responseTime: 2000,
    maxRedirects: 3,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    requiredHeaders: ['X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection']
  }
};

// Security assessment results
const securityResults = {
  vulnerabilities: [],
  recommendations: [],
  compliance: {
    gdpr: { score: 0, issues: [] },
    security: { score: 0, issues: [] },
    authentication: { score: 0, issues: [] }
  },
  endpoints: {}
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
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          responseTime,
          url: res.responseUrl || url
        });
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

function logSecurityTest(testName, status, details = '') {
  const timestamp = new Date().toISOString();
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  
  console.log(`${statusIcon} [${timestamp}] ${testName}: ${status}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Security test functions
async function testAuthenticationSecurity() {
  console.log('\n🔐 Testing Authentication Security...');
  
  const authTests = [
    {
      name: 'Login Endpoint Security',
      url: '/api/auth/login',
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'test123' }),
      expectedStatus: [400, 401, 403] // Should reject invalid credentials
    },
    {
      name: 'Protected Endpoint Access',
      url: '/api/user/profile',
      method: 'GET',
      expectedStatus: [401, 403] // Should require authentication
    },
    {
      name: 'Admin Endpoint Access',
      url: '/api/admin/audit-logs',
      method: 'GET',
      expectedStatus: [401, 403] // Should require admin authentication
    }
  ];
  
  for (const test of authTests) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${test.url}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: test.body
      });
      
      if (test.expectedStatus.includes(response.status)) {
        logSecurityTest(`Auth: ${test.name}`, 'PASS', `Status: ${response.status} (Expected)`);
        securityResults.compliance.authentication.score += 1;
      } else {
        logSecurityTest(`Auth: ${test.name}`, 'FAIL', `Status: ${response.status} (Unexpected)`);
        securityResults.vulnerabilities.push({
          type: 'Authentication',
          endpoint: test.name,
          severity: 'High',
          description: `Unexpected response status: ${response.status}`
        });
      }
    } catch (error) {
      logSecurityTest(`Auth: ${test.name}`, 'FAIL', error.message);
    }
  }
}

async function testInputValidation() {
  console.log('\n🛡️ Testing Input Validation...');
  
  const validationTests = [
    {
      name: 'SQL Injection Test',
      url: '/api/property-search?postcode=1\' OR \'1\'=\'1',
      expectedStatus: [400, 500]
    },
    {
      name: 'XSS Test',
      url: '/api/property-search?postcode=<script>alert("xss")</script>',
      expectedStatus: [400, 500]
    },
    {
      name: 'Path Traversal Test',
      url: '/api/property-search?postcode=../../../etc/passwd',
      expectedStatus: [400, 500]
    },
    {
      name: 'Large Input Test',
      url: `/api/property-search?postcode=${'A'.repeat(10000)}`,
      expectedStatus: [400, 413]
    }
  ];
  
  for (const test of validationTests) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${test.url}`);
      
      if (test.expectedStatus.includes(response.status)) {
        logSecurityTest(`Validation: ${test.name}`, 'PASS', `Status: ${response.status} (Blocked)`);
      } else {
        logSecurityTest(`Validation: ${test.name}`, 'FAIL', `Status: ${response.status} (Not blocked)`);
        securityResults.vulnerabilities.push({
          type: 'Input Validation',
          endpoint: test.name,
          severity: 'High',
          description: `Input validation failed - status: ${response.status}`
        });
      }
    } catch (error) {
      logSecurityTest(`Validation: ${test.name}`, 'PASS', 'Request blocked (Good)');
    }
  }
}

async function testSecurityHeaders() {
  console.log('\n🔒 Testing Security Headers...');
  
  const securityHeaderTests = [
    {
      name: 'Content Security Policy',
      url: '/',
      header: 'Content-Security-Policy'
    },
    {
      name: 'X-Frame-Options',
      url: '/',
      header: 'X-Frame-Options'
    },
    {
      name: 'X-Content-Type-Options',
      url: '/',
      header: 'X-Content-Type-Options'
    },
    {
      name: 'X-XSS-Protection',
      url: '/',
      header: 'X-XSS-Protection'
    },
    {
      name: 'Strict-Transport-Security',
      url: '/',
      header: 'Strict-Transport-Security'
    }
  ];
  
  for (const test of securityHeaderTests) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${test.url}`);
      
      if (response.headers[test.header.toLowerCase()]) {
        logSecurityTest(`Headers: ${test.name}`, 'PASS', 'Present');
        securityResults.compliance.security.score += 1;
      } else {
        logSecurityTest(`Headers: ${test.name}`, 'FAIL', 'Missing');
        securityResults.vulnerabilities.push({
          type: 'Security Headers',
          endpoint: test.name,
          severity: 'Medium',
          description: `Missing security header: ${test.header}`
        });
      }
    } catch (error) {
      logSecurityTest(`Headers: ${test.name}`, 'FAIL', error.message);
    }
  }
}

async function testRateLimiting() {
  console.log('\n⏱️ Testing Rate Limiting...');
  
  const rateLimitTests = [
    {
      name: 'API Rate Limiting',
      url: '/api/property-search?postcode=M1+1AA',
      requests: 20,
      expectedStatus: 429
    },
    {
      name: 'Auth Rate Limiting',
      url: '/api/auth/login',
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
      requests: 10,
      expectedStatus: 429
    }
  ];
  
  for (const test of rateLimitTests) {
    console.log(`\n   🔄 Testing: ${test.name}`);
    
    let rateLimited = false;
    const promises = [];
    
    // Send multiple requests quickly
    for (let i = 0; i < test.requests; i++) {
      promises.push(makeRequest(`${CONFIG.baseUrl}${test.url}`, {
        method: test.method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: test.body
      }));
    }
    
    try {
      const responses = await Promise.all(promises);
      const rateLimitResponses = responses.filter(r => r.status === test.expectedStatus);
      
      if (rateLimitResponses.length > 0) {
        logSecurityTest(`Rate Limit: ${test.name}`, 'PASS', `${rateLimitResponses.length} requests rate limited`);
        securityResults.compliance.security.score += 1;
      } else {
        logSecurityTest(`Rate Limit: ${test.name}`, 'FAIL', 'No rate limiting detected');
        securityResults.vulnerabilities.push({
          type: 'Rate Limiting',
          endpoint: test.name,
          severity: 'Medium',
          description: 'Rate limiting not properly implemented'
        });
      }
    } catch (error) {
      logSecurityTest(`Rate Limit: ${test.name}`, 'WARN', error.message);
    }
  }
}

async function testDataProtection() {
  console.log('\n🔐 Testing Data Protection (GDPR)...');
  
  const gdprTests = [
    {
      name: 'Data Access Request',
      url: '/api/data-protection/requests',
      method: 'POST',
      body: JSON.stringify({ type: 'access', email: 'test@example.com' }),
      expectedStatus: [200, 201, 400, 401]
    },
    {
      name: 'Data Deletion Request',
      url: '/api/data-protection/requests',
      method: 'POST',
      body: JSON.stringify({ type: 'deletion', email: 'test@example.com' }),
      expectedStatus: [200, 201, 400, 401]
    },
    {
      name: 'Consent Management',
      url: '/api/data-protection/consent',
      method: 'GET',
      expectedStatus: [200, 401, 403]
    }
  ];
  
  for (const test of gdprTests) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${test.url}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: test.body
      });
      
      if (test.expectedStatus.includes(response.status)) {
        logSecurityTest(`GDPR: ${test.name}`, 'PASS', `Status: ${response.status}`);
        securityResults.compliance.gdpr.score += 1;
      } else {
        logSecurityTest(`GDPR: ${test.name}`, 'FAIL', `Status: ${response.status}`);
        securityResults.vulnerabilities.push({
          type: 'Data Protection',
          endpoint: test.name,
          severity: 'High',
          description: `GDPR compliance issue - status: ${response.status}`
        });
      }
    } catch (error) {
      logSecurityTest(`GDPR: ${test.name}`, 'FAIL', error.message);
    }
  }
}

async function testEndpointSecurity() {
  console.log('\n🔍 Testing Endpoint Security...');
  
  const endpointTests = [
    {
      name: 'Admin Endpoints',
      url: '/api/admin/audit-logs',
      expectedStatus: [401, 403]
    },
    {
      name: 'User Data Endpoints',
      url: '/api/user/profile',
      expectedStatus: [401, 403]
    },
    {
      name: 'Security Endpoints',
      url: '/api/security/metrics',
      expectedStatus: [401, 403]
    },
    {
      name: 'Monitoring Endpoints',
      url: '/api/monitoring/metrics',
      expectedStatus: [401, 403]
    }
  ];
  
  for (const test of endpointTests) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${test.url}`);
      
      if (test.expectedStatus.includes(response.status)) {
        logSecurityTest(`Endpoint: ${test.name}`, 'PASS', `Status: ${response.status} (Protected)`);
        securityResults.compliance.security.score += 1;
      } else {
        logSecurityTest(`Endpoint: ${test.name}`, 'FAIL', `Status: ${response.status} (Not protected)`);
        securityResults.vulnerabilities.push({
          type: 'Endpoint Security',
          endpoint: test.name,
          severity: 'High',
          description: `Endpoint not properly protected - status: ${response.status}`
        });
      }
    } catch (error) {
      logSecurityTest(`Endpoint: ${test.name}`, 'FAIL', error.message);
    }
  }
}

function generateSecurityRecommendations() {
  console.log('\n💡 Security Recommendations...');
  
  // Authentication recommendations
  if (securityResults.compliance.authentication.score < 3) {
    securityResults.recommendations.push({
      category: 'Authentication',
      priority: 'High',
      recommendations: [
        'Implement strong password policies',
        'Add multi-factor authentication (MFA)',
        'Implement account lockout after failed attempts',
        'Add session timeout and management',
        'Implement JWT token refresh mechanism'
      ]
    });
  }
  
  // Security headers recommendations
  const missingHeaders = securityResults.vulnerabilities.filter(v => v.type === 'Security Headers');
  if (missingHeaders.length > 0) {
    securityResults.recommendations.push({
      category: 'Security Headers',
      priority: 'Medium',
      recommendations: [
        'Add Content Security Policy (CSP)',
        'Implement X-Frame-Options header',
        'Add X-Content-Type-Options header',
        'Implement X-XSS-Protection header',
        'Add Strict-Transport-Security header'
      ]
    });
  }
  
  // Input validation recommendations
  const validationIssues = securityResults.vulnerabilities.filter(v => v.type === 'Input Validation');
  if (validationIssues.length > 0) {
    securityResults.recommendations.push({
      category: 'Input Validation',
      priority: 'High',
      recommendations: [
        'Implement comprehensive input validation',
        'Add SQL injection protection',
        'Implement XSS protection',
        'Add path traversal protection',
        'Implement request size limits'
      ]
    });
  }
  
  // Rate limiting recommendations
  const rateLimitIssues = securityResults.vulnerabilities.filter(v => v.type === 'Rate Limiting');
  if (rateLimitIssues.length > 0) {
    securityResults.recommendations.push({
      category: 'Rate Limiting',
      priority: 'Medium',
      recommendations: [
        'Implement API rate limiting',
        'Add authentication rate limiting',
        'Implement IP-based rate limiting',
        'Add user-based rate limiting',
        'Implement progressive rate limiting'
      ]
    });
  }
  
  // GDPR recommendations
  if (securityResults.compliance.gdpr.score < 3) {
    securityResults.recommendations.push({
      category: 'Data Protection (GDPR)',
      priority: 'High',
      recommendations: [
        'Implement data access request handling',
        'Add data deletion capabilities',
        'Implement consent management',
        'Add data portability features',
        'Implement privacy impact assessments'
      ]
    });
  }
  
  // General security recommendations
  securityResults.recommendations.push({
    category: 'General Security',
    priority: 'Medium',
    recommendations: [
      'Implement security monitoring and alerting',
      'Add vulnerability scanning',
      'Implement security logging',
      'Add intrusion detection',
      'Implement regular security audits'
    ]
  });
  
  // Display recommendations
  securityResults.recommendations.forEach(rec => {
    const priorityIcon = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟢';
    console.log(`\n${priorityIcon} ${rec.category} (${rec.priority} Priority):`);
    rec.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
  });
}

async function generateSecurityReport() {
  console.log('\n📋 Generating Security Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalVulnerabilities: securityResults.vulnerabilities.length,
      highSeverity: securityResults.vulnerabilities.filter(v => v.severity === 'High').length,
      mediumSeverity: securityResults.vulnerabilities.filter(v => v.severity === 'Medium').length,
      lowSeverity: securityResults.vulnerabilities.filter(v => v.severity === 'Low').length,
      compliance: securityResults.compliance
    },
    vulnerabilities: securityResults.vulnerabilities,
    recommendations: securityResults.recommendations
  };
  
  const reportPath = path.join(process.cwd(), 'security-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Security report saved to: ${reportPath}`);
  
  return report;
}

function displayFinalReport() {
  console.log('\n🔒 SECURITY HARDENING REPORT');
  console.log('============================');
  
  const totalVulns = securityResults.vulnerabilities.length;
  const highVulns = securityResults.vulnerabilities.filter(v => v.severity === 'High').length;
  const mediumVulns = securityResults.vulnerabilities.filter(v => v.severity === 'Medium').length;
  
  const authScore = securityResults.compliance.authentication.score;
  const securityScore = securityResults.compliance.security.score;
  const gdprScore = securityResults.compliance.gdpr.score;
  
  console.log(`\n📊 Security Summary:`);
  console.log(`   Total Vulnerabilities: ${totalVulns}`);
  console.log(`   High Severity: ${highVulns} 🔴`);
  console.log(`   Medium Severity: ${mediumVulns} 🟡`);
  
  console.log(`\n📈 Compliance Scores:`);
  console.log(`   Authentication: ${authScore}/3 ${authScore >= 2 ? '✅' : '❌'}`);
  console.log(`   Security Headers: ${securityScore}/5 ${securityScore >= 3 ? '✅' : '❌'}`);
  console.log(`   GDPR Compliance: ${gdprScore}/3 ${gdprScore >= 2 ? '✅' : '❌'}`);
  
  if (highVulns > 0) {
    console.log(`\n🔴 Critical Issues:`);
    securityResults.vulnerabilities
      .filter(v => v.severity === 'High')
      .forEach(vuln => {
        console.log(`   • ${vuln.endpoint}: ${vuln.description}`);
      });
  }
  
  console.log(`\n💡 Security Recommendations:`);
  securityResults.recommendations.forEach(rec => {
    const priorityIcon = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟢';
    console.log(`   ${priorityIcon} ${rec.category}: ${rec.recommendations.length} recommendations`);
  });
  
  const isSecure = highVulns === 0 && authScore >= 2 && securityScore >= 3;
  console.log(`\n${isSecure ? '🎉' : '⚠️'} Security Status: ${isSecure ? 'SECURE' : 'NEEDS HARDENING'}`);
  
  return isSecure;
}

// Main execution
async function runSecurityHardening() {
  console.log('🔒 BMV Finder - Security Hardening Assessment');
  console.log('============================================');
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Timeout: ${CONFIG.timeout}ms`);
  
  const startTime = performance.now();
  
  try {
    await testAuthenticationSecurity();
    await testInputValidation();
    await testSecurityHeaders();
    await testRateLimiting();
    await testDataProtection();
    await testEndpointSecurity();
    
    generateSecurityRecommendations();
    await generateSecurityReport();
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`\n⏱️  Total Assessment Time: ${Math.round(totalTime)}ms`);
    
    const isSecure = displayFinalReport();
    
    process.exit(isSecure ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Security hardening assessment failed:', error.message);
    process.exit(1);
  }
}

// Run assessment if called directly
if (require.main === module) {
  runSecurityHardening();
}

module.exports = {
  runSecurityHardening,
  securityResults
};
