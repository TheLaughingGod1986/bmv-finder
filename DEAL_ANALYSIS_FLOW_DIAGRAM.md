# Deal Analysis Algorithm Flow Diagram

## Data Collection Phase

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROPERTY ADDRESS INPUT                       │
│                    (House Number + Postcode)                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONCURRENT DATA FETCHING                     │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   EPC API    │    │Land Registry │    │   HPI API    │
│              │    │              │    │              │
│ • Bedrooms   │    │ • Sold Price │    │ • HPI Value  │
│ • Floor Area │    │ • Sale Date  │    │ • HPI Change │
│ • EPC Rating │    │ • Property   │    │ • Region     │
│ • Property   │    │   Type       │    │ • Market     │
│   Type       │    │ • Transaction│    │   Trend      │
└──────────────┘    │   Type       │    └──────────────┘
        │           └──────────────┘            │
        │                       │               │
        ▼                       ▼               ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Property     │    │ Sold Price   │    │ HPI Data     │
│ Enrichment   │    │ Data         │    │              │
│ Data         │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Analysis Phase

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKET INSIGHTS CALCULATION                  │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Average      │    │ Price per    │    │ Price per    │
│ Price        │    │ Square Meter │    │ Bedroom      │
│              │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HPI-ADJUSTED VALUE CALCULATION               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  HPI Multiplier = Current HPI / HPI at Last Sale               │
│  HPI-Adjusted Value = Last Sold Price × HPI Multiplier         │
└─────────────────────────────────────────────────────────────────┘
```

## Scoring Phase

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEAL SCORE CALCULATION                       │
│                    (Starting Score: 50)                         │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ HPI          │    │ Price per    │    │ Price per    │
│ Comparison   │    │ Square Meter │    │ Bedroom      │
│              │    │ Comparison   │    │ Comparison   │
│ ±30 points   │    │              │    │              │
│              │    │ ±20 points   │    │ ±15 points   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                       │               │
        └───────────────────────┼───────────────┘
                                │
                                ▼
┌──────────────┐
│ EPC Rating   │
│ Analysis     │
│              │
│ ±10 points   │
└──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SCORE CLAMPING (0-100)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEAL RATING CLASSIFICATION                   │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 80-100       │    │ 60-79        │    │ 40-59        │
│ Excellent    │    │ Good         │    │ Fair         │
└──────────────┘    └──────────────┘    └──────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 20-39        │    │ 0-19         │    │              │
│ Poor         │    │ Overpriced   │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Output Phase

```
┌─────────────────────────────────────────────────────────────────┐
│                    FINAL ANALYSIS OUTPUT                        │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Deal         │    │ Market       │    │ Property     │
│ Metrics      │    │ Insights     │    │ Details      │
│              │    │              │    │              │
│ • Score      │    │ • Price      │    │ • Bedrooms   │
│ • Rating     │    │   Trend      │    │ • Floor Area │
│ • Analysis   │    │ • Volatility │    │ • EPC Rating │
│ • HPI Value  │    │ • Averages   │    │ • Type       │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Data Flow Summary

1. **Input**: House number + postcode
2. **Data Collection**: Fetch from 3 APIs concurrently
3. **Market Analysis**: Calculate local averages and trends
4. **HPI Adjustment**: Account for market inflation
5. **Scoring**: Apply weighted scoring algorithm
6. **Classification**: Determine deal rating
7. **Output**: Comprehensive analysis report

## Key Algorithms

### HPI Adjustment Formula
```
HPI_Adjusted_Value = Last_Sold_Price × (Current_HPI / HPI_at_Sale_Date)
```

### Deal Score Formula
```
Deal_Score = 50 + HPI_Points + Sqm_Points + Bedroom_Points + EPC_Points
Deal_Score = Math.max(0, Math.min(100, Deal_Score))
```

### Price per Square Meter
```
Price_per_Sqm = Property_Price / Floor_Area_m2
```

### Price per Bedroom
```
Price_per_Bedroom = Property_Price / Number_of_Bedrooms
```

This flow ensures accurate, data-driven property deal analysis using multiple validation sources and market-adjusted calculations. 