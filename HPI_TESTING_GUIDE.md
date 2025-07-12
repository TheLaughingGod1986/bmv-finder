# HPI System Testing Guide

## Overview
This guide provides comprehensive testing instructions for the enhanced HPI (House Price Index) system, covering all the Priority 1 items from your TODO list.

## Prerequisites
- Node.js installed
- Elasticsearch connection configured
- Environment variables set up (`.env` file)
- Dependencies installed (`yargs` and `axios` are already included)

## Quick Start

### 1. Run All Tests
```bash
npm run test-hpi
```

### 2. Run Specific Test Modes
```bash
# Test upload mode only
npm run test-hpi-upload

# Test search mode only
npm run test-hpi-search

# Test API disabled mode
npm run test-hpi-api

# Test error handling
npm run test-hpi-errors
```

### 3. Run with Custom Options
```bash
# Test with specific postcode
npm run test-hpi -- --postcode "M1 1AA"

# Run with verbose logging
npm run test-hpi -- --verbose

# Test specific mode with custom postcode
npm run test-hpi -- --mode search --postcode "B1 1AA" --verbose
```

## Test Modes Explained

### 1. Upload Mode Test
**Purpose**: Tests the upload functionality for missing records only.

**What it tests**:
- Elasticsearch connection
- Index existence and creation
- Manual file upload process
- Data parsing and validation
- Growth rate calculations
- Bulk upload to Elasticsearch

**Requirements**:
- Manual download of `hpione.zip` from ONS website
- File placed in `temp/hpione.zip`

**Steps to prepare**:
1. Visit: https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/housepriceindexfornewpropertiesandexistingdwellingshpione
2. Download the latest ZIP file
3. Rename to `hpione.zip`
4. Place in `temp/` directory
5. Run: `npm run test-hpi-upload`

### 2. Search Mode Test
**Purpose**: Tests postcode search functionality and HPI data retrieval.

**What it tests**:
- Postcode to region mapping
- Elasticsearch search queries
- HPI data retrieval
- Growth rate calculations
- Data formatting and display

**Default postcode**: `SW1A 1AA` (Westminster, London)

**Supported postcodes for testing**:
- `SW1A 1AA` → London
- `M1 1AA` → North West
- `B1 1AA` → West Midlands
- `L1 1AA` → North West
- `E1 1AA` → London
- `W11 1AA` → London

### 3. API Disabled Test
**Purpose**: Tests system behavior when API calls are disabled or fail.

**What it tests**:
- Invalid API key handling
- Connection failure scenarios
- Error propagation
- Graceful degradation

### 4. Error Handling Test
**Purpose**: Tests edge cases and error scenarios.

**What it tests**:
- Invalid postcode handling
- Empty search results
- Malformed data validation
- Network timeouts
- Elasticsearch errors

## Manual Testing Steps

### Step 1: Environment Setup
```bash
# Check if environment variables are set
echo $ELASTICSEARCH_URL
echo $ELASTICSEARCH_API_KEY

# If not set, create .env file with:
ELASTICSEARCH_URL=https://your-elasticsearch-url
ELASTICSEARCH_API_KEY=your-api-key
```

### Step 2: Test Elasticsearch Connection
```bash
# Test basic connection
npm run test-hpi -- --mode search --postcode "SW1A 1AA"
```

**Expected output**:
```
🧪 Starting HPI System Tests...

📋 Running: Search Mode
   Connected to Elasticsearch 8.13.0
   📍 Postcode SW1A 1AA maps to region: London
   📊 Found 12 HPI records for London
   📈 Latest HPI for London: 123.4 (2024-01)
   📊 Month-over-month growth: 0.5%
   📊 Year-over-year growth: 2.1%
✅ PASSED: Search Mode
```

### Step 3: Test Upload Mode
```bash
# First, download the ONS data manually
# Then run the upload test
npm run test-hpi-upload
```

