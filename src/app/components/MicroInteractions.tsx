'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

interface MicroInteractionsProps {
  className?: string;
}

export default function MicroInteractions({ className = '' }: MicroInteractionsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [clickedButton, setClickedButton] = useState<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleButtonClick = (buttonId: string) => {
    setClickedButton(buttonId);
    setTimeout(() => setClickedButton(null), 200);
  };

  const simulateLoading = () => {
    setLoadingState('loading');
    setTimeout(() => setLoadingState('success'), 2000);
    setTimeout(() => setLoadingState('idle'), 4000);
  };

  const simulateError = () => {
    setLoadingState('loading');
    setTimeout(() => setLoadingState('error'), 2000);
    setTimeout(() => setLoadingState('idle'), 4000);
  };

  const cards = [
    { id: 1, title: 'Hover Effect', description: 'Try hovering over this card' },
    { id: 2, title: 'Click Animation', description: 'Click to see the animation' },
    { id: 3, title: 'Smooth Transition', description: 'Notice the smooth transitions' }
  ];

  return (
    <motion.div 
      className={`bg-white rounded-lg shadow-lg p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-bold text-[#2C6E91] mb-6">Microinteractions Demo</h2>
      
      {/* Loading States */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[#2C6E91] mb-4">Loading States</h3>
        <div className="flex gap-4 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={simulateLoading}
            className="px-4 py-2 bg-[#3A7CA5] text-white rounded-lg font-medium"
          >
            Simulate Success
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={simulateError}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium"
          >
            Simulate Error
          </motion.button>
        </div>
        
        <div className="mt-4 p-4 border rounded-lg">
          <AnimatePresence mode="wait">
            {loadingState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[#3B755D]"
              >
                Click a button to see loading states
              </motion.div>
            )}
            
            {loadingState === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[#3A7CA5]"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </motion.div>
            )}
            
            {loadingState === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 text-green-600"
              >
                <CheckCircle className="w-4 h-4" />
                Success! Operation completed.
              </motion.div>
            )}
            
            {loadingState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 text-red-600"
              >
                <XCircle className="w-4 h-4" />
                Error occurred. Please try again.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Interactive Cards */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[#2C6E91] mb-4">Interactive Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
              }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoveredCard(card.id)}
              onHoverEnd={() => setHoveredCard(null)}
              onClick={() => handleButtonClick(`card-${card.id}`)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                hoveredCard === card.id ? 'border-[#3A7CA5] bg-[#F5F5DC]' : 'border-[#E5E5E5] bg-white'
              }`}
            >
              <motion.div
                animate={{ 
                  rotate: clickedButton === `card-${card.id}` ? [0, -10, 10, 0] : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <h4 className="font-semibold text-[#2C6E91] mb-2">{card.title}</h4>
                <p className="text-sm text-[#3B755D]">{card.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Animated Buttons */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[#2C6E91] mb-4">Animated Buttons</h3>
        <div className="flex gap-4 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: '#2C6E91' }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-[#3A7CA5] text-white rounded-lg font-medium transition-colors"
          >
            Hover & Click
          </motion.button>
          
          <motion.button
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 5px 15px rgba(93, 162, 113, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-[#5DA271] text-white rounded-lg font-medium"
          >
            Glow Effect
          </motion.button>
          
          <motion.button
            whileHover={{ 
              scale: 1.05,
              rotate: 5
            }}
            whileTap={{ scale: 0.95, rotate: -5 }}
            className="px-6 py-3 bg-[#D4AF37] text-white rounded-lg font-medium"
          >
            Rotate on Hover
          </motion.button>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[#2C6E91] mb-4">Progress Indicators</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-[#3B755D] mb-2">
              <span>Loading Progress</span>
              <span>75%</span>
            </div>
            <div className="w-full bg-[#E5E5E5] rounded-full h-2">
              <motion.div
                className="bg-[#3A7CA5] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm text-[#3B755D] mb-2">
              <span>Upload Progress</span>
              <span>45%</span>
            </div>
            <div className="w-full bg-[#E5E5E5] rounded-full h-2">
              <motion.div
                className="bg-[#5DA271] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "45%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Badge */}
      <div>
        <h3 className="text-lg font-semibold text-[#2C6E91] mb-4">Notification Badge</h3>
        <div className="relative inline-block">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-[#3A7CA5] text-white rounded-lg font-medium"
          >
            Notifications
          </motion.button>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 500,
              damping: 30,
              delay: 0.5
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
          >
            3
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
} 