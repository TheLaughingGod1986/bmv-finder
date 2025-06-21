import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import path from 'path';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import type { SoldPrice } from '../../../../types/sold-price';

export const dynamic = 'force-dynamic';

// --- Caching All Records in Memory ---
let allRecordsCache: SoldPrice[] | null = null;
// ------------------------------------

const columns = [
    'id', 'price', 'date_of_transfer', 'postcode', 'property_type',
    'old_new', 'duration', 'paon', 'saon', 'street', 'locality',
    'town_city', 'district', 'county', 'ppd_category_type', 'record_status'
];

async function getRecords() {
    if (allRecordsCache) {
        console.log('[KV Populator] Using cached records.');
        return allRecordsCache;
    }

    console.log('[KV Populator] Reading and parsing CSV for the first time...');
    const csvFilePath = path.join(process.cwd(), 'pp-complete.csv');
    const fileContent = await fs.readFile(csvFilePath, 'utf8');
    const records = parse(fileContent, {
        columns: columns,
        skip_empty_lines: true,
        cast: (value, context) => {
            if (context.column === 'price') {
                return parseInt(value, 10) || null;
            }
            return value;
        }
    });
    allRecordsCache = records;
    console.log('[KV Populator] CSV parsed and cached.');
    return records;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const offset = parseInt(searchParams.get('offset') || '0', 10);
        const limit = parseInt(searchParams.get('limit') || '5000', 10);
        const action = searchParams.get('action');

        if (action === 'clear') {
            console.log('[KV Populator] Clearing all existing property and postcode data...');
            
            // Clear the in-memory cache as well
            allRecordsCache = null;

            const clearKeysByPattern = async (pattern: string) => {
                const keysToDelete: string[] = [];
                for await (const key of kv.scanIterator({ match: pattern })) {
                    keysToDelete.push(key);
                }

                if (keysToDelete.length > 0) {
                    const batchSize = 500;
                    for (let i = 0; i < keysToDelete.length; i += batchSize) {
                        const batch = keysToDelete.slice(i, i + batchSize);
                        await kv.del(...batch);
                    }
                    console.log(`[KV Populator] Deleted ${keysToDelete.length} keys for pattern "${pattern}".`);
                } else {
                    console.log(`[KV Populator] No keys found for pattern "${pattern}".`);
                }
            };

            await clearKeysByPattern('property:*');
            await clearKeysByPattern('postcode:*');
            
            return NextResponse.json({ message: 'All property and postcode data has been cleared successfully.' });
        }
        
        const allRecords: SoldPrice[] = await getRecords();
        const totalRecords = allRecords.length;
        const chunk = allRecords.slice(offset, offset + limit);

        if (chunk.length === 0) {
            await kv.set('total_properties', totalRecords);
            return NextResponse.json({ message: 'Processing complete. No more records to process.' });
        }
        
        const pipeline = kv.pipeline();
        const postcodeIndex: Record<string, Set<string>> = {};

        chunk.forEach(record => {
            if (record.id) {
                // Add property data
                pipeline.hset(`property:${record.id}`, { ...record });

                // Process postcode index
                if (record.postcode) {
                    const cleanPostcode = record.postcode.replace(/\s/g, '').toUpperCase();
                    if (!postcodeIndex[cleanPostcode]) postcodeIndex[cleanPostcode] = new Set();
                    postcodeIndex[cleanPostcode].add(record.id);

                    const areaMatch = cleanPostcode.match(/^([A-Z]+[0-9]+)/);
                    if (areaMatch) {
                        const area = areaMatch[1];
                        if (!postcodeIndex[area]) postcodeIndex[area] = new Set();
                        postcodeIndex[area].add(record.id);
                    }
                }
            }
        });

        Object.keys(postcodeIndex).forEach(postcode => {
            const members = Array.from(postcodeIndex[postcode]);
            if (members.length > 0) {
                for (const member of members) {
                    pipeline.sadd(`postcode:${postcode}`, member);
                }
            }
        });
        
        await pipeline.exec();

        const message = `Successfully processed ${chunk.length} records. Offset: ${offset}, Limit: ${limit}.`;
        console.log(`[KV Populator] ${message}`);
        return NextResponse.json({ message, nextOffset: offset + chunk.length, totalRecords });

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error('[KV Populator] Error:', errorMessage);
        return NextResponse.json({ message: 'An error occurred', error: errorMessage }, { status: 500 });
    }
} 