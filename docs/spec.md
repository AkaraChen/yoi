# Specification

## Product scope

yoi is a self-hosted operating layer for a personal deployment stack: one
identity, one fact ledger, and one observation surface on the user's own
Linux, operated by the user's coding agent. The storefront is the software
source and acquisition surface, not the product. See
`docs/prd/product-positioning.md` and `docs/adr/agent-as-operator.md`.

Out of scope until explicitly specified: anything not yet accepted in a PRD.

## Terminology

- **Feature 质问**: the mandatory product-then-technical clarification loop driven by `$feature-dev` before implementation.
- **PRD**: a product requirements document under `docs/prd/` describing problem, users, goals, non-goals, flows, failure behavior, and acceptance criteria.
- **ADR**: an architecture decision record under `docs/adr/` capturing one material technical choice, alternatives, and consequences.
- **Spec**: this file — the single source of truth for shared terminology, observable contracts, and system-wide invariants.
- **Product (yoi)**: the self-hosted OS for a personal complete deployment stack. It is not a skill store, not a human control panel, and not a yoi-owned chat app.
- **Operator**: the user's coding agent (Claude Code, Codex, …). The human talks to that agent. yoi does not ship a chat UI.
- **Pack**: a product-knowledge bundle living in a directory under `packs/`, identified by its slug (directory name, `[a-z0-9][a-z0-9-]*`). A pack is listed in the storefront only if it contains `page.mdx`. A pack ships information the yoi skill may read (`skill/SKILL.md`, checklist, reference install cmdspec). It is not the install or registration procedure. Pack category is open; the current shelf is not a product boundary.
- **Skill (yoi skill)**: the opt-in agent skill at `skills/yoi/SKILL.md`, installed into the user's agent. It is the shell: pack HTTP delivery, landing procedure, registration, and fleet routing. A human request like "用 yoi 安装 NAME" (or a landing with no pack) is executed here. Pack download is pure HTTP (curl) — no binary is a prerequisite. Finishing a landing for the OS requires `yoi-server` on the target machine.
- **Registration**: when the agent judges a yoi landing complete, the target machine's `~/.yoi/` must contain a Service (identity), a Release for this landing, and at least one Event. `runtime` is written when the agent knows the supervisor binding; `pack_ref` is written when a pack was used. See `docs/prd/os-registration.md`.
- **Storefront**: the Next.js site in `web/`. It is the software source (pack catalog) and the landing that installs the yoi skill. The homepage `/` is the brand landing page with a pack preview section; the full pack list lives at `/shop`.
- **Shop filter**: In-place narrowing of the `/shop` grid by a visitor query against pack slug and excerpt. It is not a search page, not a search API, and not the yoi skill's pack search.
- **Dashboard**: the on-server probe panel in `dashboard/` — a lightweight, single-user, read-only web UI that runs on the user's own Linux server and shows current server metrics plus the services recorded on that machine. It is a glance and audit surface, not a control plane. See `docs/prd/dashboard.md`.
- **Agent Context Layer**: the fact-recording layer between Agent and Dashboard, storing deployment intent (Release) and execution facts (Event) as documents under `~/.yoi/`; current state (Resource) is served live by the Dashboard probe and never persisted. See `docs/prd/agent-context-layer.md` and `docs/adr/agent-data-model.md`.

## Observable contracts

### Documentation harness

- New product behavior is defined in `docs/prd/` before feature code lands.
- Material technical choices are recorded in `docs/adr/` before or with the code that depends on them.
- Stable, implementation-independent rules merge into this `docs/spec.md`.
- Feature work that changes terminology, contracts, invariants, or failure behavior updates this file in the same change set.
- Agents must not implement feature code during 质问; the accepted PRD/ADR/spec set is the source of truth for implementation.

### Product positioning

