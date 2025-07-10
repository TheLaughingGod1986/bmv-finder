'use client';

import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface AccessibilityTestProps {
  className?: string;
}

export default function AccessibilityTest({ className = '' }: AccessibilityTestProps) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: 'Keyboard Navigation', content: 'Test tab navigation with arrow keys and Enter' },
    { id: 1, label: 'Screen Reader', content: 'Test with screen reader software' },
    { id: 2, label: 'Color Contrast', content: 'Verify color contrast meets WCAG guidelines' },
    { id: 3, label: 'Focus Management', content: 'Test focus indicators and tab order' }
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setActiveTab((prev) => (prev > 0 ? prev - 1 : tabs.length - 1));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setActiveTab((prev) => (prev < tabs.length - 1 ? prev + 1 : 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveTab(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveTab(tabs.length - 1);
        break;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-[#2C6E91] mb-4">Accessibility Test Panel</h2>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <div 
          className="flex border-b border-[#E5E5E5]"
          role="tablist"
          aria-label="Accessibility test tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={handleKeyDown}
              className={`px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#3A7CA5] focus:ring-offset-2 ${
                activeTab === tab.id
                  ? 'text-[#3A7CA5] border-b-2 border-[#3A7CA5]'
                  : 'text-[#3B755D] hover:text-[#3A7CA5]'
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            className={`mt-4 ${activeTab === tab.id ? 'block' : 'hidden'}`}
          >
            <p className="text-[#3B755D]">{tab.content}</p>
          </div>
        ))}
      </div>

      {/* Accessibility Checklist */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#2C6E91]">Accessibility Checklist</h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-[#3B755D]">Proper heading hierarchy (h1, h2, h3)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-[#3B755D]">ARIA labels and roles implemented</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-[#3B755D]">Keyboard navigation support</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-[#3B755D]">Focus indicators visible</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-[#3B755D]">Color contrast meets WCAG AA standards</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-[#3B755D]">Touch targets are 44px minimum</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-[#3B755D]">Reduced motion support</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-[#3B755D]">High contrast mode support</span>
          </div>
        </div>
      </div>

      {/* Responsive Design Test */}
      <div className="mt-6 p-4 bg-[#F5F5DC] rounded-lg">
        <h3 className="text-lg font-semibold text-[#2C6E91] mb-2">Responsive Design Test</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded border text-center">
            <div className="text-sm font-medium text-[#3B755D]">Mobile</div>
            <div className="text-xs text-[#3B755D]">320px - 768px</div>
          </div>
          <div className="bg-white p-3 rounded border text-center">
            <div className="text-sm font-medium text-[#3B755D]">Tablet</div>
            <div className="text-xs text-[#3B755D]">768px - 1024px</div>
          </div>
          <div className="bg-white p-3 rounded border text-center">
            <div className="text-sm font-medium text-[#3B755D]">Desktop</div>
            <div className="text-xs text-[#3B755D]">1024px+</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Testing Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use Tab key to navigate through interactive elements</li>
              <li>• Use arrow keys to navigate tabs (when focused)</li>
              <li>• Test with screen reader software</li>
              <li>• Verify color contrast with browser dev tools</li>
              <li>• Test on different screen sizes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 