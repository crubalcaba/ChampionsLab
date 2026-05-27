// ═══════════════════════════════════════════════════════════════════════════════
// CHAMPIONS LAB - SURVIVAL CALCULATOR
// Tests bulk against meta threats and suggests SP investments to survive
// ═══════════════════════════════════════════════════════════════════════════════

import type { ChampionsPokemon, BaseStats, StatPoints, PokemonType } from "@/lib/types";
import { POKEMON_SEED } from "@/lib/pokemon-data";
import { USAGE_DATA } from "@/lib/usage-data";
import { calculateStats } from "./stat-calc";
import { calculateDamage, type DamageResult, type DamageCalcOptions } from "./damage-calc";
import { getTopUsagePokemon, type TournamentUsage } from "./vgc-data";
import type { NatureName } from "./natures";

export interface ThreatSet {
  pokemon: ChampionsPokemon;
  set: {
    nature: NatureName;
    ability: string;
    item: string;
    moves: string[];
    sp: StatPoints;
  };
  isMega: boolean;
}

export interface SurvivalScenario {
  threat: ThreatSet;
  moveName: string;
  damageResult: DamageResult;
  survivesMin: boolean;     // survives even worst roll
  survivesMax: boolean;     // survives even best roll
  hpPercent: [number, number]; // [min%, max%] damage
  koChanceText: string;
  is2HKO: boolean;
}

export interface SurvivalSuggestion {
  label: string;
  description: string;
  spChanges: Partial<StatPoints>;
  newSP: StatPoints;
  survives: boolean;
  type: "hp" | "def" | "spDef" | "reallocate";
}

const MAX_TOTAL_SP = 66;
const MAX_PER_STAT = 32;

/** Build a DamageCalcPokemon for the attacker (threat) */
function buildAttacker(threat: ThreatSet): {
  baseStats: BaseStats;
  sp: StatPoints;
  nature: NatureName;
  types: PokemonType[];
  ability: string;
  item: string;
} {
  const { pokemon, set, isMega } = threat;
  let baseStats = pokemon.baseStats;
  let types = [...pokemon.types] as PokemonType[];
  let ability = set.ability;

  if (isMega) {
    const megaForm = pokemon.forms?.find(f => f.isMega);
    if (megaForm) {
      baseStats = megaForm.baseStats;
      types = [...megaForm.types] as PokemonType[];
      ability = megaForm.abilities[0]?.name ?? set.ability;
    }
  }

  // Aegislash attacking uses Blade Form
  if (pokemon.name === "Aegislash" && ability === "Stance Change") {
    baseStats = { hp: 60, attack: 140, defense: 50, spAtk: 140, spDef: 50, speed: 60 };
  }

  // Palafin assumes Hero Form
  if (pokemon.name === "Palafin" && ability === "Zero To Hero") {
    baseStats = { hp: 100, attack: 160, defense: 97, spAtk: 106, spDef: 87, speed: 100 };
  }

  return {
    baseStats,
    sp: set.sp,
    nature: set.nature as NatureName,
    types,
    ability,
    item: set.item,
  };
}

/** Build a DamageCalcTarget for the defender (user) */
function buildDefender(
  baseStats: BaseStats,
  sp: StatPoints,
  nature: NatureName,
  types: PokemonType[],
  ability: string,
  item: string
): {
  baseStats: BaseStats;
  sp: StatPoints;
  nature: NatureName;
  types: PokemonType[];
  ability: string;
  item: string;
} {
  return { baseStats, sp, nature, types, ability, item };
}

