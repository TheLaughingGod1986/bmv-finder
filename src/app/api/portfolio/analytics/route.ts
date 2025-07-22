import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface PortfolioAnalytics {
  overview: {
    totalProperties: number;
    totalValue: number;
    totalEquity: number;
    totalRentalIncome: number;
    averageYield: number;
    totalGrowth: number;
    growthPercentage: number;
  };
  performance: {
    totalReturn: number;
    annualizedReturn: number;
    monthlyGrowth: number;
    bestPerformer: {
      address: string;
      growth: number;
      growthPercentage: number;
    };
    worstPerformer: {
      address: string;
      growth: number;
      growthPercentage: number;
    };
  };
  diversification: {
    byPropertyType: { [key: string]: { count: number; value: number; percentage: number } };
    byLocation: { [key: string]: { count: number; value: number; percentage: number } };
    byYield: {
      highYield: number; // > 8%
      mediumYield: number; // 5-8%
      lowYield: number; // < 5%
    };
  };
  riskMetrics: {
    averageDealScore: number;
    averageBMVScore: number;
    portfolioRisk: 'low' | 'medium' | 'high';
    concentrationRisk: number; // Percentage in top 3 properties
  };
  trends: {
    monthlyValues: Array<{ month: string; value: number; growth: number }>;
    monthlyRentalIncome: Array<{ month: string; income: number; growth: number }>;
  };
  recommendations: {
    topPerformers: Array<{ address: string; metric: string; value: number }>;
    areasForImprovement: Array<{ area: string; suggestion: string; impact: string }>;
    nextSteps: Array<{ action: string; priority: 'high' | 'medium' | 'low'; reason: string }>;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client inside the function to avoid build-time issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration is missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user's portfolio properties
    const { data: properties, error } = await supabase
      .from('portfolio_properties')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching portfolio properties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch portfolio properties' },
        { status: 500 }
      );
    }

    if (!properties || properties.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          overview: {
            totalProperties: 0,
            totalValue: 0,
            totalEquity: 0,
            totalRentalIncome: 0,
            averageYield: 0,
            totalGrowth: 0,
            growthPercentage: 0
          },
          performance: {
            totalReturn: 0,
            annualizedReturn: 0,
            monthlyGrowth: 0,
            bestPerformer: { address: '', growth: 0, growthPercentage: 0 },
            worstPerformer: { address: '', growth: 0, growthPercentage: 0 }
          },
          diversification: {
            byPropertyType: {},
            byLocation: {},
            byYield: { highYield: 0, mediumYield: 0, lowYield: 0 }
          },
          riskMetrics: {
            averageDealScore: 0,
            averageBMVScore: 0,
            portfolioRisk: 'low' as const,
            concentrationRisk: 0
          },
          trends: {
            monthlyValues: [],
            monthlyRentalIncome: []
          },
          recommendations: {
            topPerformers: [],
            areasForImprovement: [],
            nextSteps: []
          }
        }
      });
    }

    // Calculate overview metrics
    const totalValue = properties.reduce((sum, p) => sum + p.current_value, 0);
    const totalEquity = properties.reduce((sum, p) => sum + p.equity, 0);
    const totalRentalIncome = properties.reduce((sum, p) => sum + (p.rental_income || 0), 0);
    const totalPurchaseValue = properties.reduce((sum, p) => sum + p.purchase_price, 0);
    const totalGrowth = totalValue - totalPurchaseValue;
    const growthPercentage = totalPurchaseValue > 0 ? (totalGrowth / totalPurchaseValue) * 100 : 0;
    
    const averageYield = properties.length > 0 
      ? properties.reduce((sum, p) => sum + (p.yield || 0), 0) / properties.length 
      : 0;

    // Calculate performance metrics
    const totalReturn = totalGrowth + totalRentalIncome;
    const averageDealScore = properties.reduce((sum, p) => sum + p.deal_score, 0) / properties.length;
    const averageBMVScore = properties.reduce((sum, p) => sum + p.bmv_score, 0) / properties.length;

    // Find best and worst performers
    const propertyGrowths = properties.map(p => ({
      address: p.address,
      growth: p.current_value - p.purchase_price,
      growthPercentage: ((p.current_value - p.purchase_price) / p.purchase_price) * 100
    }));

    const bestPerformer = propertyGrowths.reduce((best, current) => 
      current.growthPercentage > best.growthPercentage ? current : best
    );

    const worstPerformer = propertyGrowths.reduce((worst, current) => 
      current.growthPercentage < worst.growthPercentage ? current : worst
    );

    // Calculate diversification metrics
    const propertyTypeBreakdown = properties.reduce((acc, p) => {
      const type = p.property_type || 'Unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, value: 0, percentage: 0 };
      }
      acc[type].count++;
      acc[type].value += p.current_value;
      return acc;
    }, {} as { [key: string]: { count: number; value: number; percentage: number } });

    // Calculate percentages
    Object.keys(propertyTypeBreakdown).forEach(type => {
      propertyTypeBreakdown[type].percentage = (propertyTypeBreakdown[type].value / totalValue) * 100;
    });

    const locationBreakdown = properties.reduce((acc, p) => {
      const area = p.postcode.split(' ')[0]; // First part of postcode
      if (!acc[area]) {
        acc[area] = { count: 0, value: 0, percentage: 0 };
      }
      acc[area].count++;
      acc[area].value += p.current_value;
      return acc;
    }, {} as { [key: string]: { count: number; value: number; percentage: number } });

    // Calculate location percentages
    Object.keys(locationBreakdown).forEach(area => {
      locationBreakdown[area].percentage = (locationBreakdown[area].value / totalValue) * 100;
    });

    // Calculate yield distribution
    const yieldDistribution = properties.reduce((acc, p) => {
      const yieldRate = p.yield || 0;
      if (yieldRate > 8) acc.highYield++;
      else if (yieldRate > 5) acc.mediumYield++;
      else acc.lowYield++;
      return acc;
    }, { highYield: 0, mediumYield: 0, lowYield: 0 });

    // Calculate risk metrics
    const sortedByValue = [...properties].sort((a, b) => b.current_value - a.current_value);
    const top3Value = sortedByValue.slice(0, 3).reduce((sum, p) => sum + p.current_value, 0);
    const concentrationRisk = (top3Value / totalValue) * 100;

    const portfolioRisk = concentrationRisk > 60 ? 'high' : concentrationRisk > 40 ? 'medium' : 'low';

    // Generate recommendations
    const recommendations = generateRecommendations(properties, {
      totalValue,
      averageYield,
      growthPercentage,
      concentrationRisk,
      averageDealScore,
      averageBMVScore
    });

    // Generate trends (simplified - in real app, you'd store historical data)
    const trends = generateTrends(properties);

    const analytics: PortfolioAnalytics = {
      overview: {
        totalProperties: properties.length,
        totalValue,
        totalEquity,
        totalRentalIncome,
        averageYield,
        totalGrowth,
        growthPercentage
      },
      performance: {
        totalReturn,
        annualizedReturn: calculateAnnualizedReturn(properties),
        monthlyGrowth: growthPercentage / 12, // Simplified
        bestPerformer,
        worstPerformer
      },
      diversification: {
        byPropertyType: propertyTypeBreakdown,
        byLocation: locationBreakdown,
        byYield: yieldDistribution
      },
      riskMetrics: {
        averageDealScore,
        averageBMVScore,
        portfolioRisk,
        concentrationRisk
      },
      trends,
      recommendations
    };

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error generating portfolio analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate portfolio analytics' },
      { status: 500 }
    );
  }
}

