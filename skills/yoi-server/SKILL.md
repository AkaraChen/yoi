---
name: yoi-server
description: Install yoi-server and the dashboard probe, and keep the probe up with systemd. Use when the human wants the server CLI, yoi-dashboard, or a unit that restarts on boot or crash.
---

# yoi-server

Store writes stay on the builtin skill: `yoi-server skills get` (or
`yoi-server skills get yoi-server-store`). This file is install + probe
only.

Ask the human before installing anything. Do not install silently.

## Install yoi-server

```bash
curl -fsSL https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi-server.sh | sh
```

Windows:

```powershell
irm https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi-server.ps1 | iex
```

Default destinations: `${YOI_INSTALL_DIR:-$HOME/.local/bin}` or
`%LOCALAPPDATA%\yoi\bin` (add that directory to PATH). Overwrite is
upgrade. A 404 means no `v*` Release exists yet — stop; do not leave a
half-install.

## Install yoi-dashboard (Linux)

Same Release as the CLIs. Prefer the script:

```bash
curl -fsSL https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi-dashboard.sh | sh
```

Or download
`https://github.com/AkaraChen/yoi/releases/latest/download/yoi-dashboard_linux_<amd64|arm64>.tar.gz`
plus `checksums.txt`, verify sha256, and put `yoi-dashboard` on PATH
(same dest as above).

Windows and macOS for the probe are not covered — improvise if asked.

## systemd (Linux)

Prefer a user or system unit so the probe restarts on boot and crash.
Bind `127.0.0.1:8788`. Password comes from `YOI_DASHBOARD_PASSWORD` —
do not ship the development default `yoi` in a real unit. Store is
`~/.yoi` or `YOI_DASHBOARD_STORE` / `-store`.

User unit example (`~/.config/systemd/user/yoi-dashboard.service`):

```ini
[Unit]
Description=yoi dashboard probe
After=network.target

[Service]
ExecStart=%h/.local/bin/yoi-dashboard -addr 127.0.0.1:8788 -store %h/.yoi
Environment=YOI_DASHBOARD_PASSWORD=replace-me
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Then: `systemctl --user daemon-reload && systemctl --user enable --now yoi-dashboard.service`.
For start-at-boot without a login session: `loginctl enable-linger "$USER"`.

System unit example (`/etc/systemd/system/yoi-dashboard.service`) if the
human wants a machine-wide service — change `User`, `ExecStart`, and
`YOI_DASHBOARD_STORE` to that account's paths:

```ini
[Unit]
Description=yoi dashboard probe
After=network.target

[Service]
User=replace-me
ExecStart=/usr/local/bin/yoi-dashboard -addr 127.0.0.1:8788
Environment=YOI_DASHBOARD_PASSWORD=replace-me
Environment=YOI_DASHBOARD_STORE=/home/replace-me/.yoi
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```
