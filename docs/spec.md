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
- **Storefront**: the Next.js site in `web/`. The homepage `/` is simultaneously the brand landing page and the shop (product list); there is no separate shop route.

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

- Routes: `/` (landing + product list), `/[slug]` (pack detail), `/packs/...` (static file serving). No cart, checkout, account, search, or pricing surface exists.
- The storefront's only data source is the `packs/` directory; adding a pack requires no assets or configuration beyond the pack directory itself.
- Pack covers: a pack may ship an official cover image as `cover.<ext>` in its directory (listed in `index.json`); packs without one get a deterministic slug-generated cover. The same slug always renders the same cover (see `docs/adr/pack-covers.md`).
- All UI components style through the semantic design tokens in `web/app/globals.css` (e.g. `bg-primary`, `text-muted-foreground`); hard-coded colors in feature components are not allowed (see `docs/adr/web-visual-system.md`).
- Storefront copy is written in Chinese.
- Pack `page.mdx` is product-facing copy only: what the product is and what it can do. Deployment, installation, and setup instructions are forbidden in `page.mdx` unless they concern yoi itself — the yoi install flow is owned by the detail page's install card, never by pack content.
- Pack links (website, docs, GitHub, …) live in `page.mdx` frontmatter as flat `key: url` pairs and render as icon buttons on the detail page; the body must not contain a links section.

## System-wide constraints

- Repository agent entrypoint is root `AGENTS.md` (`CLAUDE.md` is a symlink to it).
- Feature development workflow skill lives at `.agents/skills/feature-dev/` (also linked from `.claude/skills/`).
- Pack authoring workflow skill lives at `.agents/skills/add-pack/`: pack content is written from the product's official sources and mirrors the official presentation; copying the structure of existing packs is forbidden.
- Commit attempts should re-check the working tree against this specification and relevant PRDs/ADRs before landing.

## Current implementation status

- Documentation harness directories and agent workflow files were installed by `hnm init`.
- Product features beyond the harness are not specified yet — run `$feature-dev` for the next feature.
