# MemeSeek 知识

这是产品知识，不是安装手册。怎么部署看 `skill/SKILL.md`；绿了怎么记，走服务器上 `yoi-server` 的内置 skill（`yoi-server skills get`）。

## 它是什么

MemeSeek 是 [jnj52016/MemeSeek](https://github.com/jnj52016/MemeSeek) 的个人梗图管理工具：React + Vite 前端、NestJS + Prisma + PostgreSQL 后端，pnpm workspace 单仓库。梗图上传后由 OpenAI 兼容视觉模型生成标题、描述、标签和 OCR 文字，之后按关键词搜回来。

- 仓库：https://github.com/jnj52016/MemeSeek
- 文档：无独立文档站，README 就是主文档，「本地运行」一节即官方 quickstart
- 许可证：仓库未附带 LICENSE 文件（2026-08 读取时确认）

第一版有用的面 = 官方 quickstart 的终点：依赖装好 → PostgreSQL 容器起来 → 数据库迁移跑完 → `pnpm dev` 同时起前后端 → 浏览器打开 http://localhost:5173 → 在「AI 设置」页填好分析 AI → 上传一张梗图 → 看到 AI 生成的标题 / 描述 / 标签 / OCR → 用其中一个词搜索能命中。视频上传（首帧封面上送视觉分析）代码已接入但官方标注「待手动验收」，Swagger API 文档与测试套件也都在，这些算下一层，基础闭环没跑通之前不碰。

## 环境怎么选

官方写明的前置（README「环境要求」）：

- Node.js 23+、pnpm 9+（packageManager 锁定 pnpm@9.11.0）、Docker（compose 起 PostgreSQL 16）
- 端口三个都要空着：前端 5173、后端 3000、PostgreSQL 5432
- 数据库默认值：库名与用户都是 `memeseek`，密码 `memeseek_dev_password`；compose 文件与 `server/.env.example` 里的 `DATABASE_URL` 默认值互相对得上，本地不用改

配置落点：

- `server/.env` 从 `server/.env.example` 复制。README 里的 `copy` 是 Windows 命令，Linux 上用 `cp`。
- `.env` 里只有后端默认值：`DATABASE_URL`、`AI_BASE_URL`（默认 `https://api.openai.com/v1`）、`AI_MODEL`（默认 `gpt-4o`）、视频大小限制。真正的 API Key 不在这里。
- API Key 由人在前端「AI 设置」页填写，只存浏览器 localStorage，不进数据库、不进 `.env`。分析 AI 与内容 AI 两套分开，上传与重新分析只用分析 AI。agent 提醒人准备 Key，绝不代填。

已知坑：

- 没配 API Key 也能上传：记录保持 `COMPLETED` 但没有分析结果；配好 Key 后在详情弹窗点「重新分析」即可，这不是 bug。
- 分析 AI 必须是支持图片输入的视觉模型，接口要 OpenAI 兼容（服务端会在 Base URL 后拼 `/chat/completions`）。
- 图片限制 10MB；粘贴的图片先落预览，点「开始上传」才真正提交，误粘贴不会触发 AI 调用。
- 官方定位是个人本地工具：无登录、无后端密钥管理。不要替人把它直接暴露到公网。

## 怎么算可用

同时满足：

1. `docker compose ps` 看到 `memeseek-postgres` 健康运行；`pnpm --filter server exec prisma migrate deploy` 已跑过且无报错。
2. `pnpm dev` 起得来：前端 http://localhost:5173 打开梗图列表页，后端 http://localhost:3000/docs 打开 Swagger。
3. 人已完成一次真实闭环：在「AI 设置」填好分析 AI → 上传一张梗图 → 详情里看到 AI 标题、描述、标签和 OCR 文字 → 用其中一个关键词搜索能命中。

密钥与凭据永远由人粘贴，agent 只提醒、不代填。
