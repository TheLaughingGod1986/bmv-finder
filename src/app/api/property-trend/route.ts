import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '../../../lib/esClient';

export async function POST(req: NextRequest) {
  try {
    const { searchTerm } = await req.json();

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

    try {
      // Elasticsearch aggregation: group by year, average price
      const result = await esClient.search({
        index: 'properties',
        size: 1000,
        query,
        sort: [{ dateOfTransfer: { order: 'desc' } }],
        _source: ['pricePaid', 'dateOfTransfer', 'propertyType', 'postcode', 'town_city', 'county', 'paon', 'street', 'locality', 'tenure']
      });

      const buckets = (result.aggregations?.prices_by_year as any)?.buckets || [];
      const trend = buckets.map((bucket: any) => ({
        year: Number(bucket.key),
        averagePrice: Math.round(bucket.avg_price.value)
      }));

      return NextResponse.json(trend);
    } catch (error) {
      console.error('Elasticsearch trend aggregation error:', error);
      return NextResponse.json({ error: 'Failed to fetch property trend', details: String(error) }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in property-trend:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
} 