import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

function isPostcodeLike(input: string) {
  // UK postcode area or full postcode (very basic check)
  return /^[A-Z]{1,2}[0-9R][0-9A-Z]? ?[0-9][A-Z]{2}$/i.test(input.replace(/\s/g, '')) || /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?$/i.test(input);
}

export async function POST(request: NextRequest) {
  const { postcode, propertyId, trend } = await request.json();
  if (!postcode && !propertyId) {
    return NextResponse.json({ error: 'Postcode or area is required' }, { status: 400 });
  }

  try {
    const dbPath = path.join(process.cwd(), 'land_registry.db');
    const db = new sqlite3.Database(dbPath);
    let soldPrices: any[] = [];
    let trendData: any[] = [];

    if (propertyId) {
      // Fetch the property row by id
      const property = await new Promise<any>((resolve, reject) => {
        db.get(`SELECT * FROM prices WHERE id = ?`, [propertyId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      if (!property) {
        db.close();
        return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
      }
      // Fetch all sales for the same address (paon, saon, street, postcode)
      const history = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `SELECT * FROM prices WHERE paon = ? AND saon = ? AND street = ? AND postcode = ? ORDER BY date_of_transfer ASC`,
          [property.paon, property.saon, property.street, property.postcode],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });
      db.close();
      return NextResponse.json({
        success: true,
        data: { property, history }
      });
    }

    if (postcode) {
      const input = postcode.trim();
      // Remove spaces and uppercase for matching
      const cleanInput = input.replace(/\s/g, '').toUpperCase();
      // If input looks like a postcode or postcode area, search by postcode prefix
      if (isPostcodeLike(input)) {
        soldPrices = await new Promise((resolve, reject) => {
          db.all(
            `SELECT * FROM prices WHERE REPLACE(UPPER(postcode), ' ', '') LIKE ? ORDER BY date_of_transfer DESC LIMIT 50`,
            [cleanInput + '%'],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            }
          );
        });
      }
      // If no results, or if input doesn't look like a postcode, search by area name
      if (soldPrices.length === 0) {
        soldPrices = await new Promise((resolve, reject) => {
          db.all(
            `SELECT * FROM prices WHERE UPPER(town_city) LIKE ? OR UPPER(district) LIKE ? ORDER BY date_of_transfer DESC LIMIT 50`,
            ['%' + input.toUpperCase() + '%', '%' + input.toUpperCase() + '%'],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            }
          );
        });
      }
      // For each property, calculate growthPct
      const growthPromises = soldPrices.map((sp) => {
        return new Promise((resolve) => {
          db.all(
            `SELECT price, date_of_transfer FROM prices WHERE paon = ? AND saon = ? AND street = ? AND postcode = ? ORDER BY date_of_transfer ASC`,
            [sp.paon, sp.saon, sp.street, sp.postcode],
            (err, rows: { price: number; date_of_transfer: string }[] = []) => {
              if (err) return resolve({ ...sp, growthPct: null });
              if (!Array.isArray(rows) || rows.length < 2) return resolve({ ...sp, growthPct: null });
              const first = rows[0]?.price;
              const last = rows[rows.length - 1]?.price;
              if (typeof first !== 'number' || typeof last !== 'number') return resolve({ ...sp, growthPct: null });
              const pct = ((last / first - 1) * 100).toFixed(1);
              resolve({ ...sp, growthPct: Number(pct) });
            }
          );
        });
      });
      soldPrices = await Promise.all(growthPromises);
      // Area-level trend analytics
      if (trend) {
        // Use the same area filter as above
        let areaRows: any[] = [];
        if (isPostcodeLike(input)) {
          areaRows = await new Promise((resolve, reject) => {
            db.all(
              `SELECT price, date_of_transfer FROM prices WHERE REPLACE(UPPER(postcode), ' ', '') LIKE ?`,
              [cleanInput + '%'],
              (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
              }
            );
          });
        } else {
          areaRows = await new Promise((resolve, reject) => {
            db.all(
              `SELECT price, date_of_transfer FROM prices WHERE UPPER(town_city) LIKE ? OR UPPER(district) LIKE ?`,
              ['%' + input.toUpperCase() + '%', '%' + input.toUpperCase() + '%'],
              (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
              }
            );
          });
        }
        // Group by year and calculate average price and year-on-year % change
        const yearMap: { [year: string]: { sum: number, count: number } } = {};
        for (const row of areaRows) {
          const year = row.date_of_transfer?.slice(0, 4);
          if (!year) continue;
          if (!yearMap[year]) yearMap[year] = { sum: 0, count: 0 };
          yearMap[year].sum += row.price;
          yearMap[year].count += 1;
        }
        const sortedYears = Object.keys(yearMap).sort();
        let prevAvg: number | null = null;
        trendData = sortedYears.map((year) => {
          const avgPrice = Math.round(yearMap[year].sum / yearMap[year].count);
          let pctChange: number | null = null;
          if (prevAvg !== null) {
            pctChange = Number(((avgPrice / prevAvg - 1) * 100).toFixed(1));
          }
          prevAvg = avgPrice;
          return { year, avgPrice, pctChange };
        });
      }
      db.close();
      return NextResponse.json({
        success: true,
        data: { soldPrices, trendData }
      });
    }

    // fallback
    db.close();
    return NextResponse.json({
      success: true,
      data: { soldPrices }
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({
      success: true,
      data: { soldPrices: [] },
      note: 'Database error occurred'
    });
  }
} 