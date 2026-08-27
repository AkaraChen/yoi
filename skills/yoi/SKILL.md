---
name: yoi
description: Install a product pack over plain HTTP (no yoi binary needed), or manage the client-side server fleet inventory with the yoi CLI. Use when the human says "用 yoi 安装 NAME", asks what packs exist, or wants to register/inspect managed servers.
---

# yoi

yoi is a deployment-skill storefront for coding agents: each pack is a complete
deployment guide for a trending product, run on the human's own Linux server.
This file is only a router — feature detail lives in `references/`.

## Routing

- The human says 用 yoi 安装 NAME, asks what packs exist, or searches for a
  pack → `references/packs.md`. Pack list/search/get are pure HTTP (curl);
  no yoi binary is required. NAME is the pack they named — do not pick a
  product for them.
- Register or inspect managed servers, providers, or credential references on
  this dev machine → `references/fleet.md` (the `yoi` ctxl CLI; the store is
  plain markdown under `~/.yoi/`). Fleet writes need the `yoi` binary; if it
  is missing, offer the install command in `fleet.md` and ask before
  installing. Pack HTTP delivery does not need the CLI.

When deploying on a server, deployment facts are recorded on that machine with
the `yoi-server` CLI — run `yoi-server skills get` there for
its command reference.
