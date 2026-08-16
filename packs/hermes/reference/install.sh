#!/usr/bin/env bash
# Clean-Linux reference install for NousResearch/hermes-agent.
# Does nothing until the human types yes. Does not start the gateway.
set -euo pipefail

UPSTREAM_REPO="https://github.com/NousResearch/hermes-agent"
INSTALLER_URL="https://hermes-agent.nousresearch.com/install.sh"

die() { echo "error: $*" >&2; exit 1; }

if [ "$(uname -s)" != "Linux" ]; then
  die "this reference only runs on Linux"
fi

if [ "$(id -u)" -eq 0 ]; then
  die "do not run as root; use a normal user"
fi

if command -v hermes >/dev/null 2>&1; then
  die "hermes is already on PATH; this pack expects a clean machine"
fi

if [ -e "${HOME}/.hermes" ]; then
  die "${HOME}/.hermes already exists; this pack expects a clean machine"
fi

echo "This script will:"
echo "  1. download ${INSTALLER_URL}"
echo "  2. run that official installer (writes under ${HOME}/.hermes)"
echo "  3. stop. It will not run hermes setup, will not store API keys, will not install a gateway."
echo
echo "Upstream repo: ${UPSTREAM_REPO}"
echo
printf "Type yes to continue: "
read -r answer
if [ "${answer}" != "yes" ]; then
  echo "aborted"
  exit 0
fi

tmp="$(mktemp)"
trap 'rm -f "${tmp}"' EXIT
curl -fsSL "${INSTALLER_URL}" -o "${tmp}"
bash "${tmp}"

echo
echo "Installer finished. Reload the shell, then check green:"
echo "  source ~/.bashrc   # or ~/.zshrc"
echo "  command -v hermes"
echo "  hermes --help"
echo "Then pick a model yourself (hermes model or hermes setup) and start hermes."
echo "Green is a working CLI chat. Gateway is out of scope."
