# Gateway Testing Guide

## Overview

This guide provides comprehensive testing for the unified API gateway that handles all 25 services in your application.

## Quick Test Commands

### Test All Services at Once
```bash
curl -X POST http://localhost:3000/api/gateway/test \
  -H "Content-Type: application/json" \
  -d '{"testAll": true}' | jq
```

### Test Individual Services
```bash
# Test property search
curl -X POST http://localhost:3000/api/gateway/test \
  -H "Content-Type: application/json" \
  -d '{"service": "property-es"}' | jq

# Test HPI data
curl -X POST http://localhost:3000/api/gateway/test \
  -H "Content-Type: application/json" \
  -d '{"service": "hpi-postcode"}' | jq

# Test BMV scoring
curl -X POST http://localhost:3000/api/gateway/test \
  -H "Content-Type: application/json" \
  -d '{"service": "enhanced-bmv-score"}' | jq
```

## Direct Gateway Testing

### Property Services

#### 1. Property Search
```bash
curl -X POST http://localhost:3000/api/gateway \
  -H "Content-Type: application/json" \
  -d '{
    "service": "property-es",
    "action": "search",
    "data": {"searchTerm": "SW11 1DS"}
  }' | jq
```

#### 2. Property CSV Export
```bash
curl "http://localhost:3000/api/gateway?service=property-csv&action=export" | jq
```

#### 3. Property Trends
```bash
curl -X POST http://localhost:3000/api/gateway \
  -H "Content-Type: application/json" \
  -d '{
    "service": "property-trend",
    "action": "analyze",
    "data": {"postcode": "SW11 1DS"}
  }' | jq
```

#### 4. Recent Sales
```bash
curl "http://localhost:3000/api/gateway?service=recent-sales&action=get&postcode=SW11%201DS" | jq
```

#### 5. What Should I Pay
```bash
curl -X POST http://localhost:3000/api/gateway \
  -H "Content-Type: application/json" \
  -d '{
    "service": "what-should-i-pay",
    "action": "calculate",
    "data": {"postcode": "SW11 1DS", "price": 450000}
  }' | jq
```

### HPI Services

#### 6. HPI Data
```bash
curl "http://localhost:3000/api/gateway?service=hpi&action=get&region=London" | jq
```

#### 7. HPI by Postcode
```bash
curl "http://localhost:3000/api/gateway?service=hpi-postcode&action=get&postcode=SW11%201DS" | jq
```

#### 8. HPI Date Range
```bash
curl "http://localhost:3000/api/gateway?service=hpi-date-range&action=get" | jq
```

### BMV Scoring Services

#### 9. Enhanced BMV Score
```bash
curl -X POST http://localhost:3000/api/gateway \
  -H "Content-Type: application/json" \
  -d '{
    "service": "enhanced-bmv-score",
    "action": "calculate",
    "data": {
      "postcode": "SW11 1DS",
      "propertyData": {
        "price": 450000,
        "propertyType": "T",
        "dateOfTransfer": "2024-01-15"
      }
    }
  }' | jq
```

#### 10. Postcode Suggestions
```bash
curl "http://localhost:3000/api/gateway?service=suggest-postcodes&action=suggest&q=SW1" | jq
```

### User Management Services

#### 11. Profile Usage
```bash
curl "http://localhost:3000/api/gateway?service=profile-usage&action=get&userId=test-user-123" | jq
```

#### 12. Increment Usage
```bash
curl -X POST http://localhost:3000/api/gateway \
  -H "Content-Type: application/json" \
  -d '{
    "service": "increment-usage",
    "action": "increment",
    "data": {"userId": "test-user-123", "type": "search"}
  }' | jq
```

### Analytics Services

#### 13. Summary
```bash
curl "http://localhost:3000/api/gateway?service=summary&action=get" | jq
```

#### 14. Last Updated
```bash
curl "http://localhost:3000/api/gateway?service=last-updated&action=get" | jq
```

## Frontend API Client Testing

### Using the API Client

```typescript
import { apiClient } from '@/lib/apiClient';

// Test property search
const searchResult = await apiClient.searchProperties('SW11 1DS');
console.log('Search Result:', searchResult);

// Test HPI data
const hpiResult = await apiClient.getHpiByPostcode('SW11 1DS');
console.log('HPI Result:', hpiResult);

// Test BMV scoring
const bmvResult = await apiClient.getEnhancedBmvScore('SW11 1DS', {
  price: 450000,
  propertyType: 'T',
  dateOfTransfer: '2024-01-15'
});
console.log('BMV Result:', bmvResult);

// Test postcode suggestions
const suggestions = await apiClient.getPostcodeSuggestions('SW1');
console.log('Suggestions:', suggestions);
```

