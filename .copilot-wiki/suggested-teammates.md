---
last-verified: 2026-06-27
verified-against:
  - src/lib/engine/suggestions.ts
  - src/lib/engine/synergy.ts
  - src/lib/engine/type-chart.ts
  - src/lib/engine/index.ts
  - src/app/team-builder/page.tsx
key-symbols:
  - suggestTeammates
  - scorePokemonFit
  - defensiveSynergy
  - addSuggestedTeammate
  - identifyRoles
  - analyzePartialTeam
---

# Suggested Teammates

**TL;DR.** The team-builder's left-sidebar "Suggested Teammates" card ranks roster mons by a hand-tuned synergy score against the current team. Pool = `POKEMON_SEED` filtered to `!hidden && !alreadyOnTeam && USAGE_DATA[id] exists`. Score starts at 50, ±20 from defensive type synergy, +10 for covering ≥2 team weaknesses, −10 for sharing ≥2, +15 per missing critical role filled (`speed-control` / `intimidate-user` / `support`), −10 for >2 physical-sweeper overlap, small speed/Trick-Room and tier bonuses, clamped 0–100. Click → drops into the first empty slot pre-populated with the top `suggestSets` result (with mega item/form auto-resolution).

## Wiring

| Layer | Symbol | Location |
|---|---|---|
| UI render + memo | `teammates` useMemo, render block | `src/app/team-builder/page.tsx` (~lines 773, 1701–1723) |
| UI click handler | `addSuggestedTeammate` | `src/app/team-builder/page.tsx` lines 933–962 |
| Engine public API | `suggestTeammates` | `src/lib/engine/suggestions.ts` lines 32–53 |
| Engine barrel | re-export | `src/lib/engine/index.ts` line 175 |
| Scoring core | `scorePokemonFit` | `src/lib/engine/synergy.ts` lines 654–754 |
| Role detection | `identifyRoles` | `src/lib/engine/synergy.ts` (uses `TeamRole` union, line 45) |
| Type math | `defensiveSynergy` | `src/lib/engine/type-chart.ts` lines 86–99 |
| Set selection on add | `suggestSets` | `src/lib/engine/suggestions.ts` line 64+ |

UI imports `suggestTeammates` and `TeammateSuggestion` through `@/lib/engine` (barrel rule).

## Candidate pool (`suggestTeammates`)

```ts
POKEMON_SEED
  .filter(p => !p.hidden && !usedIds.has(p.id) && USAGE_DATA[p.id]?.length)
  .map(p => scorePokemonFit(p, existingTeam))
  .sort((a, b) => b.score - a.score)
  .slice(0, count);    // default 12; UI passes 8
```

Hard filters:

1. `!p.hidden` — staging/unreleased mons excluded.
2. Not already on the team.
3. Has at least one entry in `USAGE_DATA` — guarantees the click-to-add step can apply a real competitive set.

## Scoring rubric (`scorePokemonFit`)

Starts at **50**. Empty team short-circuits to `{ score: 70, reasons: ["Strong starting pick"] }`.

| Signal | Δ | Logic |
|---|---|---|
| Defensive type synergy | ±20 | Mean of `defensiveSynergy(candidate.types, mate.types)` over existing mons × 20. `defensiveSynergy` = fraction of the two mons' combined weaknesses each other resists/is immune to (returns 1 if neither has weaknesses). ≥ 0.5 also adds "Great defensive type synergy" reason. |
| Covers team weaknesses | +10 | If candidate resists/is immune to ≥2 distinct types the team is weak to → "Covers X/Y/Z weaknesses". |
| Shares weaknesses (overlap) | −10 | If ≥2 of candidate's weaknesses are already shared by an existing mon. |
| Fills missing critical role | +15 each | Critical = `speed-control`, `intimidate-user`, `support`. Roles via `identifyRoles` (Tailwind/Icy Wind/Electroweb/Thunder Wave → speed-control; Intimidate ability; Fake Out / Helping Hand → support). |
| Physical-sweeper overlap | −10 | Candidate is `physical-sweeper` and team already has ≥2 physical sweepers. |
| Fast on slow team | +5 | `candidate.baseStats.speed ≥ 100 && avgTeamSpeed < 80`. |
| Trick Room abuser | +10 | `candidate.baseStats.speed ≤ 50` and any teammate's moves include `Trick Room`. |
| Tier prior | +3 / +5 | Tier A → +3, Tier S → +5. |

Clamped to `[0, 100]`. Returns `{ score, reasons, fills, overlaps }`; UI displays only `reasons[0]` (run through `translateReason`).

## Click → add (`addSuggestedTeammate`, lines 933–962)

1. Find first empty slot (bail if none).
2. `bestSet = suggestSets(pokemon, teamPokemon)[0]`.
3. Mega resolution: if `pokemon.hasMega` and `bestSet.item` ends with `ite | ite X | ite Y | ite Z`, set `isMega = true` and pick `megaFormIndex` by matching the form whose abilities include `bestSet.ability` (handles Charizard X/Y, Mewtwo X/Y).
4. Populate slot from `bestSet` with fallbacks: first ability, `Adamant` nature, first 4 moves, empty SP. Item only applied if `isItemAvailable` says the `CHAMPIONS_ITEMS` allow-list permits it.
5. `trackEvent("add_suggested_teammate", …)`, focuses the new slot.

## UI render gate

Card only shows when `filledSlots.length >= 1 && filledSlots.length < 6 && teammates.length > 0` (i.e. 1–5 mons on the team). Score colour: `≥70` green, `≥50` amber, else gray.

## Memoization caveat

```ts
useMemo(() => suggestTeammates(teamPokemon, 8),
  [teamPokemon.map(p => p.id).join(",")]);
```

Dependency key is the **id list only**. Editing a teammate's moves/item/ability/nature does **not** invalidate suggestions — e.g. adding Trick Room to an existing slot won't immediately favour slow candidates until the roster ids change. Same pattern is used for `teamAnalysis` and `slotSuggestion`.

## Other consumers of the same scorer

`scorePokemonFit` is shared, so weight changes ripple to:

- `src/lib/engine/team-generator.ts` (lines 300, 314, 363) — algorithmic team builds.
- `src/lib/engine/ml-runner.ts` (lines 393, 435, 487) — meta/ML runs.
- `analyzePartialTeam` in `suggestions.ts` (lines 484, 493) — bundles `suggestTeammates([], 8)` into the partial-team analysis surface.

## Cross-refs

- [engine-architecture](engine-architecture.md) — engine barrel, public API surface.
- [data-validation-rules](data-validation-rules.md) — why `USAGE_DATA` and `POKEMON_SEED` must stay in sync; orphan mons silently disappear from the suggestion pool.
- [ui-conventions](ui-conventions.md) — `@/lib/motion`, shadcn, client-component default that this card relies on.

