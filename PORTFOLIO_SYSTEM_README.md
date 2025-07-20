# Portfolio Tracking System

## Overview

The Portfolio Tracking System is a comprehensive solution for property investors to manage their investment portfolio, track performance, and make data-driven decisions. The system provides real-time analytics, performance metrics, and investment recommendations.

## Features

### 🏠 Portfolio Management
- **Add Properties**: One-click addition of properties from valuation results
- **Property Details**: Comprehensive property information including purchase price, current value, rental income, and yield
- **Status Tracking**: Track properties as active, sold, or watching
- **Notes & Documentation**: Add custom notes and documentation for each property

### 📊 Analytics & Performance
- **Portfolio Overview**: Total value, growth, equity, and rental income
- **Performance Metrics**: Total return, annualized return, and monthly growth
- **Top Performers**: Identify best and worst performing properties
- **Diversification Analysis**: Property type and location distribution
- **Risk Assessment**: Deal scores, BMV scores, and concentration risk

### 🎯 Investment Insights
- **Smart Recommendations**: AI-powered investment recommendations
- **Areas for Improvement**: Identify opportunities to optimize portfolio
- **Next Steps**: Prioritized action items for portfolio enhancement
- **Yield Analysis**: High, medium, and low yield property distribution

### 📈 Real-time Tracking
- **Value Updates**: Automatic current value calculations
- **Growth Tracking**: Monitor property appreciation over time
- **Rental Income**: Track monthly and annual rental yields
- **Equity Building**: Monitor equity growth and mortgage balances

## Technical Architecture

### Database Schema

The system uses a PostgreSQL database with the following main table:

```sql
portfolio_properties (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  address TEXT,
  postcode TEXT,
  house_number TEXT,
  property_type TEXT,
  bedrooms INTEGER,
  floor_area DECIMAL,
  epc_rating TEXT,
  purchase_price DECIMAL,
  current_value DECIMAL,
  purchase_date DATE,
  deal_score INTEGER,
  deal_rating TEXT,
  bmv_score INTEGER,
  rental_income DECIMAL,
  yield DECIMAL,
  equity DECIMAL,
  mortgage_balance DECIMAL,
  notes TEXT,
  status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### API Endpoints

#### Add Property to Portfolio
```http
POST /api/portfolio/add
Content-Type: application/json

{
  "address": "15 High Street",
  "postcode": "NE5 2PR",
  "houseNumber": "15",
  "propertyType": "Semi-detached",
  "bedrooms": 3,
  "purchasePrice": 185000,
  "currentValue": 210000,
  "dealScore": 78,
  "dealRating": "Good",
  "bmvScore": 75,
  "userId": "user-uuid"
}
```

#### Get Portfolio Properties
```http
GET /api/portfolio/add?userId=user-uuid
```

#### Get Portfolio Analytics
```http
GET /api/portfolio/analytics?userId=user-uuid
```

### Components

#### AddToPortfolioButton
A reusable component that can be integrated into any valuation or analysis page:

```tsx
<AddToPortfolioButton
  propertyData={{
    address: "15 High Street",
    postcode: "NE5 2PR",
    houseNumber: "15",
    propertyType: "Semi-detached",
    purchasePrice: 185000,
    currentValue: 210000,
    dealScore: 78,
    dealRating: "Good",
    bmvScore: 75
  }}
  className="bg-green-600 hover:bg-green-700"
  size="lg"
/>
```

#### PortfolioAnalytics
A comprehensive analytics dashboard component:

```tsx
<PortfolioAnalytics />
```

## Setup Instructions

### 1. Database Setup

Run the SQL script in your Supabase SQL editor:

```bash
# Copy the contents of scripts/setup-portfolio-database.sql
# and run it in your Supabase SQL editor
```

### 2. Environment Variables

Ensure the following environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Component Integration

#### For Deal Analysis Pages
Add the AddToPortfolioButton to your valuation results:

```tsx
import AddToPortfolioButton, { extractPropertyDataFromValuation } from './AddToPortfolioButton';

