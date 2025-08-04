import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, applyRateLimitHeaders } from '@/lib/rateLimiter';
import ElasticsearchOptimizer from '@/lib/elasticsearchOptimizer';
import { esClient } from '@/lib/esClient';

const optimizer = new ElasticsearchOptimizer(esClient);

export const POST = async (req: NextRequest) => {
  const rateLimitResult = checkRateLimit(req);
  if (!rateLimitResult.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: rateLimitResult.error?.message || 'Rate limit exceeded' }, { status: rateLimitResult.error?.status || 429 }),
      rateLimitResult.headers
    );
  }
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

    const response = NextResponse.json({ summary, results, message: `Processed ${summary.successful}/${summary.total} postcodes successfully` });
    return applyRateLimitHeaders(response, rateLimitResult.headers);

  } catch (error) {
    const errorResponse = NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    return applyRateLimitHeaders(errorResponse, rateLimitResult.headers);
  }
}; 