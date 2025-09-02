import { NextRequest, NextResponse } from 'next/server';
import { PortfolioService } from '@/lib/services/portfolioService';

const portfolioService = new PortfolioService();

// GET /api/portfolio/portfolios - Get all portfolios for a user
export async function GET(request: NextRequest) {
  try {
    // TODO: Get actual user ID from authentication
    // For now, use a mock user ID for development
    const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
    
    const portfolios = await portfolioService.getUserPortfolios(mockUserId);
    
    return NextResponse.json({
      success: true,
      data: portfolios
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolios' },
      { status: 500 }
    );
  }
}

// POST /api/portfolio/portfolios - Create a new portfolio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Portfolio name is required' },
        { status: 400 }
      );
    }
    
    // TODO: Get actual user ID from authentication
    const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
    
    const portfolio = await portfolioService.createPortfolio(mockUserId, name, description);
    
    return NextResponse.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create portfolio' },
      { status: 500 }
    );
  }
}
