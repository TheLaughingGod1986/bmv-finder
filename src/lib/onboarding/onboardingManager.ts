'use client';

import { useState, useEffect, useRef } from 'react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'scroll' | 'wait' | 'input' | 'navigate';
  actionTarget?: string;
  actionValue?: string;
  skipable?: boolean;
  required?: boolean;
  delay?: number;
  beforeStep?: () => void | Promise<void>;
  afterStep?: () => void | Promise<void>;
}

interface OnboardingTour {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  category: 'getting-started' | 'features' | 'advanced' | 'custom';
  estimatedTime: number; // in minutes
  prerequisites?: string[];
  completionReward?: string;
}

interface OnboardingProgress {
  completedTours: string[];
  completedSteps: Record<string, string[]>; // tourId -> stepIds
  currentTour?: string;
  currentStep?: number;
  totalTimeSpent: number;
  lastCompleted?: Date;
  preferences: {
    autoStart: boolean;
    showHints: boolean;
    skipAnimations: boolean;
    voiceGuidance: boolean;
  };
}

class OnboardingManager {
  private tours: Map<string, OnboardingTour> = new Map();
  private currentTour: OnboardingTour | null = null;
  private currentStepIndex: number = 0;
  private progress: OnboardingProgress;
  private isActive: boolean = false;
  private overlay: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;
  private highlight: HTMLElement | null = null;
  private observers: Map<string, IntersectionObserver> = new Map();
  private eventListeners: Map<string, () => void> = new Map();

  constructor() {
    this.progress = this.loadProgress();
    this.initializeTours();
    this.setupEventListeners();
  }

  private loadProgress(): OnboardingProgress {
    if (typeof window === 'undefined') {
      return {
        completedTours: [],
        completedSteps: {},
        totalTimeSpent: 0,
        preferences: {
          autoStart: true,
          showHints: true,
          skipAnimations: false,
          voiceGuidance: false,
        },
      };
    }

    const saved = localStorage.getItem('onboarding-progress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to default
      }
    }

