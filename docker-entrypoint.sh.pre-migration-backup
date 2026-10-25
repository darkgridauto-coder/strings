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
  # Use echo pipe instead of <<< to stay POSIX compliant (Alpine ash compatibility)
  if echo "SELECT 1" | npx prisma db execute --stdin --schema=./prisma/schema.prisma >/dev/null 2>&1; then
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

# ---- Ensure uploads directory is writable ----
mkdir -p public/uploads
chmod -R 777 public/uploads || true

# ---- Start the app ----
echo "> Starting server on port ${PORT:-3000}..."
if [ -f .env ]; then
  exec node --env-file=.env server.mjs
else
  exec node server.mjs
fi
