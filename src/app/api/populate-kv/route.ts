import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import path from 'path';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import type { SoldPrice } from '../../../../types/sold-price';

const csvFilePath = path.join(process.cwd(), 'pp-complete.csv');

const columns = [
    'id', 'price', 'date_of_transfer', 'postcode', 'property_type',
    'old_new', 'duration', 'paon', 'saon', 'street', 'locality',
    'town_city', 'district', 'county', 'ppd_category_type', 'record_status'
];

export async function GET() {
    try {
        console.log('Reading CSV file...');
        const fileContent = await fs.readFile(csvFilePath, 'utf8');
        
        console.log('Parsing CSV data...');
        const records: SoldPrice[] = parse(fileContent, {
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

        console.log(`Found ${records.length} records`);

        // Clear existing data (optional, consider if you want to re-populate)
        // console.log('Clearing existing data...');
        // const allKeys = await kv.keys('property:*');
        // if (allKeys.length > 0) await kv.del(...allKeys);
        // const allPostcodeKeys = await kv.keys('postcode:*');
        // if (allPostcodeKeys.length > 0) await kv.del(...allPostcodeKeys);

        console.log('Storing records in KV...');
        const batchSize = 500; // Smaller batch size for serverless environment
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const pipeline = kv.pipeline();
            
            batch.forEach(record => {
                if (record.id) {
                    const key = `property:${record.id}`;
                    pipeline.hset(key, { ...record });
                }
            });
            
            await pipeline.exec();
            console.log(`Processed record batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
        }

        console.log('Creating and storing postcode index...');
        const postcodeIndex: Record<string, string[]> = {};
        records.forEach(record => {
            if (record.postcode && record.id) {
                const cleanPostcode = record.postcode.replace(/\s/g, '').toUpperCase();
                if (!postcodeIndex[cleanPostcode]) {
                    postcodeIndex[cleanPostcode] = [];
                }
                postcodeIndex[cleanPostcode].push(record.id);
            }
        });

        const postcodes = Object.keys(postcodeIndex);
        for (let i = 0; i < postcodes.length; i += batchSize) {
            const batch = postcodes.slice(i, i + batchSize);
            const pipeline = kv.pipeline();
            batch.forEach(postcode => {
                const members = postcodeIndex[postcode];
                if (members && members.length > 0) {
                    for (const member of members) {
                        pipeline.sadd(`postcode:${postcode}`, member);
                    }
                }
            });
            await pipeline.exec();
            console.log(`Processed postcode batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(postcodes.length / batchSize)}`);
        }

        await kv.set('total_properties', records.length);
        
        const message = '✅ Successfully populated Vercel KV with property data!';
        console.log(message);
        return NextResponse.json({ message, totalProperties: records.length, uniquePostcodes: postcodes.length });

    } catch (error) {
        console.error('Error populating KV:', error);
        return NextResponse.json({ message: 'Error populating KV', error: (error as Error).message }, { status: 500 });
    }
} 
