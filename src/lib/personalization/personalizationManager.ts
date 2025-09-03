import { auditLogger } from '../audit/auditLogger';
import crypto from 'crypto';

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  dateFormat: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
  search: SearchPreferences;
  display: DisplayPreferences;
  accessibility: AccessibilityPreferences;
  privacy: PrivacyPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'never';
    types: string[];
  };
  push: {
    enabled: boolean;
    types: string[];
  };
  sms: {
    enabled: boolean;
    types: string[];
  };
  inApp: {
    enabled: boolean;
    types: string[];
  };
}

export interface DashboardPreferences {
  layout: 'grid' | 'list' | 'compact';
  widgets: string[];
  defaultView: string;
  refreshInterval: number; // in seconds
  showTutorials: boolean;
  showTips: boolean;
  customLayout: Record<string, any>;
}

export interface SearchPreferences {
  defaultFilters: Record<string, any>;
  savedSearches: string[];
  searchHistory: boolean;
  autoComplete: boolean;
  suggestions: boolean;
  advancedMode: boolean;
  resultCount: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface DisplayPreferences {
  density: 'compact' | 'comfortable' | 'spacious';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'default' | 'high-contrast' | 'colorblind-friendly';
  animations: boolean;
  transitions: boolean;
  images: boolean;
  videos: boolean;
  charts: boolean;
  maps: boolean;
}

export interface AccessibilityPreferences {
  screenReader: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  focusIndicators: boolean;
  altText: boolean;
  captions: boolean;
  voiceControl: boolean;
  magnification: number; // 1.0 to 3.0
  colorBlindSupport: boolean;
}

export interface PrivacyPreferences {
  dataSharing: boolean;
  analytics: boolean;
  personalization: boolean;
  locationTracking: boolean;
  cookies: boolean;
  thirdParty: boolean;
  marketing: boolean;
  dataRetention: number; // in days
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  interests: string[];
  investmentGoals: string[];
  experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  budget: {
    min: number;
    max: number;
    preferred: number;
  };
  preferredRegions: string[];
  propertyTypes: string[];
  investmentStrategy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalizationInsights {
  userId: string;
  behaviorPatterns: BehaviorPattern[];
  recommendations: PersonalizationRecommendation[];
  preferences: UserPreferences;
  profile: UserProfile;
  lastAnalyzed: Date;
}

export interface BehaviorPattern {
  id: string;
  type: 'search' | 'view' | 'click' | 'time_spent' | 'navigation';
  pattern: string;
  frequency: number;
  confidence: number;
  lastSeen: Date;
  metadata: Record<string, any>;
}

export interface PersonalizationRecommendation {
  id: string;
  type: 'ui' | 'feature' | 'content' | 'workflow';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  action: string;
  dismissed: boolean;
  applied: boolean;
  createdAt: Date;
}

export class PersonalizationManager {
  private static instance: PersonalizationManager;
  private preferences: Map<string, UserPreferences> = new Map();
  private profiles: Map<string, UserProfile> = new Map();
  private insights: Map<string, PersonalizationInsights> = new Map();
  private behaviorData: Map<string, any[]> = new Map();

  private constructor() {
    this.initializeDefaultPreferences();
    this.startBehaviorAnalysis();
    this.startInsightGeneration();
  }

  public static getInstance(): PersonalizationManager {
    if (!PersonalizationManager.instance) {
      PersonalizationManager.instance = new PersonalizationManager();
    }
    return PersonalizationManager.instance;
  }

  // User Preferences Management
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    let preferences = this.preferences.get(userId);
    if (!preferences) {
      preferences = await this.createDefaultPreferences(userId);
    }
    return preferences;
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const preferences = await this.getUserPreferences(userId);
    const updatedPreferences = {
      ...preferences,
      ...updates,
      updatedAt: new Date()
    };

    this.preferences.set(userId, updatedPreferences);

