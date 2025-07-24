const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const readline = require('readline');

// Elasticsearch client
const esClient = new Client({
  node: 'http://localhost:9201',
  requestTimeout: 120000,
  maxRetries: 3,
  compression: true
});

// Clean mapping - only fields with actual data
const cleanMapping = {
  mappings: {
    properties: {
      // Core property data
      guid: { type: 'keyword' },
      price: { type: 'long' },
      date: { type: 'date' },
      postcode: { type: 'keyword' },
      
      // Property details
      property_type: { type: 'keyword' },
      property_type_label: { type: 'text' },
      new_build: { type: 'keyword' },
      new_build_label: { type: 'text' },
      estate_type: { type: 'keyword' },
      estate_type_label: { type: 'text' },
      transaction_category: { type: 'keyword' },
      transaction_category_label: { type: 'text' },
      
      // Address fields
      paon: { type: 'keyword' },
      saon: { type: 'keyword' },
      street: { type: 'text' },
      locality: { type: 'text' },
      town_city: { type: 'text' },
      district: { type: 'text' },
      county: { type: 'text' },
      full_address: { type: 'text' },
      
      // Metadata
      transaction_id: { type: 'keyword' },
      record_status: { type: 'keyword' },
      
      // Computed fields
      year: { type: 'integer' },
      month: { type: 'integer' },
      price_range: { type: 'keyword' }
    }
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    "index.mapping.total_fields.limit": 50
  }
};

async function createCleanIndex() {
  try {
    console.log('🗑️  Creating clean index...');
    
    // Delete existing clean index if it exists
    try {
      await esClient.indices.delete({ index: 'properties-clean' });
      console.log('✅ Deleted existing properties-clean index');
    } catch (error) {
      if (error.message.includes('index_not_found_exception')) {
        console.log('ℹ️  No existing properties-clean index to delete');
      } else {
        throw error;
      }
    }
    
    // Create new clean index
    await esClient.indices.create({
      index: 'properties-clean',
      body: cleanMapping
    });
    
    console.log('✅ Created properties-clean index with optimized mapping');
    console.log('📊 Mapping includes only fields with actual data');
    
  } catch (error) {
    console.error('❌ Error creating clean index:', error.message);
    throw error;
  }
}

async function reindexData() {
  try {
    console.log('🔄 Starting reindex from properties-enhanced to properties-clean...');
    
    const reindexResponse = await esClient.reindex({
      wait_for_completion: false, // Run in background
      body: {
        source: {
          index: 'properties-enhanced',
          query: {
            match_all: {}
          }
        },
        dest: {
          index: 'properties-clean'
        },
        script: {
          source: `
            // Only include fields that have actual data
            def cleanDoc = [:];
            
            // Core fields (always present)
            cleanDoc.guid = ctx._source.guid;
            cleanDoc.price = ctx._source.price;
            cleanDoc.date = ctx._source.date;
            cleanDoc.postcode = ctx._source.postcode;
            cleanDoc.property_type = ctx._source.property_type;
            cleanDoc.property_type_label = ctx._source.property_type_label;
            cleanDoc.new_build = ctx._source.new_build;
            cleanDoc.new_build_label = ctx._source.new_build_label;
            cleanDoc.estate_type = ctx._source.estate_type;
            cleanDoc.estate_type_label = ctx._source.estate_type_label;
            cleanDoc.transaction_category = ctx._source.transaction_category;
            cleanDoc.transaction_category_label = ctx._source.transaction_category_label;
            cleanDoc.paon = ctx._source.paon;
            cleanDoc.saon = ctx._source.saon;
            cleanDoc.street = ctx._source.street;
            cleanDoc.locality = ctx._source.locality;
            cleanDoc.town_city = ctx._source.town_city;
            cleanDoc.district = ctx._source.district;
            cleanDoc.county = ctx._source.county;
            cleanDoc.full_address = ctx._source.full_address;
            cleanDoc.transaction_id = ctx._source.transaction_id;
            cleanDoc.record_status = ctx._source.record_status;
            cleanDoc.year = ctx._source.year;
            cleanDoc.month = ctx._source.month;
            cleanDoc.price_range = ctx._source.price_range;
            
            ctx._source = cleanDoc;
          `
        }
      }
    });
    
    console.log('✅ Reindex task started:', reindexResponse.task);
    console.log('📊 Monitor progress with: curl -X GET "localhost:9201/_tasks/' + reindexResponse.task + '"');
    
    return reindexResponse.task;
    
  } catch (error) {
    console.error('❌ Error during reindex:', error.message);
    throw error;
  }
}

