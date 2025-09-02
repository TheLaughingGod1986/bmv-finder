import { NextResponse } from 'next/server';
import { testConnection, checkTablesExist } from '@/lib/database/connection';
import { getDatabasePool } from '@/lib/database/connection';

export async function GET() {
  try {
    // Test database connection
    const connectionOk = await testConnection();
    
    if (!connectionOk) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed'
      }, { status: 500 });
    }
    
    // Check if tables exist
    const tableCheck = await checkTablesExist();
    
    // Check if the mock user exists
    const pool = getDatabasePool();
    const client = await pool.connect();
    
    let userCheck = { exists: false, user: null };
    try {
      const userResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        ['550e8400-e29b-41d4-a716-446655440000']
      );
      
      if (userResult.rows.length > 0) {
        userCheck = { exists: true, user: userResult.rows[0] };
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      client.release();
    }
    
    return NextResponse.json({
      success: true,
      data: {
        connection: 'OK',
        tables: tableCheck,
        user: userCheck
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database test failed'
    }, { status: 500 });
  }
}
