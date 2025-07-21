// Enrichment Monitoring Report Script
const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../property-enrichment-service/logs/enrichment-monitor.log');
const reportPath = path.join(__dirname, '../property-enrichment-service/logs/enrichment-report.json');

const lines = fs.readFileSync(logPath, 'utf-8').split('\n').filter(Boolean);

const summary = {
  enrichmentFailures: 0,
  missingFields: {},
  byProperty: {},
};

for (const line of lines) {
  let entry;
  try {
    entry = JSON.parse(line);
  } catch (e) {
    continue;
  }
  if (entry.event === 'enrichment_failure') {
    summary.enrichmentFailures++;
    const key = `${entry.postcode}_${entry.number}`;
    summary.byProperty[key] = summary.byProperty[key] || { failures: 0, missing: [] };
    summary.byProperty[key].failures++;
  }
  if (entry.event === 'missing_enrichment_data') {
    for (const field of entry.missingFields) {
      summary.missingFields[field] = (summary.missingFields[field] || 0) + 1;
    }
    const key = `${entry.postcode}_${entry.number}`;
    summary.byProperty[key] = summary.byProperty[key] || { failures: 0, missing: [] };
    summary.byProperty[key].missing.push(...entry.missingFields);
  }
}

fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
console.log('Enrichment Monitoring Report:');
console.log(JSON.stringify(summary, null, 2)); 