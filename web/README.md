# yoi storefront

yoi 软件源（Pack 目录），Next.js 15 + Tailwind 3。产品本身是部署栈 OS，本目录只做展示与分发。Vercel Root Directory 设为 `web`。

- 路由：`/`（品牌落地页 + 精选 Pack 预览）、`/shop`（全部 Pack，`?q=` 原地过滤）、`/[slug]`（Pack 详情）、`/packs.json`（机器可读索引）
- 唯一数据源是仓库根目录的 `packs/`；新增 pack 不需要额外配置
- 样式只走 `design/` 的语义化 design tokens（按相对路径引入），组件里不允许硬编码颜色
- 外观跟随 OS 颜色方案（`prefers-color-scheme`），没有手动主题开关
- 文案全部为中文

```bash
npm run dev    # 开发
npm run build  # 构建
```
