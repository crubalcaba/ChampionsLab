# Champions Lab — Copilot Instructions

Competitive companion for **Pokémon Champions 2026** (VGC doubles). Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · shadcn/ui. The app is a fully client-side, no-account experience backed by a Monte Carlo battle simulator and large static datasets.

## Knowledge layers — read these in order

Two information sources sit between you and `grep`. Use them in this order:

### 1. `.copilot-wiki/` — agent-maintained knowledge wiki

**For any "how does X work / what are the conventions for Y / where does Z fit in" question, read the wiki first.** It's a small set of synthesised markdown pages that turn multi-file reasoning into a single-file read. Layout:

- `.copilot-wiki/index.md` — catalog. **Start here.** Lists every topic page with a one-line summary.
- `.copilot-wiki/log.md` — append-only chronological log (ingests, edits, lint passes).
- Topic pages: `engine-architecture.md`, `data-validation-rules.md`, `i18n-flow.md`, `storage-and-sharing.md`, `build-and-verification.md`, `scripts-and-data-ops.md`, `ui-conventions.md`.

**Wiki protocol — follow strictly:**

- **Read-first.** Before grepping or codegraph-ing for a conceptual answer, scan `index.md` and load any topic page that looks relevant. If a page answers the question, use it.
- **File-back.** Whenever you investigate something new (or correct something the wiki got wrong), write the synthesis back to the wiki in the same session: edit the relevant topic page (or add a new one), update `index.md`, and append a one-line entry to `log.md` in the format `## [YYYY-MM-DD] <kind> | <title> — <note>` (kinds: `ingest`, `edit`, `lint`, `query-fileback`). This is what makes the wiki compound; skipping it means the next session pays the same exploration cost again.
- **Page format.** Each topic page starts with YAML frontmatter:
  ```yaml
  ---
  last-verified: YYYY-MM-DD
  verified-against:
    - path/to/source/file.ts
  key-symbols:
    - symbolName
  ---
  ```
  Update `last-verified` whenever you confirm or rewrite the page. Add/remove `verified-against` and `key-symbols` so the drift lint below can do its job. Body should be terse — TL;DR first, then sections, then a Cross-refs block.
- **Drift lint.** When you change source files, check the wiki for staleness:
  1. For each modified file, find wiki pages whose `verified-against` lists it (grep `.copilot-wiki/*.md` for the path).
  2. For each symbol you renamed or removed, run `codegraph query <symbol>`; if a wiki page references a `key-symbol` that codegraph can no longer find, the page is stale — fix it or mark the issue in `log.md` for follow-up.
- **Don't duplicate this file.** `copilot-instructions.md` is the always-loaded preamble (quick reference). The wiki holds the deep dives. Keep this file terse; expand in the wiki.

### 2. CodeGraph — for structural lookups

