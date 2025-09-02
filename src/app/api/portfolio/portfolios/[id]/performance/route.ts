import { NextRequest, NextResponse } from 'next/server';
import { PortfolioService } from '@/lib/services/portfolioService';

interface PortfolioProperty {
  id: string;
  address?: string;
  postcode?: string;
  propertyType?: string;
  bedrooms?: number;
  floorArea?: number;
  epcRating?: string;
  lastSalePrice?: number;
  lastSaleDate?: string | null;
  totalSales?: number;
  currentValuation?: number;
  estimatedValue?: number;
  capitalGrowth?: number;
  grossYield?: number;
  portfolioFit?: {
    riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
    diversification?: number;
  } | null;
}

const portfolioService = new PortfolioService();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const portfolioId = params.id;
    
    // Get portfolio with properties
    const portfolio = await portfolioService.getPortfolio(portfolioId);
    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Calculate portfolio performance metrics
    const performance = await portfolioService.calculatePortfolioPerformance(portfolioId);
    
    // Calculate additional metrics
    const properties = portfolio.properties || [];
    const totalProperties = properties.length;
    
    if (totalProperties === 0) {
      return NextResponse.json({
        success: true,
        data: {
          portfolioId,
          totalProperties: 0,
          totalValue: 0,
          totalGrowth: 0,
          averageYield: 0,
          totalDiversification: 0,
          riskProfile: 'N/A',
          performance: performance || null
        }
      });
    }

    // Calculate portfolio statistics using available properties
    const totalValue = properties.reduce((sum, prop) => sum + ((prop as PortfolioProperty).currentValuation || (prop as PortfolioProperty).estimatedValue || 0), 0);
    const totalGrowth = properties.reduce((sum, prop) => sum + ((prop as PortfolioProperty).capitalGrowth || 0), 0);
    const averageYield = properties.reduce((sum, prop) => sum + ((prop as PortfolioProperty).grossYield || 0), 0) / totalProperties;
    const totalDiversification = properties.reduce((sum, prop) => sum + ((prop as PortfolioProperty).portfolioFit?.diversification || 0), 0) / totalProperties;
    
    // Calculate risk profile
    const riskScores = properties.map(prop => {
      let score = 0;
      if ((prop as PortfolioProperty).portfolioFit?.riskLevel === 'HIGH') score += 3;
      else if ((prop as PortfolioProperty).portfolioFit?.riskLevel === 'MEDIUM') score += 2;
      else if ((prop as PortfolioProperty).portfolioFit?.riskLevel === 'LOW') score += 1;
      return score;
    });
    
    const averageRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / totalProperties;
    let riskProfile = 'LOW';
    if (averageRiskScore >= 2.5) riskProfile = 'HIGH';
    else if (averageRiskScore >= 1.5) riskProfile = 'MEDIUM';

    return NextResponse.json({
      success: true,
      data: {
        portfolioId,
        totalProperties,
        totalValue,
        totalGrowth,
        averageYield,
        totalDiversification,
        riskProfile,
        performance: performance || null,
        properties: properties.map(prop => ({
          id: prop.id,
          address: (prop as PortfolioProperty).address || 'Unknown',
          postcode: (prop as PortfolioProperty).postcode || 'Unknown',
          propertyType: (prop as PortfolioProperty).propertyType || 'Unknown',
          bedrooms: (prop as PortfolioProperty).bedrooms || 0,
          floorArea: (prop as PortfolioProperty).floorArea || 0,
          epcRating: (prop as PortfolioProperty).epcRating || 'Unknown',
          lastSalePrice: (prop as PortfolioProperty).lastSalePrice || 0,
          lastSaleDate: (prop as PortfolioProperty).lastSaleDate || null,
          totalSales: (prop as PortfolioProperty).totalSales || 0,
          currentValuation: (prop as PortfolioProperty).currentValuation || (prop as PortfolioProperty).estimatedValue || 0,
          capitalGrowth: (prop as PortfolioProperty).capitalGrowth || 0,
          grossYield: (prop as PortfolioProperty).grossYield || 0,
          portfolioFit: (prop as PortfolioProperty).portfolioFit || null
        }))
      }
    });
  } catch (error) {
    console.error('Error calculating portfolio performance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate portfolio performance' },
      { status: 500 }
    );
  }
}

// POST /api/portfolio/portfolios/[id]/performance - Save portfolio performance snapshot
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const portfolioId = params.id;
    
    // Calculate current performance
    const performance = await portfolioService.calculatePortfolioPerformance(portfolioId);
    
    // Save the performance snapshot
    await portfolioService.savePortfolioPerformance(performance);
    
    return NextResponse.json({
      success: true,
      data: performance,
      message: 'Performance snapshot saved'
    });
  } catch (error) {
    console.error('Error saving portfolio performance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save portfolio performance' },
      { status: 500 }
    );
  }
}
