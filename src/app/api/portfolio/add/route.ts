import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseServiceKey ? 'present' : 'missing'
  });
  throw new Error('Supabase environment variables not configured');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PortfolioProperty {
  address: string;
  postcode: string;
  house_number: string;
  property_type: string;
  bedrooms?: number;
  purchase_price: number;
  current_value: number;
  purchase_date: string;
  rent_start_date?: string;
  deal_score: number;
  deal_rating: string;
  bmv_score: number;
  rental_income?: number;
  yield?: number;
  equity: number;
  mortgage_balance?: number;
  notes?: string;
  status?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const body: PortfolioProperty = await request.json();
    
    // DEBUG: Log the received data
    // API received body
    
    // Validate required fields
    const requiredFields = ['address', 'postcode', 'house_number', 'property_type', 'purchase_price', 'current_value', 'purchase_date', 'deal_score', 'deal_rating', 'bmv_score', 'equity'];
    for (const field of requiredFields) {
      if (!body[field as keyof PortfolioProperty]) {
        // Missing field detected
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Ensure bedrooms is a positive integer if provided
    if (body.bedrooms !== undefined) {
      body.bedrooms = Math.round(Math.max(0, body.bedrooms));
    }

    // Calculate yield if rental income is provided
    if (body.rental_income && body.current_value) {
      body.yield = (body.rental_income * 12 / body.current_value) * 100;
    }

    const { data, error } = await supabase
      .from('portfolio_properties')
      .insert({
        user_id: user.id,
        address: body.address,
        postcode: body.postcode,
        house_number: body.house_number,
        property_type: body.property_type,
        bedrooms: body.bedrooms,
        purchase_price: body.purchase_price,
        current_value: body.current_value,
        purchase_date: body.purchase_date,
        rent_start_date: body.rent_start_date,
        deal_score: body.deal_score,
        deal_rating: body.deal_rating,
        bmv_score: body.bmv_score,
        rental_income: body.rental_income,
        yield: body.yield,
        equity: body.equity,
        mortgage_balance: body.mortgage_balance || 0,
        notes: body.notes,
        status: body.status || 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding property to portfolio:', error);
      return NextResponse.json({ error: 'Failed to add property to portfolio' }, { status: 500 });
    }

    return NextResponse.json({ success: true, property: data });

  } catch (error) {
    console.error('Error in portfolio add endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 