This repo is indexed by [CodeGraph](https://github.com/) (see `.codegraph/`). When the wiki doesn't have an answer, **prefer CodeGraph over raw `grep` / `glob` for any "where is X defined / who calls X / what does changing X affect" question** — it is faster, scoped to the project, and call-graph aware. Falling back to grep is fine when CodeGraph returns nothing useful.

Run from the repo root (or pass the project path as the final argument):

```bash
codegraph status                     # Confirm the index is fresh before relying on it
codegraph query <symbol>             # Find a symbol (function, type, constant) anywhere in the codebase
codegraph node <symbol>              # Symbol source + caller / callee trail (best first read)
codegraph callers <symbol>           # Every site that calls a function/method
codegraph callees <symbol>           # Every function a symbol calls
codegraph impact  <symbol>           # Blast radius — what breaks if you change this
codegraph explore "<free-text>"      # Multi-symbol exploration of a feature area
codegraph files                      # File-tree view from the index
codegraph affected <files...>        # Map source changes to potentially affected files
```

**Keep the index fresh.** After any edit, addition, or deletion of source files, run:

```bash
codegraph sync     # Incremental — fast, run after every batch of edits
codegraph index    # Full rebuild — use only if `sync` reports inconsistency or after large refactors
```

Always `codegraph sync` before answering follow-up questions in the same session if you've modified files since the last index activity. If `codegraph status` shows the index is stale or any command returns "no results" for a symbol you know exists, run `sync` (or `index` as a last resort) before trusting the output.

## Commands

```bash
npm run dev           # Next dev server on :3000
npm run build         # Production build — primary verification gate
npm run start         # Run production build
npm run lint          # ESLint (eslint-config-next)
npm run format        # Prettier write
npm run format:check  # Prettier check (no write)
```

**There is no automated test suite.** `CONTRIBUTING.md` instructs contributors to run `npm run build` after changes — that's the canonical "did I break TypeScript / Next compilation" check. Files under `scripts/qa-*.{ts,mjs,cjs}` are **manual** engine smoke tools (run with `npx tsx scripts/qa-foo.ts`), not unit tests.

**TypeScript caveat:** `next.config.ts` sets `typescript.ignoreBuildErrors: true` because Next 16 Turbopack's built-in TS check OOMs on this project. Types are verified standalone with:

```bash
npx tsc --noEmit --skipLibCheck
```

Run this in addition to `npm run build` whenever you change types or touch the engine.

## Architecture

- `src/app/` — App Router pages. The 5 user-facing surfaces are `page.tsx` (Pokédex), `team-builder/`, `battle-bot/`, `meta/`, `learn/` (PokéSchool), plus `paste/`, `events/`, `about/`, `privacy/`, `terms/`.
- `src/app/api/` — Server routes. `share/route.ts` persists shared teams to a JSON file on disk (`data/shared-teams.json`); `contact/` powers the in-app contact form via `nodemailer`.
- `src/components/` — Shared UI. Everything is `"use client"` because the app relies on motion, local state, and the i18n context. shadcn primitives live in `src/components/ui/`.
- `src/lib/` — All business logic.
  - `src/lib/engine/` — The VGC battle engine (Monte Carlo doubles simulator, damage calc, stat calc, type chart, abilities, items, moves, synergy analysis, team generator, ML/meta runner). **Always import via the barrel `@/lib/engine`** — `src/lib/engine/index.ts` is the curated public API; the engine re-exports symbols by feature area.
  - `src/lib/storage.ts` — `localStorage` is the primary persistence layer (keys are `champions-lab:*`). There are no user accounts.
  - `src/lib/i18n/index.tsx` — Client i18n provider + `useI18n()` hook.
  - `src/lib/motion.tsx` — Thin wrapper re-exporting `motion` / `AnimatePresence`. **Import motion from `@/lib/motion`, never directly from `framer-motion`.**
- `supabase/schema.sql` — A schema exists for future server-backed features (profiles, seasons, pokemon_seed, teams). Most of the app does not currently call Supabase; do not assume a row exists for any given Pokémon.
- `scripts/` — Operational tooling (data import, audits, validation, sprite checks, tournament syncs, ML runs). `.ts` files run via `tsx`; `.mjs` / `.cjs` run via plain `node`. The `audit-*`, `validate-*`, `fix-*`, `fetch-*` prefixes are conventional, not enforced.

### Data flow

The engine is **data-driven by static TypeScript modules**, not runtime fetches:

- `src/lib/pokemon-data.ts` exports `POKEMON_SEED` (the 147-mon roster) and `SEASONS`.
- `src/lib/engine/move-data.ts` exports `MOVE_DATA` (engine-side move definitions with flags, targeting, secondary effects).
- `src/lib/engine/items.ts` exports `ITEMS` (effects) and an internal `CHAMPIONS_ITEMS` set (UI allow-list).
- `src/lib/engine/ability-data.ts` exports `getAbilityEffect` and friends.
- `src/lib/usage-data.ts` exports `USAGE_DATA` (common competitive sets used by the bot and suggestion engine).

The simulator (`battle-sim.ts`) consumes a `ChampionsPokemon` + `CommonSet`, resolves mega/form state at battle start, and runs turn-by-turn with VGC-realistic AI. Public entry points are `simulateBattle`, `runSimulation`, `runTeamTestSimulation`.

## Critical data rules (don't skip)

A move/item/ability is **only valid if it is wired into both the data layer and the per-Pokémon list**. Orphans silently disappear from the UI and engine. When adding or editing roster data:

- **Pokémon** — add an entry to `POKEMON_SEED` in `src/lib/pokemon-data.ts`. Set `hidden: true` to keep it out of UI/engine (useful for staging unreleased mons).
- **Moves** — add to `MOVE_DATA` in `src/lib/engine/move-data.ts` **and** to at least one Pokémon's `moves` array in `POKEMON_SEED`. A move that lives only in `MOVE_DATA` is unreachable.
- **Items** — add to `ITEMS` in `src/lib/engine/items.ts` **and** either add the name to the `CHAMPIONS_ITEMS` allow-list **or** mark it `isMegaStone: true`. Mega Stones must set `forPokemon` to a name present in `POKEMON_SEED`.
- **Abilities** — add to `src/lib/engine/ability-data.ts` **and** to the relevant Pokémon's `abilities` array.

After any data change: run `npm run build`, run relevant `scripts/audit-*` / `scripts/validate-*` tools, and append a dated entry to `SHARED_ENTRIES` in `src/components/last-updated.tsx` (the in-app changelog).

## i18n

Translations are JSON dictionaries under `src/lib/i18n/`, split by category: `<locale>.json` (UI strings), `pokemon-names.<locale>.json`, `moves.<locale>.json`, `abilities.<locale>.json`, `items.<locale>.json`, `natures.<locale>.json`, plus `*-descriptions.<locale>.json`. English (`en.json` and `*-descriptions.en.json`) is the source of truth.

- Use `useI18n()` from `@/lib/i18n` in client components. The context exposes `t` (UI), `tp` (pokemon), `tm` (moves), `ta` (abilities), `ti` (items), `tn` (natures), `ts`/`tt`/`tty` (types), `tmd`/`tad`/`tid` (descriptions).
- Engine, audit, and meta layers are English-only — never translate keys that are used as engine lookups (move/ability/item names).
- Preserve placeholders like `{count}`, `{season}`, `{name}` verbatim — they are runtime-interpolated.
- Adding a new locale requires copying every category file **and** registering the locale + dictionaries inside `src/lib/i18n/index.tsx`. The `Locale` union type also needs the new code.

## Conventions

- **Path alias:** `@/*` → `./src/*` (see `tsconfig.json`). Always prefer `@/...` over deep relative imports.
- **Client vs. server:** This app is overwhelmingly client-rendered. New components default to `"use client"` unless you have a specific RSC reason.
- **shadcn/ui:** Style is `base-nova`, base color `neutral`, CSS variables enabled, icons via `lucide-react`. New primitives go in `src/components/ui/`; install via the shadcn CLI rather than hand-rolling.
- **Motion:** Import from `@/lib/motion`, not `framer-motion` directly, so the `"use client"` boundary stays correct.
- **Prettier:** 2-space indent, double quotes, semicolons, trailing commas, LF endings, 80-col width.
- **Remote images:** `next.config.ts` whitelists only `raw.githubusercontent.com/PokeAPI/sprites/**` and the project's Hetzner sprite bucket. Adding any other image host requires editing `remotePatterns`.
- **No `any` if avoidable:** the project aims for 100% TypeScript coverage (per `CONTRIBUTING.md`).
- **Commit style:** emoji-prefixed, present-tense (`✨ Add ...`, `🐛 Fix ...`, `🌍 Add German translation`).
