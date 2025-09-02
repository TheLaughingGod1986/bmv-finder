'use client';

import { useState, useEffect, useRef } from 'react';

interface AccessibilityConfig {
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  enableFocusIndicators: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'light' | 'dark' | 'high-contrast';
}

interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  role?: string;
  label?: string;
}

class AccessibilityManager {
  private config: AccessibilityConfig;
  private focusableElements: FocusableElement[] = [];
  private currentFocusIndex: number = -1;
  private skipLinks: HTMLElement[] = [];
  private landmarks: HTMLElement[] = [];
  private announcements: HTMLElement | null = null;

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = {
      enableHighContrast: false,
      enableReducedMotion: false,
      enableScreenReader: true,
      enableKeyboardNavigation: true,
      enableFocusIndicators: true,
      fontSize: 'medium',
      colorScheme: 'light',
      ...config,
    };

    this.initializeAccessibility();
  }

  private initializeAccessibility(): void {
    if (typeof window === 'undefined') return;

    // Initialize accessibility features
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupFocusManagement();
    this.setupSkipLinks();
    this.setupLandmarks();
    this.setupAnnouncements();
    this.setupHighContrast();
    this.setupReducedMotion();
    this.setupFontSize();
    this.setupColorScheme();

    // Listen for system preferences
    this.setupSystemPreferences();
  }

  // Keyboard Navigation
  private setupKeyboardNavigation(): void {
    if (!this.config.enableKeyboardNavigation) return;

    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Tab':
          this.handleTabNavigation(e);
          break;
        case 'Escape':
          this.handleEscapeKey(e);
          break;
        case 'Enter':
        case ' ':
          this.handleActivationKey(e);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowNavigation(e);
          break;
        case 'Home':
          this.handleHomeKey(e);
          break;
        case 'End':
          this.handleEndKey(e);
          break;
      }
    });
  }

  private handleTabNavigation(e: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);

    if (e.shiftKey) {
      // Shift + Tab - move backwards
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
      focusableElements[prevIndex]?.focus();
    } else {
      // Tab - move forwards
      const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
      focusableElements[nextIndex]?.focus();
    }

    e.preventDefault();
  }

  private handleEscapeKey(e: KeyboardEvent): void {
    // Close modals, dropdowns, etc.
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.getAttribute('aria-expanded') === 'true') {
      activeElement.click();
    }
  }

  private handleActivationKey(e: KeyboardEvent): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && (activeElement.tagName === 'BUTTON' || activeElement.getAttribute('role') === 'button')) {
      e.preventDefault();
      activeElement.click();
    }
  }

  private handleArrowNavigation(e: KeyboardEvent): void {
    const activeElement = document.activeElement as HTMLElement;
    const role = activeElement.getAttribute('role');
    
    if (role === 'menubar' || role === 'tablist') {
      e.preventDefault();
      this.navigateInGroup(activeElement, e.key);
    }
  }

  private handleHomeKey(e: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      e.preventDefault();
      focusableElements[0].focus();
    }
  }

  private handleEndKey(e: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      e.preventDefault();
      focusableElements[focusableElements.length - 1].focus();
    }
  }

  private navigateInGroup(activeElement: HTMLElement, direction: string): void {
    const group = activeElement.closest('[role="menubar"], [role="tablist"]');
    if (!group) return;

    const items = Array.from(group.querySelectorAll('[role="menuitem"], [role="tab"]')) as HTMLElement[];
    const currentIndex = items.indexOf(activeElement);

    let nextIndex = currentIndex;
    switch (direction) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
    }

    items[nextIndex]?.focus();
  }

  // Screen Reader Support
  private setupScreenReaderSupport(): void {
    if (!this.config.enableScreenReader) return;

    // Add screen reader only text
    this.addScreenReaderOnlyStyles();
    
    // Setup live regions for announcements
    this.setupLiveRegions();
    
    // Add ARIA labels to interactive elements
    this.addAriaLabels();
  }

  private addScreenReaderOnlyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      .sr-only-focusable:focus {
        position: static;
        width: auto;
        height: auto;
        padding: inherit;
        margin: inherit;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }
    `;
    document.head.appendChild(style);
  }

  private setupLiveRegions(): void {
    // Create live region for announcements
    this.announcements = document.createElement('div');
    this.announcements.setAttribute('aria-live', 'polite');
    this.announcements.setAttribute('aria-atomic', 'true');
    this.announcements.className = 'sr-only';
    this.announcements.id = 'accessibility-announcements';
    document.body.appendChild(this.announcements);
  }

  private addAriaLabels(): void {
    // Add ARIA labels to common elements
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
      if (!button.textContent?.trim()) {
        button.setAttribute('aria-label', 'Button');
      }
    });

    const links = document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])');
    links.forEach(link => {
      if (!link.textContent?.trim()) {
        link.setAttribute('aria-label', 'Link');
      }
    });

    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach(input => {
      const type = input.getAttribute('type');
      const placeholder = input.getAttribute('placeholder');
      if (placeholder) {
        input.setAttribute('aria-label', placeholder);
      } else if (type) {
        input.setAttribute('aria-label', `${type} input`);
      }
    });
  }

  // Focus Management
  private setupFocusManagement(): void {
    if (!this.config.enableFocusIndicators) return;

    // Add focus indicators
    const style = document.createElement('style');
    style.textContent = `
      *:focus {
        outline: 2px solid #3A7CA5;
        outline-offset: 2px;
      }
      
      *:focus:not(:focus-visible) {
        outline: none;
      }
      
      *:focus-visible {
        outline: 2px solid #3A7CA5;
        outline-offset: 2px;
      }
      
      .focus-ring {
        position: relative;
      }
      
      .focus-ring::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px solid transparent;
        border-radius: inherit;
        pointer-events: none;
      }
      
      .focus-ring:focus::after {
        border-color: #3A7CA5;
      }
    `;
    document.head.appendChild(style);
  }

  // Skip Links
  private setupSkipLinks(): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only sr-only-focusable';
    skipLink.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1000;
      padding: 8px 16px;
      background: #3A7CA5;
      color: white;
      text-decoration: none;
      border-radius: 0 0 4px 0;
    `;
    
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('main-content');
      if (target) {
        target.focus();
        target.scrollIntoView();
      }
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
    this.skipLinks.push(skipLink);
  }

  // Landmarks
  private setupLandmarks(): void {
    // Add landmark roles to main sections
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
    }

    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
    }

    const header = document.querySelector('header');
    if (header && !header.getAttribute('role')) {
      header.setAttribute('role', 'banner');
    }

    const footer = document.querySelector('footer');
    if (footer && !footer.getAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
    }

    // Add search landmark
    const search = document.querySelector('[role="search"]');
    if (!search) {
      const searchForm = document.querySelector('form[action*="search"]');
      if (searchForm) {
        searchForm.setAttribute('role', 'search');
      }
    }
  }

  // Announcements
  private setupAnnouncements(): void {
    // Setup announcement system
    this.announce = this.announce.bind(this);
  }

  // High Contrast
  private setupHighContrast(): void {
    if (this.config.enableHighContrast) {
      document.documentElement.classList.add('high-contrast');
    }
  }

  // Reduced Motion
  private setupReducedMotion(): void {
    if (this.config.enableReducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    }
  }

  // Font Size
  private setupFontSize(): void {
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px',
    };

    document.documentElement.style.fontSize = fontSizeMap[this.config.fontSize];
  }

  // Color Scheme
  private setupColorScheme(): void {
    document.documentElement.setAttribute('data-color-scheme', this.config.colorScheme);
  }

  // System Preferences
  private setupSystemPreferences(): void {
    // Listen for system preference changes
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
      const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

      prefersReducedMotion.addEventListener('change', (e) => {
        this.config.enableReducedMotion = e.matches;
        this.setupReducedMotion();
      });

      prefersHighContrast.addEventListener('change', (e) => {
        this.config.enableHighContrast = e.matches;
        this.setupHighContrast();
      });

      prefersDarkScheme.addEventListener('change', (e) => {
        if (this.config.colorScheme === 'light') {
          this.config.colorScheme = e.matches ? 'dark' : 'light';
          this.setupColorScheme();
        }
      });
    }
  }

  // Utility Methods
  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ];

    return Array.from(document.querySelectorAll(focusableSelectors.join(', '))) as HTMLElement[];
  }

  // Public Methods
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (this.announcements) {
      this.announcements.setAttribute('aria-live', priority);
      this.announcements.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (this.announcements) {
          this.announcements.textContent = '';
        }
      }, 1000);
    }
  }

  setFocus(element: HTMLElement): void {
    element.focus();
    this.announce(`Focused on ${element.getAttribute('aria-label') || element.textContent || 'element'}`);
  }

  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeAccessibility();
  }

  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  // Accessibility Testing
  runAccessibilityAudit(): {
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for missing alt text
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      errors.push(`Image missing alt text: ${img.getAttribute('src')}`);
    });

    // Check for missing form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      if (!label) {
        errors.push(`Input missing label: ${input.getAttribute('type') || 'input'}`);
      }
    });

    // Check for missing headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      warnings.push('No headings found on page');
    }

    // Check for heading hierarchy
    let lastLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        warnings.push(`Heading hierarchy skip: ${heading.tagName} after h${lastLevel}`);
      }
      lastLevel = level;
    });

    // Check for color contrast (simplified)
    const textElements = document.querySelectorAll('p, span, div, a, button');
    textElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const color = style.color;
      const backgroundColor = style.backgroundColor;
      
      if (color === backgroundColor) {
        errors.push('Text and background color are the same');
      }
    });

    return { errors, warnings, suggestions };
  }
}

