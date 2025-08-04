import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const { watchlistId } = await request.json();
    
    if (!watchlistId) {
      return NextResponse.json({ error: 'Watchlist ID is required' }, { status: 400 });
    }

    // Get the captured property item
    const { data: capturedProperty, error: propertyError } = await supabase
      .from('captured_properties')
      .select('*')
      .eq('id', watchlistId)
      .single();

    if (propertyError || !capturedProperty) {
      console.error('Property not found:', propertyError);
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check if property already exists in portfolio (using a simple check)
    const { data: existingProperty } = await supabase
      .from('captured_properties')
      .select('id')
      .eq('postcode', capturedProperty.postcode)
      .eq('address', capturedProperty.address)
      .eq('status', 'portfolio')
      .single();

    if (existingProperty) {
      return NextResponse.json({ 
        error: 'This property is already in your portfolio' 
      }, { status: 409 });
    }

    // Instead of adding to a separate portfolio table, we'll mark it as portfolio status
    // and add portfolio-specific data to the notes
    const portfolioNotes = `PORTFOLIO PROPERTY - Added on ${new Date().toLocaleDateString()}
Purchase Price: £${capturedProperty.price.toLocaleString()}
Current Value: £${capturedProperty.price.toLocaleString()}
Property Type: ${capturedProperty.property_type || 'Unknown'}
Bedrooms: ${capturedProperty.bedrooms || 0}
Original URL: ${capturedProperty.original_url}
Captured from: ${capturedProperty.source} on ${new Date(capturedProperty.captured_at).toLocaleDateString()}

${capturedProperty.notes || ''}`;

    // Update the captured property to mark it as portfolio
    const { data: updatedProperty, error: updateError } = await supabase
      .from('captured_properties')
      .update({ 
        status: 'portfolio',
        notes: portfolioNotes
      })
      .eq('id', watchlistId)
      .select()
      .single();

    if (updateError) {
      console.error('Portfolio update error:', updateError);
      return NextResponse.json({ error: 'Failed to add property to portfolio' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Property added to portfolio successfully',
      property: updatedProperty
    });

  } catch (error) {
    console.error('Add to portfolio error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 