#!/usr/bin/env bash
set -euo pipefail
URL="${1:?url required}"
TRIES="${2:-60}"
for i in $(seq 1 "$TRIES"); do
  if curl -sf "$URL" >/dev/null; then
    echo "healthy: $URL"
    exit 0
  fi
  sleep 2
done
echo "timeout waiting for $URL" >&2
exit 1
