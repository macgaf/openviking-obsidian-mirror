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

OpenViking 메모리 데이터를 Obsidian vault로 미러링하고, 제어된 수정 내용을 OV로 다시 보내는 데스크톱 전용 Obsidian 커뮤니티 플러그인입니다.

## 기능

- `viking://user/{space}/memories` 같은 실제 OpenViking memory root 자동 발견
- 디렉터리 요약을 `_dir.abstract.md`, `_dir.overview.md`로 미러링
- `mem_*.md`, `profile.md` 같은 leaf memory 파일 미러링
- 각 leaf 파일 상단에 읽기 전용 `OpenViking Abstract` 섹션 추가
- 해당 섹션이 수정되면 즉시 OpenViking 값으로 복원
- leaf 파일에 대해서만 로컬 드래프트 감지
- OpenViking session extraction을 통해 수정 제출 및 correction URI 연결
- `src/locales/` 리소스 파일 기반의 다국어 UI 지원

## 구조

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

## 설치

```bash
npm install
npm run build
```

`main.js` 와 `manifest.json` 을 다음 위치에 복사하세요:

```text
<Vault>/.obsidian/plugins/openviking-sync/
```

![Installed plugin in Obsidian third-party plugins list](assets/plugin-list.png)

그 다음 Obsidian을 다시 불러오고 플러그인을 활성화하세요.

## 설정

권장 로컬 기본값:

- `OpenViking base URL`: `http://127.0.0.1:1933`
- `API key`: OpenViking API 키
- `UI language`: `Auto` 또는 지원되는 언어
- `Auto-discover memory roots`: 활성화
- `Vault folder`: `OpenViking`
- `Polling interval`: `60`

![Plugin settings page](assets/plugin-settings.png)



## 개발

```bash
npm run typecheck
npm test
npm run build
```

![Example synced OpenViking content inside Obsidian](assets/plugin-ui.png)

## 현재 모델 메모

- 디렉터리 `L0/L1` 은 OV의 공식 요약입니다
- leaf memory 파일은 사용할 수 있는 `abstract`(`L0`)를 제공합니다
- leaf memory 파일에는 안정적으로 공개된 leaf-level `L1` 이 없습니다
- 생성된 `OpenViking Abstract` 섹션은 엄격히 단방향입니다: OpenViking -> Obsidian
