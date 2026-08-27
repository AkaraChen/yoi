# yoi

面向编码 Agent 的部署技能商店：每个 Pack 是一个网红产品的完整部署指南，
在人自己的 Linux 服务器上跑起来。产品介绍站在 web/：首页是品牌落地页
（精选 Pack 预览），全部 Pack 在 /shop。

## 用 yoi 安装产品

装一次 yoi skill：

```bash
npx skills add AkaraChen/yoi --skill yoi -g
```

然后跟你的 Agent 说：「用 yoi 安装 NAME」。pack 的 list/search/get 是
skill 内的纯 HTTP 配方（`skills/yoi/references/packs.md`），只需要
curl，没有任何二进制要装。

## 三个世界

- **Server**：用户 Linux 服务器。Dashboard 探针面板 + `~/.yoi/` 部署事实。
  写入口是 ctxl 生成的 `yoi-server` CLI（schema：`yoi-server.schema.json`）。
- **Client**：用户开发机。Agent + ctxl 生成的 `yoi` CLI（多机清单管理，
  schema：`yoi.schema.json`），store 是 `~/.yoi/` 下的纯 markdown。
- **Web**：`web/` storefront，只读 `packs/` 目录。

两个 CLI 的生成与构建命令见 AGENTS.md。发布后的安装（先问人，不要静默装）：
Unix 入口是 cmdspec（给 Agent 解读，**不可** `curl | sh`）：
`install-yoi.cmdspec`、`install-yoi-server.cmdspec`。
Windows：`install-yoi.ps1` / `install-yoi-server.ps1`（`irm ... | iex`）。
Linux 探针：`install-yoi-dashboard.cmdspec`（同样由 Agent 解读）。
资产来自 GitHub `releases/latest`；对不上当前 Release 的文件名就会 404。

## Pack

产品知识在 [`packs/`](packs/)，每个 pack 一个目录：`page.mdx`（网站文章）、
`CHECKLIST.md`、`skill/SKILL.md`（agent 读的部署 skill）、
`reference/install.cmdspec`（参考安装器，要人输入 yes）、`index.json`
（下载时要拉哪些文件）。
