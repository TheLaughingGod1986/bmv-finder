// Integration tests for API endpoints

import { testFramework, assert } from '@/lib/testing/testFramework';

testFramework.describe('API Integration Tests', 'Integration tests for API endpoints', {
  setup: async () => {
    // Setup test environment
    console.log('Setting up integration test environment...');
  },
  teardown: async () => {
    // Cleanup test environment
    console.log('Cleaning up integration test environment...');
  }
});

testFramework.it('should test property search API', async () => {
  const searchParams = {
    postcode: 'SW1A 1AA',
    radius: 1,
    limit: 10
  };

  const response = await fetch('http://localhost:3000/api/properties/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(searchParams)
  });

  assert.isTrue(response.ok, 'Property search API should respond successfully');
  
  const data = await response.json();
  assert.isDefined(data, 'Response data should be defined');
  assert.isArray(data.properties, 'Properties should be an array');
});

testFramework.it('should test recent sales API', async () => {
  const response = await fetch('http://localhost:3000/api/recent-sales?postcode=SW1A&limit=5', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(response.ok, 'Recent sales API should respond successfully');
  
  const data = await response.json();
  assert.isDefined(data, 'Response data should be defined');
  assert.isArray(data.sales, 'Sales should be an array');
});

testFramework.it('should test portfolio API', async () => {
  const portfolioData = {
    name: 'Test Portfolio',
    properties: [
      {
        address: '123 Test Street',
        postcode: 'SW1A 1AA',
        purchasePrice: 500000,
        currentValue: 550000
      }
    ]
  };

  const response = await fetch('http://localhost:3000/api/portfolio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(portfolioData)
  });

  assert.isTrue(response.ok, 'Portfolio API should respond successfully');
  
  const data = await response.json();
  assert.isDefined(data, 'Response data should be defined');
  assert.isDefined(data.portfolio, 'Portfolio should be defined');
});

