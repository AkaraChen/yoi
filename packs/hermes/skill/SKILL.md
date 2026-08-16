---
name: hermes
description: Beginner Hermes install on a clean Linux machine. Use only when the human asked to install Hermes. Opt-in at every irreversible step. Stop when the service is green.
---

# Hermes 初学者 skill

先读仓库里的 `packs/hermes/CHECKLIST.md`。不要发明另一份上游地址。

## 必须先问

在做下面任何一件事之前，用白话问人，得到明确同意再继续。没同意就停。

1. 要不要在这台 Linux 上安装 Hermes？
2. 可以运行 `packs/hermes/reference/install.sh` 吗？它会下载并执行官方安装器，并写入 `~/.hermes`。
3. 模型密钥由人自己粘贴。不要代填，不要写进你能看见的记录里。问人：用 Nous Portal，还是自带 OpenRouter / OpenAI 等密钥？

## 禁止

- 不要静默执行 `curl | bash`。
- 不要用 root 安装。
- 不要在已有 `hermes` 或 `~/.hermes` 的机器上强装。
- 不要安装 Telegram / Discord 网关，除非人另一次明确要求；那不是第一版的绿。
- 不要讲卸载、备份、修机。

## 怎么做

1. 核对清单里的前提。
2. 人点头后运行参考脚本，不要改脚本里的安装器地址。
3. 提醒人 `source ~/.bashrc` 或 `source ~/.zshrc`。
4. 人自己跑 `hermes model` 或 `hermes setup`，再跑 `hermes`。

## 怎样算绿

三条都满足就结束：

- `command -v hermes` 成功
- `hermes --help` 退出 0
- 人已经发出一句对话

绿了就停。不要接着推销网关或运维。

没有仓库克隆时：人点头后，把官方安装器下载到临时文件再执行，地址必须是 https://hermes-agent.nousresearch.com/install.sh 。不要换源。
