# ADR: Agent 数据模型（Release 即版本，Event 即事实）

- 状态：已接受
- 日期：2026-08-27

## 背景与约束

yoi 的部署执行者是用户的 Agent（Claude Code、Codex 等），不是 yoi 本身。
Agent 需要跨会话记忆：上次部署了什么、为什么失败、配置改成了什么样。
用户需要审计：Agent 到底对这台机器做了什么。

约束：
- 跑在用户 Linux 服务器上，单二进制，低占用。
- 存储必须人类可读，Agent 可解析。
- 不引入外部数据库（SQLite 或文件系统均可，但实体必须可导出为文档）。
- Dashboard 是只读视图，写入口是服务器上的 `yoi-server` CLI。

## 决策

### 1. 三实体分离

- **Service**：逻辑身份，几乎不变。运行时绑定、端口、限制、链接都在
  frontmatter（见 `docs/adr/service-runtime-binding.md`）。不再用 body
  里的 `## Spec` JSON 当配置。
- **Release**：一次部署意图，不可变。`config` 是完整快照，`plan` 是
  Agent 自述，`outcome` 是执行结果。创建后只能改 `status`。
- **Event**：独立的事实记录，append-only。`release` 可空，非部署
  事件（OOM、手动重启）不强制关联 Release。

Resource（实时状态）不是存储实体，见决策 9。

### 2. Release 即版本，Delta 即 Event

Release 是配置快照，Event 是两个快照之间的增量描述。Event 的 `data`
是结构化 JSON，`kind` 决定语义。yoi 提供 preset kind（`deploy_started`、
`config_change`、`health_check_failed` 等），Agent 可自定义。

### 3. Plan 结构化但开放

`plan` 是 JSON，包含 `goal` 和 `steps[]`。`steps` 的 `action` 是开放
集合：
- yoi 提供 preset：`pull_image`、`stop_container`、`start_container`、
  `health_check`、`run_command`、`write_file`、`wait`。
- Agent 可发明新 action，yoi 不校验，只要求合法 JSON。

### 4. Summary 由 Agent 写

每个 Event 必须有 `summary` 字段，是 Agent 写的人读文本。yoi 不渲染
模板，Dashboard 直接展示。自定义 kind 的 Event 靠 `summary` 解释，
`data` 可折叠展示。

### 5. 存储为扁平静态路径下的文档

实体存于 `~/.yoi/`，路径全部静态；实体间关系写在 frontmatter /
NDJSON 字段里，不用文件系统嵌套表达（ctxl 的设计哲学）：

```
~/.yoi/
  services/<service-id>.md   # Service：配置全在 frontmatter（含 runtime / links）
  releases/<uuid>.md         # Release：frontmatter 扁平字段，body 存 ## Plan / ## Config / ## Outcome
  events.ndjson              # Event：一行一个 JSON 对象，id/ts 由 CLI 自动补上
```

Service 配置（含对象/数组）写在 YAML frontmatter。Release 的结构化
负载仍在 body 的 fenced JSON（Plan / Config / Outcome）；Event 的
`data` 在 NDJSON 的 object 字段。人类可直接阅读，Agent 可解析。

### 6. 无状态机，权限即事实

Release 的 `status`（`pending`/`active`/`failed`/`superseded`）是事实
记录，不是强制流转。任何有 `yoi-server` CLI 权限的实体（Agent 或
用户）都可改，改状态本身记为 Event。

### 7. 单机隔离，无聚合层

每个 Dashboard 是独立宇宙，Service id 本机唯一即可。多机场景由用户的
Agent 分别连接各机 Dashboard，自行分辨「哪台机器上的哪个服务」。

### 8. 两个 ctxl 生成的 CLI 分别是两个世界 store 的写入口

两个世界的 `~/.yoi/` 各自由一个 ctxl 生成的 CLI 写入：

- **Server 世界**：`yoi-server`（schema：`yoi-server.schema.json`），
  管理本机的 Service/Release/Event。
- **Client 世界**：`yoi`（schema：`yoi.schema.json`），管理
  server/provider/credential 清单。

两个 CLI 的 store 名都是 `yoi`（store dir 都是 `~/.yoi/`），但跑在
不同机器上，不会冲突。Dashboard 只读；Agent 在对应机器上通过对应
CLI 写入。

命名冲突已解决（2026-08-27）：原 `cmd/yoi` 的 pack 分发 CLI 已删除，
pack 分发改为 yoi skill 内的纯 HTTP 配方（见
docs/adr/pack-delivery-via-skill.md），`yoi` 二进制名无冲突地归
ctxl 生成的 client CLI。

### 9. Resource 由 Go 探针实时提供，不落盘

Resource（实时 CPU/内存/容器状态）不是 store 实体：Dashboard 的 Go
probe 在请求时采集并返回，从不写入 `~/.yoi/`。「现在怎样」永远以
探针为准；store 只记「想要什么」（Service 的 `desired_state`、
Release 的 config 快照）和「发生过什么」（Event），避免双写不一致。

## 备选方案

- **集中式事件 sourcing（Event 是源，Release 是投影）**：理论优雅，
  但 Agent 需要理解 event sourcing 概念，且回滚需要回放所有 Event。
  对「Agent 自述」场景过重。否决。
- **Release 状态机强制流转**：pending → deploying → active/failed，
  非法流转拒绝。但 Agent 可能崩溃，状态会卡住；且 yoi 的定位是
  context layer，不是部署引擎。否决。
- **SQLite 单一表存储**：查询方便，但人类不可读，违背「存储即文档」。
  否决。
- **Narrative 由 yoi 渲染**：统一格式，但 custom kind 无法渲染，且
  限制 Agent 表达。否决。

## 权衡与后果

- **文档存储**：人类可读，Agent 可解析，但并发写需要文件锁；
  `events.ndjson` 单文件只增不减，长期需要轮转/归档策略（暂不在
  范围内）。
- **扁平路径**：关系靠字段引用（`service`、`release`），CLI 不做
  引用完整性校验；悬挂引用（指向不存在实体的 id）由消费方容忍。
- **开放 action**：Agent 自由度高，但 Dashboard 对未知 action 只能
  原样展示 JSON，无法提供针对性 UI。
- **无状态机**：灵活，但依赖 Agent 自律。恶意或 buggy Agent 可能留下
  不一致状态（比如长期 `pending`）。
- **单机隔离**：简单，但用户需要自己管理「哪台机器有什么服务」——
  这正是 client 世界 `yoi` CLI 的 server 清单要解决的。
- **Resource 不落盘**：永远准确、无一致性问题，但历史资源曲线无从
  追溯（Dashboard 的内存 ring buffer 只覆盖最近 1 小时）。

## 验证

- `~/.yoi/services/*.md`、`~/.yoi/releases/*.md` 可直接阅读，
  frontmatter 可解析；`~/.yoi/events.ndjson` 每行是合法 JSON。
- Agent 通过 `yoi-server` CLI 创建 Release 后，Dashboard 能展示其
  plan 和 outcome。
- 自定义 kind 的 Event 在 Dashboard 显示 summary，data 可展开。
- 多机场景：用户的 Agent 分别连接两台 Dashboard，能区分同名服务。
