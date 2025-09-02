// Comprehensive unit testing framework

interface TestCase {
  name: string;
  description?: string;
  setup?: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
  test: () => void | Promise<void>;
  timeout?: number;
  skip?: boolean;
  only?: boolean;
}

interface TestSuite {
  name: string;
  description?: string;
  setup?: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
  tests: TestCase[];
  timeout?: number;
  skip?: boolean;
  only?: boolean;
}

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  duration: number;
  error?: Error;
  message?: string;
}

interface TestSuiteResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  results: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
  error?: Error;
}

interface TestRunnerConfig {
  timeout: number;
  parallel: boolean;
  verbose: boolean;
  stopOnFirstFailure: boolean;
  includeOnly: boolean;
  excludeSkipped: boolean;
}

class TestFramework {
  private suites: TestSuite[] = [];
  private config: TestRunnerConfig;
  private results: TestSuiteResult[] = [];

  constructor(config: Partial<TestRunnerConfig> = {}) {
    this.config = {
      timeout: 5000,
      parallel: false,
      verbose: false,
      stopOnFirstFailure: false,
      includeOnly: false,
      excludeSkipped: false,
      ...config
    };
  }

  // Add test suite
  describe(name: string, description: string, suiteConfig: Partial<TestSuite> = {}): void {
    const suite: TestSuite = {
      name,
      description,
      tests: [],
      ...suiteConfig
    };
    this.suites.push(suite);
  }

  // Add test case
  it(name: string, test: () => void | Promise<void>, testConfig: Partial<TestCase> = {}): void {
    if (this.suites.length === 0) {
      throw new Error('No test suite found. Use describe() to create a test suite first.');
    }

    const testCase: TestCase = {
      name,
      test,
      ...testConfig
    };

    this.suites[this.suites.length - 1].tests.push(testCase);
  }

  // Skip test
  it.skip(name: string, test: () => void | Promise<void>, testConfig: Partial<TestCase> = {}): void {
    this.it(name, test, { ...testConfig, skip: true });
  }

  // Only run this test
  it.only(name: string, test: () => void | Promise<void>, testConfig: Partial<TestCase> = {}): void {
    this.it(name, test, { ...testConfig, only: true });
  }

  // Run all tests
  async run(): Promise<TestSuiteResult[]> {
    this.results = [];
    
    // Filter suites based on config
    let suitesToRun = this.suites;
    
    if (this.config.includeOnly) {
      suitesToRun = suitesToRun.filter(suite => suite.only || suite.tests.some(test => test.only));
    }
    
    if (this.config.excludeSkipped) {
      suitesToRun = suitesToRun.filter(suite => !suite.skip);
    }

    for (const suite of suitesToRun) {
      const result = await this.runSuite(suite);
      this.results.push(result);
      
      if (this.config.stopOnFirstFailure && result.status === 'failed') {
        break;
      }
    }

    return this.results;
  }

  // Run test suite
  private async runSuite(suite: TestSuite): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    try {
      // Run suite setup
      if (suite.setup) {
        await this.runWithTimeout(suite.setup, suite.timeout || this.config.timeout);
      }

      // Filter tests based on config
      let testsToRun = suite.tests;
      
      if (this.config.includeOnly) {
        testsToRun = testsToRun.filter(test => test.only);
      }
      
      if (this.config.excludeSkipped) {
        testsToRun = testsToRun.filter(test => !test.skip);
      }

      // Run tests
      if (this.config.parallel) {
        const testPromises = testsToRun.map(test => this.runTest(test, suite));
        const testResults = await Promise.all(testPromises);
        results.push(...testResults);
      } else {
        for (const test of testsToRun) {
          const result = await this.runTest(test, suite);
          results.push(result);
          
          if (this.config.stopOnFirstFailure && result.status === 'failed') {
            break;
          }
        }
      }

      // Count results
      results.forEach(result => {
        switch (result.status) {
          case 'passed':
            passed++;
            break;
          case 'failed':
            failed++;
            break;
          case 'skipped':
            skipped++;
            break;
        }
      });

      // Run suite teardown
      if (suite.teardown) {
        await this.runWithTimeout(suite.teardown, suite.timeout || this.config.timeout);
      }

    } catch (error: any) {
      return {
        name: suite.name,
        status: 'failed',
        duration: Date.now() - startTime,
        results,
        passed,
        failed,
        skipped,
        error
      };
    }

