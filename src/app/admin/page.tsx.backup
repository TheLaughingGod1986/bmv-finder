
import BusinessIntelligenceDashboard from '../components/BusinessIntelligenceDashboard';
import DataQualityDashboard from '../components/DataQualityDashboard';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor your platform&apos;s performance, data quality, and business metrics
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <a
              href="#business-intelligence"
              className="text-blue-600 border-b-2 border-blue-600 py-2 px-1 text-sm font-medium"
            >
              Business Intelligence
            </a>
            <a
              href="#data-quality"
              className="text-gray-500 hover:text-gray-700 py-2 px-1 text-sm font-medium"
            >
              Data Quality
            </a>
            <a
              href="#system-health"
              className="text-gray-500 hover:text-gray-700 py-2 px-1 text-sm font-medium"
            >
              System Health
            </a>
          </nav>
        </div>

        {/* Business Intelligence Section */}
        <section id="business-intelligence" className="mb-12">
          <BusinessIntelligenceDashboard />
        </section>

        {/* Data Quality Section */}
        <section id="data-quality" className="mb-12">
          <DataQualityDashboard />
        </section>

        {/* System Health Section */}
        <section id="system-health" className="mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">System Health Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* API Status */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-green-900">API Status</p>
                    <p className="text-sm text-green-700">All systems operational</p>
                  </div>
                </div>
              </div>

              {/* Database Status */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-green-900">Database</p>
                    <p className="text-sm text-green-700">Elasticsearch healthy</p>
                  </div>
                </div>
              </div>

              {/* Cache Status */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-blue-900">Cache</p>
                    <p className="text-sm text-blue-700">85% hit rate</p>
                  </div>
                </div>
              </div>

              {/* Rate Limiting */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-yellow-900">Rate Limits</p>
                    <p className="text-sm text-yellow-700">12% of users near limit</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                  Export Analytics Report
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">
                  Refresh Data Quality
                </button>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm">
                  View System Logs
                </button>
                <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 text-sm">
                  Clear Cache
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">New user registration</p>
                    <p className="text-sm text-gray-600">User #1248 joined the platform</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">2 minutes ago</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Property prediction made</p>
                    <p className="text-sm text-gray-600">High-confidence prediction for M1 1AA</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">5 minutes ago</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Data quality check</p>
                    <p className="text-sm text-gray-600">All metrics within acceptable ranges</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">15 minutes ago</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Cache refresh</p>
                    <p className="text-sm text-gray-600">HPI data cache updated</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">1 hour ago</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 