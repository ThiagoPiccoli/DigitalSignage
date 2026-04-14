#!/bin/sh
set -e

# Ensure the persistent data directory exists (volume may be freshly mounted)
mkdir -p /app/data/media

# Run database migrations before starting (idempotent — safe on every boot)
node ace migration:run --force

exec node bin/server.js
