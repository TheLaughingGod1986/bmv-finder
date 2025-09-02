import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

// Chrome extension property data schema
const ChromeExtensionPropertySchema = z.object({
  propertyId: z.string().min(1),
  title: z.string().min(1),
  address: z.string().min(1),
  postcode: z.string().min(1),
  price: z.number().positive(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  propertyType: z.string(),
  listingType: z.enum(['sale', 'rent']),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
  sourceUrl: z.string().url(),
  website: z.string().optional(), // e.g., 'rightmove.co.uk', 'zoopla.co.uk'
  listingDate: z.string().optional(),
  agent: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.object({
    originalPrice: z.number().optional(),
    viewCount: z.number().optional(),
    capturedAt: z.string().optional(),
    pageTitle: z.string().optional(),
    pageDescription: z.string().optional()
  }).optional()
});

// POST /api/watchlist/chrome-extension - Add property from Chrome extension
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse;
    }

    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = ChromeExtensionPropertySchema.parse(body);

    // Check if property already exists for this user
    const existingProperties = Array.from(require('../../route').watchlistDB?.values() || [])
      .filter(prop => prop.userId === user.id && prop.propertyId === validatedData.propertyId);

    if (existingProperties.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Property already in watchlist',
        property: existingProperties[0]
      }, { status: 409 });
    }

    // Create new watchlist property from Chrome extension
    const property = {
      id: `watchlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      propertyId: validatedData.propertyId,
      title: validatedData.title,
      address: validatedData.address,
      postcode: validatedData.postcode,
      price: validatedData.price,
      priceFormatted: new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(validatedData.price),
      bedrooms: validatedData.bedrooms,
      bathrooms: validatedData.bathrooms,
      propertyType: validatedData.propertyType,
      listingType: validatedData.listingType,
      imageUrl: validatedData.imageUrl,
      description: validatedData.description,
      sourceUrl: validatedData.sourceUrl,
      source: 'chrome-extension' as const,
      bmvScore: undefined, // Will be calculated later
      marketValue: undefined, // Will be calculated later
      potentialProfit: undefined, // Will be calculated later
      addedAt: new Date(),
      lastUpdated: new Date(),
      notes: validatedData.notes,
      tags: validatedData.tags,
      isActive: true,
      metadata: {
        originalPrice: validatedData.metadata?.originalPrice || validatedData.price,
        priceHistory: [{
          price: validatedData.price,
          date: new Date(),
          source: 'chrome-extension'
        }],
        viewCount: validatedData.metadata?.viewCount || 0,
        lastViewed: new Date(),
        alerts: [],
        website: validatedData.website,
        listingDate: validatedData.listingDate,
        agent: validatedData.agent,
        capturedAt: validatedData.metadata?.capturedAt,
        pageTitle: validatedData.metadata?.pageTitle,
        pageDescription: validatedData.metadata?.pageDescription
      }
    };

    // Save to database (using the same mock DB from the main route)
    const watchlistDB = require('../../route').watchlistDB;
    if (watchlistDB) {
      watchlistDB.set(property.id, property);
    }

    // Log the Chrome extension capture
    console.log(`📱 Chrome extension captured property: ${property.title} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Property captured from Chrome extension successfully',
      property,
      stats: {
        totalProperties: Array.from(watchlistDB?.values() || [])
          .filter(prop => prop.userId === user.id).length,
        chromeExtensionProperties: Array.from(watchlistDB?.values() || [])
          .filter(prop => prop.userId === user.id && prop.source === 'chrome-extension').length
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Failed to capture property from Chrome extension:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to capture property from Chrome extension',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/watchlist/chrome-extension - Get Chrome extension specific data
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse;
    }

    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const website = searchParams.get('website');

    // Get Chrome extension properties for the user
    const watchlistDB = require('../../route').watchlistDB;
    let properties = Array.from(watchlistDB?.values() || [])
      .filter(prop => prop.userId === user.id && prop.source === 'chrome-extension');

    // Filter by website if specified
    if (website) {
      properties = properties.filter(prop => 
        prop.metadata?.website === website
      );
    }

    // Get statistics
    const stats = {
      total: properties.length,
      byWebsite: properties.reduce((acc, prop) => {
        const site = prop.metadata?.website || 'unknown';
        acc[site] = (acc[site] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalValue: properties.reduce((sum, prop) => sum + prop.price, 0),
      averagePrice: properties.length > 0 ? properties.reduce((sum, prop) => sum + prop.price, 0) / properties.length : 0,
      recentCaptures: properties
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .slice(0, 5)
    };

    return NextResponse.json({
      success: true,
      properties,
      stats,
      filters: { website }
    });
  } catch (error) {
    console.error('Failed to get Chrome extension watchlist:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get Chrome extension watchlist',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/watchlist/chrome-extension - Update Chrome extension property
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse;
    }

    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const body = await request.json();
    const { id, price, notes, tags, isActive } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Property ID is required'
      }, { status: 400 });
    }

    // Find the property
    const watchlistDB = require('../../route').watchlistDB;
    const property = watchlistDB?.get(id);
    
    if (!property || property.userId !== user.id || property.source !== 'chrome-extension') {
      return NextResponse.json({
        success: false,
        error: 'Chrome extension property not found'
      }, { status: 404 });
    }

    // Update the property
    const updatedProperty = {
      ...property,
      ...(price !== undefined && { 
        price,
        priceFormatted: new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(price)
      }),
      ...(notes !== undefined && { notes }),
      ...(tags !== undefined && { tags }),
      ...(isActive !== undefined && { isActive }),
      lastUpdated: new Date()
    };

    // Update price history if price changed
    if (price !== undefined && price !== property.price) {
      updatedProperty.metadata = {
        ...property.metadata,
        priceHistory: [
          ...(property.metadata?.priceHistory || []),
          {
            price,
            date: new Date(),
            source: 'chrome-extension-update'
          }
        ]
      };
    }

    // Save updated property
    watchlistDB?.set(id, updatedProperty);

    return NextResponse.json({
      success: true,
      message: 'Chrome extension property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    console.error('Failed to update Chrome extension property:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update Chrome extension property',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
