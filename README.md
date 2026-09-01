<div align="center">

<img src=".github/assets/banner.png" alt="yoi banner" width="100%" />

# yoi

**个人完整部署栈的自托管操作系统 —— 上下文给 Agent，由 Agent 代管。**

[![GitHub Release](https://img.shields.io/github/v/release/AkaraChen/yoi)](https://github.com/AkaraChen/yoi/releases/latest)
[![Go Version](https://img.shields.io/github/go-mod/go-version/AkaraChen/yoi)](go.mod)

[商店](https://yoi-sigma.vercel.app) · [全部 Pack](https://yoi-sigma.vercel.app/shop)

</div>

---

yoi 跑在你自己的 Linux 上：统一的服务身份、部署账本、本机观察面。
操作者是你已经在用的编码 Agent，不是另一套给人点的面板。你对着聊天框
说话；yoi 把机器状态收成 Agent 能读、能写回的上下文。

商店是这个操作系统的**软件源**。每个 Pack 是一份完整部署知识，由
Agent 在你自己的服务器上执行。装一次 yoi skill，之后只要说一句
「用 yoi 安装 NAME」。货架上现在有什么，不代表 yoi 只做那一类软件。

## 快速开始

```bash
npx skills add AkaraChen/yoi --skill yoi -g
```

然后告诉你的 Agent：

```
用 yoi 安装 hermes
```

Pack 的浏览、搜索、下载都是 skill 里的纯 HTTP 配方，只需要 curl，
没有任何二进制要装。涉及安装的每一步，Agent 都会先问你。

## 软件源里现有的 Pack

| Pack | 是什么 |
|------|--------|
| [`docker`](https://yoi-sigma.vercel.app/docker) | 容器的事实标准：开源、免费，跑在每一朵云和每一台 Linux 机器上 |
| [`hermes`](https://yoi-sigma.vercel.app/hermes) | Nous Research 的自我改进型 AI agent：从经验中创建并改进 skill |
| [`lobehub`](https://yoi-sigma.vercel.app/lobehub) | 你的首席 Agent 运营官：把专属 Agent 组织成 7×24 不打烊的队伍 |
| [`memeseek`](https://yoi-sigma.vercel.app/memeseek) | 个人梗图管理：多模态 AI 自动识别标签，按关键词搜回来 |
| [`openclaw`](https://yoi-sigma.vercel.app/openclaw) | 运行在你自己设备上的个人 AI 助手，住进你已经在用的聊天渠道 |

## 它是怎么工作的

1. 你在开发机上对 Agent 说「用 yoi 安装 NAME」，或任何要管的事。
2. yoi skill 从软件源拉取部署知识，交给 Agent 执行；关键步骤等人确认。
3. 软件跑在**你自己的** Linux 上——数据、端口、生命周期都是你的。
4. 部署事实记在该机 `~/.yoi/`；本机 Dashboard 只读查看机器与服务现场。
   多机清单在开发机上的 `yoi` CLI。这些都不是装 Pack 的前提，二进制从
   [GitHub Releases](https://github.com/AkaraChen/yoi/releases/latest)
   按需获取。

yoi 不当编排器：不替你启停、不替你回滚、不拦危险操作。它提供上下文，
让 Agent 代管。

## 参与开发

仓库的 agent/贡献者入口是 [`AGENTS.md`](AGENTS.md)。
