import { NextRequest, NextResponse } from 'next/server';
import { PortfolioAnalyticsEngine } from '@/lib/analytics/portfolioAnalytics';
import { apiPerformanceMonitor } from '@/lib/apiPerformanceMonitor';

// Mock data for demonstration - in production, this would come from your database
const mockPortfolio = {
  id: 'portfolio-1',
  name: 'Investment Portfolio',
  description: 'Main property investment portfolio',
  userId: 'user-123',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockProperties = [
  {
    id: 'prop-1',
    portfolioId: 'portfolio-1',
    address: '123 Main Street, London, SW1A 1AA',
    postcode: 'SW1A 1AA',
    propertyType: 'Flat',
    bedrooms: 2,
    purchasePrice: 450000,
    currentValue: 520000,
    purchaseDate: '2023-01-15',
    monthlyRent: 2200,
    bmvScore: 85,
    addedAt: '2023-01-15T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prop-2',
    portfolioId: 'portfolio-1',
    address: '456 Oak Avenue, Manchester, M1 1AA',
    postcode: 'M1 1AA',
    propertyType: 'Terraced',
    bedrooms: 3,
    purchasePrice: 180000,
    currentValue: 195000,
    purchaseDate: '2023-06-01',
    monthlyRent: 950,
    bmvScore: 72,
    addedAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prop-3',
    portfolioId: 'portfolio-1',
    address: '789 Pine Road, Birmingham, B1 1AA',
    postcode: 'B1 1AA',
    propertyType: 'Semi-Detached',
    bedrooms: 4,
    purchasePrice: 220000,
    currentValue: 240000,
    purchaseDate: '2023-03-10',
    monthlyRent: 1200,
    bmvScore: 78,
    addedAt: '2023-03-10T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const analysisType = searchParams.get('type') || 'full';

    if (!portfolioId) {
      return NextResponse.json({
        success: false,
        error: 'Portfolio ID is required'
      }, { status: 400 });
    }

    // In production, fetch from database
    // const portfolio = await getPortfolio(portfolioId);
    // const properties = await getPortfolioProperties(portfolioId);
    
    const portfolio = mockPortfolio;
    const properties = mockProperties;

    if (!portfolio) {
      return NextResponse.json({
        success: false,
        error: 'Portfolio not found'
      }, { status: 404 });
    }

    const analyticsEngine = new PortfolioAnalyticsEngine(portfolio, properties);
    
    let result: any = {};

    switch (analysisType) {
      case 'metrics':
        result = {
          metrics: analyticsEngine.calculateMetrics()
        };
        break;
      case 'performance':
        result = {
          performance: analyticsEngine.calculatePropertyPerformance()
        };
        break;
      case 'insights':
        result = {
          insights: analyticsEngine.generateInsights()
        };
        break;
      case 'benchmarks':
        result = {
          benchmarks: analyticsEngine.calculateBenchmarks()
        };
        break;
      case 'full':
      default:
        result = {
          metrics: analyticsEngine.calculateMetrics(),
          performance: analyticsEngine.calculatePropertyPerformance(),
          insights: analyticsEngine.generateInsights(),
          benchmarks: analyticsEngine.calculateBenchmarks(),
        };
        break;
    }

    const executionTime = Date.now() - startTime;

    // Track performance
    apiPerformanceMonitor.trackAPICall(
      '/api/portfolio/analytics',
      'GET',
      executionTime,
      200
    );

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        portfolioId,
        analysisType,
        executionTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    // Track error
    apiPerformanceMonitor.trackAPICall(
      '/api/portfolio/analytics',
      'GET',
      executionTime,
      500,
      undefined,
      undefined,
      error.message
    );

    console.error('Portfolio analytics API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to generate portfolio analytics',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { portfolioId, analysisType, customMetrics } = body;

    if (!portfolioId) {
      return NextResponse.json({
        success: false,
        error: 'Portfolio ID is required'
      }, { status: 400 });
    }

    // In production, fetch from database
    const portfolio = mockPortfolio;
    const properties = mockProperties;

    if (!portfolio) {
      return NextResponse.json({
        success: false,
        error: 'Portfolio not found'
      }, { status: 404 });
    }

    const analyticsEngine = new PortfolioAnalyticsEngine(portfolio, properties);
    
    let result: any = {};

    // Generate custom analysis based on request
    if (analysisType === 'custom' && customMetrics) {
      result = {
        customAnalysis: {
          requestedMetrics: customMetrics,
          results: await generateCustomAnalysis(analyticsEngine, customMetrics)
        }
      };
    } else {
      // Generate full analysis
      result = {
        metrics: analyticsEngine.calculateMetrics(),
        performance: analyticsEngine.calculatePropertyPerformance(),
        insights: analyticsEngine.generateInsights(),
        benchmarks: analyticsEngine.calculateBenchmarks(),
      };
    }

    const executionTime = Date.now() - startTime;

    // Track performance
    apiPerformanceMonitor.trackAPICall(
      '/api/portfolio/analytics',
      'POST',
      executionTime,
      200
    );

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        portfolioId,
        analysisType: analysisType || 'full',
        executionTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    // Track error
    apiPerformanceMonitor.trackAPICall(
      '/api/portfolio/analytics',
      'POST',
      executionTime,
      500,
      undefined,
      undefined,
      error.message
    );

    console.error('Portfolio analytics API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to generate portfolio analytics',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper function for custom analysis
async function generateCustomAnalysis(engine: PortfolioAnalyticsEngine, customMetrics: string[]) {
  const results: any = {};
  
  for (const metric of customMetrics) {
    switch (metric) {
      case 'diversification':
        results.diversification = {
          score: engine.calculateMetrics().diversificationScore,
          breakdown: {
            typeDiversity: engine['calculateTypeDiversity'](),
            locationDiversity: engine['calculateLocationDiversity'](),
            sizeDiversity: engine['calculateSizeDiversity'](),
          }
        };
        break;
      case 'risk':
        results.risk = {
          score: engine.calculateMetrics().riskScore,
          breakdown: {
            concentration: engine['calculateConcentrationRisk'](),
            location: engine['calculateLocationRisk'](),
            market: engine['calculateMarketRisk'](),
          }
        };
        break;
      case 'performance':
        results.performance = engine.calculatePropertyPerformance();
        break;
      case 'benchmarks':
        results.benchmarks = engine.calculateBenchmarks();
        break;
      default:
        results[metric] = 'Metric not supported';
    }
  }
  
  return results;
}