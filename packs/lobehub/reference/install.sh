#!/usr/bin/env bash
# Linux reference install for lobehub/lobehub (official Docker Compose path).
# Does nothing until the human types yes. Does not configure providers.
set -euo pipefail

UPSTREAM_REPO="https://github.com/lobehub/lobehub"
SETUP_URL="https://lobe.li/setup.sh"

die() { echo "error: $*" >&2; exit 1; }

if [ "$(uname -s)" != "Linux" ]; then
  die "this reference only runs on Linux"
fi

if [ "$(id -u)" -eq 0 ]; then
  die "do not run as root; use a normal user"
fi

if ! command -v docker >/dev/null 2>&1; then
  die "docker not found; install Docker first"
fi

if ! docker compose version >/dev/null 2>&1; then
  die "docker compose plugin not found"
fi

for port in 3210 9000 9001; do
  if ss -ltn 2>/dev/null | grep -q ":${port} "; then
    die "port ${port} is already in use"
  fi
done

echo "This script follows the official Docker Compose quickstart"
echo "(https://lobehub.com/docs/self-hosting/platform/docker-compose):"
echo "  1. create ./lobehub and fetch the official setup script (${SETUP_URL})"
echo "  2. run it; it interactively asks for a deployment mode (default: Local,"
echo "     localhost-only) and writes docker-compose.yml, .env and generated secrets"
echo "  3. run docker compose up -d (pulls images, starts the stack)"
echo "  4. stop. It will not configure model providers or touch the admin panel."
echo
echo "Upstream repo: ${UPSTREAM_REPO}"
echo "Official minimum: 2 CPU cores, 4 GB RAM, 20 GB disk."
echo "The setup script prints a configuration report (service URLs, generated"
echo "passwords) at the end -- save it."
echo
printf "Type yes to continue: "
read -r answer
if [ "${answer}" != "yes" ]; then
  echo "aborted"
  exit 0
fi

mkdir -p lobehub
cd lobehub
bash <(curl -fsSL "${SETUP_URL}")
docker compose up -d

echo
echo "Stack is starting. Watch 'docker logs -f lobehub' for"
echo "'database migration pass' and 'Ready', then open http://localhost:3210."
echo "Model provider keys are configured by you in the panel, not by this script."
