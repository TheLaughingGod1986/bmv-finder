import crypto from 'crypto';

export interface TestResult {
  id: string;
  testName: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  error?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  tests: Test[];
}

export interface Test {
  id: string;
  name: string;
  testFunction: () => Promise<void>;
  skip: boolean;
}

export class TestFramework {
  private static instance: TestFramework;
  private suites: Map<string, TestSuite> = new Map();
  private results: TestResult[] = [];

  private constructor() {}

  public static getInstance(): TestFramework {
    if (!TestFramework.instance) {
      TestFramework.instance = new TestFramework();
    }
    return TestFramework.instance;
  }

  describe(name: string, suiteFunction: () => void): TestSuite {
    const suite: TestSuite = {
      id: crypto.randomUUID(),
      name,
      tests: []
    };

    suiteFunction();
    this.suites.set(suite.id, suite);
    return suite;
  }

  it(name: string, testFunction: () => Promise<void>): Test {
    const test: Test = {
      id: crypto.randomUUID(),
      name,
      testFunction,
      skip: false
    };

    // Add to current suite if available
    const suites = Array.from(this.suites.values());
    if (suites.length > 0) {
      suites[suites.length - 1].tests.push(test);
    }

    return test;
  }

  async runTests(): Promise<TestResult[]> {
    this.results = [];
    
    for (const suite of this.suites.values()) {
      for (const test of suite.tests) {
        const result = await this.runTest(test);
        this.results.push(result);
      }
    }

    return this.results;
  }

  private async runTest(test: Test): Promise<TestResult> {
    const startTime = Date.now();
    
    if (test.skip) {
      return {
        id: crypto.randomUUID(),
        testName: test.name,
        status: 'SKIPPED',
        duration: 0
      };
    }

    try {
      await test.testFunction();
      return {
        id: crypto.randomUUID(),
        testName: test.name,
        status: 'PASSED',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        testName: test.name,
        status: 'FAILED',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getResults(): TestResult[] {
    return this.results;
  }
}

export const testFramework = TestFramework.getInstance();
export const describe = (name: string, suiteFunction: () => void) => testFramework.describe(name, suiteFunction);
export const it = (name: string, testFunction: () => Promise<void>) => testFramework.it(name, testFunction);
export const expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, but got ${actual}`);
    }
  },
  toEqual: (expected: any) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
    }
  },
  toBeTruthy: () => {
    if (!actual) {
      throw new Error(`Expected truthy value, but got ${actual}`);
    }
  },
  toBeFalsy: () => {
    if (actual) {
      throw new Error(`Expected falsy value, but got ${actual}`);
    }
  }
});