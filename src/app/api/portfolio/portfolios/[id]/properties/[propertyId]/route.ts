import { NextRequest, NextResponse } from 'next/server';
import { PortfolioService } from '@/lib/services/portfolioService';

const portfolioService = new PortfolioService();

// PUT /api/portfolio/portfolios/[id]/properties/[propertyId] - Update a property in a portfolio
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; propertyId: string } }
) {
  try {
    const { id: portfolioId, propertyId } = params;
    const body = await request.json();
    
    const portfolioProperty = await portfolioService.updatePortfolioProperty(
      portfolioId,
      propertyId,
      body
    );
    
    return NextResponse.json({
      success: true,
      data: portfolioProperty
    });
  } catch (error) {
    console.error('Error updating portfolio property:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update portfolio property' },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolio/portfolios/[id]/properties/[propertyId] - Remove a property from a portfolio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; propertyId: string } }
) {
  try {
    const { id: portfolioId, propertyId } = params;
    
    await portfolioService.removePropertyFromPortfolio(portfolioId, propertyId);
    
    return NextResponse.json({
      success: true,
      message: 'Property removed from portfolio'
    });
  } catch (error) {
    console.error('Error removing property from portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove property from portfolio' },
      { status: 500 }
    );
  }
}
