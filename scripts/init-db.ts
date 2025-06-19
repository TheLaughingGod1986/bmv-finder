import { execute } from './db-utils';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function createTables() {
  console.log('Creating database tables...');
  
  try {
    // Create the prices table
    await execute(`
      CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        price INTEGER NOT NULL,
        date_of_transfer TEXT NOT NULL,
        postcode TEXT,
        property_type TEXT,
        paon TEXT,
        saon TEXT,
        street TEXT,
        locality TEXT,
        town_city TEXT,
        district TEXT,
        county TEXT,
        ppd_category_type TEXT,
        record_status TEXT,
        duration TEXT,
        old_new TEXT
      )
    `);

    // Create an index on postcode for faster lookups
    await execute('CREATE INDEX IF NOT EXISTS idx_prices_postcode ON prices(postcode)');
    
    // Create an index on date for sorting
    await execute('CREATE INDEX IF NOT EXISTS idx_prices_date ON prices(date_of_transfer)');
    
    console.log('Database tables created successfully!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Run the script
createTables()
  .then(() => {
    console.log('Database initialization completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
