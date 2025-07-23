#!/bin/bash
set -e

API_BASE="http://localhost:3000"

endpoints=(
  "/api/health-check"
  "/api/last-update"
  "/api/market-analysis/enhanced?timeframe=1y"
  "/api/hpi/postcode?postcode=SE3%209FW"
  "/api/property-analysis?postcode=NE5%202PR&number=21"
)

echo "Checking API endpoints..."
for endpoint in "${endpoints[@]}"; do
  echo -n "$endpoint: "
  curl -s -o /dev/null -w "%{http_code}\n" "$API_BASE$endpoint"
done 