# UK Sold Property Prices.

A modern, mobile-friendly web application to search and view recent sold property prices from the UK Land Registry.

## Features

- **Real Land Registry Data**: Uses official UK Land Registry Price Paid Data
- **Postcode Search**: Search for sold prices by UK postcode
- **Local Database**: Stores data in Turso for fast queries
- **Automated Updates**: Monthly updates with incremental imports
- **Modern UI**: Clean, responsive design with mobile-friendly cards
- **Rich Data Display**: Property type, duration, new/existing status, and more
- **Progressive Web App (PWA)**: Installable on mobile devices with offline support

## Progressive Web App (PWA)

This application is a Progressive Web App that can be installed on mobile devices and desktop computers.

### PWA Features

- **Installable**: Add to home screen on iOS and Android
- **Offline Support**: Basic offline functionality with service worker
- **App-like Experience**: Full-screen mode when installed
- **Automatic Updates**: Updates automatically when new versions are available

### How to Install

#### On Mobile (iOS):
1. Open the website in Safari
2. Tap the Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

#### On Mobile (Android):
1. Open the website in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen"
4. Tap "Add"

#### On Desktop (Chrome/Edge):
1. Look for the install icon in the address bar
2. Click "Install" when prompted

### PWA Configuration

The PWA is configured with:
- **Manifest**: `public/manifest.json` - Defines app appearance and behavior
- **Service Worker**: `public/sw.js` - Handles caching and offline functionality
- **Icons**: Multiple sizes for different devices and contexts
- **Meta Tags**: Proper PWA meta tags in the HTML head

### Generating Icons

To regenerate the PWA icons:

```bash
npm run generate-icons
```

This will create:
- `icon-192.png` - 192x192 icon for Android
- `icon-512.png` - 512x512 icon for Android
- `favicon-32x32.png` - 32x32 favicon
- `favicon-16x16.png` - 16x16 favicon

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bmv-finder
```

2. Install dependencies:
```bash
npm install
```

3. Download and import Land Registry data (initial import):
```bash
npm run import:land-registry
```

4. For subsequent updates (monthly):
```bash
npm run update:land-registry
```

5. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Search for Sold Prices**: Enter a UK postcode and click "Get Sold Prices"
2. **View Results**: See recent sold prices in a modern, responsive table
3. **Mobile Experience**: Cards automatically display on mobile devices
4. **Update Data**: Click "Update Land Registry Data" to download the latest data

## Data Updates

### Initial Import

For the first run, use the full import script which downloads and imports the complete dataset:

```bash
npm run import:land-registry
```

### Monthly Updates

After the initial import, you can use the update script to fetch only the latest changes. This is much faster as it only downloads the monthly update file:

```bash
npm run update:land-registry
```

### Automation

To keep your data up to date, you can set up a monthly cron job to run the update script. Here's an example using `crontab` to run on the 25th of each month:

```bash
# Add this to your crontab
0 0 25 * * cd /path/to/bmv-finder && npm run update:land-registry
```

### Update Schedule

The UK Land Registry typically publishes updates around the 20th of each month, containing data from about 2 months prior. The update script is designed to automatically detect and download the latest available update.

## Automated Updates

The application includes automated daily updates of Land Registry data:

### GitHub Actions (Recommended)
- Automatically runs daily at 2 AM UTC
- Updates the database and commits changes
- No server setup required

### Manual Cron Setup
If you prefer to run updates on your own server:

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * /usr/bin/node /path/to/your/project/cron-update.js
```

### Environment Variables
- `UPDATE_URL`: URL of your update endpoint (default: http://localhost:3000/api/update-land-registry)
- `LOG_FILE`: Path to log file (default: ./update-logs.txt)

## Data Display

The application shows comprehensive property information:

- **Address**: Full property address with postcode
- **Property Type**: Detached, Semi-detached, Terraced, Flat/Maisonette
- **Duration**: Freehold or Leasehold
- **Status**: New Build or Existing property
- **Sale Date**: Date of the transaction
- **Price**: Sale price in GBP

## Data Source

This application uses the official UK Land Registry Price Paid Data, which includes:
- Property sale prices
- Transaction dates
- Property addresses and types
- Freehold/Leasehold information
- New/Existing property status

The data is updated monthly by the Land Registry and can be refreshed automatically or manually.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── scan/route.ts                    # API endpoint for postcode searches
│   │   └── update-land-registry/route.ts    # API endpoint for data updates
│   ├── page.tsx                             # Main application page
│   ├── layout.tsx                           # App layout
│   └── globals.css                          # Global styles
├── import_land_registry.js                  # Script to download and import data
├── query_land_registry.js                   # CLI tool for testing queries
├── cron-update.js                           # Automated update script
└── .github/workflows/
    └── daily-update.yml                     # GitHub Actions workflow
```

## Technologies Used

- **Next.js 13** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Modern, responsive styling
- **SQLite** - Local database
- **GitHub Actions** - Automated updates
- **Land Registry API** - Official UK property data

## Database

This project uses Turso (SQLite) for data storage. The database connection is configured via environment variables in the `.env` file.

## License

This project is for educational purposes. Please respect the Land Registry's terms of use for their data.

## Contributing

We welcome contributions! To get started:

- Fork the repository and create a new branch for your feature or fix.
- Run `npm run lint` and `npm run type-check` before opening a pull request.
- Please ensure your code is clean, readable, and well-documented.
- Open a pull request with a clear description of your changes.

Thank you for helping improve this project!

## Automatic Daily Deployment

The app automatically updates with fresh Land Registry data every day at 2 AM UTC via GitHub Actions. This ensures:

- ✅ Fresh property data daily
- ✅ Automatic rate limit reset handling
- ✅ Complete dataset population (all UK properties since 1995)
- ✅ Zero downtime deployments

### How it works:

1. **Daily Schedule**: GitHub Actions runs at 2 AM UTC (when Upstash rate limits reset)
2. **Data Download**: Downloads the latest complete Land Registry dataset (~5GB)
3. **Deployment**: Deploys the updated app to Vercel
4. **Population**: Triggers the KV population API to load all properties into Redis
5. **Verification**: Tests the population with sample postcodes

### Manual Trigger

You can also manually trigger the daily population:
1. Go to your GitHub repository
2. Navigate to Actions → "Daily KV Population"
3. Click "Run workflow"

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Vercel KV credentials

# Run development server
npm run dev
```

## Environment Variables

Create a `.env.local` file with:

```env
KV_URL=your_vercel_kv_url
KV_REST_API_URL=your_vercel_kv_rest_url
KV_REST_API_TOKEN=your_vercel_kv_token
KV_REST_API_READ_ONLY_TOKEN=your_vercel_kv_read_token
```

## GitHub Actions Setup

To enable automatic daily deployment, add these secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run lint && npm run type-check`
5. Submit a pull request

## License

MIT
