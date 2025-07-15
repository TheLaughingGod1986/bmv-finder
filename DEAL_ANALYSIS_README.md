# Deal Analysis Feature

## Overview

The Deal Analysis feature provides comprehensive property investment insights by combining multiple data sources:

- **Property Enrichment Data** (EPC Register API)
- **Historical Sales Data** (Land Registry)
- **House Price Index (HPI) Data** (ONS)
- **Market Insights** (Local area analysis)

This creates a powerful tool for property investors to identify genuine deals and avoid overpaying.

## Features

### 🎯 Deal Scoring System
- **0-100 Score**: Higher scores indicate better deals
- **5 Rating Levels**: Excellent, Good, Fair, Poor, Overpriced
- **Smart Algorithm**: Considers multiple factors for accurate assessment

### 📊 Comprehensive Analysis
- **HPI-Adjusted Values**: Accounts for market inflation/deflation
- **Price per Square Meter**: Compares with local market averages
- **Price per Bedroom**: Bedroom-specific value analysis
- **EPC Rating Impact**: Energy efficiency considerations
- **Market Trends**: Rising/falling market context

### 🏠 Property Details
- **Bedroom Count**: From EPC data
- **Floor Area**: Square meters from EPC
- **Property Type**: House, flat, etc.
- **EPC Rating**: Current and potential energy ratings
- **Construction Year**: When available

### 📈 Market Insights
- **Local Price Trends**: Rising, falling, or stable
- **Market Volatility**: Low, medium, or high
- **Average Comparisons**: Price per sqm and per bedroom
- **Sales History**: Complete transaction history

## API Endpoints

### Property Analysis
```
GET /api/property-analysis?postcode={postcode}&number={number}
```

**Response:**
```json
{
  "property_info": {
    "address": "10 Downing Street",
    "bedrooms": 3,
    "epc_rating": "C",
    "floor_area_m2": 120,
    "property_type": "Terraced house"
  },
  "sold_prices": [
    {
      "price": 450000,
      "date": "2023-06-15",
      "property_type": "Terraced house"
    }
  ],
  "hpi_data": [
    {
      "date": "2024-01-01",
      "hpi_value": 123.4,
      "hpi_change": 2.1,
      "region": "London"
    }
  ],
  "deal_metrics": {
    "last_sold_price": 450000,
    "hpi_adjusted_value": 485000,
    "price_per_sqm": 3750,
    "price_per_bedroom": 150000,
    "deal_score": 75,
    "deal_rating": "Good",
    "analysis": [
      "Property sold 7.2% below HPI-adjusted value - good deal",
      "Price per sqm is 12.3% below market average"
    ]
  },
  "market_insights": {
    "average_price_per_sqm": 4200,
    "average_price_per_bedroom": 165000,
    "price_trend": "rising",
    "market_volatility": "medium"
  }
}
```

## Deal Scoring Algorithm

The deal score (0-100) is calculated based on:

### 1. HPI Adjustment (40% weight)
- Compares actual sale price vs HPI-adjusted value
- Positive adjustment: +30 points for >20% below, +20 for >10% below
- Negative adjustment: -30 points for >20% above, -20 for >10% above

### 2. Market Comparison (30% weight)
- **Price per sqm**: +20 points if 15% below market average, -20 if 15% above
- **Price per bedroom**: +15 points if 15% below market average, -15 if 15% above

### 3. Property Quality (20% weight)
- **EPC Rating**: +10 points for A/B ratings, -10 for E/F/G ratings
- **Property Type**: Considers market demand for different types

### 4. Market Context (10% weight)
- **Market Trend**: Bonus points in rising markets
- **Volatility**: Adjusts for market uncertainty

## Rating System

| Score Range | Rating | Description |
|-------------|--------|-------------|
| 80-100 | Excellent | Outstanding deal, significant value |
| 60-79 | Good | Above-average deal, good value |
| 40-59 | Fair | Market-rate deal, neutral value |
| 20-39 | Poor | Below-average deal, overpriced |
| 0-19 | Overpriced | Significantly overpriced, avoid |

## Setup Instructions

### 1. Property Enrichment Service

Start the enrichment service:
```bash
cd property-enrichment-service
npm install
npm start
```

The service runs on `http://localhost:3001` by default.

### 2. Environment Variables

Add to your `.env.local`:
```bash
PROPERTY_ENRICHMENT_SERVICE_URL="http://localhost:3002"
```

### 3. Elasticsearch Data

Ensure your Elasticsearch has:
- `land_registry_sales` index with property sales data
- `hpi_data` index with House Price Index data

### 4. Test the Integration

Run the test script:
```bash
node scripts/test-deal-analysis.js
```

## Usage Examples

### Frontend Integration

```tsx
import DealAnalysisSearch from './components/DealAnalysisSearch';

function HomePage() {
  return (
    <div>
      <DealAnalysisSearch />
    </div>
  );
}
```

### API Usage

```javascript
const response = await fetch('/api/property-analysis?postcode=SW1A 1AA&number=10');
const analysis = await response.json();

console.log(`Deal Score: ${analysis.deal_metrics.deal_score}/100`);
console.log(`Rating: ${analysis.deal_metrics.deal_rating}`);
```

## Data Sources

### EPC Register API
- **Endpoint**: `https://epc.opendatacommunities.org/api/v1/domestic/search`
- **Data**: Property details, EPC ratings, floor area, bedrooms
- **Rate Limit**: 100 requests per minute

### Land Registry
- **Source**: UK Land Registry sales data
- **Data**: Historical sales prices, property types, transaction details
- **Update Frequency**: Monthly

### House Price Index (ONS)
- **Source**: Office for National Statistics
- **Data**: Regional and national price trends
- **Update Frequency**: Monthly

## Error Handling

The system gracefully handles:
- Missing property data (continues with available data)
- API timeouts (falls back to cached data)
- Invalid postcodes (returns appropriate error messages)
- Service unavailability (degraded functionality)

## Performance Considerations

- **Caching**: EPC data cached for 24 hours
- **Rate Limiting**: Respects API limits
- **Async Processing**: Non-blocking data fetching
- **Fallback Strategy**: Continues with partial data

## Future Enhancements

- **Machine Learning**: Predictive deal scoring
- **Market Forecasting**: Future value predictions
- **Investment Calculator**: ROI calculations
- **Portfolio Analysis**: Multi-property analysis
- **Market Alerts**: Deal notifications
- **Comparative Analysis**: Similar property comparisons

## Troubleshooting

### Common Issues

1. **Enrichment Service Not Found**
   - Check if service is running on port 3001
   - Verify `PROPERTY_ENRICHMENT_SERVICE_URL` environment variable

2. **No HPI Data**
   - Ensure HPI data is indexed in Elasticsearch
   - Check postcode format and region mapping

3. **Missing Property Data**
   - Property may not have EPC certificate
   - Try different house number formats

4. **Low Deal Scores**
   - Check market conditions in the area
   - Verify HPI data is up to date
   - Consider property-specific factors

### Debug Mode

Enable debug logging:
```bash
DEBUG=deal-analysis:* npm run dev
```

## Support

For issues or questions:
1. Check the test script output
2. Review Elasticsearch data completeness
3. Verify API service availability
4. Check environment configuration

---

**Note**: This feature requires the property enrichment service to be running for full functionality. The system will work with reduced features if the service is unavailable. 