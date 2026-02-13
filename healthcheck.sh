#!/bin/bash

# Health check script for Skin Factory API

BASE_URL="${1:-http://localhost:3001}"
ENDPOINTS=(
  "/api/health"
  "/api/health/db"
  "/api/bot/webhook"
)

echo "🔍 Checking Skin Factory API health..."
echo "📍 Base URL: $BASE_URL"
echo ""

FAILED=0

for endpoint in "${ENDPOINTS[@]}"; do
  URL="$BASE_URL$endpoint"
  echo -n "🔎 Checking $endpoint ... "
  
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
  
  if [ "$RESPONSE" = "200" ]; then
    echo "✅ OK ($RESPONSE)"
  else
    echo "❌ FAILED ($RESPONSE)"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
if [ $FAILED -eq 0 ]; then
  echo "✅ All checks passed!"
  exit 0
else
  echo "❌ $FAILED check(s) failed!"
  exit 1
fi
