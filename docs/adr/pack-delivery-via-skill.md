# ADR: Pack 分发并入 yoi skill（纯 HTTP，无独立二进制）

- 状态：已接受
- 日期：2026-08-27
- 取代：2026-08-17 版 docs/adr/cli-binary-distribution.md（仅覆盖已删除的
  pack-delivery `cmd/yoi`）。2026-08-27 同名 ADR 已重新接受，只分发两个
  ctxl CLI 与探针，不把 pack 投递改回二进制。

## 背景与约束

pack 的 list/search/get 本质上是对 storefront 的三个 HTTP 请求：
`GET <base>/packs.json`（索引）与 `GET <base>/packs/<slug>/<file>`（按
index.json 的文件清单逐个下载）。此前它们由 `cmd/yoi` 的
get/list/search 子命令承载，带来两个持续成本：

- **二进制分发成本**：tag → Release 资产 → install.sh 的整条链路
  （见被取代的 ADR）只为三个 HTTP 请求服务。
- **命名冲突**：`cmd/yoi` 与 ctxl 生成的 client CLI 都叫 `yoi`
  （docs/adr/agent-data-model.md 决策 8 曾记为开放决策）。

同时，商店是软件源，skill 是进 OS 的壳；pack 投递不该绑死在 CLI 上
（docs/spec.md、docs/prd/product-positioning.md）。投递机制可以用三行
curl 表达，二进制就没有存在必要。

## 决策

1. **删除 pack 分发 CLI**：`cmd/yoi/`、`internal/packget`、
   `internal/packlist`、`install.sh`、`.github/workflows/release.yml`
   全部移除。`yoi` 二进制名无冲突地归 ctxl 生成的 client CLI。
2. **pack 分发变成 skill 内的 HTTP 配方**：`skills/yoi/` 重写为
   路由型 SKILL.md + `references/packs.md`（base URL 解析、
   list/search、get 下载算法，从 cmd/yoi 源码转写）+
   `references/fleet.md`（client 世界 fleet 管理）。红线不变：
   人在环确认、诚实卸载（删 pack 目录即卸载）、无 2code 捆绑、
   AFF 限制。
3. **skill 双通道分发**：skills.sh（`npx skills add AkaraChen/yoi
   --skill yoi -g`）+ 作为 ctxl custom skill 打包进 client CLI
   （`yoi.schema.json` 的 `{"type": "custom", "directory":
   "skills/yoi"}`，`yoi skills path yoi` 可取回完整目录）。

## 备选方案

- **保留 pack CLI，改名 `yoi-pack`**：解决命名冲突，但二进制分发链路
  仍在为三个 HTTP 请求付维护费。否决。
- **pack 下载并进 client CLI 子命令**：`yoi pack get` 之类。可行，但
  要求 agent 先装 client CLI 才能装 pack——把 fleet 管理的二进制变成
  pack 投递的前置，违背「skill 层即产品」。否决。

## 权衡与后果

- 没有任何 pack 二进制需要分发；agent 只需 curl。代价是下载算法
  （index.json 清单、路径校验、一律 `0644`；`.cmdspec` 不加执行位）以散文+配方形式维护在
  skill 里，没有编译期保障——pack-trial 流程是唯一回归网。
- client/server 两个 ctxl CLI 与探针的二进制分发见
  docs/adr/cli-binary-distribution.md；本 ADR 只约束 pack 投递仍是
  HTTP，不因 CLI Release 而改回 pack 二进制。
- `cmd/yoi` 里随 pack CLI 一起删除的还有 deploy/log/skills 原型命令
  （DEPLOY.md 与 .yoi/deploy.log）；其支撑包 `internal/state`、
  `internal/audit`、`internal/skillsdata`（及 `embed.go` +
  `schema/yoi.json`）已于同日删除——部署事实记录的概念由
  `yoi-server` 设计继承（docs/adr/agent-data-model.md）。

## 验证

- agent 在只有 curl 的干净机器上，按 `references/packs.md` 能完成
  list/search/get，下载结果与旧 `yoi get` 逐文件一致。
- `yoi skills list` 同时列出 builtin（`yoi-fleet`）与 custom（`yoi`）
  skill；`yoi skills path yoi` 物化出含 SKILL.md 与 references/ 的
  完整目录。
- `go build ./...` 在仓库根通过（dashboard/server 不依赖被删包）。
