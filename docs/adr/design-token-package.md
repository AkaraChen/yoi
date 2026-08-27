# ADR: 共享设计令牌包（`design/`）

- 状态：已接受
- 日期：2026-08-27

## 背景与约束

`web/` storefront 的视觉体系（Cursor 暖灰焦橙令牌、系统字体栈、圆角、动效）
已稳定，见 `docs/adr/web-visual-system.md` 与 `docs/adr/web-dark-mode.md`。
即将新增的 `dashboard/`（跑在用户服务器上的探针 dashboard）将复用同一套
视觉体系。令牌此前内联在 `web/app/globals.css`、Tailwind 映射内联在
`web/tailwind.config.ts`，第二个消费者无法复用。

## 决策

新建根目录 `design/`，作为 npm 私有包 `@yoi/design`（`file:` 协议被
`web/package.json` 引用，dashboard 将来同样引用）：

- `design/tokens.css`：全部 CSS 变量（浅色 + `prefers-color-scheme: dark`
  暗色对应面、`--radius`、终端/ink 令牌），是色彩与圆角的唯一来源。
  消费者在自己的全局 CSS 顶部 `@import "@yoi/design/tokens.css"`。
- `design/tailwind.preset.js`：Tailwind preset，把语义色名映射到
  `hsl(var(--x) / <alpha-value>)`，并携带共享字体栈、`borderRadius` 阶梯、
  `fade-up`/`blink` 动效与 `tailwindcss-animate` 插件（作为 `@yoi/design`
  的依赖随包安装）。消费者在自己的 `tailwind.config.ts` 里
  `presets: [require("@yoi/design/tailwind.preset")]`，只保留应用级配置
  （`content` glob、容器宽度等）。

令牌值本身不变；本次只改变令牌的存放位置与分发方式。

## 备选方案

- **dashboard 各自复制一份令牌**：改主题时两处漂移，违反令牌的唯一来源
  原则。否决。
- **CSS 变量保留在 `web/`，dashboard 跨目录引用 `web/app/globals.css`**：
  应用文件充当库，边界颠倒，且 globals.css 含 storefront 专属 base 样式。
  否决。
- **发到 npm registry**：私有内部包，`file:` 协议足够，无发布收益。否决。

## 权衡与后果

- 改主题只动 `design/tokens.css`；新增语义色需同时改 `tokens.css` 与
  preset 的颜色映射，两处同属一个包，漂移风险可控。
- 各应用仍拥有自己的 base 层（`body` 背景、`::selection`、`.text-display`
  等）与布局配置（容器宽度），这些不属于共享令牌。
- `@yoi/design` 以 `file:` 链接进消费者，`design/` 改动后需在消费者目录
  重新 `npm install` 才会刷新 `package-lock.json`；Tailwind 构建时实时读取
  preset 源文件，无需构建 design 包本身。`file:` 是 symlink：preset 里
  `require("tailwindcss-animate")` 从 `design/` 解析，所以构建前必须在
  `design/` 自己 `npm ci`（该包有 lockfile），不能只装消费者的
  `node_modules`。
- `docs/adr/web-visual-system.md` 中「令牌在 `globals.css` 重写」的表述由
  本文档取代；视觉方向（暖纸底、墨色、焦橙、终端暖黑）不变。

## 验证

- `cd web && npm run build` 通过；产物 CSS 中含 `--accent: 19 100% 48%`、
  `--terminal`、`--radius` 与 `fade-up` 关键帧，与抽离前一致。
