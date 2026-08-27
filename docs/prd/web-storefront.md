# PRD: Web 商城（Cursor 暖灰焦橙风，skill-first）

## 问题与背景

`web/` 是 yoi 的产品介绍站（pack 商城）。站点卖的不是 CLI，而是 **skill 层**：
装进 agent 的 yoi skill（opt-in 留存/选路层）+ 每个 pack 内含的产品 skill。
CLI 只是交付工具，由 skill 流程按需引导安装（装前先问，不静默装）。

产品叙事（2026-08-13 brainstorm 结论）：缩短「在自己的 Linux 上把网红 agent 产品
跑起来」的时间——三分钟，不是三天。当前只有初级面（部署托底），双面结构是
开放问题，不在本站体现。

## 目标用户

- 蝙蝠型（初级锚点）：学生，偶发部署网红产品，资料少、AI 乱撞，三天 vs 三分钟。
- 被分享链接带到某个 pack 详情页的潜在用户。

## 用户故事

- 作为访客，我打开首页就明白：把 yoi skill 装进 agent，之后一句话就能部署。
- 作为访客，我在商品区看到每个 pack 的名称、简介和有辨识度的封面，能点进详情。
- 作为访客，我在详情页复制 skill 安装命令，并知道之后跟 agent 说什么。
- 作为访客，我能看到这个产品「想装才装、人在环、可卸载」的承诺，不是黑盒。

## 目标

- `/` 承担品牌首页职责：大 hero + 商品预览区 + 辅助版块；完整商品列表在 `/shop`。
- `/shop` 与 `/[slug]` 详情页与首页同一套视觉系统，全站风格统一。
- 视觉方向：Cursor 暖灰焦橙风——暖纸白底、墨色主色、焦橙单一强调色、常规字重大标题、pill 控件（见 `docs/adr/web-visual-system.md`）。
- 主 CTA 是安装 yoi skill（`npx skills add AkaraChen/yoi --skill yoi -g`）。
- 商品数量从 1 到 N 都要好看（当前有 hermes、openclaw、lobehub 三个 pack）。
- 文案语言：中文为主；商品术语叫 **Pack**（每个 Pack 内含 agent 能用的 skill）。

## 非目标

- 不做购物车/结算/账号、不做全站搜索或独立搜索页、不展示定价（pack 免费）。
  `/shop` 货架就地过滤见 `docs/prd/shop-filter.md`。
- 不体现「初级/高级」双面结构（gist 开放问题 #5，未选型）。
- 不放云 AFF（无试验场内容语境；红线见 spec.md）。
- 封面素材仅限 pack 目录内的 `cover.*` 官方图，不另建素材库（见 `docs/adr/pack-covers.md`）。
- 不改动 pack 数据格式与 `lib/packs.ts` 的数据来源契约。

## 页面结构与用户流

### `/` 首页（即商城）

1. 公告条：skill 发布信息。
2. 吸顶导航：品牌字标、导航项、主 CTA（安装 Skill）。
3. Hero：部署叙事大标题（三分钟 vs 三天，关键词焦橙强调）、副文案、
   主 CTA（skill 安装命令，可复制）+ 次 CTA（浏览 Pack）、终端视觉卡片
   （装 skill → 跟 agent 说一句话 → 跑绿）。不用 eyebrow 小标签。
4. 商品预览区：版块标题 + 「查看全部 →」pill 链接（去 `/shop`）+
   最多 3 张商品卡（封面、名称、简介、免费徽标、查看链接）。
   frontmatter 标记 `shop-only: true` 的 pack 不进预览区，只在 `/shop`
   出现（首页是策划位，货架默认全上、首页默认不除外）。
5. 三步流程：装 Skill → 一句话部署 → 人在环确认跑绿。
6. 特性带：网红产品垂直覆盖 / 清单中心非黑盒 / 三分钟闭环。
7. 产品原则（信任承诺）：明确 opt-in、人在环确认、可随时卸载。
8. CTA 横幅：墨色底大标题 + 焦橙 pill 按钮。
9. 多栏页脚。

