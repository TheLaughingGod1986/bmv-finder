// Code quality and linting utilities

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface CodeQualityMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  codeDuplication: number;
  testCoverage: number;
  technicalDebt: number;
  codeSmells: number;
  securityIssues: number;
  performanceIssues: number;
  accessibilityIssues: number;
}

interface CodeQualityReport {
  timestamp: string;
  metrics: CodeQualityMetrics;
  files: {
    path: string;
    metrics: Partial<CodeQualityMetrics>;
    issues: string[];
  }[];
  summary: {
    overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    score: number;
    recommendations: string[];
  };
}

class CodeQualityAnalyzer {
  private sourceDir: string;
  private testDir: string;
  private config: {
    maxCyclomaticComplexity: number;
    maxMaintainabilityIndex: number;
    maxCodeDuplication: number;
    minTestCoverage: number;
    maxTechnicalDebt: number;
    maxCodeSmells: number;
    maxSecurityIssues: number;
    maxPerformanceIssues: number;
    maxAccessibilityIssues: number;
  };

  constructor(sourceDir: string = 'src', testDir: string = 'src/tests') {
    this.sourceDir = sourceDir;
    this.testDir = testDir;
    this.config = {
      maxCyclomaticComplexity: 10,
      maxMaintainabilityIndex: 70,
      maxCodeDuplication: 5,
      minTestCoverage: 80,
      maxTechnicalDebt: 10,
      maxCodeSmells: 5,
      maxSecurityIssues: 0,
      maxPerformanceIssues: 3,
      maxAccessibilityIssues: 2
    };
  }

  async analyze(): Promise<CodeQualityReport> {
    const files = this.getSourceFiles();
    const fileMetrics = await Promise.all(
      files.map(file => this.analyzeFile(file))
    );

    const metrics = this.calculateOverallMetrics(fileMetrics);
    const summary = this.generateSummary(metrics);

    return {
      timestamp: new Date().toISOString(),
      metrics,
      files: fileMetrics,
      summary
    };
  }

  private getSourceFiles(): string[] {
    const files: string[] = [];
    
    const scanDirectory = (dir: string): void => {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules, .next, and other build directories
          if (!['node_modules', '.next', 'dist', 'build'].includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (this.isSourceFile(item)) {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(this.sourceDir);
    return files;
  }

  private isSourceFile(filename: string): boolean {
    const ext = extname(filename);
    return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
  }

  private async analyzeFile(filePath: string): Promise<{
    path: string;
    metrics: Partial<CodeQualityMetrics>;
    issues: string[];
  }> {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const metrics: Partial<CodeQualityMetrics> = {
      linesOfCode: this.countLinesOfCode(lines),
      cyclomaticComplexity: this.calculateCyclomaticComplexity(content),
      maintainabilityIndex: this.calculateMaintainabilityIndex(content),
      codeDuplication: this.calculateCodeDuplication(content),
      technicalDebt: this.calculateTechnicalDebt(content),
      codeSmells: this.countCodeSmells(content),
      securityIssues: this.countSecurityIssues(content),
      performanceIssues: this.countPerformanceIssues(content),
      accessibilityIssues: this.countAccessibilityIssues(content)
    };

    const issues = this.identifyIssues(filePath, content, metrics);

    return {
      path: filePath,
      metrics,
      issues
    };
  }

  private countLinesOfCode(lines: string[]): number {
    return lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
    }).length;
  }

  private calculateCyclomaticComplexity(content: string): number {
    let complexity = 1; // Base complexity
    
    // Count decision points
    const decisionPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g
    ];

    for (const pattern of decisionPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private calculateMaintainabilityIndex(content: string): number {
    const linesOfCode = content.split('\n').length;
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(content);
    const commentRatio = this.calculateCommentRatio(content);
    
    // Simplified maintainability index calculation
    const maintainability = Math.max(0, 100 - 
      (linesOfCode * 0.1) - 
      (cyclomaticComplexity * 2) + 
      (commentRatio * 10)
    );

    return Math.min(100, maintainability);
  }

  private calculateCommentRatio(content: string): number {
    const lines = content.split('\n');
    const totalLines = lines.length;
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
    }).length;

    return totalLines > 0 ? (commentLines / totalLines) * 100 : 0;
  }

