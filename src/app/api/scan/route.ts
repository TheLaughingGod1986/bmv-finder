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
  return NextResponse.json({ message: "POST handler works!" });
}