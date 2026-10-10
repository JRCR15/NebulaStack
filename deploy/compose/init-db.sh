#!/bin/bash
set -euo pipefail
# postgres docker entrypoint runs scripts in /docker-entrypoint-initdb.d
# We mount SQL + seeds as directories; this script applies them in order.
echo "Applying NebulaStack schema and seeds..."
for f in /docker-entrypoint-initdb.d/01-sql/*.sql; do
  echo "Running $f"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done
for f in /docker-entrypoint-initdb.d/02-seeds/*.sql; do
  echo "Running $f"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done
echo "Schema and seeds applied."
