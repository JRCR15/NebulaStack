#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE="$ROOT/deploy/compose"
EDGE="$COMPOSE/edge"
TAG="${IMAGE_TAG:-$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo local)}"
NET=nebulastack-net

docker network inspect "$NET" >/dev/null 2>&1 || docker network create "$NET"
sed "s/ACTIVE_COLOR/blue/g" "$EDGE/nginx.conf.template" > "$EDGE/nginx.conf"
echo blue > "$EDGE/active-color"

export IMAGE_TAG="$TAG" DEPLOY_COLOR=blue
cd "$COMPOSE"
docker compose -p nebulastack-data -f docker-compose.data.yml up -d --build
docker compose -p nebulastack-blue -f docker-compose.app.yml up -d --build
docker compose -p nebulastack-edge -f docker-compose.edge.yml up -d --force-recreate

echo "Waiting for public healthz..."
for i in $(seq 1 60); do
  if curl -fsS "http://localhost:8080/healthz" >/dev/null 2>&1; then
    echo "Blue-green ready. Active=blue IMAGE_TAG=$TAG"
    exit 0
  fi
  sleep 2
done
echo "Timeout waiting for edge" >&2
exit 1
