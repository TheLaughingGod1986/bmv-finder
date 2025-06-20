import { NextResponse } from 'next/server';
import { execute, getRows } from '../../../../lib/turso-rest';

// Helper to log environment variables (without exposing sensitive data)
const logEnvironment = () => {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'set' : 'not set',
  };
  console.log('Environment:', env);
  return env;
};

// Helper function to safely execute SQL and return results
interface SafeExecuteResult {
  success: boolean;
  result?: {
    rows: any[];
    rowsAffected: number;
  };
  error?: string;
  sql?: string;
}

async function safeExecute(sql: string, params: any[] = []): Promise<SafeExecuteResult> {
  try {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await getRows(sql, params);
      return {
        success: true,
        result: {
          rows,
          rowsAffected: rows.length
        }
      };
    } else {
      const rowsAffected = await execute(sql, params);
      return {
        success: true,
        result: {
          rows: [],
          rowsAffected
        }
      };
    }
  } catch (error) {
    console.error('SQL Error:', { sql, error });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      sql
    };
  }
}

export async function GET() {
  try {
    // Log environment variables (safely)
    const envVars = logEnvironment();

    // Test database connection with a simple query
    console.log('Testing database connection...');
    const connectionTest = await safeExecute('SELECT 1 as test');
    console.log('Connection test result:', {
      success: connectionTest.success,
      error: connectionTest.error,
      rows: connectionTest.result?.rows?.length || 0
    });
    
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.error}`);
    }
    console.log('Database connection successful');

    // Create test table if it doesn't exist
    console.log('Creating test table...');
    const createTableResult = await safeExecute(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Create table result:', {
      success: createTableResult.success,
      error: createTableResult.error,
      rowsAffected: createTableResult.result?.rowsAffected
    });

    if (!createTableResult.success) {
      throw new Error(`Failed to create table: ${createTableResult.error}`);
    }
    console.log('Test table created or already exists');

    // Insert a test record
    console.log('Inserting test record...');
    const testRecord = { name: 'Test from Next.js' };
    const insertResult = await safeExecute(
      'INSERT INTO test_table (name) VALUES (?)',
      [testRecord.name]
    );

    console.log('Insert result:', {
      success: insertResult.success,
      error: insertResult.error,
      rowsAffected: insertResult.result?.rowsAffected
    });

    if (!insertResult.success) {
      throw new Error(`Failed to insert test data: ${insertResult.error}`);
    }
    console.log('Test record inserted');

    // Query the test records
    console.log('Querying test records...');
    const queryResult = await safeExecute('SELECT * FROM test_table');
    
    if (!queryResult.success || !queryResult.result) {
      throw new Error(`Failed to query test data: ${queryResult.error || 'No result returned'}`);
    }

    // The rows should already be properly formatted by the Turso client
    const rows = queryResult.result.rows;
    
    console.log('Query result:', {
      rowCount: rows.length,
      firstRow: rows.length > 0 ? rows[0] : 'No rows returned'
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        rows,
        rowCount: rows.length,
        sampleRow: rows.length > 0 ? rows[0] : null
      },
      timestamp: new Date().toISOString(),
      env: envVars
    });
  } catch (error: unknown) {
    console.error('Error in test route:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorStack = process.env.NODE_ENV === 'development' && error instanceof Error 
      ? error.stack 
      : undefined;
      
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        ...(errorStack && { stack: errorStack }),
        env: {
          DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
          TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'set' : 'not set',
          NODE_ENV: process.env.NODE_ENV || 'development'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ ok: true });
}