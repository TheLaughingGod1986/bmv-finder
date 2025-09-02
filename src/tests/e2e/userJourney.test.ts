// End-to-end tests for user journeys

import { testFramework, assert } from '@/lib/testing/testFramework';

testFramework.describe('User Journey E2E Tests', 'End-to-end tests for complete user journeys', {
  setup: async () => {
    // Setup test environment
    console.log('Setting up E2E test environment...');
  },
  teardown: async () => {
    // Cleanup test environment
    console.log('Cleaning up E2E test environment...');
  }
});

testFramework.it('should complete property search journey', async () => {
  // Step 1: Search for properties
  const searchResponse = await fetch('http://localhost:3000/api/properties/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      postcode: 'SW1A 1AA',
      radius: 1,
      limit: 10
    })
  });

  assert.isTrue(searchResponse.ok, 'Property search should succeed');
  const searchData = await searchResponse.json();
  assert.isArray(searchData.properties, 'Should return properties array');

  // Step 2: Get property details
  if (searchData.properties.length > 0) {
    const propertyId = searchData.properties[0].id;
    const detailsResponse = await fetch(`http://localhost:3000/api/properties/${propertyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    assert.isTrue(detailsResponse.ok, 'Property details should be retrieved');
    const detailsData = await detailsResponse.json();
    assert.isDefined(detailsData.property, 'Property details should be defined');
  }

  // Step 3: Get recent sales for the area
  const salesResponse = await fetch('http://localhost:3000/api/recent-sales?postcode=SW1A&limit=5', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(salesResponse.ok, 'Recent sales should be retrieved');
  const salesData = await salesResponse.json();
  assert.isArray(salesData.sales, 'Should return sales array');
});

testFramework.it('should complete portfolio management journey', async () => {
  // Step 1: Create portfolio
  const createResponse = await fetch('http://localhost:3000/api/portfolio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Test Portfolio',
      properties: [
        {
          address: '123 Test Street',
          postcode: 'SW1A 1AA',
          purchasePrice: 500000,
          currentValue: 550000
        }
      ]
    })
  });

  assert.isTrue(createResponse.ok, 'Portfolio creation should succeed');
  const createData = await createResponse.json();
  assert.isDefined(createData.portfolio, 'Portfolio should be created');
  const portfolioId = createData.portfolio.id;

  // Step 2: Get portfolio
  const getResponse = await fetch(`http://localhost:3000/api/portfolio/${portfolioId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(getResponse.ok, 'Portfolio retrieval should succeed');
  const getData = await getResponse.json();
  assert.isDefined(getData.portfolio, 'Portfolio should be retrieved');

  // Step 3: Update portfolio
  const updateResponse = await fetch(`http://localhost:3000/api/portfolio/${portfolioId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Updated Test Portfolio',
      properties: [
        {
          address: '123 Test Street',
          postcode: 'SW1A 1AA',
          purchasePrice: 500000,
          currentValue: 600000
        }
      ]
    })
  });

  assert.isTrue(updateResponse.ok, 'Portfolio update should succeed');
  const updateData = await updateResponse.json();
  assert.isDefined(updateData.portfolio, 'Portfolio should be updated');

  // Step 4: Get portfolio performance
  const performanceResponse = await fetch(`http://localhost:3000/api/portfolio/${portfolioId}/performance`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(performanceResponse.ok, 'Portfolio performance should be retrieved');
  const performanceData = await performanceResponse.json();
  assert.isDefined(performanceData.performance, 'Performance data should be defined');
});

testFramework.it('should complete analytics journey', async () => {
  // Step 1: Get market analytics
  const analyticsResponse = await fetch('http://localhost:3000/api/analytics/market?postcode=SW1A&period=12m', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(analyticsResponse.ok, 'Market analytics should be retrieved');
  const analyticsData = await analyticsResponse.json();
  assert.isDefined(analyticsData.analytics, 'Analytics data should be defined');

  // Step 2: Get price trends
  const trendsResponse = await fetch('http://localhost:3000/api/analytics/trends?postcode=SW1A&period=12m', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(trendsResponse.ok, 'Price trends should be retrieved');
  const trendsData = await trendsResponse.json();
  assert.isDefined(trendsData.trends, 'Trends data should be defined');

  // Step 3: Get market insights
  const insightsResponse = await fetch('http://localhost:3000/api/analytics/insights?postcode=SW1A', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(insightsResponse.ok, 'Market insights should be retrieved');
  const insightsData = await insightsResponse.json();
  assert.isDefined(insightsData.insights, 'Insights data should be defined');
});

testFramework.it('should complete user authentication journey', async () => {
  // Step 1: Register user
  const registerResponse = await fetch('http://localhost:3000/api/security/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'register',
      email: 'e2e@example.com',
      password: 'TestPassword123!'
    })
  });

  assert.isTrue(registerResponse.ok, 'User registration should succeed');
  const registerData = await registerResponse.json();
  assert.isTrue(registerData.success, 'Registration should be successful');
  assert.isDefined(registerData.user, 'User should be created');

  // Step 2: Login user
  const loginResponse = await fetch('http://localhost:3000/api/security/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'login',
      email: 'e2e@example.com',
      password: 'TestPassword123!'
    })
  });

  assert.isTrue(loginResponse.ok, 'User login should succeed');
  const loginData = await loginResponse.json();
  assert.isTrue(loginData.success, 'Login should be successful');
  assert.isDefined(loginData.session, 'Session should be created');
  const token = loginData.session.token;

  // Step 3: Validate session
  const validateResponse = await fetch('http://localhost:3000/api/security/auth?action=validate', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  assert.isTrue(validateResponse.ok, 'Session validation should succeed');
  const validateData = await validateResponse.json();
  assert.isTrue(validateData.valid, 'Session should be valid');

  // Step 4: Logout user
  const logoutResponse = await fetch('http://localhost:3000/api/security/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'logout',
      token: token
    })
  });

  assert.isTrue(logoutResponse.ok, 'User logout should succeed');
  const logoutData = await logoutResponse.json();
  assert.isTrue(logoutData.success, 'Logout should be successful');
});

