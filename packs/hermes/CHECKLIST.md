# Hermes 初学者清单

绿了就结束。不要在这份清单后面加卸载、备份或修机步骤。

## 上游（写死）

- 仓库：https://github.com/NousResearch/hermes-agent
- 安装器：https://hermes-agent.nousresearch.com/install.sh
- 文档：https://hermes-agent.nousresearch.com/docs/getting-started/quickstart
- 不要换源，不要用第三方一键包代替上面两个地址。

## 前提

- 操作系统：Linux。推荐干净的 Ubuntu 24.04 或 Debian 12。不支持 Windows。
- 机器：至少 2 GB 内存、10 GB 可用磁盘、能访问外网。
- 身份：普通用户即可。不要用 root 当日常账号。
- 场子：这台机器上还没有 Hermes。`command -v hermes` 应失败，并且没有 `~/.hermes`。
- 模型：你自己准备一个可用的模型入口（Nous Portal，或 OpenRouter / OpenAI 等一把密钥）。没有密钥就停，不要让 agent 替你去申请。

## 不能有什么

- 不要在已经装过 Hermes 的脏目录上再跑一遍安装器，除非你明确要覆盖。
- 不要把安装器改成无人值守写进 crontab 或 systemd。第一版绿的标准是命令行能聊，不是网关常驻。
- 不要在未点头时把密钥写进文件或环境变量。

## 步骤

1. 读完本清单，确认这台机器符合前提。
2. 运行参考实现 `packs/hermes/reference/install.sh`。脚本会先复述它要做的事，等你输入 `yes` 才下载并执行官方安装器。
3. 重新加载 shell：`source ~/.bashrc`（zsh 则 `source ~/.zshrc`）。
4. 选模型：`hermes model` 或 `hermes setup`。密钥由你粘贴，agent 只许提醒，不许代填。
5. 启动对话：`hermes`。

网关（Telegram / Discord 等）不是第一版的绿。想加网关是另一次点头，不在本清单里。

## 怎样算绿

同时满足下面三条，才算绿，然后结束：

1. `command -v hermes` 能找到命令。
2. `hermes --help` 能打印帮助并退出 0。
3. 你已经跑过 `hermes`，并能发出一句对话（模型密钥有效，界面没有立刻因缺配置退出）。

绿了就停。不要接着讲怎么修、怎么备份、怎么卸载。
