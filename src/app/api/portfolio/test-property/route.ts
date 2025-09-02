import { NextResponse } from 'next/server';
import { getDatabasePool } from '@/lib/database/connection';

export async function POST() {
  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    
    console.log('Testing property insertion...');
    
    try {
      // Try to insert a simple property
      const result = await client.query(
        'INSERT INTO properties (address, postcode, property_type, bedrooms, floor_area, epc_rating, estimated_value, rental_estimate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        ['Test Address', 'TEST 123', 'House', 3, 100, 'C', 200000, JSON.stringify({ monthly: 1000, yearly: 12000 })]
      );
      
      console.log('Property inserted successfully:', result.rows[0]);
      
      // Clean up - delete the test property
      await client.query('DELETE FROM properties WHERE address = $1 AND postcode = $2', ['Test Address', 'TEST 123']);
      
      return NextResponse.json({
        success: true,
        message: 'Property insertion test passed',
        data: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Property insertion test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Property insertion test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

