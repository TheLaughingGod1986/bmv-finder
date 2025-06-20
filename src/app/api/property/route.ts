import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const postcode = searchParams.get('postcode');

  const csvPath = path.join(process.cwd(), 'pp-complete.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  let records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  // Filter by postcode if provided
  if (postcode) {
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
    records = records.filter(row =>
      row.postcode && row.postcode.replace(/\s/g, '').toUpperCase().startsWith(cleanPostcode)
    );
  }

  // Paginate
  const paginated = records.slice(offset, offset + limit);

  return NextResponse.json({
    data: paginated,
    total: records.length,
    limit,
    offset,
  });
} 