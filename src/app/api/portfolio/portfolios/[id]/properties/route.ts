import { NextRequest, NextResponse } from 'next/server';
import { PortfolioService } from '@/lib/services/portfolioService';

const portfolioService = new PortfolioService();

// GET /api/portfolio/portfolios/[id]/properties - Get all properties in a portfolio
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const portfolioId = (await params).id;
    
    const portfolio = await portfolioService.getPortfolio(portfolioId);
    
    return NextResponse.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Error fetching portfolio properties:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio properties' },
      { status: 500 }
    );
  }
}

// POST /api/portfolio/portfolios/[id]/properties - Add a property to a portfolio
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const portfolioId = (await params).id;
    const body = await request.json();
    
    const { 
      propertyData, 
      portfolioPropertyData 
    } = body;
    
    if (!propertyData || !propertyData.address || !propertyData.postcode) {
      return NextResponse.json(
        { success: false, error: 'Property address and postcode are required' },
        { status: 400 }
      );
    }
    
    const portfolioProperty = await portfolioService.addPropertyToPortfolio(
      portfolioId,
      propertyData,
      portfolioPropertyData
    );
    
    return NextResponse.json({
      success: true,
      data: portfolioProperty
    });
  } catch (error) {
    console.error('Error adding property to portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add property to portfolio' },
      { status: 500 }
    );
  }
}
