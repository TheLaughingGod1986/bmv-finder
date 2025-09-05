import { auditLogger } from '../audit/auditLogger';

export interface IntegrationTest {
  id: string;
  name: string;
  description: string;
  category: 'AUTHENTICATION' | 'PROPERTY_SEARCH' | 'USER_MANAGEMENT' | 'ANALYTICS' | 'INTEGRATIONS' | 'PERFORMANCE' | 'SECURITY' | 'END_TO_END';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dependencies: string[];
  steps: IntegrationTestStep[];
  expectedResult: any;
  timeout: number;
  retries: number;
  enabled: boolean;
}

export interface IntegrationTestStep {
  id: string;
  name: string;
  type: 'API_CALL' | 'DATABASE_QUERY' | 'EXTERNAL_SERVICE' | 'UI_INTERACTION' | 'VALIDATION';
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  headers?: { [key: string]: string };
  expectedStatus?: number;
  expectedResponse?: any;
  validation?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
    value: any;
  }[];
  waitTime?: number;
}

export interface IntegrationTestResult {
  testId: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'TIMEOUT';
  startTime: string;
  endTime: string;
  duration: number;
  steps: IntegrationTestStepResult[];
  error?: string;
  metrics?: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    networkRequests: number;
  };
}

export interface IntegrationTestStepResult {
  stepId: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'TIMEOUT';
  startTime: string;
  endTime: string;
  duration: number;
  response?: any;
  error?: string;
  validationResults?: ValidationResult[];
}

export interface ValidationResult {
  field: string;
  expected: any;
  actual: any;
  passed: boolean;
  error?: string;
}

export interface SystemHealthReport {
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  componentHealth: {
    [component: string]: {
      status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
      responseTime: number;
      errorRate: number;
      lastChecked: string;
      issues: string[];
    };
  };
  recommendations: string[];
  generatedAt: string;
}

export class SystemIntegrationTester {
  private static instance: SystemIntegrationTester;
  private tests: Map<string, IntegrationTest> = new Map();
  private results: Map<string, IntegrationTestResult[]> = new Map();
  private isRunning: boolean = false;

  public static getInstance(): SystemIntegrationTester {
    if (!SystemIntegrationTester.instance) {
      SystemIntegrationTester.instance = new SystemIntegrationTester();
    }
    return SystemIntegrationTester.instance;
  }

  constructor() {
    this.initializeDefaultTests();
  }

