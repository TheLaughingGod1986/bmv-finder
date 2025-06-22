import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const timestamp = new Date().toISOString();
    await kv.set('data_last_updated', timestamp);
    console.log(`✅ Set data_last_updated timestamp to: ${timestamp}`);
    
    return NextResponse.json({ 
      success: true, 
      timestamp: timestamp,
      message: 'Timestamp set successfully'
    });
  } catch (error) {
    console.error('Error setting timestamp:', error);
    return NextResponse.json(
      { error: 'Failed to set timestamp' },
      { status: 500 }
    );
  }
} 