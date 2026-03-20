# Repository Guidelines

## Project Structure & Module Organization

This repository currently contains design material in `docs/`, including the main proposal at `docs/obsidian-openviking-sync-proposal.md`. As implementation starts, keep the codebase organized as an Obsidian community plugin:

- `src/` for plugin source, OpenViking client code, sync logic, and UI views
- `tests/` for automated tests
- `assets/` for icons or static plugin assets
- `docs/` for proposals, architecture notes, and operational guides
- `manifest.json` for Obsidian plugin metadata

Prefer small modules. Keep OpenViking API access separate from vault projection and sync state handling.

## Build, Test, and Development Commands

This repo is not scaffolded yet, but contributors should adopt a standard TypeScript plugin workflow:

- `npm install` installs dependencies
- `npm run dev` starts incremental builds during plugin development
- `npm run build` creates a production bundle
- `npm test` runs the automated test suite

When the scaffold is added, keep command names stable unless there is a strong reason to change them.

## Coding Style & Naming Conventions

Use TypeScript for plugin code. Follow these defaults:

- 2-space indentation
- `camelCase` for variables and functions
- `PascalCase` for classes and view components
- kebab-case for filenames such as `openviking-client.ts`

Prefer explicit types at API boundaries and keep sync behavior deterministic. Avoid mixing Obsidian vault operations with raw HTTP calls in the same module.

## Testing Guidelines

Use test files named `*.test.ts` under `tests/`. Focus coverage on:

- URI-to-file projection rules
- sync diffing by `uri` and `modTime`
- conflict handling and delete confirmation
- OpenViking client behavior and error handling

Run `npm test` before opening a PR. Add targeted tests for each bug fix.

## Commit & Pull Request Guidelines

There is no git history in this repository yet, so use these defaults:

- Conventional Commits such as `feat:`, `fix:`, `docs:`, and `test:`
- Keep commits focused and small enough to review independently

Pull requests should include a clear summary, scope, manual test notes, and linked issues if available. Include screenshots or short recordings for any Obsidian UI change.

## Security & Configuration Tips

Never commit API keys, local vault paths, or personal OpenViking data. Keep the OpenViking endpoint configurable and test against a disposable Obsidian vault, not a personal knowledge base.
