---
name: memeseek
description: Install and verify MemeSeek (jnj52016/MemeSeek), a personal meme library with AI vision tagging — official pnpm + Docker Compose path, browser-side AI key setup, and the bar for a usable first upload-and-search loop.
---

# MemeSeek

产品知识。落地与登记走 yoi client skill，不要在这里记账。

先读 `packs/memeseek/CHECKLIST.md`，前置条件、配置落点、可用标准在那里。

## 可用标准

- `memeseek-postgres` 容器健康，Prisma 迁移已跑过；`pnpm dev` 同时起前后端
- 前端 http://localhost:5173 列表页能开，后端 http://localhost:3000/docs 的 Swagger 能开
- 人已在「AI 设置」填好分析 AI，并完成一次真实闭环：上传 → AI 标题 / 描述 / 标签 / OCR → 关键词搜索命中

基础闭环没跑通之前，不碰视频上传、测试套件等下一层功能。

## 安装

用 `packs/memeseek/reference/install.cmdspec`（解读，不要 `sh`）：只走 README「本地运行」那条路（clone → pnpm install → docker compose up -d → 复制 server/.env → prisma migrate deploy），先查前置（git / Node.js 23+ / pnpm 9+ / Docker Compose），打印将要做的事，等人输入 yes 才动手，装完即停。启动 `pnpm dev` 与填写 API Key 交还给人，agent 只提醒、不代填。