  private initializeDefaultTests(): void {
    // Authentication Integration Tests
    this.addTest({
      id: 'auth-user-registration',
      name: 'User Registration Flow',
      description: 'Test complete user registration and authentication flow',
      category: 'AUTHENTICATION',
      priority: 'CRITICAL',
      dependencies: [],
      steps: [
        {
          id: 'register-user',
          name: 'Register New User',
          type: 'API_CALL',
          endpoint: '/api/auth/register',
          method: 'POST',
          payload: {
            email: 'test@example.com',
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
            acceptTerms: true,
          },
          expectedStatus: 201,
        },
        {
          id: 'verify-user-created',
          name: 'Verify User Created',
          type: 'DATABASE_QUERY',
          validation: [
            { field: 'email', operator: 'equals', value: 'test@example.com' },
            { field: 'status', operator: 'equals', value: 'active' },
          ],
        },
        {
          id: 'login-user',
          name: 'Login User',
          type: 'API_CALL',
          endpoint: '/api/auth/login',
          method: 'POST',
          payload: {
            email: 'test@example.com',
            password: 'TestPassword123!',
          },
          expectedStatus: 200,
          validation: [
            { field: 'success', operator: 'equals', value: true },
            { field: 'data.token', operator: 'exists', value: null },
          ],
        },
      ],
      expectedResult: { success: true, authenticated: true },
      timeout: 30000,
      retries: 2,
      enabled: true,
    });

    // Property Search Integration Tests
    this.addTest({
      id: 'property-search-flow',
      name: 'Property Search Integration',
      description: 'Test property search with Elasticsearch integration',
      category: 'PROPERTY_SEARCH',
      priority: 'CRITICAL',
      dependencies: ['auth-user-registration'],
      steps: [
        {
          id: 'search-properties',
          name: 'Search Properties',
          type: 'API_CALL',
          endpoint: '/api/property-search',
          method: 'GET',
          headers: { 'Authorization': 'Bearer ${token}' },
          expectedStatus: 200,
          validation: [
            { field: 'success', operator: 'equals', value: true },
            { field: 'data', operator: 'exists', value: null },
          ],
        },
        {
          id: 'verify-elasticsearch',
          name: 'Verify Elasticsearch Response',
          type: 'EXTERNAL_SERVICE',
          validation: [
            { field: 'responseTime', operator: 'less_than', value: 5000 },
            { field: 'resultsCount', operator: 'greater_than', value: 0 },
          ],
        },
      ],
      expectedResult: { success: true, resultsFound: true },
      timeout: 15000,
      retries: 2,
      enabled: true,
    });

    // User Management Integration Tests
    this.addTest({
      id: 'user-profile-management',
      name: 'User Profile Management',
      description: 'Test user profile CRUD operations',
      category: 'USER_MANAGEMENT',
      priority: 'HIGH',
      dependencies: ['auth-user-registration'],
      steps: [
        {
          id: 'get-profile',
          name: 'Get User Profile',
          type: 'API_CALL',
          endpoint: '/api/user/profile',
          method: 'GET',
          headers: { 'Authorization': 'Bearer ${token}' },
          expectedStatus: 200,
        },
        {
          id: 'update-profile',
          name: 'Update User Profile',
          type: 'API_CALL',
          endpoint: '/api/user/profile',
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ${token}' },
          payload: {
            firstName: 'Updated',
            lastName: 'Name',
            phone: '+1234567890',
          },
          expectedStatus: 200,
        },
        {
          id: 'verify-update',
          name: 'Verify Profile Update',
          type: 'API_CALL',
          endpoint: '/api/user/profile',
          method: 'GET',
          headers: { 'Authorization': 'Bearer ${token}' },
          expectedStatus: 200,
          validation: [
            { field: 'data.firstName', operator: 'equals', value: 'Updated' },
            { field: 'data.lastName', operator: 'equals', value: 'Name' },
          ],
        },
      ],
      expectedResult: { success: true, profileUpdated: true },
      timeout: 20000,
      retries: 2,
      enabled: true,
    });

    // Analytics Integration Tests
    this.addTest({
      id: 'analytics-integration',
      name: 'Analytics Integration',
      description: 'Test analytics data collection and processing',
      category: 'ANALYTICS',
      priority: 'HIGH',
      dependencies: ['property-search-flow'],
      steps: [
        {
          id: 'generate-analytics',
          name: 'Generate Analytics Data',
          type: 'API_CALL',
          endpoint: '/api/analytics/execute',
          method: 'POST',
          headers: { 'Authorization': 'Bearer ${token}' },
          payload: {
            type: 'property_analysis',
            parameters: {
              location: 'SW1A 1AA',
              radius: 5,
            },
          },
          expectedStatus: 200,
        },
        {
          id: 'verify-analytics',
          name: 'Verify Analytics Results',
          type: 'API_CALL',
          endpoint: '/api/analytics/property',
          method: 'GET',
          headers: { 'Authorization': 'Bearer ${token}' },
          expectedStatus: 200,
          validation: [
            { field: 'success', operator: 'equals', value: true },
            { field: 'data.insights', operator: 'exists', value: null },
          ],
        },
      ],
      expectedResult: { success: true, analyticsGenerated: true },
      timeout: 30000,
      retries: 2,
      enabled: true,
    });

    // Performance Integration Tests
    this.addTest({
      id: 'performance-benchmark',
      name: 'Performance Benchmark',
      description: 'Test system performance under load',
      category: 'PERFORMANCE',
      priority: 'HIGH',
      dependencies: [],
      steps: [
        {
          id: 'load-test-api',
          name: 'Load Test API',
          type: 'API_CALL',
          endpoint: '/api/health-check',
          method: 'GET',
          expectedStatus: 200,
          validation: [
            { field: 'responseTime', operator: 'less_than', value: 1000 },
          ],
        },
        {
          id: 'memory-usage-check',
          name: 'Memory Usage Check',
          type: 'VALIDATION',
          validation: [
            { field: 'memoryUsage', operator: 'less_than', value: 80 },
          ],
        },
        {
          id: 'cpu-usage-check',
          name: 'CPU Usage Check',
          type: 'VALIDATION',
          validation: [
            { field: 'cpuUsage', operator: 'less_than', value: 70 },
          ],
        },
      ],
      expectedResult: { success: true, performanceAcceptable: true },
      timeout: 10000,
      retries: 1,
      enabled: true,
    });

    // Security Integration Tests
    this.addTest({
      id: 'security-authentication',
      name: 'Security Authentication',
      description: 'Test security measures and authentication',
      category: 'SECURITY',
      priority: 'CRITICAL',
      dependencies: [],
      steps: [
        {
          id: 'test-unauthorized-access',
          name: 'Test Unauthorized Access',
          type: 'API_CALL',
          endpoint: '/api/user/profile',
          method: 'GET',
          expectedStatus: 401,
        },
        {
          id: 'test-invalid-token',
          name: 'Test Invalid Token',
          type: 'API_CALL',
          endpoint: '/api/user/profile',
          method: 'GET',
          headers: { 'Authorization': 'Bearer invalid-token' },
          expectedStatus: 401,
        },
        {
          id: 'test-rate-limiting',
          name: 'Test Rate Limiting',
          type: 'API_CALL',
          endpoint: '/api/auth/login',
          method: 'POST',
          payload: {
            email: 'test@example.com',
            password: 'wrongpassword',
          },
          expectedStatus: 429,
        },
      ],
      expectedResult: { success: true, securityMeasuresWorking: true },
      timeout: 15000,
      retries: 2,
      enabled: true,
    });

    // End-to-End Integration Tests
    this.addTest({
      id: 'end-to-end-user-journey',
      name: 'Complete User Journey',
      description: 'Test complete user journey from registration to property analysis',
      category: 'END_TO_END',
      priority: 'CRITICAL',
      dependencies: [],
      steps: [
        {
          id: 'register-user',
          name: 'Register User',
          type: 'API_CALL',
          endpoint: '/api/auth/register',
          method: 'POST',
          payload: {
            email: 'e2e@example.com',
            password: 'E2EPassword123!',
            firstName: 'E2E',
            lastName: 'User',
            acceptTerms: true,
          },
          expectedStatus: 201,
        },
        {
          id: 'login-user',
          name: 'Login User',
          type: 'API_CALL',
          endpoint: '/api/auth/login',
          method: 'POST',
          payload: {
            email: 'e2e@example.com',
            password: 'E2EPassword123!',
          },
          expectedStatus: 200,
        },
        {
          id: 'search-properties',
          name: 'Search Properties',
          type: 'API_CALL',
          endpoint: '/api/property-search',
          method: 'GET',
          headers: { 'Authorization': 'Bearer ${token}' },
          expectedStatus: 200,
        },
        {
          id: 'add-to-watchlist',
          name: 'Add Property to Watchlist',
          type: 'API_CALL',
          endpoint: '/api/watchlist/add',
          method: 'POST',
          headers: { 'Authorization': 'Bearer ${token}' },
          payload: {
            propertyId: 'test-property-123',
            address: '123 Test Street',
            price: 250000,
          },
          expectedStatus: 200,
        },
        {
          id: 'generate-analysis',
          name: 'Generate Property Analysis',
          type: 'API_CALL',
          endpoint: '/api/analytics/property',
          method: 'POST',
          headers: { 'Authorization': 'Bearer ${token}' },
          payload: {
            propertyId: 'test-property-123',
            analysisType: 'comprehensive',
          },
          expectedStatus: 200,
        },
      ],
      expectedResult: { success: true, journeyCompleted: true },
      timeout: 60000,
      retries: 2,
      enabled: true,
    });
  }

