# DealScanner - BMV Property Finder

DealScanner is a modern web application that helps property investors find Below Market Value (BMV) opportunities by analyzing live property listings against recent sold price data and rental yields.

## 🚀 Features

### Core Functionality
- **Postcode-based Property Scanning**: Enter any UK postcode to scan for properties
- **Multi-Source Data**: Scrapes from Rightmove, Zoopla, and OnTheMarket
- **BMV Calculation**: Compares asking prices against recent sold prices
- **Rental Yield Analysis**: Calculates potential rental returns
- **Interactive Map View**: Visualize properties on an interactive map
- **Mobile-First Design**: Fully responsive across all devices

### Analysis Features
- **BMV Percentage**: Shows how much below market value each property is
- **Rental Yield**: Calculates annual rental yield based on estimated rent
- **Area Growth Trends**: Displays local market growth data
- **Confidence Levels**: Indicates data reliability (High/Medium/Low)
- **Property Comparison**: Compare multiple properties side-by-side

### User Interface
- **Grid View**: Card-based layout showing all properties
- **Map View**: Interactive map with property markers
- **Statistics Panel**: Summary of scan results and best deals
- **Real-time Updates**: Live data from property portals
- **Export Options**: Save and share property deals

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Maps**: React Leaflet with OpenStreetMap
- **Icons**: Lucide React
- **Charts**: Recharts (for future price trend visualization)
- **Scraping**: Puppeteer & Cheerio (for production scraping)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bmv-finder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── scan/
│   │       └── route.ts          # API endpoint for property scanning
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page component
├── components/
│   ├── PostcodeScanner.tsx       # Postcode input and scan functionality
│   ├── PropertyGrid.tsx          # Grid view of properties
│   ├── MapView.tsx               # Map view container
│   ├── MapComponent.tsx          # Leaflet map implementation
│   └── StatsPanel.tsx            # Statistics and summary panel
├── lib/
│   ├── scrapers/
│   │   ├── index.ts              # Scraper manager and interfaces
│   │   ├── rightmove.ts          # Rightmove scraper
│   │   ├── zoopla.ts             # Zoopla scraper
│   │   └── onthemarket.ts        # OnTheMarket scraper
│   └── bmv-calculator.ts         # BMV calculation logic
└── types/
    └── index.ts                  # TypeScript type definitions
```

## 🔧 Configuration

### Scraper Configuration
The app uses a modular scraper system that can be easily extended. Each scraper implements the `PropertyScraper` interface:

```typescript
interface PropertyScraper {
  scrapeProperties(postcode: string, config: ScraperConfig): Promise<Property[]>;
  scrapeSoldPrices(postcode: string): Promise<SoldPrice[]>;
  scrapeRentalData(postcode: string): Promise<RentalData[]>;
  scrapeAreaGrowth(postcode: string): Promise<AreaGrowthData>;
}
```

### BMV Calculation
The BMV calculator analyzes properties by:
1. Finding similar sold properties in the area
2. Calculating average sold prices
3. Computing BMV percentage and amount
4. Estimating rental yields
5. Determining confidence levels

## 🚀 Usage

1. **Enter a UK Postcode**: Use the search bar to input any valid UK postcode
2. **Click Scan**: The app will scrape multiple property sources
3. **View Results**: Browse properties in grid or map view
4. **Analyze Deals**: Check BMV percentages, rental yields, and confidence levels
5. **Save Favorites**: Mark properties for later review

## 🔮 Future Enhancements

### Planned Features
- **Email Alerts**: Daily notifications for new BMV opportunities
- **Price Trend Charts**: Historical price data visualization
- **Advanced Filters**: Price range, property type, bedroom count
- **Saved Searches**: Store and reuse search criteria
- **Export Functionality**: Download results as CSV/PDF
- **User Accounts**: Save favorite properties and searches
- **Real Scraping**: Replace mock data with actual web scraping
- **More Data Sources**: Add NetHousePrices.com and OpenRent integration

### Technical Improvements
- **Caching**: Implement Redis for faster repeated searches
- **Rate Limiting**: Add proper rate limiting for scrapers
- **Error Handling**: Enhanced error handling and retry logic
- **Testing**: Comprehensive unit and integration tests
- **Performance**: Optimize for large datasets and concurrent users

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This application is for educational and demonstration purposes. The current version uses mock data. For production use, ensure compliance with:
- Website terms of service for scraped sites
- Data protection regulations (GDPR)
- Rate limiting and respectful scraping practices
- Local property market regulations

## 🆘 Support

For support, email support@dealscanner.com or create an issue in the repository.

---

**Built with ❤️ for property investors**
