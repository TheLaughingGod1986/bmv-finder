import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';

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

async function processBatch(batch: any[]) {
  const pipeline = kv.pipeline();
  batch.forEach(property => {
    pipeline.hset(`property:${property.id}`, property);
    if (property.postcode) {
      const cleanPostcode = property.postcode.replace(/\s/g, '').toUpperCase();
      pipeline.sadd(`postcode:${cleanPostcode}`, property.id);
    }
  });
  await pipeline.exec();
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting daily KV population...');
    
    const CSV_PATH = path.join(process.cwd(), 'pp-complete.csv');
    
    // Check if CSV file exists
    try {
      await fs.promises.access(CSV_PATH);
    } catch {
      return NextResponse.json({ 
        error: 'CSV file not found. Please ensure pp-complete.csv is in the project root.' 
      }, { status: 404 });
    }

    // Clear existing data first
    console.log('🧹 Clearing existing data...');
    await clearKeys('property:*');
    await clearKeys('postcode:*');
    console.log('✅ Existing data cleared');

    return new Promise((resolve) => {
      let batch: any[] = [];
      let processed = 0;

      const parser = parse({
        columns: [
          'id', 'price', 'date_of_transfer', 'postcode', 'property_type',
          'old_new', 'duration', 'paon', 'saon', 'street', 'locality',
          'town_city', 'district', 'county', 'ppd_category_type', 'record_status'
        ],
        skip_empty_lines: true,
        cast: (value: string, context: any) => {
          if (context.column === 'price') {
            const price = parseInt(value, 10);
            return isNaN(price) ? 0 : price;
          }
          return value;
        }
      });

      parser.on('readable', async () => {
        let record;
        while ((record = parser.read()) !== null) {
          batch.push(record);
          if (batch.length >= BATCH_SIZE) {
            parser.pause();
            try {
              await processBatch(batch);
              processed += batch.length;
              if (processed % 1000 === 0) console.log(`✅ Processed ${processed} properties...`);
            } catch (error) {
              console.error('Error processing batch:', error);
              // Continue with next batch even if one fails
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

        // Test with SE39FW
        console.log('\n🧪 Testing SE39FW search...');
        const se39fwKeys: string[] = [];
        try {
          for await (const key of kv.scanIterator({ match: 'postcode:SE39FW*' })) {
            se39fwKeys.push(key);
          }
        } catch (error) {
          console.error('Error testing SE39FW:', error);
        }
        
        let se39fwProperties: any[] = [];
        if (se39fwKeys.length > 0) {
          try {
            const propertyIds = await kv.sunion(...(se39fwKeys as [string, ...string[]]));
            console.log(`Found ${propertyIds.length} properties for SE39FW`);
            
            if (propertyIds.length > 0) {
              const pipeline = kv.pipeline();
              propertyIds.slice(0, 5).forEach(id => {
                pipeline.hgetall(`property:${id}`);
              });
              const results = await pipeline.exec();
              se39fwProperties = results?.filter(r => r) || [];
            }
          } catch (error) {
            console.error('Error fetching SE39FW properties:', error);
          }
        } else {
          console.log('No SE39FW properties found in KV');
        }

        resolve(NextResponse.json({
          success: true,
          message: `Daily population complete! Processed ${processed} properties`,
          timestamp: timestamp,
          se39fwTest: {
            postcodeKeys: se39fwKeys.length,
            properties: se39fwProperties.length,
            sampleProperties: se39fwProperties.slice(0, 3)
          }
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

      fs.createReadStream(CSV_PATH).pipe(parser);
    });

  } catch (error) {
    console.error('❌ Error during population:', error);
    return NextResponse.json({ 
      error: 'Population failed', 
      details: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 