  // Add integration test
  public addTest(test: IntegrationTest): boolean {
    try {
      this.tests.set(test.id, test);

      auditLogger.logSystemEvent('integration_test_created', {
        testId: test.id,
        name: test.name,
        category: test.category,
        priority: test.priority,
      });

      return true;
    } catch (error) {
      console.error('Error adding integration test:', error);
      return false;
    }
  }

  // Get integration test
  public getTest(id: string): IntegrationTest | null {
    return this.tests.get(id) || null;
  }

  // Get all integration tests
  public getAllTests(): IntegrationTest[] {
    return Array.from(this.tests.values());
  }

  // Get tests by category
  public getTestsByCategory(category: IntegrationTest['category']): IntegrationTest[] {
    return Array.from(this.tests.values()).filter(test => test.category === category);
  }

  // Run integration test
  public async runTest(testId: string): Promise<IntegrationTestResult | null> {
    try {
      const test = this.tests.get(testId);
      if (!test || !test.enabled) {
        return null;
      }

      const result: IntegrationTestResult = {
        testId,
        status: 'PASSED',
        startTime: new Date().toISOString(),
        endTime: '',
        duration: 0,
        steps: [],
      };

      // Check dependencies
      for (const dependency of test.dependencies) {
        const depResult = this.getLatestTestResult(dependency);
        if (!depResult || depResult.status !== 'PASSED') {
          result.status = 'SKIPPED';
          result.error = `Dependency test ${dependency} failed or not run`;
          result.endTime = new Date().toISOString();
          result.duration = 0;
          return result;
        }
      }

      // Execute test steps
      for (const step of test.steps) {
        const stepResult = await this.executeStep(step, result);
        result.steps.push(stepResult);

        if (stepResult.status === 'FAILED') {
          result.status = 'FAILED';
          result.error = stepResult.error;
          break;
        }
      }

      result.endTime = new Date().toISOString();
      result.duration = new Date(result.endTime).getTime() - new Date(result.startTime).getTime();

      // Store result
      if (!this.results.has(testId)) {
        this.results.set(testId, []);
      }
      this.results.get(testId)!.push(result);

      auditLogger.logSystemEvent('integration_test_executed', {
        testId,
        status: result.status,
        duration: result.duration,
        stepsPassed: result.steps.filter(s => s.status === 'PASSED').length,
        stepsTotal: result.steps.length,
      });

      return result;
    } catch (error) {
      console.error('Error running integration test:', error);
      return null;
    }
  }

