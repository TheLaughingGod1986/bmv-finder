import { NextRequest, NextResponse } from 'next/server';
import { getDatabasePool } from '@/lib/database/connection';
import { PropertySchema, PortfolioPropertySchema } from '@/lib/database/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyData, portfolioPropertyData } = body;
    
    console.log('Test property flow - Input data:', { propertyData, portfolioPropertyData });
    
    const pool = getDatabasePool();
    const client = await pool.connect();
    
    try {
      // Step 1: Check if property already exists
      let propertyResult = await client.query(
        'SELECT * FROM properties WHERE address = $1 AND postcode = $2',
        [propertyData.address, propertyData.postcode]
      );
      
      console.log('Step 1 - Property check result:', propertyResult.rows);
      
      let property;
      if (propertyResult.rows.length > 0) {
        console.log('Property exists, updating...');
        // Property exists, update it
        const existingProperty = propertyResult.rows[0];
        console.log('Existing property:', existingProperty);
        
        // Update the property
        propertyResult = await client.query(
          `UPDATE properties 
           SET property_type = $1, bedrooms = $2, floor_area = $3, epc_rating = $4, 
               estimated_value = $5, rental_estimate = $6, updated_at = NOW()
           WHERE address = $7 AND postcode = $8 
           RETURNING *`,
          [
            propertyData.propertyType || 'Unknown',
            propertyData.bedrooms || 0,
            propertyData.floorArea || 0,
            propertyData.epcRating || 'Unknown',
            propertyData.currentValuation || 0,
            JSON.stringify({ monthly: propertyData.recommendedRent || 0, yearly: (propertyData.recommendedRent || 0) * 12 }),
            propertyData.address,
            propertyData.postcode
          ]
        );
        
        property = propertyResult.rows[0];
      } else {
        console.log('Property does not exist, inserting...');
        // Property doesn't exist, insert it
        propertyResult = await client.query(
          'INSERT INTO properties (address, postcode, property_type, bedrooms, floor_area, epc_rating, estimated_value, rental_estimate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
          [
            propertyData.address,
            propertyData.postcode,
            propertyData.propertyType || 'Unknown',
            propertyData.bedrooms || 0,
            propertyData.floorArea || 0,
            propertyData.epcRating || 'Unknown',
            propertyData.currentValuation || 0,
            JSON.stringify({ monthly: propertyData.recommendedRent || 0, yearly: (propertyData.recommendedRent || 0) * 12 })
          ]
        );
        
        property = propertyResult.rows[0];
      }
      
      console.log('Step 2 - Property after insert/update:', property);
      
      // Step 3: Transform the result
      const transformedProperty = {
        id: property.id,
        address: property.address,
        postcode: property.postcode,
        propertyType: property.property_type,
        bedrooms: property.bedrooms || 0,
        floorArea: property.floor_area || 0,
        epcRating: property.epc_rating || 'Unknown',
        lastSalePrice: property.last_sale_price || 0,
        lastSaleDate: property.last_sale_date || new Date(),
        estimatedValue: property.estimated_value || 0,
        rentalEstimate: property.rental_estimate || {},
        marketData: property.market_data || {},
        createdAt: property.created_at,
        updatedAt: property.updated_at
      };
      
      console.log('Step 3 - Transformed property:', transformedProperty);
      
      // Step 4: Validate with Zod schema
      try {
        const parsedProperty = PropertySchema.parse(transformedProperty);
        console.log('Step 4 - Zod validation passed:', parsedProperty);
        
        // Step 5: Add to portfolio
        const portfolioPropertyResult = await client.query(
          'INSERT INTO portfolio_properties (portfolio_id, property_id, added_at, notes) VALUES ($1, $2, $3, $4) RETURNING *',
          ['c496cb2a-c9eb-4c14-96b7-45abb19ee754', parsedProperty.id, new Date(), portfolioPropertyData?.notes]
        );
        
        console.log('Step 5 - Portfolio property added:', portfolioPropertyResult.rows[0]);
        
        return NextResponse.json({
          success: true,
          message: 'Property flow test completed successfully',
          data: {
            property: parsedProperty,
            portfolioProperty: portfolioPropertyResult.rows[0]
          }
        });
        
      } catch (zodError) {
        console.error('Zod validation failed:', zodError);
        return NextResponse.json({
          success: false,
          error: 'Zod validation failed',
          details: zodError instanceof Error ? zodError.message : 'Unknown error',
          property: transformedProperty
        }, { status: 400 });
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Property flow test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Property flow test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

