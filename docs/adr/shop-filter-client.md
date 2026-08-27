# ADR: /shop 过滤在客户端做，并用 replace 同步 `?q=`

- 状态：已接受
- 日期：2026-08-27

## 背景与约束

`/shop` 是服务端页面：一次 `getProducts()` 渲出全量网格。站点列表路由按静态
预渲染（`/packs.json` 为 `force-static`）。`docs/adr/pack-list-endpoint.md`
已否决给 `/packs.json` 加 `?q=`：pack 量级小，查询参数会破坏静态索引。

产品契约（`docs/prd/shop-filter.md`）：输入后网格立刻缩小；当前查询可寻址为
`/shop?q=`；匹配字段与 CLI 本地搜索相同。

## 决策

1. **服务端仍一次给出全量商品列表**，不按 `q` 向服务器再取数。
2. **客户端就地过滤** 该列表（slug / excerpt，大小写不敏感包含），并
   `history.replace` 同步 `?q=`；空查询写成干净的 `/shop`，不用 `push`
   （避免每个字一条历史）。
3. **`/packs.json` 保持无查询参数的静态全量索引**。网页过滤不新增 API，
   也不复用或改动 CLI 搜索实现。

## 备选方案

- **服务端读 `searchParams` 再渲网格**：每个字打回服务器，输入会顿，且
  `/shop` 失去「一次静态列表」的形状。否决。
- **`/packs.json?q=` 或独立 search API**：与已接受的列表端点 ADR 冲突，
  且 pack 数仍远不到需要服务端检索。否决。
- **查询只活在输入框、不进 URL**：刷新、后退、分享都会丢掉过滤。否决。

## 权衡与后果

- 分享 `/shop?q=…` 时，首屏 HTML 仍是全量列表，水合后才缩到匹配集；
  当前货架只有数个 pack，可接受。
- 过滤逻辑在 Go（CLI）与 TypeScript（storefront）各写一份，规则保持同一
  句话：slug 或 excerpt 包含查询（大小写不敏感）。不抽共享服务。
- pack 增到数百个、全量列表不再适合一次下发时，再评估服务端过滤；在此
  之前不改本决策。

## 验证

- 打开 `/shop?q=hermes` 水合后网格与 yoi skill 搜索配方（`GET /packs.json`
  后按 slug/excerpt 子串过滤）命中同一批 slug。
- 输入过程中浏览器历史只有一条 `/shop` 记录（replace，不是 push）。
- `curl` `/packs.json` 仍返回全量、忽略任何 `q`。
