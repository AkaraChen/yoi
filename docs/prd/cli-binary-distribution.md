# PRD: CLI 与探针二进制分发

## 问题与背景

`yoi`（client 世界 fleet）与 `yoi-server`（server 世界事实存储）是
ctxl 生成的两个 CLI；Dashboard 探针是 `dashboard/server` 的单二进制。
目标机器多数没有 Go。需要一条免认证、可被 agent 复述的安装路径，
且不把 pack 投递绑回二进制（pack 仍是 skill 内 HTTP）。

## 目标用户

- **开发机上的 Agent**：在人同意后安装 `yoi`，写本机 `~/.yoi/` fleet。
- **服务器上的 Agent / 人**：在人同意后安装 `yoi-server` 与
  `yoi-dashboard`，写 server 世界 `~/.yoi/`，并用 systemd 常驻探针。

## 用户故事

- 作为 Agent，fleet 写入需要 `yoi` 时，我向人出示 install cmdspec，
  得到同意后再解读执行；不静默安装。
- 作为 Agent，我在 Linux 服务器上按对应 cmdspec 装 `yoi-server`，并从同一
  Release 取 `yoi-dashboard`，写好 systemd unit，探针监听
  `127.0.0.1:8788`。
- 作为 Windows 上的人/Agent，我用 PowerShell 脚本装两个 CLI（不是探针）。
- 作为遇到 404 / 缺资产的使用者，install 以明确错误结束，
  不留下半安装。`v0.1.0` 已存在（旧 pack CLI）；本分发从后续
  `v*`（如 `v0.1.1`）起提供现资产名。

## 目标

- 推送 `v*` tag 后，GitHub Release 提供免认证的
  `releases/latest/download/<asset>` 资产。
- 两个 CLI 各有独立的 Unix cmdspec 与 PowerShell 安装入口（raw.githubusercontent.com）。
- 资产名不含版本号，latest 拼出的 URL 稳定。
- 安装覆盖即升级；先校验 sha256 再落盘。
- 探针 Linux 资产随同一 Release 发布；skill 鼓励 systemd，并要求
  `YOI_DASHBOARD_PASSWORD`（不得把开发默认密码 `yoi` 当生产默认）。

## 非目标

- 不写 SSH 胶水、connect wrapper、sshpass、隧道守护进程。Agent 活在
  开发机上；人把 SSH 信息交给 Agent。
- 不把 pack `reference/install.cmdspec` 当成 CLI 产品安装器。
- 不恢复已删的 pack-delivery CLI，不提供安装旧 `cmd/yoi` 的通用
  安装入口。
- pack 投递不依赖任一 CLI（见 docs/adr/pack-delivery-via-skill.md）。
- 探针的 Windows / macOS 常驻不在范围内；agent 自行处理。
- Homebrew / 包管理器 / GoReleaser 暂缓。

## 范围与用户流

1. 人同意安装某个二进制。
2. Agent 解读对应 cmdspec（Unix）或运行 `irm | iex`（Windows）。
3. 探测 OS/架构，从 `releases/latest/download/` 拉档案与
   `checksums.txt`，校验后写入用户可写目录。
4. 覆盖已有文件即升级。
5. 服务器上再取 `yoi-dashboard`，写 systemd unit，启探针。

## 可见状态与失败

- **成功**：目标目录出现对应二进制；覆盖旧文件。
- **无 Release / 404**：明确失败，不落盘。
- **checksum 缺失或不符**：中止，不落盘。
- **不支持的 OS/架构**：明确失败。
- CLI/探针 Unix 安装器是 cmdspec，文档内无 yes-gate。确认
  由 skill / 人在环完成。Windows `.ps1` 同样非交互。

## 验收标准

- 推送 `v*` tag 后，Release 含 `yoi`、`yoi-server`（linux/darwin/windows ×
  amd64/arm64）与 `yoi-dashboard`（至少 linux amd64 与 linux arm64）的
  无版本号档案，以及覆盖全部档案的 `checksums.txt`。
- 未认证 GET `https://github.com/AkaraChen/yoi/releases/latest/download/<asset>`
  成功；不依赖 workflow artifact URL。
- 按 `install-yoi.cmdspec` 与 `install-yoi-server.cmdspec` 在已发布
  Release 的 Linux/macOS 上装出对应 CLI。
- Windows 上 `install-yoi.ps1` / `install-yoi-server.ps1` 装到用户可写目录
  （默认 `%LOCALAPPDATA%\yoi\bin`）并提示加入 PATH。
- 无 Release 时安装中止且目标路径无新半文件。
- `skills/yoi` 与 `skills/yoi-server` 在安装前要求询问人；文案不宣称
  静默安装。
- pack HTTP 配方不把 CLI 列为前置。

## 已决产品决策

- Agent 在开发机；不实现 SSH 隧道产品。
- 两个 CLI 各一条 Unix cmdspec 安装路径；探针同 Release 出二进制。
- 探针 systemd 文档只覆盖 Linux。
- `releases/latest` 指向 GitHub 认定的最新正式版。旧 `v0.1.0`
  资产名可能撞车但不含 `yoi-server` / `yoi-dashboard`；现矩阵从
  其后的 tag 起生效。
