# PRD: Service runtime 绑定与 live 占用

## 问题与背景

Dashboard 能列出 Service / Release / Event，但服务「现在占多少 CPU、
健不健康」必须先知道它跑在哪个 supervisor 上。没有这份绑定，探针只能
猜，或继续只展示声明。本功能让 Agent 在 Service frontmatter 里声明
`runtime`，探针按 kind 去问 docker / podman / systemd / pm2 等，把
live 占用和由 runtime 判定的 health 合成到状态点上。

## 目标用户

- 服务器拥有者：在面板上看每个服务是否真的在跑、占多少资源。
- Agent：部署完成后把 runtime 写进 Service，之后人类和后续会话都能探测。

## 用户故事

- 作为拥有者，我打开一个配了 compose runtime 的服务，看到各容器的
  实时 CPU/内存和合成状态（运行中 / 异常 / 已停止）。
- 作为拥有者，我打开一个没配 runtime 的服务，资源区写「无法探测」，
  旁边带圈 `?`，hover：「还没配置 runtime，让 Agent 补上才能看占用。」
- 作为 Agent，我用一条 custom 命令上报进程列表（可带 pid 和 raw 字段），
  探针按这份 JSON 展示 live。

## 目标

- Service 的运行时绑定、端口、资源限制、链接都在 **frontmatter**，
  砍掉 body 里的 `## Spec` JSON。
- 支持 kind：`compose` / `docker` / `podman` / `systemd` / `pm2` /
  `pidfile` / `socket` / `custom`。
- 状态点合成（侧边栏与详情一致）：
  - 无 runtime → 灰，文案「无法探测」
  - 意图 running，绑到且 runtime 判定健康 → 绿「运行中」
  - 绑到但不健康，或绑不到 → 黄「异常」
  - 意图 stopped 且没在跑 → 灰「已停止」
  - 意图 stopped 但仍在跑 → 黄「异常」
- health 由 **runtime 自己**判定（容器 Health、systemd ActiveState、
  pm2 status、pidfile/socket 能否解析到活进程、custom 行的 status），
  不另做一套 HTTP 探活作为主路径。
- live 不落盘。前端每 30s 拉 live；store（`~/.yoi/`）变更经 WebSocket
  推送，前端再拉文档。

## 非目标

- 启停、重启等控制操作。
- 公网暴露 WebSocket。
- 监视 compose 文件或 pidfile 本身（只 watch `~/.yoi/`）。
- 把 live 推上 WebSocket（只要 store 推送）。
- 全机扫描猜服务（没声明 runtime 绝不探测）。

## 页面结构

服务详情资源区：
- 有 runtime：各绑定目标一行（名字、runtime 状态、CPU、内存）；可带 pid。
- 无 runtime：「无法探测」+ 带圈 `?` + 上述 hover。

侧边栏状态点用合成状态，不再只用 `desired_state`。

外部链接来自 frontmatter `links` 数组（`id` / `name` / `link`）；空则不渲染链接块。

## 用户可见状态与失败

- 某条绑定 missing（容器没了、unit 不存在）→ 该行 missing，合成状态按规则变异常；整页不 500。
- custom 命令超时、非 0、或 stdout 不是 JSON 数组 → 探测失败，资源区显示失败，合成状态为异常（若意图是 running）或无法探测的失败态（按合成规则：有 runtime 但查失败 = 绑不到 → 异常）。
- WebSocket 断开：30s live pull 仍工作；文档等用户刷新或重连后再拉。

## 验收标准

- 无 runtime 的服务：资源区「无法探测」+ hover 文案；圆点为无法探测。
- 每种 kind 至少能用文档中的定位字段解析到目标，并返回 cpu/mem 或明确 missing。
- custom：stdout `[{name, status, cpuPercent, memBytes, ...}]`，允许 `pid` 与任意 extra。
- `GET /api/services/:id/live` 只含 live + 合成状态 + health，不含 Release/Event。
- 改 `~/.yoi/services/*.md` 后面板在不整页刷新的情况下更新文档（WS）；live 仍 30s 一拉。
- 样式走 `@yoi/design`，布局骨架不改。

## 已解决的产品决策

- 状态点合成规则 D（2026-08-27）。
- 配置一律 frontmatter；砍 Service `## Spec` JSON（2026-08-27）。
- links 为 frontmatter 数组，元素 `id` / `name` / `link`（2026-08-27）。
- health 跟 runtime，不另做主 HTTP 探活（2026-08-27）。
- kind 全做，含 podman / pidfile / socket / custom（2026-08-27）。
- custom 契约 B：JSON 数组，可带 pid 与 raw（2026-08-27）。
- WS 只推 store；只 watch `~/.yoi/`；30s 只拉 live（2026-08-27）。
- 未配置文案已定（2026-08-27）。
