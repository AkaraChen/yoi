---
name: yoi
description: Install the yoi CLI if needed, then pull a product pack. Use when the human wants a product from the Yoi site.
---

# yoi

1. Check `command -v yoi`.
2. If it is missing, install the CLI: `go install github.com/AkaraChen/yoi/cmd/yoi@latest`. Ask first. Do not silent-install.
3. If it is present, run `yoi get hermes`.
4. After the pack lands in `packs/hermes/`, follow `packs/hermes/reference/install.sh`. The script waits for a typed yes. Do not skip that.
5. Green: record with `yoi deploy write` and `yoi log append`. Load those skills from the binary if needed: `yoi skills get deploy`, `yoi skills get log`.

Do not invent another pack URL. Default is `https://yoi-sigma.vercel.app/packs/<name>`.