  private calculateCodeDuplication(content: string): number {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const lineCounts = new Map<string, number>();
    
    for (const line of lines) {
      const normalized = line.trim().toLowerCase();
      lineCounts.set(normalized, (lineCounts.get(normalized) || 0) + 1);
    }

    const duplicates = Array.from(lineCounts.values()).filter(count => count > 1);
    const totalDuplicates = duplicates.reduce((sum, count) => sum + count - 1, 0);
    
    return lines.length > 0 ? (totalDuplicates / lines.length) * 100 : 0;
  }

  private calculateTechnicalDebt(content: string): number {
    let debt = 0;
    
    // Check for technical debt indicators
    const debtPatterns = [
      { pattern: /TODO|FIXME|HACK|XXX/g, weight: 1 },
      { pattern: /any\s*:/g, weight: 2 },
      { pattern: /@ts-ignore/g, weight: 3 },
      { pattern: /console\.log/g, weight: 1 },
      { pattern: /debugger/g, weight: 2 },
      { pattern: /eval\s*\(/g, weight: 5 },
      { pattern: /innerHTML/g, weight: 2 },
      { pattern: /document\.write/g, weight: 3 }
    ];

    for (const { pattern, weight } of debtPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        debt += matches.length * weight;
      }
    }

    return debt;
  }