    try {
      await auditLogger.logUserAction('preferences_updated', {
        userId,
        updates: Object.keys(updates)
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return updatedPreferences;
  }

  async resetUserPreferences(userId: string): Promise<UserPreferences> {
    const defaultPreferences = await this.createDefaultPreferences(userId);
    this.preferences.set(userId, defaultPreferences);

    try {
      await auditLogger.logUserAction('preferences_reset', { userId });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return defaultPreferences;
  }

  // User Profile Management
  async getUserProfile(userId: string): Promise<UserProfile> {
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = await this.createDefaultProfile(userId);
    }
    return profile;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const profile = await this.getUserProfile(userId);
    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date()
    };

    this.profiles.set(userId, updatedProfile);

    try {
      await auditLogger.logUserAction('profile_updated', {
        userId,
        updates: Object.keys(updates)
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return updatedProfile;
  }

  // Behavior Tracking
  async trackUserBehavior(userId: string, behavior: {
    type: string;
    action: string;
    target?: string;
    metadata?: Record<string, any>;
    timestamp?: Date;
  }): Promise<void> {
    const behaviorData = this.behaviorData.get(userId) || [];
    const behaviorEntry = {
      id: crypto.randomUUID(),
      userId,
      type: behavior.type,
      action: behavior.action,
      target: behavior.target,
      metadata: behavior.metadata || {},
      timestamp: behavior.timestamp || new Date()
    };

    behaviorData.push(behaviorEntry);
    
    // Keep only last 1000 entries per user
    if (behaviorData.length > 1000) {
      behaviorData.splice(0, behaviorData.length - 1000);
    }

    this.behaviorData.set(userId, behaviorData);

    // Trigger real-time analysis for high-priority behaviors
    if (this.isHighPriorityBehavior(behavior)) {
      this.analyzeUserBehavior(userId);
    }
  }

  // Personalization Insights
  async getPersonalizationInsights(userId: string): Promise<PersonalizationInsights> {
    let insights = this.insights.get(userId);
    if (!insights) {
      insights = await this.generateInsights(userId);
    }
    return insights;
  }

  async generatePersonalizationRecommendations(userId: string): Promise<PersonalizationRecommendation[]> {
    const insights = await this.getPersonalizationInsights(userId);
    const recommendations: PersonalizationRecommendation[] = [];

    // Analyze behavior patterns and generate recommendations
    for (const pattern of insights.behaviorPatterns) {
      if (pattern.confidence > 0.7) {
        const recommendation = this.generateRecommendationFromPattern(pattern, insights);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
    }

    // Add UI/UX recommendations based on preferences
    const uiRecommendations = this.generateUIRecommendations(insights.preferences);
    recommendations.push(...uiRecommendations);

    // Add feature recommendations based on profile
    const featureRecommendations = this.generateFeatureRecommendations(insights.profile);
    recommendations.push(...featureRecommendations);

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Theme and Display Management
  async getThemeSettings(userId: string): Promise<{
    theme: string;
    colorScheme: string;
    fontSize: string;
    density: string;
    animations: boolean;
    highContrast: boolean;
  }> {
    const preferences = await this.getUserPreferences(userId);
    return {
      theme: preferences.theme,
      colorScheme: preferences.display.colorScheme,
      fontSize: preferences.display.fontSize,
      density: preferences.display.density,
      animations: preferences.display.animations,
      highContrast: preferences.accessibility.highContrast
    };
  }

  async updateThemeSettings(userId: string, settings: {
    theme?: string;
    colorScheme?: string;
    fontSize?: string;
    density?: string;
    animations?: boolean;
    highContrast?: boolean;
  }): Promise<void> {
    const updates: Partial<UserPreferences> = {};
    
    if (settings.theme) updates.theme = settings.theme as any;
    if (settings.colorScheme) updates.display = { ...(await this.getUserPreferences(userId)).display, colorScheme: settings.colorScheme as any };
    if (settings.fontSize) updates.display = { ...(await this.getUserPreferences(userId)).display, fontSize: settings.fontSize as any };
    if (settings.density) updates.display = { ...(await this.getUserPreferences(userId)).display, density: settings.density as any };
    if (settings.animations !== undefined) updates.display = { ...(await this.getUserPreferences(userId)).display, animations: settings.animations };
    if (settings.highContrast !== undefined) updates.accessibility = { ...(await this.getUserPreferences(userId)).accessibility, highContrast: settings.highContrast };

    await this.updateUserPreferences(userId, updates);
  }

  // Dashboard Customization
  async getDashboardLayout(userId: string): Promise<DashboardPreferences> {
    const preferences = await this.getUserPreferences(userId);
    return preferences.dashboard;
  }

  async updateDashboardLayout(userId: string, layout: Partial<DashboardPreferences>): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    const updatedPreferences = {
      ...preferences,
      dashboard: { ...preferences.dashboard, ...layout },
      updatedAt: new Date()
    };
    this.preferences.set(userId, updatedPreferences);
  }

  // Search Preferences
  async getSearchPreferences(userId: string): Promise<SearchPreferences> {
    const preferences = await this.getUserPreferences(userId);
    return preferences.search;
  }

  async updateSearchPreferences(userId: string, searchPrefs: Partial<SearchPreferences>): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    const updatedPreferences = {
      ...preferences,
      search: { ...preferences.search, ...searchPrefs },
      updatedAt: new Date()
    };
    this.preferences.set(userId, updatedPreferences);
  }

  // Utility Methods
  private async createDefaultPreferences(userId: string): Promise<UserPreferences> {
    const preferences: UserPreferences = {
      id: crypto.randomUUID(),
      userId,
      theme: 'auto',
      language: 'en',
      currency: 'GBP',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Europe/London',
      notifications: {
        email: {
          enabled: true,
          frequency: 'daily',
          types: ['property_alerts', 'market_updates', 'portfolio_changes']
        },
        push: {
          enabled: true,
          types: ['property_alerts', 'market_updates']
        },
        sms: {
          enabled: false,
          types: []
        },
        inApp: {
          enabled: true,
          types: ['all']
        }
      },
      dashboard: {
        layout: 'grid',
        widgets: ['portfolio_summary', 'market_trends', 'recent_searches', 'recommendations'],
        defaultView: 'overview',
        refreshInterval: 300,
        showTutorials: true,
        showTips: true,
        customLayout: {}
      },
      search: {
        defaultFilters: {},
        savedSearches: [],
        searchHistory: true,
        autoComplete: true,
        suggestions: true,
        advancedMode: false,
        resultCount: 20,
        sortBy: 'relevance',
        sortOrder: 'desc'
      },
      display: {
        density: 'comfortable',
        fontSize: 'medium',
        colorScheme: 'default',
        animations: true,
        transitions: true,
        images: true,
        videos: true,
        charts: true,
        maps: true
      },
      accessibility: {
        screenReader: false,
        keyboardNavigation: true,
        highContrast: false,
        reducedMotion: false,
        focusIndicators: true,
        altText: true,
        captions: true,
        voiceControl: false,
        magnification: 1.0,
        colorBlindSupport: false
      },
      privacy: {
        dataSharing: false,
        analytics: true,
        personalization: true,
        locationTracking: false,
        cookies: true,
        thirdParty: false,
        marketing: false,
        dataRetention: 365
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.preferences.set(userId, preferences);
    return preferences;
  }

  private async createDefaultProfile(userId: string): Promise<UserProfile> {
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      userId,
      displayName: 'User',
      interests: [],
      investmentGoals: ['Capital Growth'],
      experience: 'beginner',
      riskTolerance: 'moderate',
      investmentHorizon: 'long',
      budget: {
        min: 100000,
        max: 500000,
        preferred: 300000
      },
      preferredRegions: [],
      propertyTypes: ['House', 'Flat'],
      investmentStrategy: 'Buy and Hold',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.profiles.set(userId, profile);
    return profile;
  }

  private async generateInsights(userId: string): Promise<PersonalizationInsights> {
    const preferences = await this.getUserPreferences(userId);
    const profile = await this.getUserProfile(userId);
    const behaviorPatterns = await this.analyzeUserBehavior(userId);
    const recommendations = await this.generatePersonalizationRecommendations(userId);

    const insights: PersonalizationInsights = {
      userId,
      behaviorPatterns,
      recommendations,
      preferences,
      profile,
      lastAnalyzed: new Date()
    };

    this.insights.set(userId, insights);
    return insights;
  }

  private async analyzeUserBehavior(userId: string): Promise<BehaviorPattern[]> {
    const behaviorData = this.behaviorData.get(userId) || [];
    const patterns: BehaviorPattern[] = [];

    // Analyze search patterns
    const searchBehaviors = behaviorData.filter(b => b.type === 'search');
    if (searchBehaviors.length > 5) {
      patterns.push({
        id: crypto.randomUUID(),
        type: 'search',
        pattern: 'frequent_searcher',
        frequency: searchBehaviors.length,
        confidence: Math.min(1.0, searchBehaviors.length / 20),
        lastSeen: new Date(),
        metadata: { searchCount: searchBehaviors.length }
      });
    }

    // Analyze navigation patterns
    const navigationBehaviors = behaviorData.filter(b => b.type === 'navigation');
    if (navigationBehaviors.length > 10) {
      patterns.push({
        id: crypto.randomUUID(),
        type: 'navigation',
        pattern: 'explorer',
        frequency: navigationBehaviors.length,
        confidence: Math.min(1.0, navigationBehaviors.length / 50),
        lastSeen: new Date(),
        metadata: { navigationCount: navigationBehaviors.length }
      });
    }

    // Analyze time spent patterns
    const timeSpentBehaviors = behaviorData.filter(b => b.type === 'time_spent');
    const avgTimeSpent = timeSpentBehaviors.reduce((sum, b) => sum + (b.metadata.duration || 0), 0) / timeSpentBehaviors.length;
    if (avgTimeSpent > 300) { // 5 minutes
      patterns.push({
        id: crypto.randomUUID(),
        type: 'time_spent',
        pattern: 'engaged_user',
        frequency: timeSpentBehaviors.length,
        confidence: Math.min(1.0, avgTimeSpent / 600), // 10 minutes max
        lastSeen: new Date(),
        metadata: { averageTimeSpent: avgTimeSpent }
      });
    }

    return patterns;
  }

  private generateRecommendationFromPattern(pattern: BehaviorPattern, insights: PersonalizationInsights): PersonalizationRecommendation | null {
    switch (pattern.pattern) {
      case 'frequent_searcher':
        return {
          id: crypto.randomUUID(),
          type: 'feature',
          title: 'Enable Advanced Search',
          description: 'You search frequently. Enable advanced search features for better results.',
          priority: 'medium',
          action: 'enable_advanced_search',
          dismissed: false,
          applied: false,
          createdAt: new Date()
        };
      case 'explorer':
        return {
          id: crypto.randomUUID(),
          type: 'ui',
          title: 'Customize Dashboard',
          description: 'You explore many features. Customize your dashboard for quick access.',
          priority: 'low',
          action: 'customize_dashboard',
          dismissed: false,
          applied: false,
          createdAt: new Date()
        };
      case 'engaged_user':
        return {
          id: crypto.randomUUID(),
          type: 'content',
          title: 'Enable Detailed Analytics',
          description: 'You spend time analyzing data. Enable detailed analytics for deeper insights.',
          priority: 'high',
          action: 'enable_detailed_analytics',
          dismissed: false,
          applied: false,
          createdAt: new Date()
        };
      default:
        return null;
    }
  }

  private generateUIRecommendations(preferences: UserPreferences): PersonalizationRecommendation[] {
    const recommendations: PersonalizationRecommendation[] = [];

    if (!preferences.display.animations && !preferences.accessibility.reducedMotion) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'ui',
        title: 'Enable Animations',
        description: 'Animations can improve the user experience and make the interface feel more responsive.',
        priority: 'low',
        action: 'enable_animations',
        dismissed: false,
        applied: false,
        createdAt: new Date()
      });
    }

    if (preferences.display.density === 'compact') {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'ui',
        title: 'Try Comfortable Density',
        description: 'The comfortable density setting provides better readability and spacing.',
        priority: 'low',
        action: 'change_density_comfortable',
        dismissed: false,
        applied: false,
        createdAt: new Date()
      });
    }

    return recommendations;
  }

  private generateFeatureRecommendations(profile: UserProfile): PersonalizationRecommendation[] {
    const recommendations: PersonalizationRecommendation[] = [];

    if (profile.experience === 'beginner') {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'feature',
        title: 'Enable Tutorials',
        description: 'As a beginner, tutorials can help you learn the platform faster.',
        priority: 'high',
        action: 'enable_tutorials',
        dismissed: false,
        applied: false,
        createdAt: new Date()
      });
    }

