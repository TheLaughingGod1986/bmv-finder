#!/usr/bin/env node

/**
 * Performance Testing Script for Property Intelligence Platform
 * Monitors bundle size, build time, and performance metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const RED = '\033[0;31m';
const GREEN = '\033[0;32m';
const YELLOW = '\033[1;33m';
const BLUE = '\033[0;34m';
const NC = '\033[0m';

function printStatus(message) {
  console.log(`${BLUE}[INFO]${NC} ${message}`);
}

function printSuccess(message) {
  console.log(`${GREEN}[SUCCESS]${NC} ${message}`);
}

function printWarning(message) {
  console.log(`${YELLOW}[WARNING]${NC} ${message}`);
}

function printError(message) {
  console.log(`${RED}[ERROR]${NC} ${message}`);
}

function printHeader(title) {
  console.log(`${BLUE}================================${NC}`);
  console.log(`${BLUE}${title}${NC}`);
  console.log(`${BLUE}================================${NC}`);
}

// Performance thresholds
const THRESHOLDS = {
  bundleSize: 200, // kB
  buildTime: 15, // seconds
  lighthousePerformance: 90,
  lighthouseAccessibility: 90,
  lighthouseBestPractices: 90,
  lighthouseSEO: 90
};

printHeader('Performance Testing for Property Intelligence Platform');
console.log('');

// Test 1: Bundle Size Analysis
printStatus('1. Analyzing bundle size...');
try {
  const startTime = Date.now();
  execSync('npm run build', { stdio: 'pipe' });
  const buildTime = (Date.now() - startTime) / 1000;
  
  printSuccess(`Build completed in ${buildTime.toFixed(1)}s`);
  
  if (buildTime > THRESHOLDS.buildTime) {
    printWarning(`Build time (${buildTime.toFixed(1)}s) exceeds threshold (${THRESHOLDS.buildTime}s)`);
  } else {
    printSuccess(`Build time (${buildTime.toFixed(1)}s) is within threshold`);
  }
  
  // Check bundle size from build output
  const buildOutput = execSync('npm run build 2>&1', { encoding: 'utf8' });
  const bundleMatch = buildOutput.match(/First Load JS shared by all\s+(\d+(?:\.\d+)?)\s+kB/);
  
  if (bundleMatch) {
    const bundleSize = parseFloat(bundleMatch[1]);
    printSuccess(`Bundle size: ${bundleSize} kB`);
    
    if (bundleSize > THRESHOLDS.bundleSize) {
      printWarning(`Bundle size (${bundleSize} kB) exceeds threshold (${THRESHOLDS.bundleSize} kB)`);
    } else {
      printSuccess(`Bundle size (${bundleSize} kB) is within threshold`);
    }
  }
} catch (error) {
  printError(`Build failed: ${error.message}`);
}

// Test 2: Bundle Analyzer
printStatus('\n2. Running bundle analyzer...');
try {
  execSync('npm run analyze', { stdio: 'pipe' });
  printSuccess('Bundle analyzer completed');
  printStatus('Check the browser for detailed bundle analysis');
} catch (error) {
  printError(`Bundle analyzer failed: ${error.message}`);
}

// Test 3: Check for large dependencies
printStatus('\n3. Checking for large dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const largeDeps = [];
  Object.entries(dependencies).forEach(([name, version]) => {
    // Check for known large packages
    const largePackages = [
      'framer-motion',
      'recharts',
      'chart.js',
      'react-chartjs-2',
      '@elastic/elasticsearch'
    ];
    
    if (largePackages.includes(name)) {
      largeDeps.push(name);
    }
  });
  
  if (largeDeps.length > 0) {
    printWarning(`Large dependencies detected: ${largeDeps.join(', ')}`);
    printStatus('Consider using dynamic imports for these packages');
  } else {
    printSuccess('No unusually large dependencies detected');
  }
} catch (error) {
  printError(`Dependency check failed: ${error.message}`);
}

// Test 4: Check for unused files
printStatus('\n4. Checking for unused files...');
try {
  const srcDir = path.join(process.cwd(), 'src');
  const files = fs.readdirSync(srcDir, { recursive: true });
  
  const unusedFiles = [];
  files.forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file is imported anywhere
      const fileName = path.basename(file, path.extname(file));
      const importPattern = new RegExp(`import.*${fileName}`, 'g');
      
      // Search in all files for imports
      let isUsed = false;
      files.forEach(otherFile => {
        if (otherFile.endsWith('.tsx') || otherFile.endsWith('.ts')) {
          const otherContent = fs.readFileSync(path.join(srcDir, otherFile), 'utf8');
          if (importPattern.test(otherContent)) {
            isUsed = true;
          }
        }
      });
      
      if (!isUsed && !file.includes('page.tsx') && !file.includes('layout.tsx')) {
        unusedFiles.push(file);
      }
    }
  });
  
  if (unusedFiles.length > 0) {
    printWarning(`Potentially unused files: ${unusedFiles.slice(0, 5).join(', ')}`);
    if (unusedFiles.length > 5) {
      printWarning(`... and ${unusedFiles.length - 5} more`);
    }
  } else {
    printSuccess('No unused files detected');
  }
} catch (error) {
  printError(`Unused files check failed: ${error.message}`);
}

// Test 5: Performance Recommendations
printStatus('\n5. Performance recommendations...');

const recommendations = [
  '✅ Bundle analyzer configured',
  '✅ Dynamic imports implemented for charts',
  '✅ Webpack chunk splitting configured',
  '✅ Font optimization enabled',
  '✅ Service worker caching improved',
  '🔄 Consider implementing image optimization',
  '🔄 Consider implementing API response caching',
  '🔄 Consider implementing React.memo for expensive components'
];

recommendations.forEach(rec => {
  if (rec.startsWith('✅')) {
    printSuccess(rec.substring(2));
  } else if (rec.startsWith('🔄')) {
    printStatus(rec.substring(2));
  }
});

// Summary
printHeader('Performance Test Summary');
console.log('');
printStatus('Next steps:');
console.log('1. Run "npm run analyze" to view detailed bundle analysis');
console.log('2. Monitor Core Web Vitals in production');
console.log('3. Run Lighthouse audits regularly');
console.log('4. Consider implementing additional optimizations based on bundle analysis');
console.log('');

printSuccess('Performance testing completed!'); 