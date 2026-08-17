---
name: hermes
description: Knowledge about Hermes — what it is, how to pick a model, what counts as a usable chat. Not an install guide. Use yoi skills get deploy for deploy and recording green.
---

# Hermes 知识 skill

先读 `packs/hermes/CHECKLIST.md`。这是知识扩展，不写安装步骤。

## 它是什么

命令行 agent，上游是 https://github.com/NousResearch/hermes-agent 。有用的面是终端对话，不是网关。

## 模型怎么选

问人：用 Nous Portal，还是自带 OpenRouter / OpenAI 等密钥？密钥由人粘贴。不要代填，不要写进你能看见的记录。

已有 Hermes 就接着选模型或直接对话，不要要求重装。

## 对话怎么算可用

- `command -v hermes` 成功
- `hermes --help` 退出 0
- 人已经发出一句对话，并且模型有回应

## 不要做

- 不要在这份 skill 里教安装或部署。那是 `yoi skills get deploy`。
- 不要因为机器上已有 Hermes 就拒绝继续。
- 不要推销网关、卸载或修机。
