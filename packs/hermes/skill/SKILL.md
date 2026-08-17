---
name: hermes
description: Knowledge about Hermes and how to install from the pack reference after yoi get hermes.
---

# Hermes

先读 `packs/hermes/CHECKLIST.md` 和 `packs/hermes/page.mdx`。

## 它是什么

命令行 agent，上游是 https://github.com/NousResearch/hermes-agent 。有用的面是终端对话，不是网关。

## 模型怎么选

问人：用 Nous Portal，还是自带 OpenRouter / OpenAI 等密钥？密钥由人粘贴。不要代填。

## 对话怎么算可用

- 能打开 Hermes
- 它能正常显示帮助
- 人已经发出一句对话，并且模型有回应

## 安装

用 `packs/hermes/reference/install.sh`。脚本要等人输入 yes。不要静默安装。

绿了用 `yoi deploy write` 和 `yoi log append`。
