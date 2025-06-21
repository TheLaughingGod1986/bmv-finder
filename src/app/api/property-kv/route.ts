import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { SoldPrice } from '../../../../types/sold-price';

export const dynamic = 'force-dynamic'; // Ensure the route is always dynamic

// No manual client creation needed. 
// The library automatically picks up the environment variables from Vercel.

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const postcode = searchParams.get('postcode');
        const limit = parseInt(searchParams.get('limit') || '100', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        let propertyIds: string[] = [];

        if (postcode) {
            const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
            console.log(`Searching for postcode prefix: ${cleanPostcode}`);
            
            const matchingPostcodeKeys: string[] = [];
            
            // SCAN for keys. Note: Vercel KV scan is case-sensitive.
            // We assume postcodes were stored uppercase, which they were.
            for await (const key of kv.scanIterator({ match: `postcode:${cleanPostcode}*`, count: 1000 })) {
                matchingPostcodeKeys.push(key);
            }
            console.log(`Found ${matchingPostcodeKeys.length} matching postcode keys:`, matchingPostcodeKeys);

            if (matchingPostcodeKeys.length > 0) {
                // To avoid type issues with sunion, we'll fetch members for each key
                const idSets = await Promise.all(
                    matchingPostcodeKeys.map(key => kv.smembers(key))
                );
                // Flatten the array of arrays and remove duplicates
                const uniqueIds = new Set(idSets.flat());
                propertyIds = Array.from(uniqueIds);
            }
        } else {
            // This is a fallback for when no postcode is provided.
            // It's not efficient for production but works for demonstration.
            const allKeys = await kv.keys('property:*');
            propertyIds = allKeys.slice(0, 1000).map(key => key.replace('property:', ''));
        }
        
        const total = propertyIds.length;
        console.log(`Found a total of ${total} properties.`);

        const paginatedIds = propertyIds.slice(offset, offset + limit);
        const properties: SoldPrice[] = [];

        if (paginatedIds.length > 0) {
            const pipeline = kv.pipeline();
            paginatedIds.forEach(id => {
                pipeline.hgetall(`property:${id}`);
            });
            
            const results = await pipeline.exec();
            results?.forEach((result) => {
                if (result && typeof result === 'object') {
                    // Ensure the price is a number, as KV returns strings
                    const property = { ...result, price: Number((result as any).price) } as SoldPrice;
                    properties.push(property);
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