import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: 'Use POST' }, { status: 405 });
} 