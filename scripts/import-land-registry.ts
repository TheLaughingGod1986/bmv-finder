import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { execute } from './db-utils';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

// Define the interface for the Land Registry data
interface LandRegistryRecord {
  id: string;
  price: number;
  date: string;
  postcode: string;
  propertyType: string;
  isNew: string;
  duration: string;
  paon: string;
  saon: string;
  street: string;
  locality: string;
  town: string;
  district: string;
  county: string;
  category: string;
  status: string;
}

// Path to the CSV file
const csvFilePath = path.join(process.cwd(), 'pp-complete.csv');

// Batch size for database inserts (reduced to avoid timeouts)
const BATCH_SIZE = 100;

async function createTable() {
  console.log('Creating table if not exists...');
  
  // First, drop the table if it exists to ensure a clean start
  try {
    await execute('DROP TABLE IF EXISTS property_sales');
    console.log('Dropped existing table');
  } catch (error) {
    console.log('No existing table to drop');
  }

  // Create the table with explicit data types and NOT NULL constraints
  await execute(`
    CREATE TABLE property_sales (
      id TEXT PRIMARY KEY NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL DEFAULT '',
      postcode TEXT NOT NULL DEFAULT '',
      property_type TEXT NOT NULL DEFAULT '',
      is_new_build TEXT NOT NULL DEFAULT '',
      duration TEXT NOT NULL DEFAULT '',
      paon TEXT NOT NULL DEFAULT '',
      saon TEXT NOT NULL DEFAULT '',
      street TEXT NOT NULL DEFAULT '',
      locality TEXT NOT NULL DEFAULT '',
      town TEXT NOT NULL DEFAULT '',
      district TEXT NOT NULL DEFAULT '',
      county TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT ''
    )
  `);
  
  console.log('Table created successfully with NOT NULL constraints and default values');
}

async function importData() {
  await createTable();

  console.log('Starting data import...');
  
  // Track progress
  let processed = 0;
  let batch: any[] = [];
  
  // Create a parser instance
  const parser = parse({
    delimiter: ',',
    quote: '"',
    relax_quotes: true,
    trim: true,
    columns: [
      'id', 'price', 'date', 'postcode', 'propertyType', 'isNew', 'duration',
      'paon', 'saon', 'street', 'locality', 'town', 'district', 'county', 'category', 'status'
    ],
    cast: (value, context) => {
      // Clean up the ID field
      if (context.column === 'id') {
        return value.replace(/[{}]/g, '');
      }
      // Convert price to number
      if (context.column === 'price') {
        return parseInt(value, 10) || 0;
      }
      // Clean up empty strings to null
      return value === '' ? null : value;
    }
  });

  // Process each record
  parser.on('readable', async () => {
    let record;
    while ((record = parser.read()) !== null) {
      batch.push(record);
      processed++;

      // Process batch when it reaches the batch size
      if (batch.length >= BATCH_SIZE) {
        await processBatch([...batch]);
        batch = [];
        console.log(`Processed ${processed} records...`);
      }
    }
  });

  // Process any remaining records in the last batch
  parser.on('end', async () => {
    if (batch.length > 0) {
      await processBatch(batch);
      console.log(`Processed final batch of ${batch.length} records`);
    }
    console.log(`Finished processing ${processed} records`);
  });

  // Handle errors
  parser.on('error', (error) => {
    console.error('CSV parsing error:', error);
    process.exit(1);
  });

  // Start reading the file
  createReadStream(csvFilePath).pipe(parser);
}

async function processBatch(batch: any[]) {
  if (batch.length === 0) return;

  // Prepare the SQL query with parameter placeholders
  const placeholders = batch.map((_, i) => 
    `(${Array(16).fill(0).map((_, j) => `$${i * 16 + j + 1}`).join(', ')})`
  ).join(', ');

  // Flatten the batch into a single array of values with proper type handling
  const values = batch.flatMap(record => {
    // Ensure all values are properly formatted
    const row = [
      record.id || '',
      record.price ? parseInt(record.price, 10) : 0, // Default to 0 for missing prices
      record.date || '',
      record.postcode || '',
      record.propertyType || '',
      record.isNew || '',
      record.duration || '',
      record.paon || '',
      record.saon || '',
      record.street || '',
      record.locality || '',
      record.town || '',
      record.district || '',
      record.county || '',
      record.category || '',
      record.status || ''
    ];
    
    // Convert all values to strings (Turso API expects strings or numbers)
    return row.map(val => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'number') return val;
      return String(val);
    });
  });

  // Create the SQL query with explicit type casting
  const query = `
    INSERT INTO property_sales (
      id, price, date, postcode, property_type, is_new_build, duration,
      paon, saon, street, locality, town, district, county, category, status
    ) VALUES ${placeholders}
    ON CONFLICT (id) DO NOTHING
  `;

  try {
    await execute(query, values);
  } catch (error) {
    console.error('Error inserting batch:', error);
    throw error;
  }
}

// Run the import
importData().catch(console.error);
