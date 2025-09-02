# Verification — Local Tooling

Run these commands to verify prerequisites:

```bash
node -v
npm -v
npm i -g pnpm@8 || true && pnpm -v

docker -v
docker compose version | cat

git --version

# Optional but recommended
psql --version || echo "psql not installed"
redis-cli --version || echo "redis-cli not installed"
```

If any command fails, install/update the tool and re-run.
