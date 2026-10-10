#!/usr/bin/env bash
set -euo pipefail
BASE="${GATEWAY_URL:-http://localhost:8080}"
TENANT_SLUG="${TENANT_SLUG:-cda}"
SERVICE_ID="${SERVICE_ID:-cda11111-1111-4111-8111-111111111111}"
EXPECTED_STATUS="${EXPECTED_STATUS:-CONFIRMED}"
START_TIME="${START_TIME:-$(date -u -d '+1 day' +%Y-%m-%dT15:00:00Z 2>/dev/null || date -u -v+1d +%Y-%m-%dT15:00:00Z)}"

echo "==> waiting for gateway"
./deploy/scripts/wait-healthy.sh "$BASE/healthz" 90

echo "==> issue JWT tenant=$TENANT_SLUG"
TOKEN_JSON=$(curl -sS -X POST "$BASE/api/v1/auth/token" \
  -H "content-type: application/json" \
  -d "{\"grant_type\":\"client_credentials\",\"tenant_slug\":\"$TENANT_SLUG\",\"client_id\":\"demo-client\",\"client_secret\":\"demo-secret\"}")
TOKEN=$(echo "$TOKEN_JSON" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
if [[ -z "$TOKEN" ]]; then
  echo "failed to get token: $TOKEN_JSON" >&2
  exit 1
fi

IDEM=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || python -c 'import uuid; print(uuid.uuid4())')

echo "==> hold slot service=$SERVICE_ID start=$START_TIME"
HOLD=$(curl -sS -X POST "$BASE/api/v1/schedules/hold" \
  -H "Authorization: Bearer $TOKEN" \
  -H "content-type: application/json" \
  -H "Idempotency-Key: $IDEM" \
  -d "{\"service_id\":\"$SERVICE_ID\",\"start_time\":\"$START_TIME\",\"customer_email\":\"customer@${TENANT_SLUG}.example\",\"customer_phone\":\"+573001234567\"}")
echo "$HOLD"
HOLD_ID=$(echo "$HOLD" | sed -n 's/.*"hold_id":"\([^"]*\)".*/\1/p')
if [[ -z "$HOLD_ID" ]]; then
  echo "hold failed" >&2
  exit 1
fi

echo "==> polling appointment status"
FINAL=""
for i in $(seq 1 30); do
  APPT=$(curl -sS "$BASE/api/v1/schedules/appointments/$HOLD_ID" -H "Authorization: Bearer $TOKEN")
  STATUS=$(echo "$APPT" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')
  echo "  try $i status=$STATUS"
  if [[ "$STATUS" == "CONFIRMED" || "$STATUS" == "CANCELLED" ]]; then
    FINAL="$STATUS"
    echo "$APPT"
    break
  fi
  sleep 2
done

if [[ -z "$FINAL" ]]; then
  echo "E2E timeout — appointment did not reach CONFIRMED/CANCELLED" >&2
  exit 1
fi

if [[ "$FINAL" != "$EXPECTED_STATUS" ]]; then
  echo "expected $EXPECTED_STATUS got $FINAL" >&2
  exit 1
fi
echo "E2E OK status=$FINAL tenant=$TENANT_SLUG"
