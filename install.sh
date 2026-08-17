#!/bin/sh
# Install the latest yoi CLI binary from GitHub Releases. No root required.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/AkaraChen/yoi/main/install.sh | sh
#
# Honors YOI_INSTALL_DIR (default: $HOME/.local/bin).

set -eu
# pipefail is not POSIX; enable it only where the shell supports it.
# shellcheck disable=SC3040
if (set -o pipefail) 2>/dev/null; then
  set -o pipefail
fi

REPO="AkaraChen/yoi"
BASE_URL="https://github.com/${REPO}/releases/latest/download"
INSTALL_DIR="${YOI_INSTALL_DIR:-$HOME/.local/bin}"

say() { printf '%s\n' "$*"; }
err() { printf 'yoi-install: %s\n' "$*" >&2; }
die() { err "$1"; exit 1; }

detect_os() {
  case "$(uname -s)" in
    Linux)  printf 'linux' ;;
    Darwin) printf 'darwin' ;;
    *) die "unsupported OS '$(uname -s)': only linux and darwin binaries are published" ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64 | amd64)          printf 'amd64' ;;
    arm64 | aarch64)         printf 'arm64' ;;
    *) die "unsupported architecture '$(uname -m)': only amd64 and arm64 binaries are published" ;;
  esac
}

fetch() {
  # fetch <url> <outfile>
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$2" "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "$2" "$1"
  else
    die "neither curl nor wget found; install one of them first"
  fi
}

verify_checksum() {
  # verify_checksum <file> <checksums.txt>, run inside the download dir
  line=$(grep -F "$1" "$2") || die "no checksum entry for $1 in $2"
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s\n' "$line" | sha256sum -c - >/dev/null
  elif command -v shasum >/dev/null 2>&1; then
    printf '%s\n' "$line" | shasum -a 256 -c - >/dev/null
  else
    die "neither sha256sum nor shasum found; cannot verify the download"
  fi
}

main() {
  command -v uname >/dev/null 2>&1 || die "uname not found"
  command -v tar >/dev/null 2>&1 || die "tar not found"

  os=$(detect_os)
  arch=$(detect_arch)
  asset="yoi_${os}_${arch}.tar.gz"

  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT INT TERM

  say "Downloading yoi (${os}/${arch}, latest release)..."
  if ! fetch "${BASE_URL}/${asset}" "$tmp/$asset"; then
    die "download failed (HTTP error or network unreachable). If no release has been published yet, a maintainer must push a v* tag to trigger the build; until then use: go install github.com/AkaraChen/yoi/cmd/yoi@latest"
  fi
  if ! fetch "${BASE_URL}/checksums.txt" "$tmp/checksums.txt"; then
    die "checksums.txt download failed; the latest release looks incomplete"
  fi

  (cd "$tmp" && verify_checksum "$asset" checksums.txt) \
    || die "checksum verification failed for $asset; aborting"

  tar -xzf "$tmp/$asset" -C "$tmp"
  [ -f "$tmp/yoi" ] || die "archive $asset did not contain a yoi binary"

  mkdir -p "$INSTALL_DIR"
  # Stage next to the target and mv over it: atomic on the same filesystem and
  # safe even when the old binary is currently running.
  cp "$tmp/yoi" "$INSTALL_DIR/.yoi.new"
  chmod 0755 "$INSTALL_DIR/.yoi.new"
  mv -f "$INSTALL_DIR/.yoi.new" "$INSTALL_DIR/yoi"

  say "Installed yoi to $INSTALL_DIR/yoi"
  if installed_version=$("$INSTALL_DIR/yoi" --version 2>/dev/null); then
    say "$installed_version"
  fi

  case ":$PATH:" in
    *":$INSTALL_DIR:"*) ;;
    *)
      rc="your shell profile"
      case "$(basename "${SHELL:-sh}")" in
        zsh)  rc="$HOME/.zshrc" ;;
        bash) rc="$HOME/.bashrc" ;;
      esac
      say ""
      say "NOTE: $INSTALL_DIR is not on your PATH. Add it with:"
      say "  echo 'export PATH=\"$INSTALL_DIR:\$PATH\"' >> $rc"
      say "then restart your shell (or source $rc)."
      ;;
  esac
}

main "$@"