    return {
      completedTours: [],
      completedSteps: {},
      totalTimeSpent: 0,
      preferences: {
        autoStart: true,
        showHints: true,
        skipAnimations: false,
        voiceGuidance: false,
      },
    };
  }

  private saveProgress(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('onboarding-progress', JSON.stringify(this.progress));
  }

  private initializeTours(): void {
    // Getting Started Tour
    this.addTour({
      id: 'getting-started',
      name: 'Welcome to BMV Finder',
      description: 'Learn the basics of finding below market value properties',
      category: 'getting-started',
      estimatedTime: 5,
      steps: [
        {
          id: 'welcome',
          title: 'Welcome! 👋',
          description: 'Welcome to BMV Finder, your comprehensive property investment platform. Let\'s take a quick tour to get you started.',
          target: 'body',
          position: 'center',
          action: 'wait',
          skipable: true,
        },
        {
          id: 'search-intro',
          title: 'Property Search 🔍',
          description: 'Start by searching for properties using our powerful search engine. You can search by postcode, area, or property type.',
          target: '[data-tour="search-form"]',
          position: 'bottom',
          action: 'scroll',
          skipable: true,
        },
        {
          id: 'search-demo',
          title: 'Try the Search',
          description: 'Enter a postcode like "SW1A 1AA" to see how our search works. This will show you properties in that area.',
          target: '[data-tour="search-input"]',
          position: 'bottom',
          action: 'input',
          actionTarget: '[data-tour="search-input"]',
          actionValue: 'SW1A 1AA',
          skipable: true,
        },
        {
          id: 'results-overview',
          title: 'Search Results 📊',
          description: 'Here you\'ll see property results with key information like price, BMV score, and investment potential.',
          target: '[data-tour="search-results"]',
          position: 'top',
          action: 'wait',
          skipable: true,
        },
        {
          id: 'bmv-score',
          title: 'BMV Score 🎯',
          description: 'The BMV (Below Market Value) score helps you identify the best investment opportunities. Higher scores mean better deals.',
          target: '[data-tour="bmv-score"]',
          position: 'left',
          action: 'wait',
          skipable: true,
        },
        {
          id: 'portfolio-intro',
          title: 'Portfolio Management 💼',
          description: 'Track your property investments and analyze performance with our portfolio tools.',
          target: '[data-tour="portfolio-link"]',
          position: 'bottom',
          action: 'navigate',
          actionTarget: '/tools/portfolio',
          skipable: true,
        },
        {
          id: 'completion',
          title: 'You\'re All Set! 🎉',
          description: 'You\'ve completed the getting started tour! Explore more features or start searching for your next investment.',
          target: 'body',
          position: 'center',
          action: 'wait',
          skipable: true,
        },
      ],
    });

    // Features Tour
    this.addTour({
      id: 'features',
      name: 'Advanced Features',
      description: 'Discover powerful features for property analysis and investment',
      category: 'features',
      estimatedTime: 8,
      prerequisites: ['getting-started'],
      steps: [
        {
          id: 'market-analysis',
          title: 'Market Analysis 📈',
          description: 'Get detailed market insights including HPI data, price trends, and local market conditions.',
          target: '[data-tour="market-analysis"]',
          position: 'bottom',
          action: 'navigate',
          actionTarget: '/market/analysis',
          skipable: true,
        },
        {
          id: 'valuation-tools',
          title: 'Property Valuation 💰',
          description: 'Use our advanced valuation tools to get accurate property estimates and investment analysis.',
          target: '[data-tour="valuation-tools"]',
          position: 'bottom',
          action: 'navigate',
          actionTarget: '/analysis/valuation',
          skipable: true,
        },
        {
          id: 'portfolio-analytics',
          title: 'Portfolio Analytics 📊',
          description: 'Analyze your portfolio performance with detailed analytics, risk assessment, and benchmarking.',
          target: '[data-tour="portfolio-analytics"]',
          position: 'bottom',
          action: 'navigate',
          actionTarget: '/tools/portfolio/analytics',
          skipable: true,
        },
        {
          id: 'watchlist',
          title: 'Watchlist ⭐',
          description: 'Save properties you\'re interested in and track their performance over time.',
          target: '[data-tour="watchlist"]',
          position: 'bottom',
          action: 'navigate',
          actionTarget: '/watchlist',
          skipable: true,
        },
        {
          id: 'chrome-extension',
          title: 'Chrome Extension 🔌',
          description: 'Install our Chrome extension to capture properties directly from Rightmove, Zoopla, and other sites.',
          target: '[data-tour="chrome-extension"]',
          position: 'bottom',
          action: 'navigate',
          actionTarget: '/extension-welcome',
          skipable: true,
        },
      ],
    });

    // Advanced Tour
    this.addTour({
      id: 'advanced',
      name: 'Power User Features',
      description: 'Master advanced features for professional property investors',
      category: 'advanced',
      estimatedTime: 10,
      prerequisites: ['getting-started', 'features'],
      steps: [
        {
          id: 'deal-analysis',
          title: 'Deal Analysis 🧮',
          description: 'Perform comprehensive deal analysis with cash flow projections and ROI calculations.',
          target: '[data-tour="deal-analysis"]',
          position: 'bottom',
          action: 'navigate',
          actionTarget: '/analysis/deal-analysis',
          skipable: true,
        },
        {
          id: 'performance-monitoring',
          title: 'Performance Monitoring 📈',
          description: 'Monitor system performance and optimize your workflow with our performance dashboard.',
          target: '[data-tour="performance-monitoring"]',
          position: 'bottom',
          action: 'navigate',
          actionTarget: '/tools/performance',
          skipable: true,
        },
        {
          id: 'accessibility-features',
          title: 'Accessibility Features ♿',
          description: 'Customize accessibility settings to match your needs and preferences.',
          target: '[data-tour="accessibility-features"]',
          position: 'bottom',
          action: 'navigate',
          actionTarget: '/tools/accessibility',
          skipable: true,
        },
        {
          id: 'api-integrations',
          title: 'API Integrations 🔗',
          description: 'Connect with external services and automate your property research workflow.',
          target: '[data-tour="api-integrations"]',
          position: 'bottom',
          action: 'navigate',
          actionTarget: '/admin',
          skipable: true,
        },
      ],
    });
  }

  private setupEventListeners(): void {
    // Listen for page changes to update tour context
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePageChange.bind(this));
      window.addEventListener('beforeunload', this.cleanup.bind(this));
    }
  }

  private handlePageChange(): void {
    if (this.isActive && this.currentTour) {
      this.updateTourContext();
    }
  }

  private updateTourContext(): void {
    if (!this.currentTour) return;

    const currentStep = this.currentTour.steps[this.currentStepIndex];
    if (currentStep) {
      this.highlightElement(currentStep.target);
    }
  }

  private cleanup(): void {
    this.removeOverlay();
    this.removeTooltip();
    this.removeHighlight();
    this.cleanupObservers();
    this.cleanupEventListeners();
  }

  private cleanupObservers(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  private cleanupEventListeners(): void {
    this.eventListeners.forEach(cleanup => cleanup());
    this.eventListeners.clear();
  }

  // Public Methods
  addTour(tour: OnboardingTour): void {
    this.tours.set(tour.id, tour);
  }

  getTours(): OnboardingTour[] {
    return Array.from(this.tours.values());
  }

  getTour(id: string): OnboardingTour | undefined {
    return this.tours.get(id);
  }

  getProgress(): OnboardingProgress {
    return { ...this.progress };
  }

  updatePreferences(preferences: Partial<OnboardingProgress['preferences']>): void {
    this.progress.preferences = { ...this.progress.preferences, ...preferences };
    this.saveProgress();
  }

  startTour(tourId: string): boolean {
    const tour = this.tours.get(tourId);
    if (!tour) return false;

    // Check prerequisites
    if (tour.prerequisites) {
      const missingPrereqs = tour.prerequisites.filter(prereq => 
        !this.progress.completedTours.includes(prereq)
      );
      if (missingPrereqs.length > 0) {
        console.warn(`Missing prerequisites: ${missingPrereqs.join(', ')}`);
        return false;
      }
    }

    this.currentTour = tour;
    this.currentStepIndex = 0;
    this.isActive = true;
    this.progress.currentTour = tourId;
    this.progress.currentStep = 0;

    this.createOverlay();
    this.showStep(0);

    return true;
  }

  nextStep(): boolean {
    if (!this.currentTour || this.currentStepIndex >= this.currentTour.steps.length - 1) {
      this.completeTour();
      return false;
    }

    this.currentStepIndex++;
    this.progress.currentStep = this.currentStepIndex;
    this.showStep(this.currentStepIndex);
    return true;
  }

  previousStep(): boolean {
    if (!this.currentTour || this.currentStepIndex <= 0) return false;

    this.currentStepIndex--;
    this.progress.currentStep = this.currentStepIndex;
    this.showStep(this.currentStepIndex);
    return true;
  }

  skipStep(): void {
    if (!this.currentTour) return;

    const currentStep = this.currentTour.steps[this.currentStepIndex];
    if (currentStep.skipable) {
      this.nextStep();
    }
  }

  skipTour(): void {
    if (!this.currentTour) return;

    this.completeTour();
  }

  private async showStep(stepIndex: number): Promise<void> {
    if (!this.currentTour) return;

    const step = this.currentTour.steps[stepIndex];
    if (!step) return;

    // Execute before step action
    if (step.beforeStep) {
      await step.beforeStep();
    }

    // Wait for delay if specified
    if (step.delay) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }

    // Execute step action
    await this.executeStepAction(step);

    // Highlight target element
    this.highlightElement(step.target);

    // Show tooltip
    this.showTooltip(step);

    // Mark step as completed
    this.markStepCompleted(this.currentTour.id, step.id);
  }

  private async executeStepAction(step: OnboardingStep): Promise<void> {
    switch (step.action) {
      case 'scroll':
        if (step.target) {
          const element = document.querySelector(step.target);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        break;

      case 'click':
        if (step.actionTarget) {
          const element = document.querySelector(step.actionTarget) as HTMLElement;
          if (element) {
            element.click();
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
        break;

      case 'input':
        if (step.actionTarget && step.actionValue) {
          const element = document.querySelector(step.actionTarget) as HTMLInputElement;
          if (element) {
            element.focus();
            element.value = step.actionValue;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
        break;

      case 'navigate':
        if (step.actionTarget) {
          window.location.href = step.actionTarget;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        break;

      case 'wait':
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
    }
  }

  private highlightElement(selector: string): void {
    this.removeHighlight();

    const element = document.querySelector(selector);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    this.highlight = document.createElement('div');
    this.highlight.className = 'onboarding-highlight';
    this.highlight.style.cssText = `
      position: absolute;
      top: ${rect.top + scrollTop}px;
      left: ${rect.left + scrollLeft}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 3px solid #3A7CA5;
      border-radius: 8px;
      background: rgba(58, 124, 165, 0.1);
      pointer-events: none;
      z-index: 9998;
      transition: all 0.3s ease;
      box-shadow: 0 0 0 4px rgba(58, 124, 165, 0.2);
    `;

    document.body.appendChild(this.highlight);

    // Add pulsing animation
    this.highlight.style.animation = 'onboarding-pulse 2s infinite';
  }

  private showTooltip(step: OnboardingStep): void {
    this.removeTooltip();

    const element = document.querySelector(step.target);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'onboarding-tooltip';
    this.tooltip.innerHTML = `
      <div class="onboarding-tooltip-content">
        <div class="onboarding-tooltip-header">
          <h3>${step.title}</h3>
          ${step.skipable ? '<button class="onboarding-skip-btn" data-action="skip">Skip</button>' : ''}
        </div>
        <p>${step.description}</p>
        <div class="onboarding-tooltip-footer">
          <div class="onboarding-progress">
            Step ${this.currentStepIndex + 1} of ${this.currentTour!.steps.length}
          </div>
          <div class="onboarding-actions">
            ${this.currentStepIndex > 0 ? '<button class="onboarding-btn onboarding-btn-secondary" data-action="prev">Previous</button>' : ''}
            <button class="onboarding-btn onboarding-btn-primary" data-action="next">
              ${this.currentStepIndex === this.currentTour!.steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    `;

    // Position tooltip
    const tooltipRect = this.calculateTooltipPosition(rect, step.position);
    this.tooltip.style.cssText = `
      position: absolute;
      top: ${tooltipRect.top + scrollTop}px;
      left: ${tooltipRect.left + scrollLeft}px;
      z-index: 9999;
      max-width: 400px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      border: 1px solid #e5e7eb;
    `;

    document.body.appendChild(this.tooltip);

    // Add event listeners
    this.tooltip.addEventListener('click', this.handleTooltipClick.bind(this));

    // Add CSS styles
    this.addTooltipStyles();
  }

  private calculateTooltipPosition(elementRect: DOMRect, position: string): { top: number; left: number } {
    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const margin = 20;

    switch (position) {
      case 'top':
        return {
          top: elementRect.top - tooltipHeight - margin,
          left: elementRect.left + (elementRect.width - tooltipWidth) / 2,
        };
      case 'bottom':
        return {
          top: elementRect.bottom + margin,
          left: elementRect.left + (elementRect.width - tooltipWidth) / 2,
        };
      case 'left':
        return {
          top: elementRect.top + (elementRect.height - tooltipHeight) / 2,
          left: elementRect.left - tooltipWidth - margin,
        };
      case 'right':
        return {
          top: elementRect.top + (elementRect.height - tooltipHeight) / 2,
          left: elementRect.right + margin,
        };
      case 'center':
        return {
          top: (window.innerHeight - tooltipHeight) / 2,
          left: (window.innerWidth - tooltipWidth) / 2,
        };
      default:
        return {
          top: elementRect.bottom + margin,
          left: elementRect.left + (elementRect.width - tooltipWidth) / 2,
        };
    }
  }

  private handleTooltipClick(e: Event): void {
    const target = e.target as HTMLElement;
    const action = target.getAttribute('data-action');

    switch (action) {
      case 'next':
        this.nextStep();
        break;
      case 'prev':
        this.previousStep();
        break;
      case 'skip':
        this.skipStep();
        break;
    }
  }

  private createOverlay(): void {
    this.removeOverlay();

    this.overlay = document.createElement('div');
    this.overlay.className = 'onboarding-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9997;
      pointer-events: none;
    `;

    document.body.appendChild(this.overlay);
  }

  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private removeTooltip(): void {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  private removeHighlight(): void {
    if (this.highlight) {
      this.highlight.remove();
      this.highlight = null;
    }
  }

  private markStepCompleted(tourId: string, stepId: string): void {
    if (!this.progress.completedSteps[tourId]) {
      this.progress.completedSteps[tourId] = [];
    }
    if (!this.progress.completedSteps[tourId].includes(stepId)) {
      this.progress.completedSteps[tourId].push(stepId);
    }
    this.saveProgress();
  }

  private completeTour(): void {
    if (!this.currentTour) return;

    // Mark tour as completed
    if (!this.progress.completedTours.includes(this.currentTour.id)) {
      this.progress.completedTours.push(this.currentTour.id);
    }

    // Update progress
    this.progress.currentTour = undefined;
    this.progress.currentStep = undefined;
    this.progress.lastCompleted = new Date();

    this.saveProgress();

    // Cleanup
    this.cleanup();
    this.isActive = false;
    this.currentTour = null;
    this.currentStepIndex = 0;

    // Show completion message
    this.showCompletionMessage();
  }

  private showCompletionMessage(): void {
    const message = document.createElement('div');
    message.className = 'onboarding-completion';
    message.innerHTML = `
      <div class="onboarding-completion-content">
        <h3>🎉 Tour Completed!</h3>
        <p>Great job! You've completed the tour. Ready to explore more features?</p>
        <div class="onboarding-completion-actions">
          <button class="onboarding-btn onboarding-btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
            Continue Exploring
          </button>
        </div>
      </div>
    `;
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      border: 1px solid #e5e7eb;
    `;

    document.body.appendChild(message);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (message.parentElement) {
        message.remove();
      }
    }, 5000);
  }

  private addTooltipStyles(): void {
    if (document.getElementById('onboarding-styles')) return;

    const style = document.createElement('style');
    style.id = 'onboarding-styles';
    style.textContent = `
      .onboarding-tooltip-content {
        padding: 20px;
      }
      
      .onboarding-tooltip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .onboarding-tooltip-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .onboarding-skip-btn {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        font-size: 14px;
        text-decoration: underline;
      }
      
      .onboarding-tooltip p {
        margin: 0 0 16px 0;
        color: #4b5563;
        line-height: 1.5;
      }
      
      .onboarding-tooltip-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .onboarding-progress {
        font-size: 14px;
        color: #6b7280;
      }
      
      .onboarding-actions {
        display: flex;
        gap: 8px;
      }
      
      .onboarding-btn {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }
      
      .onboarding-btn-primary {
        background: #3A7CA5;
        color: white;
      }
      
      .onboarding-btn-primary:hover {
        background: #2C6E91;
      }
      
      .onboarding-btn-secondary {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
      }
      
      .onboarding-btn-secondary:hover {
        background: #e5e7eb;
      }
      
      .onboarding-completion-content {
        text-align: center;
      }
      
      .onboarding-completion-content h3 {
        margin: 0 0 12px 0;
        color: #1f2937;
      }
      
      .onboarding-completion-content p {
        margin: 0 0 20px 0;
        color: #4b5563;
      }
      
      .onboarding-completion-actions {
        display: flex;
        justify-content: center;
      }
      
      @keyframes onboarding-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
  }

  // Utility Methods
  isTourCompleted(tourId: string): boolean {
    return this.progress.completedTours.includes(tourId);
  }

  getCompletedSteps(tourId: string): string[] {
    return this.progress.completedSteps[tourId] || [];
  }

  getTourProgress(tourId: string): number {
    const tour = this.tours.get(tourId);
    if (!tour) return 0;
    
    const completedSteps = this.getCompletedSteps(tourId);
    return (completedSteps.length / tour.steps.length) * 100;
  }

  resetProgress(): void {
    this.progress = {
      completedTours: [],
      completedSteps: {},
      totalTimeSpent: 0,
      preferences: {
        autoStart: true,
        showHints: true,
        skipAnimations: false,
        voiceGuidance: false,
      },
    };
    this.saveProgress();
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getCurrentTour(): OnboardingTour | null {
    return this.currentTour;
  }

  getCurrentStep(): number {
    return this.currentStepIndex;
  }
}

// Global onboarding manager instance
export const onboardingManager = new OnboardingManager();

// React hook for onboarding
export function useOnboarding() {
  const [isActive, setIsActive] = useState(onboardingManager.getIsActive());
  const [currentTour, setCurrentTour] = useState(onboardingManager.getCurrentTour());
  const [currentStep, setCurrentStep] = useState(onboardingManager.getCurrentStep());
  const [progress, setProgress] = useState(onboardingManager.getProgress());

  useEffect(() => {
    const updateState = () => {
      setIsActive(onboardingManager.getIsActive());
      setCurrentTour(onboardingManager.getCurrentTour());
      setCurrentStep(onboardingManager.getCurrentStep());
      setProgress(onboardingManager.getProgress());
    };

    // Listen for onboarding events
    window.addEventListener('onboarding-updated', updateState);
    
    return () => {
      window.removeEventListener('onboarding-updated', updateState);
    };
  }, []);

  const startTour = (tourId: string) => {
    const success = onboardingManager.startTour(tourId);
    if (success) {
      window.dispatchEvent(new CustomEvent('onboarding-updated'));
    }
    return success;
  };

  const nextStep = () => {
    const success = onboardingManager.nextStep();
    if (success) {
      window.dispatchEvent(new CustomEvent('onboarding-updated'));
    }
    return success;
  };

  const previousStep = () => {
    const success = onboardingManager.previousStep();
    if (success) {
      window.dispatchEvent(new CustomEvent('onboarding-updated'));
    }
    return success;
  };

  const skipStep = () => {
    onboardingManager.skipStep();
    window.dispatchEvent(new CustomEvent('onboarding-updated'));
  };

  const skipTour = () => {
    onboardingManager.skipTour();
    window.dispatchEvent(new CustomEvent('onboarding-updated'));
  };

  const updatePreferences = (preferences: Partial<OnboardingProgress['preferences']>) => {
    onboardingManager.updatePreferences(preferences);
    setProgress(onboardingManager.getProgress());
  };

  return {
    isActive,
    currentTour,
    currentStep,
    progress,
    tours: onboardingManager.getTours(),
    startTour,
    nextStep,
    previousStep,
    skipStep,
    skipTour,
    updatePreferences,
    isTourCompleted: onboardingManager.isTourCompleted.bind(onboardingManager),
    getTourProgress: onboardingManager.getTourProgress.bind(onboardingManager),
    resetProgress: onboardingManager.resetProgress.bind(onboardingManager),
  };
}
