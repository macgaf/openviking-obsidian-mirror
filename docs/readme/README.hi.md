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

यह एक डेस्कटॉप-ओनली Obsidian कम्युनिटी प्लगइन है जो OpenViking मेमोरी डेटा को Obsidian vault में मिरर करता है और नियंत्रित सुधारों को OpenViking में वापस भेजता है।

## विशेषताएँ

- `viking://user/{space}/memories` जैसे वास्तविक OpenViking memory roots का स्वचालित पता लगाना
- डायरेक्टरी सारांशों को `_dir.abstract.md` और `_dir.overview.md` में मिरर करना
- `mem_*.md` और `profile.md` जैसे leaf memory files को मिरर करना
- हर leaf file के शीर्ष पर एक generated, read-only `OpenViking Abstract` section जोड़ना
- यदि उस section को बदला जाए तो उसे तुरंत OpenViking के मान से पुनर्स्थापित करना
- केवल editable leaf files के लिए local drafts पहचानना
- OpenViking session extraction के माध्यम से corrections भेजना और correction URI लिंक करना
- `src/locales/` में resource files के माध्यम से बहुभाषी UI समर्थन

## संरचना

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

## इंस्टॉलेशन

```bash
npm install
npm run build
```

`main.js` और `manifest.json` को यहाँ कॉपी करें:

```text
<Vault>/.obsidian/plugins/obsidian-openviking-sync/
```

![Installed plugin in Obsidian third-party plugins list](assets/plugin-list.png)

फिर Obsidian को reload करें और प्लगइन enable करें।

## कॉन्फ़िगरेशन

अनुशंसित लोकल डिफ़ॉल्ट:

- `OpenViking base URL`: `http://127.0.0.1:1933`
- `API key`: आपका OpenViking API key
- `UI language`: `Auto` या कोई समर्थित भाषा
- `Auto-discover memory roots`: enabled
- `Vault folder`: `OpenViking`
- `Polling interval`: `60`

![Plugin settings page](assets/plugin-settings.png)



## विकास

```bash
npm run typecheck
npm test
npm run build
```

![Example synced OpenViking content inside Obsidian](assets/plugin-ui.png)

## वर्तमान मॉडल नोट्स

- डायरेक्टरी `L0/L1` OpenViking के आधिकारिक सारांश हैं
- Leaf memory files उपयोगी `abstract` (`L0`) प्रदान करते हैं
- Leaf files के लिए स्थिर public leaf-level `L1` उपलब्ध नहीं है
- generated `OpenViking Abstract` section सख्ती से एक-तरफ़ा है: OpenViking -> Obsidian
