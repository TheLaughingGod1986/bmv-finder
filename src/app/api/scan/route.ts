import { NextRequest, NextResponse } from 'next/server';
import { getRows } from '../../../../lib/turso-rest';

function isPostcodeLike(input: string) {
  // UK postcode area or full postcode (very basic check)
  return /^[A-Z]{1,2}[0-9R][0-9A-Z]? ?[0-9][A-Z]{2}$/i.test(input.replace(/\s/g, '')) || /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?$/i.test(input);
}

interface Property {
  id?: number;
  paon?: string;
  saon?: string;
  street?: string;
  postcode?: string;
  price?: number;
  date?: string;
  town?: string;
  district?: string;
  growthPct?: number | null;
  property_type?: string;
  is_new_build?: string;
  duration?: string;
  locality?: string;
  county?: string;
  category?: string;
  status?: string;
}

export async function POST(request: NextRequest) {
  console.log('POST /api/scan called');
  const { postcode, propertyId, trend } = await request.json();
  if (!postcode && !propertyId) {
    return NextResponse.json({ error: 'Postcode or area is required' }, { status: 400 });
  }

  try {
    let soldPrices: Property[] = [];
    let trendData: any[] = [];

    if (propertyId) {
      // Fetch the property row by id
      const property = (await getRows('SELECT * FROM property_sales WHERE id = ?', [propertyId]))[0];
      if (!property) {
        return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
      }
      
      // Fetch all sales for the same address (paon, saon, street, postcode)
      const history = await getRows(
        `SELECT * FROM property_sales 
         WHERE paon = ? AND saon = ? AND street = ? AND postcode = ? 
         ORDER BY date ASC`,
        [property.paon, property.saon, property.street, property.postcode]
      );
      
      return NextResponse.json({
        success: true,
        data: { property, history }
      });
    }

    if (postcode) {
      const input = postcode.trim();
      const cleanInput = input.replace(/\s/g, '').toUpperCase();
      
      // If input looks like a postcode or postcode area, search by postcode prefix
      if (isPostcodeLike(input)) {
        soldPrices = await getRows(
          `SELECT *, date as date_of_transfer, town as town_city, is_new_build as old_new, category as ppd_category_type, status as record_status FROM property_sales 
           WHERE REPLACE(UPPER(postcode), ' ', '') LIKE ? 
           ORDER BY date DESC 
           LIMIT 50`,
          [`${cleanInput}%`]
        );
      }
      
      // If no results, or if input doesn't look like a postcode, search by area name
      if (soldPrices.length === 0) {
        const searchTerm = `%${input.toUpperCase()}%`;
        soldPrices = await getRows(
          `SELECT *, date as date_of_transfer, town as town_city, is_new_build as old_new, category as ppd_category_type, status as record_status FROM property_sales 
           WHERE UPPER(town) LIKE ? OR UPPER(district) LIKE ? 
           ORDER BY date DESC 
           LIMIT 50`,
          [searchTerm, searchTerm]
        );
      }
      
      // For each property, calculate growthPct
      const growthPromises = soldPrices.map(async (sp) => {
        try {
          const rows = await getRows(
            `SELECT price, date 
             FROM property_sales 
             WHERE paon = ? AND saon = ? AND street = ? AND postcode = ? 
             ORDER BY date ASC`,
            [sp.paon, sp.saon, sp.street, sp.postcode]
          ) as { price: number; date: string }[];
          
          if (!Array.isArray(rows) || rows.length < 2) {
            return { ...sp, growthPct: null };
          }
          
          const first = rows[0]?.price;
          const last = rows[rows.length - 1]?.price;
          
          if (typeof first !== 'number' || typeof last !== 'number') {
            return { ...sp, growthPct: null };
          }
          
          const pct = ((last / first - 1) * 100).toFixed(1);
          return { ...sp, growthPct: Number(pct) };
        } catch (error) {
          console.error('Error calculating growth:', error);
          return { ...sp, growthPct: null };
        }
      });
      
      soldPrices = await Promise.all(growthPromises);
      
      // Area-level trend analytics
      if (trend) {
        // Get all sales in the same postcode area for trend analysis
        const postcodeArea = cleanInput.match(/^[A-Z]+/)?.[0];
        if (postcodeArea) {
          try {
            trendData = await getRows(
              `SELECT 
                strftime('%Y', date) as year,
                AVG(price) as avg_price,
                COUNT(*) as sales_count
               FROM property_sales 
               WHERE REPLACE(UPPER(postcode), ' ', '') LIKE ? 
               GROUP BY year 
               ORDER BY year`,
              [`${postcodeArea}%`]
            );
          } catch (error) {
            console.error('Error fetching trend data:', error);
            trendData = [];
          }
        }
      }
    }

    // Return results
    return NextResponse.json({
      success: true,
      data: {
        soldPrices: soldPrices,
        trendData: trendData,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in scan API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}