### `/shop` 全部 Pack

1. 页头：「全部 Pack」大标题 + 一句话说明 + 总数（共 N 个 Pack）。
2. 商品卡网格：默认全量 pack，卡片与首页预览同款（ProductCard）。
   页内可按 `q` 就地过滤，契约见 `docs/prd/shop-filter.md`。
3. 入口：吸顶导航的 Shop 链接、首页 hero「浏览 Pack」、首页预览区
   「查看全部」、详情页面包屑「全部 Pack」、页脚「全部 Pack」均指向
   `/shop`。

### `/[slug]` 详情页

1. 面包屑返回商品列表。
2. 封面横幅 + pack 名称 + 免费徽标 + 相关链接图标（frontmatter 里的
   `key: url`，按类型映射 globe / docs / github 图标）。
3. 两栏：MDX 正文 + 粘性安装卡片：
   - MDX 正文只讲产品本身（是什么、核心能力），不写任何部署/安装
     教程，也不放相关链接节；部署动作全部由右侧安装卡承担（契约见
     `docs/spec.md`）。
   - 第 1 步：安装 yoi skill（`npx skills add ...`，只需一次，可复制）；
   - 第 2 步：跟 agent 说「用 yoi 安装 <slug>」（可复制）；
   - 说明：没装 CLI 时 skill 会先问再装。

## 用户可见状态与失败行为

- pack 目录缺少 `page.mdx` 时不出现在列表（沿用现状）。
- 非法 slug 或文件缺失 → 404（沿用现状）。
- 首页预览区与 `/shop` 只有 1 个 pack 时网格不塌陷，卡片宽度有上限。

## 验收标准

- 首页包含上述全部版块；首屏主 CTA 是 skill 安装命令而非 CLI 安装。
- 首页商品预览区最多展示 3 个 pack，标题行右侧为「查看全部 →」链接；
  `/shop` 展示全量 pack 与总数。
- `/packs.json` 返回与商品区同源的 JSON 索引（slug / excerpt / cover），
  供 yoi skill 的 list/search HTTP 配方消费。
- 全站不出现「卖 CLI」导向的文案；pack 投递是 skill 内的纯 HTTP 流程，
  无 CLI 前提。
- 首页含「产品原则」版块，且承诺与 spec.md 红线一致（opt-in / 人在环 / 可卸载）。
- 商品卡封面：pack 自带 `cover.*`（官方图）优先展示，无封面时由 slug 确定性生成，同一 slug 永远一致。
- `npm run build` 通过；`generateStaticParams` 行为不变。
- 新增 pack（放入 `packs/` 目录）无需任何素材即可在商城获得一致封面。

## 已解决的产品决策

- 商城列表独立成 `/shop`（2026-08-17，取代「首页与商城合并为一个页面」的
  初版决策）：首页商品区改为预览（最多 3 个 + 「查看全部」链接），完整
  列表与总数计数移到 `/shop`；导航新增 Shop 链接，原指向首页商品区的
  入口（hero 按钮、详情页面包屑、页脚）一律改指 `/shop`。
- 详情页纳入重设计范围。
- 视觉对标 cursor.com 暖色 rebrand（暖纸白底 + 墨色 + 焦橙 accent；2026-08-17 经风格小样三选一确认，取代初版 Shopify 奶油绿方向）。
- **主 CTA = 安装 yoi skill**（skill-first），CLI 由 skill 流程按需引导（2026-08-17 质问确认）。
- **叙事 = 部署**（初级面为主：三分钟跑起来，不是三天），双面结构以后再说；品牌文案说「网红产品」，不限定为 agent 产品。
- **术语 = Pack**，文案上讲「每个 Pack 内含 agent 能直接用的 skill」。
- **首页加「产品原则」版块**，把 opt-in / 人在环 / 可卸载写成对外承诺。