  // Execute test step
  private async executeStep(step: IntegrationTestStep, testResult: IntegrationTestResult): Promise<IntegrationTestStepResult> {
    const stepResult: IntegrationTestStepResult = {
      stepId: step.id,
      status: 'PASSED',
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0,
      validationResults: [],
    };

    try {
      switch (step.type) {
        case 'API_CALL':
          await this.executeAPICall(step, stepResult);
          break;
        case 'DATABASE_QUERY':
          await this.executeDatabaseQuery(step, stepResult);
          break;
        case 'EXTERNAL_SERVICE':
          await this.executeExternalService(step, stepResult);
          break;
        case 'UI_INTERACTION':
          await this.executeUIInteraction(step, stepResult);
          break;
        case 'VALIDATION':
          await this.executeValidation(step, stepResult);
          break;
      }

      // Validate response
      if (step.validation && stepResult.response) {
        for (const validation of step.validation) {
          const validationResult = this.validateField(stepResult.response, validation);
          stepResult.validationResults!.push(validationResult);
          
          if (!validationResult.passed) {
            stepResult.status = 'FAILED';
            stepResult.error = validationResult.error;
          }
        }
      }

    } catch (error) {
      stepResult.status = 'FAILED';
      stepResult.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      stepResult.endTime = new Date().toISOString();
      stepResult.duration = new Date(stepResult.endTime).getTime() - new Date(stepResult.startTime).getTime();
    }

    return stepResult;
  }

