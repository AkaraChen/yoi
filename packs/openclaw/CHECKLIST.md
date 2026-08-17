# OpenClaw 知识

这是产品知识，不是安装手册。怎么部署、绿了怎么记，走 `yoi skills get deploy`。

## 它是什么

OpenClaw 是跑在自己设备上的个人 AI 助手：Gateway 是本地控制面（会话、工具、事件、渠道连接），助手本体住在你已经在用的聊天渠道里。

- 仓库：https://github.com/openclaw/openclaw
- 文档：https://docs.openclaw.ai
- 第一版有用的面 ≈ 官方 quickstart 的终点：`openclaw onboard --install-daemon` 走完，Gateway 在 18789 端口监听，`openclaw dashboard` 打开 Control UI，人在里面发一条消息并收到 AI 回复。不是 29 个渠道全接，也不是语音、Canvas 都配好。

## 环境/配置怎么选

- 运行时：Node 22.22.3+、24.15+ 或 25.9+，官方推荐 Node 26。用官方 curl 安装器时，缺 Node 会自动配备；自己管 Node 才需要核对版本（`node --version`）。
- 官方安装路径（Linux）：`curl -fsSL https://openclaw.ai/install.sh | bash`；只装不跑向导用 `bash -s -- --no-onboard`。已自管 Node 也可以 `npm install -g openclaw@latest`。
- 包管理器的坑（官方文档写明）：npm 12 默认拦截 lifecycle scripts，全局安装要加 `--allow-scripts openclaw`；pnpm 全局安装要加 `--allow-build=openclaw`；bun 能装包，但装出的 `openclaw` 仍需要合格的 Node 运行时（状态存储用 `node:sqlite`）。
- 端口：Gateway 监听 18789。
- 必设凭据：一个模型提供商的 API key（Anthropic、OpenAI、Google 等），onboard 向导会提示。密钥永远由人粘贴，agent 只提醒、不代填。
- 守护进程：Linux 上由 `openclaw onboard --install-daemon` 或 `openclaw gateway install` 安装 systemd user service。
- 自定义路径（服务账号等场景）：`OPENCLAW_HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`。
- 已知坑：`openclaw` 命令找不到几乎都是 PATH 问题——npm 全局 bin 目录不在 shell 的 `PATH` 里（用 `npm prefix -g` 对照 `echo "$PATH"` 排查）。

## 怎么算可用

同时满足下面三条，这个助手才算可用：

1. `openclaw --version` 能打印版本（命令存在），`openclaw --help` 能打印帮助并退出 0。
2. `openclaw doctor` 没有阻断性问题，`openclaw gateway status` 显示 Gateway 在 18789 监听。
3. 人已经走完 `openclaw onboard`，并 `openclaw dashboard` 打开 Control UI，发一条消息收到了助手的实际回复。