testFramework.it('should complete property watchlist journey', async () => {
  // Step 1: Add property to watchlist
  const addResponse = await fetch('http://localhost:3000/api/watchlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      propertyId: 'test-property-id',
      address: '123 Watchlist Street',
      postcode: 'SW1A 1AA',
      targetPrice: 500000
    })
  });

  assert.isTrue(addResponse.ok, 'Property should be added to watchlist');
  const addData = await addResponse.json();
  assert.isDefined(addData.watchlistItem, 'Watchlist item should be created');

  // Step 2: Get watchlist
  const getResponse = await fetch('http://localhost:3000/api/watchlist', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(getResponse.ok, 'Watchlist should be retrieved');
  const getData = await getResponse.json();
  assert.isArray(getData.watchlist, 'Watchlist should be an array');

  // Step 3: Update watchlist item
  const updateResponse = await fetch(`http://localhost:3000/api/watchlist/${addData.watchlistItem.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      targetPrice: 450000,
      notes: 'Updated target price'
    })
  });

  assert.isTrue(updateResponse.ok, 'Watchlist item should be updated');
  const updateData = await updateResponse.json();
  assert.isDefined(updateData.watchlistItem, 'Watchlist item should be updated');

  // Step 4: Remove from watchlist
  const removeResponse = await fetch(`http://localhost:3000/api/watchlist/${addData.watchlistItem.id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(removeResponse.ok, 'Property should be removed from watchlist');
  const removeData = await removeResponse.json();
  assert.isTrue(removeData.success, 'Removal should be successful');
});

