import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

export async function POST(request: NextRequest) {
  try {
    const { postcode, number, floor_area_m2, epc_rating, bedrooms } = await request.json();
    if (!postcode || !number) {
      return NextResponse.json({ error: 'Missing postcode or number' }, { status: 400 });
    }
    // Log the submission
    // Upsert to properties-enhanced index
    const docId = `${postcode.replace(/\s+/g, '').toUpperCase()}_${number}`;
    const body: { floor_area_m2?: number; epc_rating?: string; bedrooms?: number } = {};
    if (floor_area_m2 !== undefined) body.floor_area_m2 = floor_area_m2;
    if (epc_rating !== undefined) body.epc_rating = epc_rating;
    if (bedrooms !== undefined) body.bedrooms = bedrooms;
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    await esClient.update({
      index: 'properties-enhanced',
      id: docId,
      doc_as_upsert: true,
      body: { doc: body },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in submit-missing-data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 