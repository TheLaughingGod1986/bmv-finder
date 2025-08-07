// Location-aware CPI proxy. For now, use a mocked CPI by region band.
// Later we can plug real ONS CPIH by region or local authority.

export async function fetchLocationInflation(postcode: string): Promise<{ cpiAnnualPct: number; source: string }> {
  try {
    // Example: use ONS endpoint in the future; for now, just basic lookup
    const res = await fetch(`/api/ons-data?postcode=${encodeURIComponent(postcode)}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const region = json?.data?.areaInfo?.region || 'England';
      const band: Record<string, number> = {
        London: 3.5,
        'South East': 3.2,
        'South West': 3.0,
        'East of England': 3.1,
        'West Midlands': 3.3,
        'East Midlands': 3.2,
        Yorkshire: 3.1,
        'North West': 3.2,
        'North East': 3.0,
        Wales: 3.1,
        Scotland: 3.0,
        England: 3.1,
      };
      const cpiAnnualPct = band[region] ?? 3.1;
      return { cpiAnnualPct, source: `ONS mock by region (${region})` };
    }
  } catch {}
  return { cpiAnnualPct: 3.0, source: 'Default CPI' };
}