    if (profile.investmentGoals.includes('Capital Growth')) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'feature',
        title: 'Set Up Market Alerts',
        description: 'Market alerts can help you identify growth opportunities.',
        priority: 'medium',
        action: 'setup_market_alerts',
        dismissed: false,
        applied: false,
        createdAt: new Date()
      });
    }

    return recommendations;
  }

  private isHighPriorityBehavior(behavior: any): boolean {
    const highPriorityTypes = ['search', 'purchase', 'signup', 'error'];
    return highPriorityTypes.includes(behavior.type);
  }

  private initializeDefaultPreferences(): void {
    // Initialize with some default preferences for demo purposes
    console.log('Personalization manager initialized');
  }

  private startBehaviorAnalysis(): void {
    // Analyze user behavior every hour
    setInterval(() => {
      this.performBehaviorAnalysis();
    }, 60 * 60 * 1000);
  }

  private startInsightGeneration(): void {
    // Generate insights daily
    setInterval(() => {
      this.performInsightGeneration();
    }, 24 * 60 * 60 * 1000);
  }

  private async performBehaviorAnalysis(): Promise<void> {
    for (const userId of this.behaviorData.keys()) {
      await this.analyzeUserBehavior(userId);
    }
  }

  private async performInsightGeneration(): Promise<void> {
    for (const userId of this.preferences.keys()) {
      await this.generateInsights(userId);
    }
  }

  // Public getters
  getPersonalizationStats(): {
    totalUsers: number;
    usersWithPreferences: number;
    usersWithProfiles: number;
    totalBehaviorEntries: number;
    averageRecommendationsPerUser: number;
  } {
    const totalUsers = Math.max(this.preferences.size, this.profiles.size);
    const totalBehaviorEntries = Array.from(this.behaviorData.values())
      .reduce((sum, entries) => sum + entries.length, 0);
    const averageRecommendations = Array.from(this.insights.values())
      .reduce((sum, insight) => sum + insight.recommendations.length, 0) / this.insights.size;

    return {
      totalUsers,
      usersWithPreferences: this.preferences.size,
      usersWithProfiles: this.profiles.size,
      totalBehaviorEntries,
      averageRecommendationsPerUser: averageRecommendations || 0
    };
  }
}

// Export singleton instance
export const personalizationManager = PersonalizationManager.getInstance();
