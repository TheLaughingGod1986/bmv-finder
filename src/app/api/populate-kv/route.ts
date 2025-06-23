import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { parse, Parser } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import type { SoldPrice } from '../../../../types/sold-price';

export const dynamic = 'force-dynamic';

const BATCH_SIZE = 100;

async function clearKeys(pattern: string) {
  let deleted = 0;
  for await (const key of kv.scanIterator({ match: pattern })) {
    await kv.del(key);
    deleted++;
    if (deleted % 1000 === 0) console.log(`Cleared ${deleted} keys for pattern ${pattern}...`);
  }
  if (deleted) console.log(`Cleared final ${deleted} keys for pattern ${pattern}`);
}

async function processBatch(batch: SoldPrice[]) {
  const pipeline = kv.pipeline();
  batch.forEach(property => {
    pipeline.hset(`property:${property.id}`, property as unknown as Record<string, unknown>);
    if (property.postcode) {
      const cleanPostcode = property.postcode.replace(/\s/g, '').toUpperCase();
      pipeline.sadd(`postcode:${cleanPostcode}`, property.id);
    }
  });
  await pipeline.exec();
}

// New function to handle CSV parsing
async function parseCsv(csvPath: string): Promise<NextResponse> {
  return new Promise((resolve) => {
    let batch: SoldPrice[] = [];
    let processed = 0;

    const parser: Parser = parse({
      columns: [
        'id', 'price', 'date_of_transfer', 'postcode', 'property_type',
        'old_new', 'duration', 'paon', 'saon', 'street', 'locality',
        'town_city', 'county', 'ppd_category_type', 'record_status'
      ],
      skip_empty_lines: true,
      cast: (value: string, context: { column?: string }) => {
        if (context.column === 'price') {
          const price = parseInt(value, 10);
          return isNaN(price) ? 0 : price;
        }
        return value;
      }
    }) as NodeJS.ReadWriteStream;

    parser.on('readable', async () => {
      let record;
      while ((record = parser.read()) !== null) {
        batch.push(record as SoldPrice);
        if (batch.length >= BATCH_SIZE) {
          parser.pause();
          try {
            await processBatch(batch);
            processed += batch.length;
            if (processed % 1000 === 0) console.log(`✅ Processed ${processed} properties...`);
          } catch (error) {
            console.error('Error processing batch:', error);
          }
          batch = [];
          parser.resume();
        }
      }
    });

    parser.on('end', async () => {
      if (batch.length > 0) {
        try {
          await processBatch(batch);
          processed += batch.length;
        } catch (error) {
          console.error('Error processing final batch:', error);
        }
      }
      console.log(`🎉 Population complete! Processed ${processed} properties`);
      
      const timestamp = new Date().toISOString();
      await kv.set('data_last_updated', timestamp);
      console.log(`✅ Set data_last_updated timestamp to: ${timestamp}`);

      resolve(NextResponse.json({
        success: true,
        message: `Daily population complete! Processed ${processed} properties`,
        timestamp: timestamp,
      }));
    });

    parser.on('error', (err) => {
      console.error('❌ Error during population:', err);
      resolve(NextResponse.json({ 
        error: 'Population failed', 
        details: err.message,
        timestamp: new Date().toISOString()
      }, { status: 500 }));
    });

    fs.createReadStream(csvPath).pipe(parser);
  });
}

export async function POST() {
  try {
    console.log('🚀 Starting daily KV population...');
    
    const CSV_PATH = path.join(process.cwd(), 'pp-complete.csv');
    
    try {
      await fs.promises.access(CSV_PATH);
    } catch {
      return NextResponse.json({ 
        error: 'CSV file not found. Please ensure pp-complete.csv is in the project root.' 
      }, { status: 404 });
    }

    console.log('🧹 Clearing existing data...');
    await clearKeys('property:*');
    await clearKeys('postcode:*');
    console.log('✅ Existing data cleared');

    return await parseCsv(CSV_PATH);

  } catch (error) {
    console.error('❌ Error during population:', error);
    return NextResponse.json({ 
      error: 'Population failed', 
      details: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 