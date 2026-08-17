# ADR: CLI 二进制分发（tag → Release 资产 + install.sh）

- 状态：已接受
- 日期：2026-08-17

## 背景与约束

沙箱试验（hermes / openclaw / lobehub 三轮，`trials/`）一致表明：**Go 工具链是
yoi CLI 分发的最大摩擦**——目标机器（干净 Linux 容器）没有 Go，agent 要先装
工具链、配 GOPATH/GOBIN、处理权限与网络，才能跑 `go install`。约束：

- 目标机器是 POSIX 环境（Linux/macOS），多数没有 Go，但都有 curl 或 wget、tar。
- 分发必须免认证：agent 在干净机器上没有 GitHub token。
- **关键技术约束：GitHub Actions 的 workflow artifacts 无法免认证下载**——即使
  公开仓库，直接 GET artifact URL 也返回 401（nightly.link 这类服务存在的原因
  正在于此）。因此「装最新 CI 构建」不能走 artifacts，必须走 Release 资产：
  `releases/latest/download/<asset>` 是无需 API 调用、无需认证、永远指向最新
  Release 的重定向。
- Release 资产名必须**不含版本号**，否则 `releases/latest/download/` 拼不出
  固定 URL。

## 决策

1. **Tag 触发构建**：`.github/workflows/release.yml` 在推送 `v*` tag 时运行。
   先 `go test ./...`，再按矩阵（goos ∈ {linux, darwin} × goarch ∈ {amd64,
   arm64}，共 4 个目标）交叉编译（`CGO_ENABLED=0`），经
   `-ldflags "-X main.version=$TAG"` 注入版本（`cmd/yoi` 新增
   `var version = "dev"`，经 cobra 的 `Version` 字段暴露为 `yoi --version`）。
2. **Release 资产即分发产物**：每个目标打包为无版本号的
   `yoi_<goos>_<goarch>.tar.gz`（含二进制，LICENSE/README 存在则一并打入），
   另生成覆盖全部 tar 包的 `checksums.txt`（sha256），全部作为 GitHub Release
   资产发布。
3. **install.sh 一键安装**：仓库根目录的 POSIX sh 脚本，检测 OS/架构，从
   `releases/latest/download/` 下载对应 tar 包与 checksums.txt，校验 sha256
   （sha256sum 或 shasum），装到 `${YOI_INSTALL_DIR:-$HOME/.local/bin}`
   （覆盖旧版即升级路径），无需 root。用法：
   `curl -fsSL https://raw.githubusercontent.com/AkaraChen/yoi/main/install.sh | sh`。
4. **skill 引导顺序**：`skills/yoi/SKILL.md` 把 install.sh 列为装 CLI 的首选
   （无需 Go），`go install` 降为兜底；「先问人、不静默安装」规则不变。
5. **不支持 Windows**：install.sh 是 POSIX 脚本，发布矩阵不含 windows；Windows
   用户走 `go install` 兜底。

## 备选方案

- **workflow artifacts 直链**：无法免认证下载（公开仓库同样 401），install.sh
  无法消费。否决——这是本 ADR 的核心约束。
- **只保留 `go install`**：试验已证明它是最大摩擦点，目标机器普遍没有 Go。
  否决，但保留为兜底路径。
- **GoReleaser**：功能全但引入额外配置层；当前 4 个目标 + tar.gz + checksums
  用原生 matrix + softprops/action-gh-release 足够。暂缓。
- **Homebrew / 包管理器**：覆盖面和体验更好，但需要维护 tap 或进官方仓库，
  发布流程更重。暂缓，Release 资产就绪后可叠加。
- **nightly.link 代理 artifacts**：引入第三方可用性依赖，且 Release 方案已满足
  需求。否决。

## 权衡与后果

- 「最新版」语义 = 最新 Release，而非最新 commit：只有打了 `v*` tag 才有二进制。
  第一个 tag 推送前 install.sh 必然失败——脚本对此给出明确报错并指向
  `go install` 兜底。
- 无版本号资产名使 `releases/latest/download/` 永久可用；代价是资产本身不携带
  版本信息，版本靠二进制内注入的 `main.version`（`yoi --version`）查询。
- 发布与 main 分支解耦：main 上的 install.sh 永远装最新 Release，不需要随
  发布改动。
- 失败边界：无 Release → 下载 404，脚本报错并提示兜底；checksum 缺失或不符 →
  中止安装；不支持的 OS/架构 → 明确报错。脚本不产生半安装状态（先校验后落盘，
  落盘用同目录 mv 覆盖）。

## 验证

- `sh -n install.sh` 与 shellcheck 通过；`actionlint` 校验 workflow 通过。
- `go build ./...`、`go test ./...` 通过；本地构建
  `-ldflags "-X main.version=v0.0.0-test"` 后 `yoi --version` 输出注入值。
- 首个 `v*` tag 推送后，人工确认 Release 资产齐全且
  `curl -fsSL .../install.sh | sh` 在干净 Linux/macOS 机器上装出对应版本。
