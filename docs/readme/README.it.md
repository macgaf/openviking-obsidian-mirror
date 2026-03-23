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

Plugin della community di Obsidian, solo desktop, che riflette i dati di memoria di OpenViking in un vault di Obsidian e invia correzioni controllate di nuovo a OpenViking.

## Funzionalità

- Scopre automaticamente le vere radici di memoria OpenViking come `viking://user/{space}/memories`
- Rispecchia i riepiloghi di directory in `_dir.abstract.md` e `_dir.overview.md`
- Rispecchia i file di memoria foglia come `mem_*.md` e `profile.md`
- Aggiunge una sezione `OpenViking Abstract` generata e di sola lettura in ogni file foglia
- Ripristina immediatamente quella sezione se viene modificata
- Rileva bozze locali solo per i file foglia modificabili
- Invia correzioni tramite OpenViking session extraction e collega il correction URI
- Supporta UI multilingue tramite file di risorse in `src/locales/`

## Struttura

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

## Installazione

```bash
npm install
npm run build
```

Copia `main.js` e `manifest.json` in:

```text
<Vault>/.obsidian/plugins/obsidian-openviking-sync/
```

![Installed plugin in Obsidian third-party plugins list](assets/plugin-list.png)

Poi ricarica Obsidian e abilita il plugin.

## Configurazione

Valori locali consigliati:

- `OpenViking base URL`: `http://127.0.0.1:1933`
- `API key`: la tua chiave API OpenViking
- `UI language`: `Auto` o una lingua supportata
- `Auto-discover memory roots`: attivo
- `Vault folder`: `OpenViking`
- `Polling interval`: `60`

![Plugin settings page](assets/plugin-settings.png)



## Sviluppo

```bash
npm run typecheck
npm test
npm run build
```

![Example synced OpenViking content inside Obsidian](assets/plugin-ui.png)

## Note sul modello attuale

- Gli `L0/L1` di directory sono i riassunti ufficiali di OpenViking
- I file di memoria foglia espongono un `abstract` utilizzabile (`L0`)
- I file foglia non hanno un `L1` pubblico e stabile a livello di file
- La sezione generata `OpenViking Abstract` è strettamente monodirezionale: OpenViking -> Obsidian
