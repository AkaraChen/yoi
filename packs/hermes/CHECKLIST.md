# Hermes 知识

这是产品知识，不是安装手册。落地与登记走 client 上的 yoi skill。

## 它是什么

Hermes 是 [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)（MIT）的命令行 agent：人在终端或聊天平台里跟它对话，它调人选好的模型干活。

- 仓库：https://github.com/NousResearch/hermes-agent
- 文档：https://hermes-agent.nousresearch.com/docs/
- Quickstart：https://hermes-agent.nousresearch.com/docs/getting-started/quickstart
- 安装文档：https://hermes-agent.nousresearch.com/docs/getting-started/installation

第一版有用的面 = 官方 quickstart 的终点：装好 → `hermes model` 选定 provider 与模型 → `hermes`（或 `hermes --tui`）完成第一段真实对话 → `hermes --continue` 能恢复会话。gateway（Telegram / Discord 等）、cron、skills、语音都是官方文档里的「下一层」；官方原话：基础对话没跑通之前，不要叠加任何功能。

## 环境/配置怎么选

官方安装器覆盖 Linux / macOS / WSL2 / Termux（curl 脚本）与 Windows 原生（PowerShell）；本 pack 的 reference cmdspec 只走 Linux。

官方写明的前置（非 Windows）：

- Git 是唯一硬前置，`git --version` 能打印即可
- Linux 另需 `curl` 与 `xz-utils`（安装器要下载 Node.js 的 `.tar.xz`）
- 其余一律不手动预装：uv、Python 3.11、Node.js v22、ripgrep、ffmpeg 由安装器自动处理

安装布局（普通用户）：代码在 `~/.hermes/hermes-agent/`，命令是 `~/.local/bin/hermes` 的 symlink，数据在 `~/.hermes/`。装完必须 `source ~/.bashrc`（或 `~/.zshrc`）或重开终端，否则 `command not found`。

配置存放：密钥与 token 进 `~/.hermes/.env`，非秘密设置进 `~/.hermes/config.yaml`；推荐用 `hermes config set` 写入，会自动放对文件。

模型入口由人自己准备，agent 只提醒、不代填：

- 最省事：`hermes setup --portal`，一次 OAuth 搞定 Nous Portal（300+ 模型与 Tool Gateway）
- 或 `hermes model` 交互选择：OpenRouter、OpenAI、Anthropic、自建 OpenAI 兼容 endpoint 等
- 硬指标：模型上下文至少 64K tokens，否则启动即被拒；本地模型要显式设 context（llama.cpp `--ctx-size 65536`，Ollama `-c 65536`）

已知坑（官方 troubleshooting）：

- `hermes: command not found` → reload shell 或检查 PATH
- 能打开但回复空/乱 → provider 认证或模型选错，重跑 `hermes model`
- 自建 endpoint「能连但返回垃圾」 → 先用别的客户端验证它真的是 OpenAI 兼容
- 感觉不对就按官方顺序来：`hermes doctor` → `hermes model` → `hermes setup`

实测补充（2026-08 沙箱试验）：官方安装器有长时间静默阶段——uv/Python 下载和 git clone 期间可能几分钟无输出。这不是卡死，不要中断安装进程；只有出现明确报错文字或新的交互提示时才行动。

## 怎么算可用

同时满足：

1. `command -v hermes` 能找到命令（找不到先 source shell 配置）。
2. `hermes --help` 能打印帮助并退出 0；`hermes doctor` 无阻断性报错。
3. 人已完成一次真实对话，达到官方 quickstart 的成功标准：banner 显示所选 provider/模型；回复无报错；需要时能调用工具（终端、文件读取、网页搜索）；对话能正常进行超过一轮。
4. `hermes --continue` 能恢复刚才的会话。

密钥与凭据永远由人粘贴，agent 只提醒、不代填。
