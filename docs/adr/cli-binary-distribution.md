# ADR: CLI 与探针二进制分发（tag → Release 资产 + raw install cmdspec）

- 状态：已接受
- 日期：2026-08-27
- 取代：2026-08-17 同名 ADR（该版只覆盖已删除的 pack-delivery `cmd/yoi`，
  且已被 docs/adr/pack-delivery-via-skill.md 废止）
- 不取代：docs/adr/pack-delivery-via-skill.md（pack 仍是 skill 内 HTTP，
  本 ADR 只分发两个 ctxl CLI 与 Dashboard 探针）

## 背景与约束

沙箱试验表明 Go 工具链是目标机上的最大摩擦。约束：

- 分发必须免认证：agent 在干净机器上没有 GitHub token。
- **GitHub Actions workflow artifacts 无法免认证下载**（公开仓库 GET 也
  401）。install 入口只能消费 Release 资产：
  `releases/latest/download/<asset>`。
- 资产名必须不含版本号，否则 latest URL 拼不出。
- ctxl 生成目录在 regen 时整树替换。不要手改 `generated/*/main.go` 注入
  版本——regen 会悄悄丢掉。版本写在 GitHub Release tag 上；探针
  `main.go` 由本仓库维护，可以有 `var version`。
- Windows 现纳入两个 CLI 的发布矩阵；探针对外承诺的是 Linux。

## 决策

1. **Tag 触发构建**：`.github/workflows/release.yml` 在推送 `v*` tag
   时运行（可选 `workflow_dispatch` 只跑测试与交叉编译，不发布）。
   先 `go test` 仓库根上已有测试的包（`dashboard/server/live`、
   `dashboard/server/store`），不要求不存在的 dashboard npm test。
   `CGO_ENABLED=0` 交叉编译。
2. **CLI 矩阵**：`generated/yoi` → `yoi`，`generated/yoi-server` →
   `yoi-server`。goos ∈ {linux, darwin, windows} × goarch ∈ {amd64,
   arm64}。Windows 资产为 `.zip`（内含 `.exe`），其余为 `.tar.gz`。
3. **探针**：`dashboard/server` 发布名为 `yoi-dashboard`。CI 在
   `dashboard/` 下 `npm ci && npm run build`（令牌是相对路径引用
   `design/` 源文件，插件装在 dashboard 自己的 `node_modules`），使
   `go:embed all:dist` 能嵌进 `dashboard/server/dist`。至少 linux
   amd64 + linux arm64。
   经 `-ldflags "-X main.version=$TAG"` 注入；`yoi-dashboard -version`
   打印该值。darwin/windows 探针资产不做承诺。
4. **资产命名**（无版本号）：
   `yoi_<goos>_<goarch>.tar.gz` / `yoi_windows_<arch>.zip`，
   `yoi-server_*` 与 `yoi-dashboard_*` 同构。另发 `checksums.txt`
   （sha256，覆盖全部档案）。
5. **install 入口**在仓库根，经 raw.githubusercontent.com 获取：
   Unix 是 cmdspec（Agent 解读，不可 `curl | sh`）：
   `install-yoi.cmdspec`、`install-yoi-server.cmdspec`。
   Windows 仍是 PowerShell：`install-yoi.ps1` / `install-yoi-server.ps1`
   （cmdspec 在此仓库描述 Unix 命令，不替代 `.ps1`）。
   探测 OS/架构，从 latest Release 下载、校验、装到
   `${YOI_INSTALL_DIR:-$HOME/.local/bin}`（Unix，无需 root）或
   `%LOCALAPPDATA%\yoi\bin`（Windows，需自行加入 PATH）。
   覆盖即升级。可选的 `install-yoi-dashboard.cmdspec` 仅 Linux，保持与
   两条 CLI 安装器分离。
6. **skill**：`skills/yoi/references/fleet.md` 给出 client 安装命令；
   `skills/yoi-server/` 自定义 skill（登记在 `yoi-server.schema.json`）
   给出 server CLI + 探针 + systemd 示例。安装前必须问人。
7. **不走 workflow artifacts 当分发面**；job 之间传文件可以，对外 URL
   必须是 Release。

## 备选方案

- **workflow artifacts 直链**：无法免认证。否决。
- **只保留从源码 `go build`**：目标机普遍没有 Go。否决；源码构建仍是
  开发者路径（AGENTS.md）。
- **GoReleaser / Homebrew**：额外配置层，暂缓。
- **单一安装入口装所有二进制**：违背「两条 CLI 各一条安装
  路径」，且容易让人以为 pack CLI 还在。否决。
- **在 generated main.go 里注入 version**：regen 丢改动。否决。

## 权衡与后果

- 「最新版」= GitHub 的 latest 正式 Release，不是最新 commit。
  仓库已有 `v0.1.0`（旧 pack CLI）。缺资产或 404 时安装必须说清楚并
  中止，不落盘。
- 资产本身不带版本号；探针可用 `-version` 读注入值；CLI 版本以
  Release tag 为准。
- main 上的 install cmdspec 永远指向 latest Release，发布时不必改文档。
- 本决策不把 pack 投递改回二进制。

## 失败边界

- 无 Release / 资产 404 → 中止，提示尚无发布。
- checksum 缺失或不符 → 中止。
- 不支持的 OS/架构 → 明确报错。
- 先下载到临时目录并校验，再用同目录 `mv` 覆盖，避免半安装。

## 验证

- `install-yoi.cmdspec`、`install-yoi-server.cmdspec`（及可选的
  dashboard cmdspec）通过 cmdspec 参考解析器（`npx cmdspec check`）。
- `go test ./dashboard/server/live ./dashboard/server/store` 通过。
- 本机 `go build` 两个 generated CLI 与（先 vite build 后的）
  `dashboard/server`。
- 发布含现资产名的 `v*` 后，人工确认 Release 资产齐全且未认证
  latest URL 可下载。
