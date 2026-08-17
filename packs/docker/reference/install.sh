#!/usr/bin/env bash
# Linux reference install for Docker Engine (official get.docker.com convenience script).
# Does nothing until the human types yes. Stops right after install + hello-world.
set -euo pipefail

UPSTREAM_REPO="https://github.com/moby/moby"
DOCS_URL="https://docs.docker.com/engine/install/"
SCRIPT_URL="https://get.docker.com"

die() { echo "error: $*" >&2; exit 1; }

if [ "$(uname -s)" != "Linux" ]; then
  die "this reference only runs on Linux (on Windows/macOS the official product is Docker Desktop, see ${DOCS_URL})"
fi

if [ "$(id -u)" -eq 0 ]; then
  die "do not run as root; use a normal user with sudo"
fi

if command -v docker >/dev/null 2>&1; then
  die "docker is already installed ($(docker --version 2>/dev/null)); the convenience script is not an upgrader, use your package manager"
fi

command -v curl >/dev/null 2>&1 || die "curl is missing; install it first"
command -v sudo >/dev/null 2>&1 || die "sudo is missing; the official installer needs root privileges via sudo"

# Conflicting distro packages: the official docs require removing them first.
conflicts=""
if command -v dpkg >/dev/null 2>&1; then
  for pkg in docker.io docker-compose docker-compose-v2 docker-doc docker-buildx podman-docker containerd runc; do
    dpkg -l "$pkg" 2>/dev/null | grep -q '^ii' && conflicts="$conflicts $pkg"
  done
  hint="sudo apt remove"
elif command -v rpm >/dev/null 2>&1; then
  for pkg in docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine; do
    rpm -q "$pkg" >/dev/null 2>&1 && conflicts="$conflicts $pkg"
  done
  hint="sudo dnf remove"
fi
if [ -n "$conflicts" ]; then
  echo "error: conflicting distro packages installed:${conflicts}" >&2
  echo "The official docs require removing them first:" >&2
  echo "  ${hint}${conflicts}" >&2
  exit 1
fi

echo "This script follows the official convenience-script path (${DOCS_URL}):"
echo "  1. download ${SCRIPT_URL} (open source: github.com/docker/docker-install)"
echo "  2. run it with sudo. It detects this distro, configures Docker's official"
echo "     package repository, and installs docker-ce, the CLI, containerd, and the"
echo "     buildx/compose plugins. It installs dependencies without asking."
echo "  3. verify with 'sudo docker run hello-world'"
echo "  4. stop. It will not touch the docker group or any config."
echo
echo "Official caveat: the convenience script is recommended for testing and"
echo "development environments, not production. On RPM-based distros the docker"
echo "service is not started automatically (sudo systemctl enable --now docker)."
echo "Any sudo password prompt belongs to you, not to an agent."
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
curl -fsSL "${SCRIPT_URL}" -o "${tmp}"
sudo sh "${tmp}"

sudo docker run hello-world

echo
echo "Docker Engine is installed and verified."
echo "Next step belongs to you: to run docker without sudo, add yourself to the"
echo "docker group (sudo usermod -aG docker \$USER) and log back in. Note the"
echo "official warning: the docker group grants root-level privileges."
