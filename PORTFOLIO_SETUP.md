# Portfolio Management System Setup

This guide will help you set up the portfolio management system for BMV Finder.

## Prerequisites

1. **PostgreSQL Database** - You need a PostgreSQL database running locally or remotely
2. **Node.js** - Version 16 or higher
3. **npm** - For package management

## Database Setup

### Option 1: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**:
   ```bash
   createdb bmv_finder
   ```

3. **Set Environment Variables** (create a `.env.local` file in your project root):
   ```bash
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=bmv_finder
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   ```

### Option 2: Remote PostgreSQL

If using a remote database (e.g., AWS RDS, Heroku Postgres), update your environment variables accordingly.

## Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Test Database Connection**:
   ```bash
   node scripts/test-db.js
   ```

   This script will:
   - Test the database connection
   - Create the portfolio tables if they don't exist
   - Show you what's missing if there are issues

## Database Schema

The system creates the following tables:

- **users** - User accounts and authentication
- **portfolios** - Portfolio definitions
- **properties** - Property information
- **portfolio_properties** - Properties within portfolios
- **portfolio_performance** - Performance tracking and snapshots

## API Endpoints

### Portfolio Management
- `GET /api/portfolio/portfolios` - List user portfolios
- `POST /api/portfolio/portfolios` - Create new portfolio
- `GET /api/portfolio/portfolios/[id]` - Get portfolio details
- `PUT /api/portfolio/portfolios/[id]` - Update portfolio
- `DELETE /api/portfolio/portfolios/[id]` - Delete portfolio

### Portfolio Properties
- `GET /api/portfolio/portfolios/[id]/properties` - List properties in portfolio
- `POST /api/portfolio/portfolios/[id]/properties` - Add property to portfolio
- `PUT /api/portfolio/portfolios/[id]/properties/[propertyId]` - Update portfolio property
- `DELETE /api/portfolio/portfolios/[id]/properties/[propertyId]` - Remove property from portfolio

### Portfolio Performance
- `GET /api/portfolio/portfolios/[id]/performance` - Get portfolio performance
- `POST /api/portfolio/portfolios/[id]/performance` - Save performance snapshot

## Usage

1. **Start the Development Server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Portfolio Management**:
   - Go to `/portfolio` to manage portfolios
   - Go to `/portfolio/discover` to find properties
   - Use the Property Discovery system to add properties to portfolios

3. **Create Your First Portfolio**:
   - Click "Create New Portfolio"
   - Give it a name and description
   - Start adding properties

## Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Check if PostgreSQL is running
   - Verify database credentials
   - Ensure database exists

2. **Tables Not Created**:
   - Run the test script: `node scripts/test-db.js`
   - Check database permissions

3. **Port Already in Use**:
   - Change the port in your environment variables
   - Or kill existing processes using the port

### Getting Help

If you encounter issues:
1. Check the console for error messages
2. Verify your database connection
3. Ensure all environment variables are set correctly

## Next Steps

Once the basic setup is working:

1. **User Authentication** - Implement real user login/signup
2. **Data Validation** - Add more robust input validation
3. **Performance Optimization** - Add caching and database indexing
4. **Real-time Updates** - Implement WebSocket connections for live updates
5. **Advanced Analytics** - Add more sophisticated portfolio analysis tools

## Development Notes

- The system currently uses a mock user ID for development
- All database operations are logged for debugging
- The Property Discovery system integrates with existing APIs
- Portfolio performance calculations are based on property valuations and market data
