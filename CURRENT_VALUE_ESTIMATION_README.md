# Current Value Estimation Feature

## Overview

The BMV Finder platform now includes a sophisticated **Current Value Estimation** feature that calculates the estimated current market value of properties using multiple data sources and analytical methods. This feature provides investors with accurate, data-driven property valuations to make informed investment decisions.

## How It Works

The current value estimation uses a **weighted multi-method approach** that combines four different valuation methods:

### 1. HPI-Adjusted Value (40% weight)
- **Method**: Adjusts the last sold price using House Price Index (HPI) data
- **Formula**: `Current Value = Last Sold Price × (Current HPI / HPI at Sale Date)`
- **Advantage**: Accounts for market inflation and regional price trends
- **Example**: Property sold for £180,000 in 2022, HPI increased 13.6% → Current value: £204,480

### 2. Market Price per Square Meter (30% weight)
- **Method**: Uses local market rates per square meter
- **Formula**: `Current Value = Floor Area × Local Average Price/Sqm`
- **Advantage**: Considers property size and local market rates
- **Example**: 85 sqm × £2,500/sqm = £212,500

### 3. Market Price per Bedroom (20% weight)
- **Method**: Uses local market rates per bedroom
- **Formula**: `Current Value = Number of Bedrooms × Local Average Price/Bedroom`
- **Advantage**: Considers property configuration and local demand
- **Example**: 3 bedrooms × £70,000/bedroom = £210,000

### 4. Market Average Price (10% weight)
- **Method**: Uses overall market average for the area
- **Formula**: `Current Value = Local Market Average Price`
- **Advantage**: Provides baseline market context
- **Example**: £200,000 (local average)

## Data Sources

### Property Enrichment Data (EPC Register)
- **Bedrooms**: Number of bedrooms
- **Floor Area**: Square meters of living space
- **Property Type**: Detached, semi-detached, terraced, etc.
- **EPC Rating**: Energy Performance Certificate rating

### Sold Price Data (UK Land Registry)
- **Historical Sales**: All recorded sales for the property
- **Sale Prices**: Actual transaction amounts
- **Sale Dates**: When each transaction occurred

### HPI Data (ONS)
- **Regional HPI Values**: Monthly house price indices
- **HPI Changes**: Month-over-month percentage changes
- **Market Trends**: Rising, falling, or stable markets

### Market Insights (Local Analysis)
- **Average Prices**: Mean property prices in the postcode area
- **Price per Square Meter**: Local market rates per sqm
- **Price per Bedroom**: Average cost per bedroom in the area

## API Integration

### Endpoint
```
GET /api/property-analysis?postcode={postcode}&number={number}
```

### Response Format
```json
{
  "deal_metrics": {
    "last_sold_price": 180000,
    "hpi_adjusted_value": 204480,
    "current_value_estimate": 197750,
    "price_per_sqm": 2118,
    "price_per_bedroom": 60000,
    "deal_score": 75,
    "deal_rating": "Good",
    "analysis": [
      "Property sold 12% below HPI-adjusted value - good deal",
      "Price per sqm is 15.3% below market average"
    ]
  }
}
```

## UI Integration

The current value estimate is prominently displayed in the **Enhanced Deal Analysis Card** with:

### Visual Indicators
- **Blue highlighted card** to distinguish from other metrics
- **Percentage change** showing appreciation/depreciation
- **Color-coded indicators** (green for positive, red for negative)

### Layout
- **3-column grid** in the overview tab
- **Current Estimate** positioned between "Last Sold" and "HPI Adjusted"
- **Real-time calculation** based on available data

## Example Calculation

Let's analyze a property at "21 Test Street":

### Input Data
- **Last Sold**: £180,000 (June 2022)
- **Bedrooms**: 3
- **Floor Area**: 85 sqm
- **Current HPI**: 125.0 (+13.6% from sale date)
- **Market Average**: £200,000
- **Market Price/Sqm**: £2,500
- **Market Price/Bedroom**: £70,000

### Calculations
1. **HPI Method**: £180,000 × 1.136 = £204,480 (40% weight)
2. **Sqm Method**: 85 × £2,500 = £212,500 (30% weight)
3. **Bedroom Method**: 3 × £70,000 = £210,000 (20% weight)
4. **Market Average**: £200,000 (10% weight)

