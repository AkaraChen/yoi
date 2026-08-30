<div align="center">

<img src=".github/assets/banner.png" alt="yoi banner" width="100%" />

# yoi

**面向编码 Agent 的部署技能商店 —— 三分钟跑起来，不是三天。**

[![GitHub Release](https://img.shields.io/github/v/release/AkaraChen/yoi)](https://github.com/AkaraChen/yoi/releases/latest)
[![Go Version](https://img.shields.io/github/go-mod/go-version/AkaraChen/yoi)](go.mod)

[商店](https://yoi-sigma.vercel.app) · [全部 Pack](https://yoi-sigma.vercel.app/shop)

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

Pack 的浏览、搜索、下载都是 skill 里的纯 HTTP 配方，只需要 curl，
没有任何二进制要装。涉及安装的每一步，Agent 都会先问你。

## 在售 Pack

| Pack | 是什么 |
|------|--------|
| [`docker`](https://yoi-sigma.vercel.app/docker) | 容器的事实标准：开源、免费，跑在每一朵云和每一台 Linux 机器上 |
| [`hermes`](https://yoi-sigma.vercel.app/hermes) | Nous Research 的自我改进型 AI agent：从经验中创建并改进 skill |
| [`lobehub`](https://yoi-sigma.vercel.app/lobehub) | 你的首席 Agent 运营官：把专属 Agent 组织成 7×24 不打烊的队伍 |
| [`memeseek`](https://yoi-sigma.vercel.app/memeseek) | 个人梗图管理：多模态 AI 自动识别标签，按关键词搜回来 |
| [`openclaw`](https://yoi-sigma.vercel.app/openclaw) | 运行在你自己设备上的个人 AI 助手，住进你已经在用的聊天渠道 |

## 它是怎么工作的

1. 你在开发机上对 Agent 说「用 yoi 安装 NAME」。
2. yoi skill 通过 HTTP 从商店拉取这个产品的部署知识，交给 Agent 执行。
3. 产品跑在**你自己的** Linux 服务器上——数据、端口、生命周期都是你的。

部署事实可以记录在服务器本地的 `~/.yoi/` 里，配一个只监听
`127.0.0.1` 的 Dashboard 探针面板随时查看；管理多台服务器时还有
`yoi` / `yoi-server` 两个可选 CLI。这些都**不是**安装 Pack 的前提，
二进制从 [GitHub Releases](https://github.com/AkaraChen/yoi/releases/latest)
按需获取。

## 参与开发

仓库的 agent/贡献者入口是 [`AGENTS.md`](AGENTS.md)。