## Rate Limiting Tests

### Test Rate Limits
```bash
# Test property search rate limiting (200 requests per minute)
for i in {1..210}; do
  curl -X POST http://localhost:3000/api/gateway \
    -H "Content-Type: application/json" \
    -d '{
      "service": "property-es",
      "action": "search",
      "data": {"searchTerm": "SW11 1DS"}
    }' | jq '.error // "Success"'
  echo "Request $i"
done
```

### Test Different User Rate Limits
```bash
# Test with different user IDs
curl -X POST http://localhost:3000/api/gateway \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-1" \
  -d '{
    "service": "property-es",
    "action": "search",
    "data": {"searchTerm": "SW11 1DS"}
  }' | jq

curl -X POST http://localhost:3000/api/gateway \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-2" \
  -d '{
    "service": "property-es",
    "action": "search",
    "data": {"searchTerm": "SW11 1DS"}
  }' | jq
```

## Error Handling Tests

### Test Invalid Service
```bash
curl -X POST http://localhost:3000/api/gateway \
  -H "Content-Type: application/json" \
  -d '{
    "service": "invalid-service",
    "action": "test",
    "data": {}
  }' | jq
```

### Test Missing Parameters
```bash
curl -X POST http://localhost:3000/api/gateway \
  -H "Content-Type: application/json" \
  -d '{
    "service": "property-es"
  }' | jq
```

### Test Invalid Data
```bash
curl -X POST http://localhost:3000/api/gateway \
  -H "Content-Type: application/json" \
  -d '{
    "service": "enhanced-bmv-score",
    "action": "calculate",
    "data": {
      "postcode": "INVALID",
      "propertyData": {}
    }
  }' | jq
```

## Performance Testing

### Load Test
```bash
# Test with Apache Bench (if available)
ab -n 1000 -c 10 -p test-data.json -T application/json http://localhost:3000/api/gateway

# Test data file (test-data.json):
{
  "service": "property-es",
  "action": "search",
  "data": {"searchTerm": "SW11 1DS"}
}
```

### Concurrent Requests
```bash
# Test multiple concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/gateway \
    -H "Content-Type: application/json" \
    -d '{
      "service": "property-es",
      "action": "search",
      "data": {"searchTerm": "SW11 1DS"}
    }' &
done
wait
```

## Monitoring and Debugging

### Enable Debug Logging
Add to your `.env.local`:
```bash
GATEWAY_DEBUG=true
```

### Check Gateway Logs
```bash
# Monitor gateway requests
tail -f logs/gateway.log

# Check for errors
grep "ERROR" logs/gateway.log
```

### Health Check
```bash
# Test gateway health
curl "http://localhost:3000/api/gateway?service=last-updated&action=get" | jq '.source'
```

## Expected Results

### Successful Response Format
```json
{
  "data": {
    // Service-specific data
  },
  "status": 200
}
```

### Error Response Format
```json
{
  "error": "Error message",
  "status": 400,
  "service": "service-name"
}
```

### Rate Limit Response
```json
{
  "error": "Rate limit exceeded",
  "status": 429
}
```

## Troubleshooting

### Common Issues

1. **Service Not Found**
   - Check service name spelling
   - Verify service is configured in gateway

2. **Rate Limiting**
   - Wait for rate limit window to reset
   - Check rate limit configuration

3. **Network Errors**
   - Verify service URLs are correct
   - Check if services are running

4. **Authentication Errors**
   - Verify service tokens in environment
   - Check authorization headers

### Debug Steps

1. **Check Gateway Configuration**
   ```bash
   curl "http://localhost:3000/api/gateway/test?service=property-es" | jq
   ```

2. **Test Direct Service**
   ```bash
   curl "http://localhost:3000/api/property-es" -X POST \
     -H "Content-Type: application/json" \
     -d '{"searchTerm": "SW11 1DS"}' | jq
   ```

3. **Check Environment Variables**
   ```bash
   echo $PROPERTY_SERVICE_URL
   echo $HPI_SERVICE_URL
   echo $BMV_SERVICE_URL
   ```

## Next Steps

1. **Run all tests** to verify gateway functionality
2. **Monitor performance** under load
3. **Update frontend components** to use API client
4. **Set up monitoring** for production
5. **Configure rate limits** based on usage patterns

This testing guide ensures your gateway is working correctly with all 25 services before migrating your frontend components. 