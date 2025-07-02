import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '../../../lib/esClient';

export async function POST(req: NextRequest) {
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

  // Pagination
  const limit = Math.max(1, Math.min(pageSize, 50));
  const from = (Math.max(1, page) - 1) * limit;

  try {
    // Build query based on input type
    let query: Record<string, unknown>;
    
    // Check if it looks like a postcode (UK postcode pattern)
    const postcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}$/i;
    const shortPostcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?$/i;
    
    if (postcodePattern.test(normalizedInput)) {
      // Full postcode search - match all variants
      query = {
        bool: {
          should: [
            { match_phrase: { postcode: normalizedInput } },
            { match_phrase: { postcode: inputNoSpace } },
            { match_phrase: { postcode: inputWithSpace } }
          ]
        }
      };
    } else if (shortPostcodePattern.test(normalizedInput)) {
      // Short postcode search - prefix match
      query = {
        bool: {
          should: [
            { match_phrase_prefix: { postcode: normalizedInput } },
            { match_phrase_prefix: { postcode: normalizedInput + ' ' } }
          ]
        }
      };
    } else {
      // Town/city search - fuzzy match across multiple fields
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
    }

    // Query Elasticsearch
    const result = await esClient.search({
      index: 'properties',
      from,
      size: limit,
      query,
      sort: [
        { dateOfTransfer: { order: 'desc' } }
      ],
      _source: [
        'id', 'price', 'dateOfTransfer', 'postcode', 'propertyType', 
        'propertyTypeLabel', 'street', 'town_city', 'county', 'paon', 
        'saon', 'duration', 'durationLabel', 'locality', 'fullAddress',
        'year', 'month', 'priceRange'
      ]
    });

    const hits = result.hits.hits.map(hit => hit._source as Record<string, unknown>);
    let totalCount = 0;
    if (result.hits.total !== undefined) {
      totalCount = typeof result.hits.total === 'number' ? result.hits.total : result.hits.total.value;
    }

    return NextResponse.json({
      data: hits,
      page,
      pageSize: limit,
      totalCount,
      searchType: postcodePattern.test(normalizedInput) ? 'full_postcode' : 
                  shortPostcodePattern.test(normalizedInput) ? 'short_postcode' : 'town'
    });
  } catch (error) {
    console.error('Elasticsearch search error:', error);
    return NextResponse.json({
      data: [],
      page,
      pageSize: limit,
      totalCount: 0,
      error: 'Elasticsearch not populated or unavailable',
      details: String(error)
    }, { status: 500 });
  }
} 