    return {
      name: suite.name,
      status: failed > 0 ? 'failed' : 'passed',
      duration: Date.now() - startTime,
      results,
      passed,
      failed,
      skipped
    };
  }

  // Run test case
  private async runTest(test: TestCase, suite: TestSuite): Promise<TestResult> {
    const startTime = Date.now();

    if (test.skip) {
      return {
        name: test.name,
        status: 'skipped',
        duration: 0
      };
    }

    try {
      await this.runWithTimeout(test.test, test.timeout || suite.timeout || this.config.timeout);
      
      return {
        name: test.name,
        status: 'passed',
        duration: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        name: test.name,
        status: 'failed',
        duration: Date.now() - startTime,
        error,
        message: error.message
      };
    }
  }

  // Run function with timeout
  private async runWithTimeout(fn: () => void | Promise<void>, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timeout after ${timeout}ms`));
      }, timeout);

      Promise.resolve(fn())
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // Get test results summary
  getSummary(): {
    totalSuites: number;
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    successRate: number;
  } {
    const totalSuites = this.results.length;
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let duration = 0;

    this.results.forEach(result => {
      totalTests += result.results.length;
      passed += result.passed;
      failed += result.failed;
      skipped += result.skipped;
      duration += result.duration;
    });

    const successRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;

    return {
      totalSuites,
      totalTests,
      passed,
      failed,
      skipped,
      duration,
      successRate
    };
  }

  // Print test results
  printResults(): void {
    const summary = this.getSummary();
    
    console.log('\n🧪 Test Results Summary');
    console.log('========================');
    console.log(`Total Suites: ${summary.totalSuites}`);
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Duration: ${summary.duration}ms`);
    console.log(`Success Rate: ${summary.successRate.toFixed(2)}%`);

    if (this.config.verbose) {
      console.log('\n📋 Detailed Results');
      console.log('==================');
      
      this.results.forEach(suiteResult => {
        console.log(`\n📁 ${suiteResult.name}`);
        console.log(`   Status: ${suiteResult.status}`);
        console.log(`   Duration: ${suiteResult.duration}ms`);
        
        suiteResult.results.forEach(testResult => {
          const status = testResult.status === 'passed' ? '✅' : 
                        testResult.status === 'failed' ? '❌' : '⏭️';
          console.log(`   ${status} ${testResult.name} (${testResult.duration}ms)`);
          
          if (testResult.error && this.config.verbose) {
            console.log(`      Error: ${testResult.error.message}`);
          }
        });
      });
    }
  }

  // Clear all tests
  clear(): void {
    this.suites = [];
    this.results = [];
  }
}

// Assertion utilities
class Assert {
  static equal(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  }

  static notEqual(actual: any, expected: any, message?: string): void {
    if (actual === expected) {
      throw new Error(message || `Expected not to be ${expected}`);
    }
  }

