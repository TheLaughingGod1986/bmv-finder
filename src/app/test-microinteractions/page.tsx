"use client";

import React from 'react';
import { ResponsiveHeader, MicroInteractions, Button, SearchInput, PricingCard, FeatureCard } from '../components/ui';
import { Section } from '../components/ui';
import { motion } from 'framer-motion';

export default function TestMicrointeractionsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      <ResponsiveHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Section>
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-[#2C6E91] mb-4">
              Microinteractions & Polish
            </h1>
            <p className="text-lg text-[#3B755D] max-w-2xl mx-auto">
              Experience the refined interactions, smooth animations, and delightful microinteractions 
              that enhance the user experience throughout the application.
            </p>
          </motion.div>
        </Section>

        <Section>
          <MicroInteractions className="mb-12" />
        </Section>

        <Section>
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Enhanced Search Demo */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#2C6E91] mb-4">Enhanced Search</h2>
              <SearchInput
                onSearch={(query) => console.log('Search:', query)}
                placeholder="Try typing a postcode..."
                className="mb-4"
              />
              <p className="text-sm text-[#3B755D]">
                Notice the smooth hover effects, focus states, and loading animations.
              </p>
            </div>

            {/* Animated Buttons Demo */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#2C6E91] mb-4">Animated Buttons</h2>
              <div className="space-y-4">
                <Button 
                  variant="primary" 
                  onClick={() => alert('Primary button with microinteractions!')}
                  className="w-full"
                >
                  Primary Action
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={() => alert('Secondary button with microinteractions!')}
                  className="w-full"
                >
                  Secondary Action
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => alert('Outline button with microinteractions!')}
                  className="w-full"
                >
                  Outline Action
                </Button>
              </div>
            </div>
          </motion.div>
        </Section>

        <Section>
          <motion.div 
            className="bg-white rounded-lg shadow-lg p-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-[#2C6E91] mb-6">Interactive Pricing Cards</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <PricingCard
                title="Free Plan"
                price="£0"
                features={[
                  "✓ Basic property search",
                  "✓ Limited results",
                  "✓ Email support"
                ]}
                ctaText="Get Started"
                ctaOnClick={() => alert('Free plan selected with smooth animations!')}
                aria-label="Free plan pricing card"
              />
              
              <PricingCard
                title="Pro Plan"
                price="£9.99"
                features={[
                  "✓ Unlimited searches",
                  "✓ Detailed reports",
                  "✓ Priority support",
                  "✓ Export data"
                ]}
                ctaText="Upgrade to Pro"
                ctaOnClick={() => alert('Pro plan selected with smooth animations!')}
                isPopular={true}
                aria-label="Pro plan pricing card"
              />
              
              <PricingCard
                title="Elite Plan"
                price="£19.99"
                features={[
                  "✓ Everything in Pro",
                  "✓ API access",
                  "✓ Custom reports",
                  "✓ Dedicated support"
                ]}
                ctaText="Upgrade to Elite"
                ctaOnClick={() => alert('Elite plan selected with smooth animations!')}
                aria-label="Elite plan pricing card"
              />
            </div>
            
            <p className="text-sm text-[#3B755D] mt-4 text-center">
              Hover over the cards to see the smooth scale and shadow animations.
            </p>
          </motion.div>
        </Section>

        <Section>
          <motion.div 
            className="bg-white rounded-lg shadow-lg p-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-[#2C6E91] mb-6">Feature Cards with Animations</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon="🚀"
                title="Smooth Animations"
                description="Every interaction is smooth and delightful with carefully crafted animations."
              />
              <FeatureCard
                icon="✨"
                title="Microinteractions"
                description="Subtle feedback that makes the interface feel alive and responsive."
              />
              <FeatureCard
                icon="🎯"
                title="Performance Optimized"
                description="All animations are optimized for 60fps performance across devices."
              />
            </div>
          </motion.div>
        </Section>

        <Section>
          <motion.div 
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-2xl font-bold text-[#2C6E91] mb-4">Loading States & Feedback</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#2C6E91]">Interactive Elements</h3>
                <div className="space-y-2">
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      // Simulate loading
                      const btn = document.getElementById('loading-btn');
                      if (btn) {
                        btn.innerHTML = '<div class="flex items-center gap-2"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Loading...</div>';
                        setTimeout(() => {
                          btn.innerHTML = 'Success!';
                          setTimeout(() => {
                            btn.innerHTML = 'Try Again';
                          }, 2000);
                        }, 2000);
                      }
                    }}
                    id="loading-btn"
                  >
                    Try Again
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const btn = document.getElementById('pulse-btn');
                      if (btn) {
                        btn.classList.add('animate-pulse');
                        setTimeout(() => {
                          btn.classList.remove('animate-pulse');
                        }, 1000);
                      }
                    }}
                    id="pulse-btn"
                  >
                    Pulse Animation
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-[#2C6E91] mb-4">Progress Indicators</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-[#3B755D] mb-2">
                      <span>Data Loading</span>
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
                      <span>Processing</span>
                      <span>45%</span>
                    </div>
                    <div className="w-full bg-[#E5E5E5] rounded-full h-2">
                      <motion.div
                        className="bg-[#5DA271] h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "45%" }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Section>
      </main>
    </div>
  );
} 