#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.production"
COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing .env.production. Copy .env.production.example and replace IP_DA_VPS/secrets."
  exit 1
fi

if grep -q "IP_DA_VPS" "$ENV_FILE"; then
  echo "Replace IP_DA_VPS in .env.production before deploying."
  exit 1
fi

if grep -q "replace-with" "$ENV_FILE"; then
  echo "Replace production secrets in .env.production before deploying."
  exit 1
fi

cd "$ROOT_DIR"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull postgres nginx
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
