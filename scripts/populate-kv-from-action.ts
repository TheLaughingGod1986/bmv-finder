import { kv } from '@vercel/kv';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';

const BATCH_SIZE = 500; // Increased batch size for faster CLI performance

async function clearKeys(pattern: string) {
  console.log(`\n🧹 Clearing existing keys for pattern: ${pattern}...`);
  let cursor = '0';
  let deletedCount = 0;
  do {
    const [nextCursor, keys] = await kv.scan(cursor, { match: pattern, count: 1000 });
    cursor = nextCursor;
    if (keys.length > 0) {
      await kv.del(...keys);
      deletedCount += keys.length;
      process.stdout.write(`\r   Deleted ${deletedCount} keys...`);
    }
  } while (cursor !== '0');
  console.log(`\n✅ Finished clearing pattern: ${pattern}. Total deleted: ${deletedCount}.`);
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

async function populate() {
  try {
    // Verify environment variables
    if (!process.env.KV_URL || !process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      throw new Error('Required Vercel KV environment variables are not set.');
    }
    console.log('✅ KV environment variables are set.');

    console.log('🚀 Starting KV population from local script...');
    
    const CSV_PATH = path.join(process.cwd(), 'pp-complete.csv');
    if (!fs.existsSync(CSV_PATH)) {
        throw new Error(`CSV file not found at ${CSV_PATH}. Make sure it's downloaded in the root.`);
    }
    console.log(`Found CSV file at: ${CSV_PATH}`);

    // Clear existing data first
    await clearKeys('property:*');
    await clearKeys('postcode:*');
    
    console.log('\n⏳ Populating new data...');
    const parser = fs.createReadStream(CSV_PATH).pipe(parse({
      columns: true,
      skip_empty_lines: true,
    }));

    let batch: any[] = [];
    let processedCount = 0;
    const startTime = Date.now();

    for await (const record of parser) {
      batch.push(record);
      if (batch.length >= BATCH_SIZE) {
        await processBatch(batch);
        processedCount += batch.length;
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        process.stdout.write(`\r   Processed ${processedCount} properties... (${elapsedMinutes.toFixed(2)} mins)`);
        batch = [];
      }
    }

    // Process any remaining records
    if (batch.length > 0) {
      await processBatch(batch);
      processedCount += batch.length;
    }

    const endTime = Date.now();
    const durationInMinutes = (endTime - startTime) / 60000;
    console.log(`\n\n🎉 Population complete!`);
    console.log(`   Processed a total of ${processedCount} properties.`);
    console.log(`   Total time: ${durationInMinutes.toFixed(2)} minutes.`);
    
    // Set the last updated timestamp
    const timestamp = new Date().toISOString();
    await kv.set('data_last_updated', timestamp);
    console.log(`\n✅ Set data_last_updated timestamp to: ${timestamp}`);

  } catch (error) {
    console.error('\n❌ Error during population:', error);
    process.exit(1); // Exit with error code
  }
}

populate(); 