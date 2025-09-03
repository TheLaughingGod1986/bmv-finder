import { auditLogger } from '../audit/auditLogger';
import crypto from 'crypto';

export interface UserJourney {
  id: string;
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  steps: JourneyStep[];
  goal?: string;
  completed: boolean;
  success: boolean;
  metrics: JourneyMetrics;
  insights: JourneyInsight[];
}

export interface JourneyStep {
  id: string;
  stepType: 'page_view' | 'action' | 'interaction' | 'navigation' | 'search' | 'form_submit';
  page: string;
  action?: string;
  timestamp: Date;
  duration?: number; // in milliseconds
  metadata: Record<string, any>;
  success: boolean;
  errors?: string[];
}

export interface JourneyMetrics {
  totalSteps: number;
  totalDuration: number;
  averageStepDuration: number;
  bounceRate: number;
  conversionRate: number;
  dropOffPoints: string[];
  completionRate: number;
  userSatisfaction: number; // 0-100
  taskSuccess: number; // 0-100
}

export interface JourneyInsight {
  id: string;
  type: 'optimization' | 'bottleneck' | 'success' | 'failure' | 'pattern';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // 0-100
  recommendation: string;
  confidence: number; // 0-1
  metadata: Record<string, any>;
}

export interface UserFlow {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  expectedDuration: number;
  successCriteria: string[];
  commonIssues: string[];
  optimizationSuggestions: string[];
  metrics: FlowMetrics;
}

export interface FlowStep {
  id: string;
  name: string;
  type: 'page' | 'action' | 'decision' | 'validation';
  required: boolean;
  expectedDuration: number;
  successCriteria: string[];
  commonIssues: string[];
  alternatives: string[];
}

export interface FlowMetrics {
  totalUsers: number;
  completionRate: number;
  averageDuration: number;
  dropOffRate: number;
  successRate: number;
  userSatisfaction: number;
  commonIssues: Record<string, number>;
}

export interface UXOptimization {
  id: string;
  type: 'ui' | 'ux' | 'performance' | 'accessibility' | 'content';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number; // 1-10
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  implementation: string;
  expectedImprovement: number; // percentage
  metrics: string[];
  createdAt: Date;
  completedAt?: Date;
}

export class UserJourneyOptimizer {
  private static instance: UserJourneyOptimizer;
  private journeys: Map<string, UserJourney> = new Map();
  private flows: Map<string, UserFlow> = new Map();
  private optimizations: Map<string, UXOptimization> = new Map();
  private sessionData: Map<string, any> = new Map();

  private constructor() {
    this.initializeDefaultFlows();
    this.startJourneyAnalysis();
    this.startOptimizationGeneration();
  }

  public static getInstance(): UserJourneyOptimizer {
    if (!UserJourneyOptimizer.instance) {
      UserJourneyOptimizer.instance = new UserJourneyOptimizer();
    }
    return UserJourneyOptimizer.instance;
  }

