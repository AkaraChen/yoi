# ADR: Pack 沙箱试验设施（sandbox-agent + codex full-access）

- 状态：已接受
- 日期：2026-08-17

## 背景与约束

pack-trial 需要一个隔离 Linux 环境，让真实 agent（codex）以完整自主权跑 yoi 安装
通路，同时让作者能观察每一轮行为。约束：本机是 macOS（OrbStack docker）；codex 在
本机用 ChatGPT 账号登录（`~/.codex/auth.json`），没有 OPENAI_API_KEY；试验不能碰
本机文件系统。

## 决策

1. **沙箱方案**：用 [sandbox-agent](https://sandboxagent.dev)（rivetdev 出品）——
   它为 coding agent 提供 HTTP 会话 API，官方 docker 镜像
   `rivetdev/sandbox-agent:0.4.2-full` 预装 codex 等 agent。容器即隔离 Linux。
2. **自主权档位**：创建会话时用 codex 的 `full-access` 模式（等价于
   `codex --yolo`）：agent 在沙箱内任意执行，不逐条求人批准。skill 流程里的
   「问人」环节由驱动脚本扮演人按固定策略回答。
3. **凭据**：本机是 ChatGPT 账号态（无 OPENAI_API_KEY），直接把宿主机
   `~/.codex/auth.json` 经 SDK `writeFsFile` 复制进容器 `~/.codex/`（容器一次性，
   试后销毁）。不挂载——codex 运行时要往 `~/.codex` 写会话，只读挂载会炸。
4. **模型**：容器内 codex 必须显式指定 `gpt-5.4`——默认的 `gpt-5.3-codex` 不支持
   ChatGPT 账号，宿主机的 `gpt-5.6-sol` 在容器版 codex 里不存在。
5. **驱动脚本**：`tools/pack-trial/` 下的 Node 脚本（`trial.mjs`），用官方 TS SDK
   （`sandbox-agent` 包）建会话、发消息、拉事件；每轮结束检查 agent 是否在提问，
   是则按策略回答「是，继续」并计数（上限 8 次），直到可用标准 / 撞墙 / 超时。
   注意 SDK 事件载荷是 JSON-RPC 信封，session update 在 `payload.params.update`。
6. **lobehub 例外**：它的官方路径是 docker compose，沙箱内需要 docker。把本机
   docker socket 挂进该容器（compose 栈落在本机 docker 上，试验后整体拆除），
   容器内无 root，docker CLI 与 compose 插件用静态二进制装进 `~/.local/bin`。
   hermes / openclaw 不需要。
7. **产物落盘**：`trials/<slug>-<timestamp>/` 下存 transcript.md（人读）、
   events.jsonl（原始事件）、metrics.json 与 report.md。`trials/` 不进 git。

## 备选方案

- **裸 docker + 手工 exec codex CLI**：没有会话 API，观察行为要解析终端输出，
  脆弱。否决。
- **E2B / Daytona 云沙箱**：要额外账号与计费，本机 docker 已够。否决。
- **codex 跑在本机、docker 只当被测机**：违反隔离，codex 的 full-access 会直接
  碰本机。否决。

## 权衡与后果

- full-access + 一律回答「是」意味着试验**不能**验证「人会不会拒绝」；它验证的是
  流程形状（问几次、何时问、怎么问）。真人验证仍是 gist 的 assignment。
- 挂载本机 docker socket 给 lobehub 试验开了个口子：codex 理论上能操作本机
  容器。接受，因为试验是作者本机一次性行为，且 compose 栈可整体拆除。
- sandbox-agent 是第三方依赖，版本 pin 在 0.4.x；API 变动时只需改驱动脚本。

## 验证

- 三个 pack 各跑一次，transcript 与报告落盘；报告回答 PRD 的三个体验问题。
