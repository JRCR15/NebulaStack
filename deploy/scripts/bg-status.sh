#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ACTIVE="$(tr -d '[:space:]' < "$ROOT/deploy/compose/edge/active-color" 2>/dev/null || echo unknown)"
TAG="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo local)"
echo "Active color: $ACTIVE"
echo "Repo HEAD:    $TAG"
for c in nebulastack-edge blue-api-gateway green-api-gateway; do
  if docker inspect "$c" >/dev/null 2>&1; then
    echo "$c running=$(docker inspect -f '{{.State.Running}}' "$c") image=$(docker inspect -f '{{.Config.Image}}' "$c")"
  else
    echo "$c missing"
  fi
done
curl -fsS "http://localhost:8080/healthz" && echo || echo "public /healthz unreachable"