- The product is the **self-hosted OS** for a personal deployment stack (identity, ledger, observation), operated by the user's coding agent. The storefront is the software source and acquisition surface. The yoi skill is the shell, not the thing being sold. See `docs/prd/product-positioning.md` and `docs/adr/agent-as-operator.md`.
- Pack delivery is HTTP instructions inside the skill; no CLI is required for it. Pack category is open. A shelf that happens to be agent products is not a category commitment.
- Acquisition copy may still lead with the first command — install the skill, then "用 yoi 安装 NAME", "三分钟跑起来" — but that copy must not redefine the product as a skill store or a trending-product shop.
- The operator is the user's existing coding agent. yoi does not ship a chat UI. The dashboard is read-only (no start/stop, no config edits, no one-click install).
- The two-sided structure (初级部署 / 高级清场) from the 2026-08-13 brainstorm is not a current commitment.
- Red lines for any user-facing surface: no silent or unattended install claims; installation is opt-in with human-in-the-loop confirmation (the skill asks before installing a CLI, the probe, or a pack). Pack `reference/install.cmdspec` files wait for a typed yes. CLI/probe Unix installers are cmdspec documents (agent-interpreted, not executable; no yes-gate inside the document). Windows CLIs stay on `irm | iex` `.ps1` files. Uninstall must be honest (deleting the pack directory removes the pack); no bundling or cross-promotion of 2code; no per-page cloud AFF — AFF may only appear in 试验场/干净机 contexts if such content exists.
- The storefront's primary call to action is installing the yoi skill (`npx skills add AkaraChen/yoi --skill yoi -g`); per-pack install is phrased as telling the agent "用 yoi 安装 <slug>".

### Web storefront

