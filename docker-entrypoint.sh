#!/bin/sh
set -e

echo "=========================================="
echo " Strings startup"
echo "=========================================="

# ---- Wait for Postgres to accept connections ----
echo "> Waiting for database..."
ATTEMPTS=0
MAX=30
while [ $ATTEMPTS -lt $MAX ]; do
  if npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT 1" >/dev/null 2>&1; then
    echo "> Database ready"
    break
  fi
  ATTEMPTS=$((ATTEMPTS + 1))
  echo "  attempt $ATTEMPTS/$MAX failed, retrying in 2s"
  sleep 2
done
if [ $ATTEMPTS -ge $MAX ]; then
  echo "✗ Database not reachable after $MAX attempts"
  exit 1
fi

# ---- Sync schema ----
echo "> Syncing database schema (db push)..."
npx prisma db push --skip-generate --accept-data-loss --schema=./prisma/schema.prisma

# ---- Start the app ----
echo "> Starting server on port ${PORT:-3000}..."
if [ -f .env ]; then
  exec node --env-file=.env server.mjs
else
  exec node server.mjs
fi
