import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

export async function POST(request: NextRequest) {
  const { postcode } = await request.json();
  if (!postcode) {
    return NextResponse.json({ error: 'Postcode is required' }, { status: 400 });
  }

  try {
    // Use local SQLite database
    const dbPath = path.join(process.cwd(), 'land_registry.db');
    const db = new sqlite3.Database(dbPath);
    
    // Remove spaces and uppercase for matching
    const searchPostcode = postcode.replace(/\s/g, '').toUpperCase();
    
    const soldPrices = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM prices WHERE REPLACE(UPPER(postcode), ' ', '') = ? ORDER BY date_of_transfer DESC LIMIT 20`,
        [searchPostcode],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });

    db.close();

    // Return real data if found, otherwise return empty array
    return NextResponse.json({
      success: true,
      data: { soldPrices }
    });

  } catch (error) {
    console.error('Database error:', error);
    // Return empty results on error instead of sample data
    return NextResponse.json({
      success: true,
      data: { soldPrices: [] },
      note: 'Database error occurred'
    });
  }
} 