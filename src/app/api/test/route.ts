import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ message: "GET handler works!" });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}