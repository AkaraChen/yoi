# Pack delivery over HTTP

Pack list/search/get are plain HTTPS calls against the storefront. No yoi
binary is involved — use `curl` (any HTTP client works).

## Base URL resolution

1. `YOI_PACKS` environment variable, if set.
2. Built-in default: `https://yoi-sigma.vercel.app`.

Normalize before use: trim trailing `/`; if the path ends with `/packs`, trim
that suffix to get the site root — one override value then serves both the
pack index and the pack files. Never invent another pack URL.

## List and search

```bash
curl -fsSL <site>/packs.json
```

returns `[{ "slug": string, "excerpt": string, "cover": string|null }]`.

- List: show the whole index.
- Search: filter client-side — case-insensitive substring match on `slug` or
  `excerpt`.

## Get (download a pack)

NAME must be a slug: `^[a-z0-9][a-z0-9-]*$`. Downloading only fetches files;
it does not install anything.

1. `GET <site>/packs/<NAME>/index.json` → `{ "files": ["<rel>", ...] }`.
   An empty `files` list is an error.
2. For each `rel` in `files`:
   - Reject absolute paths and anything containing `..`.
   - `GET <site>/packs/<NAME>/<rel>`.
   - Write the body to `./packs/<NAME>/<rel>`, creating parent directories.
     Mode `0644` for every file. `.cmdspec` is not a script — do not
     `chmod +x` it and do not pass it to a shell.
3. The pack now lives at `./packs/NAME/`.

curl sketch:

```bash
site="${YOI_PACKS:-https://yoi-sigma.vercel.app}"
site="${site%/}"; site="${site%/packs}"
curl -fsSL "$site/packs/$NAME/index.json"        # then, per file in files[]:
curl -fsSL --create-dirs -o "packs/$NAME/<rel>" "$site/packs/$NAME/<rel>"
```

## After the download

Follow `packs/NAME/reference/install.cmdspec`. Interpret it (cmdspec is
not executable — never `sh` it). Print the plan and wait for a typed yes
before any `RUN` after the confirmation gate — do not skip that.

## Red lines

- Opt-in, human-in-the-loop: ask before installing anything; install
  cmdspec waits for a typed yes. Never perform or claim silent / unattended
  installs.
- Honest uninstall: deleting the pack directory removes the pack.
- No bundling or cross-promotion of 2code.
- No per-page cloud AFF — AFF may only appear in 试验场/干净机 contexts if
  such content exists.
