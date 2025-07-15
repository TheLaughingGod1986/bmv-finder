# API Migration Guide: Direct Calls → Unified Gateway

This guide provides step-by-step instructions for migrating existing components from direct API calls to the new unified API gateway.

## Overview

The unified API gateway (`/api/gateway`) provides a single entry point for all backend services, with centralized routing, rate limiting, error handling, and authentication support.

## Migration Steps

### 1. Import the API Client

Replace direct `fetch` calls with the unified API client:

```typescript
// Before
import { fetch } from 'node-fetch';

// After
import { apiClient } from '@/lib/apiClient';
```

### 2. Update API Calls

#### Property Search
```typescript
// Before
const response = await fetch('/api/property-es', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ searchTerm, page, pageSize, searchAfter })
});

// After
const response = await apiClient.searchProperties(searchTerm, {
  page,
  pageSize,
  searchAfter
});
```

#### HPI Data
```typescript
// Before
const response = await fetch('/api/hpi/postcode?postcode=${postcode}');

// After
const response = await apiClient.getHpiData(postcode);
```

#### Recent Sales
```typescript
// Before
const response = await fetch('/api/recent-sales?postcode=${postcode}');

// After
const response = await apiClient.getRecentSales(postcode);
```

#### Property Enhancement
```typescript
// Before
const enhanceRes = await fetch('/api/enhance-properties', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ properties: data.data }),
});

// After
const enhanceRes = await apiClient.enhanceProperties(data.data);
```

#### User Management
```typescript
// Before
const response = await fetch('/api/profile-usage?userId=${user.id}');

// After
const response = await apiClient.getUserProfile(user.id);
```

#### Usage Tracking
```typescript
// Before
await fetch('/api/increment-usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: user?.id, type: 'lookup' }),
});

// After
await apiClient.incrementUsage(user.id, 'lookup');
```

### 3. Error Handling

The API client provides consistent error handling:

```typescript
// Before
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}
const data = await response.json();

// After
const response = await apiClient.searchProperties(searchTerm);
if (response.error) {
  throw new Error(response.error);
}
const data = response.data;
```

### 4. Authentication

The API client automatically handles authentication headers:

```typescript
// Before
const response = await fetch('/api/create-customer-portal-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
  },
});

// After
const response = await apiClient.createCustomerPortalSession();
```

## Component Migration Examples

### Main Page (page.tsx)
- Replace `/api/property-es` with `apiClient.searchProperties()`
- Replace `/api/enhance-properties` with `apiClient.enhanceProperties()`
- Replace `/api/last-updated` with `apiClient.getLastUpdated()`

### HPI Dashboard (hpi-dashboard/page.tsx)
- Replace `/api/hpi` with `apiClient.getHpiData()`
- Replace `/api/hpi/date-range` with `apiClient.getHpiDateRange()`
- Replace `/api/profile-usage` with `apiClient.getUserProfile()`
- Replace `/api/increment-usage` with `apiClient.incrementUsage()`

### What Should I Pay (what-should-i-pay/page.tsx)
- Replace `/api/what-should-i-pay` with `apiClient.getWhatShouldIPay()`
- Replace `/api/profile-usage` with `apiClient.getUserProfile()`
- Replace `/api/increment-usage` with `apiClient.incrementUsage()`

### Components
- **HpiPostcodeSearch**: Replace `/api/hpi/postcode` with `apiClient.getHpiData()`
- **HpiDataDisplay**: Replace `/api/hpi/postcode` with `apiClient.getHpiData()`
- **RecentSalesDisplay**: Replace `/api/recent-sales` with `apiClient.getRecentSales()`
- **PropertyModal**: Replace `/api/property-es` with `apiClient.searchProperties()`
- **EnhancedSearch**: Replace `/api/suggest-postcodes` with `apiClient.suggestPostcodes()`
- **PostcodeInput**: Replace `/api/suggest-postcodes` with `apiClient.suggestPostcodes()`
- **EnhancedEmptyState**: Replace `/api/suggest-postcodes` with `apiClient.suggestPostcodes()`
- **DataQualityDashboard**: Replace `/api/monitoring/quality` with `apiClient.getDataQuality()`

## Benefits of Migration

1. **Consistent Error Handling**: All API calls use the same error format
2. **Centralized Rate Limiting**: Automatic rate limiting per service
3. **Authentication**: Automatic token handling
4. **Type Safety**: Full TypeScript support with proper types
5. **Monitoring**: Centralized logging and monitoring
6. **Maintainability**: Single point of configuration for all API calls

## Testing

After migration, test each component to ensure:
- Data is fetched correctly
- Error handling works as expected
- Loading states function properly
- User authentication is maintained

## Rollback Plan

If issues arise, you can quickly rollback by:
1. Reverting the component changes
2. Keeping the gateway and API client in place
3. Gradually re-migrating components as issues are resolved

## Support

For questions or issues during migration, refer to:
- `GATEWAY_TESTING_GUIDE.md` for testing procedures
- `src/lib/apiClient.ts` for API client documentation
- `src/app/api/gateway/route.ts` for gateway configuration 