async function checkReindexProgress(taskId) {
  try {
    const taskResponse = await esClient.tasks.get({ task_id: taskId });
    const task = taskResponse.body;
    
    // Check if task exists and has status
    if (!task || !task.status) {
      console.log('⏳ Waiting for task to start...');
      return false;
    }
    
    if (task.completed) {
      console.log('✅ Reindex completed successfully!');
      if (task.response) {
        console.log('📊 Total documents processed:', task.response.total);
        console.log('📊 Created documents:', task.response.created);
        console.log('📊 Updated documents:', task.response.updated);
        console.log('📊 Deleted documents:', task.response.deleted);
      }
      return true;
    } else {
      const progress = task.status;
      if (progress.created && progress.total) {
        const percentage = Math.round(progress.created/progress.total*100);
        console.log(`🔄 Reindex in progress: ${progress.created.toLocaleString()}/${progress.total.toLocaleString()} documents (${percentage}%)`);
      } else {
        console.log('🔄 Reindex in progress...');
      }
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error checking reindex progress:', error.message);
    throw error;
  }
}

async function compareIndexSizes() {
  try {
    console.log('📊 Comparing index sizes...');
    
    const oldIndex = await esClient.indices.stats({ index: 'properties-enhanced' });
    const newIndex = await esClient.indices.stats({ index: 'properties-clean' });
    
    const oldSize = oldIndex.body.indices['properties-enhanced'].total.store.size_in_bytes;
    const newSize = newIndex.body.indices['properties-clean'].total.store.size_in_bytes;
    const oldDocs = oldIndex.body.indices['properties-enhanced'].total.docs.count;
    const newDocs = newIndex.body.indices['properties-clean'].total.docs.count;
    
    console.log('📊 Original index (properties-enhanced):');
    console.log(`   Documents: ${oldDocs.toLocaleString()}`);
    console.log(`   Size: ${(oldSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('📊 Clean index (properties-clean):');
    console.log(`   Documents: ${newDocs.toLocaleString()}`);
    console.log(`   Size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
    
    const sizeReduction = ((oldSize - newSize) / oldSize * 100).toFixed(2);
    console.log(`🎯 Storage reduction: ${sizeReduction}%`);
    
  } catch (error) {
    console.error('❌ Error comparing index sizes:', error.message);
  }
}

async function main() {
  try {
    console.log('🧹 Starting Elasticsearch cleanup process...\n');
    
    // Step 1: Create clean index
    await createCleanIndex();
    console.log('');
    
    // Step 2: Start reindex
    const taskId = await reindexData();
    console.log('');
    
    // Step 3: Monitor progress
    console.log('⏳ Monitoring reindex progress...');
    let completed = false;
    while (!completed) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      completed = await checkReindexProgress(taskId);
    }
    console.log('');
    
    // Step 4: Compare sizes
    await compareIndexSizes();
    console.log('');
    
    console.log('🎉 Cleanup completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Update API endpoints to use "properties-clean" index');
    console.log('   2. Test search functionality');
    console.log('   3. Delete old "properties-enhanced" index when ready');
    
  } catch (error) {
    console.error('💥 Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createCleanIndex, reindexData, compareIndexSizes }; 