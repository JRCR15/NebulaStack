#!/usr/bin/env bash
set -euo pipefail
BASE="${GATEWAY_URL:-http://localhost:8080}"
curl -sS -X POST "$BASE/api/v1/auth/token" \
  -H "content-type: application/json" \
  -d '{"grant_type":"client_credentials","tenant_slug":"demo-salon","client_id":"demo-client","client_secret":"demo-secret"}'
echo
