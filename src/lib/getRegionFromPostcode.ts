export interface RegionResult {
  region: string;
  adminDistrict?: string;
}

// Fetch region info from Postcodes.io. Falls back to mock data if API fails.
export async function getRegionFromPostcode(postcodeRaw: string): Promise<RegionResult> {
  const postcode = postcodeRaw.trim();
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    const json = await res.json();
    if (res.ok && json?.result) {
      const region = json.result.region || json.result.admin_district || "Unknown";
      return { region, adminDistrict: json.result.admin_district };
    }
  } catch {
    // ignore
  }
  // Mocked fallback for offline/dev use
  return { region: "England", adminDistrict: "Westminster" };
}


