---
name: deploy
description: Current deploy state. Use when starting, reopening, or copying a deploy to another machine. Do not load this for history or failures.
---

# Current deploy state

Call the `yoi` CLI. Do not open `DEPLOY.md` yourself.

- Reopen / same install on another machine: `yoi deploy show`
- After a successful green: `yoi deploy write --service NAME --port PORT --start CMD --stop CMD --body "one or two human sentences"`
- Missing file means never deployed. Stop after the five keys (`service`, `port`, `start`, `stop`, `last_green`) unless those are not enough.

Do not read `.yoi/deploy.log`. Load the log skill instead: `yoi skills get log`.
