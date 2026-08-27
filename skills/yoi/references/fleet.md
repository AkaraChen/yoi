# Fleet management (client world)

The `yoi` CLI manages this dev machine's inventory of managed servers. The
store is plain markdown under `~/.yoi/` — human-readable, agent-parseable.
All entities are global scope; always pass `--scope global`.

Fleet writes need the `yoi` binary. If it is missing, ask the human before
installing, then fetch and **interpret** the cmdspec (it is not a shell
script — never `curl | sh`, no runner binary):

```
https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi.cmdspec
```

Read it, translate `RUN` / `ASSERT` / `IF` into real Unix commands, and
execute those. Language: https://github.com/AkaraChen/cmdspec-spec

Windows (PowerShell; cmdspec here is Unix-only):

```powershell
irm https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi.ps1 | iex
```

Unix dest is `${YOI_INSTALL_DIR:-$HOME/.local/bin}` (no root). Windows dest
is `%LOCALAPPDATA%\yoi\bin` — add it to PATH. Overwrite is upgrade. A 404
means no GitHub Release exists yet. Do not install silently.

## Entities

- `server` (`~/.yoi/servers/<id>.md`) — one managed server. Fields: `host`
  (required), `ssh_port`, `user`, `dashboard_url` (e.g.
  `http://127.0.0.1:8788` via SSH tunnel), `provider` (provider entity id),
  `terraform` (workspace/config reference, if terraform-managed),
  `created_at`. Body holds notes: tunnel command, key hints, etc.
- `provider` (`~/.yoi/providers/<id>.md`) — a cloud/SaaS account. Fields:
  `kind` (required; aws | cloudflare | vercel | vultr | ...), `account`
  (account id or email), `created_at`.
- `credential` (`~/.yoi/credentials/<id>.md`) — a credential *reference*.
  Fields: `kind` (required; api_token | ssh_key | password | ...), `ref`
  (required; where the secret lives — env var name, file path, 1Password
  item), `created_at`. NEVER store the secret itself, only the reference.

## Typical flows

Register a provider, then a server attached to it, then a credential
reference:

```bash
yoi provider create --scope global --id vultr-main --kind vultr --account you@example.com --created_at "$(date -u +%FT%TZ)"
yoi server create --scope global --id hk-01 --host 45.32.10.9 --user root --provider vultr-main --dashboard_url http://127.0.0.1:8788 --created_at "$(date -u +%FT%TZ)" --body 'Tunnel: ssh -L 8788:127.0.0.1:8788 root@45.32.10.9'
yoi credential create --scope global --id vultr-token --kind api_token --ref env:VULTR_API_KEY --created_at "$(date -u +%FT%TZ)"
```

Inspect the inventory:

```bash
yoi server list --scope global
yoi server get --scope global --id hk-01
```

This skill also ships inside the `yoi` binary itself: `yoi skills list`,
`yoi skills get yoi`, `yoi skills path yoi`.
