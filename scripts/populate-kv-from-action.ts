import { kv } from '@vercel/kv';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';

const BATCH_SIZE = 500; // Increased batch size for faster CLI performance

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

interface NationalTrendDataEntry {
  year: string;
  avgPrice: number;
  count: number;
  pctChange: number | null;
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
    console.log('\n🧹 Clearing all existing data from the database...');
    await kv.flushall();
    console.log('✅ Database cleared.');
    
    console.log('\n⏳ Populating new data...');
    const parser = fs.createReadStream(CSV_PATH).pipe(parse({
      columns: true,
      skip_empty_lines: true,
    }));

    let batch: any[] = [];
    let processedCount = 0;
    const startTime = Date.now();
    const yearlyData: Record<string, { total: number; count: number }> = {};

    for await (const record of parser) {
      batch.push(record);
      
      const year = record.date_of_transfer?.slice(0, 4);
      if (year && record.price) {
        const price = Number(record.price);
        if (!yearlyData[year]) yearlyData[year] = { total: 0, count: 0 };
        yearlyData[year].total += price;
        yearlyData[year].count++;
      }

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

    // Calculate and store the national summary
    console.log('\n📊 Generating and storing national price trend summary...');
    const summaryData: NationalTrendDataEntry[] = Object.entries(yearlyData)
      .map(([year, data]) => ({
        year,
        avgPrice: Math.round(data.total / data.count),
        count: data.count,
        pctChange: null,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));
    
    for (let i = 1; i < summaryData.length; i++) {
      const prevYearData = summaryData[i-1];
      const currYearData = summaryData[i];
      if (prevYearData && currYearData.avgPrice && prevYearData.avgPrice) {
        currYearData.pctChange = parseFloat(
          (((currYearData.avgPrice - prevYearData.avgPrice) / prevYearData.avgPrice) * 100).toFixed(1)
        );
      }
    }
    
    await kv.set('summary:uk-wide', JSON.stringify(summaryData));
    console.log('✅ National summary stored successfully.');

  } catch (error) {
    console.error('\n❌ Error during population:', error);
    process.exit(1); // Exit with error code
  }
}

populate(); 