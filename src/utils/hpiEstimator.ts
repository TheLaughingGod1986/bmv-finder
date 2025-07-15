import { Client } from '@elastic/elasticsearch';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { format } from 'date-fns';

const HPI_INDEX = 'house_price_index';

// Helper to load HPI data from CSV if not using ES
let hpiData: Record<string, Record<string, number>> | null = null;
async function loadHpiCsv() {
  if (hpiData) return hpiData;
  hpiData = {};
  const file = path.join(process.cwd(), 'data/hpi.csv');
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
      }))
      .on('data', (row) => {
        const region = row.region;
        const date = row.date;
        const index = parseFloat(row.index);
        if (!hpiData![region]) hpiData![region] = {};
        hpiData![region][date] = index;
      })
      .on('end', () => resolve(hpiData!))
      .on('error', reject);
  });
}

// Example HPI data type: { region: string, date: string (YYYY-MM), index: number }
export type HpiRecord = {
  region: string;
  date: string; // 'YYYY-MM'
  index: number;
};

/**
 * Finds the HPI index for a given region and date (YYYY-MM).
 * Returns null if not found.
 */
export function getIndex(hpiData: HpiRecord[], region: string, date: string): number | null {
  const rec = hpiData.find(
    (r) => r.region.toLowerCase() === region.toLowerCase() && r.date === date
  );
  return rec ? rec.index : null;
}

/**
 * Estimates the current value of a property using HPI data.
 * @param hpiData Array of HPI records
 * @param region Region string
 * @param purchaseDate Date string (YYYY-MM)
 * @param purchasePrice Number
 * @param currentDate Date string (YYYY-MM)
 * @returns { estimatedValue, currentIndex, pastIndex }
 */
export function estimateUsingHpi(
  hpiData: HpiRecord[],
  region: string,
  purchaseDate: string,
  purchasePrice: number,
  currentDate: string
): { estimatedValue: number | null; currentIndex: number | null; pastIndex: number | null } {
  const pastIndex = getIndex(hpiData, region, purchaseDate);
  const currentIndex = getIndex(hpiData, region, currentDate);
  if (pastIndex == null || currentIndex == null) {
    return { estimatedValue: null, currentIndex, pastIndex };
  }
  const estimatedValue = (purchasePrice * currentIndex) / pastIndex;
  return { estimatedValue, currentIndex, pastIndex };
}

/**
 * Calculates year-over-year growth for a region and date.
 * @param hpiData Array of HPI records
 * @param region Region string
 * @param date Date string (YYYY-MM)
 * @returns YoY growth as a decimal (e.g., 0.05 for 5%), or null if not computable
 */
export function calculateYoYGrowth(
  hpiData: HpiRecord[],
  region: string,
  date: string
): number | null {
  const thisIndex = getIndex(hpiData, region, date);
  // Subtract 1 year (assume date is YYYY-MM)
  const dt = parse(date + '-01', 'yyyy-MM-dd', new Date());
  const prevYear = format(new Date(dt.setFullYear(dt.getFullYear() - 1)), 'yyyy-MM');
  const lastYearIndex = getIndex(hpiData, region, prevYear);
  if (thisIndex == null || lastYearIndex == null) return null;
  return (thisIndex - lastYearIndex) / lastYearIndex;
} 