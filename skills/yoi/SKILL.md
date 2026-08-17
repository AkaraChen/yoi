---
name: yoi
description: Install the yoi CLI if needed, then pull the named product pack. Use when the human says to install a product with yoi.
---

# yoi

The human will say 用 yoi 安装 NAME. NAME is the pack they named. Do not pick a product for them.

1. Check `command -v yoi`.
2. If it is missing, install the CLI. Ask first. Do not silent-install.
   First choice (no Go toolchain needed): `curl -fsSL https://raw.githubusercontent.com/AkaraChen/yoi/main/install.sh | sh`
   Fallback (needs Go installed): `go install github.com/AkaraChen/yoi/cmd/yoi@latest`
3. Run `yoi get NAME`.
4. After the pack lands in `packs/NAME/`, follow `packs/NAME/reference/install.sh`. The script waits for a typed yes. Do not skip that.
5. Green: record with `yoi deploy write` and `yoi log append`. Load those skills from the binary if needed: `yoi skills get deploy`, `yoi skills get log`.

Do not invent another pack URL. Default is `https://yoi-sigma.vercel.app/packs/<name>`.
