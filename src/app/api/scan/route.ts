import { NextRequest, NextResponse } from 'next/server';
import { ScraperManager } from '@/lib/scrapers';
import { BMVCalculator } from '@/lib/bmv-calculator';
import { ScraperConfig } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { postcode, config } = await request.json();

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode is required' },
        { status: 400 }
      );
    }

    // Validate UK postcode format (basic validation)
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    if (!postcodeRegex.test(postcode)) {
      return NextResponse.json(
        { error: 'Invalid UK postcode format' },
        { status: 400 }
      );
    }

    // Default config if not provided
    const defaultConfig: ScraperConfig = {
      sources: {
        rightmove: true,
        zoopla: true,
        onthemarket: true
      },
      radius: 1, // 1 mile radius
      propertyTypes: ['House', 'Flat', 'Terraced', 'Semi-Detached', 'Detached'],
      priceRange: {
        min: 100000,
        max: 1000000
      },
      ...config
    };

    // Initialize scrapers and calculator
    const scraperManager = new ScraperManager();
    const bmvCalculator = new BMVCalculator();

    // Scrape all data
    const scrapedData = await scraperManager.scrapeAll(postcode, defaultConfig);

    // Calculate BMV for each property
    const bmvResults = scrapedData.properties.map(property => 
      bmvCalculator.calculateBMV(property, scrapedData.soldPrices, scrapedData.rentalData)
    );

    // Sort by BMV percentage (highest first)
    const sortedResults = bmvResults.sort((a, b) => b.bmvPercentage - a.bmvPercentage);

    // Calculate area growth
    const areaGrowth = bmvCalculator.calculateAreaGrowth(scrapedData.soldPrices);

    return NextResponse.json({
      success: true,
      data: {
        properties: sortedResults,
        areaGrowth,
        totalProperties: scrapedData.properties.length,
        totalSoldPrices: scrapedData.soldPrices.length,
        postcode: postcode.toUpperCase(),
        scannedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan properties. Please try again.' },
      { status: 500 }
    );
  }
} 