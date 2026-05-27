// ═══════════════════════════════════════════════════════════════════════════════
// CHAMPIONS LAB - VGC DAMAGE CALCULATOR
// Full Gen 9 damage formula adapted for Champions SP system
// Supports abilities, items, weather, terrain, crits, spread reduction
// ═══════════════════════════════════════════════════════════════════════════════

import type { PokemonType, BaseStats, StatPoints } from "@/lib/types";
import { getMatchup } from "./type-chart";
import { calculateStats, applyStatStage, type CalculatedStats } from "./stat-calc";
import { getItemDamageMultiplier, getDefenderItemMultiplier, ITEMS } from "./items";
import { getMove, isSpreadMove, type EngineMove } from "./move-data";
import { getAbilityEffect } from "./ability-data";
import type { NatureName } from "./natures";

export interface DamageCalcPokemon {
  baseStats: BaseStats;
  sp: StatPoints;
  nature: NatureName;
  types: PokemonType[];
  ability: string;
  item: string;
  atkStages?: number;
  defStages?: number;
  spAtkStages?: number;
  isBurned?: boolean;
  currentHPPercent?: number; // 0-100
}

export interface DamageCalcTarget {
  baseStats: BaseStats;
  sp: StatPoints;
  nature: NatureName;
  types: PokemonType[];
  ability: string;
  item: string;
  defStages?: number;
  spDefStages?: number;
  currentHPPercent?: number; // 0-100
}

export interface DamageCalcOptions {
  weather?: "sun" | "rain" | "sand" | "snow" | "none";
  terrain?: "electric" | "grassy" | "misty" | "psychic" | "none";
  isDoubles?: boolean;
  isCrit?: boolean;
  helpingHand?: boolean;
  lightScreen?: boolean;
  reflect?: boolean;
  auroraVeil?: boolean;
  friendGuard?: boolean;
  computeKOChance?: boolean; // expensive - only enable for UI damage calc
  targetCount?: number;      // number of targets hit (for spread reduction)
}

export interface KOChance {
  n: number;        // number of hits (1 = OHKO, 2 = 2HKO, etc.)
  chance: number;   // probability 0-1 (1.0 = guaranteed)
  text: string;     // e.g. "guaranteed OHKO", "43.8% chance to OHKO"
}

export interface ActiveModifier {
  name: string;
  multiplier: number;
}

export interface DamageResult {
  damage: [number, number];     // [min, max] damage values
  rolls: number[];              // all 16 damage rolls
  percentHP: [number, number];  // [min%, max%] of target's HP
  numHits: number;              // hits to KO (fractional for ranges)
  isOHKO: boolean;
  is2HKO: boolean;
  koChance: KOChance;           // precise KO probability
  effectiveness: number;        // type effectiveness multiplier
  moveName: string;
  effectiveType: PokemonType;    // resolved move type (after Weather Ball, -ate, etc.)
  berryActivated: boolean;       // true if defender's resist berry reduced damage
  modifiers: ActiveModifier[];   // active damage modifiers for display
}

/**
 * Compute precise KO chance from 16 damage rolls.
 * OHKO: count rolls >= HP / 16
 * 2HKO: sum over all 16×16 pairs where r1+r2 >= HP / 256
 * nHKO: iteratively convolve roll distributions
 *
 * Healing berries (Sitrus, Aguav, Oran) are modeled: after the first hit that
 * drops HP below the berry threshold, the defender heals by berryHeal HP,
 * increasing the effective HP for subsequent hits.
 */
