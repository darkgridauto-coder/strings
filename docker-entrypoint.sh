#!/bin/sh
set -eu

echo "=========================================="
echo " Strings startup"
echo "=========================================="

# Wait for the configured database to accept connections.
echo "> Waiting for database..."
ATTEMPTS=0
MAX=30

while [ "$ATTEMPTS" -lt "$MAX" ]; do
  if echo "SELECT 1" | npx prisma db execute --stdin --schema=./prisma/schema.prisma >/dev/null 2>&1; then
    echo "> Database ready"
    break
  fi

  ATTEMPTS=$((ATTEMPTS + 1))
  echo "  attempt $ATTEMPTS/$MAX failed, retrying in 2s"
  sleep 2
done

if [ "$ATTEMPTS" -ge "$MAX" ]; then
  echo "ERROR: Database not reachable after $MAX attempts"
  exit 1
fi

# Never modify the database schema automatically at application startup.
echo "> Skipping automatic schema synchronization."

# Preserve the existing uploads-directory setup.
mkdir -p public/uploads
chmod -R 777 public/uploads || true

echo "> Starting server on port ${PORT:-3000}..."
if [ -f .env ]; then
  exec node --env-file=.env server.mjs
else
  exec node server.mjs
fi
