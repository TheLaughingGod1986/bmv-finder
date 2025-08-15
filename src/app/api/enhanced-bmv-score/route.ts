import { NextRequest, NextResponse } from 'next/server';
import { BMVScoreEngine } from '../../../lib/bmvScoreEngine';
import { SoldPrice } from '../../../../types/sold-price';

export async function POST(request: NextRequest) {
  try {
    const { postcode, propertyData } = await request.json();

    if (!postcode || !propertyData) {
      return NextResponse.json(
        { error: 'Postcode and property data are required' },
        { status: 400 }
      );
    }

    // Fetch property sales data for the postcode
    const salesResponse = await fetch(`${request.nextUrl.origin}/api/property-es`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchTerm: postcode, pageSize: 50 })
    });

    if (!salesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch property sales data' },
        { status: 500 }
      );
    }

    const salesData = await salesResponse.json();
    const allProperties: SoldPrice[] = salesData.data || [];

    if (allProperties.length === 0) {
      return NextResponse.json(
        { error: 'No property sales data found for this postcode' },
        { status: 404 }
      );
    }

    // Create a sample property for BMV scoring
    const sampleProperty: SoldPrice = {
      ...propertyData,
      postcode: postcode.toUpperCase(),
      dateOfTransfer: propertyData.dateOfTransfer || new Date().toISOString().split('T')[0],
      price: propertyData.price || 250000,
      propertyType: propertyData.propertyType || 'T',
      duration: propertyData.duration || 'F',
      old_new: propertyData.old_new || 'N',
      paon: propertyData.paon || 'Sample Property',
      street: propertyData.street || 'Sample Street',
      locality: propertyData.locality || '',
      town: propertyData.town || '',
      district: propertyData.district || '',
      county: propertyData.county || '',
      category: propertyData.category || 'A',
      recordStatus: propertyData.recordStatus || 'A'
    };

    // Calculate enhanced BMV score with HPI data
    const enhancedBMVData = await BMVScoreEngine.calculateBMVScore(sampleProperty, allProperties);
    
    // Calculate traditional BMV score for comparison
    const traditionalBMVData = BMVScoreEngine.calculateBMVScoreSync(sampleProperty, allProperties);

    // Get BMV categories
    const enhancedCategory = BMVScoreEngine.getBMVCategory(enhancedBMVData.bmvScore);
    const traditionalCategory = BMVScoreEngine.getBMVCategory(traditionalBMVData.bmvScore);

    // Calculate improvement
    const scoreImprovement = enhancedBMVData.bmvScore - traditionalBMVData.bmvScore;
    const growthImprovement = enhancedBMVData.areaGrowth - traditionalBMVData.areaGrowth;

    return NextResponse.json({
      postcode: postcode.toUpperCase(),
      property: sampleProperty,
      
      // Enhanced scoring with HPI data
      enhanced: {
        bmvScore: enhancedBMVData.bmvScore,
        category: enhancedCategory,
        marketValue: enhancedBMVData.marketValue,
        askingPrice: enhancedBMVData.askingPrice,
        rentalYield: enhancedBMVData.rentalYield,
        areaGrowth: enhancedBMVData.areaGrowth,
        postcodeYield: enhancedBMVData.postcodeYield,
        postcodeGrowth: enhancedBMVData.postcodeGrowth
      },
      
      // Traditional scoring without HPI data
      traditional: {
        bmvScore: traditionalBMVData.bmvScore,
        category: traditionalCategory,
        marketValue: traditionalBMVData.marketValue,
        askingPrice: traditionalBMVData.askingPrice,
        rentalYield: traditionalBMVData.rentalYield,
        areaGrowth: traditionalBMVData.areaGrowth,
        postcodeYield: traditionalBMVData.postcodeYield,
        postcodeGrowth: traditionalBMVData.postcodeGrowth
      },
      
      // Improvements from HPI integration
      improvements: {
        scoreImprovement,
        growthImprovement,
        hasHPIData: enhancedBMVData.areaGrowth !== traditionalBMVData.areaGrowth,
        hpiDataAvailable: true
      },
      
      // Market context
      marketContext: {
        totalProperties: allProperties.length,
        averagePrice: Math.round(allProperties.reduce((sum, p) => sum + p.price, 0) / allProperties.length),
        dateRange: {
          earliest: allProperties[allProperties.length - 1]?.dateOfTransfer,
          latest: allProperties[0]?.dateOfTransfer
        }
      }
    });

  } catch (error) {
    console.error('Error in enhanced BMV score calculation:', error);
    return NextResponse.json(
      { error: 'Failed to calculate enhanced BMV score' },
      { status: 500 }
    );
  }
} 