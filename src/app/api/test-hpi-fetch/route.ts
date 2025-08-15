import { NextRequest, NextResponse } from 'next/server';
import { BMVScoreEngine } from '../../../lib/bmvScoreEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode') || 'SW11 1DS';

    // Test the region mapping
    const region = (BMVScoreEngine as any).getRegionFromPostcode(postcode);
    
    // Test HPI fetch
    const hpiData = await (BMVScoreEngine as any).fetchHPIData(postcode);

    return NextResponse.json({
      postcode,
      region,
      hpiData,
      hasHPIData: !!hpiData,
      monthOverMonth: hpiData?.monthOverMonthGrowth,
      yearOverYear: hpiData?.yearOverYearGrowth
    });

  } catch (error) {
    console.error('Error in HPI fetch test:', error);
    return NextResponse.json(
      { error: 'Failed to test HPI fetch', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 