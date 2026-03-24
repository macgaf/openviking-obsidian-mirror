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

桌面端 Obsidian 社区插件，用于将 OpenViking记忆数据镜像到 Obsidian，并把受控修正回写到 OpenViking。

## 功能

- 自动发现真实 OpenViking memory 根目录，如 `viking://user/{space}/memories`
- 将目录级摘要镜像为 `_dir.abstract.md` 和 `_dir.overview.md`
- 将叶子记忆文件镜像为 `mem_*.md`、`profile.md`
- 在每个叶子文件顶部生成只读的 `OpenViking Abstract` 区块
- 若该区块被修改，立即恢复为 OpenViking 当前值
- 只对叶子文件检测本地草稿
- 通过 OpenViking session extraction 提交修正并关联 correction URI
- 通过 `src/locales/` 中的资源文件支持多语言 UI

## 结构

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

## 安装

```bash
npm install
npm run build
```

将 `main.js` 和 `manifest.json` 复制到：

```text
<Vault>/.obsidian/plugins/openviking-sync/
```

然后重载 Obsidian 并启用插件。

![Obsidian 第三方插件列表中的已安装插件](assets/plugin-list.png)


## 配置

推荐本地默认值：

- `OpenViking base URL`: `http://127.0.0.1:1933`
- `API key`: 你的 OpenViking API key
- `UI language`: `Auto` 或任意支持的语言
- `Auto-discover memory roots`: 开启
- `Vault folder`: `OpenViking`
- `Polling interval`: `60`

![Plugin settings page](assets/plugin-settings.png)


## 开发

```bash
npm run typecheck
npm test
npm run build
```

## 当前模型说明

![Obsidian 中同步出来的 OpenViking 数据示例](assets/plugin-ui.png)


- 目录级 `L0/L1` 是 OpenViking 官方摘要
- 叶子记忆文件有可用的 `abstract`（`L0`）
- 叶子记忆文件没有稳定公开的 leaf-level `L1`
- 生成的 `OpenViking Abstract` 区块严格单向：OpenViking -> Obsidian
