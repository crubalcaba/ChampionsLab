---
last-verified: 2026-06-27
verified-against:
  - scripts/
  - scripts/download-mega-sprites.cjs
  - package.json
key-symbols: []
---

# Scripts & Data Ops

## TL;DR

`scripts/` is operational tooling — data import, audits, validation, ML runs. **Not a test suite.** `.ts` runs via `tsx`, `.mjs` and `.cjs` via plain `node`. Naming prefix tells you what a script does.

## Runners

```bash
npx tsx scripts/<name>.ts        # for TypeScript scripts
node    scripts/<name>.mjs       # ES modules
node    scripts/<name>.cjs       # CommonJS
bash    scripts/<name>.sh        # shell wrappers (deploy/sync hooks)
```

`tsx` is in `devDependencies`. Scripts can import from `src/` directly (e.g. `import { POKEMON_SEED } from "../src/lib/pokemon-data"`).

## Mega sprite download workflow

- `npm run sprites:download-mega` runs `node scripts/download-mega-sprites.cjs`.
- The script scans `src/lib/pokemon-data.ts` and auto-discovers mega sprite refs (`*m.png`, `*mx.png`, `*my.png`, `oa-*.png`, and mega-form numeric IDs).
- Default mode downloads only missing/empty files in `public/sprites/`; `--force` re-downloads all discovered mega sprite refs.
- Source priority is project object storage (`champions-lab-sprites.../sprites`) first, with fallbacks for compatible IDs (PokeAPI HOME / official-artwork / front sprite), plus Serebii fallback for `m`-suffix patterns.
- No base-form copy fallback is used for mega `m`-suffix assets.

## Prefix conventions

| Prefix | Purpose | Examples |
|---|---|---|
| `fetch-*` | Pull data from external sources (PokeAPI, Serebii, Limitless). | `fetch-pokemon.mjs`, `fetch-all-moves.mjs`, `fetch-{french,german,italian,spanish,korean}-names.mjs`, `fetch-{lang}-gamedata.mjs` |
| `add-*` | Add new entities to data files. | `add-new-pokemon.mjs`, `add-missing-megas.mjs`, `add-regional-forms.mjs` |
| `update-*` | Bulk in-place updates. | `update-movepools.mjs`, `update-real-meta.mjs`, `update-mega-abilities.mjs` |
| `fix-*` | Repair malformed or inconsistent data. | `fix-mega-stats.mjs`, `fix-sprite-ids.mjs`, `fix-corrupted-moves.mjs` |
| `audit-*` | Read-only inspection; surfaces problems. | `audit-data.cjs`, `audit-engine-moves-v2.ts`, `audit-roster.cjs`, `audit-mega-stats.ts` |
| `validate-*` | Stricter check; may exit non-zero or emit a JSON report. | `validate-stats.ts`, `validate-regional-forms.ts`, `validate-roster.mjs`, `validate-sprites.mjs` |
| `check-*` | Sanity checks (small, focused). | `check-sprites.mjs`, `check-team-dupes.cjs`, `check-megas.mjs` |
| `find-*` | Search / discovery. | `find-missing-megastones.ts`, `find-90-teams-v3.ts` |
| `qa-*` | Manual engine smoke tests (see [build-and-verification](build-and-verification.md)). | `qa-battle-bot.ts`, `qa-calc-tester.ts`, `qa-team-composition.ts`, `qa-transforms.ts` |
| `gen-*` | Generates artifacts (favicons, share links). | `gen-favicon.cjs`, `gen-share-link.ts` |
| `run-*` | Long-running ML / batch sims. | `run-full-ml.ts`, `run-million.ts`, `run-mega-sim.ts` |
| `sync-*` | External-data sync (often scheduled). | `sync-limitless-tournaments.ts`, `sync-roster.mjs`, `sync-tiers.ts` |
| `scrape-*` | Scrape an external site. | `scrape-events.mjs` |
| `test-*` | One-off engine experiments, not a test framework. | `test-engine.ts`, `test-ml.ts`, `test-mega-sim.ts` |

## Validation reports

Validators write JSON next to the script:

- `scripts/stats-validation-report.json`
- `scripts/regional-forms-validation-report.json`

These are **outputs**, regenerated on each run; do not edit by hand.

## Caches

- `scripts/move-data-cache.json`, `scripts/limitless-cache.json`, `scripts/limitless-preview.json`, `scripts/serebii-moves.json` — local caches for fetch-* scripts. Safe to delete to force a re-fetch.
- `scripts/fetch-log.txt` — append-only log of fetch operations.

## Shell glue

- `scripts/daily-limitless-sync.sh` — cron entry-point for tournament sync.
- `scripts/post-sim-deploy.sh`, `scripts/watch-and-deploy.sh`, `scripts/download-sprites.sh` — deploy / asset utilities.

## Typical workflows

- **Added a new Pokémon** → `audit-roster.cjs` + `validate-stats.ts` + `audit-sprites.cjs`.
- **Added/edited moves** → `audit-engine-moves-v2.ts` + `audit-data.cjs`.
- **Reworked a Mega** → `audit-mega-stats.ts` + `audit-mega-teams.ts`.
- **Refreshing meta** → `sync-limitless-tournaments.ts` + `update-real-meta.mjs` + an ML run (`run-full-ml.ts` for full, `run-million.ts` for the headline number).

After any data op, follow the [data-validation-rules](data-validation-rules.md) post-change checklist.

## Cross-refs

- [data-validation-rules](data-validation-rules.md)
- [build-and-verification](build-and-verification.md)
