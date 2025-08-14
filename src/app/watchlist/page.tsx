import { Client } from '@elastic/elasticsearch';

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  requestTimeout: 60000,
  maxRetries: 3,
  retryOnTimeout: true
});

interface WatchlistItem {
  id: string;
  user_id: string;
  property_id: string;
  postcode: string;
  address: string;
  house_number: string;
  street: string;
  town: string;
  county: string;
  property_type: string;
  price: number;
  date_added: string;
  notes: string;
  status: 'watching' | 'interested' | 'purchased';
  source: string;
  last_updated: string;
}

async function getWatchlistData(): Promise<WatchlistItem[]> {
  try {
    const response = await esClient.search({
      index: 'watchlist',
      body: {
        query: {
          match: {
            user_id: 'user_123'
          }
        },
        sort: [
          { date_added: { order: 'desc' } }
        ],
        size: 100
      }
    });

    if (response.hits?.hits) {
      return response.hits.hits.map(hit => ({
        ...hit._source,
        id: hit._id
      })) as WatchlistItem[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
}

export default async function WatchlistPage() {
  const watchlist = await getWatchlistData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watching': return 'bg-blue-100 text-blue-800';
      case 'interested': return 'bg-yellow-100 text-yellow-800';
      case 'purchased': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Property Watchlist</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track properties you're interested in. Properties added via the Chrome extension will appear here.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{watchlist.length}</div>
              <div className="text-sm text-gray-600">Total Properties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {watchlist.filter(p => p.status === 'watching').length}
              </div>
              <div className="text-sm text-gray-600">Watching</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {watchlist.filter(p => p.status === 'interested').length}
              </div>
              <div className="text-sm text-gray-600">Interested</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {watchlist.filter(p => p.status === 'purchased').length}
              </div>
              <div className="text-sm text-gray-600">Purchased</div>
            </div>
          </div>
        </div>

        {/* Watchlist */}
        {watchlist.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👀</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties in your watchlist</h3>
            <p className="text-gray-600 mb-6">
              Start building your watchlist by adding properties via the Chrome extension or manually.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                • Install the Chrome extension to capture properties while browsing
              </p>
              <p className="text-sm text-gray-500">
                • Use the Property Analyzer to add properties manually
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {watchlist.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Property Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {property.address}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {property.postcode}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {property.property_type} • {property.county}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                      {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </span>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center text-lg font-bold text-gray-900 mb-3">
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2 .9 2 2s-.89 2-2 2-2-.9-2-2 .89-2 2-2z" />
                    </svg>
                    £{property.price.toLocaleString()}
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-6">
                  {/* Notes */}
                  {property.notes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {property.notes}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Added: {formatDate(property.date_added)}
                    </div>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Source: {property.source.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                      Analyze
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
