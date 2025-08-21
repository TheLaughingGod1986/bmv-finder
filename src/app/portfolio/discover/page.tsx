import PropertyDiscovery from '@/app/components/PropertyDiscovery';

export default function PortfolioDiscoverPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Property Discovery
          </h1>
          <p className="text-gray-600">
            Discover properties in your area and add them to your portfolio with comprehensive analysis
          </p>
        </div>

        <PropertyDiscovery />
      </div>
    </div>
  );
}
