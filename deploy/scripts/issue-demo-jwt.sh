#!/usr/bin/env bash
set -euo pipefail
BASE="${GATEWAY_URL:-http://localhost:8080}"
TENANT_SLUG="${TENANT_SLUG:-cda}"
curl -sS -X POST "$BASE/api/v1/auth/token" \
  -H "content-type: application/json" \
  -d "{\"grant_type\":\"client_credentials\",\"tenant_slug\":\"$TENANT_SLUG\",\"client_id\":\"demo-client\",\"client_secret\":\"demo-secret\"}"
echo
