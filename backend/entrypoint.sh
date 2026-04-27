#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Running seed..."
node dist-seed/prisma/seed.js || echo "Seed already done or failed, continuing..."

echo "Starting server..."
exec node dist/index.js
