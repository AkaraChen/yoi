---
name: openclaw
description: Install and verify OpenClaw, the personal AI assistant that runs on your own devices — runtime prerequisites, the usability bar, and the pack reference install cmdspec.
---

# OpenClaw

产品知识。落地与登记走 yoi client skill，不要在这里记账。

先读 `packs/openclaw/CHECKLIST.md`，那里有运行时版本、端口、凭据和已知坑的完整清单。

## 可用标准

- `openclaw --version` 能打印，`openclaw --help` 退出 0
- `openclaw gateway status` 显示 Gateway 在 18789 监听
- 人走完 `openclaw onboard`，并在 Control UI 里收到助手的一次实际回复

## 安装

用 `packs/openclaw/reference/install.cmdspec`（解读，不要 `sh`）。走官方 curl 安装器，等人输入 yes 才动手，装完即停；onboard 向导和 API key 由人自己完成。不要静默安装，不要代填密钥。