// In your component
<AddToPortfolioButton
  propertyData={extractPropertyDataFromValuation(valuationData)}
  className="bg-green-600 hover:bg-green-700"
/>
```

#### For Portfolio Pages
Add the PortfolioAnalytics component:

```tsx
import PortfolioAnalytics from './PortfolioAnalytics';

// In your component
<PortfolioAnalytics />
```

## Usage Examples

### Adding a Property from Valuation

1. Navigate to any valuation or deal analysis page
2. Complete the property analysis
3. Click the "Add to Portfolio" button
4. The property will be added with all relevant data

### Viewing Portfolio Analytics

1. Navigate to the Portfolio Tracker page
2. View comprehensive analytics across multiple tabs:
   - **Overview**: Key metrics and summary
   - **Performance**: Returns and top performers
   - **Diversification**: Property type and location distribution
   - **Risk Analysis**: Risk metrics and yield distribution
   - **Recommendations**: AI-powered investment advice

### Managing Properties

1. View all properties in your portfolio
2. Filter by status (active, sold, watching)
3. Update property details and notes
4. Track performance over time

## Analytics Features

### Performance Metrics
- **Total Return**: Capital growth + rental income
- **Annualized Return**: Time-weighted return calculation
- **Monthly Growth**: Month-over-month growth rate
- **Best/Worst Performers**: Top and bottom performing properties

### Diversification Analysis
- **Property Type Distribution**: Percentage allocation by property type
- **Location Distribution**: Geographic diversification
- **Yield Distribution**: High (>8%), medium (5-8%), low (<5%) yield properties

### Risk Assessment
- **Average Deal Score**: Portfolio-wide deal quality
- **Average BMV Score**: Below Market Value assessment
- **Portfolio Risk**: Low/medium/high risk classification
- **Concentration Risk**: Percentage in top 3 properties

### Smart Recommendations
- **Top Performers**: Best performing properties by metric
- **Areas for Improvement**: Specific suggestions for optimization
- **Next Steps**: Prioritized action items with impact assessment

## Security Features

### Row Level Security (RLS)
- Users can only access their own portfolio data
- Automatic data isolation by user ID
- Secure API endpoints with user authentication

### Data Validation
- Required field validation
- Data type checking
- Duplicate property prevention
- Input sanitization

## Performance Optimizations

### Database Indexes
- User ID indexing for fast queries
- Status-based filtering
- Property type and location indexing
- Date-based sorting optimization

### Caching Strategy
- Analytics data caching
- User session management
- Optimized API responses

## Future Enhancements

### Planned Features
- **Property Valuation Updates**: Automatic current value updates
- **Market Comparison**: Compare portfolio to market benchmarks
- **Export Functionality**: CSV/PDF portfolio reports
- **Mobile App**: Native mobile portfolio management
- **Integration APIs**: Connect with property management software

### Advanced Analytics
- **Predictive Modeling**: Future value predictions
- **Scenario Analysis**: What-if analysis for different market conditions
- **Tax Optimization**: Tax-efficient portfolio management
- **Refinancing Analysis**: Optimal refinancing opportunities

## Troubleshooting

### Common Issues

#### Property Not Adding
- Check user authentication
- Verify required fields are provided
- Ensure property doesn't already exist in portfolio

#### Analytics Not Loading
- Verify user ID is correct
- Check database permissions
- Ensure portfolio properties exist

#### Performance Issues
- Check database indexes
- Verify API response times
- Monitor user session state

### Support

For technical support or feature requests, please refer to the project documentation or contact the development team.

## Contributing

To contribute to the portfolio system:

1. Follow the existing code structure
2. Add comprehensive tests for new features
3. Update documentation for any changes
4. Ensure security best practices are followed
5. Test thoroughly before submitting changes

## License

This portfolio tracking system is part of the BMV Finder project and follows the same licensing terms. 