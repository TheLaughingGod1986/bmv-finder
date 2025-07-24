"use client";

import { useState } from "react";

export default function PostcodeResearchPage() {
  const [postcode, setPostcode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Placeholder for fetched data
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // TODO: Implement ONS API fetch logic here
  // Example endpoint: https://developer.ons.gov.uk/ (ONS UK Economic Data API)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(postcode);
    setLoading(true);
    setError("");
    setData(null);
    // TODO: Fetch ONS data for the postcode
    // setData(fetchedData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Postcode Research</h1>
        <form onSubmit={handleSearch} className="flex gap-2 mb-8 justify-center">
          <input
            type="text"
            className="border rounded-lg px-4 py-2 w-full max-w-xs"
            placeholder="Enter postcode (e.g. SW1A 1AA)"
            value={postcode}
            onChange={e => setPostcode(e.target.value)}
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Search</button>
        </form>
        {loading && <div className="text-center text-blue-600">Loading data...</div>}
        {error && <div className="text-center text-red-600">{error}</div>}
        {searchTerm && !loading && (
          <div className="space-y-8">
            {/* Demographics Section */}
            <section className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Demographics</h2>
              <div className="text-gray-500">(ONS data for population, age, households, etc. will appear here.)</div>
            </section>
            {/* Growth Section */}
            <section className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Growth</h2>
              <div className="text-gray-500">(ONS data for economic/house price growth will appear here.)</div>
            </section>
            {/* Employment Section */}
            <section className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Employment</h2>
              <div className="text-gray-500">(ONS data for employment rates, industries, etc. will appear here.)</div>
            </section>
            {/* Population Section */}
            <section className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Population</h2>
              <div className="text-gray-500">(ONS data for total population, density, etc. will appear here.)</div>
            </section>
            {/* Map Section */}
            <section className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Map & Growth Hotspots</h2>
              <div className="text-gray-500">(A map of the area, with growth areas highlighted, will appear here.)</div>
            </section>
            {/* Data Source Attribution */}
            <div className="text-xs text-gray-400 text-center mt-8">
              Data sourced from the <a href="https://developer.ons.gov.uk/" className="underline" target="_blank" rel="noopener noreferrer">ONS UK Economic Data API</a>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 