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

桌面版 Obsidian 社群外掛，用來將 OpenViking記憶資料鏡像到 Obsidian，並把受控修正回寫到 OpenViking。

## 功能

- 自動發現真實的 OpenViking memory 根目錄，例如 `viking://user/{space}/memories`
- 將目錄級摘要鏡像為 `_dir.abstract.md` 與 `_dir.overview.md`
- 將葉節點記憶檔案鏡像為 `mem_*.md`、`profile.md`
- 在每個葉節點檔案頂部產生唯讀的 `OpenViking Abstract` 區塊
- 若該區塊被修改，會立即恢復成 OpenViking 當前值
- 僅對葉節點檔案偵測本地草稿
- 透過 OpenViking session extraction 提交修正並關聯 correction URI
- 透過 `src/locales/` 中的資源檔支援多語 UI

## 結構

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

## 安裝

```bash
npm install
npm run build
```

將 `main.js` 和 `manifest.json` 複製到：

```text
<Vault>/.obsidian/plugins/obsidian-openviking-sync/
```

![Installed plugin in Obsidian third-party plugins list](assets/plugin-list.png)

然後重新載入 Obsidian 並啟用外掛。

## 設定

建議本機預設值：

- `OpenViking base URL`: `http://127.0.0.1:1933`
- `API key`: 你的 OpenViking API key
- `UI language`: `Auto` 或任一支援語言
- `Auto-discover memory roots`: 開啟
- `Vault folder`: `OpenViking`
- `Polling interval`: `60`

![Plugin settings page](assets/plugin-settings.png)



## 開發

```bash
npm run typecheck
npm test
npm run build
```

## 目前模型說明

![Obsidian 中同步出來的 OpenViking 資料示例](assets/plugin-ui.png)


- 目錄級 `L0/L1` 是 OpenViking 官方摘要
- 葉節點記憶檔案具有可用的 `abstract`（`L0`）
- 葉節點記憶檔案沒有穩定公開的 leaf-level `L1`
- 產生的 `OpenViking Abstract` 區塊是嚴格單向的：OpenViking -> Obsidian
