import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, action, data } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'calculate_fair_value':
        return await calculateFairValue(propertyId, data);
      
      case 'add_offer':
        return await addOffer(propertyId, data);
      
      case 'update_offer':
        return await updateOffer(data.offerId, data);
      
      case 'get_offer_history':
        return await getOfferHistory(propertyId);
      
      case 'update_notes':
        return await updateNotes(propertyId, data.notes);
      
      case 'update_condition':
        return await updateCondition(propertyId, data.condition);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Fair value analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function calculateFairValue(propertyId: string, data: any) {
  try {
    // Get property data
    const { data: property, error: propertyError } = await supabase
      .from('captured_properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Calculate fair value using database function
    const { data: fairValueResult, error: fairValueError } = await supabase
      .rpc('calculate_fair_value', {
        p_price: property.price,
        p_bedrooms: property.bedrooms || 0,
        p_property_type: property.property_type || 'house',
        p_postcode: property.postcode || '',
        p_condition: data.condition || property.property_condition || 'average'
      });

    if (fairValueError) {
      console.error('Fair value calculation error:', fairValueError);
      return NextResponse.json({ error: 'Failed to calculate fair value' }, { status: 500 });
    }

    // Calculate fair bid amount
    const { data: fairBidResult, error: fairBidError } = await supabase
      .rpc('calculate_fair_bid', {
        p_fair_value: fairValueResult,
        p_condition: data.condition || property.property_condition || 'average'
      });

    if (fairBidError) {
      console.error('Fair bid calculation error:', fairBidError);
      return NextResponse.json({ error: 'Failed to calculate fair bid' }, { status: 500 });
    }

    // Update property with calculated values
    const { error: updateError } = await supabase
      .from('captured_properties')
      .update({
        estimated_fair_value: fairValueResult,
        fair_bid_amount: fairBidResult,
        property_condition: data.condition || property.property_condition || 'average'
      })
      .eq('id', propertyId);

    if (updateError) {
      console.error('Property update error:', updateError);
    }

    return NextResponse.json({
      success: true,
      fair_value: fairValueResult,
      fair_bid: fairBidResult,
      asking_price: property.price,
      bmv_percentage: ((fairValueResult - property.price) / fairValueResult) * 100,
      recommended_discount: ((fairValueResult - fairBidResult) / fairValueResult) * 100
    });

  } catch (error) {
    console.error('Calculate fair value error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function addOffer(propertyId: string, data: any) {
  try {
    const { data: offer, error } = await supabase
      .from('property_offers')
      .insert({
        property_id: propertyId,
        offer_amount: data.offer_amount,
        offer_notes: data.notes || '',
        offer_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Add offer error:', error);
      return NextResponse.json({ error: 'Failed to add offer' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      offer: offer
    });

  } catch (error) {
    console.error('Add offer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateOffer(offerId: string, data: any) {
  try {
    const updateData: any = {};
    
    if (data.offer_status) updateData.offer_status = data.offer_status;
    if (data.counter_offer_amount) updateData.counter_offer_amount = data.counter_offer_amount;
    if (data.final_decision) updateData.final_decision = data.final_decision;
    if (data.offer_notes) updateData.offer_notes = data.offer_notes;

    if (data.counter_offer_amount) {
      updateData.counter_offer_date = new Date().toISOString();
    }
    if (data.final_decision) {
      updateData.decision_date = new Date().toISOString();
    }

    const { data: offer, error } = await supabase
      .from('property_offers')
      .update(updateData)
      .eq('id', offerId)
      .select()
      .single();

    if (error) {
      console.error('Update offer error:', error);
      return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      offer: offer
    });

  } catch (error) {
    console.error('Update offer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getOfferHistory(propertyId: string) {
  try {
    const { data: offers, error } = await supabase
      .from('property_offers')
      .select('*')
      .eq('property_id', propertyId)
      .order('offer_date', { ascending: false });

    if (error) {
      console.error('Get offer history error:', error);
      return NextResponse.json({ error: 'Failed to get offer history' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      offers: offers || []
    });

  } catch (error) {
    console.error('Get offer history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateNotes(propertyId: string, notes: string) {
  try {
    const { error } = await supabase
      .from('captured_properties')
      .update({ user_notes: notes })
      .eq('id', propertyId);

    if (error) {
      console.error('Update notes error:', error);
      return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notes updated successfully'
    });

  } catch (error) {
    console.error('Update notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateCondition(propertyId: string, condition: string) {
  try {
    const { error } = await supabase
      .from('captured_properties')
      .update({ property_condition: condition })
      .eq('id', propertyId);

    if (error) {
      console.error('Update condition error:', error);
      return NextResponse.json({ error: 'Failed to update condition' }, { status: 500 });
    }

    // Recalculate fair value with new condition
    return await calculateFairValue(propertyId, { condition });

  } catch (error) {
    console.error('Update condition error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 