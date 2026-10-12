#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE="$ROOT/deploy/compose"
EDGE="$COMPOSE/edge"
TAG="${IMAGE_TAG:-$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo local)}"
ACTIVE="$(tr -d '[:space:]' < "$EDGE/active-color" 2>/dev/null || echo blue)"
[[ "$ACTIVE" == "blue" ]] && STANDBY=green || STANDBY=blue
export IMAGE_TAG="$TAG" DEPLOY_COLOR="$STANDBY"
cd "$COMPOSE"
docker compose -p nebulastack-data -f docker-compose.data.yml up -d
docker compose -p "nebulastack-$STANDBY" -f docker-compose.app.yml up -d --build
for i in $(seq 1 90); do
  if docker exec "$STANDBY-api-gateway" wget -qO- http://127.0.0.1:8080/healthz >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
"$ROOT/deploy/scripts/bg-switch.sh" "$STANDBY"
echo "Deploy complete. Active=$(tr -d '[:space:]' < "$EDGE/active-color") IMAGE_TAG=$TAG"
