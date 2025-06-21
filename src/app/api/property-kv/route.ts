import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { SoldPrice } from '../../../../types/sold-price';

// No manual client creation needed. 
// The library automatically picks up the environment variables from Vercel.

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const postcode = searchParams.get('postcode');
        const limit = parseInt(searchParams.get('limit') || '100', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        let propertyIds: string[] = [];
        let total = 0;

        if (postcode) {
            // Use postcode index for faster lookups
            const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
            propertyIds = await kv.smembers(`postcode:${cleanPostcode}`);
            total = propertyIds.length;
        } else {
            // Get all properties (this might be slow for large datasets)
            // In production, you might want to implement a different strategy
            const totalProperties = await kv.get('total_properties') as number;
            total = totalProperties || 0;
            
            // For now, we'll get a sample - in production you'd want pagination keys
            const sampleSize = Math.min(limit + offset, 1000);
            const allKeys = await kv.keys('property:*');
            propertyIds = allKeys.slice(offset, offset + sampleSize).map(key => key.replace('property:', ''));
        }

        // Get the actual property data
        const paginatedIds = propertyIds.slice(offset, offset + limit);
        const properties: SoldPrice[] = [];

        if (paginatedIds.length > 0) {
            const pipeline = kv.pipeline();
            paginatedIds.forEach(id => {
                pipeline.hgetall(`property:${id}`);
            });
            
            const results = await pipeline.exec();
            results?.forEach((result, index) => {
                if (result && typeof result === 'object') {
                    properties.push(result as SoldPrice);
                }
            });
        }

        return NextResponse.json({
            data: properties,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { message: 'Error processing request', error: (error as Error).message }, 
            { status: 500 }
        );
    }
} 