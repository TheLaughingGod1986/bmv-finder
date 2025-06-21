import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lastUpdated = await kv.get('data_last_updated');
    return NextResponse.json({ lastUpdated });
  } catch (error) {
    console.error('Error fetching last updated timestamp:', error);
    return NextResponse.json(
      { error: 'Failed to fetch last updated timestamp' },
      { status: 500 }
    );
  }
} 