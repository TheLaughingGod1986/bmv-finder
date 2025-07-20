import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PortfolioProperty {
  id: string;
  user_id: string;
  address: string;
  postcode: string;
  house_number: string;
  property_type: string;
  bedrooms?: number;
  floor_area?: number;
  epc_rating?: string;
  construction_year?: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string;
  last_valuation_date: string;
  deal_score: number;
  deal_rating: string;
  bmv_score: number;
  rental_income?: number;
  yield?: number;
  equity: number;
  mortgage_balance?: number;
  notes?: string;
  status: 'active' | 'sold' | 'watching';
  created_at: string;
  updated_at: string;
}

interface AddToPortfolioRequest {
  address: string;
  postcode: string;
  houseNumber: string;
  propertyType: string;
  bedrooms?: number;
  floorArea?: number;
  epcRating?: string;
  constructionYear?: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  dealScore: number;
  dealRating: string;
  bmvScore: number;
  rentalIncome?: number;
  yield?: number;
  mortgageBalance?: number;
  notes?: string;
  status?: 'active' | 'sold' | 'watching';
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      address,
      postcode,
      houseNumber,
      propertyType,
      bedrooms,
      floorArea,
      epcRating,
      constructionYear,
      purchasePrice,
      currentValue,
      purchaseDate,
      dealScore,
      dealRating,
      bmvScore,
      rentalIncome,
      yield: yieldPercent,
      mortgageBalance,
      notes,
      status = 'active',
      userId
    }: AddToPortfolioRequest = body;

    // Validate required fields
    if (!address || !postcode || !houseNumber || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: address, postcode, houseNumber, userId' },
        { status: 400 }
      );
    }

    // Check if property already exists in user's portfolio
    const { data: existingProperty, error: checkError } = await supabase
      .from('portfolio_properties')
      .select('id')
      .eq('user_id', userId)
      .eq('address', address)
      .eq('postcode', postcode)
      .eq('house_number', houseNumber)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing property:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing property' },
        { status: 500 }
      );
    }

    if (existingProperty) {
      return NextResponse.json(
        { error: 'Property already exists in your portfolio' },
        { status: 409 }
      );
    }

    // Calculate equity
    const equity = currentValue - (mortgageBalance || 0);

    // Create new portfolio property
    const newProperty: Omit<PortfolioProperty, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      address,
      postcode,
      house_number: houseNumber,
      property_type: propertyType,
      bedrooms,
      floor_area: floorArea,
      epc_rating: epcRating,
      construction_year: constructionYear,
      purchase_price: purchasePrice,
      current_value: currentValue,
      purchase_date: purchaseDate,
      last_valuation_date: new Date().toISOString(),
      deal_score: dealScore,
      deal_rating: dealRating,
      bmv_score: bmvScore,
      rental_income: rentalIncome,
      yield: yieldPercent,
      equity,
      mortgage_balance: mortgageBalance,
      notes,
      status
    };

    // Insert into database
    const { data: insertedProperty, error: insertError } = await supabase
      .from('portfolio_properties')
      .insert([newProperty])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting property:', insertError);
      return NextResponse.json(
        { error: 'Failed to add property to portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Property added to portfolio successfully',
      property: insertedProperty
    });

  } catch (error) {
    console.error('Error adding property to portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to add property to portfolio' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: properties, error } = await supabase
      .from('portfolio_properties')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching portfolio:', error);
      return NextResponse.json(
        { error: 'Failed to fetch portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      portfolio: properties || []
    });

  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
} 