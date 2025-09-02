# BMV Finder API Documentation

## Overview

The BMV Finder API provides comprehensive property search, analysis, and portfolio management capabilities. This RESTful API is built with Next.js and provides real-time property data, market analytics, and investment insights.

## Base URL

```
Production: https://bmvfinder.com/api
Development: http://localhost:3000/api
```

## Authentication

The API uses JWT-based authentication with role-based access control.

### Authentication Flow

1. **Register** a new user account
2. **Login** to receive access and refresh tokens
3. **Use access token** in Authorization header for protected endpoints
4. **Refresh token** when access token expires

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Rate Limiting

- **General API**: 100 requests per minute
- **Authentication**: 10 requests per minute
- **Search endpoints**: 50 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "details": {
    "field": "Additional error details"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Endpoints

### Authentication

#### Register User
```http
POST /api/security/auth
```

**Request Body:**
```json
{
  "action": "register",
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "user",
    "isEmailVerified": false
  }
}
```

#### Login User
```http
POST /api/security/auth
```

**Request Body:**
```json
{
  "action": "login",
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "user",
    "permissions": ["read_properties", "read_portfolio"]
  },
  "session": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_123",
    "expiresAt": "2024-01-02T00:00:00.000Z"
  }
}
```

#### Validate Session
```http
GET /api/security/auth?action=validate
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "user",
    "permissions": ["read_properties", "read_portfolio"]
  },
  "session": {
    "id": "session_123",
    "expiresAt": "2024-01-02T00:00:00.000Z"
  }
}
```

#### Logout User
```http
POST /api/security/auth
```

**Request Body:**
```json
{
  "action": "logout",
  "token": "access_token_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Property Search

#### Search Properties
```http
POST /api/properties/search
```

**Request Body:**
```json
{
  "postcode": "SW1A 1AA",
  "radius": 1,
  "limit": 20,
  "filters": {
    "minPrice": 100000,
    "maxPrice": 1000000,
    "propertyType": "house",
    "bedrooms": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "properties": [
    {
      "id": "prop_123",
      "address": "123 Example Street",
      "postcode": "SW1A 1AA",
      "price": 750000,
      "bedrooms": 3,
      "bathrooms": 2,
      "propertyType": "house",
      "bmvScore": 85,
      "coordinates": {
        "lat": 51.5074,
        "lng": -0.1278
      },
      "images": ["image1.jpg", "image2.jpg"],
      "description": "Beautiful family home...",
      "features": ["garden", "parking", "garage"]
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "hasNext": true
  }
}
```

#### Get Property Details
```http
GET /api/properties/{propertyId}
```

**Response:**
```json
{
  "success": true,
  "property": {
    "id": "prop_123",
    "address": "123 Example Street",
    "postcode": "SW1A 1AA",
    "price": 750000,
    "bedrooms": 3,
    "bathrooms": 2,
    "propertyType": "house",
    "bmvScore": 85,
    "coordinates": {
      "lat": 51.5074,
      "lng": -0.1278
    },
    "images": ["image1.jpg", "image2.jpg"],
    "description": "Beautiful family home...",
    "features": ["garden", "parking", "garage"],
    "epc": {
      "rating": "C",
      "score": 72
    },
    "schools": [
      {
        "name": "Example Primary School",
        "rating": "Outstanding",
        "distance": 0.5
      }
    ],
    "transport": [
      {
        "type": "tube",
        "name": "Westminster",
        "distance": 0.3
      }
    ]
  }
}
```

### Recent Sales

#### Get Recent Sales
```http
GET /api/recent-sales
```

**Query Parameters:**
- `postcode` (required): Postcode to search
- `limit` (optional): Number of results (default: 10, max: 100)
- `offset` (optional): Number of results to skip (default: 0)
- `sortBy` (optional): Sort field (price, date, propertyType)
- `sortOrder` (optional): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "sales": [
    {
      "id": "sale_123",
      "address": "123 Example Street",
      "postcode": "SW1A 1AA",
      "price": 750000,
      "dateOfTransfer": "2024-01-15",
      "propertyType": "house",
      "newBuild": false,
      "estateType": "freehold"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "hasNext": true
  }
}
```

### Portfolio Management

#### Create Portfolio
```http
POST /api/portfolio
```

**Request Body:**
```json
{
  "name": "My Investment Portfolio",
  "description": "Long-term property investments",
  "properties": [
    {
      "address": "123 Example Street",
      "postcode": "SW1A 1AA",
      "purchasePrice": 500000,
      "currentValue": 550000,
      "purchaseDate": "2023-01-01"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "portfolio": {
    "id": "portfolio_123",
    "name": "My Investment Portfolio",
    "description": "Long-term property investments",
    "properties": [
      {
        "id": "prop_123",
        "address": "123 Example Street",
        "postcode": "SW1A 1AA",
        "purchasePrice": 500000,
        "currentValue": 550000,
        "purchaseDate": "2023-01-01",
        "profit": 50000,
        "profitPercentage": 10
      }
    ],
    "totalValue": 550000,
    "totalProfit": 50000,
    "totalProfitPercentage": 10,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Portfolio
```http
GET /api/portfolio/{portfolioId}
```

**Response:**
```json
{
  "success": true,
  "portfolio": {
    "id": "portfolio_123",
    "name": "My Investment Portfolio",
    "description": "Long-term property investments",
    "properties": [
      {
        "id": "prop_123",
        "address": "123 Example Street",
        "postcode": "SW1A 1AA",
        "purchasePrice": 500000,
        "currentValue": 550000,
        "purchaseDate": "2023-01-01",
        "profit": 50000,
        "profitPercentage": 10
      }
    ],
    "totalValue": 550000,
    "totalProfit": 50000,
    "totalProfitPercentage": 10,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Portfolio
```http
PUT /api/portfolio/{portfolioId}
```

**Request Body:**
```json
{
  "name": "Updated Portfolio Name",
  "description": "Updated description",
  "properties": [
    {
      "id": "prop_123",
      "address": "123 Example Street",
      "postcode": "SW1A 1AA",
      "purchasePrice": 500000,
      "currentValue": 600000,
      "purchaseDate": "2023-01-01"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "portfolio": {
    "id": "portfolio_123",
    "name": "Updated Portfolio Name",
    "description": "Updated description",
    "properties": [
      {
        "id": "prop_123",
        "address": "123 Example Street",
        "postcode": "SW1A 1AA",
        "purchasePrice": 500000,
        "currentValue": 600000,
        "purchaseDate": "2023-01-01",
        "profit": 100000,
        "profitPercentage": 20
      }
    ],
    "totalValue": 600000,
    "totalProfit": 100000,
    "totalProfitPercentage": 20,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Portfolio Performance
```http
GET /api/portfolio/{portfolioId}/performance
```

**Response:**
```json
{
  "success": true,
  "performance": {
    "totalValue": 600000,
    "totalProfit": 100000,
    "totalProfitPercentage": 20,
    "monthlyPerformance": [
      {
        "month": "2024-01",
        "value": 550000,
        "profit": 50000,
        "profitPercentage": 10
      },
      {
        "month": "2024-02",
        "value": 600000,
        "profit": 100000,
        "profitPercentage": 20
      }
    ],
    "bestPerformer": {
      "id": "prop_123",
      "address": "123 Example Street",
      "profitPercentage": 25
    },
    "worstPerformer": {
      "id": "prop_456",
      "address": "456 Another Street",
      "profitPercentage": 5
    }
  }
}
```

### Analytics

#### Get Market Analytics
```http
GET /api/analytics/market
```

**Query Parameters:**
- `postcode` (required): Postcode to analyze
- `period` (optional): Analysis period (1m, 3m, 6m, 12m, 24m)

**Response:**
```json
{
  "success": true,
  "analytics": {
    "postcode": "SW1A",
    "period": "12m",
    "averagePrice": 750000,
    "priceChange": 5.2,
    "priceChangePercentage": 5.2,
    "transactionVolume": 150,
    "volumeChange": 10,
    "volumeChangePercentage": 7.1,
    "daysOnMarket": 45,
    "daysOnMarketChange": -5,
    "daysOnMarketChangePercentage": -10,
    "pricePerSqft": 850,
    "pricePerSqftChange": 25,
    "pricePerSqftChangePercentage": 3.0,
    "trends": {
      "price": "increasing",
      "volume": "stable",
      "market": "active"
    },
    "insights": [
      "Property prices have increased by 5.2% over the last 12 months",
      "Transaction volume is stable with 150 sales",
      "Market is considered active with good liquidity"
    ]
  }
}
```

#### Get Price Trends
```http
GET /api/analytics/trends
```

**Query Parameters:**
- `postcode` (required): Postcode to analyze
- `period` (optional): Analysis period (1m, 3m, 6m, 12m, 24m)

**Response:**
```json
{
  "success": true,
  "trends": {
    "postcode": "SW1A",
    "period": "12m",
    "data": [
      {
        "date": "2024-01-01",
        "averagePrice": 720000,
        "transactionCount": 12,
        "pricePerSqft": 820
      },
      {
        "date": "2024-02-01",
        "averagePrice": 730000,
        "transactionCount": 15,
        "pricePerSqft": 830
      }
    ],
    "forecast": [
      {
        "date": "2024-03-01",
        "predictedPrice": 740000,
        "confidence": 0.85
      }
    ]
  }
}
```

### Watchlist

#### Add to Watchlist
```http
POST /api/watchlist
```

**Request Body:**
```json
{
  "propertyId": "prop_123",
  "address": "123 Example Street",
  "postcode": "SW1A 1AA",
  "targetPrice": 500000,
  "notes": "Potential investment opportunity"
}
```

**Response:**
```json
{
  "success": true,
  "watchlistItem": {
    "id": "watch_123",
    "propertyId": "prop_123",
    "address": "123 Example Street",
    "postcode": "SW1A 1AA",
    "targetPrice": 500000,
    "currentPrice": 550000,
    "notes": "Potential investment opportunity",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Watchlist
```http
GET /api/watchlist
```

**Response:**
```json
{
  "success": true,
  "watchlist": [
    {
      "id": "watch_123",
      "propertyId": "prop_123",
      "address": "123 Example Street",
      "postcode": "SW1A 1AA",
      "targetPrice": 500000,
      "currentPrice": 550000,
      "notes": "Potential investment opportunity",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Update Watchlist Item
```http
PUT /api/watchlist/{watchlistId}
```

**Request Body:**
```json
{
  "targetPrice": 450000,
  "notes": "Updated target price"
}
```

**Response:**
```json
{
  "success": true,
  "watchlistItem": {
    "id": "watch_123",
    "propertyId": "prop_123",
    "address": "123 Example Street",
    "postcode": "SW1A 1AA",
    "targetPrice": 450000,
    "currentPrice": 550000,
    "notes": "Updated target price",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Remove from Watchlist
```http
DELETE /api/watchlist/{watchlistId}
```

**Response:**
```json
{
  "success": true,
  "message": "Property removed from watchlist"
}
```

### Notifications

#### Create Notification Preference
```http
POST /api/notifications/preferences
```

**Request Body:**
```json
{
  "type": "price_alert",
  "enabled": true,
  "conditions": {
    "postcode": "SW1A",
    "priceChange": 5
  },
  "channels": ["email", "push"]
}
```

**Response:**
```json
{
  "success": true,
  "preference": {
    "id": "pref_123",
    "type": "price_alert",
    "enabled": true,
    "conditions": {
      "postcode": "SW1A",
      "priceChange": 5
    },
    "channels": ["email", "push"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Notification Preferences
```http
GET /api/notifications/preferences
```

**Response:**
```json
{
  "success": true,
  "preferences": [
    {
      "id": "pref_123",
      "type": "price_alert",
      "enabled": true,
      "conditions": {
        "postcode": "SW1A",
        "priceChange": 5
      },
      "channels": ["email", "push"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Reports

#### Generate Property Report
```http
POST /api/reports/property
```

**Request Body:**
```json
{
  "propertyId": "prop_123",
  "format": "pdf",
  "includeAnalytics": true,
  "includeComparables": true,
  "includeForecast": true
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "report_123",
    "type": "property",
    "format": "pdf",
    "status": "generating",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "estimatedCompletion": "2024-01-01T00:05:00.000Z"
  }
}
```

#### Get Report Status
```http
GET /api/reports/{reportId}/status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "id": "report_123",
    "status": "completed",
    "progress": 100,
    "downloadUrl": "https://bmvfinder.com/api/reports/report_123/download",
    "expiresAt": "2024-01-08T00:00:00.000Z"
  }
}
```

#### Download Report
```http
GET /api/reports/{reportId}/download
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://bmvfinder.com/api/reports/report_123/download",
  "expiresAt": "2024-01-08T00:00:00.000Z"
}
```

### System Health

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 86400,
  "services": {
    "database": "healthy",
    "elasticsearch": "healthy",
    "redis": "healthy",
    "external_apis": "healthy"
  },
  "metrics": {
    "responseTime": 45,
    "memoryUsage": 65.2,
    "cpuUsage": 23.1,
    "activeConnections": 150
  }
}
```

#### Performance Dashboard
```http
GET /api/performance/dashboard
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "api": {
      "responseTime": 45,
      "throughput": 150,
      "errorRate": 0.5,
      "uptime": 99.9
    },
    "database": {
      "connectionPool": 80,
      "queryTime": 25,
      "slowQueries": 2
    },
    "cache": {
      "hitRate": 85.5,
      "missRate": 14.5,
      "evictions": 10
    },
    "system": {
      "memoryUsage": 65.2,
      "cpuUsage": 23.1,
      "diskUsage": 45.8
    }
  },
  "alerts": [
    {
      "id": "alert_123",
      "type": "performance",
      "severity": "warning",
      "message": "High memory usage detected",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @bmvfinder/api-client
```

```typescript
import { BMVFinderAPI } from '@bmvfinder/api-client';

const api = new BMVFinderAPI({
  baseURL: 'https://bmvfinder.com/api',
  apiKey: 'your-api-key'
});

// Search properties
const properties = await api.properties.search({
  postcode: 'SW1A 1AA',
  radius: 1,
  limit: 20
});

// Get portfolio
const portfolio = await api.portfolio.get('portfolio_123');
```

### Python

```bash
pip install bmvfinder-api
```

```python
from bmvfinder import BMVFinderAPI

api = BMVFinderAPI(
    base_url='https://bmvfinder.com/api',
    api_key='your-api-key'
)

# Search properties
properties = api.properties.search(
    postcode='SW1A 1AA',
    radius=1,
    limit=20
)

# Get portfolio
portfolio = api.portfolio.get('portfolio_123')
```

## Webhooks

### Webhook Configuration

```http
POST /api/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/bmvfinder",
  "events": ["property.price_change", "portfolio.update"],
  "secret": "your-webhook-secret"
}
```

**Response:**
```json
{
  "success": true,
  "webhook": {
    "id": "webhook_123",
    "url": "https://your-app.com/webhooks/bmvfinder",
    "events": ["property.price_change", "portfolio.update"],
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Webhook Payload

```json
{
  "id": "event_123",
  "type": "property.price_change",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "propertyId": "prop_123",
    "oldPrice": 500000,
    "newPrice": 550000,
    "changePercentage": 10
  }
}
```

## Support

For API support and questions:

- **Email**: api-support@bmvfinder.com
- **Documentation**: https://docs.bmvfinder.com
- **Status Page**: https://status.bmvfinder.com
- **GitHub**: https://github.com/bmvfinder/api

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- Property search and analytics
- Portfolio management
- User authentication
- Real-time notifications
