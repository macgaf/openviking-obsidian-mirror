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

Plugin comunitário do Obsidian, somente para desktop, que espelha dados de memória do OpenViking em um vault do Obsidian e envia correções controladas de volta ao OpenViking.

## Recursos

- Descobre automaticamente raízes reais de memória OpenViking como `viking://user/{space}/memories`
- Espelha resumos de diretório em `_dir.abstract.md` e `_dir.overview.md`
- Espelha arquivos de memória folha como `mem_*.md` e `profile.md`
- Adiciona uma seção `OpenViking Abstract` gerada e somente leitura em cada arquivo folha
- Restaura essa seção imediatamente se o usuário a editar
- Detecta rascunhos locais apenas em arquivos folha editáveis
- Envia correções via OpenViking session extraction e vincula a correction URI
- Suporta UI multilíngue com arquivos de recursos em `src/locales/`

## Estrutura

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

## Instalação

```bash
npm install
npm run build
```

Copie `main.js` e `manifest.json` para:

```text
<Vault>/.obsidian/plugins/obsidian-openviking-sync/
```

![Installed plugin in Obsidian third-party plugins list](assets/plugin-list.png)

Depois recarregue o Obsidian e habilite o plugin.

## Configuração

Padrões locais recomendados:

- `OpenViking base URL`: `http://127.0.0.1:1933`
- `API key`: sua chave API OpenViking
- `UI language`: `Auto` ou qualquer idioma suportado
- `Auto-discover memory roots`: ativado
- `Vault folder`: `OpenViking`
- `Polling interval`: `60`

![Plugin settings page](assets/plugin-settings.png)



## Desenvolvimento

```bash
npm run typecheck
npm test
npm run build
```

![Example synced OpenViking content inside Obsidian](assets/plugin-ui.png)

## Notas do modelo atual

- `L0/L1` de diretório são os resumos oficiais do OpenViking
- Arquivos de memória folha expõem um `abstract` utilizável (`L0`)
- Arquivos folha não têm um `L1` público e estável por arquivo
- A seção gerada `OpenViking Abstract` é estritamente unidirecional: OpenViking -> Obsidian
