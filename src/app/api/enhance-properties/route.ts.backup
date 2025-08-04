import { NextRequest, NextResponse } from 'next/server';
import { BMVScoreEngine } from '../../../lib/bmvScoreEngine';
import { SoldPrice } from '../../../../types/sold-price';

export async function POST(req: NextRequest) {
  try {
    const { properties } = await req.json();
    
    if (!properties || !Array.isArray(properties)) {
      return NextResponse.json({ error: 'Properties array is required' }, { status: 400 });
    }

    // Enhance each property with BMV score data
    const enhancedProperties = await Promise.all(properties.map(async (property: SoldPrice) => {
      const bmvData = await BMVScoreEngine.calculateBMVScore(property, properties);
      
      return {
        ...property,
        bmvScore: bmvData.bmvScore,
        marketValue: bmvData.marketValue,
        askingPrice: bmvData.askingPrice,
        yield: bmvData.rentalYield,
        areaGrowth: bmvData.areaGrowth,
        postcodeYield: bmvData.postcodeYield,
        postcodeGrowth: bmvData.postcodeGrowth
      };
    }));

    // Calculate heatmap data
    const heatmapData = await BMVScoreEngine.calculateHeatmapData(properties);

    return NextResponse.json({
      enhancedProperties,
      heatmapData,
      summary: {
        totalProperties: enhancedProperties.length,
        averageBMVScore: Math.round(enhancedProperties.reduce((sum, p) => sum + (p.bmvScore || 0), 0) / enhancedProperties.length),
        averageYield: Math.round(enhancedProperties.reduce((sum, p) => sum + (p.yield || 0), 0) / enhancedProperties.length * 10) / 10,
        averageGrowth: Math.round(enhancedProperties.reduce((sum, p) => sum + (p.areaGrowth || 0), 0) / enhancedProperties.length * 10) / 10,
        postcodeCount: heatmapData.length
      }
    });

  } catch (error) {
    console.error('Error enhancing properties:', error);
    return NextResponse.json(
      { error: 'Failed to enhance properties' },
      { status: 500 }
    );
  }
} 