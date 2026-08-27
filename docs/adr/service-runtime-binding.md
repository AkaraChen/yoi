# ADR: Service runtime 写在 frontmatter，探针按 kind 查 live

- 状态：已接受
- 日期：2026-08-27

## 背景与约束

live 占用不能猜。必须先有稳定的 supervisor 绑定（compose 文件、容器名、
unit 名等），PID 会变，不能当身份。ctxl 的 markdown 实体 frontmatter
目前按 `key: value` 字符串写盘，但产品要求 **形式化配置都在 frontmatter**，
包括数组和对象，并砍掉 Service body 的 `## Spec` JSON。

Dashboard 探针只读 store，不写；真正执行 `docker` / `podman` /
`systemctl` / `pm2` / custom 命令的是探针（请求 live 时）。

## 决策

### 1. Service frontmatter 字段（形式化，取代 spec JSON）

除已有 `display_name` / `pack_ref` / `desired_state` / `created_at` 外：

- `ports`：字符串，空白或逗号分隔，如 `3210 8080`
- `cpu` / `memory`：资源限制声明（给人看，不是 live）
- `links`：数组，元素 `{id, name, link}`
- `runtime`：一个对象，判别字段 `kind`

env 不进 store（密钥风险，面板本来也不展示值）。

`## Spec` JSON 不再是配置源。读取时若 frontmatter 无新字段、仅有旧
`## Spec`，可作一版兼容回退，写路径只写 frontmatter。

### 2. `runtime` 形状（一个 Service 一个 kind）

```text
kind: compose | docker | podman | systemd | pm2 | pidfile | socket | custom

compose:  file, project?, services[]?
docker:   containers[]     （名字，不是 ID）
podman:   containers[]
systemd:  units[]          （如 lobehub.service）
pm2:      names[]
pidfile:  files[]          （pid 文件路径）
socket:   sockets[]        （.sock 路径，解析时映射到当前 PID）
custom:   command          （一条 shell）
```

PID 本身不入库。pidfile / socket 的**路径**稳定，查询时再解析。

### 3. health 来自 runtime

不把 HTTP `health_endpoint` 当主探活。各 kind：

- docker / podman / compose：容器 State + Health（若有）
- systemd：ActiveState / SubState（active = 健康）
- pm2：status（online = 健康）
- pidfile / socket：能解析到活进程 = 健康
- custom：该行 `status`（约定 `running` / `healthy` 为健康）

查失败或目标 missing = 不健康 / 未绑定，进入合成规则，接口仍 200。

### 4. custom 命令

探针在用户 home 下执行，超时 10s。退出码必须为 0，stdout 必须是 JSON
数组。每行至少建议 `name`、`status`、`cpuPercent`、`memBytes`；**允许**
`pid` 以及任意多余字段（原样进 `raw` 或透传）。非 0 或坏 JSON = 探测失败。

### 5. 合成状态

见 `docs/prd/service-runtime-live.md`。列表与详情使用同一套合成结果。
无 runtime 的合成状态为 `unknown`（无法探测），不是 `stopped`。

### 6. ctxl 与数组

`yoi-server` schema 为 `runtime`、`links` 声明 `object`（或字符串）字段。
Agent 传入 JSON。Dashboard store 的 frontmatter 类型由
`dashboard/server/store/schema.json` 经 `go-jsonschema` 生成
（`go generate ./dashboard/server/store`）。读取时 YAML → 生成类型，
不手写字段解码。手写 YAML 数组与 CLI 写入的 JSON 单行都能读。

## 备选方案

- **继续用 ## Spec JSON**：与「配置必须形式化进 frontmatter」冲突。否决。
- **全机扫描猜容器**：误伤、且与「没声明就不探测」冲突。否决。
- **主路径 HTTP health**：用户要求跟 runtime 走。否决作为主路径。

## 权衡

- 探针依赖本机 CLI（docker/podman/systemctl/pm2）在 PATH 中；缺了该 kind
  的探测失败，不 500。
- custom 是任意 shell，信任边界仍是 localhost + 密码；与「Agent 已能在
  这台机器上执行命令」同一级别。
- ctxl 生成的 CLI 把 object 当字符串 flag 传入，文档/skill 必须写清 JSON
  示例。

## 验证

- 每种 kind 用临时 store + 假/真 supervisor 至少一条路径：有目标 / missing。
- 旧 `## Spec` 文件在兼容回退下 links/ports 仍能读；新写入不再产生 `## Spec`。
