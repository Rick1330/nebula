Param()
$ErrorActionPreference = 'Stop'

# Start services
docker compose up -d db redis minio

# Wait for Postgres
Write-Host "Waiting for Postgres..."
for ($i = 0; $i -lt 30; $i++) {
  try {
    docker exec $(docker compose ps -q db) pg_isready -U postgres | Out-Null
    break
  } catch { Start-Sleep -Seconds 2 }
}

# Ensure MinIO bucket (requires mc installed locally)
try {
  mc alias set local http://127.0.0.1:9000 minio minio12345 | Out-Null
  mc mb --ignore-existing local/nebula | Out-Null
} catch { Write-Host "Skipping MinIO bucket setup (mc not found)." }

Push-Location web
pnpm install
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm run prisma:seed
Pop-Location

Write-Host "Bootstrap complete. Run 'docker compose up -d web' to start the app container, or 'cd web; pnpm dev' for local dev."
