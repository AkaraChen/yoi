---
name: docker
description: Install Docker on Linux via the official get.docker.com convenience script and verify it runs containers.
---

# Docker

先读 `packs/docker/CHECKLIST.md`，三条官方安装路径、冲突包与 docker 组的坑、可用标准以它为准。

## 可用标准

- `docker version` 同时打印 Client 与 Server 两段
- `docker run hello-world` 成功（没配 docker 组就 sudo）
- 人跑起过一个真实容器并访问到它

Swarm、rootless、生产调优都是下一层，第一版不碰。

## 安装

用 `packs/docker/reference/install.cmdspec`（解读，不要 `sh`）：走官方 get.docker.com 便捷脚本，先查前置（非 root、sudo、curl、无冲突发行版包），打印将要做的事，等人输入 yes 才动手，装完用 hello-world 验证后即停。便捷脚本需要 sudo——密码提示属于人，agent 不代输。docker 组配置交还给人，agent 只提醒、不代办。

绿了用服务器上的 `yoi-server` CLI 记一条 event（命令参考：`yoi-server skills get`）。
