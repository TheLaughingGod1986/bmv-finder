import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rateLimiter';
import ElasticsearchOptimizer from '@/lib/elasticsearchOptimizer';
import { esClient } from '@/lib/esClient';

const optimizer = new ElasticsearchOptimizer(esClient);

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { postcodes, includeApi = false } = body;

    if (!postcodes || !Array.isArray(postcodes)) {
      return NextResponse.json(
        { error: 'Postcodes array is required' },
        { status: 400 }
      );
    }

    if (postcodes.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 postcodes allowed per batch' },
        { status: 400 }
      );
    }

    // Process postcodes in batches
    const results = await optimizer.batchSearchHpi(postcodes);

    // Calculate summary statistics
    const summary = {
      total: postcodes.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      averageResponseTime: 0, // Could be calculated if timing is added
    };

    return NextResponse.json({
      summary,
      results,
      message: `Processed ${summary.successful}/${summary.total} postcodes successfully`
    });

  } catch (error) {
    console.error('Error in batch HPI search:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}); 