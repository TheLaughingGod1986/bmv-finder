import { NextRequest, NextResponse } from 'next/server';
import { integrationManager } from '@/lib/integrationManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const postcode = searchParams.get('postcode');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    let result;

    switch (action) {
      case 'postcode':
        if (!postcode) {
          return NextResponse.json({
            success: false,
            error: 'Postcode parameter is required'
          }, { status: 400 });
        }
        result = await integrationManager.getPostcodeInfo(postcode);
        break;

      case 'reverse':
        if (!lat || !lng) {
          return NextResponse.json({
            success: false,
            error: 'Latitude and longitude parameters are required'
          }, { status: 400 });
        }
        result = await integrationManager.getPostcodeFromCoordinates(
          parseFloat(lat),
          parseFloat(lng)
        );
        break;

      case 'places':
        if (!lat || !lng) {
          return NextResponse.json({
            success: false,
            error: 'Latitude and longitude parameters are required'
          }, { status: 400 });
        }
        const type = searchParams.get('type') || 'restaurant';
        const radius = searchParams.get('radius') || '1000';
        result = await integrationManager.getNearbyPlaces(
          parseFloat(lat),
          parseFloat(lng),
          type,
          parseInt(radius)
        );
        break;

      case 'stations':
        if (!lat || !lng) {
          return NextResponse.json({
            success: false,
            error: 'Latitude and longitude parameters are required'
          }, { status: 400 });
        }
        const stationRadius = searchParams.get('radius') || '1000';
        result = await integrationManager.getNearbyStations(
          parseFloat(lat),
          parseFloat(lng),
          parseInt(stationRadius)
        );
        break;

      case 'schools':
        if (!lat || !lng) {
          return NextResponse.json({
            success: false,
            error: 'Latitude and longitude parameters are required'
          }, { status: 400 });
        }
        const schoolRadius = searchParams.get('radius') || '2000';
        result = await integrationManager.getNearbySchools(
          parseFloat(lat),
          parseFloat(lng),
          parseInt(schoolRadius)
        );
        break;

      case 'crime':
        if (!lat || !lng) {
          return NextResponse.json({
            success: false,
            error: 'Latitude and longitude parameters are required'
          }, { status: 400 });
        }
        const date = searchParams.get('date');
        result = await integrationManager.getCrimeData(
          parseFloat(lat),
          parseFloat(lng),
          date
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: postcode, reverse, places, stations, schools, crime'
        }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Location API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch location data',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
