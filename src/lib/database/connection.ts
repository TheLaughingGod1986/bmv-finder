import { Pool } from 'pg';
import { databaseConfig } from './config';

// Database connection pool
let pool: Pool | null = null;

export function getDatabasePool(): Pool {
  if (!pool) {
    pool = new Pool(databaseConfig);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  
  return pool;
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await getDatabasePool().connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Check if required tables exist
export async function checkTablesExist(): Promise<{ exists: boolean; missingTables: string[] }> {
  try {
    const client = await getDatabasePool().connect();
    
    // Check if required tables exist
    const requiredTables = ['users', 'portfolios', 'properties', 'portfolio_properties'];
    const missingTables: string[] = [];
    
    for (const table of requiredTables) {
      const result = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
        [table]
      );
      
      if (!result.rows[0].exists) {
        missingTables.push(table);
      }
    }
    
    client.release();
    
    return {
      exists: missingTables.length === 0,
      missingTables
    };
  } catch (error) {
    console.error('Error checking tables:', error);
    return {
      exists: false,
      missingTables: ['Error checking tables']
    };
  }
}
