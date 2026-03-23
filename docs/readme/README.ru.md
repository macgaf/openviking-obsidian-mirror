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

Настольный community-плагин для Obsidian, который зеркалирует данные памяти OpenViking в vault Obsidian и отправляет контролируемые исправления обратно в OpenViking.

## Возможности

- Автоматически обнаруживает реальные корни памяти OpenViking, например `viking://user/{space}/memories`
- Зеркалирует сводки каталогов в `_dir.abstract.md` и `_dir.overview.md`
- Зеркалирует leaf-файлы памяти, такие как `mem_*.md` и `profile.md`
- Добавляет в начало каждого leaf-файла сгенерированный раздел `OpenViking Abstract` только для чтения
- Немедленно восстанавливает этот раздел при редактировании
- Определяет локальные черновики только для редактируемых leaf-файлов
- Отправляет исправления через OpenViking session extraction и связывает correction URI
- Поддерживает многоязычный UI через файлы ресурсов в `src/locales/`

## Структура

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

## Установка

```bash
npm install
npm run build
```

Скопируйте `main.js` и `manifest.json` в:

```text
<Vault>/.obsidian/plugins/obsidian-openviking-sync/
```

![Installed plugin in Obsidian third-party plugins list](assets/plugin-list.png)

Затем перезагрузите Obsidian и включите плагин.

## Конфигурация

Рекомендуемые локальные значения:

- `OpenViking base URL`: `http://127.0.0.1:1933`
- `API key`: ваш OpenViking API-ключ
- `UI language`: `Auto` или любой поддерживаемый язык
- `Auto-discover memory roots`: включено
- `Vault folder`: `OpenViking`
- `Polling interval`: `60`

![Plugin settings page](assets/plugin-settings.png)



## Разработка

```bash
npm run typecheck
npm test
npm run build
```

![Example synced OpenViking content inside Obsidian](assets/plugin-ui.png)

## Примечания к текущей модели

- Каталожные `L0/L1` являются официальными сводками OpenViking
- Leaf-файлы памяти содержат пригодный `abstract` (`L0`)
- Leaf-файлы не имеют стабильного публичного leaf-level `L1`
- Сгенерированный раздел `OpenViking Abstract` строго односторонний: OpenViking -> Obsidian
