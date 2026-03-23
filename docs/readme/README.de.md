# Obsidian OpenViking Sync

🌐 README:
🇺🇸 [English](../../README.md) |
🇨🇳 [简体中文](README.zh-CN.md) |
🇹🇼 [繁體中文](README.zh-TW.md) |
🇯🇵 [日本語](README.ja.md) |
🇰🇷 [한국어](README.ko.md) |
🇪🇸 [Español](README.es.md) |
🇫🇷 [Français](README.fr.md) |
🇩🇪 [Deutsch](README.de.md) |
🇮🇹 [Italiano](README.it.md) |
🇧🇷 [Português (Brasil)](README.pt-BR.md) |
🇷🇺 [Русский](README.ru.md) |
🇸🇦 [العربية](README.ar.md) |
🇮🇳 [हिन्दी](README.hi.md)

Desktop-Plugin für Obsidian, das OpenViking- Memory-Daten in einen Obsidian-Vault spiegelt und kontrollierte Korrekturen an OpenViking zurücksendet.

## Funktionen

- Erkennt reale OpenViking-Memory-Wurzeln wie `viking://user/{space}/memories`
- Spiegelt Verzeichnis-Zusammenfassungen nach `_dir.abstract.md` und `_dir.overview.md`
- Spiegelt Leaf-Memory-Dateien wie `mem_*.md` und `profile.md`
- Fügt jeder Leaf-Datei einen generierten, schreibgeschützten Abschnitt `OpenViking Abstract` hinzu
- Stellt diesen Abschnitt sofort wieder her, wenn er bearbeitet wird
- Erkennt lokale Entwürfe nur für bearbeitbare Leaf-Dateien
- Sendet Korrekturen über OpenViking session extraction und verknüpft die correction URI
- Unterstützt mehrsprachige UI über Ressourcendateien in `src/locales/`

## Struktur

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

Kopiere `main.js` und `manifest.json` nach:

```text
<Vault>/.obsidian/plugins/obsidian-openviking-sync/
```

![Installed plugin in Obsidian third-party plugins list](assets/plugin-list.png)

Danach Obsidian neu laden und das Plugin aktivieren.

## Konfiguration

Empfohlene lokale Standardwerte:

- `OpenViking base URL`: `http://127.0.0.1:1933`
- `API key`: dein OpenViking API-Schlüssel
- `UI language`: `Auto` oder eine unterstützte Sprache
- `Auto-discover memory roots`: aktiviert
- `Vault folder`: `OpenViking`
- `Polling interval`: `60`

![Plugin settings page](assets/plugin-settings.png)



## Entwicklung

```bash
npm run typecheck
npm test
npm run build
```

![Example synced OpenViking content inside Obsidian](assets/plugin-ui.png)

## Hinweise zum aktuellen Modell

- Verzeichnis-`L0/L1` sind die offiziellen OpenViking-Zusammenfassungen
- Leaf-Memory-Dateien liefern ein nutzbares `abstract` (`L0`)
- Leaf-Dateien haben kein stabiles öffentliches Leaf-Level-`L1`
- Der generierte Abschnitt `OpenViking Abstract` ist strikt einseitig: OpenViking -> Obsidian