**Expected output** (if file exists):
```
📋 Running: Upload Mode
   ✅ Found manual download file, processing...
   📦 Extracting temp/hpione.zip...
   ✅ Extracted hpione.csv
   📊 Parsed 156 HPI records
   📈 Calculating growth rates...
   ✅ Growth rates calculated
   📤 Uploading 156 records to Elasticsearch...
   ✅ Upload mode test completed
```

### Step 4: Test Error Handling
```bash
npm run test-hpi-errors
```

**Expected output**:
```
📋 Running: Error Handling
   Testing error handling and edge cases...
   ✅ Invalid postcode properly rejected
   ✅ Empty search results handled correctly
   ✅ Data validation test passed
```

## Troubleshooting

### Common Issues

#### 1. Elasticsearch Connection Failed
**Error**: `Elasticsearch connection failed: Connection timeout`

**Solutions**:
- Check `ELASTICSEARCH_URL` in `.env`
- Verify network connectivity
- Check firewall settings
- Validate API key

#### 2. Index Not Found
**Error**: `Index house_price_index does not exist`

**Solutions**:
- The test will automatically create the index
- Check Elasticsearch permissions
- Verify API key has index creation rights

#### 3. Manual File Not Found
**Error**: `No manual download file found`

**Solutions**:
- Download `hpione.zip` from ONS website
- Place in `temp/` directory
- Ensure file is named exactly `hpione.zip`

#### 4. API Key Invalid
**Error**: `401 Unauthorized`

**Solutions**:
- Regenerate Elasticsearch API key
- Check key permissions
- Verify key format

### Debug Mode
Run tests with verbose logging:
```bash
npm run test-hpi -- --verbose
```

This will show:
- Detailed API calls
- Response data
- Timing information
- Error stack traces

## Test Results Interpretation

### Success Criteria
- **All tests pass**: System is working correctly
- **Upload test skipped**: Normal if no manual file
- **Search test passes**: HPI data is accessible
- **Error handling passes**: System is robust

### Failure Analysis
- **Connection failures**: Check Elasticsearch setup
- **Data validation failures**: Check data quality
- **Permission errors**: Check API key permissions
- **Timeout errors**: Check network connectivity

## Integration Testing

### Test with Your Application
After running the HPI tests, test the integration with your main application:

1. **Test HPI Dashboard**:
   ```bash
   # Start your development server
   npm run dev
   # Navigate to /hpi-dashboard
   ```

2. **Test Property Search**:
   - Search for a postcode (e.g., `SW1A 1AA`)
   - Verify HPI data appears
   - Check growth rate calculations

3. **Test API Endpoints**:
   ```bash
   # Test HPI API
   curl "http://localhost:3000/api/hpi?postcode=SW1A%201AA"
   
   # Test date range API
   curl "http://localhost:3000/api/hpi/date-range?region=London"
   ```

## Performance Testing

### Load Testing
```bash
# Test multiple concurrent searches
for i in {1..10}; do
  npm run test-hpi -- --mode search --postcode "SW1A 1AA" &
done
wait
```

### Memory Usage
Monitor memory usage during tests:
```bash
# Run with memory monitoring
node --max-old-space-size=4096 src/testHpiSystem.js --mode all
```

## Continuous Integration

### GitHub Actions
Add this to your `.github/workflows/test.yml`:
```yaml
- name: Test HPI System
  run: |
    npm run test-hpi -- --mode search
    npm run test-hpi -- --mode error-handling
```

### Pre-commit Hooks
Add to your pre-commit hooks:
```bash
#!/bin/bash
npm run test-hpi -- --mode search
```

## Next Steps

After completing these tests:

1. **Update TODO.md**: Mark completed test items
2. **Fix any issues**: Address test failures
3. **Document results**: Update this guide with findings
4. **Move to Priority 2**: Begin enhancement work
5. **Set up monitoring**: Implement ongoing testing

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Run with `--verbose` flag
3. Check Elasticsearch logs
4. Review environment variables
5. Verify network connectivity

---

**Test Status**: ✅ Ready to run
**Last Updated**: [Current Date]
**Next Review**: After test completion 