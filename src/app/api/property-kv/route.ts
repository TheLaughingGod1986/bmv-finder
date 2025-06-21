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

        console.log(`[KV API] Request received. Postcode param: "${postcode}"`);

        if (postcode) {
            const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
            const searchPattern = `postcode:${cleanPostcode}*`;
            console.log(`[KV API] Scanning for keys with pattern: "${searchPattern}"`);

            const matchingPostcodeKeys: string[] = [];
            for await (const key of kv.scanIterator({ match: searchPattern })) {
                matchingPostcodeKeys.push(key);
            }
            console.log(`[KV API] Found ${matchingPostcodeKeys.length} matching postcode keys.`);

            if (matchingPostcodeKeys.length > 0) {
                // Use SUNION to get all unique property IDs from the matching postcode sets
                const allIds = await kv.sunion(...matchingPostcodeKeys as [string, ...string[]]);
                propertyIds = allIds.map(id => String(id));
            }
        } else {
            // This is a fallback for when no postcode is provided.
            // It's not efficient for production but works for demonstration.
            const allKeys = await kv.keys('property:*');
            propertyIds = allKeys.slice(0, 1000).map(key => key.replace('property:', ''));
        }
        
        const total = propertyIds.length;
        console.log(`[KV API] Found a total of ${total} properties to return.`);

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