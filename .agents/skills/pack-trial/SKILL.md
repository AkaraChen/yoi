---
name: pack-trial
description: Run an automated install trial of a yoi pack — codex in full-access mode inside an isolated sandbox-agent Docker container plays out the full path (install the yoi skill, then "用 yoi 安装 NAME") while a driver script plays the human. Use when the user asks to trial, validate, or smoke-test a pack's install flow, or asks whether an agent can install a pack smoothly.
disable-model-invocation: true
---

# Pack Trial

验证一个 pack 的安装流程对真实 agent 是否顺畅。只观察，不改 pack 内容。

## 前置条件

- 本机 docker 可用（OrbStack）；所有 docker 命令需要 `all` 权限
- 宿主机 `~/.codex/auth.json` 存在（ChatGPT 账号登录态，注入一次性容器用）
- 线上 `https://yoi-sigma.vercel.app/packs/<slug>/` 可达（容器里拉 pack 走线上 HTTP，不走本地文件）
- 镜像 `rivetdev/sandbox-agent:0.4.2-full` 已拉取；没有就 `docker pull`

## 跑试验

```bash
cd tools/pack-trial && node trial.mjs <slug> [--docker] [--timeout-min N] [--keep] [--pack-source URL]
```

- 首次使用先 `npm install`（tools/pack-trial 下）
- `--docker`：lobehub 专用。挂载宿主机 docker socket，并在容器内装 docker CLI + compose 插件（无 root，静态二进制进 `~/.local/bin`）
- `--keep`：保留容器用于调试（默认试后销毁）
- `--pack-source URL`：让容器里的 pack 下载走指定 pack 源（`YOI_PACKS`，如本地镜像服务）而不是线上；用于试验尚未部署到线上的 pack 改动
- 试验要跑几十分钟，放后台并监控输出

驱动行为（写死在 trial.mjs 里，改行为就改脚本）：

- codex `full-access` 模式，模型 `gpt-5.4`（ChatGPT 账号不支持 `gpt-5.3-codex`，容器内 codex 也没有宿主机的 `gpt-5.6-sol`）
- 开场话术模拟真实用户：先装 yoi skill（`npx skills add AkaraChen/yoi --skill yoi -g`），再用 yoi 安装指定 pack 并按可用标准验证
- agent 每轮结束后，驱动用正则判断它是否在向人提问；是则固定回「是，继续。如果遇到选项，按推荐或默认的选，不用等我。」并计数，上限 8 次；连续空轮超过 2 次判定为 stalled
- 单轮 30 分钟、全局 60 分钟超时

## 产物

`trials/<slug>-<timestamp>/`（gitignored，不提交）：

- `transcript.md`：人类可读的对话与工具调用记录
- `events.jsonl`：原始事件流（排查用）
- `metrics.json`：状态、轮次、提问数、工具调用数、时长
- `report.md`：报告骨架，三段人工填写

## 试后分析（人的活）

读 transcript.md 填 report.md：

1. **流程顺畅度**：卡在哪一步、有没有走回头路、skill 的指引够不够
2. **问题负担**：问了什么（逐条列出）、哪些其实不该问、频率是否烦人
3. **不适感**：有没有让人不放心的行为（乱动无关文件、过度授权、隐瞒失败）

结论给「通过 / 可用但磕绊 / 撞墙」，撞墙要写明停在哪一步。

## 已知坑

- pack CLI 已删除（2026-08-27，见 docs/adr/pack-delivery-via-skill.md）：trial.mjs
  的开场话术已改为 skill 的 HTTP 配方（用 `YOI_PACKS` 指 pack 源）；围绕
  install.sh 装 CLI 的 smoke-binary.mjs 已删除，通用沙箱冒烟用 smoke.mjs
- 事件载荷是 JSON-RPC 信封：真实 session update 在 `payload.params.update`，不在 `payload` 顶层
- 容器内 codex 凭据是注入的副本；容器销毁即失效，但不要 `--keep` 后把容器给别人
- 容器内无 sudo；装系统级东西走静态二进制或换用户命名空间，别假设能 apt
- dev server 约定不变：试验不碰本机 3000 端口，容器内访问的是线上站点
