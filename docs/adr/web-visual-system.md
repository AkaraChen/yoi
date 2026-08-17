# ADR: Web 视觉系统（设计令牌 + 排版 + 布局）

- 状态：已接受（2026-08-17 三次修订：圆角定为 0.625rem；终端/代码块改用中性深色令牌；整体 tone 从 Shopify 奶油绿切换为 Cursor 暖灰焦橙）
- 日期：2026-08-17

## 背景与约束

站点基于 Next.js 15 + Tailwind 3 + shadcn 风格令牌（HSL CSS 变量）。现状问题：
容器上限 768px、默认灰蓝色板、无品牌字体策略、无动画。初版目标是 Shopify 官网风
（奶油白底、深绿主色）；2026-08-17 用户评审后要求「换一个 tone」，经风格小样
（Vercel 灰阶 / Stripe 藏青蓝紫 / Cursor 暖灰焦橙）三选一，选定 **Cursor 暖灰焦橙**
（参照 cursor.com 2025 后暖色 rebrand），且不引入构建期网络依赖。

## 决策

1. **色彩令牌**：在 `globals.css` 重写 CSS 变量——背景为暖纸白 `#f7f7f4`，
   墨色 `#26251e`（warm olive-black）同时承担 `foreground` 与 `primary`
   （主按钮 = 墨色填充），唯一饱和强调色为焦橙 `--accent: #f54e00`。
   中性色为暖灰卡片阶梯（`--card #f2f1ed` / `--muted` / `--secondary #ebeae5`），
   边框为低对比暖灰 hairline。shadcn 令牌名称保持不变
   （`--background`/`--primary`/...），组件层零改动换肤。
2. **排版**：使用系统字体栈（`-apple-system`、`Segoe UI`、`Roboto`、
   `PingFang SC`、`Microsoft YaHei` 等），不引入 `next/font` 或字体 npm 包。
   展示标题（`.text-display`）用**常规字重 400** + 紧字距（-0.025em）+
   `text-wrap: balance`，层级靠字号而非字重拉开（Cursor 式纪律）；
   卡片/列表标题用 `font-medium`。焦橙只点缀标题关键词、logo 圆点、徽章与链接。
3. **布局**：容器上限 1152px。圆角 `--radius: 0.625rem`，卡片统一 `rounded-lg`；
   **按钮、徽章、导航链接、命令条恢复 pill 形（`rounded-full`）**——Cursor 的
   形状语言是「卡片小圆角 + 交互控件全圆角」。
   （修订记录：初版 1rem 大圆角 → 用户要求「尽量小」改 0.375rem → 再评审定为
   0.625rem；本次 tone 切换将控件从 `rounded-md` 恢复为 pill。）
4. **动效**：纯 CSS（transition + keyframes），仅色彩/透明度过渡与淡入上移；
   不用位移、缩放等弹性动效，不引入 JS 动画库。
5. **组件**：保留 `components/ui/` 原语（button/card/separator），通过令牌换肤；
   业务组件（站点头/页脚/商品卡/封面）放 `components/` 下独立小模块。
   页脚从深色面板改为浅色暖灰面板（`bg-card` + hairline 分隔）。
6. **终端/代码块令牌**：终端卡片与代码块使用独立暖黑令牌
   `--terminal: #14120b`（warm brown-black，非中性灰）与
   `--terminal-foreground: #edecec`；内部层级：`text-white/40|90` 区分注释/命令，
   成功行用 `--terminal-ok: #1f8a65`（ansi-green），「对 Agent 说的话」用
   `--terminal-accent: #dfa88f`（salmon），光标用近白。焦橙不进终端。
   （修订记录：初版终端复用品牌绿 → 用户要求「正常的颜色」拆出中性令牌 →
   本次随 tone 切换改为暖黑并细化内部语义色。）
7. **无 eyebrow**：各版块不使用 eyebrow/kicker 小标签（「商店」「使用方式」
   「产品原则」等已移除），标题直接承担层级；hero 不再放徽章条。

## 备选方案

- **Vercel 灰阶极简 / Stripe 藏青蓝紫**：已做成风格小样对比，用户选定 Cursor 方向。否决。
- **next/font/google 引入 Inter**：视觉收益有限（中文仍走系统字体），且构建期
  需要访问 Google Fonts，本地/沙箱构建有失败风险。否决。
- **深色主题**：用户已选定浅色暖调方向。否决。
- **引入 shadcn 之外的组件库**：当前组件需求简单，令牌换肤即可。否决。

## 权衡与后果

- 系统字体栈在不同平台字形略有差异，但字重/版式层级一致，可接受。
- 令牌换肤意味着未来改主题只动 `globals.css`；业务组件不得硬编码颜色，
  必须用语义令牌（`bg-primary`、`text-muted-foreground`、`text-accent` 等）。
- `accent` 现在是焦橙强色，**不得再用于 hover 背景**（shadcn 默认用法）；
  悬停态一律走 `bg-secondary` 暖灰阶梯。
- 宽容器要求各版块自行控制最大宽度，避免超宽屏下文字行过长。

## 验证

- 首页与详情页截图人工核对：暖纸底、墨色标题、焦橙点缀、暖黑终端，无默认
  灰蓝/绿色残留（`lime`/`pine` 令牌已删除）。
