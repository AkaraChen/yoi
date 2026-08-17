# ADR: Pack 列表端点（/packs.json）与 CLI list/search

- 状态：已接受
- 日期：2026-08-17

## 背景与约束

CLI 只有 `yoi get NAME`——按名字下载单个 pack；agent 和用户都没有
「列出全部 pack / 按关键词找 pack」的机器可读入口。约束：

- storefront 的唯一数据源是 `packs/` 目录（`web/lib/packs.ts`），CLI 与
  storefront 同仓库、同部署（Vercel），不引入数据库或独立 API 服务。
- 站点路由倾向全静态（`/packs/...` 路由已是 `force-static`）。
- CLI 的列表类输出约定为 JSON（`yoi skills list`、`yoi log show` 均走
  printJSON），消费者主要是 agent。

## 决策

1. **新增静态端点** `web/app/packs.json/route.ts`（`force-static`），返回
   `[{ "slug": string, "excerpt": string, "cover": string|null }]`，
   与 storefront 商品区同源（`listPackNames` + `excerptFromMdx` +
   `findPackCover`，经共享的 `lib/products.ts`）。`cover` 为站内相对
   路径或 null。
2. **CLI 新增两个命令**：`yoi list` 打印全量索引，`yoi search <query>`
   打印 slug 或 excerpt 包含查询词（大小写不敏感）的子集；输出均为
   indented JSON，沿用 printJSON。
3. **Base URL 解析与 `yoi get` 同链**：`--from` flag → `YOI_PACKS` 环境
   变量 → 默认值 `https://yoi-sigma.vercel.app`，请求 `<base>/packs.json`。
   以 `/packs` 结尾的 get 式 base 先裁掉该段再拼 `/packs.json`，同一个
   覆盖值可同时服务 get 与 list/search。
4. **搜索在 CLI 本地做**：拉全量索引后过滤，服务端不加查询参数。

## 备选方案

- **CLI 直接读 GitHub 仓库的 packs/ 目录**：绕开商城部署，但引入第二个
  数据源与认证/限流问题，违背「storefront 是唯一数据源」契约。否决。
- **服务端搜索（`/packs.json?q=` 或独立 search API）**：pack 量级小
  （当前 3 个），全量索引仅数 KB，本地过滤足够；查询参数会破坏
  force-static 预渲染。否决。
- **枚举 `/packs/<name>/index.json` 做发现**：没有列表发现机制，CLI
  无法枚举 slug。否决。
- **爬取 `/shop` HTML**：脆弱，且违背机器可读契约。否决。

## 权衡与后果

- packs.json 与 storefront 同源同部署：新增 pack 丢目录即同时上架商城
  并对 CLI 可见，无额外发布步骤。
- 索引只含 slug/excerpt/cover，不含 page.mdx 正文——搜索只能命中
  slug/excerpt，这是有意的最小契约；需要正文搜索时再评估扩容。
- `/packs` 后缀裁剪是兼容便利：get 与 list/search 可共享一个
  `YOI_PACKS` 覆盖值；代价是 base 语义略宽（站点根与 packs 目录基址
  都接受）。
- 全量拉取 + 本地过滤在 pack 数量增长到数百个前都成立；届时再评估
  服务端搜索。

## 验证

- `go build ./...` 通过；`go test ./internal/packlist/` 覆盖正常拉取、
  get 式 base（`/packs` 后缀）裁剪、非法 scheme 拒绝、搜索过滤。
- 本地 dev server 下 `yoi list --from http://localhost:3000`、
  `yoi search hermes --from http://localhost:3000/packs`、
  `YOI_PACKS=http://localhost:3000 yoi search <query>` 输出与
  `curl http://localhost:3000/packs.json` 一致。
