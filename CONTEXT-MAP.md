# Context Map

## Contexts

- [Storefront](./docs/prd/web-storefront.md) — visitor-facing Next.js site: landing, `/shop` pack shelf, pack detail. Shop filter: [prd](./docs/prd/shop-filter.md), [adr](./docs/adr/shop-filter-client.md).
- [CLI](./docs/adr/pack-list-endpoint.md) — machine-facing commands over the same pack index (`list` / `search` / `get`)
- [Pack catalog](./docs/spec.md) — `packs/` directories are the only product data source

## Relationships

- **Pack catalog → Storefront, CLI**: both read slug / excerpt / cover from `packs/`. Neither context owns pack content.
- **Storefront ↛ CLI**: shop filter is a visitor view on `/shop`. It is not `yoi search` and does not add a search API.

## Language

**Pack**: A product-knowledge bundle under `packs/`, listed when it has `page.mdx`.
_Avoid_: product (except as UI type name), skill (a pack contains a skill; the storefront sells packs)

**Shop filter**: In-place narrowing of the `/shop` grid by a visitor query against slug and excerpt. The current query is addressable as `/shop?q=`; missing or empty `q` is the full shelf. No matches: say there are none.
_Avoid_: search page, search API, site search

**CLI search**: `yoi search <query>` prints the pack-index subset whose slug or excerpt contains the query. JSON on stdout.
_Avoid_: shop filter
