# yoi

Thin CLI on ctxl for Yoi day-0 deploys. Schema and skills live in this repo. Skills call this binary; they do not parse the files themselves.

Install onto PATH:

```bash
go install github.com/AkaraChen/yoi/cmd/yoi@latest
```

Or from a clone: `go install ./cmd/yoi`.

## Commands

```bash
yoi deploy write --service hermes --port 8787 --start "docker compose up -d" --stop "docker compose down" --body "再开先看这五个键。"
yoi deploy show

yoi log append --result green --cmd "docker compose up -d" --custom '{"note":"ok"}'
yoi log show
yoi log show --full
```

`deploy write` overwrites `DEPLOY.md` in the current directory (current state only).

`log append` writes one LDJSON line to `.yoi/deploy.log`. Fixed fields: `id`, `ts`, `project`, `result`, `cmd`. `custom_data` is optional. `log show` prints fixed fields unless `--full`.

Skills are embedded in the binary (same pattern as agent-browser). Agents should not cache the markdown:

```bash
yoi skills list
yoi skills get deploy
yoi skills get log
```

`skills/yoi/SKILL.md` is a thin stub that only points at those two commands.

Beginner Hermes install lives in [`packs/hermes/`](packs/hermes/) as content: a human checklist, a clean-Linux reference script, and an opt-in skill. Agents read `packs/hermes/skill/SKILL.md` directly. Do not embed product packs in this binary. Green is a working CLI chat. Do not treat the gateway as day-0.