  static deepEqual(actual: any, expected: any, message?: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
    }
  }

  static isTrue(condition: boolean, message?: string): void {
    if (!condition) {
      throw new Error(message || 'Expected condition to be true');
    }
  }

  static isFalse(condition: boolean, message?: string): void {
    if (condition) {
      throw new Error(message || 'Expected condition to be false');
    }
  }

  static isNull(value: any, message?: string): void {
    if (value !== null) {
      throw new Error(message || `Expected null, but got ${value}`);
    }
  }

  static isNotNull(value: any, message?: string): void {
    if (value === null) {
      throw new Error(message || 'Expected not to be null');
    }
  }

  static isUndefined(value: any, message?: string): void {
    if (value !== undefined) {
      throw new Error(message || `Expected undefined, but got ${value}`);
    }
  }

  static isDefined(value: any, message?: string): void {
    if (value === undefined) {
      throw new Error(message || 'Expected to be defined');
    }
  }

  static throws(fn: () => void, expectedError?: string | RegExp, message?: string): void {
    try {
      fn();
      throw new Error(message || 'Expected function to throw an error');
    } catch (error: any) {
      if (expectedError) {
        if (typeof expectedError === 'string') {
          if (!error.message.includes(expectedError)) {
            throw new Error(message || `Expected error message to contain "${expectedError}", but got "${error.message}"`);
          }
        } else if (expectedError instanceof RegExp) {
          if (!expectedError.test(error.message)) {
            throw new Error(message || `Expected error message to match ${expectedError}, but got "${error.message}"`);
          }
        }
      }
    }
  }

  static async throwsAsync(fn: () => Promise<void>, expectedError?: string | RegExp, message?: string): Promise<void> {
    try {
      await fn();
      throw new Error(message || 'Expected async function to throw an error');
    } catch (error: any) {
      if (expectedError) {
        if (typeof expectedError === 'string') {
          if (!error.message.includes(expectedError)) {
            throw new Error(message || `Expected error message to contain "${expectedError}", but got "${error.message}"`);
          }
        } else if (expectedError instanceof RegExp) {
          if (!expectedError.test(error.message)) {
            throw new Error(message || `Expected error message to match ${expectedError}, but got "${error.message}"`);
          }
        }
      }
    }
  }

  static isArray(value: any, message?: string): void {
    if (!Array.isArray(value)) {
      throw new Error(message || `Expected array, but got ${typeof value}`);
    }
  }

  static isObject(value: any, message?: string): void {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(message || `Expected object, but got ${typeof value}`);
    }
  }

  static isString(value: any, message?: string): void {
    if (typeof value !== 'string') {
      throw new Error(message || `Expected string, but got ${typeof value}`);
    }
  }

  static isNumber(value: any, message?: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(message || `Expected number, but got ${typeof value}`);
    }
  }

  static isBoolean(value: any, message?: string): void {
    if (typeof value !== 'boolean') {
      throw new Error(message || `Expected boolean, but got ${typeof value}`);
    }
  }

  static isFunction(value: any, message?: string): void {
    if (typeof value !== 'function') {
      throw new Error(message || `Expected function, but got ${typeof value}`);
    }
  }

  static isInstanceOf(value: any, constructor: any, message?: string): void {
    if (!(value instanceof constructor)) {
      throw new Error(message || `Expected instance of ${constructor.name}, but got ${typeof value}`);
    }
  }

  static isGreaterThan(actual: number, expected: number, message?: string): void {
    if (actual <= expected) {
      throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
    }
  }

  static isLessThan(actual: number, expected: number, message?: string): void {
    if (actual >= expected) {
      throw new Error(message || `Expected ${actual} to be less than ${expected}`);
    }
  }

  static isGreaterThanOrEqual(actual: number, expected: number, message?: string): void {
    if (actual < expected) {
      throw new Error(message || `Expected ${actual} to be greater than or equal to ${expected}`);
    }
  }

  static isLessThanOrEqual(actual: number, expected: number, message?: string): void {
    if (actual > expected) {
      throw new Error(message || `Expected ${actual} to be less than or equal to ${expected}`);
    }
  }

  static isInRange(actual: number, min: number, max: number, message?: string): void {
    if (actual < min || actual > max) {
      throw new Error(message || `Expected ${actual} to be between ${min} and ${max}`);
    }
  }

  static isMatch(actual: string, pattern: RegExp, message?: string): void {
    if (!pattern.test(actual)) {
      throw new Error(message || `Expected "${actual}" to match ${pattern}`);
    }
  }

  static isNotMatch(actual: string, pattern: RegExp, message?: string): void {
    if (pattern.test(actual)) {
      throw new Error(message || `Expected "${actual}" not to match ${pattern}`);
    }
  }

  static isLength(actual: any[], expected: number, message?: string): void {
    if (actual.length !== expected) {
      throw new Error(message || `Expected array length ${expected}, but got ${actual.length}`);
    }
  }

  static isNotEmpty(actual: any[], message?: string): void {
    if (actual.length === 0) {
      throw new Error(message || 'Expected array to not be empty');
    }
  }

  static isEmpty(actual: any[], message?: string): void {
    if (actual.length > 0) {
      throw new Error(message || 'Expected array to be empty');
    }
  }

  static contains(actual: any[], expected: any, message?: string): void {
    if (!actual.includes(expected)) {
      throw new Error(message || `Expected array to contain ${expected}`);
    }
  }

  static notContains(actual: any[], expected: any, message?: string): void {
    if (actual.includes(expected)) {
      throw new Error(message || `Expected array not to contain ${expected}`);
    }
  }
}

// Mock utilities
class Mock {
  private static mocks: Map<string, any> = new Map();

  static fn(implementation?: (...args: any[]) => any): jest.Mock {
    const mockFn = jest.fn(implementation);
    return mockFn;
  }

  static spyOn(object: any, method: string): jest.SpyInstance {
    return jest.spyOn(object, method);
  }

  static clearAllMocks(): void {
    jest.clearAllMocks();
  }

  static resetAllMocks(): void {
    jest.resetAllMocks();
  }

  static restoreAllMocks(): void {
    jest.restoreAllMocks();
  }
}

// Export framework
export const testFramework = new TestFramework();
export const assert = Assert;
export const mock = Mock;

// Export types
export type { TestCase, TestSuite, TestResult, TestSuiteResult, TestRunnerConfig };
