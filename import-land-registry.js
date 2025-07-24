const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('@elastic/elasticsearch');

const ES_HOST = 'http://localhost:9201';
const INDEX = 'properties-enhanced';
const CSV_FILE = process.argv[2] || 'pp-complete.csv';
// Optimized batch size for better performance
const BATCH_SIZE = 2000;
const CHECKPOINT_FILE = 'enhanced_import_checkpoint.txt';

// Enhanced client configuration with timeouts
const client = new Client({ 
  node: ES_HOST,
  requestTimeout: 120000, // 2 minutes
  maxRetries: 3,
  compression: true
});

// Land Registry CSV columns (in order):
// id, price, date, postcode, propertyType, newBuild, tenure, paon, saon, street, locality, town, district, county, categoryType, recordStatus
function mapRow(row) {
  return {
    guid: row[0],
    price: Number(row[1]),
    date: row[2] ? row[2].split(' ')[0] : null,
    postcode: row[3],
    property_type: row[4],
    property_type_label: row[4] === 'D' ? 'Detached' : row[4] === 'S' ? 'Semi-Detached' : row[4] === 'T' ? 'Terraced' : row[4] === 'F' ? 'Flat/Maisonette' : row[4] === 'O' ? 'Other' : '',
    new_build: row[5],
    new_build_label: row[5] === 'Y' ? 'New Build' : 'Existing',
    estate_type: row[6],
    estate_type_label: row[6] === 'F' ? 'Freehold' : row[6] === 'L' ? 'Leasehold' : '',
    transaction_id: row[7],
    paon: row[7],
    saon: row[8],
    street: row[9],
    locality: row[10],
    town_city: row[11],
    district: row[12],
    county: row[13],
    transaction_category: row[14],
    transaction_category_label: row[14] === 'A' ? 'Standard Price Paid' : row[14] === 'B' ? 'Additional Price Paid' : '',
    record_status: row[15],
    // The following are placeholders for enrichment, set to null or default for now
    epc_bedrooms: null,
    epc_size: null,
    epc_rating: null,
    match_type: null,
    match_confidence: null,
    match_score: null,
    hpi_value: null,
    hpi_region: null,
    hpi_date: null,
    full_address: `${row[8] ? row[8] + ', ' : ''}${row[7] ? row[7] + ', ' : ''}${row[9]}, ${row[10]}, ${row[11]}, ${row[12]}, ${row[13]}, ${row[3]}`,
    year: row[2] ? Number(row[2].split('-')[0]) : null,
    month: row[2] ? Number(row[2].split('-')[1]) : null,
    price_range: Number(row[1]) < 100000 ? 'Under £100k' : Number(row[1]) < 250000 ? '£100k-£250k' : Number(row[1]) < 500000 ? '£250k-£500k' : 'Over £500k',
    has_epc: false,
    has_hpi: false,
    energy_efficient: null
  };
}

// Load checkpoint
function loadCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const checkpoint = parseInt(fs.readFileSync(CHECKPOINT_FILE, 'utf8').trim());
      console.log(`📍 Resuming from checkpoint: ${checkpoint.toLocaleString()} records`);
      return checkpoint;
    }
  } catch (error) {
    console.log('⚠️  Could not load checkpoint, starting from beginning');
  }
  return 0;
}

// Save checkpoint
function saveCheckpoint(count) {
  try {
    fs.writeFileSync(CHECKPOINT_FILE, count.toString());
  } catch (error) {
    console.error('⚠️  Could not save checkpoint:', error.message);
  }
}

async function run() {
  let batch = [];
  let count = loadCheckpoint();
  let lineCount = 0;
  let startTime = Date.now();
  
  console.log(`🚀 Starting import with batch size: ${BATCH_SIZE}`);
  console.log(`📊 Target file: ${CSV_FILE}`);
  
  const stream = fs.createReadStream(CSV_FILE)
    .pipe(csv({ headers: false, skipLines: 0 }))
    .on('data', (row) => {
      lineCount++;
      
      // Skip lines before checkpoint
      if (lineCount <= count) {
        return;
      }
      
      const doc = mapRow(Object.values(row));
      batch.push({ index: { _index: INDEX } });
      batch.push(doc);
      
      if (batch.length >= BATCH_SIZE * 2) {
        stream.pause();
        client.bulk({ 
          refresh: false, 
          body: batch,
          timeout: '120s',
          wait_for_active_shards: 1
        })
          .then((resp) => {
            if (resp.errors) {
              const errors = resp.items.filter(item => item.index && item.index.error);
              if (errors.length > 0) {
                console.error(`❌ ${errors.length} errors in batch`);
                errors.slice(0, 3).forEach((item, i) => {
                  console.error(`   Error ${i + 1}:`, item.index.error.reason);
                });
              }
            }
            count += BATCH_SIZE;
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = Math.round(count / elapsed);
            console.log(`✅ Imported ${count.toLocaleString()} records (${rate}/sec)`);
            saveCheckpoint(count);
            batch = [];
            stream.resume();
          })
          .catch((err) => {
            console.error('❌ Bulk insert error:', err.message);
            console.log('🔄 Retrying batch...');
            // Don't exit, just retry
            setTimeout(() => stream.resume(), 5000);
          });
      }
    })
    .on('end', async () => {
      if (batch.length > 0) {
        try {
          const resp = await client.bulk({ 
            refresh: true, 
            body: batch,
            timeout: '120s'
          });
          if (resp.errors) {
            const errors = resp.items.filter(item => item.index && item.index.error);
            console.error(`❌ ${errors.length} errors in final batch`);
          }
          count += batch.length / 2;
          console.log(`✅ Imported final ${(batch.length / 2).toLocaleString()} records`);
        } catch (error) {
          console.error('❌ Final batch error:', error.message);
        }
      }
      
      const totalTime = (Date.now() - startTime) / 1000;
      const avgRate = Math.round(count / totalTime);
      console.log(`🎉 Import complete!`);
      console.log(`📊 Total records: ${count.toLocaleString()}`);
      console.log(`⏱️  Total time: ${Math.round(totalTime)}s`);
      console.log(`🚀 Average rate: ${avgRate} records/sec`);
      saveCheckpoint(count);
    })
    .on('error', (err) => {
      console.error('❌ CSV read error:', err);
      process.exit(1);
    });
}

run(); 