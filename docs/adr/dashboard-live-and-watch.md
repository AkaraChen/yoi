# ADR: live 用 30s HTTP 拉，store 变更用 WebSocket 推

- 状态：已接受
- 日期：2026-08-27

## 背景与约束

服务文档（frontmatter）变得不频繁；live（CPU/内存/health）每几秒都在变。
用户要求：前端 30s pull live；若服务端 watch 到文件变化则主动推。
只 watch `~/.yoi/`，不 watch compose/pidfile。WebSocket 只推 store，
不推 live。

## 决策

1. **`GET /api/services/{id}/live`**（需会话）：返回该服务合成状态、
   各绑定行的 live（name、status、cpuPercent、memBytes、可选 pid、
   extra/raw）。不包含 releases/events。无 runtime 时返回
   `status: unknown` 与空 rows，以及 `undetectable: true`。
2. **`GET /api/services/live`**：所有未 removed 服务的合成状态 + 摘要
   live，供侧边栏圆点。结果可在探针内短缓存（≤ 探测成本），但客户端
   仍 30s 拉一次。
3. **WebSocket `GET /api/ws`**（同 cookie 会话）：仅推
   `{type:"store", path?: string}`。客户端收到后按需
   `GET /api/services` 或 `GET /api/services/{id}`。
4. **watch**：`fsnotify`（或等价）只盯 `~/.yoi/` 递归。事件合并
   （debounce 约 100–300ms）再广播，避免一次保存打出一串事件。
5. **断开**：WS 断了不影响 30s live；文档可能旧到下次进页或重连。
   不把 WS 当 live 的必需通道。

## 备选方案

- **live 也走 WS**：实现更绕，用户明确只要 store 推送。否决。
- **30s 拉整份 detail**：浪费，Release/Event 几乎不变。否决。
- **watch compose 文件**：用户只要 `~/.yoi/`。否决。

## 权衡

- 侧边栏合成状态依赖 `/api/services/live`；服务很多且每种都打 docker
  时会慢。可按 kind 并发、短缓存；超时期限与 custom 相同量级。
- 浏览器与 Vite 代理需支持 WS 升级（开发期 `/api` 已反代到探针）。

## 验证

- 改一个 `services/*.md` 的 `display_name`，已打开的详情标题在不刷新
  整页的情况下更新（WS）。
- 30s 内 CPU 数字变化不依赖 WS。
- 无 cookie 的 `/api/ws` 与 `/api/services/*/live` 为 401。
