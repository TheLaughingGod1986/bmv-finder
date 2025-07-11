import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '../../../lib/esClient';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.toUpperCase() || '';
  if (!query) return NextResponse.json({ suggestions: [] });

  const result = await esClient.search({
    index: 'properties_v2',
    size: 20, // get more to ensure uniqueness
    query: {
      match_phrase_prefix: { postcode: query }
    },
    _source: ['postcode']
  });

  // Unique postcodes only, cast _source to correct type
  const suggestions = Array.from(
    new Set(
      result.hits.hits.map(hit => (hit._source as { postcode: string }).postcode)
    )
  ).slice(0, 10);
  return NextResponse.json({ suggestions });
} 