  // Journey Tracking
  async startJourney(userId: string, sessionId: string, goal?: string): Promise<string> {
    const journeyId = crypto.randomUUID();
    const journey: UserJourney = {
      id: journeyId,
      userId,
      sessionId,
      startTime: new Date(),
      steps: [],
      goal,
      completed: false,
      success: false,
      metrics: {
        totalSteps: 0,
        totalDuration: 0,
        averageStepDuration: 0,
        bounceRate: 0,
        conversionRate: 0,
        dropOffPoints: [],
        completionRate: 0,
        userSatisfaction: 0,
        taskSuccess: 0
      },
      insights: []
    };

    this.journeys.set(journeyId, journey);
    this.sessionData.set(sessionId, { journeyId, userId, startTime: new Date() });

    try {
      await auditLogger.logUserAction('journey_started', {
        journeyId,
        userId,
        sessionId,
        goal
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return journeyId;
  }

  async addJourneyStep(journeyId: string, step: Omit<JourneyStep, 'id' | 'timestamp'>): Promise<void> {
    const journey = this.journeys.get(journeyId);
    if (!journey) {
      throw new Error('Journey not found');
    }

    const journeyStep: JourneyStep = {
      id: crypto.randomUUID(),
      ...step,
      timestamp: new Date()
    };

    journey.steps.push(journeyStep);
    journey.metrics.totalSteps = journey.steps.length;

    // Calculate duration if this is a page view
    if (step.stepType === 'page_view' && journey.steps.length > 1) {
      const previousStep = journey.steps[journey.steps.length - 2];
      if (previousStep.stepType === 'page_view') {
        journeyStep.duration = journeyStep.timestamp.getTime() - previousStep.timestamp.getTime();
      }
    }

    this.journeys.set(journeyId, journey);

    // Analyze step for immediate insights
    this.analyzeStep(journey, journeyStep);
  }

  async completeJourney(journeyId: string, success: boolean): Promise<void> {
    const journey = this.journeys.get(journeyId);
    if (!journey) {
      throw new Error('Journey not found');
    }

    journey.endTime = new Date();
    journey.completed = true;
    journey.success = success;

    // Calculate final metrics
    journey.metrics.totalDuration = journey.endTime.getTime() - journey.startTime.getTime();
    journey.metrics.averageStepDuration = journey.metrics.totalDuration / journey.metrics.totalSteps;
    journey.metrics.completionRate = success ? 100 : 0;
    journey.metrics.conversionRate = success ? 100 : 0;

    // Generate insights
    journey.insights = await this.generateJourneyInsights(journey);

    this.journeys.set(journeyId, journey);

    try {
      await auditLogger.logUserAction('journey_completed', {
        journeyId,
        userId: journey.userId,
        success,
        duration: journey.metrics.totalDuration,
        steps: journey.metrics.totalSteps
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }
  }

  // Flow Analysis
  async analyzeUserFlow(flowName: string): Promise<FlowMetrics> {
    const flow = this.flows.get(flowName);
    if (!flow) {
      throw new Error('Flow not found');
    }

    const flowJourneys = Array.from(this.journeys.values())
      .filter(j => j.goal === flowName || j.steps.some(s => s.page.includes(flowName)));

    const totalUsers = flowJourneys.length;
    const completedJourneys = flowJourneys.filter(j => j.completed && j.success);
    const completionRate = totalUsers > 0 ? (completedJourneys.length / totalUsers) * 100 : 0;
    
    const averageDuration = flowJourneys.length > 0 
      ? flowJourneys.reduce((sum, j) => sum + j.metrics.totalDuration, 0) / flowJourneys.length 
      : 0;

    const dropOffRate = totalUsers > 0 ? ((totalUsers - completedJourneys.length) / totalUsers) * 100 : 0;
    const successRate = completionRate;
    
    const userSatisfaction = flowJourneys.length > 0
      ? flowJourneys.reduce((sum, j) => sum + j.metrics.userSatisfaction, 0) / flowJourneys.length
      : 0;

    // Analyze common issues
    const commonIssues: Record<string, number> = {};
    for (const journey of flowJourneys) {
      for (const step of journey.steps) {
        if (step.errors && step.errors.length > 0) {
          for (const error of step.errors) {
            commonIssues[error] = (commonIssues[error] || 0) + 1;
          }
        }
      }
    }

    const metrics: FlowMetrics = {
      totalUsers,
      completionRate,
      averageDuration,
      dropOffRate,
      successRate,
      userSatisfaction,
      commonIssues
    };

    flow.metrics = metrics;
    this.flows.set(flowName, flow);

    return metrics;
  }

  // UX Optimization
  async generateOptimizations(): Promise<UXOptimization[]> {
    const optimizations: UXOptimization[] = [];

    // Analyze all journeys for optimization opportunities
    for (const [flowName, flow] of this.flows) {
      const flowOptimizations = await this.analyzeFlowForOptimizations(flow);
      optimizations.push(...flowOptimizations);
    }

    // Sort by priority (impact vs effort)
    optimizations.sort((a, b) => {
      const priorityA = this.calculatePriority(a);
      const priorityB = this.calculatePriority(b);
      return priorityB - priorityA;
    });

    return optimizations;
  }

  async implementOptimization(optimizationId: string): Promise<void> {
    const optimization = this.optimizations.get(optimizationId);
    if (!optimization) {
      throw new Error('Optimization not found');
    }

    optimization.status = 'in_progress';
    this.optimizations.set(optimizationId, optimization);

    // Simulate implementation
    setTimeout(() => {
      optimization.status = 'completed';
      optimization.completedAt = new Date();
      this.optimizations.set(optimizationId, optimization);
    }, 5000);
  }

  // Journey Analysis
  private analyzeStep(journey: UserJourney, step: JourneyStep): void {
    // Check for potential issues
    if (step.duration && step.duration > 30000) { // 30 seconds
      const insight: JourneyInsight = {
        id: crypto.randomUUID(),
        type: 'bottleneck',
        title: 'Slow Step Performance',
        description: `Step "${step.page}" took ${Math.round(step.duration / 1000)}s to complete`,
        severity: 'medium',
        impact: 60,
        recommendation: 'Optimize page loading and reduce complexity',
        confidence: 0.8,
        metadata: { stepId: step.id, duration: step.duration }
      };
      journey.insights.push(insight);
    }

    if (step.errors && step.errors.length > 0) {
      const insight: JourneyInsight = {
        id: crypto.randomUUID(),
        type: 'failure',
        title: 'Step Errors Detected',
        description: `Step "${step.page}" encountered ${step.errors.length} errors`,
        severity: 'high',
        impact: 80,
        recommendation: 'Fix identified errors and improve error handling',
        confidence: 0.9,
        metadata: { stepId: step.id, errors: step.errors }
      };
      journey.insights.push(insight);
    }
  }

  private async generateJourneyInsights(journey: UserJourney): Promise<JourneyInsight[]> {
    const insights: JourneyInsight[] = [];

    // Analyze completion time
    if (journey.metrics.totalDuration > 300000) { // 5 minutes
      insights.push({
        id: crypto.randomUUID(),
        type: 'optimization',
        title: 'Long Journey Duration',
        description: `Journey took ${Math.round(journey.metrics.totalDuration / 60000)} minutes to complete`,
        severity: 'medium',
        impact: 70,
        recommendation: 'Streamline the user flow to reduce completion time',
        confidence: 0.7,
        metadata: { duration: journey.metrics.totalDuration }
      });
    }

    // Analyze step count
    if (journey.metrics.totalSteps > 10) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'optimization',
        title: 'High Step Count',
        description: `Journey required ${journey.metrics.totalSteps} steps`,
        severity: 'low',
        impact: 50,
        recommendation: 'Reduce the number of steps in the user flow',
        confidence: 0.6,
        metadata: { stepCount: journey.metrics.totalSteps }
      });
    }

    // Analyze success rate
    if (!journey.success) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'failure',
        title: 'Journey Failed',
        description: 'User did not complete the intended goal',
        severity: 'high',
        impact: 90,
        recommendation: 'Investigate failure points and improve user guidance',
        confidence: 1.0,
        metadata: { goal: journey.goal }
      });
    }

