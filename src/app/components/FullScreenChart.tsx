'use client';

import { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FullScreenChartProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  showFullScreenButton?: boolean;
}

export default function FullScreenChart({
  children,
  title,
  subtitle,
  className = "",
  showFullScreenButton = true
}: FullScreenChartProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
  };

  return (
    <>
      {/* Regular Chart Container */}
      <div className={`relative ${className}`}>
        {/* Full Screen Button */}
        {showFullScreenButton && (
          <button
            onClick={toggleFullScreen}
            className="absolute top-2 right-2 z-10 p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md group backdrop-blur-sm"
            title="Open in full screen"
            aria-label="Open chart in full screen"
          >
            <Maximize2 className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
          </button>
        )}

        {/* Chart Content */}
        {children}
      </div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeFullScreen}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[95vh] overflow-hidden border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex-1">
                  {title && (
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
                  )}
                  {subtitle && (
                    <p className="text-gray-600 text-lg">{subtitle}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Minimize Button */}
                  <button
                    onClick={toggleFullScreen}
                    className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-sm"
                    title="Exit full screen"
                    aria-label="Exit full screen"
                  >
                    <Minimize2 className="w-6 h-6 text-gray-600" />
                  </button>

                  {/* Close Button */}
                  <button
                    onClick={closeFullScreen}
                    className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-sm"
                    title="Close"
                    aria-label="Close chart"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Chart Content - Full Width */}
              <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-white">
                <div className="w-full h-full min-h-[600px] flex items-center justify-center">
                  {/* Chart content uses full width without extra padding */}
                  <div className="w-full h-full">
                    {children}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 