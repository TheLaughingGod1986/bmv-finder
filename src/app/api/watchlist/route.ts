import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

const supabase = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey !== 'placeholder-key'
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Simple auth check for hybrid system
async function getCurrentUser(request: NextRequest) {
  try {
    // Try to get user from Supabase session
    if (supabase) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          return {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            role: 'user',
            permissions: []
          };
        }
      }
    }

    // Fallback: check for mock auth in cookies
    const mockAuthCookie = request.cookies.get('mock-auth');
    if (mockAuthCookie) {
      try {
        const mockUser = JSON.parse(mockAuthCookie.value);
        if (mockUser && mockUser.id) {
          return {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: 'user',
            permissions: []
          };
        }
      } catch (e) {
        // Invalid cookie
      }
    }

    return null;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}

// Watchlist property interface
interface WatchlistProperty {
  id: string;
  userId: string;
  propertyId: string;
  title: string;
  address: string;
  postcode: string;
  price: number;
  priceFormatted: string;
  bedrooms?: number;
  bathrooms?: number;
  propertyType: string;
  listingType: 'sale' | 'rent';
  imageUrl?: string;
  description?: string;
  sourceUrl: string;
  source: 'chrome-extension' | 'manual' | 'api';
  bmvScore?: number;
  marketValue?: number;
  potentialProfit?: number;
  addedAt: Date;
  lastUpdated: Date;
  notes?: string;
  tags: string[];
  isActive: boolean;
  metadata?: {
    originalPrice?: number;
    priceHistory?: Array<{ price: number; date: Date; source: string }>;
    viewCount?: number;
    lastViewed?: Date;
    alerts?: Array<{ type: string; value: number; triggered: boolean }>;
  };
}

// Validation schemas
const AddPropertySchema = z.object({
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
  source: z.enum(['chrome-extension', 'manual', 'api']).default('manual'),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.object({
    originalPrice: z.number().optional(),
    viewCount: z.number().optional()
  }).optional()
});

const UpdatePropertySchema = z.object({
  title: z.string().optional(),
  price: z.number().positive().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  metadata: z.object({
    viewCount: z.number().optional(),
    lastViewed: z.string().optional()
  }).optional()
});

// Mock database (replace with real database)
const watchlistDB = new Map<string, WatchlistProperty>();

// GET /api/watchlist - Get user's watchlist
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'addedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';

    // Get user's watchlist properties
    let properties = Array.from(watchlistDB.values())
      .filter(prop => prop.userId === user.id);

    // Apply filters
    if (filter !== 'all') {
      if (filter === 'active') {
        properties = properties.filter(prop => prop.isActive);
      } else if (filter === 'inactive') {
        properties = properties.filter(prop => !prop.isActive);
      } else if (filter === 'chrome-extension') {
        properties = properties.filter(prop => prop.source === 'chrome-extension');
      } else if (filter === 'manual') {
        properties = properties.filter(prop => prop.source === 'manual');
      }
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      properties = properties.filter(prop => 
        prop.title.toLowerCase().includes(searchLower) ||
        prop.address.toLowerCase().includes(searchLower) ||
        prop.postcode.toLowerCase().includes(searchLower) ||
        prop.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    properties.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'addedAt':
          aValue = new Date(a.addedAt).getTime();
          bValue = new Date(b.addedAt).getTime();
          break;
        case 'lastUpdated':
          aValue = new Date(a.lastUpdated).getTime();
          bValue = new Date(b.lastUpdated).getTime();
          break;
        case 'bmvScore':
          aValue = a.bmvScore || 0;
          bValue = b.bmvScore || 0;
          break;
        default:
          aValue = new Date(a.addedAt).getTime();
          bValue = new Date(b.addedAt).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const total = properties.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProperties = properties.slice(startIndex, endIndex);

    // Calculate statistics
    const stats = {
      total: properties.length,
      active: properties.filter(p => p.isActive).length,
      inactive: properties.filter(p => !p.isActive).length,
      chromeExtension: properties.filter(p => p.source === 'chrome-extension').length,
      manual: properties.filter(p => p.source === 'manual').length,
      totalValue: properties.reduce((sum, p) => sum + p.price, 0),
      averagePrice: properties.length > 0 ? properties.reduce((sum, p) => sum + p.price, 0) / properties.length : 0
    };

    return NextResponse.json({
      success: true,
      properties: paginatedProperties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1
      },
      stats,
      filters: {
        sortBy,
        sortOrder,
        filter,
        search
      }
    });
  } catch (error) {
    console.error('Failed to get watchlist:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get watchlist',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/watchlist - Add property to watchlist
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = AddPropertySchema.parse(body);

    // Check if property already exists for this user
    const existingProperty = Array.from(watchlistDB.values())
      .find(prop => prop.userId === user.id && prop.propertyId === validatedData.propertyId);

    if (existingProperty) {
      return NextResponse.json({
        success: false,
        error: 'Property already in watchlist',
        property: existingProperty
      }, { status: 409 });
    }

    // Create new watchlist property
    const property: WatchlistProperty = {
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
      source: validatedData.source,
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
          source: validatedData.source
        }],
        viewCount: validatedData.metadata?.viewCount || 0,
        lastViewed: new Date(),
        alerts: []
      }
    };

    // Save to database
    watchlistDB.set(property.id, property);

    return NextResponse.json({
      success: true,
      message: 'Property added to watchlist successfully',
      property
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Failed to add property to watchlist:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add property to watchlist',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/watchlist - Update watchlist property
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Property ID is required'
      }, { status: 400 });
    }

    const validatedUpdates = UpdatePropertySchema.parse(updates);

    // Find the property
    const property = watchlistDB.get(id);
    if (!property || property.userId !== user.id) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 });
    }

    // Update the property
    const updatedProperty = {
      ...property,
      ...validatedUpdates,
      lastUpdated: new Date()
    };

    // Update metadata if provided
    if (validatedUpdates.metadata) {
      updatedProperty.metadata = {
        ...property.metadata,
        ...validatedUpdates.metadata
      };
    }

    // Save updated property
    watchlistDB.set(id, updatedProperty);

    return NextResponse.json({
      success: true,
      message: 'Property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Failed to update watchlist property:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update watchlist property',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/watchlist - Remove property from watchlist
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Property ID is required'
      }, { status: 400 });
    }

    // Find the property
    const property = watchlistDB.get(id);
    if (!property || property.userId !== user.id) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 });
    }

    // Remove from database
    watchlistDB.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Property removed from watchlist successfully'
    });
  } catch (error) {
    console.error('Failed to remove property from watchlist:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove property from watchlist',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}