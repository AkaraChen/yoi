#!/bin/sh
# Install the Linux `yoi-dashboard` probe from the latest GitHub Release.
# Usage: curl -fsSL https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi-dashboard.sh | sh
set -eu

REPO="AkaraChen/yoi"
NAME="yoi-dashboard"
RELEASE_BASE="https://github.com/${REPO}/releases/latest/download"

die() {
	printf '%s\n' "$1" >&2
	exit 1
}

os=$(uname -s)
arch=$(uname -m)

case "$os" in
Linux) os=linux ;;
*) die "yoi-dashboard install script is Linux-only (systemd docs are Linux-only). Download a Release asset by hand if you must run elsewhere." ;;
esac

case "$arch" in
x86_64|amd64) arch=amd64 ;;
aarch64|arm64) arch=arm64 ;;
*) die "unsupported architecture: $arch" ;;
esac

asset="${NAME}_${os}_${arch}.tar.gz"
dest="${YOI_INSTALL_DIR:-${HOME}/.local/bin}"

tmp="${TMPDIR:-/tmp}/yoi-dashboard-install.$$"
mkdir -p "$tmp"
trap 'rm -rf "$tmp"' EXIT INT TERM

download() {
	url=$1
	out=$2
	if command -v curl >/dev/null 2>&1; then
		if ! curl -fsSL -o "$out" "$url"; then
			die "download failed (404 means no GitHub Release yet — push a v* tag). url: $url"
		fi
	elif command -v wget >/dev/null 2>&1; then
		if ! wget -qO "$out" "$url"; then
			die "download failed (404 means no GitHub Release yet — push a v* tag). url: $url"
		fi
	else
		die "need curl or wget"
	fi
}

printf 'downloading %s\n' "$asset" >&2
download "${RELEASE_BASE}/${asset}" "${tmp}/${asset}"
download "${RELEASE_BASE}/checksums.txt" "${tmp}/checksums.txt"

expected=$(awk -v f="$asset" '$2 == f { print $1; exit }' "${tmp}/checksums.txt")
[ -n "$expected" ] || die "checksums.txt has no entry for ${asset}"

if command -v sha256sum >/dev/null 2>&1; then
	actual=$(sha256sum "${tmp}/${asset}" | awk '{ print $1 }')
elif command -v shasum >/dev/null 2>&1; then
	actual=$(shasum -a 256 "${tmp}/${asset}" | awk '{ print $1 }')
else
	die "need sha256sum or shasum"
fi

[ "$actual" = "$expected" ] || die "sha256 mismatch for ${asset}"

tar -xzf "${tmp}/${asset}" -C "$tmp"
[ -f "${tmp}/${NAME}" ] || die "archive missing ${NAME}"

mkdir -p "$dest"
staged="${dest}/.${NAME}.new"
cp "${tmp}/${NAME}" "$staged"
chmod 755 "$staged"
mv "$staged" "${dest}/${NAME}"

printf 'installed %s to %s\n' "$NAME" "${dest}/${NAME}" >&2
case ":$PATH:" in
*":${dest}:"*) ;;
*) printf 'add %s to PATH if %s is not found\n' "$dest" "$NAME" >&2 ;;
esac