function calculateAnnualizedReturn(properties: any[]): number {
  if (properties.length === 0) return 0;
  
  const totalPurchaseValue = properties.reduce((sum, p) => sum + p.purchase_price, 0);
  const totalCurrentValue = properties.reduce((sum, p) => sum + p.current_value, 0);
  const totalRentalIncome = properties.reduce((sum, p) => sum + (p.rental_income || 0), 0);
  
  // Calculate average holding period (simplified)
  const averageHoldingPeriod = 2; // Assume 2 years average
  
  const totalReturn = (totalCurrentValue - totalPurchaseValue) + totalRentalIncome;
  const annualizedReturn = Math.pow((totalReturn + totalPurchaseValue) / totalPurchaseValue, 1 / averageHoldingPeriod) - 1;
  
  return annualizedReturn * 100;
}

function generateRecommendations(properties: any[], metrics: any) {
  const recommendations = {
    topPerformers: [] as Array<{ address: string; metric: string; value: number }>,
    areasForImprovement: [] as Array<{ area: string; suggestion: string; impact: string }>,
    nextSteps: [] as Array<{ action: string; priority: 'high' | 'medium' | 'low'; reason: string }>
  };

  // Top performers
  const bestGrowth = properties.reduce((best, p) => {
    const growth = ((p.current_value - p.purchase_price) / p.purchase_price) * 100;
    return growth > best.growth ? { address: p.address, metric: 'Growth', value: growth } : best;
  }, { address: '', metric: 'Growth', value: 0 });

  const bestYield = properties.reduce((best, p) => {
    return (p.yield || 0) > best.yield ? { address: p.address, metric: 'Yield', value: p.yield || 0 } : best;
  }, { address: '', metric: 'Yield', value: 0 });

  recommendations.topPerformers = [bestGrowth, bestYield].filter(p => p.address);

  // Areas for improvement
  if (metrics.averageYield < 6) {
    recommendations.areasForImprovement.push({
      area: 'Rental Yield',
      suggestion: 'Consider properties with higher rental yields or negotiate better rental terms',
      impact: 'Could increase annual income by 20-30%'
    });
  }

  if (metrics.concentrationRisk > 50) {
    recommendations.areasForImprovement.push({
      area: 'Diversification',
      suggestion: 'Consider diversifying across more properties to reduce concentration risk',
      impact: 'Reduces portfolio volatility and risk'
    });
  }

  if (metrics.averageDealScore < 70) {
    recommendations.areasForImprovement.push({
      area: 'Deal Quality',
      suggestion: 'Focus on properties with higher BMV scores and better fundamentals',
      impact: 'Improves long-term returns and reduces risk'
    });
  }

  // Next steps
  if (properties.length < 3) {
    recommendations.nextSteps.push({
      action: 'Add more properties to portfolio',
      priority: 'high',
      reason: 'Diversification reduces risk and improves returns'
    });
  }

  if (metrics.averageYield < 6) {
    recommendations.nextSteps.push({
      action: 'Review rental strategies',
      priority: 'medium',
      reason: 'Higher yields improve cash flow and overall returns'
    });
  }

  if (metrics.growthPercentage < 10) {
    recommendations.nextSteps.push({
      action: 'Analyze underperforming properties',
      priority: 'medium',
      reason: 'Identify opportunities for improvement or exit strategies'
    });
  }

  return recommendations;
}

function generateTrends(properties: any[]) {
  // Simplified trend generation - in a real app, you'd store historical data
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
  
  const totalValue = properties.reduce((sum, p) => sum + p.current_value, 0);
  const totalRentalIncome = properties.reduce((sum, p) => sum + (p.rental_income || 0), 0);
  
  return {
    monthlyValues: [
      { month: lastMonth, value: totalValue * 0.98, growth: -2 },
      { month: currentMonth, value: totalValue, growth: 2 }
    ],
    monthlyRentalIncome: [
      { month: lastMonth, income: totalRentalIncome * 0.98, growth: -2 },
      { month: currentMonth, income: totalRentalIncome, growth: 2 }
    ]
  };
} 