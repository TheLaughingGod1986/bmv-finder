import { NextRequest, NextResponse } from 'next/server';
import { esClient, checkElasticsearchHealth } from '@/lib/esClient';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      overall: 'unknown',
      elasticsearch: null as any,
      supabase: null as any,
      recommendations: [] as string[]
    };

    // Test Elasticsearch
    try {
      health.elasticsearch = await checkElasticsearchHealth();
      if (health.elasticsearch.status === 'healthy') {
        console.log('✅ Elasticsearch health check passed');
      } else {
        console.warn('⚠️ Elasticsearch health check failed');
        health.recommendations.push('Check Elasticsearch container status and connectivity');
      }
    } catch (error) {
      health.elasticsearch = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      health.recommendations.push('Elasticsearch connection failed - check Docker container');
    }

    // Test Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase.from('_dummy_table_').select('*').limit(1);
        if (error && error.code === '42P01') {
          // Table doesn't exist, but connection works
          health.supabase = {
            status: 'connected',
            message: 'Connection successful (table not found is expected)'
          };
        } else if (error) {
          health.supabase = {
            status: 'error',
            error: error.message
          };
          health.recommendations.push('Supabase connection failed - check credentials');
        } else {
          health.supabase = {
            status: 'connected',
            message: 'Connection and query successful'
          };
        }
      } catch (error) {
        health.supabase = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        health.recommendations.push('Supabase connection failed - check network and credentials');
      }
    } else {
      health.supabase = {
        status: 'not_configured',
        message: 'Supabase credentials not configured'
      };
      health.recommendations.push('Add SUPABASE_URL and SUPABASE_ANON_KEY to environment variables');
    }

    // Determine overall health
    if (health.elasticsearch?.status === 'healthy' && health.supabase?.status === 'connected') {
      health.overall = 'healthy';
    } else if (health.elasticsearch?.status === 'healthy' || health.supabase?.status === 'connected') {
      health.overall = 'degraded';
    } else {
      health.overall = 'critical';
    }

    return NextResponse.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
