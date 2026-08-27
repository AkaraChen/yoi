# ADR: 共享设计令牌（`design/`）

- 状态：已接受
- 日期：2026-08-27
- 修订：2026-08-28 — 不再做成 npm 包；消费者用相对路径引用文件

## 背景与约束

`web/` storefront 的视觉体系（Cursor 暖灰焦橙令牌、系统字体栈、圆角、动效）
已稳定，见 `docs/adr/web-visual-system.md` 与 `docs/adr/web-dark-mode.md`。
`dashboard/` 复用同一套视觉体系。令牌需要一个唯一来源，但做成
`@yoi/design` 私有包（`file:` symlink）后，preset 里的
`require("tailwindcss-animate")` 从 `design/` 解析，Vercel 与只装消费者
依赖的构建会找不到模块。

## 决策

根目录 `design/` 只放共享源文件，不是 npm 包：

- `design/tokens.css`：全部 CSS 变量（浅色 + `prefers-color-scheme: dark`
  暗色对应面、`--radius`、终端/ink 令牌），是色彩与圆角的唯一来源。
  消费者在自己的全局 CSS 顶部用相对路径引入，例如
  `@import "../../design/tokens.css"`。
- `design/tailwind.preset.js`：Tailwind preset，把语义色名映射到
  `hsl(var(--x) / <alpha-value>)`，并携带共享字体栈、`borderRadius` 阶梯、
  `fade-up`/`blink` 动效。不声明、不 `require` 任何插件。
  消费者：`presets: [require("../design/tailwind.preset")]`，并自己安装
  `tailwindcss-animate`，在本应用的 `tailwind.config` 里挂
  `plugins: [require("tailwindcss-animate")]`。

令牌值本身不变；本次只改变存放位置与引用方式。

## 备选方案

- **dashboard 各自复制一份令牌**：改主题时两处漂移，违反令牌的唯一来源
  原则。否决。
- **CSS 变量保留在 `web/`，dashboard 跨目录引用 `web/app/globals.css`**：
  应用文件充当库，边界颠倒，且 globals.css 含 storefront 专属 base 样式。
  否决。
- **`@yoi/design` npm 包 + `file:`**：私有内部包，symlink 让插件解析
  落到 `design/node_modules`，Vercel / 只装消费者依赖的 CI 都会炸。否决。
- **发到 npm registry**：无私有包收益，且仍要处理插件解析。否决。

## 权衡与后果

- 改主题只动 `design/tokens.css`；新增语义色需同时改 `tokens.css` 与
  preset 的颜色映射，两处同属一个目录，漂移风险可控。
- 各应用仍拥有自己的 base 层（`body` 背景、`::selection`、`.text-display`
  等）与布局配置（容器宽度），这些不属于共享令牌。
- `tailwindcss-animate` 在 `web/` 与 `dashboard/` 各装一份；preset 不再
  碰它，构建只看各应用自己的 `node_modules`。
- `docs/adr/web-visual-system.md` 中「令牌在 `globals.css` 重写」的表述由
  本文档取代；视觉方向（暖纸底、墨色、焦橙、终端暖黑）不变。

## 验证

- `cd web && npm run build` 通过；产物 CSS 中含 `--accent: 19 100% 48%`、
  `--terminal`、`--radius` 与 `fade-up` 关键帧，与抽离前一致。
- `cd dashboard && npm run build` 通过，且不需要先在 `design/` 里装依赖。
