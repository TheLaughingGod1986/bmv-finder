# BMV Finder

A comprehensive UK property market analysis platform that provides actionable insights for property buyers using Land Registry data and House Price Index (HPI) analytics.

## 🚀 New Features

### **Complete Data Integration**
- **Recent Sales Display**: Shows the latest 10 property transactions for any UK postcode
- **HPI Integration**: Displays House Price Index data with regional trends and market signals
- **Market Insights**: Provides "buy/sell" signals based on recent prices vs HPI trends
- **Dual Data Sources**: Uses local Elasticsearch data with SPARQL fallback for comprehensive coverage

### **Automated Data Pipeline**
- **Land Registry Updates**: Automated daily incremental and weekly full updates
- **HPI Data Updates**: Monthly automated updates from ONS
- **Health Monitoring**: Weekly data health checks and validation
- **Comprehensive Logging**: Detailed logs for monitoring and debugging

## 🏠 Property Search Features

### **Postcode Search**
When you search for a UK postcode (e.g., "SS9 5EL"), you'll see:

1. **HPI Data Panel**: 
   - Latest House Price Index for the region
   - Month-over-month and year-over-year growth
   - Mini trend chart showing HPI movement over time
   - Tooltips explaining each metric

2. **Recent Sales Panel**:
   - Latest 10 property transactions in the postcode
   - Sale prices, dates, property types, and addresses
   - Median price calculation
   - Market signal (above/below/in line with trend)

3. **Market Insights**:
   - Comparison of recent sale prices to HPI trends
   - Simple "buy/sell" indicators for property investors
   - Regional context and market positioning

### **Region/City Search**
When you search for a region or city (e.g., "Leeds", "London"), you'll see:
- Regional HPI data and trends
- Market context for the broader area

## 🔧 Setup & Installation

### **Prerequisites**
- Node.js 18+
- Elasticsearch 8.x
- npm or yarn

### **Installation**
```bash
git clone <repository-url>
cd bmv-finder
npm install
```

### **Environment Setup**
Create a `.env.local` file with:
```env
ELASTICSEARCH_URL=https://localhost:9200
ELASTICSEARCH_API_KEY=your_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
STRIPE_SECRET_KEY=your_stripe_key
```

### **Data Setup**
1. **Start Elasticsearch**:
   ```bash
   cd elasticsearch-8.13.0
   ./bin/elasticsearch
   ```

2. **Import Land Registry Data**:
   ```bash
   npm run populate-es
   ```

3. **Import HPI Data**:
   ```bash
   node src/createHpiIndex.js
   node src/updateHpiFromOns.js
   ```

### **Automation Setup**
Set up automated data updates:
```bash
./scripts/setup-automation.sh
```

This configures:
- **Daily incremental Land Registry updates** (3 AM)
- **Weekly full Land Registry updates** (Sundays 2 AM)
- **Monthly HPI updates** (1st of month 4 AM)
- **Weekly health checks** (Saturdays 6 AM)

## 📊 API Endpoints

### **Recent Sales API**
- `GET /api/recent-sales?postcode=SS9 5EL`
- Returns recent sales, HPI data, and market signals
- Falls back to Land Registry SPARQL if no local data

### **HPI API**
- `GET /api/hpi/postcode?postcode=SS9 5EL`
- `GET /api/hpi/postcode?region=London`
- Returns HPI data with source information

### **Property Search API**
- `POST /api/property-es`
- `GET /api/property-trend`
- Existing property search functionality

## 🎯 Usage Examples

### **For Property Buyers**
1. Search for a postcode you're interested in
2. Review recent sales to understand local market prices
3. Check HPI trends to see if prices are rising or falling
4. Use market signals to time your purchase

### **For Property Investors**
1. Compare recent sale prices to HPI trends
2. Identify undervalued areas (below trend signals)
3. Monitor regional HPI growth rates
4. Use median prices for investment calculations

## 📈 Data Sources

### **Land Registry Price Paid Data**
- Complete UK property transaction history
- Updated daily with new sales
- Includes property type, price, date, and location

### **House Price Index (HPI)**
- Official UK government house price index
- Regional and national trends
- Monthly updates from ONS

### **SPARQL Integration**
- Real-time access to Land Registry linked data
- Fallback for postcodes with limited local data
- Comprehensive coverage for all UK postcodes

## 🔍 Monitoring & Maintenance

### **Log Files**
- `logs/cron-landregistry-daily.log` - Daily updates
- `logs/cron-landregistry-weekly.log` - Weekly updates
- `logs/cron-hpi-monthly.log` - HPI updates
- `logs/cron-health-check.log` - System health

### **Health Checks**
```bash
# Check data health
node scripts/check-hpi-data.js

# View recent logs
tail -f logs/cron-landregistry-daily.log
```

### **Manual Updates**
```bash
# Update Land Registry data
npm run update-es

# Update HPI data
node src/updateHpiFromOns.js
```

## 🛠️ Development

### **Running Locally**
```bash
npm run dev
```

### **Testing APIs**
```bash
# Test recent sales
curl "http://localhost:3000/api/recent-sales?postcode=SS9%205EL"

# Test HPI data
curl "http://localhost:3000/api/hpi/postcode?postcode=SS9%205EL"
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support or questions:
- Email: support@bmvfinder.com
- Check the logs for error details
- Review the automation setup if data isn't updating

---

**BMV Finder** - Making UK property data accessible and actionable for everyone.