// Global accessibility manager instance
export const accessibilityManager = new AccessibilityManager();

// React hook for accessibility
export function useAccessibility() {
  const [config, setConfig] = useState(accessibilityManager.getConfig());
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    const updateConfig = () => {
      setConfig(accessibilityManager.getConfig());
    };

    // Listen for config changes
    window.addEventListener('accessibility-config-changed', updateConfig);
    
    return () => {
      window.removeEventListener('accessibility-config-changed', updateConfig);
    };
  }, []);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    accessibilityManager.announce(message, priority);
    setAnnouncements(prev => [...prev, message]);
  };

  const updateConfig = (newConfig: Partial<AccessibilityConfig>) => {
    accessibilityManager.updateConfig(newConfig);
    setConfig(accessibilityManager.getConfig());
    window.dispatchEvent(new CustomEvent('accessibility-config-changed'));
  };

  const runAudit = () => {
    return accessibilityManager.runAccessibilityAudit();
  };

  return {
    config,
    announce,
    updateConfig,
    runAudit,
    announcements,
  };
}

// Accessibility utilities
export const accessibilityUtils = {
  // Generate unique ID for elements
  generateId: (prefix: string = 'acc'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Check if element is visible to screen readers
  isVisibleToScreenReader: (element: HTMLElement): boolean => {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.getAttribute('aria-hidden') !== 'true';
  },

  // Get accessible name for element
  getAccessibleName: (element: HTMLElement): string => {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    const label = element.closest('label');
    if (label) return label.textContent || '';

    return element.textContent || element.getAttribute('title') || '';
  },

  // Trap focus within element
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },
};
