# Specification

## Product scope

`project` is a greenfield or existing project that uses the agent documentation harness installed by `hnm`. Product purpose, users, and surface area beyond that harness should be refined through `$feature-dev` 质问 and recorded in `docs/prd/`, `docs/adr/`, and this file.

Out of scope until explicitly specified: anything not yet accepted in a PRD.

## Terminology

- **Feature 质问**: the mandatory product-then-technical clarification loop driven by `$feature-dev` before implementation.
- **PRD**: a product requirements document under `docs/prd/` describing problem, users, goals, non-goals, flows, failure behavior, and acceptance criteria.
- **ADR**: an architecture decision record under `docs/adr/` capturing one material technical choice, alternatives, and consequences.
- **Spec**: this file — the single source of truth for shared terminology, observable contracts, and system-wide invariants.
- **Pack**: a product-knowledge bundle living in a directory under `packs/`, identified by its slug (directory name, `[a-z0-9][a-z0-9-]*`). A pack is listed in the storefront only if it contains `page.mdx`. A pack ships an agent-ready skill (`skill/SKILL.md`), a checklist, and a reference install script.
- **Skill (yoi skill)**: the opt-in agent skill at `skills/yoi/SKILL.md`, installed into the user's agent. It is the product's retention and routing layer: once installed, a human request like "用 yoi 安装 NAME" routes the agent through the yoi flow. The CLI is a delivery prerequisite that the skill flow surfaces on demand — the storefront sells the skill, not the CLI.
- **Storefront**: the Next.js site in `web/`. The homepage `/` is the brand landing page with a pack preview section; the full pack list lives at `/shop`.
- **Shop filter**: In-place narrowing of the `/shop` grid by a visitor query against pack slug and excerpt. It is not a search page, not a search API, and not `yoi search`.
- **Dashboard**: the on-server probe panel in `dashboard/` — a lightweight, single-user web UI that runs on the user's own Linux server and shows current server metrics plus the services deployed on that machine. See `docs/prd/dashboard.md`.

## Observable contracts

### Documentation harness

- New product behavior is defined in `docs/prd/` before feature code lands.
- Material technical choices are recorded in `docs/adr/` before or with the code that depends on them.
- Stable, implementation-independent rules merge into this `docs/spec.md`.
- Feature work that changes terminology, contracts, invariants, or failure behavior updates this file in the same change set.
- Agents must not implement feature code during 质问; the accepted PRD/ADR/spec set is the source of truth for implementation.

### Product positioning

- The product sold on the storefront is the **skill layer** (the yoi skill plus per-pack skills). The CLI is only the delivery mechanism and must never be the headline.
- Narrative: deployment of trending products on the user's own Linux — "三分钟跑起来，不是三天". Brand copy says "网红产品" without narrowing to agent products. The two-sided structure (初级部署 / 高级清场) from the 2026-08-13 brainstorm is not yet reflected in the storefront; the beginner deployment face leads.
- Red lines for any user-facing surface: no silent or unattended install claims; installation is opt-in with human-in-the-loop confirmation (the skill asks before installing the CLI; install scripts wait for a typed yes); uninstall must be honest (deleting the pack directory removes the pack); no bundling or cross-promotion of 2code; no per-page cloud AFF — AFF may only appear in 试验场/干净机 contexts if such content exists.
- The storefront's primary call to action is installing the yoi skill (`npx skills add AkaraChen/yoi --skill yoi -g`); per-pack install is phrased as telling the agent "用 yoi 安装 <slug>".

### Web storefront

- Routes: `/` (landing + pack preview), `/shop` (full pack list, filterable via `?q=`), `/[slug]` (pack detail), `/packs/...` (static file serving), `/packs.json` (machine-readable pack index). No cart, checkout, account, pricing, or separate search page exists.
- `/shop` shop filter: a visitor query narrows the grid in place against slug and excerpt (case-insensitive substring; same fields as `yoi search`). The query is addressable as `/shop?q=`; missing or empty `q` is the full shelf. No matches: the page states there are none. Filter chrome lives only on `/shop`. `/packs.json` stays an unfiltered static index (see `docs/adr/shop-filter-client.md`).
- The homepage `#packs` section is a preview: at most 3 cards plus a「查看全部」link to `/shop`. A pack whose `page.mdx` frontmatter sets `shop-only: true` is excluded from this preview but remains in `/shop`, `/packs.json`, and its detail page. Entry points that target the full list (hero 浏览 Pack button, detail-page breadcrumb, footer 全部 Pack link) point at `/shop`.
- `/packs.json` returns the pack index as JSON `[{ "slug": string, "excerpt": string, "cover": string|null }]`, built from the same `packs/` data the storefront renders; `cover` is a site-relative path or null (see `docs/adr/pack-list-endpoint.md`).
- The storefront's only data source is the `packs/` directory; adding a pack requires no assets or configuration beyond the pack directory itself.
- Pack covers: a pack may ship an official cover image as `cover.<ext>` in its directory (listed in `index.json`); packs without one get a deterministic slug-generated cover. The same slug always renders the same cover (see `docs/adr/pack-covers.md`).
- All UI components style through the semantic design tokens from the shared `@yoi/design` package (`design/tokens.css` + `design/tailwind.preset.js`, consumed by `web/` and any future web surface such as `dashboard/`); hard-coded colors in feature components are not allowed (see `docs/adr/web-visual-system.md` and `docs/adr/design-token-package.md`).
- Storefront appearance follows the OS color scheme (`prefers-color-scheme`). There is no theme control and no remembered preference. Light tokens stay the Cursor warm-paper set; dark tokens are the warm counterpart of the same system. Unspecified preference keeps light. Terminal and command wells stay dark in both appearances. The announcement bar and homepage closing CTA use a persistent ink surface that stays a dark band in both appearances (see `docs/adr/web-dark-mode.md`).
- Storefront copy is written in Chinese.
- Pack `page.mdx` is product-facing copy only: what the product is and what it can do. Deployment, installation, and setup instructions are forbidden in `page.mdx` unless they concern yoi itself — the yoi install flow is owned by the detail page's install card, never by pack content.
- Pack links (website, docs, GitHub, …) live in `page.mdx` frontmatter as flat `key: url` pairs and render as icon buttons on the detail page; the body must not contain a links section.

