# HPI Valuation Pipeline

A comprehensive system for ingesting ONS House Price Index (HPI) data, calculating current property valuations, and providing investment insights through a Next.js dashboard.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ONS Website   │───▶│  HPI Pipeline   │───▶│ Elasticsearch   │
│   (Monthly)     │    │   (Automated)   │    │   (Kibana)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Next.js API    │
                       │   & Dashboard   │
                       └─────────────────┘
```

## 📁 Project Structure

```
valuation-hpi-pipeline/
├── src/
│   ├── createHpiIndex.js          # Create Elasticsearch index
│   ├── updateHpiFromOns.js        # Download & ingest ONS data
│   ├── uploadHpi.js               # Local CSV upload fallback
│   └── estimate.js                # Property valuation estimation
├── utils/
│   └── postcodeToRegion.js        # UK postcode to region mapping
├── data/
│   └── hpi.csv                    # Sample HPI data
├── src/app/
│   ├── api/
│   │   ├── hpi/route.ts           # HPI data API
│   │   └── top-roi/route.ts       # ROI analysis API
│   └── hpi-dashboard/
│       └── page.tsx               # Dashboard UI
├── .github/workflows/
│   └── update-hpi.yml             # Automated monthly updates
└── HPI_PIPELINE_README.md         # This file
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- Elasticsearch cluster (Cloud or local)
- GitHub repository with secrets configured

### 2. Environment Setup

```bash
# Install dependencies
npm install @elastic/elasticsearch csv-parser adm-zip

# Set environment variables
export ELASTICSEARCH_URL="your-elasticsearch-url"
export ELASTICSEARCH_API_KEY="your-api-key"
```

### 3. Create HPI Index

```bash
node src/createHpiIndex.js
```

### 4. Upload Sample Data

```bash
node src/uploadHpi.js
```

### 5. Run Property Valuation

```bash
node src/estimate.js
```

### 6. Start Dashboard

```bash
npm run dev
# Visit http://localhost:3002/hpi-dashboard
```

## 📊 Data Flow

### 1. HPI Data Ingestion

**Source**: ONS House Price Index (monthly updates)
- **URL**: https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/housepriceindex
- **Format**: ZIP file containing CSV data
- **Frequency**: Monthly (1st of month)

**Process**:
```javascript
// Download ZIP from ONS
// Extract relevant CSV
// Parse to { region, date, index }
// Upload to Elasticsearch using bulk API
```

### 2. Property Valuation

**Input**: Property sales data with `dateOfTransfer` and `postcode`
**Process**:
1. Map postcode to HPI region
2. Query HPI for sale date + region
3. Query latest HPI for same region
4. Calculate: `estimatedValue = (currentIndex / pastIndex) * pricePaid`

**Output**: Enhanced property records with:
- `estimatedValue`: Current market value
- `growthPercentage`: Percentage growth since sale
- `hpiRegion`: Mapped region
- `hpiGrowthFactor`: HPI ratio

### 3. ROI Analysis

**Metrics Calculated**:
- **Absolute Growth**: `estimatedValue - price`
- **ROI Percentage**: `(absoluteGrowth / price) * 100`
- **Annualized ROI**: Time-weighted return
- **Rental Yield**: Estimated annual rental income

## 🔧 Configuration

### Elasticsearch Index Mapping

```json
{
  "mappings": {
    "properties": {
      "region": { "type": "keyword" },
      "date": { 
        "type": "date",
        "format": "yyyy-MM"
      },
      "index": { "type": "float" }
    }
  }
}
```

### GitHub Secrets

Configure these in your repository settings:

- `ELASTICSEARCH_URL`: Your Elasticsearch endpoint
- `ELASTICSEARCH_API_KEY`: API key for authentication

### Postcode Mapping

The system includes comprehensive UK postcode to HPI region mapping:

- **London**: E, N, W, SW, SE, NW
- **South East**: GU, RG, SL, SO, PO, BN, TN, CT, ME, DA, RH, HP, LU, MK, OX
- **South West**: BA, BS, DT, EX, GL, PL, SN, SP, TA, TQ, TR
- **East of England**: AL, CB, CM, CO, IP, NR, SG, SS
- **West Midlands**: B, CV, DY, HR, LE, NG, ST, TF, WS, WV
- **East Midlands**: DE, DN, LN, PE, S
- **Yorkshire and The Humber**: BD, HD, HG, HU, HX, LS, WF, YO
- **North West**: BB, BL, CA, CH, CW, FY, L, LA, M, OL, PR, SK, WA, WN
- **North East**: DH, DL, NE, SR, TS
- **Wales**: CF, LD, LL, NP, SA, SY
- **Scotland**: AB, DD, DG, EH, FK, G, HS, IV, KA, KW, KY, ML, PA, PH, TD, ZE
- **Northern Ireland**: BT

