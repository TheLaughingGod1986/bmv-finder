import { createClient } from '@vercel/kv';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import path from 'path';
import type { SoldPrice } from '../types/sold-price';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const csvFilePath = path.join(process.cwd(), 'pp-complete.csv');

const columns = [
    'id', 'price', 'date_of_transfer', 'postcode', 'property_type',
    'old_new', 'duration', 'paon', 'saon', 'street', 'locality',
    'town_city', 'district', 'county', 'ppd_category_type', 'record_status'
];

const kv = createClient({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

async function populateKV() {
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

        // Clear existing data
        console.log('Clearing existing data...');
        await kv.del('properties');

        // Store records in batches
        const batchSize = 1000;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const pipeline = kv.pipeline();
            
            batch.forEach((record, index) => {
                const key = `property:${record.id}`;
                pipeline.hset(key, { ...record });
            });
            
            await pipeline.exec();
            console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
        }

        // Store postcode index for faster lookups
        console.log('Creating postcode index...');
        const postcodeIndex: Record<string, string[]> = {};
        
        records.forEach(record => {
            if (record.postcode) {
                const cleanPostcode = record.postcode.replace(/\s/g, '').toUpperCase();
                if (!postcodeIndex[cleanPostcode]) {
                    postcodeIndex[cleanPostcode] = [];
                }
                postcodeIndex[cleanPostcode].push(record.id);
            }
        });

        // Store postcode index in batches
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
        }

        // Store total count
        await kv.set('total_properties', records.length);
        
        console.log('✅ Successfully populated Vercel KV with property data!');
        console.log(`Total properties: ${records.length}`);
        console.log(`Unique postcodes: ${postcodes.length}`);
        
    } catch (error) {
        console.error('Error populating KV:', error);
        process.exit(1);
    }
}

populateKV(); 