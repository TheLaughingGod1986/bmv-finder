import { NextRequest, NextResponse } from 'next/server';
import { getIndex, estimateUsingHpi, calculateYoYGrowth, HpiRecord } from '@/utils/hpiEstimator';
import { scoreConfidence } from '@/utils/confidenceScorer';
import { esClient } from '@/lib/esClient';
import { postcodeToRegion } from '@/utils/postcodeToRegion';
import { parse, format, differenceInMonths } from 'date-fns';

// Helper: fetch HPI data from ES (or cache)
async function fetchHpiData(region: string): Promise<HpiRecord[]> {
  // Example: fetch all HPI records for region from ES
  const resp = await esClient.search({
    index: 'house_price_index',
    size: 10000,
    query: { match: { region } },
    sort: [{ date: { order: 'asc' } }],
  });
  return resp.hits.hits.map((hit: any) => hit._source as HpiRecord);
}

// Helper: fetch lat/lon for a postcode using postcodes.io
async function getLatLonForPostcode(postcode: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 200 && data.result) {
      return { lat: data.result.latitude, lon: data.result.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

// Helper: fetch comps for a property
async function fetchComps(postcode: string, propertyType: string, maxDistanceKm = 2, months = 12) {
  // Example: fetch recent sales within X km and Y months
  const now = new Date();
  const minDate = format(new Date(now.setMonth(now.getMonth() - months)), 'yyyy-MM');
  // Look up lat/lon for the postcode
  const latLon = await getLatLonForPostcode(postcode);
  if (!latLon) {
    throw new Error('Could not geocode postcode');
  }
  const resp = await esClient.search({
    index: 'properties',
    size: 1000,
    query: {
      bool: {
        must: [
          { match: { propertyType } },
          { range: { dateOfTransfer: { gte: minDate } } },
        ],
        filter: [
          { geo_distance: { distance: `${maxDistanceKm}km`, location: latLon } },
        ],
      },
    },
    sort: [{ dateOfTransfer: { order: 'desc' } }],
    _source: ['pricePaid', 'dateOfTransfer', 'propertyType', 'postcode', 'town_city', 'county', 'paon', 'street', 'locality', 'tenure']
  });
  return resp.hits.hits.map((hit: any) => hit._source);
}

export async function POST(req: NextRequest) {
  try {
    const { postcode, propertyType, offerMargin = 0.85 } = await req.json();
    if (!postcode || !propertyType) {
      return NextResponse.json({ error: 'postcode and propertyType required' }, { status: 400 });
    }
    const region = postcodeToRegion(postcode);
    if (!region) {
      return NextResponse.json({ error: 'Could not map postcode to region' }, { status: 400 });
    }
    // Fetch HPI data for region
    const hpiData = await fetchHpiData(region);
    // Fetch comps
    const comps = await fetchComps(postcode, propertyType);
    if (!comps.length) {
      return NextResponse.json({ error: 'No comparable sales found' }, { status: 404 });
    }
    // HPI-adjust comps to current value
    const currentDate = format(new Date(), 'yyyy-MM');
    const adjustedComps = comps.map((comp: any) => {
      const { date: compDate, price: compPrice } = comp;
      const { estimatedValue } = estimateUsingHpi(hpiData, region, compDate, compPrice, currentDate);
      return { ...comp, hpiAdjusted: estimatedValue };
    });
    // Average HPI-adjusted value
    const avgValue =
      adjustedComps.reduce((sum: number, c: any) => sum + (c.hpiAdjusted || 0), 0) /
      adjustedComps.length;
    // Suggest BMV offer
    const suggestedOffer = avgValue * offerMargin;
    // Confidence scoring
    const compDates = adjustedComps.map((c: any) => c.date);
    const recencies = compDates.map((d: string) => {
      const compDt = parse(d + '-01', 'yyyy-MM-dd', new Date());
      return differenceInMonths(new Date(), compDt);
    });
    const avgCompRecency = recencies.reduce((a, b) => a + b, 0) / recencies.length;
    // HPI volatility: stddev of YoY growth
    const yoyGrowths = hpiData
      .map((rec) => calculateYoYGrowth(hpiData, region, rec.date))
      .filter((v) => v != null) as number[];
    const mean = yoyGrowths.reduce((a, b) => a + b, 0) / yoyGrowths.length;
    const variance =
      yoyGrowths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / yoyGrowths.length;
    const hpiVolatility = Math.sqrt(variance);
    const confidence = scoreConfidence(comps.length, avgCompRecency, hpiVolatility);
    // YoY growth (latest)
    const latestDate = hpiData[hpiData.length - 1]?.date;
    const latestYoY = latestDate ? calculateYoYGrowth(hpiData, region, latestDate) : null;
    // Response
    return NextResponse.json({
      region,
      comps: adjustedComps,
      avgValue,
      suggestedOffer,
      offerMargin,
      confidence,
      latestYoY,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 