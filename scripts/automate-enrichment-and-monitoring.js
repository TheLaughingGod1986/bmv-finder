// Automated enrichment and monitoring script
const { execSync } = require('child_process');
const path = require('path');

function runScript(scriptPath, label) {
  try {
    console.log(`\n=== Running: ${label} ===`);
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    console.log(`=== Completed: ${label} ===\n`);
  } catch (e) {
    console.error(`Error running ${label}:`, e.message);
  }
}

function main() {
  // 1. Run bulk enrichment
  runScript(path.join(__dirname, 'bulk-enrich-properties-with-epc.js'), 'Bulk Enrichment');

  // 2. Run enrichment monitoring/report
  runScript(path.join(__dirname, 'generate-enrichment-report.js'), 'Enrichment Monitoring Report');

  // 3. (Optional) Email/reporting can be added here
  console.log('Automation complete. Review logs and reports for details.');
}

main(); 