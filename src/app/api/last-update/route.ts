import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET() {
  try {
    const summaryPath = 'public/last-data-update.json';
    if (!fs.existsSync(summaryPath)) {
      return NextResponse.json({ error: 'No update summary found.' }, { status: 404 });
    }
    const data = fs.readFileSync(summaryPath, 'utf8');
    const json = JSON.parse(data);
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 