### Final Estimate
```
Weighted Average = (204,480 × 0.4) + (212,500 × 0.3) + (210,000 × 0.2) + (200,000 × 0.1)
                 = £81,792 + £63,750 + £42,000 + £20,000
                 = £207,542
                 ≈ £207,500 (rounded)
```

### Result
- **Current Value Estimate**: £207,500
- **Price Change**: +15.3% (£27,500)
- **Investment Insight**: Property has appreciated significantly

## Benefits for Investors

### 1. **Accurate Valuations**
- Multi-method approach reduces estimation errors
- Market-adjusted calculations account for inflation
- Local market data provides context

### 2. **Investment Decision Support**
- Compare asking prices to estimated values
- Identify undervalued properties
- Assess potential returns

### 3. **Market Timing**
- Understand property appreciation trends
- Identify optimal buying/selling opportunities
- Track portfolio performance

### 4. **Risk Assessment**
- Evaluate market volatility impact
- Consider property-specific factors
- Assess investment timing

## Technical Implementation

### Algorithm Features
- **Weighted averaging** for balanced estimates
- **Fallback methods** when data is incomplete
- **Real-time calculation** based on current market data
- **Confidence scoring** based on data quality

### Performance Optimizations
- **Caching** of enrichment data (24-hour TTL)
- **Parallel API calls** for faster response times
- **Graceful degradation** when services are unavailable
- **Rate limiting** to prevent API abuse

### Error Handling
- **Null handling** for missing data
- **Validation** of input parameters
- **Fallback values** when calculations fail
- **User-friendly error messages**

## Setup Instructions

### 1. Environment Variables
```bash
# Add to .env.local
PROPERTY_ENRICHMENT_SERVICE_URL="http://localhost:3002"
```

### 2. Start Services
```bash
# Start enrichment service (port 3002)
cd property-enrichment-service
npm start

# Start main application (port 3001)
npm run dev
```

### 3. Test the Feature
```bash
# Run test script
node scripts/test-current-value-estimation.js

# Test API endpoint
curl "http://localhost:3001/api/property-analysis?postcode=NE52PR&number=21"
```

## Usage Examples

### 1. **Property Search**
1. Navigate to Advanced Deal Analysis page
2. Enter postcode and house number
3. View current value estimate in the results

### 2. **Investment Analysis**
1. Compare asking price to estimated value
2. Calculate potential profit margin
3. Assess deal attractiveness

### 3. **Portfolio Tracking**
1. Monitor property value changes
2. Track investment performance
3. Identify rebalancing opportunities

## Future Enhancements

### Planned Features
- **Machine Learning Models**: Enhanced prediction accuracy
- **Market Forecasting**: Future value predictions
- **Comparative Analysis**: Side-by-side property comparisons
- **Investment Scenarios**: What-if analysis tools

### Data Improvements
- **More EPC Data**: Expanded property characteristics
- **Enhanced HPI**: More granular regional data
- **Market Sentiment**: News and social media analysis
- **Economic Indicators**: Interest rates, employment data

## Troubleshooting

### Common Issues

#### 1. **No Current Value Estimate**
- **Cause**: Missing property enrichment data
- **Solution**: Ensure enrichment service is running on port 3002

#### 2. **Inaccurate Estimates**
- **Cause**: Limited market data
- **Solution**: Check if local sales data is available

#### 3. **Slow Response Times**
- **Cause**: API rate limiting or network issues
- **Solution**: Check service health and network connectivity

### Debug Commands
```bash
# Check enrichment service health
curl http://localhost:3002/health

# Test property enrichment
curl "http://localhost:3002/api/property-info?postcode=SW1A1AA&number=10"

# Check cache statistics
curl http://localhost:3002/api/cache/stats
```

## Support

For technical support or feature requests:
- Check the logs in `property-enrichment-service/combined.log`
- Review the API documentation
- Test with the provided scripts
- Contact the development team

---

**Note**: The current value estimation is based on available market data and should be used as one of several factors in investment decision-making. Always conduct thorough due diligence before making property investments. 