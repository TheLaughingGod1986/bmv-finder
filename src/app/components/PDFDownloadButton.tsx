'use client';

import { useState } from 'react';
import { Download, FileText, Star, Shield, TrendingUp } from 'lucide-react';
import { useToast } from './ToastProvider';
import { apiClient } from '@/lib/apiClient';
import Button from './Button';

interface PDFDownloadButtonProps {
  userId: string;
  email?: string;
  propertyData: {
    postcode: string;
    propertyType: string;
    [key: string]: unknown;
  };
  className?: string;
  userTier?: string;
}

interface CheckoutResponse {
  url: string;
  error?: string;
}

export default function PDFDownloadButton({ 
  userId, 
  email, 
  propertyData, 
  className = '',
  userTier = 'free'
}: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  
  // Use the actual tier, with fallback for testing
  const effectiveTier = userTier || 'elite';

  const handleFreeDownload = async () => {
    if (!userId || loading) return;
    
    setLoading(true);
    try {
      // For Elite members, generate PDF directly without payment
      const response = await fetch('/api/generate-pdf-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          propertyData,
          isEliteMember: true 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `property-valuation-report-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast({
        type: 'success',
        title: 'PDF Downloaded',
        message: 'Your professional report has been downloaded successfully.'
      });
    } catch (error: unknown) {
      showToast({
        type: 'error',
        title: 'Download Error',
        message: error instanceof Error ? error.message : 'Failed to download PDF. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!userId || loading) return;
    
    setLoading(true);
    try {
      const response = await apiClient.createPDFReportSession(userId, email || '', propertyData);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data && typeof response.data === 'object' && 'url' in response.data) {
        const url = (response.data as CheckoutResponse).url;
        showToast({
          type: 'success',
          title: 'Redirecting to Checkout',
          message: 'Complete your purchase to download your professional report.'
        });
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: unknown) {
      showToast({
        type: 'error',
        title: 'Purchase Error',
        message: error instanceof Error ? error.message : 'Failed to start purchase. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">Professional Report</h3>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-xs text-gray-600 ml-1">Perfect for negotiations</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-2 text-xs">
          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield className="w-2.5 h-2.5 text-green-600" />
          </div>
          <span className="text-gray-700">Professional presentation for agents & sellers</span>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <TrendingUp className="w-2.5 h-2.5 text-blue-600" />
          </div>
          <span className="text-gray-700">Detailed market analysis & trends</span>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Download className="w-2.5 h-2.5 text-purple-600" />
          </div>
          <span className="text-gray-700">Instant download after payment</span>
        </div>
      </div>

      {(effectiveTier === 'elite' || effectiveTier === 'Elite') ? (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1 mb-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium text-green-800">Elite Member</span>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-1">FREE</div>
          <div className="text-xs text-gray-600">Included with Elite membership</div>
        </div>
      ) : (
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-gray-900 mb-1">£4.99</div>
          <div className="text-xs text-gray-600 mb-2">One-time purchase</div>
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-2 py-1">
            <span className="text-xs font-medium text-blue-800">30-day money-back guarantee</span>
          </div>
        </div>
      )}

      {!userId ? (
        <div className="space-y-3">
          <Button
            onClick={() => window.location.href = '/auth?redirect=/what-should-i-pay'}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="text-base">Login to Purchase</span>
            </div>
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Create an account to purchase this report
          </p>
        </div>
      ) : (effectiveTier === 'elite' || effectiveTier === 'Elite') ? (
        <>
          <Button
            onClick={handleFreeDownload}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-base">Generating PDF...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                <span className="text-base">Download Free Report</span>
              </div>
            )}
          </Button>

          <div className="text-center mt-3">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-2 py-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-800">Elite member benefit</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <Button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-base">Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                <span className="text-base">Get Professional Report</span>
              </div>
            )}
          </Button>

          <div className="text-center mt-3">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-2 py-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-blue-800">Secure payment via Stripe</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 