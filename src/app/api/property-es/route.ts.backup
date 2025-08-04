import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '../../../lib/esClient';

export async function POST(req: NextRequest) {
  try {
    const { searchTerm, page = 1, pageSize = 20 } = await req.json();


    if (!searchTerm) {
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
    }

    // Normalize input: remove extra spaces and uppercase
    let normalizedInput = searchTerm.trim().toUpperCase();

    // If input is a 6 or 7 character string with no space, insert a space before the last 3 chars
    const compactPostcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/i;
    if (compactPostcodePattern.test(normalizedInput) && !normalizedInput.includes(' ')) {
      normalizedInput = normalizedInput.slice(0, -3) + ' ' + normalizedInput.slice(-3);
    }

    // Also prepare variants
    const inputNoSpace = normalizedInput.replace(/\s/g, '');
    const inputWithSpace = normalizedInput.length > 3 && normalizedInput[normalizedInput.length - 4] !== ' ' ? normalizedInput.slice(0, -3) + ' ' + normalizedInput.slice(-3) : normalizedInput;

    // Build query based on input type
    let query: Record<string, unknown>;
    const postcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}$/i;
    const shortPostcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?$/i;
    let canAggregate = false;
    let isPostcodeSearch = false;

    if (postcodePattern.test(normalizedInput)) {
      // Full postcode search - match all variants
      query = {
        bool: {
          should: [
            { match_phrase: { 'postcode': normalizedInput } },
            { match_phrase: { 'postcode': inputNoSpace } },
            { match_phrase: { 'postcode': inputWithSpace } }
          ]
        }
      };
      isPostcodeSearch = true;
    } else if (shortPostcodePattern.test(normalizedInput)) {
      // Short postcode search - prefix match
      query = {
        bool: {
          should: [
            { prefix: { 'postcode': normalizedInput } },
            { prefix: { 'postcode': normalizedInput + ' ' } }
          ]
        }
      };
      isPostcodeSearch = true;
    } else {
      // Town/city search - fuzzy match across multiple fields (can aggregate)
      query = {
        bool: {
          should: [
            { match: { town_city: { query: normalizedInput, fuzziness: 'AUTO' } } },
            { match: { locality: { query: normalizedInput, fuzziness: 'AUTO' } } },
            { match: { county: { query: normalizedInput, fuzziness: 'AUTO' } } },
            { match: { street: { query: normalizedInput, fuzziness: 'AUTO' } } },
            { match: { fullAddress: { query: normalizedInput, fuzziness: 'AUTO' } } }
          ],
          minimum_should_match: 1
        }
      };
      canAggregate = true;
    }


    // Pagination logic
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    let safePageSize = Math.max(1, parseInt(pageSize, 10) || 20);
    if (safePageSize > 100) safePageSize = 100;

    try {
      if (isPostcodeSearch) {
        // Return all sales for postcode (no deduplication)
        const result = await esClient.search({
          index: 'properties-enhanced',
          size: safePageSize,
          from: (safePage - 1) * safePageSize,
          query,
          sort: [
            { date: { order: 'desc' } }
          ]
        });
        const hits = result.hits.hits.map(hit => hit._source as Record<string, unknown>);
        return NextResponse.json({
          data: hits,
          totalCount: typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total ?? hits.length,
          hasMore: hits.length === safePageSize
        });
      } else if (canAggregate) {
        // Use composite aggregation for deduplication
        const result = await esClient.search({
          index: 'properties-enhanced',
          size: 0, // no hits, just aggs
          query,
          aggs: {
            deduped_properties: {
              composite: {
                size: safePageSize,
                sources: [
                  {
                    address: {
                      terms: {
                        script: {
                          source: "((doc.containsKey('paon.keyword') && !doc['paon.keyword'].empty ? doc['paon.keyword'].value : '') + '|' + (doc.containsKey('street.keyword') && !doc['street.keyword'].empty ? doc['street.keyword'].value : '') + '|' + (doc.containsKey('postcode.keyword') && !doc['postcode.keyword'].empty ? doc['postcode.keyword'].value : '')).toLowerCase()",
                          lang: 'painless'
                        }
                      }
                    }
                  }
                ]
              },
                                aggs: {
                    most_recent_sale: {
                      top_hits: {
                        size: 1,
                        sort: [
                          { date: { order: 'desc' } }
                        ]
                      }
                    }
                  }
            }
          }
        });

        const buckets = (result.aggregations?.deduped_properties as any)?.buckets || [];
        const hits = buckets.map((bucket: any) => bucket.most_recent_sale.hits.hits[0]._source);
        return NextResponse.json({
          data: hits,
          totalCount: hits.length,
          hasMore: buckets.length === safePageSize
        });
      } else {
        // Fallback: normal search
        const result = await esClient.search({
          index: 'properties-enhanced',
          size: safePageSize,
          from: (safePage - 1) * safePageSize,
          query,
          sort: [
            { date: { order: 'desc' } }
          ]
        });

        const hits = result.hits.hits.map(hit => hit._source as Record<string, unknown>);
        return NextResponse.json({
          data: hits,
          totalCount: typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total ?? hits.length,
          hasMore: hits.length === safePageSize
        });
      }
    } catch (error) {
      console.error('[property-es] Elasticsearch property search error:', error);
      return NextResponse.json({ error: 'Failed to fetch properties', details: error }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in property-es:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
} 