/** Load a threat Pokemon with its most common set */
export function loadThreat(pokemonId: number, isMega = false): ThreatSet | null {
  const pokemon = POKEMON_SEED.find(p => p.id === pokemonId);
  if (!pokemon) return null;

  const usage = USAGE_DATA[pokemonId];
  const hasProtect = pokemon.moves.some(m => m.name === "Protect");
  const damaging = pokemon.moves.filter(m => m.category !== "status").map(m => m.name);
  const fallbackMoves: string[] = [];
  if (hasProtect) fallbackMoves.push("Protect");
  fallbackMoves.push(...damaging.slice(0, 4 - fallbackMoves.length));
  const set = usage && usage.length > 0
    ? usage[0]
    : {
        name: pokemon.name,
        nature: (pokemon.baseStats.spAtk > pokemon.baseStats.attack ? "Modest" : "Adamant") as NatureName,
        ability: pokemon.abilities[0]?.name ?? "",
        item: "Life Orb",
        moves: fallbackMoves,
        sp: { hp: 2, attack: pokemon.baseStats.spAtk > pokemon.baseStats.attack ? 0 : 32, defense: 0, spAtk: pokemon.baseStats.spAtk > pokemon.baseStats.attack ? 32 : 0, spDef: 0, speed: 32 },
      };

  return { pokemon, set: set as ThreatSet["set"], isMega };
}

/** Get top threats as TournamentUsage entries */
export function getTopThreats(limit = 30): TournamentUsage[] {
  return getTopUsagePokemon(limit);
}

/** Get damaging moves for a threat (from its loaded set) */
export function getThreatDamagingMoves(threat: ThreatSet): string[] {
  return threat.set.moves.filter(moveName => {
    const move = threat.pokemon.moves.find(m => m.name === moveName);
    return move && move.category !== "status" && (move.power ?? 0) > 0;
  });
}

/** Calculate survival scenario: how much damage does threat's move do to user? */
export function calcSurvivalScenario(
  userBaseStats: BaseStats,
  userSP: StatPoints,
  userNature: NatureName,
  userTypes: PokemonType[],
  userAbility: string,
  userItem: string,
  threat: ThreatSet,
  moveName: string,
  options: DamageCalcOptions = {}
): SurvivalScenario {
  const attacker = buildAttacker(threat);
  const defender = buildDefender(userBaseStats, userSP, userNature, userTypes, userAbility, userItem);

  const damageResult = calculateDamage(
    attacker,
    defender,
    moveName,
    { ...options, isDoubles: true, computeKOChance: true }
  );

  const userHP = calculateStats(userBaseStats, userSP, userNature).hp;
  const minDamage = damageResult.damage[0];
  const maxDamage = damageResult.damage[1];

  return {
    threat,
    moveName,
    damageResult,
    survivesMin: minDamage < userHP,
    survivesMax: maxDamage < userHP,
    hpPercent: damageResult.percentHP,
    koChanceText: damageResult.koChance?.text ?? "--",
    is2HKO: damageResult.is2HKO,
  };
}

/** Check if a given SP distribution survives the hit */
function testSurvival(
  userBaseStats: BaseStats,
  userNature: NatureName,
  userTypes: PokemonType[],
  userAbility: string,
  userItem: string,
  threat: ThreatSet,
  moveName: string,
  sp: StatPoints,
  require2HKO = false
): boolean {
  const scenario = calcSurvivalScenario(
    userBaseStats, sp, userNature, userTypes, userAbility, userItem,
    threat, moveName
  );
  if (require2HKO) {
    return scenario.is2HKO;
  }
  return scenario.survivesMax;
}

