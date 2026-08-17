#!/usr/bin/env bash
# Linux reference install for openclaw/openclaw.
# Official path from https://docs.openclaw.ai/install — the hosted installer,
# run with --no-onboard so interactive configuration stays with the human.
# Does nothing until the human types yes.
set -euo pipefail

die() { echo "error: $*" >&2; exit 1; }

if [ "$(uname -s)" != "Linux" ]; then
  die "this reference only runs on Linux"
fi

if [ "$(id -u)" -eq 0 ]; then
  die "do not run as root; use a normal user"
fi

if ! command -v curl >/dev/null 2>&1; then
  die "curl not found; ask the human to install curl first (e.g. apt install curl)"
fi

if ! command -v bash >/dev/null 2>&1; then
  die "bash not found; the official installer needs bash"
fi

echo "This script will:"
echo "  1. run the official OpenClaw installer:"
echo "       curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard"
echo "     It detects the OS, installs Node.js if needed, and installs the openclaw CLI."
echo "  2. stop. It will not run openclaw onboard, will not store API keys, will not connect channels."
echo
echo "Upstream repo: https://github.com/openclaw/openclaw"
echo "Install docs:  https://docs.openclaw.ai/install"
echo
printf "Type yes to continue: "
read -r answer
if [ "${answer}" != "yes" ]; then
  echo "aborted"
  exit 0
fi

curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard

echo
echo "CLI installed. The next steps are interactive — run them yourself:"
echo "  openclaw onboard --install-daemon   # wizard: model provider, API key, Gateway, daemon"
echo "  openclaw gateway status             # Gateway should be listening on port 18789"
echo "  openclaw dashboard                  # open the Control UI and send a first message"
echo "What counts as a usable assistant is in the knowledge pack, not this script."
