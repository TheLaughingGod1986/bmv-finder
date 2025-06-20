import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET() {
  // Path to your CSV file
  const csvPath = path.join(process.cwd(), 'pp-complete.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  // Parse CSV
  const records = parse(fileContent, {
    columns: true, // first row as keys
    skip_empty_lines: true,
  });
  // Optionally, filter/transform records here

  return NextResponse.json({ data: records });
} 