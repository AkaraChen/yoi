# Context Map

## Product

yoi is the self-hosted OS for a personal deployment stack. The operator is
the user's coding agent. The storefront is the software source, not the
product. See [prd](./docs/prd/product-positioning.md),
[adr](./docs/adr/agent-as-operator.md), [spec](./docs/spec.md).

## Contexts

- [Storefront](./docs/prd/web-storefront.md) — visitor-facing Next.js site: landing, `/shop` pack shelf, pack detail. Shop filter: [prd](./docs/prd/shop-filter.md), [adr](./docs/adr/shop-filter-client.md).
- [Pack catalog](./docs/spec.md) — `packs/` directories are the software-source data. Category is open.
- [Agent context layer](./docs/prd/agent-context-layer.md) — Service / Release / Event documents under server `~/.yoi/`. Data model: [adr](./docs/adr/agent-data-model.md).
- [Dashboard](./docs/prd/dashboard.md) — localhost read-only probe (host metrics + service live). Not a control plane.
- [Client fleet](./docs/prd/cli-binary-distribution.md) — `yoi` CLI inventory of servers / providers / credential references on the dev machine.
- Pack HTTP delivery lives in `skills/yoi/references/packs.md` (curl against `/packs.json` and `/packs/<slug>/`), not in a pack-delivery binary.
- [OS registration](./docs/prd/os-registration.md) — when the agent judges a yoi landing complete, write Service + Release + Event on the target machine. Procedure lives in the yoi client skill; packs are information. [adr](./docs/adr/os-registration.md).

## Relationships

- **Pack catalog → Storefront, yoi skill**: both read slug / excerpt / cover from `packs/`. Neither context owns pack content.
- **Storefront ↛ pack search in the skill**: shop filter is a visitor view on `/shop`. It is not the skill's pack search and does not add a search API.
- **Context layer → Dashboard**: Dashboard reads `~/.yoi/` and live occupancy; it never writes.
- **Agent → both CLIs**: `yoi-server` writes server facts; `yoi` writes client fleet. The human talks to the agent, not to a yoi chat UI.

## Language

**yoi**: The self-hosted OS (identity, ledger, observation) operated by the user's agent.
_Avoid_: skill store as the product definition, control panel, yoi chat app

**Pack**: A product-knowledge bundle under `packs/`, listed when it has `page.mdx`.
_Avoid_: product (except as UI type name), skill (a pack contains a skill; the storefront lists packs)

**Shop filter**: In-place narrowing of the `/shop` grid by a visitor query against slug and excerpt. The current query is addressable as `/shop?q=`; missing or empty `q` is the full shelf. No matches: say there are none.
_Avoid_: search page, search API, site search

**Pack search (skill)**: the yoi skill fetches `GET <base>/packs.json` and filters client-side on slug or excerpt.
_Avoid_: shop filter, `yoi search`
