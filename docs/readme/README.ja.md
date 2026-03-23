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

OpenVikingのメモリデータを Obsidian vault にミラーし、制御された修正を OpenViking に返送するためのデスクトップ専用 Obsidian コミュニティプラグインです。

## 機能

- `viking://user/{space}/memories` のような実際の OpenViking memory ルートを自動検出
- ディレクトリ要約を `_dir.abstract.md` と `_dir.overview.md` にミラー
- `mem_*.md` や `profile.md` などの leaf メモリファイルをミラー
- 各 leaf ファイル先頭に読み取り専用の `OpenViking Abstract` セクションを追加
- そのセクションが編集された場合は即座に OpenViking の値へ復元
- leaf ファイルのみローカルドラフトを検出
- OpenViking session extraction を通じて修正を送信し correction URI を関連付け
- `src/locales/` のリソースファイルによる多言語 UI

## 構成

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

## インストール

```bash
npm install
npm run build
```

`main.js` と `manifest.json` を次へコピーします：

```text
<Vault>/.obsidian/plugins/obsidian-openviking-sync/
```

![Installed plugin in Obsidian third-party plugins list](assets/plugin-list.png)

その後 Obsidian を再読み込みし、プラグインを有効化します。

## 設定

推奨されるローカル既定値：

- `OpenViking base URL`: `http://127.0.0.1:1933`
- `API key`: OpenViking の API キー
- `UI language`: `Auto` または任意の対応言語
- `Auto-discover memory roots`: 有効
- `Vault folder`: `OpenViking`
- `Polling interval`: `60`

![Plugin settings page](assets/plugin-settings.png)



## 開発

```bash
npm run typecheck
npm test
npm run build
```

![Example synced OpenViking content inside Obsidian](assets/plugin-ui.png)

## 現在のモデルに関する注意

- ディレクトリ単位の `L0/L1` は OpenViking の公式要約です
- leaf メモリファイルは利用可能な `abstract`（`L0`）を持ちます
- leaf メモリファイルには安定した公開 leaf-level `L1` はありません
- 生成される `OpenViking Abstract` セクションは厳密に一方向です：OpenViking -> Obsidian
