
import { Calculator, TrendingUp, MapPin, Home, Target, Info } from 'lucide-react';

type Props = {
  avgValue: number;
  suggestedOffer: number;
  offerMargin: number;
  comps: Array<{ similarityScore?: number }>;
  searchCriteria: { postcode?: string; propertyType?: string; bedrooms?: number; plotSize?: number; epcRating?: string; condition?: string };
  confidence: { score?: number; rating?: string; reason?: string };
  latestYoY: number | null;
};

export default function ValuationExplanation({ 
  avgValue, 
  suggestedOffer, 
  offerMargin, 
  comps, 
  searchCriteria,
  confidence,
  latestYoY 
}: Props) {
  const totalComps = comps.length;
  const avgSimilarity = comps.reduce((sum, comp) => sum + (comp.similarityScore || 0), 0) / totalComps;
  const highSimilarityComps = comps.filter(comp => (comp.similarityScore || 0) >= 80).length;
  
  return (
    <div className="rounded-lg border p-6 bg-white shadow">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">How We Calculated Your Offer</h2>
      </div>
      
      {/* Step-by-Step Process */}
      <div className="space-y-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
          <div>
            <h3 className="font-semibold text-gray-900">Found Comparable Properties</h3>
            <p className="text-gray-600 text-sm">
              We found <strong>{totalComps} properties</strong> in {searchCriteria.postcode} that match your criteria:
            </p>
            <ul className="text-sm text-gray-600 mt-1 ml-4 list-disc">
              {searchCriteria.propertyType && <li>Property type: {searchCriteria.propertyType}</li>}
              {searchCriteria.bedrooms && <li>Bedrooms: {searchCriteria.bedrooms}</li>}
              {searchCriteria.plotSize && <li>Property size: ~{searchCriteria.plotSize}m²</li>}
              {searchCriteria.epcRating && <li>EPC rating: {searchCriteria.epcRating}</li>}
              {searchCriteria.condition !== 'any' && <li>Condition: {searchCriteria.condition}</li>}
            </ul>
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
              <strong>Enhanced Matching:</strong> Properties were scored based on bedroom count (40%), size similarity (30%), EPC rating (20%), and property type (10%).
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">2</div>
          <div>
            <h3 className="font-semibold text-gray-900">Applied Market Inflation</h3>
            <p className="text-gray-600 text-sm">
              We adjusted each sale price for market changes since the sale date using House Price Index (HPI) data.
            </p>
            {latestYoY !== null && (
              <p className="text-sm text-blue-600 mt-1">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Market growth in this area: <strong>{(latestYoY * 100).toFixed(1)}%</strong> year-over-year
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">3</div>
          <div>
            <h3 className="font-semibold text-gray-900">Calculated Average Market Value</h3>
            <p className="text-gray-600 text-sm">
              Average of all inflation-adjusted prices: <strong>£{avgValue.toLocaleString()}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">4</div>
          <div>
            <h3 className="font-semibold text-gray-900">Applied Investor Discount</h3>
            <p className="text-gray-600 text-sm">
              Applied <strong>{(offerMargin * 100)}%</strong> discount for investor margin: 
              <strong className="text-green-600 ml-1">£{suggestedOffer.toLocaleString()}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Data Quality Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Location Match</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{Math.round(avgSimilarity)}%</div>
          <div className="text-sm text-blue-700">Average similarity score</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-900">High-Quality Matches</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{highSimilarityComps}</div>
          <div className="text-sm text-green-700">Properties with 80%+ similarity</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-900">Confidence</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{confidence.score}%</div>
          <div className="text-sm text-purple-700">{confidence.rating} confidence</div>
        </div>
      </div>

      {/* Confidence Explanation */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-900">Why This Confidence Level?</span>
        </div>
        <p className="text-sm text-gray-700">{confidence.reason}</p>
        
        {totalComps < 3 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> We found fewer than 3 comparable sales. Consider expanding your search area 
              or relaxing some criteria for more accurate valuations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 