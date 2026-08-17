---
name: hermes
description: Knowledge about Hermes — how to pick a model, what counts as a usable chat, and the pack reference install.
---

# Hermes

先读 `packs/hermes/CHECKLIST.md`。

## 模型怎么选

问人：用 Nous Portal，还是自带 OpenRouter / OpenAI 等密钥？密钥由人粘贴。不要代填。

## 对话怎么算可用

- 能打开 Hermes
- 它能正常显示帮助
- 人已经发出一句对话，并且模型有回应

## 安装

用 `packs/hermes/reference/install.sh`。脚本要等人输入 yes。不要静默安装。

绿了用 `yoi deploy write` 和 `yoi log append`。
