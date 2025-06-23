import React from 'react';

interface EmptyStateProps {
  postcode: string;
  hasSearched: boolean;
  onTryDifferentSearch: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ postcode, hasSearched, onTryDifferentSearch }) => {
  if (!hasSearched) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Ready to explore property prices?
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Enter a postcode, street name, or town above to discover sold property prices and market trends in your area.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-lg mx-auto">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Search Tips:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Try partial postcodes (e.g., "SW1A" instead of "SW1A 1AA")</li>
            <li>• Search by street name (e.g., "Downing Street")</li>
            <li>• Use town or city names (e.g., "Manchester")</li>
            <li>• Press ⌘K to quickly focus the search box</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-4">
        No properties found for "{postcode}"
      </h3>
      <p className="text-gray-600 max-w-md mx-auto mb-8">
        We couldn't find any sold properties matching your search. This could be because:
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-lg mx-auto mb-8">
        <ul className="text-sm text-gray-700 space-y-2 text-left">
          <li>• The postcode might be too specific - try a broader area</li>
          <li>• No properties have been sold in this area recently</li>
          <li>• The spelling might be different from our records</li>
          <li>• The area might be too small or too new</li>
        </ul>
      </div>
      <div className="space-y-4">
        <button
          onClick={onTryDifferentSearch}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Try a Different Search
        </button>
        <div className="text-sm text-gray-500">
          Popular areas: <button onClick={() => onTryDifferentSearch()} className="text-blue-600 hover:underline mx-1">London</button> • 
          <button onClick={() => onTryDifferentSearch()} className="text-blue-600 hover:underline mx-1">Manchester</button> • 
          <button onClick={() => onTryDifferentSearch()} className="text-blue-600 hover:underline mx-1">Birmingham</button> • 
          <button onClick={() => onTryDifferentSearch()} className="text-blue-600 hover:underline mx-1">Leeds</button>
        </div>
      </div>
    </div>
  );
};

export default EmptyState; 