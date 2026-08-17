# yoi

产品介绍站在 web/。首页即商城：品牌 hero + 商品区，CLI 是下一步。

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
yoi get NAME
```

`yoi get NAME` downloads pack NAME from https://yoi-sigma.vercel.app/packs/NAME into ./packs/NAME. It does not install the product.

`skills/yoi/SKILL.md` checks for the CLI, then runs `yoi get NAME` for the product the human named.

Product knowledge lives in [`packs/`](packs/) (Hermes is one pack). Agents read the pack skill as a file. Do not embed product packs in this binary. How to deploy and how to record green lives in `yoi skills get deploy`, the same for every product.
