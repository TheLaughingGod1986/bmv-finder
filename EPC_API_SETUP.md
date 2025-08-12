# EPC Register API Integration Setup

## Overview
The Deal Calculator now integrates with the EPC Register API to fetch real Energy Performance Certificate data for properties. This provides accurate EPC ratings, square footage, build years, and other property characteristics.

## Benefits of Real EPC Data
- ✅ **Real EPC ratings** (A-G) instead of estimates
- ✅ **Actual square footage** from official measurements
- ✅ **Verified build years** from property records
- ✅ **Property type confirmation** from official data
- ✅ **Tenure information** (Freehold/Leasehold)
- ✅ **Higher confidence valuations** based on real data

## Setup Steps

### 1. Register for EPC Register API
1. Go to [https://epc.opendatacommunities.org/](https://epc.opendatacommunities.org/)
2. Click "Sign Up" and create an account
3. Verify your email address
4. Log in to your account

### 2. Get Your API Key
1. After logging in, navigate to your account settings
2. Look for "API Access" or "Developer" section
3. Generate a new API key
4. Copy the API key (it will look like: `abc123def456ghi789`)

### 3. Add API Key to Environment
1. Open your `.env` file in the project root
2. Add the following line:
   ```
   EPC_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual API key
4. Save the file

### 4. Restart the Application
1. Stop your development server (`Ctrl+C`)
2. Restart with `npm run dev`
3. The API will now attempt to fetch real EPC data

## Data Source Priority
The system now uses a multi-tiered approach:

1. **EPC Register API** (Highest Priority)
   - Real EPC ratings and scores
   - Official square footage measurements
   - Verified build years
   - Property type confirmation

2. **Elasticsearch Data** (Medium Priority)
   - Existing property records
   - Historical transaction data
   - Basic property characteristics

3. **Intelligent Estimation** (Fallback)
   - Postcode-based build year estimates
   - Bedroom-based square footage estimates
   - EPC rating estimates based on build year
   - Regional property patterns

## Testing the Integration

### 1. Test with a Known Postcode
- Enter a postcode (e.g., `NE5 4PR`)
- Click "Fetch Data"
- Look for the data source badge:
  - 🟢 **REAL EPC DATA** = Successfully fetched from EPC API
  - 🔵 **ELASTICSEARCH** = Found in existing database
  - 🟡 **INTELLIGENT ESTIMATION** = Using fallback estimates

### 2. Check Console Logs
The API provides detailed logging:
```
Attempting to fetch real EPC data from EPC Register API...
Real EPC data successfully integrated: { epcRating: 'B', epcScore: 85, ... }
Combined enhanced property data: { ... }
```

### 3. Verify Data Quality
- EPC ratings should be real (A, B, C, D, E, F, G)
- Square footage should be accurate measurements
- Build years should be verified dates
- Property types should match official records

## Troubleshooting

### API Key Issues
```
EPC API key not configured. To get real EPC data:
1. Register at https://epc.opendatacommunities.org/
2. Add your API key to .env as EPC_API_KEY
3. Restart the application
```

### Authentication Errors
```
EPC API request failed: 401 Unauthorized
```
- Check your API key is correct
- Ensure the key is active in your EPC Register account
- Verify the key format in your `.env` file

### No Data Found
```
No EPC data found for this postcode
```
- Some postcodes may not have EPC data
- The system will fall back to intelligent estimation
- This is normal for newer or less common postcodes

## Data Coverage

### UK Coverage
- **England & Wales**: Full coverage via EPC Register
- **Scotland**: Limited coverage (different system)
- **Northern Ireland**: Limited coverage

### Property Types
- **Residential**: Full coverage
- **Commercial**: Limited coverage
- **New Builds**: May have delayed EPC data

### Data Freshness
- **EPC Data**: Updated monthly
- **Property Sales**: Real-time from Land Registry
- **Market Data**: Updated quarterly

## Next Steps

### Phase 2: Property Portal Integration
- Rightmove/Zoopla API for current listings
- Professional property photos
- Detailed amenity information

### Phase 3: Enhanced Land Registry
- Official property tenure data
- Transaction history
- Legal property boundaries

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your API key is active
3. Test with different postcodes
4. Check the EPC Register website for service status

## Cost
- **EPC Register API**: Free tier available
- **Rate Limits**: Check your account for limits
- **Commercial Use**: May require paid plan for high volume
