---
last-verified: 2026-06-27
verified-against:
  - src/lib/i18n/index.tsx
  - src/app/layout.tsx
  - src/lib/engine/strategy-i18n.ts
key-symbols:
  - I18nProvider
  - useI18n
  - Locale
  - UI_TRANSLATIONS
  - POKEMON_NAMES
  - translateStrategyTree
---

# i18n Flow

## TL;DR

Client-side React context provider. `<I18nProvider>` wraps the app in `src/app/layout.tsx`; every consumer calls `useI18n()` from `@/lib/i18n` to get a function bag of translators. Engine and audit code are **English-only** — names are lookup keys, not display strings.

## Supported locales

The `Locale` union in `src/lib/i18n/index.tsx` lists more codes than are actually wired up. Currently loaded dictionaries:

- `en` (source of truth)
- `fr`, `es`, `it`, `de`, `pt-PT`, `ko`

If `Locale` includes a code with no dictionary entry, `UI_TRANSLATIONS[locale] ?? UI_TRANSLATIONS.en` falls back silently.

## Hook surface

`useI18n()` returns `{ locale, setLocale, t, tp, tm, ta, ti, tn, ts, tt, tty, tmd, tad, tid }`:

| Fn | Translates |
|---|---|
| `t(key)` | UI strings from `<locale>.json`. |
| `tp(name)` | Pokémon names. |
| `tm(name)` | Move names. |
| `ta(name)` | Ability names. |
| `ti(name)` | Item names. |
| `tn(name)` | Nature names. |
| `ts(type)` / `tt(type)` / `tty(type)` | Type names (short / full / category-specific). |
| `tmd(name, fallback)` | Move **descriptions**. |
| `tad(name, fallback)` | Ability descriptions. |
| `tid(name, fallback)` | Item descriptions. |

Always pass the **English source key** to `tp/tm/ta/ti/tn/tmd/tad/tid` — the dictionary maps `english → localised`.

## Dictionary categories

Per locale `xx`, the loader expects:

- `xx.json` — UI strings (mirrors `en.json` structure).
- `pokemon-names.xx.json`, `moves.xx.json`, `abilities.xx.json`, `items.xx.json`, `natures.xx.json` — name maps.
- `move-descriptions.xx.json`, `ability-descriptions.xx.json`, `item-descriptions.xx.json` — long-form descriptions.

All files live in `src/lib/i18n/`.

## Strategy-tree i18n (separate)

Strategy-tree text comes from generator code, not JSON. Per-locale translators live as siblings of the engine:

- `src/lib/engine/strategy-i18n.ts` (English source) and `strategy-i18n-{es,it,de,ko}.ts`.
- `src/lib/engine/index.ts` re-exports them; consumers call `translateStrategyTree<XX>` and `translateInsights<XX>`.

When adding a locale to the strategy tree, create a new `strategy-i18n-<lang>.ts`, add it to the engine barrel, and route it from wherever the tree is rendered.

## Adding a new locale

1. Copy `en.json` → `xx.json` and every `*.en.json` (or use an existing locale as template) → `*.xx.json`. Translate keys.
2. In `src/lib/i18n/index.tsx`:
   - Add the new code to the `Locale` union.
   - `import xx from "./xx.json"` and the category files.
   - Add to `UI_TRANSLATIONS`, `POKEMON_NAMES`, and every other lookup map at the top of the file.
3. Add the locale to the language selector (`src/components/language-selector.tsx`).
4. If the strategy tree should be localised: create `strategy-i18n-xx.ts` and wire it through the engine barrel.

## Placeholders

`{name}`, `{count}`, `{season}`, `{value}` etc. are runtime-interpolated. **Never translate or remove them.** A missing placeholder produces a literal `{name}` in the UI.

## Cross-refs

- [engine-architecture](engine-architecture.md) — engine is English-only by design; do not "translate" engine inputs.
- [ui-conventions](ui-conventions.md) — `useI18n()` only works in `"use client"` components.