/** Find the minimal SP investment in a specific stat to survive */
function findMinStatSP(
  userBaseStats: BaseStats,
  userNature: NatureName,
  userTypes: PokemonType[],
  userAbility: string,
  userItem: string,
  currentSP: StatPoints,
  threat: ThreatSet,
  moveName: string,
  stat: "hp" | "defense" | "spDef",
  require2HKO = false
): { spNeeded: number; survives: boolean } {
  const total = Object.values(currentSP).reduce((a, b) => a + b, 0);
  const remaining = MAX_TOTAL_SP - total + currentSP[stat];
  const maxPossible = Math.min(MAX_PER_STAT, remaining);

  let low = currentSP[stat];
  let high = maxPossible;
  let best = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const testSP = { ...currentSP, [stat]: mid };
    if (testSurvival(userBaseStats, userNature, userTypes, userAbility, userItem, threat, moveName, testSP, require2HKO)) {
      best = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  if (best === -1) return { spNeeded: -1, survives: false };
  return { spNeeded: best - currentSP[stat], survives: true };
}

/** Generate survival suggestions for the user */
export function suggestSurvivalInvestments(
  userBaseStats: BaseStats,
  userSP: StatPoints,
  userNature: NatureName,
  userTypes: PokemonType[],
  userAbility: string,
  userItem: string,
  threat: ThreatSet,
  moveName: string,
  require2HKO = false
): SurvivalSuggestion[] {
  const suggestions: SurvivalSuggestion[] = [];
  const move = threat.pokemon.moves.find(m => m.name === moveName);
  const isPhysical = move?.category === "physical";
  const isSpecial = move?.category === "special";

  // 1. Invest in HP
  const hpResult = findMinStatSP(
    userBaseStats, userNature, userTypes, userAbility, userItem,
    userSP, threat, moveName, "hp", require2HKO
  );
  if (hpResult.survives && hpResult.spNeeded > 0) {
    const newSP = { ...userSP, hp: userSP.hp + hpResult.spNeeded };
    suggestions.push({
      label: `+${hpResult.spNeeded} HP`,
      description: `Invest ${hpResult.spNeeded} SP in HP to ${require2HKO ? "survive 2 hits" : "survive"}`,
      spChanges: { hp: hpResult.spNeeded },
      newSP,
      survives: true,
      type: "hp",
    });
  }

  // 2. Invest in Def (for physical moves)
  let defResult = { spNeeded: -1, survives: false };
  if (isPhysical) {
    defResult = findMinStatSP(
      userBaseStats, userNature, userTypes, userAbility, userItem,
      userSP, threat, moveName, "defense", require2HKO
    );
    if (defResult.survives && defResult.spNeeded > 0) {
      const newSP = { ...userSP, defense: userSP.defense + defResult.spNeeded };
      suggestions.push({
        label: `+${defResult.spNeeded} Def`,
        description: `Invest ${defResult.spNeeded} SP in Defense to ${require2HKO ? "survive 2 hits" : "survive"}`,
        spChanges: { defense: defResult.spNeeded },
        newSP,
        survives: true,
        type: "def",
      });
    }
  }

  // 3. Invest in SpD (for special moves)
  let spdResult = { spNeeded: -1, survives: false };
  if (isSpecial) {
    spdResult = findMinStatSP(
      userBaseStats, userNature, userTypes, userAbility, userItem,
      userSP, threat, moveName, "spDef", require2HKO
    );
    if (spdResult.survives && spdResult.spNeeded > 0) {
      const newSP = { ...userSP, spDef: userSP.spDef + spdResult.spNeeded };
      suggestions.push({
        label: `+${spdResult.spNeeded} SpD`,
        description: `Invest ${spdResult.spNeeded} SP in Sp. Def to ${require2HKO ? "survive 2 hits" : "survive"}`,
        spChanges: { spDef: spdResult.spNeeded },
        newSP,
        survives: true,
        type: "spDef",
      });
    }
  }

  // 4. Smart reallocation: shift from offensive stats
  const offensiveStats: (keyof StatPoints)[] = ["attack", "spAtk", "speed"];
  const currentTotal = Object.values(userSP).reduce((a, b) => a + b, 0);

  for (const srcStat of offensiveStats) {
    if (userSP[srcStat] <= 0) continue;

    // Try shifting to HP
    const maxShiftHp = Math.min(userSP[srcStat], MAX_TOTAL_SP - currentTotal + hpResult.spNeeded);
    for (let shift = 1; shift <= maxShiftHp && shift <= userSP[srcStat]; shift++) {
      const testSP = {
        ...userSP,
        [srcStat]: userSP[srcStat] - shift,
        hp: userSP.hp + shift,
      };
      if (testSurvival(userBaseStats, userNature, userTypes, userAbility, userItem, threat, moveName, testSP, require2HKO)) {
        suggestions.push({
          label: `Shift ${shift} SP to HP`,
          description: `Move ${shift} SP from ${srcStat} to HP`,
          spChanges: { [srcStat]: -shift, hp: shift },
          newSP: testSP,
          survives: true,
          type: "reallocate",
        });
        break; // only suggest the minimal shift
      }
    }

    // Try shifting to Def (physical)
    if (isPhysical) {
      const maxShiftDef = Math.min(userSP[srcStat], MAX_TOTAL_SP - currentTotal + (defResult.spNeeded ?? 0));
      for (let shift = 1; shift <= maxShiftDef && shift <= userSP[srcStat]; shift++) {
        const testSP = {
          ...userSP,
          [srcStat]: userSP[srcStat] - shift,
          defense: userSP.defense + shift,
        };
        if (testSurvival(userBaseStats, userNature, userTypes, userAbility, userItem, threat, moveName, testSP, require2HKO)) {
          suggestions.push({
            label: `Shift ${shift} SP to Def`,
            description: `Move ${shift} SP from ${srcStat} to Defense`,
            spChanges: { [srcStat]: -shift, defense: shift },
            newSP: testSP,
            survives: true,
            type: "reallocate",
          });
          break;
        }
      }
    }

    // Try shifting to SpD (special)
    if (isSpecial) {
      const maxShiftSpd = Math.min(userSP[srcStat], MAX_TOTAL_SP - currentTotal + (spdResult.spNeeded ?? 0));
      for (let shift = 1; shift <= maxShiftSpd && shift <= userSP[srcStat]; shift++) {
        const testSP = {
          ...userSP,
          [srcStat]: userSP[srcStat] - shift,
          spDef: userSP.spDef + shift,
        };
        if (testSurvival(userBaseStats, userNature, userTypes, userAbility, userItem, threat, moveName, testSP, require2HKO)) {
          suggestions.push({
            label: `Shift ${shift} SP to SpD`,
            description: `Move ${shift} SP from ${srcStat} to Sp. Def`,
            spChanges: { [srcStat]: -shift, spDef: shift },
            newSP: testSP,
            survives: true,
            type: "reallocate",
          });
          break;
        }
      }
    }
  }

  // Deduplicate by label
  const seen = new Set<string>();
  return suggestions.filter(s => {
    if (seen.has(s.label)) return false;
    seen.add(s.label);
    return true;
  });
}

/** Get the best offensive move the user has against the threat */
export function getBestOffensiveMove(
  userMoves: string[],
  userBaseStats: BaseStats,
  userSP: StatPoints,
  userNature: NatureName,
  userTypes: PokemonType[],
  userAbility: string,
  userItem: string,
  threat: ThreatSet
): { moveName: string; damageResult: DamageResult } | null {
  if (userMoves.length === 0) return null;

  const attacker = buildDefender(userBaseStats, userSP, userNature, userTypes, userAbility, userItem);
  const defender = buildAttacker(threat);

  let best: { moveName: string; damageResult: DamageResult } | null = null;

  for (const moveName of userMoves) {
    const move = threat.pokemon.moves.find(m => m.name === moveName);
    if (!move || move.category === "status" || (move.power ?? 0) <= 0) continue;

    const result = calculateDamage(
      {
        baseStats: attacker.baseStats,
        sp: attacker.sp,
        nature: attacker.nature,
        types: attacker.types,
        ability: attacker.ability,
        item: attacker.item,
      },
      {
        baseStats: defender.baseStats,
        sp: defender.sp,
        nature: defender.nature,
        types: defender.types,
        ability: defender.ability,
        item: defender.item,
      },
      moveName,
      { isDoubles: true, computeKOChance: true }
    );

    if (!best || result.damage[1] > best.damageResult.damage[1]) {
      best = { moveName, damageResult: result };
    }
  }

  return best;
}

/** Smart SP optimizer — finds the MINIMUM bulk needed to survive a specific hit,
 *  then maximizes offense (Speed → Attack → SpAtk) within the 66 SP cap.
 *  Non-relevant defense stat is kept at its current value.
 */
export function optimizeSPForSurvival(
  userBaseStats: BaseStats,
  userSP: StatPoints,
  userNature: NatureName,
  userTypes: PokemonType[],
  userAbility: string,
  userItem: string,
  threat: ThreatSet,
  moveName: string,
  require2HKO = false
): StatPoints | null {
  const move = threat.pokemon.moves.find(m => m.name === moveName);
  if (!move || move.category === "status") return null;

  const isPhysical = move.category === "physical";
  const otherBulkKey = isPhysical ? "spDef" : "defense";
  const otherBulkValue = userSP[otherBulkKey];
  // ── Step 1: Find minimum bulk with current offense ──
  let bestBulk: { hp: number; defense?: number; spDef?: number } | null = null;
  let bestBulkTotal = Infinity;

  for (let a = 0; a <= MAX_PER_STAT; a++) {
    for (let b = 0; b <= MAX_PER_STAT; b++) {
      const bulkTotal = a + b;
      if (bulkTotal >= bestBulkTotal) continue;

      const testSP: StatPoints = isPhysical
        ? {
            attack: userSP.attack,
            spAtk: userSP.spAtk,
            speed: userSP.speed,
            hp: a,
            defense: b,
            spDef: otherBulkValue,
          }
        : {
            attack: userSP.attack,
            spAtk: userSP.spAtk,
            speed: userSP.speed,
            hp: a,
            defense: otherBulkValue,
            spDef: b,
          };

      const total = Object.values(testSP).reduce((sum, v) => sum + v, 0);
      if (total > MAX_TOTAL_SP) continue;

      if (testSurvival(userBaseStats, userNature, userTypes, userAbility, userItem, threat, moveName, testSP, require2HKO)) {
        bestBulkTotal = bulkTotal;
        bestBulk = isPhysical
          ? { hp: a, defense: b }
          : { hp: a, spDef: b };
      }
    }
  }

  // ── Step 1b: If no valid combo with current offense, try with 0 offense ──
  if (!bestBulk) {
    for (let a = 0; a <= MAX_PER_STAT; a++) {
      for (let b = 0; b <= MAX_PER_STAT; b++) {
        const bulkTotal = a + b;
        if (bulkTotal >= bestBulkTotal) continue;

        const testSP: StatPoints = isPhysical
          ? {
              attack: 0,
              spAtk: 0,
              speed: 0,
              hp: a,
              defense: b,
              spDef: otherBulkValue,
            }
          : {
              attack: 0,
              spAtk: 0,
              speed: 0,
              hp: a,
              defense: otherBulkValue,
              spDef: b,
            };

        const total = Object.values(testSP).reduce((sum, v) => sum + v, 0);
        if (total > MAX_TOTAL_SP) continue;

        if (testSurvival(userBaseStats, userNature, userTypes, userAbility, userItem, threat, moveName, testSP, require2HKO)) {
          bestBulkTotal = bulkTotal;
          bestBulk = isPhysical
            ? { hp: a, defense: b }
            : { hp: a, spDef: b };
        }
      }
    }
  }

  if (!bestBulk) return null; // Cannot survive even with max bulk

  // ── Step 2: Build optimized SP with minimum bulk ──
  const optimized: StatPoints = {
    attack: userSP.attack,
    spAtk: userSP.spAtk,
    speed: userSP.speed,
    hp: bestBulk.hp,
    defense: isPhysical ? (bestBulk.defense ?? 0) : userSP.defense,
    spDef: isPhysical ? userSP.spDef : (bestBulk.spDef ?? 0),
  };

  // ── Step 3: Respect total SP cap ──
  let total = Object.values(optimized).reduce((sum, v) => sum + v, 0);

  if (total > MAX_TOTAL_SP) {
    // Over cap — reduce offense proportionally (Speed last to protect it)
    let excess = total - MAX_TOTAL_SP;
    for (const key of ["spAtk", "attack", "speed"] as (keyof StatPoints)[]) {
      if (excess <= 0) break;
      const remove = Math.min(excess, optimized[key]);
      optimized[key] -= remove;
      excess -= remove;
    }
  } else if (total < MAX_TOTAL_SP) {
    // Under cap — dump into offense (Speed first, then Attack, then SpAtk)
    let headroom = MAX_TOTAL_SP - total;
    for (const key of ["speed", "attack", "spAtk"] as (keyof StatPoints)[]) {
      if (headroom <= 0) break;
      const room = MAX_PER_STAT - optimized[key];
      const add = Math.min(headroom, room);
      optimized[key] += add;
      headroom -= add;
    }
  }

  return optimized;
}
