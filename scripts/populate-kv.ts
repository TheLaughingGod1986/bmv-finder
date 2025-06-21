import { kv } from '@vercel/kv';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import path from 'path';
import type { SoldPrice } from '../types/sold-price';

const csvFilePath = path.join(process.cwd(), 'pp-complete.csv');

const columns = [
    'id', 'price', 'date_of_transfer', 'postcode', 'property_type',
    'old_new', 'duration', 'paon', 'saon', 'street', 'locality',
    'town_city', 'district', 'county', 'ppd_category_type', 'record_status'
];

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
        const allKeys = await kv.keys('property:*');
        if(allKeys.length > 0) await kv.del(...allKeys);

        const allPostcodeKeys = await kv.keys('postcode:*');
        if(allPostcodeKeys.length > 0) await kv.del(...allPostcodeKeys);


        console.log('Storing records in KV...');
        const batchSize = 1000;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const pipeline = kv.pipeline();
            
            batch.forEach((record) => {
                if (record.id) {
                    const key = `property:${record.id}`;
                    pipeline.hset(key, { ...record });
                }
            });
            
            await pipeline.exec();
            console.log(`Processed record batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
        }

        console.log('Creating and storing postcode index...');
        const postcodeIndex: Record<string, Set<string>> = {};
        records.forEach(record => {
            if (record.postcode && record.id) {
                const cleanPostcode = record.postcode.replace(/\s/g, '').toUpperCase();
                
                // Index the full postcode (e.g., "SS91AA")
                if (!postcodeIndex[cleanPostcode]) postcodeIndex[cleanPostcode] = new Set();
                postcodeIndex[cleanPostcode].add(record.id);

                // Index the postcode area (e.g., "SS9")
                const areaMatch = cleanPostcode.match(/^([A-Z]+[0-9]+)/);
                if (areaMatch) {
                    const area = areaMatch[1];
                    if (!postcodeIndex[area]) postcodeIndex[area] = new Set();
                    postcodeIndex[area].add(record.id);
                }
            }
        });

        const postcodes = Object.keys(postcodeIndex);
        console.log(`Created index for ${postcodes.length} unique postcodes/areas.`);

        for (let i = 0; i < postcodes.length; i += batchSize) {
            const batch = postcodes.slice(i, i + batchSize);
            const pipeline = kv.pipeline();
            batch.forEach(postcode => {
                const members = Array.from(postcodeIndex[postcode]);
                if (members.length > 0) {
                    for (const member of members) {
                        pipeline.sadd(`postcode:${postcode}`, member);
                    }
                }
            });
            await pipeline.exec();
            console.log(`Processed postcode batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(postcodes.length / batchSize)}`);
        }

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