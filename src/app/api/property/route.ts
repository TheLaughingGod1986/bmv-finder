import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import type { SoldPrice } from '../../../../types/sold-price';

const csvFilePath = path.join(process.cwd(), 'pp-complete.csv');

let cachedRecords: SoldPrice[];

const columns = [
    'id', 'price', 'date_of_transfer', 'postcode', 'property_type',
    'old_new', 'duration', 'paon', 'saon', 'street', 'locality',
    'town_city', 'district', 'county', 'ppd_category_type', 'record_status'
];

async function getRecords(): Promise<SoldPrice[]> {
    if (!cachedRecords) {
        const fileContent = await fs.readFile(csvFilePath, 'utf8');
        cachedRecords = parse(fileContent, {
            columns: columns,
            skip_empty_lines: true,
            cast: (value, context) => {
                if (context.column === 'price') {
                    const price = parseInt(value, 10);
                    return isNaN(price) ? null : price;
                }
                return value;
            }
        });
    }
    return cachedRecords;
}

export async function GET(request: Request) {
    try {
        let records = await getRecords();
        const { searchParams } = new URL(request.url);
        const postcode = searchParams.get('postcode');
        const limit = parseInt(searchParams.get('limit') || '100', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        if (postcode) {
            const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
            records = records.filter(row => 
                row.postcode && row.postcode.replace(/\s/g, '').toUpperCase().startsWith(cleanPostcode)
            );
        }

        const paginatedRecords = records.slice(offset, offset + limit);

        return NextResponse.json({
            data: paginatedRecords,
            total: records.length,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ message: 'Error processing request', error: (error as Error).message }, { status: 500 });
    }
}