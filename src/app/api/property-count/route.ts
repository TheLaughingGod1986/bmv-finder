import { NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

export async function GET() {
  try {
    const { count } = await esClient.count({ index: 'properties-enhanced' });
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 