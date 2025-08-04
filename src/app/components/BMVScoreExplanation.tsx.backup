import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, TrendingUp, Calculator, Target } from 'lucide-react';

const BMVScoreExplanation: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <Target className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-1">What is the BMV Score?</h4>
          <p className="text-sm text-blue-800 leading-relaxed mb-2">
            The <strong>Below Market Value (BMV)</strong> score helps you spot properties that may be undervalued compared to similar homes in the area. Higher scores suggest better investment potential based on local market trends, rental yields, and price growth patterns.
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-blue-700 hover:text-blue-800 text-sm font-medium mt-1 transition-colors"
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Learn more about scoring
              </>
            )}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-4 pt-4 border-t border-blue-200 text-sm text-blue-900">
          <div className="mb-3 font-semibold">How is the score calculated?</div>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Compares the property to similar homes in the area (market value).</li>
            <li>Analyzes local price growth and rental yield trends.</li>
            <li>Considers property type, tenure, and transaction volume.</li>
            <li>Combines all factors into a single score (0-100).</li>
          </ul>
          <div className="mb-2 font-semibold">Score categories:</div>
          <div className="space-y-1 mb-2">
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span> 80-100: Excellent BMV</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span> 65-79: Good BMV</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-500 rounded-full inline-block"></span> 50-64: Fair Value</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-500 rounded-full inline-block"></span> 35-49: Overpriced</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span> 0-34: Poor Value</div>
          </div>
          <div className="text-xs text-blue-700 mt-2">
            <Info className="inline w-4 h-4 mr-1 align-text-bottom" />
            BMV scores are for guidance only. Always do your own research and consider professional advice.
          </div>
        </div>
      )}
    </div>
  );
};

export default BMVScoreExplanation; 