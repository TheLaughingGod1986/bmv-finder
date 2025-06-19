import { NextResponse } from 'next/server';
import { getRows } from '../../../../../lib/turso-rest';

export async function GET() {
  try {
    // Check if the prices table exists
    const tables = await getRows(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='prices'"
    ) as { name: string }[];

    if (tables.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'The "prices" table does not exist in the database.' 
      });
    }

    // Get the count of records in the prices table
    const countResult = await getRows("SELECT COUNT(*) as count FROM prices") as { count: number }[];
    const recordCount = countResult[0]?.count || 0;

    // Get the column information for the prices table
    const columns = await getRows("PRAGMA table_info(prices)") as any[];

    return NextResponse.json({
      success: true,
      tableExists: true,
      recordCount,
      columns: columns.map(col => ({
        name: col.name,
        type: col.type,
        notNull: col.notnull === 1,
        defaultValue: col.dflt_value,
        primaryKey: col.pk === 1
      }))
    });

  } catch (error: any) {
    console.error('Database check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to check database',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