testFramework.it('should test analytics API', async () => {
  const response = await fetch('http://localhost:3000/api/analytics/market?postcode=SW1A&period=12m', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(response.ok, 'Analytics API should respond successfully');
  
  const data = await response.json();
  assert.isDefined(data, 'Response data should be defined');
  assert.isDefined(data.analytics, 'Analytics should be defined');
});

testFramework.it('should test health check API', async () => {
  const response = await fetch('http://localhost:3000/api/health', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(response.ok, 'Health check API should respond successfully');
  
  const data = await response.json();
  assert.isDefined(data, 'Response data should be defined');
  assert.equal(data.status, 'healthy', 'Health status should be healthy');
});

testFramework.it('should test performance dashboard API', async () => {
  const response = await fetch('http://localhost:3000/api/performance/dashboard', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(response.ok, 'Performance dashboard API should respond successfully');
  
  const data = await response.json();
  assert.isDefined(data, 'Response data should be defined');
  assert.isDefined(data.metrics, 'Metrics should be defined');
});

testFramework.it('should test security auth API', async () => {
  const authData = {
    action: 'register',
    email: 'integration@example.com',
    password: 'TestPassword123!'
  };

  const response = await fetch('http://localhost:3000/api/security/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(authData)
  });

  assert.isTrue(response.ok, 'Security auth API should respond successfully');
  
  const data = await response.json();
  assert.isDefined(data, 'Response data should be defined');
  assert.isDefined(data.success, 'Success status should be defined');
});

testFramework.it('should test error handling', async () => {
  const response = await fetch('http://localhost:3000/api/nonexistent', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isFalse(response.ok, 'Nonexistent API should return error');
  assert.equal(response.status, 404, 'Should return 404 status');
});

testFramework.it('should test rate limiting', async () => {
  const requests = Array.from({ length: 10 }, () => 
    fetch('http://localhost:3000/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  );

  const responses = await Promise.all(requests);
  
  // All requests should succeed (rate limit not exceeded)
  responses.forEach((response, index) => {
    assert.isTrue(response.ok, `Request ${index + 1} should succeed`);
  });
});

testFramework.it('should test concurrent API calls', async () => {
  const concurrentRequests = Array.from({ length: 5 }, () => 
    fetch('http://localhost:3000/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  );

  const responses = await Promise.all(concurrentRequests);
  
  // All concurrent requests should succeed
  responses.forEach((response, index) => {
    assert.isTrue(response.ok, `Concurrent request ${index + 1} should succeed`);
  });
});

testFramework.it('should test API response times', async () => {
  const startTime = Date.now();
  
  const response = await fetch('http://localhost:3000/api/health', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const endTime = Date.now();
  const responseTime = endTime - startTime;

  assert.isTrue(response.ok, 'API should respond successfully');
  assert.isLessThan(responseTime, 1000, 'Response time should be less than 1 second');
});

testFramework.it('should test API data validation', async () => {
  const invalidData = {
    postcode: '', // Invalid empty postcode
    radius: -1,   // Invalid negative radius
    limit: 0      // Invalid zero limit
  };

  const response = await fetch('http://localhost:3000/api/properties/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(invalidData)
  });

  // Should return validation error
  assert.isFalse(response.ok, 'API should return error for invalid data');
  assert.isGreaterThanOrEqual(response.status, 400, 'Should return 4xx status for validation error');
});

testFramework.it('should test API authentication', async () => {
  // Test without authentication
  const response = await fetch('http://localhost:3000/api/portfolio', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Should return authentication error
  assert.isFalse(response.ok, 'API should return error without authentication');
  assert.equal(response.status, 401, 'Should return 401 status for authentication error');
});

testFramework.it('should test API content type handling', async () => {
  const response = await fetch('http://localhost:3000/api/health', {
    method: 'GET',
    headers: {
      'Content-Type': 'text/plain' // Wrong content type
    }
  });

  // Should still work for GET requests
  assert.isTrue(response.ok, 'API should handle different content types');
});

testFramework.it('should test API CORS headers', async () => {
  const response = await fetch('http://localhost:3000/api/health', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3001'
    }
  });

  assert.isTrue(response.ok, 'API should respond successfully');
  
  // Check CORS headers
  const corsHeader = response.headers.get('Access-Control-Allow-Origin');
  assert.isDefined(corsHeader, 'CORS header should be present');
});

testFramework.it('should test API error responses', async () => {
  const response = await fetch('http://localhost:3000/api/nonexistent', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isFalse(response.ok, 'API should return error');
  
  const data = await response.json();
  assert.isDefined(data, 'Error response data should be defined');
  assert.isDefined(data.error, 'Error message should be defined');
});

testFramework.it('should test API pagination', async () => {
  const response = await fetch('http://localhost:3000/api/recent-sales?postcode=SW1A&limit=5&offset=0', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(response.ok, 'API should respond successfully');
  
  const data = await response.json();
  assert.isDefined(data, 'Response data should be defined');
  assert.isArray(data.sales, 'Sales should be an array');
  assert.isLessThanOrEqual(data.sales.length, 5, 'Should respect limit parameter');
});

testFramework.it('should test API filtering', async () => {
  const response = await fetch('http://localhost:3000/api/properties/search?postcode=SW1A&propertyType=house&minPrice=100000&maxPrice=1000000', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(response.ok, 'API should respond successfully');
  
  const data = await response.json();
  assert.isDefined(data, 'Response data should be defined');
  assert.isArray(data.properties, 'Properties should be an array');
});

testFramework.it('should test API sorting', async () => {
  const response = await fetch('http://localhost:3000/api/recent-sales?postcode=SW1A&sortBy=price&sortOrder=desc', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(response.ok, 'API should respond successfully');
  
  const data = await response.json();
  assert.isDefined(data, 'Response data should be defined');
  assert.isArray(data.sales, 'Sales should be an array');
});

testFramework.it('should test API caching', async () => {
  const startTime = Date.now();
  
  // First request
  const response1 = await fetch('http://localhost:3000/api/health', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const firstRequestTime = Date.now() - startTime;

  const startTime2 = Date.now();
  
  // Second request (should be cached)
  const response2 = await fetch('http://localhost:3000/api/health', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const secondRequestTime = Date.now() - startTime2;

  assert.isTrue(response1.ok, 'First request should succeed');
  assert.isTrue(response2.ok, 'Second request should succeed');
  
  // Second request should be faster (cached)
  assert.isLessThan(secondRequestTime, firstRequestTime, 'Second request should be faster due to caching');
});

// Run tests
if (require.main === module) {
  testFramework.run().then(() => {
    testFramework.printResults();
  });
}
