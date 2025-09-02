#!/usr/bin/env bash
set -euo pipefail

# Ensure docker is running and compose v2 is available

# Bring up services
docker compose up -d db redis minio

# Wait for Postgres
until docker exec $(docker compose ps -q db) pg_isready -U postgres >/dev/null 2>&1; do
  echo "Waiting for Postgres..."; sleep 2;
done

# Create MinIO bucket
mc alias set local http://127.0.0.1:9000 minio minio12345 >/dev/null 2>&1 || true
mc mb --ignore-existing local/nebula || true

# Install deps and migrate/seed
pushd web >/dev/null
pnpm install
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma:seed || pnpm run prisma:seed || true
popd >/dev/null

# Start web in dev (optional)
# docker compose up -d web

echo "Bootstrap complete. Services running: Postgres:5432, Redis:6379, MinIO:9000/9001."
