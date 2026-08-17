#!/usr/bin/env bash
# Linux reference install for NousResearch/hermes-agent.
# Official path only: https://hermes-agent.nousresearch.com/install.sh
# Does nothing until the human types yes. Stops right after install.
set -euo pipefail

UPSTREAM_REPO="https://github.com/NousResearch/hermes-agent"
DOCS_URL="https://hermes-agent.nousresearch.com/docs/getting-started/installation"
INSTALLER_URL="https://hermes-agent.nousresearch.com/install.sh"

die() { echo "error: $*" >&2; exit 1; }

if [ "$(uname -s)" != "Linux" ]; then
  die "this reference only runs on Linux (the official installer also covers macOS/WSL2/Termux/Windows, see ${DOCS_URL})"
fi

if [ "$(id -u)" -eq 0 ]; then
  die "this reference refuses to run as root; use a normal user"
fi

# Prerequisites stated by the official install docs: git, plus curl and xz on Linux.
missing=""
for cmd in git curl xz; do
  command -v "${cmd}" >/dev/null 2>&1 || missing="${missing} ${cmd}"
done
if [ -n "${missing}" ]; then
  echo "error: missing prerequisites:${missing}" >&2
  echo "The human must install them first, e.g. on Debian/Ubuntu:" >&2
  echo "  sudo apt install git curl xz-utils" >&2
  exit 1
fi

echo "This script will:"
echo "  1. download the official installer: ${INSTALLER_URL}"
echo "  2. run it. Per the official docs it installs uv, Python 3.11, Node.js v22,"
echo "     ripgrep and ffmpeg, clones the repo to ~/.hermes/hermes-agent, and puts"
echo "     the hermes launcher at ~/.local/bin/hermes"
echo "  3. stop. This script adds nothing beyond the official installer: no hermes"
echo "     setup, no model choice, no gateway. Any questions the official installer"
echo "     asks are answered by the human, not by an agent."
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
echo "Installer finished. Reload the shell: source ~/.bashrc  # or ~/.zshrc"
echo "Next steps (hermes model, first chat) belong to the human; see the pack checklist."
