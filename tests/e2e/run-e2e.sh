#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  POSTGRES_DB=scad_inventory_e2e \
  POSTGRES_USER=scad_inventory \
  POSTGRES_PASSWORD=scad_inventory_e2e_password \
  POSTGRES_PORT=55432 \
  API_PORT=5098 \
  JWT_ISSUER=scad-inventory-api \
  JWT_AUDIENCE=scad-inventory-ui \
  JWT_SIGNING_KEY=e2e-only-signing-key-with-at-least-32-characters \
  JWT_EXPIRATION_MINUTES=10 \
    docker compose --file ../../compose.yaml --project-name scad-inventory-e2e down --volumes
}

trap cleanup EXIT
npx playwright test