  private countCodeSmells(content: string): number {
    let smells = 0;
    
    // Check for code smells
    const smellPatterns = [
      { pattern: /function\s+\w+\s*\([^)]*\)\s*{[^}]{500,}}/g, weight: 1 }, // Long functions
      { pattern: /class\s+\w+\s*{[^}]{1000,}}/g, weight: 1 }, // Long classes
      { pattern: /if\s*\([^)]*\)\s*{[^}]*if\s*\([^)]*\)\s*{[^}]*if\s*\([^)]*\)/g, weight: 1 }, // Nested ifs
      { pattern: /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/g, weight: 1 }, // Nested loops
      { pattern: /var\s+/g, weight: 1 }, // Use of var
      { pattern: /==/g, weight: 1 }, // Loose equality
      { pattern: /!==/g, weight: 1 }, // Loose inequality
      { pattern: /with\s*\(/g, weight: 2 } // Use of with
    ];

    for (const { pattern, weight } of smellPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        smells += matches.length * weight;
      }
    }

    return smells;
  }

  private countSecurityIssues(content: string): number {
    let issues = 0;
    
    // Check for security issues
    const securityPatterns = [
      { pattern: /eval\s*\(/g, weight: 1 },
      { pattern: /innerHTML\s*=/g, weight: 1 },
      { pattern: /document\.write/g, weight: 1 },
      { pattern: /setTimeout\s*\(\s*['"][^'"]*['"]/g, weight: 1 },
      { pattern: /setInterval\s*\(\s*['"][^'"]*['"]/g, weight: 1 },
      { pattern: /new\s+Function\s*\(/g, weight: 1 },
      { pattern: /\.innerHTML\s*=/g, weight: 1 },
      { pattern: /\.outerHTML\s*=/g, weight: 1 }
    ];

    for (const { pattern, weight } of securityPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        issues += matches.length * weight;
      }
    }

    return issues;
  }

  private countPerformanceIssues(content: string): number {
    let issues = 0;
    
    // Check for performance issues
    const performancePatterns = [
      { pattern: /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/g, weight: 1 }, // Nested loops
      { pattern: /while\s*\([^)]*\)\s*{[^}]*while\s*\([^)]*\)/g, weight: 1 }, // Nested while loops
      { pattern: /\.innerHTML\s*=/g, weight: 1 }, // DOM manipulation
      { pattern: /document\.getElementById/g, weight: 1 }, // DOM queries
      { pattern: /document\.querySelector/g, weight: 1 }, // DOM queries
      { pattern: /setInterval/g, weight: 1 }, // Timers
      { pattern: /setTimeout/g, weight: 1 } // Timers
    ];

    for (const { pattern, weight } of performancePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        issues += matches.length * weight;
      }
    }

    return issues;
  }

  private countAccessibilityIssues(content: string): number {
    let issues = 0;
    
    // Check for accessibility issues
    const accessibilityPatterns = [
      { pattern: /<img[^>]*(?!alt=)/g, weight: 1 }, // Images without alt
      { pattern: /<input[^>]*(?!aria-label)/g, weight: 1 }, // Inputs without labels
      { pattern: /<button[^>]*(?!aria-label)/g, weight: 1 }, // Buttons without labels
      { pattern: /<div[^>]*onClick/g, weight: 1 }, // Divs with click handlers
      { pattern: /<span[^>]*onClick/g, weight: 1 }, // Spans with click handlers
      { pattern: /tabIndex\s*=\s*[^0-9]/g, weight: 1 }, // Invalid tabIndex
      { pattern: /role\s*=\s*['"][^'"]*['"]/g, weight: 0 } // Has role (good)
    ];

    for (const { pattern, weight } of accessibilityPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        issues += matches.length * weight;
      }
    }

    return issues;
  }

  private identifyIssues(filePath: string, content: string, metrics: Partial<CodeQualityMetrics>): string[] {
    const issues: string[] = [];

    if (metrics.cyclomaticComplexity && metrics.cyclomaticComplexity > this.config.maxCyclomaticComplexity) {
      issues.push(`High cyclomatic complexity: ${metrics.cyclomaticComplexity} (max: ${this.config.maxCyclomaticComplexity})`);
    }

    if (metrics.maintainabilityIndex && metrics.maintainabilityIndex < this.config.maxMaintainabilityIndex) {
      issues.push(`Low maintainability index: ${metrics.maintainabilityIndex} (min: ${this.config.maxMaintainabilityIndex})`);
    }

    if (metrics.codeDuplication && metrics.codeDuplication > this.config.maxCodeDuplication) {
      issues.push(`High code duplication: ${metrics.codeDuplication.toFixed(2)}% (max: ${this.config.maxCodeDuplication}%)`);
    }

    if (metrics.technicalDebt && metrics.technicalDebt > this.config.maxTechnicalDebt) {
      issues.push(`High technical debt: ${metrics.technicalDebt} (max: ${this.config.maxTechnicalDebt})`);
    }

    if (metrics.codeSmells && metrics.codeSmells > this.config.maxCodeSmells) {
      issues.push(`Code smells detected: ${metrics.codeSmells} (max: ${this.config.maxCodeSmells})`);
    }

    if (metrics.securityIssues && metrics.securityIssues > this.config.maxSecurityIssues) {
      issues.push(`Security issues detected: ${metrics.securityIssues} (max: ${this.config.maxSecurityIssues})`);
    }

    if (metrics.performanceIssues && metrics.performanceIssues > this.config.maxPerformanceIssues) {
      issues.push(`Performance issues detected: ${metrics.performanceIssues} (max: ${this.config.maxPerformanceIssues})`);
    }

    if (metrics.accessibilityIssues && metrics.accessibilityIssues > this.config.maxAccessibilityIssues) {
      issues.push(`Accessibility issues detected: ${metrics.accessibilityIssues} (max: ${this.config.maxAccessibilityIssues})`);
    }

    return issues;
  }

  private calculateOverallMetrics(fileMetrics: any[]): CodeQualityMetrics {
    const totals = fileMetrics.reduce((acc, file) => {
      Object.keys(file.metrics).forEach(key => {
        if (typeof file.metrics[key] === 'number') {
          acc[key] = (acc[key] || 0) + file.metrics[key];
        }
      });
      return acc;
    }, {});

    const fileCount = fileMetrics.length;

    return {
      linesOfCode: totals.linesOfCode || 0,
      cyclomaticComplexity: totals.cyclomaticComplexity || 0,
      maintainabilityIndex: fileCount > 0 ? (totals.maintainabilityIndex || 0) / fileCount : 0,
      codeDuplication: fileCount > 0 ? (totals.codeDuplication || 0) / fileCount : 0,
      testCoverage: this.calculateTestCoverage(),
      technicalDebt: totals.technicalDebt || 0,
      codeSmells: totals.codeSmells || 0,
      securityIssues: totals.securityIssues || 0,
      performanceIssues: totals.performanceIssues || 0,
      accessibilityIssues: totals.accessibilityIssues || 0
    };
  }

  private calculateTestCoverage(): number {
    // Simplified test coverage calculation
    // In a real implementation, you would use a coverage tool
    const sourceFiles = this.getSourceFiles();
    const testFiles = this.getTestFiles();
    
    if (sourceFiles.length === 0) return 0;
    
    // Estimate coverage based on test file ratio
    const coverage = Math.min(100, (testFiles.length / sourceFiles.length) * 100);
    return coverage;
  }

  private getTestFiles(): string[] {
    const files: string[] = [];
    
    const scanDirectory = (dir: string): void => {
      try {
        const items = readdirSync(dir);
        
        for (const item of items) {
          const fullPath = join(dir, item);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (item.includes('.test.') || item.includes('.spec.')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read
      }
    };

    scanDirectory(this.testDir);
    return files;
  }

  private generateSummary(metrics: CodeQualityMetrics): {
    overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    score: number;
    recommendations: string[];
  } {
    let score = 100;
    const recommendations: string[] = [];

    // Calculate score based on metrics
    if (metrics.cyclomaticComplexity > this.config.maxCyclomaticComplexity) {
      score -= 10;
      recommendations.push('Reduce cyclomatic complexity by breaking down complex functions');
    }

    if (metrics.maintainabilityIndex < this.config.maxMaintainabilityIndex) {
      score -= 15;
      recommendations.push('Improve code maintainability by adding comments and simplifying logic');
    }

    if (metrics.codeDuplication > this.config.maxCodeDuplication) {
      score -= 10;
      recommendations.push('Reduce code duplication by extracting common functionality');
    }

    if (metrics.testCoverage < this.config.minTestCoverage) {
      score -= 20;
      recommendations.push(`Increase test coverage to at least ${this.config.minTestCoverage}%`);
    }

    if (metrics.technicalDebt > this.config.maxTechnicalDebt) {
      score -= 15;
      recommendations.push('Address technical debt by fixing TODOs and code issues');
    }

    if (metrics.codeSmells > this.config.maxCodeSmells) {
      score -= 10;
      recommendations.push('Refactor code to eliminate code smells');
    }

    if (metrics.securityIssues > this.config.maxSecurityIssues) {
      score -= 20;
      recommendations.push('Fix security issues immediately');
    }

    if (metrics.performanceIssues > this.config.maxPerformanceIssues) {
      score -= 10;
      recommendations.push('Optimize performance-critical code');
    }

    if (metrics.accessibilityIssues > this.config.maxAccessibilityIssues) {
      score -= 5;
      recommendations.push('Improve accessibility compliance');
    }

    // Determine overall rating
    let overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    if (score >= 90) overall = 'excellent';
    else if (score >= 80) overall = 'good';
    else if (score >= 70) overall = 'fair';
    else if (score >= 60) overall = 'poor';
    else overall = 'critical';

    return {
      overall,
      score: Math.max(0, score),
      recommendations
    };
  }
}

export { CodeQualityAnalyzer, CodeQualityReport, CodeQualityMetrics };
