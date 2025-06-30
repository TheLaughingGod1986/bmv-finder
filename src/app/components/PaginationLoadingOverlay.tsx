'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaginationLoadingOverlayProps {
  isLoading: boolean;
  direction?: 'next' | 'previous';
  className?: string;
}

const PaginationLoadingOverlay: React.FC<PaginationLoadingOverlayProps> = ({
  isLoading,
  direction = 'next',
  className
}) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center",
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-sm mx-4"
          >
            <div className="flex flex-col items-center gap-4">
              {/* Loading Animation */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <Loader2 className="h-8 w-8 text-blue-600" />
              </motion.div>

              {/* Direction Indicator */}
              <div className="flex items-center gap-2 text-gray-600">
                {direction === 'previous' ? (
                  <>
                    <ArrowLeft className="h-4 w-4" />
                    <span>Loading previous page...</span>
                  </>
                ) : (
                  <>
                    <span>Loading next page...</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </div>

              {/* Progress Dots */}
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-blue-600 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>

              {/* Message */}
              <p className="text-sm text-gray-500 text-center">
                Fetching property data from Land Registry...
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaginationLoadingOverlay; 