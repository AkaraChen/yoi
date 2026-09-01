---
name: hermes
description: Install and verify the Hermes agent (NousResearch/hermes-agent) — official install path, provider and model setup, and the bar for a usable first chat.
---

# Hermes

产品知识。落地与登记走 yoi client skill，不要在这里记账。

先读 `packs/hermes/CHECKLIST.md`，前置条件、模型入口、可用标准在那里。

## 可用标准

- `command -v hermes` 找得到，`hermes --help` 正常打印
- 人已选定 provider 与模型，并完成一次真实对话（有来有回、能调工具、超过一轮）
- `hermes --continue` 能恢复会话

基础对话没跑通之前，不碰 gateway、cron、skills 等任何下一层功能。

## 安装

用 `packs/hermes/reference/install.cmdspec`（解读，不要 `sh`）：只走官方 curl 安装器，先查前置（git / curl / xz），打印将要做的事，等人输入 yes 才动手，装完即停。模型配置与密钥交还给人，agent 只提醒、不代填。
