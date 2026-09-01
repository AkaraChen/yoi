---
name: yoi
description: Land software on a Linux machine (pack optional), register it into that machine's yoi store, or manage the client-side server fleet. Use when the human says "用 yoi 安装 NAME", asks to install something via yoi with no pack, asks what packs exist, or wants to register/inspect managed servers.
---

# yoi

yoi is the self-hosted OS for a personal deployment stack. The operator is
the human's coding agent; this file is the shell. Feature detail lives in
`references/`. Pack category is open; do not assume the catalog is only
agent products.

## Routing

- Land software on a Linux machine (「用 yoi 安装 NAME」, or the same
  request with no pack) → `references/landing.md`. That file is the only
  install and registration procedure. Packs are information.
- List, search, or download a pack → `references/packs.md`. Pure HTTP
  (curl); no yoi binary. NAME is the pack they named — do not pick a
  product for them. Download is not install and not registration.
- Register or inspect managed servers, providers, or credential references
  on this dev machine → `references/fleet.md` (the `yoi` ctxl CLI). Fleet
  writes need the `yoi` binary; if it is missing, offer the install command
  in `fleet.md` and ask before installing.
