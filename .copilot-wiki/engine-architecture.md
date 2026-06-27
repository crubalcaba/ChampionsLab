---
last-verified: 2026-06-27
verified-against:
  - src/lib/engine/index.ts
  - src/lib/engine/battle-sim.ts
  - src/lib/engine/damage-calc.ts
  - src/lib/engine/stat-calc.ts
  - src/lib/engine/ml-runner.ts
key-symbols:
  - simulateBattle
  - runSimulation
  - runTeamTestSimulation
  - calculateStats
  - calculateDamage
  - getMatchup
  - resolveMegaForm
  - runMLSimulation
---

# Engine Architecture

## TL;DR

`src/lib/engine/` is a self-contained VGC doubles simulator. **Always import from the barrel `@/lib/engine`** — `src/lib/engine/index.ts` exposes the curated public API; deep imports bypass that contract and break refactors.

The simulator is Monte-Carlo: `simulateBattle` runs one full doubles match with VGC-realistic AI, `runSimulation` averages N matches, `runTeamTestSimulation` benchmarks one team against the meta opponent pool. `runMLSimulation` (in `ml-runner.ts`) is the long-running batch that powers the meta dashboard — ~2M+ battles populate ELO, win rates, and core-pair stats.

## Module map (re-exported from the barrel)

| Module | Role |
|---|---|
| `type-chart.ts` | `getTypeEffectiveness`, `getMatchup`, defensive/offensive coverage. |
| `natures.ts` | Nature multipliers; `suggestNature`. |
| `items.ts` | `ITEMS` (effects table) + internal `CHAMPIONS_ITEMS` allow-list. |
| `move-data.ts` | `MOVE_DATA` table; `getMove`, `isSpreadMove`, `isPriorityMove`, `getEffectiveBP`. |
| `ability-data.ts` | `getAbilityEffect`, `isWeatherSetter`, `getTypeImmunity`, intimidate helpers. |
| `stat-calc.ts` | `calculateStats`, `getEffectiveSpeed`, `applyStatStage`, `getBST`, `classifyStatProfile`. |
| `speed-tiers.ts` | Speed-tier list builder + outspeed math. |
| `survival-calc.ts` | "Can X survive Y?" calculator + investment suggestions. |
| `damage-calc.ts` | `calculateDamage`, `getBestMove`, `estimateDamage`. |
| `synergy.ts` | Team-level role/archetype detection. |
| `team-generator.ts` | Procedural team builders (random, archetype-anchored, around-a-Pokémon). |
| `battle-sim.ts` | The Monte Carlo simulator. |
| `strategy-tree.ts` + `strategy-i18n*.ts` | Generates the strategic decision tree shown in the UI, with per-locale text. |
| `suggestions.ts` | Powers the Team Builder's slot-by-slot suggestion engine. |
| `generated-teams.ts` | Pre-built tournament-style teams (`PREBUILT_TEAMS`). |
| `ml-runner.ts` | Batch simulator that feeds the META dashboard. |
| `vgc-data.ts` | Real-world tournament data (`TOURNAMENT_USAGE`, `TOURNAMENT_TEAMS`, `CORE_PAIRS`, `ARCHETYPE_MATCHUPS`). |
| `picker-roles.ts` | Maps roles → candidate Pokémon for the team generator. |

## Battle flow (`battle-sim.ts`)

1. **Pre-resolve form/mega state.** `resolveMegaForm` inspects the held item — Mega Stones are identified by suffix (`...ite`, `...ite X`, `...ite Y`, `...ite Z`). X/Y/Z variants pick the matching `pokemon.forms[]` entry; the mega's base stats, types, and ability override the base on Mega Evolution.
2. **Special form constants** are hard-coded in this file: Palafin Hero/Zero, Aegislash Blade/Shield. Any future trigger-on-action form needs similar handling here.
3. **Stat resolution.** `calculateStats` (in `stat-calc.ts`) consumes `BaseStats` + `StatPoints` (66 SP per Pokémon, max 32 per stat — Champions rule) + nature + level (50 fixed).
4. **Turn loop.** AI selects move per slot using priority/speed; spread moves hit both opponents; weather/terrain/Intimidate/Trick Room/Tailwind all interact via flags on `BattlePokemon`.
5. **Grounded check** (`isGrounded`): `flying` type, `Levitate`, and the Champions-exclusive `Sky High` ability lift a mon out of terrain effects.

## Damage calc invariant

`calculateDamage` consumes `DamageCalcPokemon` + `DamageCalcTarget` + `DamageCalcOptions`. STAB, type effectiveness, weather, terrain, ability multipliers, and item multipliers are all applied here — **do not duplicate that logic in callers**. If a new ability/item affects damage, add the multiplier inside `damage-calc.ts` or via a hook in `ability-data.ts` / `items.ts`.

## Files

- `src/lib/engine/index.ts` — barrel; public API surface.
- `src/lib/engine/battle-sim.ts` — simulator.
- `src/lib/engine/battle-sim.ts.bak` — historical backup; **do not edit**.
- `src/lib/engine/{stat-calc,damage-calc,type-chart,natures,items,move-data,ability-data}.ts` — primitives.
- `src/lib/engine/{synergy,team-generator,suggestions,strategy-tree,ml-runner}.ts` — higher-level analysis.

## Cross-refs

- [data-validation-rules](data-validation-rules.md) — the data-layer wiring the engine relies on.
- [ui-conventions](ui-conventions.md) — engine output is consumed in `src/components/team-tester.tsx`, `compact-damage-calc.tsx`, `damage-calculator.tsx`.
