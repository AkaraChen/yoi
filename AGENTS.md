# Project workflows

## Three worlds

yoi 的产品 surface 分为三个世界，各自独立演化，通过约定好的边界交互：

| 世界 | 位置 | 职责 | 存储 |
|------|------|------|------|
| **Server** | 用户 Linux 服务器 | Dashboard（探针面板）+ `~/.yoi/`（部署事实） | `~/.yoi/` markdown 文档 |
| **Client** | 用户开发机 | Agent skill + `yoi` CLI（多机管理） | `~/.yoi/` 服务器清单与凭证 |
| **Web** | `web/` storefront | Pack marketplace，展示与分发 | `packs/` 目录 |

边界规则：

- Server 世界的 `~/.yoi/` 由 **server 端 `yoi-server` CLI**（ctxl 生成，独立 binary）读写，Dashboard 只读。
- Client 世界的 `~/.yoi/` 由 **client 端 `yoi` CLI**（另一套 ctxl schema 生成）读写，管理多台服务器的连接信息与凭证。
- Web 世界只读 `packs/`，不直接触碰 Server 或 Client 的存储。
- 用户的 Agent 是 Client 与 Server 之间的桥梁：在 Client 上运行，通过 SSH/API 连接 Server 的 Dashboard 或 CLI。

## Store documents

`~/.yoi/` 里的 markdown **配置必须形式化，写在 frontmatter**（ctxl 声明过的字段，含对象/数组）。body 只放给人读的叙述或按章节约束的内容（例如 Release 的 Plan / Config / Outcome）。不要用 `## Spec` 自由 JSON 块承载配置。Service 的 `runtime`、`links`、`ports` 等见 `docs/adr/service-runtime-binding.md`。

## Feature development

For every new feature, use `$feature-dev` before implementation. Inspect the code and all project documentation, complete the one-question-at-a-time product and technical 质问, and record the agreed product requirements, architecture decisions, and general specification under `docs/` before changing feature code.

Documentation layout:

| Path | Role |
|------|------|
| `docs/prd/` | Product requirements: problem, users, goals/non-goals, flows, acceptance criteria |
| `docs/adr/` | Architecture decisions: context, choice, alternatives, trade-offs, failure bounds |
| `docs/spec.md` | Single source of truth for terminology, observable contracts, and system-wide invariants |

Read the relevant docs before changing feature code. Existing decisions live in `docs/adr/`, requirements in `docs/prd/`. Prefer updating those files over inventing parallel notes.

## Documentation rules

- Every completed feature 质问 leaves a PRD, at least one ADR when a material technical choice exists, and an update to `docs/spec.md` for any stable observable rule.
- `docs/spec.md` stays implementation-independent: shared terminology, externally observable contracts, and invariants. Put feature rationale in the PRD and decision rationale in ADRs.
- Use concise kebab-case filenames derived from the feature or decision (for example `docs/prd/cli-run.md`, `docs/adr/error-types.md`).
- Prefer testable product statements in PRDs. Do not hide unresolved product questions inside implementation TODOs.
- If code and docs disagree, surface the conflict during 质问 or before commit; do not silently pick one side.

## Commit and ship

Before any commit, review staged, unstaged, and untracked changes against `docs/spec.md` and every relevant document under `docs/adr/` and `docs/prd/`. If the implementation changes a documented fact, update and stage the documentation in the same change. Use `$git-commit` to stage logical groups and create conventional commits from the diff.

# Commands

Web storefront (`web/`, Next.js 15 + Tailwind 3, npm):

- Dev: `cd web && npm run dev`
- Build: `cd web && npm run build`

Dashboard (`dashboard/`, Vite + React SPA + Go probe):

- Dev: `cd dashboard && npm run dev` (Vite on 5173, proxies `/api` to Go probe on 8788)
- Build: `cd dashboard && npm run build`
- Go probe: `cd dashboard/server && go build` (embeds SPA, serves on 127.0.0.1:8788)
- Store types: `go generate ./dashboard/server/store` (from `dashboard/server/store/schema.json`)

Server CLI (ctxl-generated, schema `yoi-server.schema.json`):

- Generate: `go run github.com/AkaraChen/ctxl/cmd/ctxl@latest generate yoi-server.schema.json`
- Build: `cd generated/yoi-server && go build -o yoi-server .`
- Install (ask first): `curl -fsSL https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi-server.sh | sh`
- Windows: `irm https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi-server.ps1 | iex`

Client CLI (ctxl-generated, schema `yoi.schema.json`):

- Generate: `go run github.com/AkaraChen/ctxl/cmd/ctxl@latest generate yoi.schema.json`
- Build: `cd generated/yoi && go build -o yoi .`
- Install (ask first): `curl -fsSL https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi.sh | sh`
- Windows: `irm https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi.ps1 | iex`

Linux probe from the same GitHub Release: `curl -fsSL https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi-dashboard.sh | sh`. Push a `v*` tag to publish assets (see `.github/workflows/release.yml`). A latest URL 404s if that Release does not contain the named asset.

Generation output lands in `generated/<name>` next to the schema and is replaced in place on regeneration. When a local ctxl checkout is available, `cd ../ctxl && go run ./cmd/ctxl generate ...` works too — the schema pins `generation.ctxl_version`, so no published ctxl release is required.

Pack delivery has no binary: it is HTTP instructions inside the yoi skill (`skills/yoi/`), which is also bundled into the client CLI as a ctxl custom skill. Custom skills are bundled byte-for-byte at generation time — after editing anything under `skills/yoi/`, regenerate `generated/yoi` or the CLI serves a stale copy. After editing `skills/yoi-server/`, regenerate `generated/yoi-server`.

Preview convention: run exactly one shared dev server in the terminal (currently http://localhost:3000). Subagents and multitask workers must not start their own dev/preview servers; verify against the shared one. While the dev server is running, do not run `npm run build` — the production build clobbers the dev server's `.next` directory and 500s every page. If a build check is needed, stop the dev server first and restart it after.

- Prefer the project's existing package manager and scripts over inventing new ones.

# Code style

- Prefer small modules with clear ownership boundaries over large catch-all files.
- Domain types and invariants belong in library code when the project grows past a single entry file.
- Errors should be typed where boundaries matter; avoid stringly-typed failure modes for contracts covered by the spec.
- Tests protect invariants and acceptance criteria from PRDs/spec, not implementation trivia.

# Note

`CLAUDE.md` is a symlink to this file — edit `AGENTS.md`.

This harness was installed by `hnm init`.