function computeKOChance(
  rolls: number[],
  targetHP: number,
  berryThreshold?: number, // HP% threshold to activate (e.g. 50 for Sitrus)
  berryHeal?: number       // HP% restored (e.g. 25 for Sitrus)
): KOChance {
  if (rolls.length === 0 || rolls[rolls.length - 1] === 0) {
    return { n: Infinity, chance: 0, text: "--" };
  }

  const n = rolls.length; // 16
  const thresholdHP = berryThreshold ? Math.floor(targetHP * (berryThreshold / 100)) : 0;
  const healHP = berryHeal ? Math.floor(targetHP * (berryHeal / 100)) : 0;
  const hasBerry = berryThreshold && berryHeal;

  // OHKO check
  const ohkoCount = rolls.filter(r => r >= targetHP).length;
  if (ohkoCount > 0) {
    const chance = ohkoCount / n;
    return {
      n: 1,
      chance,
      text: chance === 1
        ? "guaranteed OHKO"
        : `${formatChance(chance)} chance to OHKO`,
    };
  }

  // 2HKO check (with berry modeling)
  if (hasBerry) {
    let koOutcomes = 0;
    const totalOutcomes = n * n;
    for (const r1 of rolls) {
      const remainingAfterFirst = targetHP - r1;
      // Berry activates if HP drops to or below threshold
      const effectiveTarget = remainingAfterFirst <= thresholdHP
        ? targetHP + healHP  // berry heals, need more damage
        : targetHP;
      for (const r2 of rolls) {
        if (r1 + r2 >= effectiveTarget) koOutcomes++;
      }
    }
    if (koOutcomes > 0) {
      const chance = koOutcomes / totalOutcomes;
      return {
        n: 2,
        chance,
        text: chance === 1
          ? "guaranteed 2HKO"
          : `${formatChance(chance)} chance to 2HKO`,
      };
    }
  } else {
    // Standard 2HKO without berry
    let koOutcomes = 0;
    const totalOutcomes = n * n;
    for (const r1 of rolls) {
      for (const r2 of rolls) {
        if (r1 + r2 >= targetHP) koOutcomes++;
      }
    }
    if (koOutcomes > 0) {
      const chance = koOutcomes / totalOutcomes;
      return {
        n: 2,
        chance,
        text: chance === 1
          ? "guaranteed 2HKO"
          : `${formatChance(chance)} chance to 2HKO`,
      };
    }
  }

  // nHKO (n=3,4,5,6): iterative convolution
  // For berries, we approximate by adding healHP to targetHP if the average
  // first-hit damage would trigger the berry (most berries activate early).
  const effectiveTargetHP = hasBerry && (rolls[0] >= targetHP - thresholdHP)
    ? targetHP + healHP
    : targetHP;

  let prev = new Map<number, number>();
  for (const r of rolls) {
    prev.set(r, (prev.get(r) ?? 0) + 1);
  }

  for (let hits = 3; hits <= 6; hits++) {
    const next = new Map<number, number>();
    for (const [prevDmg, prevCount] of prev) {
      for (const r of rolls) {
        const total = prevDmg + r;
        next.set(total, (next.get(total) ?? 0) + prevCount);
      }
    }
    prev = next;

    const totalOutcomes = Math.pow(n, hits);
    let koOutcomes = 0;
    for (const [dmg, count] of prev) {
      if (dmg >= effectiveTargetHP) koOutcomes += count;
    }

    if (koOutcomes > 0) {
      const chance = koOutcomes / totalOutcomes;
      const label = hits === 3 ? "3HKO" : `${hits}HKO`;
      return {
        n: hits,
        chance,
        text: chance === 1
          ? `guaranteed ${label}`
          : `${formatChance(chance)} chance to ${label}`,
      };
    }
  }

  // Fallback: estimate from average
  const avg = rolls.reduce((a, b) => a + b, 0) / n;
  const estHits = Math.ceil(effectiveTargetHP / avg);
  return { n: estHits, chance: 1, text: `${estHits}HKO` };
}

function formatChance(chance: number): string {
  const pct = chance * 100;
  // Show clean fractions for common roll counts
  if (pct === Math.round(pct)) return `${Math.round(pct)}%`;
  return `${Math.round(pct * 10) / 10}%`;
}

