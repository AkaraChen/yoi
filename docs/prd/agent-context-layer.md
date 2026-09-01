# PRD: Agent Context Layer（部署事实记录层）

## 问题与背景

yoi 是个人部署栈的自托管 OS，操作者是用户的 Agent（Claude Code、Codex
等）。Agent 需要记忆：上次部署了什么、为什么失败、配置改成了什么样。
用户需要审计：Agent 到底对这台机器做了什么。

本 PRD 定义这个操作系统的上下文层——跑在服务器上的事实记录系统，让
Agent 能提交部署意图、上报执行结果、查询历史，让用户能通过只读
Dashboard 审计所有操作。yoi 展开上下文，不把操作收成面板。

## 目标用户

- **Agent**：通过服务器上的 `yoi-server` CLI 读写部署事实，作为跨会话的记忆。
- **服务器拥有者**：通过 Dashboard 查看 Agent 的操作历史，审计部署记录。

## 用户故事

- 作为 Agent，我自认一次经 yoi 的落地结束后，必须写下 Service、本次
  Release 和 Event（见 `docs/prd/os-registration.md`）。
- 作为 Agent，我在部署前查询该服务的 Release 历史，决定是升级还是回滚。
- 作为 Agent，我提交一个 Release（声明版本、配置、计划），然后执行，
  最后上报 outcome。
- 作为 Agent，我在执行过程中上报 Event（开始、失败、完成），让后续
  会话能还原现场。
- 作为服务器拥有者，我打开 Dashboard 看到某个服务的完整时间线：每次
  部署的版本、配置变更、执行结果、以及非部署事件（OOM、手动重启）。
- 作为服务器拥有者，我看到自定义 Event 时，能通过 Agent 写的 summary
  理解发生了什么。

## 目标

- **Release 即版本**：每次部署意图生成一个不可变的 Release 记录，内容
  创建后不变，只能改状态。
- **Delta 即 Event**：Release 之间的配置变更、执行过程、系统事件都记为
  Event，append-only。
- **Plan 结构化但开放**：Agent 自述计划用 JSON，action 开放集合，yoi
  提供 preset 但不限定。
- **Summary 人读**：每个 Event 必须有 Agent 写的 summary，Dashboard
  直接展示，不渲染模板。
- **单机隔离**：每个 Dashboard 是独立宇宙，多机由用户的 Agent 自行分辨。
- **存储即文档**：Service 与 Release 以 markdown、Event 以 NDJSON 存于
  `~/.yoi/`，人类可直接阅读，Agent 可直接解析。

## 非目标

- **行为管理**：yoi 不校验 Plan 合法性、不自动回滚、不阻止危险操作。
- **状态机**：Release 状态（pending/active/failed/superseded）是事实
  记录，不是强制流转。有 CLI 权限即可改。
- **多机聚合**：Dashboard 不提供聚合 API，跨机关联由用户的 Agent 负责。
- **实时控制**：本层只读历史，不提供「立即重启」等操作入口。

## 实体与存储

所有实体存于 `~/.yoi/`，扁平静态路径；实体间关系写在 frontmatter /
NDJSON 字段里，而不是目录嵌套里：

```
~/.yoi/
  services/
    lobehub.md                                # Service 定义
  releases/
    550e8400-e29b-41d4-a716-446655440000.md   # Release（uuid 文件名）
  events.ndjson                               # 全机 append-only Event 流水
```

### Service

```markdown
---
id: lobehub
display_name: LobeHub
pack_ref: lobehub
created_at: 2026-08-20T10:00:00Z
desired_state: running
ports: 3210
memory: 1G
runtime:
  kind: compose
  file: /opt/lobehub/docker-compose.yml
links:
  - id: web
    name: 官网
    link: https://example.com
---
```

配置只在 frontmatter。body 不再放 `## Spec` JSON。

### Release

```markdown
---
id: 550e8400-e29b-41d4-a716-446655440000
service: lobehub
seq: 42
status: active
image: lobehub:v1.96.4
created_by: deploy-agent-v3
created_at: 2026-08-27T12:00:00Z
---

## Plan

```json
{
  "goal": "升级 LobeHub 到 v1.96.4 并修复内存泄漏",
  "steps": [
    {"action": "pull_image", "image": "lobehub:v1.96.4"},
    {"action": "stop_container", "name": "lobe-chat"},
    {"action": "start_container", "name": "lobe-chat", "image": "lobehub:v1.96.4"},
    {"action": "health_check", "endpoint": "/health", "expect": 200}
  ]
}
```

## Config

```json
{
  "ports": [3210],
  "env": {"DATABASE_URL": "...", "LOG_LEVEL": "info"},
  "resources": {"memory": "1G"}
}
```

## Outcome

```json
{
  "success": true,
  "duration_sec": 45,
  "logs_ref": "events.ndjson#1"
}
```
```

### Event

Event 是 `events.ndjson` 中一行一个的 JSON 对象；`id`（顺序号）和
`ts`（RFC3339）由 CLI 追加时自动补上，写入方不提供：

```json
{"id":1,"ts":"2026-08-27T12:00:15Z","service":"lobehub","release":"550e8400-e29b-41d4-a716-446655440000","actor":"deploy-agent-v3","kind":"deploy_started","summary":"开始执行 Release #42 的部署计划。","data":{"seq":"42"}}
```

`release` 可空，非部署事件（OOM、手动重启）不关联 Release。自定义
kind 的 Event 必须写清楚 summary：

```json
{"id":2,"ts":"2026-08-27T13:00:00Z","service":"lobehub","actor":"backup-agent","kind":"custom_backup","summary":"备份数据库到本地磁盘，因为 S3 配额满了。","data":{"path":"/var/lib/db","size":"1.2GB","destination":"/backups/"}}
```

## 用户可见状态与失败行为

- Release 状态：`pending`（已创建未执行）→ `active`（执行成功）/
  `failed`（执行失败）→ `superseded`（被更新的 Release 取代）。
- Event 按时间倒序展示，已知 kind 显示 summary，未知 kind 显示
  summary + 可展开的 data JSON。
- 服务无 Release 时显示「从未部署」；无 Event 时显示空状态。

## 验收标准

- Agent 可通过 `yoi-server` CLI 创建 Service、提交 Release、上报 Event。
- Dashboard 展示 Service 列表、Release 历史、Event 时间线。
- 自定义 Event 的 summary 直接展示，data 可展开查看。
- Service/Release 以 markdown、Event 以 NDJSON 存于 `~/.yoi/`，人类
  可直接阅读。
- 多机场景下，用户的 Agent 分别连接各机 Dashboard，无聚合层。

## 已解决的产品决策

- Release 即版本，Delta 即 Event（2026-08-27）。
- Plan 结构化但 action 开放，yoi 提供 preset 不限定（2026-08-27）。
- Summary 由 Agent 写，yoi 不渲染模板（2026-08-27）。
- 单机隔离，多机由用户的 Agent 分辨（2026-08-27）。
- 存储为 `~/.yoi/` 下的可读文档：扁平静态路径，Service/Release 为
  markdown，Event 为单个 append-only NDJSON 文件（2026-08-27）。
- Release 状态无状态机，有权限即可改（2026-08-27）。
- Event 的 actor 是 Agent 自报的名字（2026-08-27）。
