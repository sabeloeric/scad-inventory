#!/usr/bin/env bash
set -euo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd -- "$script_directory/../.." && pwd)"
compose_command=(
  docker compose
  --file "$repository_root/compose.yaml"
  --env-file "$script_directory/compose.env"
  --project-name scad-inventory-e2e
)

cleanup() {
  "${compose_command[@]}" --profile e2e down --volumes --remove-orphans
}

trap cleanup EXIT
"${compose_command[@]}" --profile e2e up \
  --build \
  --abort-on-container-exit \
  --exit-code-from playwright
