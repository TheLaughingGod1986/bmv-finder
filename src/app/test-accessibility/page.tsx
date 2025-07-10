"use client";

import React from 'react';
import { ResponsiveHeader, AccessibilityTest, Button, SearchInput, PricingCard } from '../components/ui';
import { Section } from '../components/ui';

export default function TestAccessibilityPage() {
  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      <ResponsiveHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Section>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#2C6E91] mb-4">
              Accessibility & Responsive Design Test
            </h1>
            <p className="text-lg text-[#3B755D] max-w-2xl mx-auto">
              This page demonstrates all accessibility features and responsive design improvements 
              implemented across the application.
            </p>
          </div>
        </Section>

        <Section>
          <AccessibilityTest className="mb-12" />
        </Section>

        <Section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Interactive Components Test */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#2C6E91] mb-4">Interactive Components</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="test-search" className="block text-sm font-medium text-[#3B755D] mb-2">
                    Search Input Test
                  </label>
                  <SearchInput
                    id="test-search"
                    onSearch={(query) => console.log('Search:', query)}
                    placeholder="Test search functionality"
                    aria-describedby="search-help"
                  />
                  <p id="search-help" className="text-sm text-[#3B755D] mt-1">
                    Type to test search input accessibility
                  </p>
                </div>

                <div className="space-y-2">
                  <Button 
                    variant="primary" 
                    onClick={() => alert('Primary button clicked!')}
                    aria-label="Test primary button"
                  >
                    Primary Button
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    onClick={() => alert('Secondary button clicked!')}
                    aria-label="Test secondary button"
                  >
                    Secondary Button
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => alert('Outline button clicked!')}
                    aria-label="Test outline button"
                  >
                    Outline Button
                  </Button>
                </div>
              </div>
            </div>

            {/* Responsive Design Test */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#2C6E91] mb-4">Responsive Design</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-[#F5F5DC] p-4 rounded text-center">
                    <div className="text-sm font-medium text-[#3B755D]">Mobile</div>
                    <div className="text-xs text-[#3B755D]">Stacked</div>
                  </div>
                  <div className="bg-[#F5F5DC] p-4 rounded text-center">
                    <div className="text-sm font-medium text-[#3B755D]">Tablet</div>
                    <div className="text-xs text-[#3B755D]">2 Columns</div>
                  </div>
                  <div className="bg-[#F5F5DC] p-4 rounded text-center">
                    <div className="text-sm font-medium text-[#3B755D]">Desktop</div>
                    <div className="text-xs text-[#3B755D]">3 Columns</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="primary" className="flex-1">
                      Responsive Button
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Stack on Mobile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
            <h2 className="text-2xl font-bold text-[#2C6E91] mb-4">Pricing Card Accessibility</h2>
            
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
                ctaOnClick={() => alert('Free plan selected')}
                aria-label="Free plan pricing card"
                aria-describedby="free-plan-desc"
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
                ctaOnClick={() => alert('Pro plan selected')}
                isPopular={true}
                aria-label="Pro plan pricing card"
                aria-describedby="pro-plan-desc"
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
                ctaOnClick={() => alert('Elite plan selected')}
                aria-label="Elite plan pricing card"
                aria-describedby="elite-plan-desc"
              />
            </div>
            
            <div className="mt-6 text-sm text-[#3B755D] space-y-1">
              <p id="free-plan-desc">Free plan with basic features for getting started</p>
              <p id="pro-plan-desc">Pro plan with advanced features for regular users</p>
              <p id="elite-plan-desc">Elite plan with all features for power users</p>
            </div>
          </div>
        </Section>

        <Section>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-[#2C6E91] mb-4">Keyboard Navigation Test</h2>
            
            <div className="space-y-4">
              <p className="text-[#3B755D]">
                Use the Tab key to navigate through these elements. Press Enter or Space to activate buttons.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" onClick={() => alert('Button 1')}>
                  Focusable Button 1
                </Button>
                <Button variant="secondary" onClick={() => alert('Button 2')}>
                  Focusable Button 2
                </Button>
                <Button variant="outline" onClick={() => alert('Button 3')}>
                  Focusable Button 3
                </Button>
                <a 
                  href="#" 
                  className="px-4 py-2 bg-[#5DA271] text-white rounded-lg hover:bg-[#3B755D] transition focus:outline-none focus:ring-2 focus:ring-[#5DA271] focus:ring-offset-2"
                  onClick={(e) => { e.preventDefault(); alert('Link clicked'); }}
                >
                  Focusable Link
                </a>
              </div>
              
              <div className="mt-6 p-4 bg-[#F5F5DC] rounded-lg">
                <h3 className="font-semibold text-[#2C6E91] mb-2">Focus Indicators</h3>
                <p className="text-sm text-[#3B755D]">
                  All interactive elements should show a clear focus indicator when navigated with the keyboard.
                  The focus ring should be visible and have sufficient contrast.
                </p>
              </div>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
} 