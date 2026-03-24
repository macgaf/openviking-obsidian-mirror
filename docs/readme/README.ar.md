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

إضافة مجتمعية لسطح المكتب في Obsidian تقوم بعكس بيانات ذاكرة OpenViking داخل vault في Obsidian وترسل التصحيحات المقيدة مرة أخرى إلى OpenViking.

## الميزات

- اكتشاف تلقائي لجذور ذاكرة OpenViking الحقيقية مثل `viking://user/{space}/memories`
- عكس ملخصات الأدلة إلى `_dir.abstract.md` و `_dir.overview.md`
- عكس ملفات الذاكرة الطرفية مثل `mem_*.md` و `profile.md`
- إضافة قسم `OpenViking Abstract` مُولَّد للقراءة فقط أعلى كل ملف طرفي
- استعادة هذا القسم فورًا إذا تم تعديله
- اكتشاف المسودات المحلية فقط لملفات الذاكرة الطرفية القابلة للتحرير
- إرسال التصحيحات عبر OpenViking session extraction وربط correction URI
- دعم واجهة متعددة اللغات عبر ملفات الموارد داخل `src/locales/`

## البنية

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

## التثبيت

```bash
npm install
npm run build
```

انسخ `main.js` و `manifest.json` إلى:

```text
<Vault>/.obsidian/plugins/openviking-sync/
```

![Installed plugin in Obsidian third-party plugins list](assets/plugin-list.png)

ثم أعد تحميل Obsidian وفعّل الإضافة.

## الإعداد

الإعدادات المحلية الموصى بها:

- `OpenViking base URL`: `http://127.0.0.1:1933`
- `API key`: مفتاح OpenViking API الخاص بك
- `UI language`: `Auto` أو أي لغة مدعومة
- `Auto-discover memory roots`: مفعّل
- `Vault folder`: `OpenViking`
- `Polling interval`: `60`

![Plugin settings page](assets/plugin-settings.png)



## التطوير

```bash
npm run typecheck
npm test
npm run build
```

![Example synced OpenViking content inside Obsidian](assets/plugin-ui.png)

## ملاحظات حول النموذج الحالي

- `L0/L1` على مستوى الدليل هي الملخصات الرسمية لـ OpenViking
- ملفات الذاكرة الطرفية توفر `abstract` قابلاً للاستخدام (`L0`)
- لا يوجد `L1` عام ومستقر على مستوى الملف الطرفي
- قسم `OpenViking Abstract` المُولَّد أحادي الاتجاه تمامًا: OpenViking -> Obsidian
