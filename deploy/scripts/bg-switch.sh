#!/usr/bin/env bash
set -euo pipefail
COLOR="${1:-}"
if [[ "$COLOR" != "blue" && "$COLOR" != "green" ]]; then
  echo "Usage: $0 blue|green" >&2
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EDGE="$ROOT/deploy/compose/edge"
sed "s/ACTIVE_COLOR/${COLOR}/g" "$EDGE/nginx.conf.template" > "$EDGE/nginx.conf"
echo "$COLOR" > "$EDGE/active-color"
if docker inspect -f '{{.State.Running}}' nebulastack-edge 2>/dev/null | grep -q true; then
  docker exec nebulastack-edge nginx -s reload
else
  docker compose -p nebulastack-edge -f "$ROOT/deploy/compose/docker-compose.edge.yml" up -d
fi
echo "Switched active color -> $COLOR"
