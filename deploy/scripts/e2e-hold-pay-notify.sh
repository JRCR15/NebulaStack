#!/usr/bin/env bash
set -euo pipefail
BASE="${GATEWAY_URL:-http://localhost:8080}"
TENANT_SLUG="${TENANT_SLUG:-cda}"
SERVICE_ID="${SERVICE_ID:-cda11111-1111-4111-8111-111111111111}"
EXPECTED_STATUS="${EXPECTED_STATUS:-CONFIRMED}"
SKIP_DB_ASSERTS="${SKIP_DB_ASSERTS:-0}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${COMPOSE_DIR:-$SCRIPT_DIR/../compose}"
START_TIME="${START_TIME:-$(date -u -d '+1 day' +%Y-%m-%dT15:00:00Z 2>/dev/null || date -u -v+1d +%Y-%m-%dT15:00:00Z)}"
CUSTOMER_EMAIL="customer@${TENANT_SLUG}.example"

compose() {
  (cd "$COMPOSE_DIR" && docker compose "$@")
}

assert_persistence() {
  local hold_id="$1"
  echo "==> assert Postgres appointments + outbox"
  local appt
  appt=$(compose exec -T postgres psql -U nebulastack -d nebulastack -At -F '|' -c \
    "SELECT status, customer_email, service_id::text FROM appointments WHERE id = '$hold_id';")
  [[ -n "$appt" ]] || { echo "appointment $hold_id not found" >&2; exit 1; }
  local db_status db_email db_service
  IFS='|' read -r db_status db_email db_service <<<"$appt"
  [[ "$db_status" == "$EXPECTED_STATUS" ]] || { echo "Postgres status expected $EXPECTED_STATUS got $db_status" >&2; exit 1; }
  [[ "$db_email" == "$CUSTOMER_EMAIL" ]] || { echo "Postgres email mismatch" >&2; exit 1; }
  [[ "$db_service" == "$SERVICE_ID" ]] || { echo "Postgres service_id mismatch" >&2; exit 1; }
  echo "  appointments OK status=$db_status"

  local outbox_count
  outbox_count=$(compose exec -T postgres psql -U nebulastack -d nebulastack -At -c \
    "SELECT COUNT(*)::text FROM outbox_events WHERE aggregate_id = '$hold_id' AND event_type = 'nebula.scheduling.hold.created' AND processed = true;")
  [[ "${outbox_count:-0}" -ge 1 ]] || { echo "outbox not processed for $hold_id" >&2; exit 1; }
  echo "  outbox_events OK processed=$outbox_count"

  if [[ "$EXPECTED_STATUS" == "CONFIRMED" ]]; then
    echo "==> assert Mongo conversation_logs"
    local mongo_count
    mongo_count=$(compose exec -T mongo mongosh nebulastack --quiet --eval \
      "print(db.conversation_logs.countDocuments({appointment_id:'$hold_id',status:'SENT'}))")
    [[ "${mongo_count:-0}" -ge 1 ]] || { echo "Mongo SENT log missing for $hold_id" >&2; exit 1; }
    echo "  conversation_logs OK count=$mongo_count"
  else
    echo "==> skip Mongo SENT assert (expected $EXPECTED_STATUS)"
  fi

  echo "==> assert Redis slot lock"
  local tenant_id
  tenant_id=$(compose exec -T postgres psql -U nebulastack -d nebulastack -At -c \
    "SELECT tenant_id::text FROM appointments WHERE id = '$hold_id';")
  local redis_key="tenant:${tenant_id}:slot:${SERVICE_ID}:${START_TIME}"
  local exists
  exists=$(compose exec -T redis redis-cli EXISTS "$redis_key" | tr -d '\r')
  if [[ "$EXPECTED_STATUS" == "CANCELLED" ]]; then
    [[ "$exists" == "0" ]] || { echo "Redis lock still present: $redis_key" >&2; exit 1; }
    echo "  Redis OK lock released ($redis_key)"
  else
    echo "  Redis note: key=$redis_key exists=$exists (CONFIRMED may keep lock until HOLD TTL)"
  fi
}

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
  -d "{\"service_id\":\"$SERVICE_ID\",\"start_time\":\"$START_TIME\",\"customer_email\":\"$CUSTOMER_EMAIL\",\"customer_phone\":\"+573001234567\"}")
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

if [[ "$SKIP_DB_ASSERTS" != "1" ]]; then
  assert_persistence "$HOLD_ID"
else
  echo "==> SKIP_DB_ASSERTS=1"
fi

echo "E2E OK status=$FINAL tenant=$TENANT_SLUG hold_id=$HOLD_ID"
