---
last-verified: 2026-06-27
verified-against:
  - src/lib/pokemon-data.ts
  - src/lib/engine/move-data.ts
  - src/lib/engine/items.ts
  - src/lib/engine/ability-data.ts
  - src/components/last-updated.tsx
key-symbols:
  - POKEMON_SEED
  - MOVE_DATA
  - ITEMS
  - CHAMPIONS_ITEMS
  - SHARED_ENTRIES
---

# Data Validation Rules

## TL;DR

Pokémon / moves / items / abilities are valid **only when wired into both the data layer and the per-Pokémon list**. Orphans (e.g. a move in `MOVE_DATA` but not in any Pokémon's `moves` array) silently disappear from the UI and engine — no warning, no error. This is the single most common contribution mistake.

## Pokémon

- File: `src/lib/pokemon-data.ts`.
- Add an entry to the `POKEMON_SEED` array.
- Set `hidden: true` to keep the mon out of UI and engine while staging — useful for unreleased mons.
- `forms[]` holds alt/mega/regional forms; set `isMega: true` on a form to mark it as a Mega Evolution. X/Y/Z mega variants must have `name` ending in `" X"`, `" Y"`, or `" Z"` so `resolveMegaForm` can match them by stone suffix.

## Moves

A move is valid only if **both** are true:

1. It exists in `MOVE_DATA` (`src/lib/engine/move-data.ts`) with full engine metadata: `type`, `category`, `power`, `accuracy`, `pp`, `target`, `priority`, `flags`, `secondaryEffects`, `bp` etc.
2. It appears in at least one Pokémon's `moves[]` array in `POKEMON_SEED`.

A move that lives only in `MOVE_DATA` is unreachable. A move that's only on a Pokémon (no `MOVE_DATA` entry) defaults to inert and breaks damage calc silently.

## Items

A held item is selectable only if **either**:

1. Its name is in the internal `CHAMPIONS_ITEMS` `Set` in `src/lib/engine/items.ts` (the UI allow-list), **or**
2. The corresponding `ITEMS[...]` entry has `isMegaStone: true`.

Steps for a new item:

- Add the effect entry to `ITEMS` (any of: `damageMultiplier`, `typeDamageBoost`, `categoryBoost`, `statBoost`, `speedMultiplier`, `surviveAt1HP`, `berryHealThreshold` / `berryHealAmount`, `statusImmunity`, `recoilPercent`, `choiceLock`, `resistBerry`).
- Add the name to `CHAMPIONS_ITEMS`, **or** set `isMegaStone: true` + `forPokemon: "<name>"` where `forPokemon` resolves against `POKEMON_SEED`.

`isItemAvailable(name)` is the canonical "can the UI show this?" check.

## Abilities

- File: `src/lib/engine/ability-data.ts`.
- Add an `AbilityEffect` entry. Pick the right `category` (`weather`, `terrain`, `intimidate`, `immunity`, `redirect`, `stat-boost`, `type-boost`, `contact-punish`, `speed-control`, `defensive`, `offensive`, `disruption`, `form-change`, `utility`, `champions`).
- Add the ability to the relevant Pokémon's `abilities[]` array in `POKEMON_SEED`.
- Champions-exclusive abilities: set `isChampions: true` on the `Ability` entry inside the Pokémon (this is independent of the `champions` category in `AbilityEffect`).

## Post-change checklist

1. `npm run build` — primary verification gate (TS-level checks).
2. `npx tsc --noEmit --skipLibCheck` — full type check (Next 16 Turbopack can't do this reliably; see [build-and-verification](build-and-verification.md)).
3. Run relevant audit/validate scripts (see [scripts-and-data-ops](scripts-and-data-ops.md)):
   - Roster changes → `node scripts/audit-roster.cjs`, `npx tsx scripts/validate-stats.ts`.
   - Move changes → `npx tsx scripts/audit-engine-moves-v2.ts`, `node scripts/audit-data.cjs`.
   - Mega changes → `npx tsx scripts/audit-mega-stats.ts`, `node scripts/audit-mega-teams.ts`.
   - Sprite changes → `node scripts/audit-sprites.cjs`, `node scripts/check-sprites.mjs`.
4. Append a dated entry to `SHARED_ENTRIES` in `src/components/last-updated.tsx` — this is the in-app changelog shown to users.

## Cross-refs

- [engine-architecture](engine-architecture.md) — how the engine consumes these tables.
- [scripts-and-data-ops](scripts-and-data-ops.md) — full script catalog and conventions.
