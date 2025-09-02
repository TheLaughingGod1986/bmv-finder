// Test runner and configuration

import { testFramework } from '@/lib/testing/testFramework';
import { performanceMonitor } from '@/lib/performanceMonitor';

// Import all test suites
import './unit/authManager.test';
import './unit/encryptionManager.test';
import './integration/apiIntegration.test';
import './e2e/userJourney.test';
import './performance/loadTesting.test';
import './security/securityTesting.test';

interface TestConfig {
  includeUnit: boolean;
  includeIntegration: boolean;
  includeE2E: boolean;
  includePerformance: boolean;
  includeSecurity: boolean;
  parallel: boolean;
  verbose: boolean;
  timeout: number;
  stopOnFirstFailure: boolean;
  outputFormat: 'console' | 'json' | 'html';
  outputFile?: string;
}

class TestRunner {
  private config: TestConfig;

  constructor(config: Partial<TestConfig> = {}) {
    this.config = {
      includeUnit: true,
      includeIntegration: true,
      includeE2E: true,
      includePerformance: true,
      includeSecurity: true,
      parallel: false,
      verbose: false,
      timeout: 30000,
      stopOnFirstFailure: false,
      outputFormat: 'console',
      ...config
    };
  }

  async run(): Promise<void> {
    console.log('🧪 Starting Test Suite...');
    console.log('========================');

    const startTime = Date.now();

    try {
      // Configure test framework
      testFramework.config = {
        timeout: this.config.timeout,
        parallel: this.config.parallel,
        verbose: this.config.verbose,
        stopOnFirstFailure: this.config.stopOnFirstFailure,
        includeOnly: false,
        excludeSkipped: false
      };

      // Run tests
      const results = await testFramework.run();
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Generate report
      await this.generateReport(results, totalDuration);

      // Print summary
      this.printSummary(results, totalDuration);

    } catch (error: any) {
      console.error('❌ Test runner error:', error.message);
      process.exit(1);
    }
  }

