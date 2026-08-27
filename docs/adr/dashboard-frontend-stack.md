# ADR: Dashboard 前端技术栈（Vite + React SPA，前后端一体探针）

- 状态：已接受
- 日期：2026-08-27

## 背景与约束

Dashboard 跑在用户自己的 Linux 服务器上，定位是「探针一样轻」的面板
（PRD 见 `docs/prd/dashboard.md`）：单二进制分发、低占用、仅 localhost +
密码。仓库已有 Go 代码（`internal/`）与 Next.js storefront
（`web/`）。视觉体系必须复用 `design/` 共享令牌
（`docs/adr/design-token-package.md`）。服务数据来源（即后来的
`yoi-server` store）当时尚未定，前端必须与数据源解耦。

## 决策

1. **前端**：`dashboard/` 为 Vite + React 19 + TypeScript SPA，
   Tailwind 3 + `design/tailwind.preset.js`（与 `web/` 同 major，相对
   路径引用），组件用 shadcn（CLI 安装，不手写原语），图标用 lucide-react
   （仓库默认）。路由用 react-router（`/` 服务器概览、
   `/services/:id` 服务详情）；服务端状态用 TanStack Query 管理，
   指标查询带轮询间隔。
2. **数据边界**：所有数据经由 `src/lib/api.ts` 的异步请求函数暴露，
   当前返回 mock 数据；未来后端实现同样的 JSON 契约后，前端零改动切换。
   组件不直接感知 mock。
3. **后端方向（约束性决策，实现待后续）**：Go 单二进制，前端
   `vite build` 产物经 `go:embed` 内嵌，同源提供静态资源与 JSON API；
   仅监听 `127.0.0.1`，密码认证。后端与数据模型的详细设计随用户的
   yoi CLI 数据模型重新设计一并进行，不在本 ADR 定稿。

## 备选方案

- **Next.js 全栈（与 web/ 同构）**：对「跑在用户服务器上的探针」过重——
  需要 node 运行时，无法单二进制分发。否决。
- **Go 服务端渲染 + htmx，无前端构建链**：最轻，但用户明确要求
  React + Tailwind + Vite，并预期面板后续长出趋势图等复杂交互。否决。
- **手写组件原语**：用户明确要求 shadcn。否决。
- **Tailwind 4**：`design/tailwind.preset.js` 是 Tailwind 3 格式
  （`require` + 各应用自挂插件），为与 `web/` 保持一致、零迁移成本，
  钉在 3.4。未来两边一起升级。

## 权衡与后果

- 引入 node 构建链只在开发期；运行时仍是单二进制，探针定位不受影响。
- mock 数据层意味着 PRD 的验收标准可以先对 UI 验收；数据契约的真实
  来源切换是后端 ADR 的主题。
- shadcn 组件经 `design/tokens.css` 令牌换肤，与 storefront 观感一致；
  组件层禁止硬编码颜色的约束同样适用于 `dashboard/`。
- React Compiler 不启用（与 `web/` 现状一致）；不默认加
  `useMemo`/`useCallback`。

## 验证

- `cd dashboard && npm run build`（`tsc -b && vite build`）通过。
- 产物 CSS 含 `design/tokens.css` 令牌（`--accent` 等），无 shadcn
  默认灰蓝色板残留。
