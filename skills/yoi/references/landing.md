# Landing and registration

This is the only landing procedure. Packs are information. Do not follow a
pack skill as a bookkeeping script.

A landing is any software you put on a Linux machine through this skill —
with a pack or without one.

## With a pack

If the human named a pack (「用 yoi 安装 NAME」):

1. Fetch it with `references/packs.md`. Download only; that is not install
   and not registration.
2. Read `packs/NAME/CHECKLIST.md`, `packs/NAME/skill/SKILL.md`, and
   `packs/NAME/reference/install.cmdspec` as facts (what it is, official
   path, pitfalls, a suggested usable bar). They are not gates.

## Without a pack

Use what the human asked for and whatever official docs you find. There is
no `pack_ref`.

## Install

Interpret the reference cmdspec when one exists (cmdspec is not executable —
never `sh` it). Otherwise follow the official install path you found.

Print the plan. Wait for a typed yes before installing. Never silent or
unattended. Do not fill secrets; remind the human.

## When you judge it done

There is no global “installed” or “green” bar. You decide. Pack checklists
are hints. If you do not think it is done, do not register, and do not tell
the human it is in the OS.

If you do think it is done, register on **that machine** before you say the
OS has it.

## Register (target machine)

Writes go through `yoi-server` on the machine where the software landed.
Command reference: `yoi-server skills get` (or `yoi-server skills get
yoi-server-store`). Do not invent another store.

If `yoi-server` is missing, ask the human, then interpret:

```
https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi-server.cmdspec
```

(not `curl | sh`). If they refuse, stop registration. Say clearly: the
software may be on disk; it is not in the OS.

Write, in order:

1. **Service** — identity. Create, or update frontmatter if the same
   identity already exists. `desired_state` as you see it. `pack_ref` =
   slug if a pack was used; omit otherwise. `runtime` if you know the
   supervisor binding; omit otherwise (Dashboard will show 无法探测).
2. **Release** — this landing. New uuid `--id`. If a prior Release for
   this service should be superseded, update that fact and record it.
3. **Event** — at least one, with `service` set (required). Tie
   `release` when this event is about that Release.

Writing `~/.yoi/` is not an install. Do not ask for a second yes.

If a write fails, do not claim registration succeeded. Say whether the
software is on disk and that the OS has no (or an incomplete) identity.

Deleting a pack directory only removes pack files. It does not remove the
Service and does not uninstall the software.
