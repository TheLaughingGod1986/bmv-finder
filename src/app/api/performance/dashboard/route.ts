import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/performanceMonitor';
import { databaseOptimizer } from '@/lib/databaseOptimizer';
import { errorHandler } from '@/lib/errorHandler';
import { redisService } from '@/lib/redisService';
import { marketIntelligence } from '@/lib/marketIntelligence';
import { loadBalancer } from '@/lib/loadBalancer';
import { monitoringSystem } from '@/lib/monitoringSystem';
import { kubernetesService } from '@/lib/kubernetesService';
import { microservicesService } from '@/lib/microservicesService';
import { globalDistributionService } from '@/lib/globalDistributionService';
import { devOpsService } from '@/lib/devOpsService';
import { edgeComputingService } from '@/lib/edgeComputingService';

export async function GET() {
  try {
    // Get all service metrics with error handling
    let performance, cacheStats, databaseMetrics, errorMetrics, redisMetrics;
    let marketMetrics, loadBalancerMetrics, monitoringMetrics, kubernetesMetrics;
    let microservicesMetrics, globalMetrics, devOpsMetrics, edgeMetrics;

    try {
      performance = performanceMonitor.getPerformanceReport();
    } catch (error) {
      console.error('Performance monitor error:', error);
      performance = { api: {}, cache: {}, system: {}, alerts: [], summary: { totalAPICalls: 0, totalCacheOperations: 0, totalSystemMetrics: 0, overallHealth: 'unknown' } };
    }

    try {
      cacheStats = performanceMonitor.getCacheMetrics();
    } catch (error) {
      console.error('Cache stats error:', error);
      cacheStats = {};
    }

    try {
      databaseMetrics = databaseOptimizer.getQueryPerformanceReport();
    } catch (error) {
      console.error('Database metrics error:', error);
      databaseMetrics = { totalQueries: 0, avgExecutionTime: 0, cacheHitRate: 0, slowQueries: 0, topSlowQueries: [], recommendations: [] };
    }

    try {
      errorMetrics = errorHandler.getErrorReport();
    } catch (error) {
      console.error('Error metrics error:', error);
      errorMetrics = { totalErrors: 0, errorRate: 0, recentErrors: [], topErrors: [] };
    }

    try {
      redisMetrics = redisService.getStats();
    } catch (error) {
      console.error('Redis metrics error:', error);
      redisMetrics = { connected: false, hitRate: 0, memoryUsage: 0, operations: 0 };
    }

    try {
      marketMetrics = marketIntelligence.getMarketIntelligenceSummary();
    } catch (error) {
      console.error('Market metrics error:', error);
      marketMetrics = { initialized: false, totalAnalyses: 0, avgAccuracy: 0, recommendations: [] };
    }

    try {
      loadBalancerMetrics = loadBalancer.getStats();
    } catch (error) {
      console.error('Load balancer metrics error:', error);
      loadBalancerMetrics = { instances: 0, healthyInstances: 0, avgResponseTime: 0, requestsPerSecond: 0 };
    }

    try {
      monitoringMetrics = monitoringSystem.getStats();
    } catch (error) {
      console.error('Monitoring metrics error:', error);
      monitoringMetrics = { alerts: [], slaMetrics: [], businessMetrics: [] };
    }

    try {
      kubernetesMetrics = kubernetesService.getMetrics();
    } catch (error) {
      console.error('Kubernetes metrics error:', error);
      kubernetesMetrics = { pods: 0, deployments: 0, nodes: 0, namespaces: 0 };
    }

    try {
      microservicesMetrics = microservicesService.getStatus();
    } catch (error) {
      console.error('Microservices metrics error:', error);
      microservicesMetrics = { services: 0, healthyServices: 0, deployments: 0, events: 0 };
    }

    try {
      globalMetrics = globalDistributionService.getGlobalHealth();
    } catch (error) {
      console.error('Global metrics error:', error);
      globalMetrics = { status: 'unknown', score: 0, details: {} };
    }

    try {
      devOpsMetrics = devOpsService.getDevOpsHealth();
    } catch (error) {
      console.error('DevOps metrics error:', error);
      devOpsMetrics = { status: 'unknown', score: 0, details: {} };
    }

    try {
      edgeMetrics = edgeComputingService.getEdgeComputingHealth();
    } catch (error) {
      console.error('Edge metrics error:', error);
      edgeMetrics = { status: 'unknown', score: 0, details: {} };
    }

    // Calculate comprehensive health scores with error handling
    let cacheHealth, databaseHealth, errorHealth, redisHealth, marketHealth;
    let loadBalancerHealth, monitoringHealth, kubernetesHealth, microservicesHealth;
    let globalHealth, devOpsHealth, edgeHealth;

    try {
      cacheHealth = calculateCacheHealth(cacheStats);
    } catch (error) {
      console.error('Cache health calculation error:', error);
      cacheHealth = { status: 'unknown', score: 0 };
    }

    try {
      databaseHealth = calculateDatabaseHealth(databaseMetrics);
    } catch (error) {
      console.error('Database health calculation error:', error);
      databaseHealth = { status: 'unknown', score: 0 };
    }

    try {
      errorHealth = calculateErrorHealth(errorMetrics);
    } catch (error) {
      console.error('Error health calculation error:', error);
      errorHealth = { status: 'unknown', score: 0 };
    }

    try {
      redisHealth = calculateRedisHealth(redisMetrics);
    } catch (error) {
      console.error('Redis health calculation error:', error);
      redisHealth = { status: 'unknown', score: 0 };
    }

    try {
      marketHealth = calculateMarketHealth(marketMetrics);
    } catch (error) {
      console.error('Market health calculation error:', error);
      marketHealth = { status: 'unknown', score: 0 };
    }

    try {
      loadBalancerHealth = calculateLoadBalancerHealth(loadBalancerMetrics);
    } catch (error) {
      console.error('Load balancer health calculation error:', error);
      loadBalancerHealth = { status: 'unknown', score: 0 };
    }

    try {
      monitoringHealth = calculateMonitoringHealth(monitoringMetrics);
    } catch (error) {
      console.error('Monitoring health calculation error:', error);
      monitoringHealth = { status: 'unknown', score: 0 };
    }

    try {
      kubernetesHealth = calculateKubernetesHealth(kubernetesMetrics);
    } catch (error) {
      console.error('Kubernetes health calculation error:', error);
      kubernetesHealth = { status: 'unknown', score: 0 };
    }

    try {
      microservicesHealth = calculateMicroservicesHealth(microservicesMetrics);
    } catch (error) {
      console.error('Microservices health calculation error:', error);
      microservicesHealth = { status: 'unknown', score: 0 };
    }

    try {
      globalHealth = calculateGlobalHealth(globalMetrics);
    } catch (error) {
      console.error('Global health calculation error:', error);
      globalHealth = { status: 'unknown', score: 0 };
    }

    try {
      devOpsHealth = calculateDevOpsHealth(devOpsMetrics);
    } catch (error) {
      console.error('DevOps health calculation error:', error);
      devOpsHealth = { status: 'unknown', score: 0 };
    }

    try {
      edgeHealth = calculateEdgeHealth(edgeMetrics);
    } catch (error) {
      console.error('Edge health calculation error:', error);
      edgeHealth = { status: 'unknown', score: 0 };
    }

    // Calculate overall comprehensive score with error handling
    let comprehensiveScore, optimizationSuggestions;

    try {
      comprehensiveScore = calculateComprehensiveScore({
        cacheHealth,
        databaseHealth,
        errorHealth,
        redisHealth,
        marketHealth,
        loadBalancerHealth,
        monitoringHealth,
        kubernetesHealth,
        microservicesHealth,
        globalHealth,
        devOpsHealth,
        edgeHealth
      });
    } catch (error) {
      console.error('Comprehensive score calculation error:', error);
      comprehensiveScore = 0;
    }

    try {
      optimizationSuggestions = generateComprehensiveRecommendations({
        cacheHealth,
        databaseHealth,
        errorHealth,
        redisHealth,
        marketHealth,
        loadBalancerHealth,
        monitoringHealth,
        kubernetesHealth,
        microservicesHealth,
        globalHealth,
        devOpsHealth,
        edgeHealth
      });
    } catch (error) {
      console.error('Optimization suggestions error:', error);
      optimizationSuggestions = [];
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      comprehensiveScore,
      summary: {
        totalCaches: Object.keys(cacheStats).length,
        totalAlerts: monitoringMetrics.alerts?.length || 0,
        systemHealth: comprehensiveScore > 80 ? 'healthy' : comprehensiveScore > 60 ? 'warning' : 'critical',
        overallScore: comprehensiveScore,
        cacheHealth: cacheHealth.status,
        databaseHealth: databaseHealth.status,
        errorHealth: errorHealth.status,
        redisHealth: redisHealth.status,
        marketHealth: marketHealth.status,
        loadBalancerHealth: loadBalancerHealth.status,
        monitoringHealth: monitoringHealth.status,
        kubernetesHealth: kubernetesHealth.status,
        microservicesHealth: microservicesHealth.status,
        globalHealth: globalHealth.status,
        devOpsHealth: devOpsHealth.status,
        edgeHealth: edgeHealth.status,
        recommendations: optimizationSuggestions
      },
      performance,
      cacheStats,
      databaseMetrics,
      errorMetrics,
      redisMetrics,
      marketMetrics,
      loadBalancerMetrics,
      monitoringMetrics,
      kubernetesMetrics,
      microservicesMetrics,
      globalMetrics,
      devOpsMetrics,
      edgeMetrics,
      optimizationSuggestions
    });

  } catch (error) {
    console.error('Performance dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to generate performance dashboard' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'cache-stats':
        return NextResponse.json({ cacheStats: performanceMonitor.getCacheMetrics() });

      case 'database-stats':
        return NextResponse.json({ databaseMetrics: databaseOptimizer.getQueryPerformanceReport() });

      case 'error-stats':
        return NextResponse.json({ errorMetrics: errorHandler.getErrorReport() });

      case 'redis-stats':
        return NextResponse.json({ redisMetrics: redisService.getStats() });

      case 'market-stats':
        return NextResponse.json({ marketMetrics: marketIntelligence.getMarketIntelligenceSummary() });

      case 'load-balancer-stats':
        return NextResponse.json({ loadBalancerMetrics: loadBalancer.getStats() });

      case 'monitoring-stats':
        return NextResponse.json({ monitoringMetrics: monitoringSystem.getStats() });

      case 'kubernetes-stats':
        return NextResponse.json({ kubernetesMetrics: kubernetesService.getMetrics() });

      case 'microservices-stats':
        return NextResponse.json({ microservicesMetrics: microservicesService.getStatus() });

      case 'global-stats':
        return NextResponse.json({ globalMetrics: globalDistributionService.getGlobalHealth() });

      case 'devops-stats':
        return NextResponse.json({ devOpsMetrics: devOpsService.getDevOpsHealth() });

      case 'edge-stats':
        return NextResponse.json({ edgeMetrics: edgeComputingService.getEdgeComputingHealth() });

      case 'kubernetes-scale':
        const { deployment, replicas } = params;
        const scaleResult = kubernetesService.scaleDeployment(deployment, replicas);
        return NextResponse.json({ 
          success: scaleResult, 
          message: scaleResult ? `Scaled ${deployment} to ${replicas} replicas` : 'Failed to scale deployment' 
        });

      case 'kubernetes-rolling-update':
        const { deployment: updateDeployment, imageTag } = params;
        const updateResult = await kubernetesService.rollingUpdateDeployment(updateDeployment, imageTag);
        return NextResponse.json({ 
          success: updateResult, 
          message: updateResult ? `Rolling update started for ${updateDeployment}` : 'Failed to start rolling update' 
        });

      case 'microservice-scale':
        const { service, replicas: serviceReplicas } = params;
        const serviceScaleResult = microservicesService.scaleMicroservice(service, serviceReplicas);
        return NextResponse.json({ 
          success: serviceScaleResult, 
          message: serviceScaleResult ? `Scaled ${service} to ${serviceReplicas} replicas` : 'Failed to scale microservice' 
        });

      case 'microservice-deploy':
        const { service: deployService, version } = params;
        const deployResult = await microservicesService.deployNewVersion(deployService, version);
        return NextResponse.json({ 
          success: deployResult, 
          message: deployResult ? `Deployed ${deployService} version ${version}` : 'Failed to deploy new version' 
        });

      case 'global-deploy':
        const { region, version: globalVersion } = params;
        const globalDeployResult = await globalDistributionService.deployToRegion(region, globalVersion);
        return NextResponse.json({ 
          success: globalDeployResult, 
          message: globalDeployResult ? `Deployed to region ${region}` : 'Failed to deploy to region' 
        });

      case 'global-rollback':
        const { region: rollbackRegion, version: rollbackVersion } = params;
        const rollbackResult = await globalDistributionService.rollbackRegion(rollbackRegion, rollbackVersion);
        return NextResponse.json({ 
          success: rollbackResult, 
          message: rollbackResult ? `Rolled back region ${rollbackRegion}` : 'Failed to rollback region' 
        });

      case 'devops-pipeline':
        const { pipelineId } = params;
        const pipelineResult = await devOpsService.startPipeline(pipelineId);
        return NextResponse.json({ 
          success: pipelineResult, 
          message: pipelineResult ? `Started pipeline ${pipelineId}` : 'Failed to start pipeline' 
        });

      case 'devops-deployment':
        const { deploymentId } = params;
        const deploymentResult = await devOpsService.startDeployment(deploymentId);
        return NextResponse.json({ 
          success: deploymentResult, 
          message: deploymentResult ? `Started deployment ${deploymentId}` : 'Failed to start deployment' 
        });

      case 'edge-workload':
        const { workloadId } = params;
        const workloadResult = await edgeComputingService.startWorkload(workloadId);
        return NextResponse.json({ 
          success: workloadResult, 
          message: workloadResult ? `Started edge workload ${workloadId}` : 'Failed to start edge workload' 
        });

      case 'clear':
        // Clear all data
        performanceMonitor.clearMetrics();
        databaseOptimizer.clearQueryCache();
        errorHandler.clearErrorLogs();
        return NextResponse.json({ message: 'All metrics cleared' });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Performance dashboard action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}

// Health calculation functions
function calculateCacheHealth(cacheStats: any): { status: string; score: number } {
  const hitRate = cacheStats.hitRate || 0;
  let status = 'healthy';
  let score = 100;

  if (hitRate < 50) {
    status = 'critical';
    score = 30;
  } else if (hitRate < 80) {
    status = 'warning';
    score = 70;
  }

  return { status, score };
}

function calculateDatabaseHealth(databaseMetrics: any): { status: string; score: number } {
  const avgResponseTime = databaseMetrics.avgResponseTime || 0;
  let status = 'healthy';
  let score = 100;

  if (avgResponseTime > 1000) {
    status = 'critical';
    score = 30;
  } else if (avgResponseTime > 500) {
    status = 'warning';
    score = 70;
  }

  return { status, score };
}

function calculateErrorHealth(errorMetrics: any): { status: string; score: number } {
  const errorRate = errorMetrics.errorRate || 0;
  let status = 'healthy';
  let score = 100;

  if (errorRate > 5) {
    status = 'critical';
    score = 30;
  } else if (errorRate > 2) {
    status = 'warning';
    score = 70;
  }

  return { status, score };
}

function calculateRedisHealth(redisMetrics: any): { status: string; score: number } {
  const isConnected = redisMetrics.isConnected || false;
  let status = 'healthy';
  let score = 100;

  if (!isConnected) {
    status = 'critical';
    score = 30;
  }

  return { status, score };
}

function calculateMarketHealth(marketMetrics: any): { status: string; score: number } {
  const confidence = marketMetrics.confidence || 0;
  let status = 'healthy';
  let score = 100;

  if (confidence < 50) {
    status = 'critical';
    score = 30;
  } else if (confidence < 80) {
    status = 'warning';
    score = 70;
  }

  return { status, score };
}

function calculateLoadBalancerHealth(loadBalancerMetrics: any): { status: string; score: number } {
  const healthyInstances = loadBalancerMetrics.healthyInstances || 0;
  const totalInstances = loadBalancerMetrics.totalInstances || 1;
  const healthPercentage = (healthyInstances / totalInstances) * 100;
  
  let status = 'healthy';
  let score = 100;

  if (healthPercentage < 50) {
    status = 'critical';
    score = 30;
  } else if (healthPercentage < 80) {
    status = 'warning';
    score = 70;
  }

  return { status, score };
}

function calculateMonitoringHealth(monitoringMetrics: any): { status: string; score: number } {
  const activeAlerts = monitoringMetrics.activeAlerts || 0;
  let status = 'healthy';
  let score = 100;

  if (activeAlerts > 5) {
    status = 'critical';
    score = 30;
  } else if (activeAlerts > 2) {
    status = 'warning';
    score = 70;
  }

  return { status, score };
}

function calculateKubernetesHealth(kubernetesMetrics: any): { status: string; score: number } {
  const healthyPods = kubernetesMetrics.healthyPods || 0;
  const totalPods = kubernetesMetrics.totalPods || 1;
  const healthPercentage = (healthyPods / totalPods) * 100;
  
  let status = 'healthy';
  let score = 100;

  if (healthPercentage < 50) {
    status = 'critical';
    score = 30;
  } else if (healthPercentage < 80) {
    status = 'warning';
    score = 70;
  }

  return { status, score };
}

function calculateMicroservicesHealth(microservicesMetrics: any): { status: string; score: number } {
  const healthyServices = microservicesMetrics.healthyServices || 0;
  const totalServices = microservicesMetrics.totalServices || 1;
  const healthPercentage = (healthyServices / totalServices) * 100;
  
  let status = 'healthy';
  let score = 100;

  if (healthPercentage < 50) {
    status = 'critical';
    score = 30;
  } else if (healthPercentage < 80) {
    status = 'warning';
    score = 70;
  }

  return { status, score };
}

function calculateGlobalHealth(globalMetrics: any): { status: string; score: number } {
  const score = globalMetrics.score || 0;
  let status = 'healthy';

  if (score < 50) {
    status = 'critical';
  } else if (score < 80) {
    status = 'warning';
  }

  return { status, score };
}

function calculateDevOpsHealth(devOpsMetrics: any): { status: string; score: number } {
  const score = devOpsMetrics.score || 0;
  let status = 'healthy';

  if (score < 50) {
    status = 'critical';
  } else if (score < 80) {
    status = 'warning';
  }

  return { status, score };
}

function calculateEdgeHealth(edgeMetrics: any): { status: string; score: number } {
  const score = edgeMetrics.score || 0;
  let status = 'healthy';

  if (score < 50) {
    status = 'critical';
  } else if (score < 80) {
    status = 'warning';
  }

  return { status, score };
}

function calculateComprehensiveScore(healthMetrics: any): number {
  const weights = {
    cache: 8,
    database: 10,
    error: 8,
    redis: 6,
    market: 6,
    loadBalancer: 8,
    monitoring: 8,
    kubernetes: 8,
    microservices: 8,
    global: 10,
    devOps: 10,
    edge: 10
  };

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  const weightedScore = (
    (healthMetrics.cache?.score || 0) * weights.cache +
    (healthMetrics.database?.score || 0) * weights.database +
    (healthMetrics.error?.score || 0) * weights.error +
    (healthMetrics.redis?.score || 0) * weights.redis +
    (healthMetrics.market?.score || 0) * weights.market +
    (healthMetrics.loadBalancer?.score || 0) * weights.loadBalancer +
    (healthMetrics.monitoring?.score || 0) * weights.monitoring +
    (healthMetrics.kubernetes?.score || 0) * weights.kubernetes +
    (healthMetrics.microservices?.score || 0) * weights.microservices +
    (healthMetrics.global?.score || 0) * weights.global +
    (healthMetrics.devOps?.score || 0) * weights.devOps +
    (healthMetrics.edge?.score || 0) * weights.edge
  );

  return Math.round(weightedScore / totalWeight);
}

function generateComprehensiveRecommendations(healthMetrics: any): string[] {
  const recommendations: string[] = [];

  // Cache recommendations
  if (healthMetrics.cache?.status === 'warning' || healthMetrics.cache?.status === 'critical') {
    recommendations.push('💾 Review cache strategy - increase TTL for frequently accessed data and implement cache warming');
    recommendations.push('🔍 Query cache optimization - review cache keys and implement query result caching');
  }

  // Database recommendations
  if (healthMetrics.database?.status === 'warning' || healthMetrics.database?.status === 'critical') {
    recommendations.push('🗄️ Database optimization - review slow queries and implement query result caching');
    recommendations.push('🔗 Connection pooling - optimize database connection management');
  }

  // Redis recommendations
  if (healthMetrics.redis?.status === 'warning' || healthMetrics.redis?.status === 'critical') {
    recommendations.push('📊 Redis cache optimization - review cache strategies and implement cache warming');
  }

  // Market recommendations
  if (healthMetrics.market?.status === 'warning' || healthMetrics.market?.status === 'critical') {
    recommendations.push('🎯 Market prediction confidence low - review prediction models and data quality');
  }

  // Load Balancer recommendations
  if (healthMetrics.loadBalancer?.status === 'warning' || healthMetrics.loadBalancer?.status === 'critical') {
    recommendations.push('⚖️ Load balancer health check - review instance health and auto-scaling policies');
  }

  // Monitoring recommendations
  if (healthMetrics.monitoring?.status === 'warning' || healthMetrics.monitoring?.status === 'critical') {
    recommendations.push('📊 Monitoring system - review alert thresholds and notification channels');
  }

  // Kubernetes recommendations
  if (healthMetrics.kubernetes?.status === 'warning' || healthMetrics.kubernetes?.status === 'critical') {
    recommendations.push('☸️ Kubernetes cluster - review pod health and resource allocation');
  }

  // Microservices recommendations
  if (healthMetrics.microservices?.status === 'warning' || healthMetrics.microservices?.status === 'critical') {
    recommendations.push('🏗️ Microservices health - review service mesh and API gateway status');
  }

  // Global Distribution recommendations
  if (healthMetrics.global?.status === 'warning' || healthMetrics.global?.status === 'critical') {
    recommendations.push('🌍 Global distribution - review regional health and edge node status');
  }

  // DevOps recommendations
  if (healthMetrics.devOps?.status === 'warning' || healthMetrics.devOps?.status === 'critical') {
    recommendations.push('🚀 DevOps pipeline - review CI/CD pipeline health and deployment strategies');
  }

  // Edge Computing recommendations
  if (healthMetrics.edge?.status === 'warning' || healthMetrics.edge?.status === 'critical') {
    recommendations.push('⚡ Edge computing - review edge node health and IoT device connectivity');
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('✅ All systems are operating optimally');
  }

  return recommendations;
}
