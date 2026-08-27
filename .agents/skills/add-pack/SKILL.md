---
name: add-pack
description: Add a new product pack under packs/ for the yoi storefront by reading the product's official sources first and mirroring how the official site presents it. Use when the user asks to add, create, or author a pack for a product — covering page.mdx, CHECKLIST.md, skill/SKILL.md, reference/install.cmdspec, index.json, and the cover image.
disable-model-invocation: true
---

# Add Pack

为一个产品建立 `packs/<slug>/` 目录。第一原则：**官方怎么介绍，我们就怎么介绍**。所有事实现读现写，不许凭印象，不许拿别的 pack 当模板套。

## 反公式化

- 禁止复制现有 pack 的结构。「它是什么 / 核心能力」只是 hermes 恰好长这样，不是模板。
- `page.mdx` 的分节、详略、语气跟随官方首页与 README：官方先讲理念就先讲理念；官方用功能列表就用功能列表；官方有 slogan 就化用 slogan。
- `CHECKLIST.md`、`skill/SKILL.md`、`reference/install.cmdspec` 的内容必须从官方安装文档 / quickstart / FAQ 里读出来。不同产品的这些文件长得不一样是正常的，长一样才可疑。

## 流程

### 1. 读官方来源

至少读三个来源（WebFetch / curl 现读，必要时 WebSearch 找入口）：

- 官网首页：产品定位、slogan、卖点的呈现顺序
- GitHub README：功能、运行要求、许可证
- 官方安装 / 快速开始文档：真实安装路径、前置依赖、端口、必设环境变量、常见坑

读不到关键事实就问人，不要编。

### 2. page.mdx（网站文章）

契约（`docs/spec.md`）：只讲产品本身；部署 / 安装 / 配置教程一律不写（除非与 yoi 有关）；链接只进 frontmatter。

- frontmatter 用扁平 `key: url`；已知 key：website / docs / github，详情页渲染为图标
- 正文第一段会被用作商品卡摘要：写产品的一句话定位
- 中文书面语；结构跟随官方叙事（见「反公式化」）

### 3. CHECKLIST.md（产品知识）

给 agent 读的知识文件，不是安装手册。要回答的问题不变，但切入点必须来自官方文档：

- 它是什么：仓库 / 文档链接；第一版有用的面是什么（≈ 官方 quickstart 的终点，不是全部能力）
- 环境怎么选：官方写明的真实前置条件（运行时版本、包管理器、端口、必设环境变量、已知坑）
- 怎么算可用：从官方 quickstart 反推可验证的最小标准（命令存在、帮助能打印、人完成过一次真实交互）

密钥与凭据永远由人粘贴，agent 只提醒、不代填。

### 4. skill/SKILL.md（agent skill）

- frontmatter：`name` = slug；`description` 用英文一句话说清覆盖什么
- 正文是 CHECKLIST 的蒸馏：先读 CHECKLIST、可用标准、安装走 reference cmdspec
- 结尾固定：绿了用服务器上的 `yoi-server` CLI 记一条 event（`yoi-server skills get`）

### 5. reference/install.cmdspec（参考安装器）

- 用 cmdspec 写（https://github.com/AkaraChen/cmdspec-spec）：`RUN` / `ASSERT` / `IF` / `TRY`，不是 bash。文档不可执行，不要 `chmod +x`，不要交给 `sh`
- 安装路径必须是官方文档里写的那条（curl 安装器 / npm 全局包 / docker compose……），不要发明
- 固定安全骨架：仅 Linux；拒绝 root；动手前检查前置依赖（node / docker / 端口），缺了就停并说明让人装什么；打印将要做的事；等输入 `yes` 才动手（写在 confirmation gate 注释里）；装完即停，交互式配置交还给人

### 6. 封面

从官网 HTML 找 `og:image`（`curl -fsSL <官网> | rg 'og:image'`），下载为 `cover.<ext>`。官方没有 OG 图再考虑 GitHub social preview。都没有就不留封面——生成式封面是兜底。

### 7. index.json 与 README.md

- `index.json` 的 files 列出目录内全部文件（含封面的实际文件名）
- `README.md` 用表格说明每个文件给谁看（仓库内部约定，照 hermes 的格式；这不是对外文案，不受反公式化约束）

### 8. 验证

- 共享 dev server 在 http://localhost:3000，不要自己起；打开 `/` 和 `/<slug>` 核对：卡片封面与摘要、详情页图标链接、正文渲染
- 提交前对照 `docs/spec.md` 与 `docs/prd/web-storefront.md` 自查