### Dashboard

- The dashboard serves only `127.0.0.1` and requires password authentication; no data is visible before authentication. The password comes from `-password` or `YOI_DASHBOARD_PASSWORD` (default `yoi`, development only); `POST /api/login` issues an in-memory HttpOnly session cookie, and all `/api/*` routes except login require it (see `docs/adr/dashboard-probe-server.md`).
- The probe is a single Go binary (`dashboard/server/`) that embeds the SPA build (`dashboard/server/dist` via `go:embed`) and serves the JSON API on the same origin. Server metrics are collected with gopsutil v4.
- Information architecture: a left sidebar (server status entry on top, service list below) plus a main area that always shows the selected item's detail. Server and services are peers; the default landing view is the server overview.
- Server overview metrics align with the Nezha probe's collection surface (host info + CPU/memory/swap/disk/network/connections/processes/load/uptime). Trends are kept as an in-memory ring buffer (5s sampling, last 1 hour, charts for CPU/memory/network/load); history is lost on probe restart and persistence is out of scope until user feedback asks for it (see `docs/adr/dashboard-metrics-history.md`).
- A service detail shows four blocks: current status, resource list with usage (containers and bare-metal processes), deployment audit log, and external links.
- The dashboard styles through `@yoi/design` semantic tokens only; it consumes data exclusively through a JSON API boundary (`src/lib/api.ts` in the SPA), so the data source (eventually the redesigned yoi CLI data model) can change without touching UI code. Service endpoints are still mock-backed until that data model lands.

### CLI

- Pack base URL resolution is shared across network commands: `--from` flag → `YOI_PACKS` environment variable → built-in default.
- `yoi get NAME` downloads pack NAME from `<base>/NAME` (default base `https://yoi-sigma.vercel.app/packs`) into `./packs/NAME`; it does not install anything.
- `yoi list` prints the full pack index as JSON; `yoi search <query>` prints the subset whose slug or excerpt contains the query (case-insensitive). Both fetch `<base>/packs.json` (default base `https://yoi-sigma.vercel.app`); a get-style base ending in `/packs` is trimmed to the site root so one override value serves all commands.
- List/search output is indented JSON on stdout, the same convention as `yoi skills list` and `yoi log show`.
- CLI distribution (see `docs/adr/cli-binary-distribution.md`): pushing a tag matching `v*` triggers the release workflow, which publishes versionless assets `yoi_<goos>_<goarch>.tar.gz` (goos ∈ {linux, darwin}, goarch ∈ {amd64, arm64}) plus `checksums.txt` (sha256) to the GitHub Release. The install script is served at `https://raw.githubusercontent.com/AkaraChen/yoi/main/install.sh` and downloads via `https://github.com/AkaraChen/yoi/releases/latest/download/<asset>` (no auth, always latest release). Default install location is `${YOI_INSTALL_DIR:-$HOME/.local/bin}`; reinstalling overwrites the old binary (that is the upgrade path). Release binaries carry the tag as `yoi --version`; untagged builds report `dev`. Windows is not served by install.sh — `go install` is the fallback there and whenever no release exists yet.

## System-wide constraints

- Repository agent entrypoint is root `AGENTS.md` (`CLAUDE.md` is a symlink to it).
- Feature development workflow skill lives at `.agents/skills/feature-dev/` (also linked from `.claude/skills/`).
- Pack authoring workflow skill lives at `.agents/skills/add-pack/`: pack content is written from the product's official sources and mirrors the official presentation; copying the structure of existing packs is forbidden.
- Pack trial workflow skill lives at `.agents/skills/pack-trial/`: a trial runs the full yoi path (install the yoi skill, then "用 yoi 安装 NAME") with codex in full-access mode inside an isolated sandbox-agent container, and produces a transcript plus an experience report (flow smoothness, question burden, discomfort, stopping point). Trials observe only; they never modify pack content. Trial artifacts under `trials/` are not committed.
- Commit attempts should re-check the working tree against this specification and relevant PRDs/ADRs before landing.

## Current implementation status

- Documentation harness directories and agent workflow files were installed by `hnm init`.
- Product features beyond the harness are not specified yet — run `$feature-dev` for the next feature.