/** Full Gen 9 damage formula */
export function calculateDamage(
  attacker: DamageCalcPokemon,
  defender: DamageCalcTarget,
  moveName: string,
  options: DamageCalcOptions = {}
): DamageResult {
  const moveOriginal = getMove(moveName);
  if (!moveOriginal || moveOriginal.category === "status") {
    return {
      damage: [0, 0], rolls: [], percentHP: [0, 0], numHits: Infinity,
      isOHKO: false, is2HKO: false, koChance: { n: Infinity, chance: 0, text: "--" },
      effectiveness: 1, moveName,
      effectiveType: moveOriginal?.type as PokemonType ?? "normal",
      berryActivated: false,
      modifiers: [],
    };
  }

  // Liquid Voice: sound-based moves become Water-type
  const move = attacker.ability === "Liquid Voice" && moveOriginal.flags.sound
    ? { ...moveOriginal, type: "water" as PokemonType }
    : moveOriginal;

  // Permafrost Fist: punching moves become Ice-type
  const moveEffective = attacker.ability === "Permafrost Fist" && move.flags.punch
    ? { ...move, type: "ice" as PokemonType }
    : move;

  // -ate abilities: Normal-type moves become the specified type and gain 20% power
  const ATE_ABILITIES: Record<string, PokemonType> = {
    Aerilate: "flying", Pixilate: "fairy", Refrigerate: "ice",
    Galvanize: "electric", Dragonize: "dragon",
  };
  const ateType = ATE_ABILITIES[attacker.ability];
  const moveAte = ateType && moveEffective.type === "normal" && moveEffective.category !== "status"
    ? { ...moveEffective, type: ateType }
    : moveEffective;
  const ateBpBoost = ateType && moveEffective.type === "normal" && moveEffective.category !== "status";

  // Weather Ball: type and power change based on active weather
  const WEATHER_BALL_TYPE: Record<string, PokemonType> = {
    sun: "fire", rain: "water", sand: "rock", snow: "ice",
  };
  const wbWeather = attacker.ability === "Mega Sol" ? "sun" : (options.weather ?? "none");
  const moveCalc = moveAte.name === "Weather Ball" && WEATHER_BALL_TYPE[wbWeather]
    ? { ...moveAte, type: WEATHER_BALL_TYPE[wbWeather], basePower: 100 }
    : moveAte;

  // Use the type-overridden move for all subsequent calculations

  const atkStats = calculateStats(attacker.baseStats, attacker.sp, attacker.nature);
  const defStats = calculateStats(defender.baseStats, defender.sp, defender.nature);

  // Determine attacking and defending stats
  const isPhysical = moveCalc.category === "physical";
  const useDefense = isPhysical || !!moveCalc.flags.dealsPhysicalDamage; // Psyshock/Psystrike/Secret Sword target Def with SpA

  let atkStat: number;
  let defStat: number;

  if (moveCalc.name === "Body Press") {
    // Body Press uses Defense for attack
    atkStat = atkStats.defense;
  } else if (moveCalc.name === "Foul Play") {
    // Foul Play uses target's Attack
    atkStat = defStats.attack;
  } else {
    atkStat = isPhysical ? atkStats.attack : atkStats.spAtk;
  }

  // Huge Power / Pure Power: doubles Attack stat for physical moves
  if (isPhysical && (attacker.ability === "Huge Power" || attacker.ability === "Pure Power")) {
    atkStat = Math.floor(atkStat * 2);
  }

  defStat = useDefense ? defStats.defense : defStats.spDef;

  // Snow: +50% Defense for Ice types
  if (options.weather === "snow" && defender.types.includes("ice") && useDefense) {
    defStat = Math.floor(defStat * 1.5);
  }
  // Sand: +50% SpDef for Rock types
  if (options.weather === "sand" && defender.types.includes("rock") && !useDefense) {
    defStat = Math.floor(defStat * 1.5);
  }

  // Apply stat stages
  const atkStages = moveCalc.name === "Body Press"
    ? (attacker.defStages ?? 0)
    : (isPhysical ? (attacker.atkStages ?? 0) : (attacker.spAtkStages ?? 0));
  const defStages = useDefense ? (defender.defStages ?? 0) : (defender.spDefStages ?? 0);

  if (!options.isCrit || atkStages < 0) {
    atkStat = applyStatStage(atkStat, options.isCrit ? 0 : atkStages);
  } else {
    atkStat = applyStatStage(atkStat, atkStages);
  }

  if (!options.isCrit || defStages > 0) {
    defStat = applyStatStage(defStat, options.isCrit ? 0 : defStages);
  } else {
    defStat = applyStatStage(defStat, defStages);
  }

  // Bulletproof: immune to ball/bomb moves
  if (defender.ability === "Bulletproof" && moveCalc.flags.bullet) {
    return {
      damage: [0, 0], rolls: [], percentHP: [0, 0], numHits: Infinity,
      isOHKO: false, is2HKO: false, koChance: { n: Infinity, chance: 0, text: "--" },
      effectiveness: 0, moveName,
      effectiveType: moveCalc.type as PokemonType,
      berryActivated: false,
      modifiers: [],
    };
  }

  // Base power
  let bp = moveCalc.basePower;
  if (bp === 0) {
    // Weight-based moves default to 80 BP (no weight data available)
    if (moveCalc.name === "Grass Knot" || moveCalc.name === "Low Kick") {
      bp = 80;
    } else {
      // Fixed damage moves like Super Fang  -  deals 50% of target's CURRENT HP
      const currentHP = Math.floor(defStats.hp * ((defender.currentHPPercent ?? 100) / 100));
      const fixedDmg = Math.max(1, Math.floor(currentHP / 2));
      return {
        damage: [fixedDmg, fixedDmg], rolls: [fixedDmg],
        percentHP: [Math.round((fixedDmg / defStats.hp) * 100), Math.round((fixedDmg / defStats.hp) * 100)], numHits: 2,
        isOHKO: false, is2HKO: fixedDmg * 2 >= currentHP, koChance: { n: 2, chance: 1, text: "guaranteed 2HKO" },
        effectiveness: 1, moveName, effectiveType: moveCalc.type as PokemonType,
        berryActivated: false,
        modifiers: [],
      };
    }
  }

  // Eruption/Water Spout scaling
  if (moveCalc.name === "Eruption" || moveCalc.name === "Water Spout") {
    const hpPct = (attacker.currentHPPercent ?? 100) / 100;
    bp = Math.max(1, Math.floor(150 * hpPct));
  }

  // -ate ability BP boost (1.2x for Normal->type conversion)
  if (ateBpBoost) {
    bp = Math.floor(bp * 1.2);
  }

  // Knock Off boost
  if (moveCalc.name === "Knock Off" && defender.item) {
    bp = Math.floor(bp * 1.5);
  }

  // Acrobatics boost (no item)
  if (moveCalc.name === "Acrobatics" && !attacker.item) {
    bp *= 2;
  }

  // Ability power boosts
  const atkAbility = getAbilityEffect(attacker.ability);
  if (atkAbility) {
    // Technician
    if (attacker.ability === "Technician" && bp <= 60) {
      bp = Math.floor(bp * 1.5);
    }
    // Sheer Force (moves with secondary effects)
    if (attacker.ability === "Sheer Force" && moveCalc.secondary) {
      bp = Math.floor(bp * 1.3);
    }
    // Iron Fist
    if (attacker.ability === "Iron Fist" && moveCalc.flags.punch) {
      bp = Math.floor(bp * 1.2);
    }
    // Reckless
    if (attacker.ability === "Reckless" && moveCalc.flags.recoil) {
      bp = Math.floor(bp * 1.2);
    }
    // Tough Claws
    if (attacker.ability === "Tough Claws" && moveCalc.flags.contact) {
      atkStat = Math.floor(atkStat * 1.33);
    }
    // Sharpness
    if (attacker.ability === "Sharpness" && moveCalc.flags.slicing) {
      bp = Math.floor(bp * 1.5);
    }
    // Mega Launcher: pulse/aura moves get 50% boost
    if (attacker.ability === "Mega Launcher" && moveCalc.flags.pulse) {
      bp = Math.floor(bp * 1.5);
    }
    // Strong Jaw: biting moves get 50% boost
    if (attacker.ability === "Strong Jaw" && moveCalc.flags.bite) {
      bp = Math.floor(bp * 1.5);
    }
    // Permafrost Fist: punch moves get 30% boost (type already changed above)
    if (attacker.ability === "Permafrost Fist" && moveCalc.flags.punch) {
      bp = Math.floor(bp * 1.3);
    }
    // Sand Force in sand
    if (attacker.ability === "Sand Force" && options.weather === "sand" &&
        (moveCalc.type === "rock" || moveCalc.type === "ground" || moveCalc.type === "steel")) {
      bp = Math.floor(bp * 1.3);
    }
    // Fairy Aura: Fairy-type moves deal 33% more damage
    if (attacker.ability === "Fairy Aura" && moveCalc.type === "fairy") {
      bp = Math.floor(bp * 1.33);
    }
    // Solar Power in sun
    if (attacker.ability === "Solar Power" && options.weather === "sun" && !isPhysical) {
      atkStat = Math.floor(atkStat * 1.5);
    }
    // Guts when statused
    if (attacker.ability === "Guts" && attacker.isBurned) {
      atkStat = Math.floor(atkStat * 1.5);
    }
    // Blaze/Overgrow/Torrent/Swarm: 50% boost at ≤1/3 HP
    const hpPct = attacker.currentHPPercent ?? 100;
    if (attacker.ability === "Blaze" && moveCalc.type === "fire" && hpPct <= 33.3) {
      bp = Math.floor(bp * 1.5);
    }
    if (attacker.ability === "Overgrow" && moveCalc.type === "grass" && hpPct <= 33.3) {
      bp = Math.floor(bp * 1.5);
    }
    if (attacker.ability === "Torrent" && moveCalc.type === "water" && hpPct <= 33.3) {
      bp = Math.floor(bp * 1.5);
    }
    if (attacker.ability === "Swarm" && moveCalc.type === "bug" && hpPct <= 33.3) {
      bp = Math.floor(bp * 1.5);
    }
    // Analytic: 30% boost if moving last (simplified: always assume moving last)
    // In practice this is applied in battle-sim where turn order is known
  }

  // STAB (Same Type Attack Bonus)
  const isStab = attacker.types.includes(moveCalc.type);
  let stabMult = 1;
  if (isStab) {
    stabMult = attacker.ability === "Adaptability" ? 2 : 1.5;
  }
  // Protean/Libero gives STAB on everything (once per switch)
  if (attacker.ability === "Protean" || attacker.ability === "Libero") {
    stabMult = 1.5;
  }

  // Type effectiveness
  let effectiveness = getMatchup(moveCalc.type, defender.types);

  // Scrappy: Normal/Fighting moves hit Ghost types
  if (attacker.ability === "Scrappy" && effectiveness === 0 &&
      (moveCalc.type === "normal" || moveCalc.type === "fighting") &&
      defender.types.includes("ghost")) {
    effectiveness = 1;
    // Recalculate without Ghost immunity
    const nonGhostTypes = defender.types.filter(t => t !== "ghost");
    if (nonGhostTypes.length > 0) {
      effectiveness = getMatchup(moveCalc.type, nonGhostTypes);
    }
  }

  // Ability-based immunities
  const defAbility = getAbilityEffect(defender.ability);
  if (defAbility?.typeImmunity === moveCalc.type) {
    effectiveness = 0;
  }

  // Thick Fat halves Fire/Ice
  if (defender.ability === "Thick Fat" && (moveCalc.type === "fire" || moveCalc.type === "ice")) {
    effectiveness *= 0.5;
  }

  // Freeze-Dry is super effective against Water
  if (moveCalc.name === "Freeze-Dry" && defender.types.includes("water")) {
    effectiveness = defender.types.length === 1 ? 2 : effectiveness * 2;
  }

  if (effectiveness === 0) {
    return {
      damage: [0, 0], rolls: [], percentHP: [0, 0], numHits: Infinity,
      isOHKO: false, is2HKO: false, koChance: { n: Infinity, chance: 0, text: "--" },
      effectiveness: 0, moveName,
      effectiveType: moveCalc.type as PokemonType,
      berryActivated: false,
      modifiers: [],
    };
  }

  // Weather modifiers
  // Mega Sol: all moves behave as if under harsh sunlight
  const effectiveWeather = attacker.ability === "Mega Sol" ? "sun" : options.weather;
  let weatherMult = 1;
  if (effectiveWeather === "sun" && moveCalc.type === "fire") weatherMult = 1.5;
  if (effectiveWeather === "sun" && moveCalc.type === "water") weatherMult = 0.5;
  if (effectiveWeather === "rain" && moveCalc.type === "water") weatherMult = 1.5;
  if (effectiveWeather === "rain" && moveCalc.type === "fire") weatherMult = 0.5;

  // Terrain modifiers
  let terrainMult = 1;
  if (options.terrain === "electric" && moveCalc.type === "electric") terrainMult = 1.3;
  if (options.terrain === "grassy" && moveCalc.type === "grass") terrainMult = 1.3;
  if (options.terrain === "psychic" && moveCalc.type === "psychic") terrainMult = 1.3;
  if (options.terrain === "misty" && moveCalc.type === "dragon") terrainMult = 0.5;

  // Screen multipliers
  let screenMult = 1;
  if (options.auroraVeil || (options.reflect && isPhysical) || (options.lightScreen && !isPhysical)) {
    screenMult = options.isDoubles ? 2732 / 4096 : 0.5; // ~0.667 in doubles, 0.5 in singles
  }

  // Spread reduction in doubles (only when multiple targets are actually hit)
  let spreadMult = 1;
  if (options.isDoubles === true && isSpreadMove(moveCalc)) {
    // If targetCount is provided, only reduce when >1 target is hit
    // Otherwise fall back to the old behavior for backward compatibility
    if (options.targetCount !== undefined) {
      if (options.targetCount > 1) {
        spreadMult = 0.75;
      }
    } else {
      spreadMult = 0.75;
    }
  }

  // Critical hit
  const critMult = options.isCrit ? 1.5 : 1;

  // Burn (halves physical damage unless Guts or move ignores burn)
  let burnMult = 1;
  if (attacker.isBurned && isPhysical && attacker.ability !== "Guts" && !moveCalc.flags.ignoresBurn) {
    burnMult = 0.5;
  }

  // Item damage multiplier (attacker)
  const isSE = effectiveness >= 2;
  const itemMult = getItemDamageMultiplier(attacker.item, moveCalc.type, moveCalc.category, isSE);

  // Defender resist berry multiplier
  const defenderItemMult = getDefenderItemMultiplier(defender.item, moveCalc.type, effectiveness);

  // Helping Hand
  const helpingHandMult = options.helpingHand ? 1.5 : 1;

  // Friend Guard
  const friendGuardMult = options.friendGuard ? 0.75 : 1;

  // Assault Vest SpDef boost handled via stat modifiers
  if (defender.item === "Assault Vest" && !useDefense) {
    defStat = Math.floor(defStat * 1.5);
  }

  // === THE DAMAGE FORMULA ===
  // Damage = ((2*Level/5 + 2) * Power * Atk/Def) / 50 + 2) * modifiers * roll
  const baseDamage = Math.floor(
    (Math.floor((2 * 50 / 5 + 2) * bp * atkStat / defStat) / 50 + 2)
  );

  // Apply all multipliers
  const modifiers = stabMult * effectiveness * weatherMult * terrainMult * screenMult *
    spreadMult * critMult * burnMult * itemMult * helpingHandMult * friendGuardMult * defenderItemMult;

  // Check if defender resist berry activated
  const berryActivated = defenderItemMult === 0.5;

  // Random roll is 0.85 to 1.00 (16 possible values)
  const rolls: number[] = [];
  for (let i = 0; i < 16; i++) {
    rolls.push(Math.max(1, Math.floor(baseDamage * modifiers * (85 + i) / 100)));
  }

  // Parental Bond: hit twice (second hit at 25% power)
  const hasParentalBond = attacker.ability === "Parental Bond" && !isSpreadMove(moveCalc);
  if (hasParentalBond) {
    for (let i = 0; i < rolls.length; i++) {
      const secondHit = Math.max(1, Math.floor(rolls[i] * 0.25));
      rolls[i] += secondHit;
    }
  }

  const minDamage = rolls[0];
  const maxDamage = rolls[15];

  const targetHP = defStats.hp;
  const minPct = Math.round((minDamage / targetHP) * 1000) / 10;
  const maxPct = Math.round((maxDamage / targetHP) * 1000) / 10;

  // Calculate hits to KO
  const avgDamage = (minDamage + maxDamage) / 2;
  const numHits = Math.ceil(targetHP / avgDamage);

  // Healing berry support for KO chance
  const defenderItem = ITEMS[defender.item];
  const hasHealingBerry = defenderItem?.berryHealThreshold && defenderItem?.berryHealAmount;

  // Calculate precise KO probability (expensive - only for UI)
  const koChance = options.computeKOChance
    ? computeKOChance(
        rolls,
        targetHP,
        defenderItem?.berryHealThreshold,
        defenderItem?.berryHealAmount
      )
    : { n: numHits, chance: minDamage >= targetHP ? 1 : 0, text: numHits === 1 ? (minDamage >= targetHP ? "guaranteed OHKO" : `${numHits}HKO`) : `${numHits}HKO` };

  // Build active modifiers list for display
  const activeModifiers: ActiveModifier[] = [];
  if (stabMult !== 1) activeModifiers.push({ name: "STAB", multiplier: stabMult });
  if (weatherMult !== 1) activeModifiers.push({ name: "Weather", multiplier: weatherMult });
  if (terrainMult !== 1) activeModifiers.push({ name: "Terrain", multiplier: terrainMult });
  if (screenMult !== 1) activeModifiers.push({ name: options.auroraVeil ? "Aurora Veil" : isPhysical ? "Reflect" : "Light Screen", multiplier: screenMult });
  if (spreadMult !== 1) activeModifiers.push({ name: "Spread", multiplier: spreadMult });
  if (critMult !== 1) activeModifiers.push({ name: "Critical Hit", multiplier: critMult });
  if (burnMult !== 1) activeModifiers.push({ name: "Burn", multiplier: burnMult });
  if (itemMult !== 1) activeModifiers.push({ name: "Item", multiplier: itemMult });
  if (helpingHandMult !== 1) activeModifiers.push({ name: "Helping Hand", multiplier: helpingHandMult });
  if (friendGuardMult !== 1) activeModifiers.push({ name: "Friend Guard", multiplier: friendGuardMult });
  if (defenderItemMult !== 1) activeModifiers.push({ name: "Resist Berry", multiplier: defenderItemMult });
  if (hasParentalBond) activeModifiers.push({ name: "Parental Bond", multiplier: 1.25 });

  return {
    damage: [minDamage, maxDamage],
    rolls: options.computeKOChance ? rolls : [],
    percentHP: [minPct, maxPct],
    numHits,
    isOHKO: minDamage >= targetHP,
    is2HKO: minDamage * 2 >= targetHP,
    koChance,
    effectiveness,
    moveName,
    effectiveType: moveCalc.type as PokemonType,
    berryActivated,
    modifiers: activeModifiers,
  };
}