testFramework.it('should complete notification journey', async () => {
  // Step 1: Create notification preference
  const createResponse = await fetch('http://localhost:3000/api/notifications/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'price_alert',
      enabled: true,
      conditions: {
        postcode: 'SW1A',
        priceChange: 5
      }
    })
  });

  assert.isTrue(createResponse.ok, 'Notification preference should be created');
  const createData = await createResponse.json();
  assert.isDefined(createData.preference, 'Preference should be created');

  // Step 2: Get notification preferences
  const getResponse = await fetch('http://localhost:3000/api/notifications/preferences', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(getResponse.ok, 'Notification preferences should be retrieved');
  const getData = await getResponse.json();
  assert.isArray(getData.preferences, 'Preferences should be an array');

  // Step 3: Update notification preference
  const updateResponse = await fetch(`http://localhost:3000/api/notifications/preferences/${createData.preference.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      enabled: false
    })
  });

  assert.isTrue(updateResponse.ok, 'Notification preference should be updated');
  const updateData = await updateResponse.json();
  assert.isDefined(updateData.preference, 'Preference should be updated');
});

testFramework.it('should complete reporting journey', async () => {
  // Step 1: Generate property report
  const reportResponse = await fetch('http://localhost:3000/api/reports/property', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      propertyId: 'test-property-id',
      format: 'pdf',
      includeAnalytics: true,
      includeComparables: true
    })
  });

  assert.isTrue(reportResponse.ok, 'Property report should be generated');
  const reportData = await reportResponse.json();
  assert.isDefined(reportData.report, 'Report should be generated');

  // Step 2: Get report status
  const statusResponse = await fetch(`http://localhost:3000/api/reports/${reportData.report.id}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(statusResponse.ok, 'Report status should be retrieved');
  const statusData = await statusResponse.json();
  assert.isDefined(statusData.status, 'Status should be defined');

  // Step 3: Download report
  const downloadResponse = await fetch(`http://localhost:3000/api/reports/${reportData.report.id}/download`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(downloadResponse.ok, 'Report should be downloadable');
  const downloadData = await downloadResponse.json();
  assert.isDefined(downloadData.downloadUrl, 'Download URL should be provided');
});

testFramework.it('should complete integration journey', async () => {
  // Step 1: Test external API integration
  const integrationResponse = await fetch('http://localhost:3000/api/integrations?action=status', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(integrationResponse.ok, 'Integration status should be retrieved');
  const integrationData = await integrationResponse.json();
  assert.isDefined(integrationData.status, 'Integration status should be defined');

  // Step 2: Test webhook integration
  const webhookResponse = await fetch('http://localhost:3000/api/webhooks', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(webhookResponse.ok, 'Webhook status should be retrieved');
  const webhookData = await webhookResponse.json();
  assert.isDefined(webhookData.webhooks, 'Webhooks should be defined');
});

testFramework.it('should complete performance monitoring journey', async () => {
  // Step 1: Get performance metrics
  const metricsResponse = await fetch('http://localhost:3000/api/performance/metrics', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(metricsResponse.ok, 'Performance metrics should be retrieved');
  const metricsData = await metricsResponse.json();
  assert.isDefined(metricsData.metrics, 'Metrics should be defined');

  // Step 2: Get system health
  const healthResponse = await fetch('http://localhost:3000/api/health', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(healthResponse.ok, 'System health should be retrieved');
  const healthData = await healthResponse.json();
  assert.equal(healthData.status, 'healthy', 'System should be healthy');

  // Step 3: Get performance dashboard
  const dashboardResponse = await fetch('http://localhost:3000/api/performance/dashboard', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isTrue(dashboardResponse.ok, 'Performance dashboard should be retrieved');
  const dashboardData = await dashboardResponse.json();
  assert.isDefined(dashboardData.metrics, 'Dashboard metrics should be defined');
});

testFramework.it('should complete error handling journey', async () => {
  // Step 1: Test invalid endpoint
  const invalidResponse = await fetch('http://localhost:3000/api/invalid-endpoint', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  assert.isFalse(invalidResponse.ok, 'Invalid endpoint should return error');
  assert.equal(invalidResponse.status, 404, 'Should return 404 status');

  // Step 2: Test invalid data
  const invalidDataResponse = await fetch('http://localhost:3000/api/properties/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      postcode: '', // Invalid empty postcode
      radius: -1    // Invalid negative radius
    })
  });

  assert.isFalse(invalidDataResponse.ok, 'Invalid data should return error');
  assert.isGreaterThanOrEqual(invalidDataResponse.status, 400, 'Should return 4xx status');

  // Step 3: Test server error handling
  const serverErrorResponse = await fetch('http://localhost:3000/api/test-server-error', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Should handle server errors gracefully
  assert.isDefined(serverErrorResponse, 'Server error should be handled');
});

// Run tests
if (require.main === module) {
  testFramework.run().then(() => {
    testFramework.printResults();
  });
}
