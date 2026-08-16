---
name: yoi-deploy-log
description: Append or read the deploy audit log via `yoi log`. Use only when asked how a deploy failed or how many times it was installed. Do not preload.
---

# Deploy audit log

Call the `yoi` CLI. Do not open `.yoi/deploy.log` yourself.

- After a deploy attempt: `yoi log append --result green|fail --cmd "the command" --custom '{"key":"value"}'`
- `custom` must be a JSON object. Do not dump the conversation into it.
- Asked "how did it fail / how many times": `yoi log show` (fixed fields only).
- Asked for details: `yoi log show --full`.

Do not read `DEPLOY.md`. That is a different skill.
