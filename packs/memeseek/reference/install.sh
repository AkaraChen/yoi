#!/usr/bin/env bash
# Linux reference install for jnj52016/MemeSeek.
# Official path only, from the README's "本地运行": pnpm install, docker compose
# (PostgreSQL 16), server/.env from the template, prisma migrate deploy.
# Does nothing until the human types yes. Stops right after install.
set -euo pipefail

UPSTREAM_REPO="https://github.com/jnj52016/MemeSeek"
CLONE_URL="https://github.com/jnj52016/MemeSeek.git"
DEST="MemeSeek"

die() { echo "error: $*" >&2; exit 1; }

if [ "$(uname -s)" != "Linux" ]; then
  die "this reference only runs on Linux (the README also covers Windows, see ${UPSTREAM_REPO})"
fi

if [ "$(id -u)" -eq 0 ]; then
  die "this reference refuses to run as root; use a normal user"
fi

# Prerequisites stated by the README: Node.js 23+, pnpm 9+, Docker with Compose.
missing=""
for cmd in git node pnpm docker; do
  command -v "${cmd}" >/dev/null 2>&1 || missing="${missing} ${cmd}"
done
if [ -n "${missing}" ]; then
  echo "error: missing prerequisites:${missing}" >&2
  echo "The README requires Node.js 23+, pnpm 9+ and Docker (Compose)." >&2
  echo "Install what is missing, then re-run this script. Never prompt for a" >&2
  echo "root/su password; if something cannot be installed, stop and report" >&2
  echo "what is missing; the human decides what to do next." >&2
  exit 1
fi

node_major="$(node --version | sed 's/^v//' | cut -d. -f1)"
if [ "${node_major}" -lt 23 ]; then
  die "Node.js 23+ is required (found $(node --version)); upgrade Node.js and re-run"
fi

pnpm_major="$(pnpm --version | cut -d. -f1)"
if [ "${pnpm_major}" -lt 9 ]; then
  die "pnpm 9+ is required (found $(pnpm --version)); upgrade pnpm and re-run"
fi

if ! docker compose version >/dev/null 2>&1; then
  die "the docker compose plugin is required (PostgreSQL runs via docker compose)"
fi

if ! docker info >/dev/null 2>&1; then
  die "cannot reach the Docker daemon; start it (and add your user to the docker group) first"
fi

if [ -e "${DEST}" ]; then
  die "directory ./${DEST} already exists; move it aside or run from another directory"
fi

echo "This script will:"
echo "  1. clone ${CLONE_URL} into ./${DEST}"
echo "  2. run pnpm install (workspace: client + server)"
echo "  3. start PostgreSQL 16 in Docker: docker compose up -d --wait"
echo "     (localhost:5432, database and user memeseek, dev password from the"
echo "     compose file)"
echo "  4. create server/.env from server/.env.example — its defaults match the"
echo "     compose database; no API key goes there (the key is entered later in"
echo "     the browser's AI settings page and stays in localStorage)"
echo "  5. run the database migration: pnpm --filter server exec prisma migrate deploy"
echo "  6. stop. Starting the app (pnpm dev) and entering the AI API key belong"
echo "     to the human; see the pack checklist."
echo
echo "Upstream repo: ${UPSTREAM_REPO}"
echo
printf "Type yes to continue: "
read -r answer
if [ "${answer}" != "yes" ]; then
  echo "aborted"
  exit 0
fi

git clone "${CLONE_URL}" "${DEST}"
cd "${DEST}"
pnpm install
docker compose up -d --wait
cp server/.env.example server/.env
pnpm --filter server exec prisma migrate deploy

echo
echo "Install finished. Next steps belong to the human:"
echo "  cd ${DEST} && pnpm dev"
echo "  open http://localhost:5173, set the analysis AI (base URL, API key, model)"
echo "  on the AI settings page, then upload a first meme."
