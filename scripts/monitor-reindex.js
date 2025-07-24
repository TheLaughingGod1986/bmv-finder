const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: 'http://localhost:9201'
});

async function monitorReindex() {
  const taskId = 'YLkR0UznTISnBUl9VLbMtw:76255';
  
  try {
    const taskResponse = await esClient.tasks.get({ task_id: taskId });
    const response = taskResponse;
    const task = response.task;
    
    if (response.completed) {
      console.log('✅ Reindex completed successfully!');
      if (task.response) {
        console.log('📊 Total documents processed:', task.response.total);
        console.log('📊 Created documents:', task.response.created);
        console.log('📊 Updated documents:', task.response.updated);
        console.log('📊 Deleted documents:', task.response.deleted);
      }
    } else {
      const progress = task.status;
      if (progress.created && progress.total) {
        const percentage = Math.round(progress.created/progress.total*100);
        console.log(`🔄 Reindex in progress: ${progress.created.toLocaleString()}/${progress.total.toLocaleString()} documents (${percentage}%)`);
        console.log(`⏱️  Running time: ${Math.round(task.running_time_in_nanos / 1000000000)} seconds`);
      } else {
        console.log('🔄 Reindex in progress...');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking reindex progress:', error.message);
  }
}

// Run monitoring
monitorReindex(); 