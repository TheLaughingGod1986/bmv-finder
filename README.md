# UK Property Prices - Modern Property Search App

A modern, user-friendly web application for searching and analyzing UK sold property prices using official Land Registry data. Built with Next.js 15, TypeScript, and Tailwind CSS.

## ✨ Features

### 🔍 **Smart Search**
- **Postcode Search**: Full and partial postcode matching
- **Street & Town Search**: Search by street names, towns, or cities
- **Smart Suggestions**: Popular areas and search tips
- **Real-time Results**: Instant search with loading states

### 📊 **Rich Data Display**
- **Property Details**: Address, price, date, type, tenure
- **BMV Scoring**: Below Market Value analysis for investment insights
- **Price History**: Track property value changes over time
- **Similar Properties**: Compare with nearby sales

### 📈 **Analytics & Charts**
- **Price Trends**: Yearly average price charts
- **Market Analysis**: Sales volume and property type distribution
- **Interactive Visualizations**: Responsive charts and graphs
- **Export Data**: Download results as CSV

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Progressive Web App**: Installable with offline support
- **Smooth Animations**: Framer Motion powered transitions
- **Accessibility**: WCAG compliant with keyboard navigation

### 🔧 **Advanced Features**
- **Filtering**: By property type, tenure, price range, date
- **Sorting**: Multiple sort options with visual indicators
- **Pagination**: Efficient data loading
- **Real-time Updates**: Latest Land Registry data

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bmv-finder
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Add your Elasticsearch credentials
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety and better development experience
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful, consistent icons

### Backend
- **Elasticsearch**: High-performance search engine
- **UK Land Registry Data**: Official property sales data
- **RESTful APIs**: Clean, documented API endpoints

### Data Processing
- **BMV Scoring**: Proprietary algorithm for investment analysis
- **Real-time Updates**: Automated data refresh
- **Data Validation**: Comprehensive error handling

## 📱 User Experience Improvements

### Search Experience
- **Smart Suggestions**: Popular areas with categories
- **Search Tips**: Helpful guidance for better results
- **Loading States**: Clear feedback during searches
- **Error Handling**: Friendly error messages with solutions

### Results Display
- **Summary Cards**: Key insights at a glance
- **Filtering System**: Easy-to-use filters with visual feedback
- **Sorting Options**: Multiple ways to organize results
- **Pagination**: Smooth navigation through large datasets

### Mobile Optimization
- **Touch-Friendly**: Optimized for mobile interactions
- **Responsive Design**: Adapts to all screen sizes
- **PWA Features**: Installable app experience
- **Fast Loading**: Optimized performance

## 🎯 Key Improvements Made

### 1. **Enhanced Search Interface**
- Added search suggestions with categories
- Improved search tips and guidance
- Better error handling and user feedback
- Keyboard navigation support

### 2. **Improved Empty States**
- Helpful explanations when no results found
- Suggested alternatives and popular areas
- Clear action buttons for next steps
- Educational content about search strategies

### 3. **Better Visual Design**
- Consistent color scheme and typography
- Smooth animations and transitions
- Modern card-based layouts
- Improved spacing and visual hierarchy

### 4. **Enhanced User Guidance**
- BMV legend explaining the scoring system
- Tooltips and help text throughout the app
- Clear labeling and intuitive navigation
- Progressive disclosure of complex features

### 5. **Performance Optimizations**
- Dynamic imports for better loading
- Optimized bundle size
- Efficient data processing
- Responsive image loading

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Data Management
npm run populate-es  # Import Land Registry data
npm run update-es    # Update with latest data
```

### Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   ├── components/          # React components
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── lib/
│   ├── esClient.ts         # Elasticsearch client
│   ├── bmvScoreEngine.ts   # BMV scoring logic
│   └── utils.ts            # Utility functions
└── types/
    └── sold-price.d.ts     # TypeScript types
```

## 📊 Data Source

This application uses the official UK Land Registry Price Paid Data, which includes:
- Property sale prices and dates
- Property addresses and types
- Freehold/Leasehold information
- New/Existing property status

The data is updated monthly and contains over 30 million property transactions.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- UK Land Registry for providing the data
- Next.js team for the amazing framework
- Tailwind CSS for the utility-first approach
- All contributors and users

---

**Built with ❤️ for the UK property market**
