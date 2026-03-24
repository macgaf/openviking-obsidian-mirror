# OpenViking Sync

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

Plugin communautaire Obsidian, réservé au bureau, qui reflète les données mémoire d’OpenViking dans un vault Obsidian et renvoie des corrections contrôlées vers OpenViking.

## Fonctionnalités

- Détection automatique des vraies racines mémoire OpenViking comme `viking://user/{space}/memories`
- Projection des résumés de dossier vers `_dir.abstract.md` et `_dir.overview.md`
- Projection des fichiers mémoire feuille comme `mem_*.md` et `profile.md`
- Ajout d’une section `OpenViking Abstract` générée et en lecture seule dans chaque fichier feuille
- Restauration immédiate de cette section si l’utilisateur la modifie
- Détection des brouillons locaux uniquement pour les fichiers feuille modifiables
- Envoi des corrections via OpenViking session extraction et liaison de l’URI de correction
- Interface multilingue via les fichiers de ressources dans `src/locales/`

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

Copiez `main.js` et `manifest.json` dans :

```text
<Vault>/.obsidian/plugins/openviking-sync/
```

![Installed plugin in Obsidian third-party plugins list](assets/plugin-list.png)

Rechargez ensuite Obsidian et activez le plugin.

## Configuration

Valeurs locales recommandées :

- `OpenViking base URL` : `http://127.0.0.1:1933`
- `API key` : votre clé API OpenViking
- `UI language` : `Auto` ou n’importe quelle langue prise en charge
- `Auto-discover memory roots` : activé
- `Vault folder` : `OpenViking`
- `Polling interval` : `60`

## Développement

```bash
npm run typecheck
npm test
npm run build
```

![Example synced OpenViking content inside Obsidian](assets/plugin-ui.png)

## Notes sur le modèle actuel

- Les `L0/L1` de dossier sont les résumés officiels de OpenViking
- Les fichiers mémoire feuille exposent un `abstract` exploitable (`L0`)
- Les fichiers feuille n’ont pas de `L1` public et stable par fichier
- La section générée `OpenViking Abstract` est strictement à sens unique : OpenViking -> Obsidian