## 📈 Dashboard Features

### 1. HPI Trends
- **Line Charts**: Regional HPI over time
- **Growth Metrics**: YoY and MoM changes
- **Regional Comparison**: Side-by-side analysis

### 2. Property Valuation
- **Current vs Paid**: Visual comparison
- **Growth Analysis**: Percentage and absolute gains
- **Regional Performance**: Best/worst performing areas

### 3. Investment Insights
- **Top ROI Properties**: Highest growth opportunities
- **Postcode Analysis**: Area-level insights
- **Rental Yield Estimates**: Income potential

### 4. Filters & Controls
- **Region Selection**: Filter by HPI region
- **Date Range**: Custom time periods
- **View Modes**: Chart, table, comparison views

## 🤖 Automation

### Monthly Updates

The system automatically updates on the 1st of each month at 5 AM UTC:

```yaml
# .github/workflows/update-hpi.yml
on:
  schedule:
    - cron: '0 5 1 * *'  # 1st of month at 5 AM
  workflow_dispatch:     # Manual trigger
```

**Process**:
1. Create HPI index (if needed)
2. Download latest ONS data
3. Parse and upload to Elasticsearch
4. Recalculate property valuations
5. Commit changes to repository

### Manual Triggers

```bash
# Update HPI data
node src/updateHpiFromOns.js

# Upload local CSV
node src/uploadHpi.js

# Recalculate valuations
node src/estimate.js
```

## 📊 API Endpoints

### GET /api/hpi
Fetch HPI data with optional filters.

**Parameters**:
- `region`: Filter by region
- `startDate`: Start date (YYYY-MM)
- `endDate`: End date (YYYY-MM)
- `limit`: Number of results

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "region": "London",
      "date": "2024-01",
      "index": 147.2
    }
  ],
  "total": 1
}
```

### POST /api/hpi
Get time series aggregation data.

**Body**:
```json
{
  "region": "London",
  "startDate": "2020-01",
  "endDate": "2024-12",
  "groupBy": "month"
}
```

### GET /api/top-roi
Analyze top ROI opportunities.

**Parameters**:
- `limit`: Number of results (default: 10)
- `region`: Filter by region
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter

## 🔍 Monitoring & Debugging

### Kibana Integration

The HPI index is optimized for Kibana visualization:

1. **Index Patterns**: Create pattern for `house_price_index`
2. **Dashboards**: Pre-built visualizations available
3. **Alerts**: Set up monitoring for data quality

### Logging

All scripts include comprehensive logging:

```javascript
console.log(`Processing ${data.length} records...`);
console.log(`Successfully uploaded ${uploaded} documents`);
console.error('Error:', error.message);
```

### Data Validation

The system includes validation for:
- Postcode format validation
- Date range validation
- HPI index value validation
- Region mapping validation

## 🚀 Future Enhancements

### Planned Features

1. **ROI Forecasting**
   - Machine learning models for price prediction
   - Market trend analysis
   - Risk assessment

2. **Enhanced UI**
   - Tailwind UI components
   - Interactive maps
   - Real-time updates

3. **Integration Features**
   - Cloudinary snapshot sharing
   - Email digest subscriptions
   - Mobile app support

4. **Advanced Analytics**
   - Property type analysis
   - Seasonal adjustments
   - Economic indicator correlation

### Technical Improvements

1. **Performance**
   - Caching layer (Redis)
   - Database optimization
   - CDN for static assets

2. **Scalability**
   - Microservices architecture
   - Load balancing
   - Auto-scaling

3. **Security**
   - API rate limiting
   - Data encryption
   - Audit logging

## 🐛 Troubleshooting

### Common Issues

1. **Elasticsearch Connection**
   ```bash
   # Test connection
   node scripts/test-es-connection.js
   ```

2. **HPI Data Missing**
   ```bash
   # Check index
   curl -X GET "localhost:9200/house_price_index/_count"
   ```

3. **Property Valuations Not Updating**
   ```bash
   # Check for properties without estimatedValue
   node scripts/check-missing-valuations.js
   ```

### Debug Mode

Enable debug logging:

```bash
DEBUG=* node src/estimate.js
```

## 📚 Resources

- [ONS House Price Index](https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/housepriceindex)
- [Elasticsearch Documentation](https://www.elastic.co/guide/index.html)
- [Next.js Documentation](https://nextjs.org/docs)
- [Chart.js Documentation](https://www.chartjs.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 