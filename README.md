# OpenViking Sync

🌐 README:
🇺🇸 [English](README.md) |
🇨🇳 [简体中文](docs/readme/README.zh-CN.md) |
🇹🇼 [繁體中文](docs/readme/README.zh-TW.md) |
🇯🇵 [日本語](docs/readme/README.ja.md) |
🇰🇷 [한국어](docs/readme/README.ko.md) |
🇪🇸 [Español](docs/readme/README.es.md) |
🇫🇷 [Français](docs/readme/README.fr.md) |
🇩🇪 [Deutsch](docs/readme/README.de.md) |
🇮🇹 [Italiano](docs/readme/README.it.md) |
🇧🇷 [Português (Brasil)](docs/readme/README.pt-BR.md) |
🇷🇺 [Русский](docs/readme/README.ru.md) |
🇸🇦 [العربية](docs/readme/README.ar.md) |
🇮🇳 [हिन्दी](docs/readme/README.hi.md)

Desktop-only Obsidian community plugin for mirroring OpenViking memory data into an Obsidian vault and sending controlled corrections back to OpenViking.

## Features

- Auto-discovers real OpenViking memory roots such as `viking://user/{space}/memories`
- Mirrors directory summaries to `_dir.abstract.md` and `_dir.overview.md`
- Mirrors leaf memory files such as `mem_*.md` and `profile.md`
- Adds a generated, one-way `OpenViking Abstract` section to each leaf file
- Restores the generated abstract section immediately if edited
- Detects local drafts for leaf files only
- Submits corrections through OpenViking session extraction and links the correction URI
- Supports multilingual UI through locale resource files under `src/locales/`

## Structure

```text
src/
  i18n.ts
  locales/
  main.ts
  settings.ts
  ov-client.ts
  store.ts
  projector.ts
  sync-engine.ts
  correction-engine.ts
tests/
docs/
```

## Installation

```bash
npm install
npm run build
```

Copy `main.js` and `manifest.json` into:

```text
<Vault>/.obsidian/plugins/openviking-sync/
```

Then reload Obsidian and enable the plugin.

![Installed plugin in Obsidian third-party plugins list](docs/readme/assets/plugin-list.png)

## Configuration

Recommended local defaults:

- `OpenViking base URL`: `http://127.0.0.1:1933`
- `API key`: your OpenViking API key
- `UI language`: `Auto` or a specific supported locale
- `Auto-discover memory roots`: enabled
- `Vault folder`: `OpenViking`
- `Polling interval`: `60`

![Plugin settings page](docs/readme/assets/plugin-settings.png)

## Disclosures

- This plugin sends network requests only to the OpenViking base URL you configure.
- If you configure an API key, the plugin sends it to OpenViking in the `X-API-Key` request header and stores it locally in Obsidian plugin data.
- The plugin stores settings, sync state, projection metadata, and revision history in local plugin data on your device.
- The plugin writes managed projection files only inside the vault folder you configure.
- Submitting corrections or confirming deletions requires explicit user commands. Correction submission sends the original and edited memory content to OpenViking and creates a temporary OpenViking session during extraction.
- This plugin does not include telemetry, analytics, advertising, or calls to third-party services beyond the OpenViking endpoint you configure.

## Development

```bash
npm run typecheck
npm test
npm run build
```

## Current Model Notes

![Example synced OpenViking content inside Obsidian](docs/readme/assets/plugin-ui.png)

- Directory `L0/L1` are official OpenViking summaries
- Leaf memory files expose a usable `abstract` (`L0`)
- Leaf memory files do not have a stable public leaf-level `L1`
- The generated `OpenViking Abstract` section is strictly one-way: OpenViking -> Obsidian