- Routes: `/` (landing + pack preview), `/shop` (full pack list, filterable via `?q=`), `/[slug]` (pack detail), `/packs/...` (static file serving), `/packs.json` (machine-readable pack index). No cart, checkout, account, pricing, or separate search page exists.
- `/shop` shop filter: a visitor query narrows the grid in place against slug and excerpt (case-insensitive substring; same fields as the yoi skill's pack search). The query is addressable as `/shop?q=`; missing or empty `q` is the full shelf. No matches: the page states there are none. Filter chrome lives only on `/shop`. `/packs.json` stays an unfiltered static index (see `docs/adr/shop-filter-client.md`).
- The homepage `#packs` section is a preview: at most 3 cards plus a「查看全部」link to `/shop`. A pack whose `page.mdx` frontmatter sets `shop-only: true` is excluded from this preview but remains in `/shop`, `/packs.json`, and its detail page. Entry points that target the full list (hero 浏览 Pack button, detail-page breadcrumb, footer 全部 Pack link) point at `/shop`.
- `/packs.json` returns the pack index as JSON `[{ "slug": string, "excerpt": string, "cover": string|null }]`, built from the same `packs/` data the storefront renders; `cover` is a site-relative path or null (see `docs/adr/pack-list-endpoint.md`).
- The storefront's only data source is the `packs/` directory; adding a pack requires no assets or configuration beyond the pack directory itself.
- Pack covers: a pack may ship an official cover image as `cover.<ext>` in its directory (listed in `index.json`); packs without one get a deterministic slug-generated cover. The same slug always renders the same cover (see `docs/adr/pack-covers.md`).
- All UI components style through the semantic design tokens in `design/` (`tokens.css` + `tailwind.preset.js`), imported by relative path from `web/` and `dashboard/`; hard-coded colors in feature components are not allowed (see `docs/adr/web-visual-system.md` and `docs/adr/design-token-package.md`).
- Storefront appearance follows the OS color scheme (`prefers-color-scheme`). There is no theme control and no remembered preference. Light tokens stay the Cursor warm-paper set; dark tokens are the warm counterpart of the same system. Unspecified preference keeps light. Terminal and command wells stay dark in both appearances. The announcement bar and homepage closing CTA use a persistent ink surface that stays a dark band in both appearances (see `docs/adr/web-dark-mode.md`).
- Storefront copy is written in Chinese.
- Pack `page.mdx` is product-facing copy only: what the product is and what it can do. Deployment, installation, and setup instructions are forbidden in `page.mdx` unless they concern yoi itself — the yoi install flow is owned by the detail page's install card, never by pack content.
- Pack links (website, docs, GitHub, …) live in `page.mdx` frontmatter as flat `key: url` pairs and render as icon buttons on the detail page; the body must not contain a links section.

### Dashboard

- The dashboard serves only `127.0.0.1` and requires password authentication; no data is visible before authentication. The password comes from `-password` or `YOI_DASHBOARD_PASSWORD` (default `yoi`, development only); `POST /api/login` issues an in-memory HttpOnly session cookie, and all `/api/*` routes except login require it (see `docs/adr/dashboard-probe-server.md`).
- The probe is a single Go binary (`dashboard/server/`) that embeds the SPA build (`dashboard/server/dist` via `go:embed`) and serves the JSON API on the same origin. Server metrics are collected with gopsutil v4.
- Information architecture: a left sidebar (server status entry on top, service list below) plus a main area that always shows the selected item's detail. Server and services are peers; the default landing view is the server overview.
- Server overview metrics align with the Nezha probe's collection surface (host info + CPU/memory/swap/disk/network/connections/processes/load/uptime). Trends are kept as an in-memory ring buffer (5s sampling, last 1 hour, charts for CPU/memory/network/load); history is lost on probe restart and persistence is out of scope until user feedback asks for it (see `docs/adr/dashboard-metrics-history.md`).
- A service detail shows five blocks: synthesized status, live occupancy (or「无法探测」when `runtime` is absent), release history, event timeline, and external links from frontmatter `links` (`id` / `name` / `link`; omit the block when empty). See `docs/prd/service-runtime-live.md`.
- Service configuration lives in frontmatter (including `runtime` and `links`). The Service body `## Spec` JSON is not the configuration source (see `docs/adr/service-runtime-binding.md`).
- Synthesized service status: `unknown` when `runtime` is missing; otherwise combine `desired_state`, whether bindings resolve, and health as reported by that runtime. Sidebar and detail use the same synthesis. `removed` services stay off the list.
- Live occupancy is request-time only (`GET /api/services/live`, `GET /api/services/{id}/live`) and is never written to the store. The SPA polls live every 30s. Store file changes under `~/.yoi/` are pushed on `GET /api/ws` (`type: store`); live is not sent on the websocket (see `docs/adr/dashboard-live-and-watch.md`).
- The dashboard styles through `design/` semantic tokens only; it consumes data exclusively through a JSON API boundary (`src/lib/api.ts` in the SPA). Document endpoints remain `GET /api/services` and `GET /api/services/{id}`. The store-reader parses YAML frontmatter and NDJSON; the store path resolves as `-store` flag → `YOI_DASHBOARD_STORE` → `~/.yoi`, and a missing store yields empty states, not errors.

### Three worlds

- **Server world**: the user's Linux server. Runs the Dashboard probe and stores deployment facts in `~/.yoi/` (markdown entities plus an NDJSON event stream). The server-side `yoi-server` CLI (ctxl-generated from `yoi-server.schema.json`) is the write entrypoint; Dashboard is read-only.
- **Client world**: the user's development machine. Runs the user's Agent and the client-side `yoi` CLI (ctxl-generated from `yoi.schema.json`). Stores server inventory, credential references, and provider accounts in `~/.yoi/`. The Agent bridges Client and Server worlds.
- **Web world**: the storefront in `web/`. Read-only software source (pack catalog); never touches Server or Client storage directly.

### Agent Context Layer

- Entities live at flat static paths under `~/.yoi/`: `services/<id>.md` (Service), `releases/<uuid>.md` (Release), and `events.ndjson` (append-only Event stream, one JSON object per line with CLI-supplied sequential `id` and RFC3339 `ts`). Relationships live in frontmatter/NDJSON fields, not filesystem nesting. Human-readable and Agent-parseable.
- The write entrypoints are the two ctxl-generated CLIs: `yoi-server` on the server (schema `yoi-server.schema.json`) and `yoi` on the client (schema `yoi.schema.json`).
- Release is an immutable deployment intent: config snapshot, Agent's plan (JSON with open action set), and outcome. Only `status` can change after creation.
- Event is an append-only fact record with `kind` (open set), `data` (JSON), and `summary` (Agent-written human-readable text). Non-deployment events (OOM, manual restart) are independent, not tied to a Release.
- Live host metrics and service occupancy are served at request time by the Dashboard Go probe and are never persisted to the store. Service occupancy requires a frontmatter `runtime`; without it the UI is「无法探测」and the probe does not scan the machine.
- Release status (`pending`/`active`/`failed`/`superseded`) is a fact, not a state machine. Any entity with yoi CLI permission can change it; the change itself is recorded as an Event.
- Single-machine isolation: each Dashboard is an independent universe. Multi-machine aggregation is the user's Agent's responsibility, not yoi's.
- The context layer records facts only; it does not validate plans, enforce rollbacks, or block dangerous operations. It does not define an objective “installed” or “green” bar — the agent judges completion (`docs/prd/os-registration.md`).
- When the agent judges a yoi landing complete, registration is mandatory on that machine: Service + this Release + Event, written with `yoi-server`. Missing `yoi-server` uses the existing ask-then-install path; if the human refuses, the agent must not claim registration succeeded.
- Pack files are information for that procedure. They must not be the bookkeeping script (no “when green, write only an event”).
- Server-side entities are stored under `~/.yoi/` on the server; client-side entities (server inventory, credential references, provider accounts) are stored under `~/.yoi/` on the development machine. The two stores are separate and never synchronized automatically.

### CLI

- Two CLIs exist, both ctxl-generated from root schemas: `yoi` (client-world fleet inventory, `yoi.schema.json`) and `yoi-server` (server-world fact store, `yoi-server.schema.json`). Generated output lands in `generated/<name>` and is replaced in place on regeneration.
- Pack delivery is pure HTTP inside the yoi skill (`skills/yoi/references/packs.md`), not a binary. Downloading a pack does not register it. Registration is a separate write on the target machine after the agent judges the landing complete. Base URL resolution: `YOI_PACKS` environment variable → built-in default `https://yoi-sigma.vercel.app`; a `/packs` path suffix is trimmed to the site root so one override value serves all requests.
- Pack list/search fetch `GET <base>/packs.json`; search filters client-side (case-insensitive substring on slug or excerpt). Pack get fetches `<base>/packs/<slug>/index.json` and downloads every listed file into `./packs/<slug>/` at mode `0644` (`.cmdspec` is not a script and is not marked executable); it does not install anything. Pack delivery does not require a yoi CLI.
- Binary distribution: a `v*` tag publishes a GitHub Release. Unauthenticated stable URLs are `https://github.com/AkaraChen/yoi/releases/latest/download/<asset>`. Asset names do not include the version. Platforms: `yoi` and `yoi-server` for linux/darwin/windows × amd64/arm64 (`tar.gz`, except Windows `.zip` with `.exe`); `yoi-dashboard` at least linux amd64 and linux arm64 (`tar.gz`). The Release also has `checksums.txt` (sha256 of every archive).
- Install entrypoints (raw.githubusercontent.com; the skill asks the human first):
  - Unix: `https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi.cmdspec` and `install-yoi-server.cmdspec` — cmdspec documents for the agent to interpret, not `curl | sh`
  - Windows: the matching `install-yoi.ps1` / `install-yoi-server.ps1` (`irm | iex`)
  - Optional Linux-only `install-yoi-dashboard.cmdspec` for the probe
- Default install destinations: `${YOI_INSTALL_DIR:-$HOME/.local/bin}` (Unix, no root) and `%LOCALAPPDATA%\yoi\bin` (Windows; add to PATH). Overwrite is upgrade. Missing Release, missing asset, or 404 is a hard failure with no half-install. `releases/latest` follows GitHub's latest non-prerelease (currently the newest `v*` after `v0.1.0`).
- The probe binary is `yoi-dashboard`. On Linux the server skill encourages a systemd user or system unit, bind `127.0.0.1:8788`, password from `YOI_DASHBOARD_PASSWORD` (the compile-time default `yoi` is development-only), store `-store` / `YOI_DASHBOARD_STORE` / `~/.yoi`. Windows/macOS probe service setup is unspecified.

## System-wide constraints

- Repository agent entrypoint is root `AGENTS.md` (`CLAUDE.md` is a symlink to it).
- Feature development workflow skill lives at `.agents/skills/feature-dev/` (also linked from `.claude/skills/`).
- Pack authoring workflow skill lives at `.agents/skills/add-pack/`: pack content is written from the product's official sources and mirrors the official presentation; copying the structure of existing packs is forbidden.
- Pack trial workflow skill lives at `.agents/skills/pack-trial/`: a trial runs the full yoi path (install the yoi skill, then "用 yoi 安装 NAME") with codex in full-access mode inside an isolated sandbox-agent container, and produces a transcript plus an experience report (flow smoothness, question burden, discomfort, stopping point). Trials observe only; they never modify pack content. Trial artifacts under `trials/` are not committed.
- Commit attempts should re-check the working tree against this specification and relevant PRDs/ADRs before landing.

## Current implementation status

- Product identity, three worlds, context layer, dashboard probe, pack delivery, and CLI/probe distribution are specified in this file and the linked PRDs/ADRs.
- OS registration after a yoi landing is specified and the procedure lives in `skills/yoi/references/landing.md`. Pack files and `add-pack` are information only.
- Run `$feature-dev` for the next feature.
