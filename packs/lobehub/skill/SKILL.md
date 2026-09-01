---
name: lobehub
description: Deploy a self-hosted LobeHub instance (the Chief Agent Operator panel) via the official Docker Compose path — prerequisites, configuration pitfalls, and what counts as a usable deployment.
---

# LobeHub

产品知识。落地与登记走 yoi client skill，不要在这里记账。

先读 `packs/lobehub/CHECKLIST.md`。

## 环境

Linux，docker 与 compose 插件已装，端口 3210 / 9000 / 9001 空闲，最低 2 核 CPU / 4 GB 内存 / 20 GB 磁盘。缺任何一项就停，告诉人该装什么。

## 可用标准

- `docker compose ps` 各服务 running / healthy，`docker logs lobehub` 看到 migration pass 与 Ready
- 浏览器打开 http://localhost:3210 能进面板
- 人自己配好一个模型密钥，发出一条消息并收到回应（密钥人填，agent 不代填）

## 安装

用 `packs/lobehub/reference/install.cmdspec`（解读，不要 `sh`）。打印计划后必须等人输入 yes，不要静默安装。官方 setup.sh 本身交互式询问部署模式，默认 Local 直接回车即可；装完即停，面板内的配置交还给人。
