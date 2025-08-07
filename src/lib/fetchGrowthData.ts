export interface GrowthData {
  region: string;
  annualHpiPct: number; // e.g., 4.5 means 4.5% annual growth
  sampleNote?: string;
}

// Mocked internal API call to get HPI by region.
// Replace with a real call to `/api/hpi` or `/api/hpi/postcode` as needed.
export async function fetchGrowthData(region: string): Promise<GrowthData> {
  try {
    const url = `/api/hpi?region=${encodeURIComponent(region)}`;
    const res = await fetch(url, { next: { revalidate: 0 } as any });
    if (res.ok) {
      // Expect payload to include an annualized figure; for now, fallback to mock
      const json = await res.json();
      if (json?.annualHpiPct) {
        return { region, annualHpiPct: json.annualHpiPct };
      }
    }
  } catch {
    // ignore
  }

  // Mock based on broad UK regions – tweak as needed
  const defaults: Record<string, number> = {
    London: 3.2,
    "South East": 3.8,
    "South West": 4.1,
    "East of England": 3.9,
    "West Midlands": 4.3,
    "East Midlands": 4.6,
    Yorkshire: 4.7,
    "North West": 5.1,
    "North East": 4.0,
    Wales: 4.2,
    Scotland: 3.5,
    England: 4.0,
  };
  const match = Object.keys(defaults).find((k) => region.includes(k));
  const annualHpiPct = match ? defaults[match] : 4.0;
  return {
    region,
    annualHpiPct,
    sampleNote: "Mocked growth rate (annualized) for development",
  };
}


