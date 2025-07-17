import { NextRequest, NextResponse } from 'next/server';

interface PortfolioProperty {
  id: string;
  address: string;
  postcode: string;
  houseNumber: string;
  addedDate: string;
  lastSoldPrice: number;
  hpiAdjustedValue: number;
  currentEstimate: number;
  dealScore: number;
  dealRating: string;
}

// In a real implementation, this would be stored in a database
// For now, we'll use a simple in-memory store (will reset on server restart)
let portfolioStore: PortfolioProperty[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      address, 
      postcode, 
      houseNumber, 
      lastSoldPrice, 
      hpiAdjustedValue, 
      currentEstimate, 
      dealScore, 
      dealRating 
    } = body;

    // Validate required fields
    if (!address || !postcode || !houseNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: address, postcode, houseNumber' },
        { status: 400 }
      );
    }

    // Check if property already exists in portfolio
    const existingProperty = portfolioStore.find(
      prop => prop.address === address && prop.postcode === postcode
    );

    if (existingProperty) {
      return NextResponse.json(
        { error: 'Property already exists in portfolio' },
        { status: 409 }
      );
    }

    // Create new portfolio property
    const newProperty: PortfolioProperty = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      address,
      postcode,
      houseNumber,
      addedDate: new Date().toISOString(),
      lastSoldPrice: lastSoldPrice || 0,
      hpiAdjustedValue: hpiAdjustedValue || 0,
      currentEstimate: currentEstimate || 0,
      dealScore: dealScore || 0,
      dealRating: dealRating || 'Unknown'
    };

    // Add to portfolio
    portfolioStore.push(newProperty);

    return NextResponse.json({
      success: true,
      message: 'Property added to portfolio successfully',
      property: newProperty
    });

  } catch (error) {
    console.error('Error adding property to portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to add property to portfolio' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      portfolio: portfolioStore
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
} 