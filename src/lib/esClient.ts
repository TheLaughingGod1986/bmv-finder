import { Client, ClientOptions } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const clientConfig: ClientOptions = {
  node: process.env.ELASTICSEARCH_URL || process.env.ES_NODE || 'http://localhost:9201',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || process.env.ES_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD || process.env.ES_PASSWORD
  }
};

export const esClient = new Client(clientConfig);

// Create a more flexible search method that bypasses strict typing
export const flexibleSearch = async (params: any) => {
  return esClient.search(params as Record<string, any>);
};

// Enhanced health check method
export const checkElasticsearchHealth = async () => {
  try {
    const [health, stats, indices] = await Promise.allSettled([
      esClient.cluster.health(),
      esClient.cluster.stats(),
      esClient.cat.indices({ format: 'json' })
    ]);

    const healthData = health.status === 'fulfilled' ? health.value : null;
    const statsData = stats.status === 'fulfilled' ? stats.value : null;
    const indicesData = indices.status === 'fulfilled' ? indices.value : [];

    return {
      status: 'healthy',
      clusterHealth: healthData?.status || 'unknown',
      numberOfNodes: healthData?.number_of_nodes || 0,
      activeShards: healthData?.active_shards || 0,
      unassignedShards: healthData?.unassigned_shards || 0,
      clusterName: statsData?.cluster_name || 'unknown',
      totalDocuments: indicesData.reduce((sum: number, idx: any) => sum + (parseInt(idx['docs.count']) || 0), 0),
      totalIndices: indicesData.length,
      indices: indicesData.map((idx: any) => ({
        name: idx.index,
        docs: parseInt(idx['docs.count']) || 0,
        size: idx['store.size'] || '0b',
        status: idx.status || 'unknown'
      })),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}; 