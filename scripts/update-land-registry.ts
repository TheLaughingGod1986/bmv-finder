import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';
import { parse } from 'csv-parse';
import { execute, getRows } from './db-utils';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as https from 'https';
import * as fs from 'fs/promises';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

interface LandRegistryRecord {
  id: string;
  price: string;
  date: string;
  postcode: string;
  propertyType: string;
  isNewBuild: string;
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

// Base URL for Land Registry monthly updates
const BASE_URL = 'https://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-monthly-update';

// Get the current date for the update
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');

// The Land Registry data is typically 2 months behind
let updateMonth = now.getMonth() - 1;
let updateYear = currentYear;
if (updateMonth < 0) {
  updateMonth = 11;
  updateYear--;
}

const monthStr = (updateMonth + 1).toString().padStart(2, '0');
const yearStr = updateYear.toString().slice(-2);
const filename = `${yearStr}-${monthStr}-pp-monthly-update-new-version.csv`;
const fileUrl = `${BASE_URL}/${currentYear}/${filename}`;
const tempFilePath = path.join(process.cwd(), 'temp-update.csv');

// Track stats
let stats = {
  totalProcessed: 0,
  newRecords: 0,
  updatedRecords: 0,
  errors: 0
};

async function downloadFile(url: string, dest: string, maxRetries = 3, retryDelay = 5000): Promise<void> {
  console.log(`Downloading update file from ${url}...`);
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Download attempt ${attempt} of ${maxRetries}...`);
      
      await new Promise<void>((resolve, reject) => {
        const file = createWriteStream(dest);
        
        const request = https.get(url, response => {
          if (response.statusCode === 404) {
            reject(new Error(`Update file not found (404). The data for this month may not be available yet.`));
            return;
          }
          
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}`));
            return;
          }
          
          const stream = response.pipe(file);
          
          stream.on('finish', () => {
            console.log('Download completed successfully');
            resolve();
          });
          
          stream.on('error', (error) => {
            reject(error);
          });
        });
        
        request.on('error', (error) => {
          reject(error);
        });
        
        // Set a timeout for the request (30 seconds)
        request.setTimeout(30000, () => {
          request.destroy(new Error('Request timeout'));
        });
      });
      
      // If we get here, download was successful
      return;
      
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;
      console.error(`Download attempt ${attempt} failed:`, err.message);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      // Increase delay for next retry (exponential backoff)
      retryDelay *= 2;
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw new Error(`Failed to download file after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

async function processUpdateFile(filePath: string): Promise<void> {
  console.log('Processing update file...');
  
  // Create a read stream and parse the CSV
  const parser = createReadStream(filePath).pipe(
    parse({
      columns: [
        'id', 'price', 'date', 'postcode', 'propertyType', 'isNewBuild',
        'duration', 'paon', 'saon', 'street', 'locality', 'town', 'district',
        'county', 'category', 'status'
      ],
      skip_empty_lines: true,
      trim: true,
      cast: (value, context) => {
        if (context.column === 'price') return parseInt(value, 10) || 0;
        return value || '';
      }
    })
  );
  
  let batch: LandRegistryRecord[] = [];
  const BATCH_SIZE = 100;
  
  for await (const record of parser) {
    stats.totalProcessed++;
    batch.push(record);
    
    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
    }
    
    // Log progress every 1000 records
    if (stats.totalProcessed % 1000 === 0) {
      console.log(`Processed ${stats.totalProcessed} records...`);
    }
  }
  
  // Process any remaining records
  if (batch.length > 0) {
    await processBatch(batch);
  }
  
  console.log('Finished processing update file');
}

async function processBatch(batch: LandRegistryRecord[]): Promise<void> {
  if (batch.length === 0) return;
  
  // Prepare the SQL query with parameter placeholders
  const placeholders = batch.map((_, i) => 
    `(${Array(16).fill(0).map((_, j) => `$${i * 16 + j + 1}`).join(', ')})`
  ).join(', ');
  
  // Flatten the batch into a single array of values with proper type handling
  const values = batch.flatMap(record => {
    const row = [
      record.id || '',
      record.price ? parseInt(record.price.toString(), 10) : 0,
      record.date || '',
      record.postcode || '',
      record.propertyType || '',
      record.isNewBuild || '',
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
    
    return row.map(val => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'number') return val;
      return String(val);
    });
  });
  
  const query = `
    INSERT INTO property_sales (
      id, price, date, postcode, property_type, is_new_build, duration,
      paon, saon, street, locality, town, district, county, category, status
    ) VALUES ${placeholders}
    ON CONFLICT (id) DO UPDATE SET
      price = EXCLUDED.price,
      date = EXCLUDED.date,
      postcode = EXCLUDED.postcode,
      property_type = EXCLUDED.property_type,
      is_new_build = EXCLUDED.is_new_build,
      duration = EXCLUDED.duration,
      paon = EXCLUDED.paon,
      saon = EXCLUDED.saon,
      street = EXCLUDED.street,
      locality = EXCLUDED.locality,
      town = EXCLUDED.town,
      district = EXCLUDED.district,
      county = EXCLUDED.county,
      category = EXCLUDED.category,
      status = EXCLUDED.status
  `;
  
  try {
    const result = await execute(query, values);
    stats.newRecords += result;
  } catch (error) {
    console.error('Error processing batch:', error);
    stats.errors += batch.length;
  }
}

async function checkLatestUpdate(): Promise<Date | null> {
  try {
    const result = await getRows('SELECT MAX(date) as latest_date FROM property_sales');
    if (result.length > 0 && result[0].latest_date) {
      return new Date(result[0].latest_date);
    }
  } catch (error) {
    console.error('Error checking latest update:', error);
  }
  return null;
}

async function checkFileExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = https.get(url, { method: 'HEAD' }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.end();
  });
}

async function main() {
  console.log('Starting Land Registry data update...');

  try {
    // Check the last update date
    const lastUpdate = await checkLatestUpdate();
    console.log(`Last update in database: ${lastUpdate || 'No records found'}`);

    // Check if we already have the latest data
    const updateDate = new Date(updateYear, updateMonth, 1);
    if (lastUpdate && new Date(lastUpdate) >= updateDate) {
      console.log('Database is already up to date.');
      return { success: true, message: 'Database is already up to date' };
    }

    console.log(`Checking for update for ${monthStr}/${updateYear}...`);
    
    // First check if the file exists
    const fileExists = await checkFileExists(fileUrl);
    if (!fileExists) {
      const message = `Update file not found at ${fileUrl}. The data for this month may not be available yet.`;
      console.warn(message);
      return { success: false, message };
    }

    console.log(`Downloading update for ${monthStr}/${updateYear}...`);
    await downloadFile(fileUrl, tempFilePath);
    
    console.log('Processing update file...');
    await processUpdateFile(tempFilePath);
    
    const result = {
      success: true,
      message: 'Update completed successfully',
      stats: {
        totalProcessed: stats.totalProcessed,
        newRecords: stats.newRecords,
        updatedRecords: stats.updatedRecords,
        errors: stats.errors
      }
    };
    
    console.log('\nUpdate completed successfully!');
    console.log(`Total records processed: ${stats.totalProcessed}`);
    console.log(`New records added: ${stats.newRecords}`);
    console.log(`Records updated: ${stats.updatedRecords}`);
    console.log(`Errors: ${stats.errors}`);
    
    return result;
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error during update:', errorMessage);
    return { 
      success: false, 
      message: 'Update failed',
      error: errorMessage
    };
  } finally {
    // Clean up the temporary file if it exists
    try {
      await fs.unlink(tempFilePath).catch(() => {});
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
}

// Helper function to create a read stream that handles gzipped files
function createReadStream(filePath: string) {
  return filePath.endsWith('.gz') 
    ? require('fs').createReadStream(filePath).pipe(createGunzip())
    : require('fs').createReadStream(filePath);
}

// Run the update
main().catch(console.error);
