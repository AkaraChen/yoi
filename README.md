<div align="center">

<img src=".github/assets/banner.png" alt="yoi banner" width="100%" />

# yoi

**面向编码 Agent 的部署技能商店 —— 三分钟跑起来，不是三天。**

[![GitHub Release](https://img.shields.io/github/v/release/AkaraChen/yoi)](https://github.com/AkaraChen/yoi/releases/latest)
[![Go Version](https://img.shields.io/github/go-mod/go-version/AkaraChen/yoi)](go.mod)

[商店](https://yoi-sigma.vercel.app) · [全部 Pack](https://yoi-sigma.vercel.app/shop) · [规格](docs/spec.md) · [贡献指南](AGENTS.md)

</div>

---

每个 Pack 是一个网红产品的**完整部署指南**，由你的 Agent 在你自己的
Linux 服务器上执行。yoi 卖的不是二进制，而是技能：装一次 yoi skill，
之后只要对 Agent 说一句「用 yoi 安装 NAME」。

## 快速开始

```bash
npx skills add AkaraChen/yoi --skill yoi -g
```

然后告诉你的 Agent：

```
用 yoi 安装 hermes
```

Pack 的 list / search / get 是 skill 内的纯 HTTP 配方
（`skills/yoi/references/packs.md`），只需要 curl，没有任何二进制要装。
涉及安装 CLI、探针或 Pack 的每一步都会先问你。

## 在售 Pack

| Pack | 是什么 |
|------|--------|
| [`docker`](https://yoi-sigma.vercel.app/docker) | 容器的事实标准：开源、免费，跑在每一朵云和每一台 Linux 机器上 |
| [`hermes`](https://yoi-sigma.vercel.app/hermes) | Nous Research 的自我改进型 AI agent：从经验中创建并改进 skill |
| [`lobehub`](https://yoi-sigma.vercel.app/lobehub) | 你的首席 Agent 运营官：把专属 Agent 组织成 7×24 不打烊的队伍 |
| [`memeseek`](https://yoi-sigma.vercel.app/memeseek) | 个人梗图管理：多模态 AI 自动识别标签，按关键词搜回来 |
| [`openclaw`](https://yoi-sigma.vercel.app/openclaw) | 运行在你自己设备上的个人 AI 助手，住进你已经在用的聊天渠道 |

机器可读的 Pack 索引在 [`/packs.json`](https://yoi-sigma.vercel.app/packs.json)。

## 三个世界

| 世界 | 位置 | 职责 | 写入口 |
|------|------|------|--------|
| **Server** | 用户 Linux 服务器 | Dashboard 探针面板 + `~/.yoi/` 部署事实 | `yoi-server` CLI |
| **Client** | 用户开发机 | Agent skill + 多机清单管理 | `yoi` CLI |
| **Web** | [`web/`](web/) storefront | Pack 展示与分发，只读 [`packs/`](packs/) | — |

- 两个 CLI 都由 [ctxl](https://github.com/AkaraChen/ctxl) 从根目录 schema
  生成（`yoi.schema.json` / `yoi-server.schema.json`），产物在 `generated/`。
- Dashboard 是单 Go 二进制的本机探针（`dashboard/server/`），只监听
  `127.0.0.1`，密码鉴权，内嵌 SPA，只读 `~/.yoi/`。
- 你的 Agent 是 Client 与 Server 之间的桥梁：在开发机上运行，通过
  SSH/API 连接服务器。

## 安装 CLI（可选）

Pack 交付不需要 CLI；只有管理多机清单（`yoi`）或在服务器上记录部署事实
（`yoi-server`）时才需要。二进制从
[GitHub Releases](https://github.com/AkaraChen/yoi/releases/latest) 分发：

- **Unix**：`install-yoi.cmdspec` / `install-yoi-server.cmdspec` ——
  给 Agent 解读的 cmdspec 文档，**不是** `curl | sh` 脚本
- **Windows**：`install-yoi.ps1` / `install-yoi-server.ps1`（`irm | iex`）
- **Linux 探针**：`install-yoi-dashboard.cmdspec`（同样由 Agent 解读）

## Pack 解剖

产品知识在 [`packs/`](packs/)，每个 pack 一个目录：

```
packs/<slug>/
├── page.mdx                 # 商店文章（只讲产品，不讲部署）
├── skill/SKILL.md           # Agent 读的部署 skill
├── CHECKLIST.md             # 部署核对清单
├── reference/install.cmdspec # 参考安装器（要人输入 yes）
├── cover.{png,webp}         # 官方封面（可选，缺省按 slug 生成）
└── index.json               # 下载时要拉哪些文件
```

## 开发

仓库的 agent 入口是 [`AGENTS.md`](AGENTS.md)：三个世界的边界、生成/构建
命令、发布流程都在那里。术语与可观测契约见 [`docs/spec.md`](docs/spec.md)，
产品决策在 [`docs/prd/`](docs/prd/)，技术决策在 [`docs/adr/`](docs/adr/)。
