---
name: log
description: Deploy audit log. Use only when asked how a deploy failed or how many times it was installed. Do not preload.
---

# Deploy audit log

Call the `yoi` CLI. Do not open `.yoi/deploy.log` yourself.

- After a deploy attempt: `yoi log append --result green|fail --cmd "the command" --custom '{"key":"value"}'`
- `green` means the pack's whole usable check passed, including the human's real session when the pack requires one. Anything short of that is `fail` — name the wall in custom, e.g. `--custom '{"stopped_at":"needs a model api key from the human"}'`.
- `custom` must be a JSON object. Do not dump the conversation into it.
- Asked "how did it fail / how many times": `yoi log show` (fixed fields only).
- Asked for details: `yoi log show --full`.

Do not read `DEPLOY.md`. Load the deploy skill instead: `yoi skills get deploy`.