    return insights;
  }

  private async analyzeFlowForOptimizations(flow: UserFlow): Promise<UXOptimization[]> {
    const optimizations: UXOptimization[] = [];

    // Analyze completion rate
    if (flow.metrics.completionRate < 70) {
      optimizations.push({
        id: crypto.randomUUID(),
        type: 'ux',
        title: `Improve ${flow.name} Completion Rate`,
        description: `Current completion rate is ${flow.metrics.completionRate.toFixed(1)}%. Target: 80%+`,
        impact: 'high',
        effort: 'medium',
        priority: 8,
        status: 'proposed',
        implementation: 'Simplify flow steps and improve user guidance',
        expectedImprovement: 15,
        metrics: ['completion_rate', 'user_satisfaction'],
        createdAt: new Date()
      });
    }

    // Analyze average duration
    if (flow.metrics.averageDuration > flow.expectedDuration * 1.5) {
      optimizations.push({
        id: crypto.randomUUID(),
        type: 'performance',
        title: `Reduce ${flow.name} Duration`,
        description: `Current duration is ${Math.round(flow.metrics.averageDuration / 1000)}s. Target: ${Math.round(flow.expectedDuration / 1000)}s`,
        impact: 'medium',
        effort: 'low',
        priority: 6,
        status: 'proposed',
        implementation: 'Optimize page loading and reduce form complexity',
        expectedImprovement: 20,
        metrics: ['average_duration', 'bounce_rate'],
        createdAt: new Date()
      });
    }

    // Analyze common issues
    const topIssue = Object.entries(flow.metrics.commonIssues)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topIssue && topIssue[1] > 5) {
      optimizations.push({
        id: crypto.randomUUID(),
        type: 'ui',
        title: `Fix Common Issue: ${topIssue[0]}`,
        description: `This issue affects ${topIssue[1]} users`,
        impact: 'high',
        effort: 'low',
        priority: 9,
        status: 'proposed',
        implementation: 'Address the root cause and improve error handling',
        expectedImprovement: 25,
        metrics: ['error_rate', 'user_satisfaction'],
        createdAt: new Date()
      });
    }

    return optimizations;
  }

  private calculatePriority(optimization: UXOptimization): number {
    const impactWeight = { low: 1, medium: 2, high: 3 };
    const effortWeight = { low: 3, medium: 2, high: 1 };
    
    return impactWeight[optimization.impact] * effortWeight[optimization.effort];
  }

  private initializeDefaultFlows(): void {
    // Property Search Flow
    const propertySearchFlow: UserFlow = {
      id: 'property-search',
      name: 'Property Search',
      description: 'User searches for properties and views results',
      steps: [
        {
          id: 'search-page',
          name: 'Search Page',
          type: 'page',
          required: true,
          expectedDuration: 10000,
          successCriteria: ['page loads', 'search form visible'],
          commonIssues: ['slow loading', 'form validation errors'],
          alternatives: ['quick search', 'advanced search']
        },
        {
          id: 'search-execution',
          name: 'Search Execution',
          type: 'action',
          required: true,
          expectedDuration: 5000,
          successCriteria: ['results returned', 'no errors'],
          commonIssues: ['no results', 'timeout', 'server error'],
          alternatives: ['refined search', 'different filters']
        },
        {
          id: 'results-page',
          name: 'Results Page',
          type: 'page',
          required: true,
          expectedDuration: 15000,
          successCriteria: ['results displayed', 'pagination works'],
          commonIssues: ['empty results', 'pagination broken'],
          alternatives: ['modify search', 'view saved searches']
        }
      ],
      expectedDuration: 30000,
      successCriteria: ['results found', 'user can view details'],
      commonIssues: ['no results', 'slow performance', 'filter issues'],
      optimizationSuggestions: ['improve search algorithm', 'add autocomplete', 'optimize results loading'],
      metrics: {
        totalUsers: 0,
        completionRate: 0,
        averageDuration: 0,
        dropOffRate: 0,
        successRate: 0,
        userSatisfaction: 0,
        commonIssues: {}
      }
    };

    // Property Details Flow
    const propertyDetailsFlow: UserFlow = {
      id: 'property-details',
      name: 'Property Details',
      description: 'User views detailed property information',
      steps: [
        {
          id: 'property-page',
          name: 'Property Page',
          type: 'page',
          required: true,
          expectedDuration: 8000,
          successCriteria: ['property details loaded', 'images visible'],
          commonIssues: ['slow loading', 'missing images', 'broken layout'],
          alternatives: ['simplified view', 'mobile view']
        },
        {
          id: 'view-analytics',
          name: 'View Analytics',
          type: 'action',
          required: false,
          expectedDuration: 5000,
          successCriteria: ['analytics loaded', 'charts visible'],
          commonIssues: ['data not available', 'chart errors'],
          alternatives: ['basic info only', 'export data']
        }
      ],
      expectedDuration: 13000,
      successCriteria: ['property details viewed', 'user engaged'],
      commonIssues: ['slow loading', 'missing data', 'poor mobile experience'],
      optimizationSuggestions: ['optimize images', 'improve mobile layout', 'add loading states'],
      metrics: {
        totalUsers: 0,
        completionRate: 0,
        averageDuration: 0,
        dropOffRate: 0,
        successRate: 0,
        userSatisfaction: 0,
        commonIssues: {}
      }
    };

    this.flows.set('property-search', propertySearchFlow);
    this.flows.set('property-details', propertyDetailsFlow);
  }

  private startJourneyAnalysis(): void {
    // Analyze journeys every 5 minutes
    setInterval(() => {
      this.performJourneyAnalysis();
    }, 5 * 60 * 1000);
  }

  private startOptimizationGeneration(): void {
    // Generate optimizations daily
    setInterval(() => {
      this.performOptimizationGeneration();
    }, 24 * 60 * 60 * 1000);
  }

  private async performJourneyAnalysis(): Promise<void> {
    for (const [flowName] of this.flows) {
      await this.analyzeUserFlow(flowName);
    }
  }

  private async performOptimizationGeneration(): Promise<void> {
    const optimizations = await this.generateOptimizations();
    for (const optimization of optimizations) {
      this.optimizations.set(optimization.id, optimization);
    }
  }

  // Public getters
  getJourney(journeyId: string): UserJourney | null {
    return this.journeys.get(journeyId) || null;
  }

  getUserJourneys(userId: string): UserJourney[] {
    return Array.from(this.journeys.values())
      .filter(j => j.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  getFlow(flowName: string): UserFlow | null {
    return this.flows.get(flowName) || null;
  }

  getAllFlows(): UserFlow[] {
    return Array.from(this.flows.values());
  }

  getOptimizations(): UXOptimization[] {
    return Array.from(this.optimizations.values())
      .sort((a, b) => b.priority - a.priority);
  }

  getUXStats(): {
    totalJourneys: number;
    completedJourneys: number;
    averageCompletionRate: number;
    totalOptimizations: number;
    activeOptimizations: number;
    averageUserSatisfaction: number;
  } {
    const journeys = Array.from(this.journeys.values());
    const completedJourneys = journeys.filter(j => j.completed);
    const averageCompletionRate = journeys.length > 0 
      ? journeys.reduce((sum, j) => sum + j.metrics.completionRate, 0) / journeys.length 
      : 0;
    
    const optimizations = Array.from(this.optimizations.values());
    const activeOptimizations = optimizations.filter(o => o.status === 'in_progress').length;
    
    const averageUserSatisfaction = journeys.length > 0
      ? journeys.reduce((sum, j) => sum + j.metrics.userSatisfaction, 0) / journeys.length
      : 0;

    return {
      totalJourneys: journeys.length,
      completedJourneys: completedJourneys.length,
      averageCompletionRate,
      totalOptimizations: optimizations.length,
      activeOptimizations,
      averageUserSatisfaction
    };
  }
}

// Export singleton instance
export const userJourneyOptimizer = UserJourneyOptimizer.getInstance();
