# Deal Analysis Algorithm Explanation

## Overview

The BMV Finder deal analysis algorithm provides a comprehensive assessment of whether a property represents a good investment opportunity. It combines multiple data sources and analytical methods to calculate a deal score from 0-100, where higher scores indicate better investment potential.

## Data Sources Used

### 1. **Property Enrichment Data** (EPC Register API)
- **Bedrooms**: Number of bedrooms
- **Floor Area**: Square meters of living space
- **EPC Rating**: Energy Performance Certificate rating (A-G)
- **Property Type**: Detached, semi-detached, terraced, etc.
- **Construction Year**: When the property was built
- **Energy Efficiency**: Current and potential energy ratings

### 2. **Sold Price Data** (UK Land Registry)
- **Historical Sales**: All recorded sales for the property
- **Sale Prices**: Actual transaction amounts
- **Sale Dates**: When each transaction occurred
- **Property Details**: Type, new build status, tenure
- **Transaction Type**: Standard, shared ownership, etc.

### 3. **House Price Index (HPI) Data** (ONS)
- **Regional HPI Values**: Monthly house price indices
- **HPI Changes**: Month-over-month percentage changes
- **Market Trends**: Rising, falling, or stable markets
- **Volatility Metrics**: Market stability indicators

### 4. **Market Insights** (Local Area Analysis)
- **Average Prices**: Mean property prices in the postcode area
- **Price per Square Meter**: Local market rates per sqm
- **Price per Bedroom**: Average cost per bedroom in the area
- **Sales Volume**: Number of recent transactions

## Algorithm Components

### 1. **HPI-Adjusted Value Calculation**

The algorithm calculates what the property should be worth today based on market inflation:

```
HPI Multiplier = Current HPI Value / HPI Value at Last Sale
HPI-Adjusted Value = Last Sold Price × HPI Multiplier
```

**Example:**
- Property sold for £200,000 in 2020
- HPI was 100 in 2020, now 120 in 2024
- HPI-Adjusted Value = £200,000 × (120/100) = £240,000

### 2. **Deal Score Calculation (0-100)**

The algorithm starts with a neutral score of 50 and adjusts based on multiple factors:

#### **A. HPI Comparison (±30 points)**
- **+30 points**: Sold >20% below HPI-adjusted value
- **+20 points**: Sold 10-20% below HPI-adjusted value  
- **+10 points**: Sold 0-10% below HPI-adjusted value
- **-20 points**: Sold 10-20% above HPI-adjusted value
- **-30 points**: Sold >20% above HPI-adjusted value

#### **B. Price per Square Meter Comparison (±20 points)**
- **+20 points**: >15% below local market average
- **-20 points**: >15% above local market average

#### **C. Price per Bedroom Comparison (±15 points)**
- **+15 points**: >15% below local market average
- **-15 points**: >15% above local market average

#### **D. EPC Rating Analysis (±10 points)**
- **+10 points**: A or B rating (energy efficient)
- **-10 points**: E, F, or G rating (needs improvements)

### 3. **Deal Rating Classification**

Based on the final score:
- **80-100**: Excellent Deal
- **60-79**: Good Deal  
- **40-59**: Fair Deal
- **20-39**: Poor Deal
- **0-19**: Overpriced

## Market Insights Analysis

### **Price Trends**
- **Rising**: HPI change >0.5% (positive market momentum)
- **Falling**: HPI change <-0.5% (declining market)
- **Stable**: HPI change between -0.5% and +0.5%

### **Market Volatility**
- **Low**: 6-month HPI changes total <2%
- **Medium**: 6-month HPI changes total 2-5%
- **High**: 6-month HPI changes total >5%

## Example Calculation

Let's analyze a property at "21 NE5 2PR":

### **Input Data:**
- **Last Sold**: £180,000 in 2022
- **Bedrooms**: 3
- **Floor Area**: 85 sqm
- **EPC Rating**: C
- **Local Average Price**: £200,000
- **Local Average Price/Sqm**: £2,500
- **Local Average Price/Bedroom**: £70,000

### **Calculations:**

1. **HPI Adjustment:**
   - HPI in 2022: 110, Current HPI: 125
   - HPI-Adjusted Value: £180,000 × (125/110) = £204,545
   - Difference: (£204,545 - £180,000) / £204,545 = 12% below market

2. **Price per Sqm:**
   - Property: £180,000 ÷ 85 sqm = £2,118/sq m
   - Market: £2,500/sq m
   - Difference: (£2,500 - £2,118) / £2,500 = 15.3% below market

3. **Price per Bedroom:**
   - Property: £180,000 ÷ 3 = £60,000/bedroom
   - Market: £70,000/bedroom
   - Difference: (£70,000 - £60,000) / £70,000 = 14.3% below market

### **Score Calculation:**
- **Starting Score**: 50
- **HPI Comparison**: +20 points (12% below market)
- **Price per Sqm**: +20 points (15.3% below market)
- **Price per Bedroom**: +15 points (14.3% below market)
- **EPC Rating**: 0 points (C rating is neutral)
- **Final Score**: 50 + 20 + 20 + 15 = 105 → Clamped to 100

### **Result:**
- **Deal Score**: 100/100
- **Deal Rating**: Excellent
- **Analysis**: "Property sold 12% below HPI-adjusted value - good deal", "Price per sqm is 15.3% below market average", "Price per bedroom is 14.3% below market average"

## Accuracy Factors

### **Strengths:**
1. **Multi-source validation**: Combines 4 different data sources
2. **Market-adjusted pricing**: Uses HPI to account for market inflation
3. **Local market comparison**: Compares against actual local sales
4. **Property-specific factors**: Considers bedrooms, size, and energy efficiency
5. **Temporal analysis**: Accounts for when the property was last sold

### **Limitations:**
1. **Data availability**: Requires recent sales data and EPC information
2. **Market timing**: Doesn't account for seasonal variations
3. **Property condition**: Doesn't factor in renovation needs
4. **Location nuances**: Doesn't consider specific street desirability
5. **Future potential**: Doesn't predict future market changes

## Use Cases

### **For Investors:**
- Identify undervalued properties
- Assess investment potential
- Compare multiple properties
- Understand market positioning

### **For Buyers:**
- Determine fair market value
- Avoid overpaying
- Negotiate better prices
- Understand property value drivers

### **For Sellers:**
- Price properties competitively
- Understand market positioning
- Identify improvement opportunities
- Maximize sale value

## Technical Implementation

The algorithm is implemented as a Node.js API endpoint that:
1. Fetches data from multiple sources concurrently
2. Performs calculations using TypeScript for type safety
3. Returns structured JSON with detailed analysis
4. Handles errors gracefully with fallback values
5. Provides comprehensive logging for debugging

This creates a robust, scalable system for property deal analysis that can handle high volumes of requests while maintaining accuracy and reliability. 