# ADR: Dashboard 探针后端（Go 单二进制 + gopsutil + 密码会话）

- 状态：已接受
- 日期：2026-08-27

## 背景与约束

Dashboard 的服务器状态部分需要真实指标（PRD `docs/prd/dashboard.md` 要求
对齐哪吒探针采集面）。部署形态是跑在用户 Linux 服务器上的单二进制探针，
仅 localhost + 密码。服务列表/部署记录的数据模型仍待定，本 ADR 只覆盖
服务器指标与认证这两块已落地的后端行为。

## 决策

1. **指标采集用 gopsutil v4**（`github.com/shirou/gopsutil/v4`）：纯 Go、
   无 CGO、跨平台读 /proc（及平台等价物），哪吒探针同款。覆盖 CPU、内存、
   Swap、磁盘、网络 IO、TCP/UDP 连接数、进程数、负载、主机信息与启动时间。
2. **服务进程**：`dashboard/server/`（package main，根 module 内）。
   `vite build` 输出到 `dashboard/server/dist`，由 `go:embed` 内嵌，
   同源提供静态资源（SPA fallback 到 index.html）与 JSON API。
   默认监听 `127.0.0.1:8788`（`-addr` 可改，非 localhost 会打警告）。
3. **认证**：密码来自 `-password` flag 或环境变量 `YOI_DASHBOARD_PASSWORD`
   （默认 `yoi`，仅开发用）。`POST /api/login` 常量时间比较密码，成功后
   签发 32 字节随机会话 token，存内存 map，写 HttpOnly + SameSite=Lax
   cookie；`/api/*`（除 login）经中间件校验会话。无 TLS（localhost 信任
   边界，见 PRD）。会话只在内存中，进程重启即全部失效。
4. **API 契约**（camelCase JSON，与前端 `src/lib/api.ts` 类型一一对应）：
   - `POST /api/login` `{password}` → 204 + cookie / 401
   - `POST /api/logout` → 204
   - `GET /api/server/info` → hostname/os/kernel/arch/cpuModel/cpuCores/
     virtualization/bootTime
   - `GET /api/server/metrics` → cpuPercent/mem/swap/disk/netRate+total/
     tcp+udpConns/processCount/load1·5·15/uptimeSec
   - `GET /api/services` → `[{id, name, status}]`（status 即
     `desired_state`，`removed` 不进列表）
   - `GET /api/services/{id}` → `{id, name, status, packRef, createdAt,
     spec, links, releases, events}`；不存在或已 removed → 404 JSON
5. **网络速率**由相邻两次采样差分得出；进程启动后的第一次采样速率为 0，
   不报「自开机以来平均值」这种误导性数字。
6. **服务数据只读自 `~/.yoi/` store**（`dashboard/server/store/` 包）：
   行级 frontmatter 解析（`---` 之间 `key: value`，与 ctxl 写出的扁平
   约定一致）、body 里 `## Section` 下的 ```json 围栏块、events.ndjson
   逐行解析。刻意不引 YAML 库——frontmatter 只有扁平字符串，根 go.mod
   保持只有 gopsutil 一个直接依赖。store 路径优先级：`-store` flag →
   `YOI_DASHBOARD_STORE` → `~/.yoi`。store 目录缺失 = 空列表，不是错误；
   坏行/坏块容忍为零值，不让手改过的文件打挂整个接口。Release 按
   created_at 倒序（并列时 seq 倒序），Event 按 ts 倒序。
7. **开发期**：Vite dev server 把 `/api` 代理到 `127.0.0.1:8788`，前端
   无跨域问题，cookie 同源流转。

## 备选方案

- **自己读 /proc**：重复造轮子，跨平台（macOS 开发机）成本高。否决。
- **Prometheus node_exporter 拉取**：引入额外进程与依赖，违背单二进制
  探针定位。否决。
- **token 持久化到磁盘 / 多用户**：单用户本机面板，内存会话足够；公网
  暴露是非目标。否决。
- **Basic Auth**：每次请求带密码，浏览器弹窗体验差，且无法登出。否决。

## 权衡与后果

- 内存会话意味着重启探针后所有用户需重新登录——单用户场景可接受。
- 默认密码 `yoi` 是开发便利，部署文档（随数据模型设计）必须引导用户
  设置 `YOI_DASHBOARD_PASSWORD`。
- `net.Connections` 与 `host.BootTime` 在部分系统（含 macOS 沙箱）需要
  权限；采集单项失败时该字段为空/0，接口整体仍返回 200（前端按当前值
  展示，不因单项失败整页骨架屏）。`GET /api/server/info` 按字段独立采集，
  不把 `host.Info()` 的整体失败当成 500。
- 服务 API 已落地（决策 4/6）：读 `~/.yoi/` 真实 store，前端 mock 层
  移除。状态展示的是 `desired_state`（意图），live 实况（容器/进程的
  实时占用）刻意不做——探针每次请求重读文件，store 更新即所见，但
  文件本身由 yoi-server CLI 写，探针不写。

## 验证

- `go build ./dashboard/server` + `go vet` 通过。
- curl 验证：无 cookie 401、错误密码 401、正确密码 204 + cookie、
  带 cookie 的 info/metrics 返回真实数据、SPA 路由 fallback 200。
- 经 Vite 代理（5173 → 8788）的登录与指标请求链路通畅。
