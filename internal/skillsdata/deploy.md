---
name: deploy
description: Current deploy state. Use when starting, reopening, or copying a deploy to another machine. Do not load this for history or failures.
---

# Current deploy state

Call the `yoi` CLI. Do not open `DEPLOY.md` yourself.

## How to get to green (any product)

1. Read `packs/<name>/` for what the product is, how to pick a model or config, and what a usable session looks like. Packs are knowledge. They do not replace this skill.
2. If a pack has `reference/install.sh`, tell the human what the script will do and wait for a yes. Do not silent `curl | bash`. Do not run as root. Do not invent another installer URL.
3. Green is the pack's usable check (command on PATH, help works, human finished one real session). Every item must actually pass — an install stopped at credentials or any human-only step is not green. Record only after green. Gateway and ops are out of scope unless the human asked separately.

## Record and reopen

- Reopen / same install on another machine: `yoi deploy show`
- After a successful green: `yoi deploy write --service NAME --port PORT --start CMD --stop CMD --body "one or two human sentences"`
- Missing file means never recorded. Stop after the five keys (`service`, `port`, `start`, `stop`, `last_green`) unless those are not enough.

Do not read `.yoi/deploy.log`. Load the log skill instead: `yoi skills get log`.