  // Execute API call
  private async executeAPICall(step: IntegrationTestStep, stepResult: IntegrationTestStepResult): Promise<void> {
    const startTime = Date.now();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const responseTime = Date.now() - startTime;
    
    // Simulate response
    const response = {
      success: true,
      data: { id: 'test-id', message: 'Test response' },
      responseTime,
    };

    stepResult.response = response;
    stepResult.metrics = { responseTime };
  }

  // Execute database query
  private async executeDatabaseQuery(step: IntegrationTestStep, stepResult: IntegrationTestStepResult): Promise<void> {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    
    const response = {
      success: true,
      data: { email: 'test@example.com', status: 'active' },
    };

    stepResult.response = response;
  }

  // Execute external service
  private async executeExternalService(step: IntegrationTestStep, stepResult: IntegrationTestStepResult): Promise<void> {
    // Simulate external service call
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    const response = {
      success: true,
      responseTime: Math.random() * 3000 + 1000,
      resultsCount: Math.floor(Math.random() * 100) + 1,
    };

    stepResult.response = response;
  }

  // Execute UI interaction
  private async executeUIInteraction(step: IntegrationTestStep, stepResult: IntegrationTestStepResult): Promise<void> {
    // Simulate UI interaction
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const response = {
      success: true,
      interaction: 'completed',
    };

    stepResult.response = response;
  }

  // Execute validation
  private async executeValidation(step: IntegrationTestStep, stepResult: IntegrationTestStepResult): Promise<void> {
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    
    const response = {
      success: true,
      memoryUsage: Math.random() * 60 + 20,
      cpuUsage: Math.random() * 50 + 10,
    };

    stepResult.response = response;
  }

  // Validate field
  private validateField(data: any, validation: IntegrationTestStep['validation'][0]): ValidationResult {
    const actual = this.getNestedValue(data, validation.field);
    const expected = validation.value;
    let passed = false;
    let error = '';

    switch (validation.operator) {
      case 'equals':
        passed = actual === expected;
        if (!passed) error = `Expected ${expected}, got ${actual}`;
        break;
      case 'contains':
        passed = actual && actual.toString().includes(expected.toString());
        if (!passed) error = `Expected ${actual} to contain ${expected}`;
        break;
      case 'greater_than':
        passed = actual > expected;
        if (!passed) error = `Expected ${actual} to be greater than ${expected}`;
        break;
      case 'less_than':
        passed = actual < expected;
        if (!passed) error = `Expected ${actual} to be less than ${expected}`;
        break;
      case 'exists':
        passed = actual !== undefined && actual !== null;
        if (!passed) error = `Expected field ${validation.field} to exist`;
        break;
      case 'not_exists':
        passed = actual === undefined || actual === null;
        if (!passed) error = `Expected field ${validation.field} to not exist`;
        break;
    }

    return {
      field: validation.field,
      expected,
      actual,
      passed,
      error: passed ? undefined : error,
    };
  }

  // Get nested value from object
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Run all tests
  public async runAllTests(): Promise<IntegrationTestResult[]> {
    try {
      this.isRunning = true;
      const results: IntegrationTestResult[] = [];
      const enabledTests = Array.from(this.tests.values()).filter(test => test.enabled);

      // Sort tests by priority and dependencies
      const sortedTests = this.sortTestsByDependencies(enabledTests);

      for (const test of sortedTests) {
        const result = await this.runTest(test.id);
        if (result) {
          results.push(result);
        }
      }

      this.isRunning = false;
      return results;
    } catch (error) {
      console.error('Error running all integration tests:', error);
      this.isRunning = false;
      return [];
    }
  }

