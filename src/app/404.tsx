import { Button } from './components/ui';

export default function Custom404() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft border border-neutral-200 p-8 text-center max-w-md">
        <h1 className="text-4xl font-bold text-primary-700 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-primary-600 mb-4">Page Not Found</h2>
        <p className="text-primary-600 mb-6">The page you are looking for does not exist.</p>
        <Button variant="primary" size="md" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    </div>
  );
} 