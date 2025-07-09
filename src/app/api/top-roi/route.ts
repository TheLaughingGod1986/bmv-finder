import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'https://5210a2528e1a499e8b6ee0214cd4fbca.us-central1.gcp.cloud.es.io:443',
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY || ''
  },
  tls: {
    rejectUnauthorized: false
  }
});

const PROPERTIES_INDEX = 'properties';
const HPI_INDEX = 'house_price_index';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const region = searchParams.get('region');
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '1000000');

    // Build query for properties with estimated values
    const query: any = {
      bool: {
        must: [
          { exists: { field: 'estimatedValue' } },
          { exists: { field: 'growthPercentage' } }
        ],
        filter: [
          { range: { price: { gte: minPrice, lte: maxPrice } } }
        ]
      }
    };

    if (region) {
      query.bool.must.push({ term: { hpiRegion: region } });
    }

    // Get properties with ROI analysis
    const response = await client.search({
      index: PROPERTIES_INDEX,
      body: {
        query,
        sort: [
          { growthPercentage: { order: 'desc' } }
        ],
        size: limit * 2, // Get more to filter
        _source: [
          'id', 'price', 'estimatedValue', 'growthPercentage', 
          'postcode', 'street', 'town_city', 'propertyType',
          'dateOfTransfer', 'hpiRegion', 'hpiGrowthFactor'
        ]
      }
    });

    const properties = response.hits.hits.map(hit => hit._source as any);

    // Calculate additional ROI metrics
    const roiProperties = properties.map((property: any) => {
      const absoluteGrowth = property.estimatedValue - property.price;
      const roiPercentage = (absoluteGrowth / property.price) * 100;
      const annualizedRoi = calculateAnnualizedROI(
        property.dateOfTransfer,
        roiPercentage
      );

      return {
        ...property,
        absoluteGrowth,
        roiPercentage,
        annualizedRoi,
        // Calculate potential rental yield (estimated)
        estimatedRentalYield: estimateRentalYield(property.estimatedValue, property.propertyType)
      };
    });

    // Sort by annualized ROI and take top results
    const topRoi = roiProperties
      .sort((a, b) => b.annualizedRoi - a.annualizedRoi)
      .slice(0, limit);

    // Group by postcode for area analysis
    const postcodeAnalysis = analyzePostcodes(roiProperties);

    return NextResponse.json({
      success: true,
      data: {
        topRoi,
        postcodeAnalysis,
        summary: {
          totalAnalyzed: properties.length,
          averageRoi: roiProperties.reduce((sum, p) => sum + p.roiPercentage, 0) / roiProperties.length,
          averageAnnualizedRoi: roiProperties.reduce((sum, p) => sum + p.annualizedRoi, 0) / roiProperties.length,
          topRegions: getTopRegions(roiProperties)
        }
      }
    });

  } catch (error) {
    console.error('Error analyzing ROI:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to analyze ROI',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function calculateAnnualizedROI(saleDate: string, totalRoiPercentage: number): number {
  const saleDateObj = new Date(saleDate);
  const now = new Date();
  const yearsSinceSale = (now.getTime() - saleDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  if (yearsSinceSale <= 0) return totalRoiPercentage;
  
  // Annualized ROI = (1 + total_return)^(1/years) - 1
  const totalReturn = totalRoiPercentage / 100;
  const annualizedReturn = Math.pow(1 + totalReturn, 1 / yearsSinceSale) - 1;
  
  return annualizedReturn * 100;
}

function estimateRentalYield(estimatedValue: number, propertyType: string): number {
  // Rough rental yield estimates by property type
  const yieldMultipliers = {
    'D': 0.045, // Detached - 4.5%
    'S': 0.048, // Semi-detached - 4.8%
    'T': 0.052, // Terraced - 5.2%
    'F': 0.055, // Flat - 5.5%
    'O': 0.050  // Other - 5.0%
  };

  const multiplier = yieldMultipliers[propertyType as keyof typeof yieldMultipliers] || 0.050;
  return estimatedValue * multiplier;
}

function analyzePostcodes(properties: any[]): any[] {
  const postcodeMap = new Map();

  properties.forEach(property => {
    const postcode = property.postcode;
    if (!postcodeMap.has(postcode)) {
      postcodeMap.set(postcode, {
        postcode,
        propertyCount: 0,
        averageRoi: 0,
        averageGrowth: 0,
        totalValue: 0,
        properties: []
      });
    }

    const postcodeData = postcodeMap.get(postcode);
    postcodeData.propertyCount++;
    postcodeData.totalValue += property.estimatedValue;
    postcodeData.properties.push(property);
  });

  // Calculate averages
  postcodeMap.forEach((data, postcode) => {
    data.averageRoi = data.properties.reduce((sum: number, p: any) => sum + p.roiPercentage, 0) / data.propertyCount;
    data.averageGrowth = data.properties.reduce((sum: number, p: any) => sum + p.growthPercentage, 0) / data.propertyCount;
  });

  return Array.from(postcodeMap.values())
    .sort((a, b) => b.averageRoi - a.averageRoi)
    .slice(0, 10);
}

function getTopRegions(properties: any[]): any[] {
  const regionMap = new Map();

  properties.forEach(property => {
    const region = property.hpiRegion;
    if (!regionMap.has(region)) {
      regionMap.set(region, {
        region,
        propertyCount: 0,
        averageRoi: 0,
        totalValue: 0
      });
    }

    const regionData = regionMap.get(region);
    regionData.propertyCount++;
    regionData.totalValue += property.estimatedValue;
  });

  // Calculate averages
  regionMap.forEach((data, region) => {
    const regionProperties = properties.filter(p => p.hpiRegion === region);
    data.averageRoi = regionProperties.reduce((sum, p) => sum + p.roiPercentage, 0) / regionProperties.length;
  });

  return Array.from(regionMap.values())
    .sort((a, b) => b.averageRoi - a.averageRoi)
    .slice(0, 5);
} 