  private async generateReport(results: any[], totalDuration: number): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: testFramework.getSummary(),
      results: results.map(suite => ({
        name: suite.name,
        status: suite.status,
        duration: suite.duration,
        passed: suite.passed,
        failed: suite.failed,
        skipped: suite.skipped,
        tests: suite.results.map((test: any) => ({
          name: test.name,
          status: test.status,
          duration: test.duration,
          error: test.error?.message
        }))
      }))
    };

    switch (this.config.outputFormat) {
      case 'json':
        await this.writeJsonReport(report);
        break;
      case 'html':
        await this.writeHtmlReport(report);
        break;
      default:
        // Console output is handled by printSummary
        break;
    }
  }

  private async writeJsonReport(report: any): Promise<void> {
    const fs = require('fs').promises;
    const filename = this.config.outputFile || `test-report-${Date.now()}.json`;
    
    try {
      await fs.writeFile(filename, JSON.stringify(report, null, 2));
      console.log(`📄 JSON report written to: ${filename}`);
    } catch (error) {
      console.error('Failed to write JSON report:', error);
    }
  }

  private async writeHtmlReport(report: any): Promise<void> {
    const fs = require('fs').promises;
    const filename = this.config.outputFile || `test-report-${Date.now()}.html`;
    
    const html = this.generateHtmlReport(report);
    
    try {
      await fs.writeFile(filename, html);
      console.log(`📄 HTML report written to: ${filename}`);
    } catch (error) {
      console.error('Failed to write HTML report:', error);
    }
  }

  private generateHtmlReport(report: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-item { background: #fff; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .summary-item h3 { margin: 0 0 10px 0; color: #333; }
        .summary-item .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .suite { margin: 20px 0; border: 1px solid #ddd; border-radius: 5px; }
        .suite-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
        .suite-header h3 { margin: 0; }
        .test { padding: 10px 15px; border-bottom: 1px solid #eee; }
        .test:last-child { border-bottom: none; }
        .test-name { font-weight: bold; }
        .test-status { float: right; }
        .test-error { color: #dc3545; font-size: 0.9em; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Duration: ${report.duration}ms</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <h3>Total Suites</h3>
            <div class="value">${report.summary.totalSuites}</div>
        </div>
        <div class="summary-item">
            <h3>Total Tests</h3>
            <div class="value">${report.summary.totalTests}</div>
        </div>
        <div class="summary-item">
            <h3>Passed</h3>
            <div class="value passed">${report.summary.passed}</div>
        </div>
        <div class="summary-item">
            <h3>Failed</h3>
            <div class="value failed">${report.summary.failed}</div>
        </div>
        <div class="summary-item">
            <h3>Skipped</h3>
            <div class="value skipped">${report.summary.skipped}</div>
        </div>
        <div class="summary-item">
            <h3>Success Rate</h3>
            <div class="value">${report.summary.successRate.toFixed(2)}%</div>
        </div>
    </div>

    ${report.results.map((suite: any) => `
        <div class="suite">
            <div class="suite-header">
                <h3>${suite.name}</h3>
                <p>Status: ${suite.status} | Duration: ${suite.duration}ms | Passed: ${suite.passed} | Failed: ${suite.failed} | Skipped: ${suite.skipped}</p>
            </div>
            ${suite.tests.map((test: any) => `
                <div class="test">
                    <span class="test-name">${test.name}</span>
                    <span class="test-status ${test.status}">${test.status}</span>
                    ${test.error ? `<div class="test-error">${test.error}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>`;
  }

  private printSummary(results: any[], totalDuration: number): void {
    const summary = testFramework.getSummary();
    
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`Total Suites: ${summary.totalSuites}`);
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${summary.successRate.toFixed(2)}%`);

    if (summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.forEach(suite => {
        if (suite.failed > 0) {
          console.log(`\n📁 ${suite.name}:`);
          suite.results.forEach((test: any) => {
            if (test.status === 'failed') {
              console.log(`   ❌ ${test.name}: ${test.error?.message || 'Unknown error'}`);
            }
          });
        }
      });
    }

    if (summary.passed === summary.totalTests) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log(`\n⚠️  ${summary.failed} test(s) failed`);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: Partial<TestConfig> = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--unit-only':
        config.includeUnit = true;
        config.includeIntegration = false;
        config.includeE2E = false;
        config.includePerformance = false;
        config.includeSecurity = false;
        break;
      case '--integration-only':
        config.includeUnit = false;
        config.includeIntegration = true;
        config.includeE2E = false;
        config.includePerformance = false;
        config.includeSecurity = false;
        break;
      case '--e2e-only':
        config.includeUnit = false;
        config.includeIntegration = false;
        config.includeE2E = true;
        config.includePerformance = false;
        config.includeSecurity = false;
        break;
      case '--performance-only':
        config.includeUnit = false;
        config.includeIntegration = false;
        config.includeE2E = false;
        config.includePerformance = true;
        config.includeSecurity = false;
        break;
      case '--security-only':
        config.includeUnit = false;
        config.includeIntegration = false;
        config.includeE2E = false;
        config.includePerformance = false;
        config.includeSecurity = true;
        break;
      case '--parallel':
        config.parallel = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--stop-on-failure':
        config.stopOnFirstFailure = true;
        break;
      case '--timeout':
        config.timeout = parseInt(args[++i]) || 30000;
        break;
      case '--output':
        config.outputFormat = args[++i] as 'console' | 'json' | 'html';
        break;
      case '--output-file':
        config.outputFile = args[++i];
        break;
      case '--help':
        console.log(`
🧪 Test Runner

Usage: npm run test [options]

Options:
  --unit-only              Run only unit tests
  --integration-only       Run only integration tests
  --e2e-only              Run only end-to-end tests
  --performance-only      Run only performance tests
  --security-only         Run only security tests
  --parallel              Run tests in parallel
  --verbose               Verbose output
  --stop-on-failure       Stop on first failure
  --timeout <ms>          Test timeout in milliseconds
  --output <format>       Output format (console, json, html)
  --output-file <file>    Output file for reports
  --help                  Show this help message

Examples:
  npm run test -- --unit-only
  npm run test -- --parallel --verbose
  npm run test -- --output json --output-file report.json
        `);
        process.exit(0);
        break;
    }
  }

  // Run tests
  const runner = new TestRunner(config);
  runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner, TestConfig };