/** Calculate the best move for attacker against defender */
export function getBestMove(
  attacker: DamageCalcPokemon,
  defender: DamageCalcTarget,
  moveNames: string[],
  options: DamageCalcOptions = {}
): DamageResult {
  let best: DamageResult | null = null;
  for (const mn of moveNames) {
    const result = calculateDamage(attacker, defender, mn, options);
    if (!best || result.damage[1] > best.damage[1]) {
      best = result;
    }
  }
  return best!;
}

/** Quick damage estimate without full calc (for team gen speed) */
export function estimateDamage(
  atkBase: number,
  defBase: number,
  bp: number,
  stab: boolean,
  effectiveness: number
): number {
  const stabMult = stab ? 1.5 : 1;
  return Math.floor(
    (Math.floor((22 * bp * (atkBase + 36) / (defBase + 36)) / 50 + 2)) * stabMult * effectiveness
  );
}

/** Formatted damage string for display */
export function formatDamageResult(result: DamageResult): string {
  if (result.effectiveness === 0) return "Immune";
  const pct = `${result.percentHP[0]}% - ${result.percentHP[1]}%`;
  const hits = result.koChance?.text ?? (result.isOHKO ? "OHKO" : result.is2HKO ? "2HKO" : `${result.numHits}HKO`);
  return `${result.damage[0]}-${result.damage[1]} (${pct}) - ${hits}`;
}