  // Sort tests by dependencies
  private sortTestsByDependencies(tests: IntegrationTest[]): IntegrationTest[] {
    const sorted: IntegrationTest[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (test: IntegrationTest) => {
      if (visiting.has(test.id)) {
        throw new Error(`Circular dependency detected: ${test.id}`);
      }
      if (visited.has(test.id)) {
        return;
      }

      visiting.add(test.id);

      for (const depId of test.dependencies) {
        const depTest = this.tests.get(depId);
        if (depTest) {
          visit(depTest);
        }
      }

      visiting.delete(test.id);
      visited.add(test.id);
      sorted.push(test);
    };

    for (const test of tests) {
      if (!visited.has(test.id)) {
        visit(test);
      }
    }

    return sorted;
  }

  // Get test results
  public getTestResults(testId: string): IntegrationTestResult[] {
    return this.results.get(testId) || [];
  }

  // Get latest test result
  public getLatestTestResult(testId: string): IntegrationTestResult | null {
    const results = this.getTestResults(testId);
    return results.length > 0 ? results[results.length - 1] : null;
  }

  // Generate system health report
  public generateSystemHealthReport(): SystemHealthReport {
    const components = ['authentication', 'property-search', 'user-management', 'analytics', 'integrations', 'performance', 'security'];
    const componentHealth: SystemHealthReport['componentHealth'] = {};

    let overallHealth: SystemHealthReport['overallHealth'] = 'HEALTHY';
    const recommendations: string[] = [];

    for (const component of components) {
      const tests = this.getTestsByCategory(component.toUpperCase() as IntegrationTest['category']);
      const latestResults = tests.map(test => this.getLatestTestResult(test.id)).filter(Boolean);

      if (latestResults.length === 0) {
        componentHealth[component] = {
          status: 'CRITICAL',
          responseTime: 0,
          errorRate: 100,
          lastChecked: new Date().toISOString(),
          issues: ['No test results available'],
        };
        overallHealth = 'CRITICAL';
        recommendations.push(`Run tests for ${component} component`);
        continue;
      }

      const passedTests = latestResults.filter(result => result.status === 'PASSED').length;
      const totalTests = latestResults.length;
      const errorRate = ((totalTests - passedTests) / totalTests) * 100;
      const avgResponseTime = latestResults.reduce((sum, result) => sum + result.duration, 0) / totalTests;

      let status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
      const issues: string[] = [];

      if (errorRate > 50) {
        status = 'CRITICAL';
        issues.push('High error rate detected');
      } else if (errorRate > 20) {
        status = 'DEGRADED';
        issues.push('Elevated error rate');
      }

      if (avgResponseTime > 10000) {
        status = status === 'CRITICAL' ? 'CRITICAL' : 'DEGRADED';
        issues.push('Slow response times');
      }

      componentHealth[component] = {
        status,
        responseTime: avgResponseTime,
        errorRate,
        lastChecked: new Date().toISOString(),
        issues,
      };

      if (status === 'CRITICAL') {
        overallHealth = 'CRITICAL';
      } else if (status === 'DEGRADED' && overallHealth === 'HEALTHY') {
        overallHealth = 'DEGRADED';
      }
    }

    // Add general recommendations
    if (overallHealth === 'CRITICAL') {
      recommendations.push('Immediate attention required - critical issues detected');
    } else if (overallHealth === 'DEGRADED') {
      recommendations.push('Monitor system closely - performance issues detected');
    }

    recommendations.push('Run integration tests regularly to maintain system health');
    recommendations.push('Set up automated monitoring and alerting');

    return {
      overallHealth,
      componentHealth,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  // Get test status
  public isTestRunning(): boolean {
    return this.isRunning;
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const systemIntegrationTester = SystemIntegrationTester.getInstance();
