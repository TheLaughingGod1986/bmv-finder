"use client";

import { useEffect } from "react";
import Button from './components/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console instead of Sentry
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Something went wrong!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                An unexpected error occurred. Please try again.
              </p>
              <div className="mt-5">
                <Button variant="primary" size="md" onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}