---
name: yoi
description: Yoi deploy CLI. Load current instructions from the installed binary before running any yoi command. Use for starting a service, reopening a deploy, copying it to another machine, or asking how a deploy failed.
---

# yoi

This file is a discovery stub, not the usage guide. Before running any `yoi` command, load the skill that matches the installed CLI:

```bash
yoi skills get deploy   # current state — reopen / copy to another machine
yoi skills get log      # audit log — failures / how many times
```

The two skills stay separate. Do not preload both. The CLI serves content that matches this binary, so do not rely on a cached copy of this stub.
