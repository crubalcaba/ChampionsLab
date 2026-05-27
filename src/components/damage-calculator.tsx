"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Swords, Search, Sun, CloudRain, Snowflake, Wind,
  Zap, Shield, ChevronDown, Flame, Droplets, ArrowRightLeft,
  HelpCircle, Sparkles, X, ChevronRight,
} from "lucide-react";
import { POKEMON_SEED } from "@/lib/pokemon-data";
import type { ChampionsPokemon, CommonSet, StatPoints, PokemonType } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import {
  calculateDamage,
  calculateStats,
  type DamageCalcPokemon,
  type DamageCalcTarget,
  type DamageCalcOptions,
  type DamageResult,
  type NatureName,
  getNatureModifier,
  getMove,
  NATURES,
} from "@/lib/engine";
import { USAGE_DATA } from "@/lib/usage-data";
import { getAllItems, ITEMS } from "@/lib/engine/items";
import { SearchSelect, type SearchSelectOption } from "@/components/search-select";
import { useI18n } from "@/lib/i18n";

// ── Types ────────────────────────────────────────────────────────────────

interface PokemonSlot {
  pokemon: ChampionsPokemon | null;
  set: CommonSet | null;
  stages: { atk: number; def: number; spAtk: number; spDef: number; speed: number };
  isBurned: boolean;
  currentHP: number; // 0-100
}

const ALL_NATURES: NatureName[] = [
  "Hardy","Lonely","Brave","Adamant","Naughty","Bold","Docile","Relaxed",
  "Impish","Lax","Timid","Hasty","Serious","Jolly","Naive","Modest",
  "Mild","Quiet","Bashful","Rash","Calm","Gentle","Sassy","Careful","Quirky",
];

const WEATHER_OPTIONS = [
  { value: "none", label: "None", icon: null },
  { value: "sun", label: "Sun", icon: Sun },
  { value: "rain", label: "Rain", icon: CloudRain },
  { value: "sand", label: "Sand", icon: Wind },
  { value: "snow", label: "Snow", icon: Snowflake },
] as const;

const TERRAIN_OPTIONS = [
  { value: "none", label: "None" },
  { value: "electric", label: "Electric" },
  { value: "grassy", label: "Grassy" },
  { value: "misty", label: "Misty" },
  { value: "psychic", label: "Psychic" },
] as const;

const STAT_KEYS = ["hp", "attack", "defense", "spAtk", "spDef", "speed"] as const;
const STAT_LABELS: Record<string, string> = {
  hp: "HP", attack: "Atk", defense: "Def", spAtk: "SpA", spDef: "SpD", speed: "Spe",
};

const TERRAIN_COLORS: Record<string, string> = {
  electric: "bg-yellow-100 text-yellow-700 border-yellow-300",
  grassy: "bg-green-100 text-green-700 border-green-300",
  misty: "bg-pink-100 text-pink-700 border-pink-300",
  psychic: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300",
};

// ── Helpers ──────────────────────────────────────────────────────────────

function isMegaStoneItem(item: string): boolean {
  return item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
}

/** Resolve mega form base stats, types, and ability for damage calc display */
function resolveMegaForCalc(p: ChampionsPokemon, set: CommonSet): {
  baseStats: ChampionsPokemon["baseStats"];
  types: PokemonType[];
  ability: string;
  sprite?: string;
  name?: string;
} {
  if (p.hasMega && p.forms && isMegaStoneItem(set.item)) {
    // Match X/Y/Z mega stone to the correct form
    let megaForm = p.forms.find(f => f.isMega);
    if (set.item.endsWith("ite X")) {
      megaForm = p.forms.find(f => f.isMega && f.name.endsWith(" X")) ?? megaForm;
    } else if (set.item.endsWith("ite Y")) {
      megaForm = p.forms.find(f => f.isMega && f.name.endsWith(" Y")) ?? megaForm;
    } else if (set.item.endsWith("ite Z")) {
      megaForm = p.forms.find(f => f.isMega && f.name.endsWith(" Z")) ?? megaForm;
    }
    if (megaForm) {
      return {
        baseStats: megaForm.baseStats,
        types: [...megaForm.types] as PokemonType[],
        ability: megaForm.abilities[0]?.name ?? set.ability,
        sprite: megaForm.sprite,
        name: megaForm.name,
      };
    }
  }
  // Palafin: Zero to Hero  -  damage calc assumes Hero Form (post-switch)
  if (p.name === "Palafin" && set.ability === "Zero To Hero") {
    return {
      baseStats: { hp: 100, attack: 160, defense: 97, spAtk: 106, spDef: 87, speed: 100 },
      types: [...p.types] as PokemonType[],
      ability: set.ability,
    };
  }
  // Aegislash: Stance Change  -  use Blade Form stats for attacking calcs
  if (p.name === "Aegislash" && set.ability === "Stance Change") {
    return {
      baseStats: { hp: 60, attack: 140, defense: 50, spAtk: 140, spDef: 50, speed: 60 },
      types: [...p.types] as PokemonType[],
      ability: set.ability,
    };
  }
  return { baseStats: p.baseStats, types: [...p.types] as PokemonType[], ability: set.ability };
}
/** Resolve form for defending (Aegislash stays in Shield Form) */
function resolveDefenderForCalc(p: ChampionsPokemon, set: CommonSet): ReturnType<typeof resolveMegaForCalc> {
  const resolved = resolveMegaForCalc(p, set);
  // Aegislash as defender uses Shield Form (high Def/SpDef)  -  override Blade stats
  if (p.name === "Aegislash" && set.ability === "Stance Change") {
    return { ...resolved, baseStats: p.baseStats };
  }
  return resolved;
}
function getDefaultSet(p: ChampionsPokemon): CommonSet {
  const usage = USAGE_DATA[p.id];
  if (usage && usage.length > 0) return usage[0];
  const isSpecial = p.baseStats.spAtk > p.baseStats.attack;
  const hasProtect = p.moves.some(m => m.name === "Protect");
  const damaging = p.moves.filter(m => m.category !== "status").map(m => m.name);
  const moves: string[] = [];
  if (hasProtect) moves.push("Protect");
  moves.push(...damaging.slice(0, 4 - moves.length));
  return {
    name: p.name,
    nature: isSpecial ? "Modest" : "Adamant",
    ability: p.abilities[0]?.name ?? "",
    item: "Life Orb",
    moves,
    sp: { hp: 2, attack: isSpecial ? 0 : 32, defense: 0, spAtk: isSpecial ? 32 : 0, spDef: 0, speed: 32 },
  };
}

function emptySlot(): PokemonSlot {
  return { pokemon: null, set: null, stages: { atk: 0, def: 0, spAtk: 0, spDef: 0, speed: 0 }, isBurned: false, currentHP: 100 };
}

interface DamageCalcL {
  ohko: string;
  nHko: (n: number) => string;
  guaranteed: string;
  chanceTo: (pct: string) => string;
  descVs: string;
  descAtk: string;
  descSpA: string;
  descDef: string;
  descSpD: string;
  descHP: string;
  descHelpingHand: string;
  descCrit: string;
  descWeather: (w: string) => string;
  descTerrain: (t: string) => string;
  tm: (name: string) => string;
  tp: (name: string) => string;
  ti: (name: string) => string;
}

function koLabel(n: number, L: DamageCalcL): string {
  return n === 1 ? L.ohko : L.nHko(n);
}

function getKOChanceText(result: DamageResult, L: DamageCalcL): string {
  if (result.damage[1] === 0) return "--";
  if (!result.koChance || result.koChance.n === Infinity) {
    if (result.percentHP[0] + result.percentHP[1] === 0) return "--";
    const hitsNeeded = Math.ceil(100 / ((result.percentHP[0] + result.percentHP[1]) / 2));
    return L.nHko(hitsNeeded);
  }
  const { n, chance } = result.koChance;
  const label = koLabel(n, L);
  if (chance === 1) return `${L.guaranteed} ${label}`;
  const pct = chance * 100;
  const pctStr = pct === Math.round(pct) ? `${Math.round(pct)}` : `${Math.round(pct * 10) / 10}`;
  return `${L.chanceTo(pctStr)} ${label}`;
}

function getKOChanceShort(result: DamageResult, L: DamageCalcL): string {
  if (result.damage[1] === 0) return "--";
  if (!result.koChance || result.koChance.n === Infinity) {
    if (result.percentHP[0] + result.percentHP[1] === 0) return "--";
    const hitsNeeded = Math.ceil(100 / ((result.percentHP[0] + result.percentHP[1]) / 2));
    return L.nHko(hitsNeeded);
  }
  return koLabel(result.koChance.n, L);
}

/** Build a Showdown-style damage calc description string */
function buildCalcDescription(
  result: DamageResult,
  atk: PokemonSlot,
  def: PokemonSlot,
  options: { weather: string; terrain: string; isCrit: boolean; helpingHand: boolean },
  L: DamageCalcL,
): string {
  const move = getMove(result.moveName);
  if (!move || !atk.pokemon || !atk.set || !def.pokemon || !def.set) return "";
  const isPhysical = move.category === "physical";
  const atkStatKey = isPhysical ? "attack" : "spAtk";
  const defStatKey = isPhysical ? "defense" : "spDef";
  const atkLabel = isPhysical ? L.descAtk : L.descSpA;
  const defLabel = isPhysical ? L.descDef : L.descSpD;
  const atkSP = atk.set.sp[atkStatKey as keyof typeof atk.set.sp];
  const defSPHP = def.set.sp.hp;
  const defSPDef = def.set.sp[defStatKey as keyof typeof def.set.sp];

  // Build attacker description
  const atkParts: string[] = [];
  if (atkSP > 0) atkParts.push(`${atkSP} ${atkLabel}`);
  if (atk.set.item) atkParts.push(L.ti(atk.set.item));
  atkParts.push(L.tp(atk.pokemon.name));
  if (options.helpingHand) atkParts.push(L.descHelpingHand);

  // Build defender description
  const defParts: string[] = [];
  const defSpParts: string[] = [];
  if (defSPHP > 0) defSpParts.push(`${defSPHP} ${L.descHP}`);
  if (defSPDef > 0) defSpParts.push(`${defSPDef} ${defLabel}`);
  if (defSpParts.length > 0) defParts.push(defSpParts.join(" / "));
  defParts.push(L.tp(def.pokemon.name));
  if (result.berryActivated && def.set?.item) {
    defParts.push(`(${def.set.item})`);
  }

  // Modifiers
  const modifiers: string[] = [];
  if (options.isCrit) modifiers.push(L.descCrit);
  if (options.weather && options.weather !== "none") modifiers.push(L.descWeather(options.weather));
  if (options.terrain && options.terrain !== "none") modifiers.push(L.descTerrain(options.terrain));

  const desc = `${atkParts.join(" ")} ${L.tm(result.moveName)} ${L.descVs} ${defParts.join(" ")}`;
  const mods = modifiers.length > 0 ? ` ${modifiers.join(", ")}` : "";
  return `${desc}${mods}: ${result.damage[0]}-${result.damage[1]} (${result.percentHP[0].toFixed(1)}% - ${result.percentHP[1].toFixed(1)}%) — ${getKOChanceText(result, L)}`;
}

function getNatureDisplay(nature: string): { plus: string | null; minus: string | null } {
  const n = NATURES[nature as NatureName];
  if (!n || !n.plus || !n.minus) return { plus: null, minus: null };
  return { plus: n.plus, minus: n.minus };
}

// ── Component ────────────────────────────────────────────────────────────

export default function DamageCalculator() {
  const { t, tp, tm, ta, ti, ts, tt } = useI18n();
  const L: DamageCalcL = useMemo(() => ({
    ohko: t('damageCalc.ohko'),
    nHko: (n: number) => t('damageCalc.nHko', { n }),
    guaranteed: t('damageCalc.guaranteed'),
    chanceTo: (pct: string) => t('damageCalc.chanceTo', { pct }),
    descVs: t('damageCalc.descVs'),
    descAtk: t('damageCalc.descAtk'),
    descSpA: t('damageCalc.descSpA'),
    descDef: t('damageCalc.descDef'),
    descSpD: t('damageCalc.descSpD'),
    descHP: t('damageCalc.descHP'),
    descHelpingHand: t('damageCalc.descHelpingHand'),
    descCrit: t('damageCalc.descCrit'),
    descWeather: (w: string) => t('damageCalc.descWeather', { weather: w }),
    descTerrain: (tr: string) => t('damageCalc.descTerrain', { terrain: tr }),
    tm, tp, ti,
  }), [t, tm, tp, ti]);
  const [attacker, setAttacker] = useState<PokemonSlot>(emptySlot());
  const [defender, setDefender] = useState<PokemonSlot>(emptySlot());
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [weather, setWeather] = useState<DamageCalcOptions["weather"]>("none");
  const [terrain, setTerrain] = useState<DamageCalcOptions["terrain"]>("none");
  const [isDoubles, setIsDoubles] = useState(true);
  const [isCrit, setIsCrit] = useState(false);
  const [helpingHand, setHelpingHand] = useState(false);
  const [lightScreen, setLightScreen] = useState(false);
  const [reflect, setReflect] = useState(false);
  const [auroraVeil, setAuroraVeil] = useState(false);
  const [friendGuard, setFriendGuard] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"attacker" | "defender" | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerTypeFilter, setPickerTypeFilter] = useState<PokemonType | null>(null);

  // Calculate stats for display (resolving mega forms)
  const attackerStats = useMemo(() => {
    if (!attacker.pokemon || !attacker.set) return null;
    const resolved = resolveMegaForCalc(attacker.pokemon, attacker.set);
    return calculateStats(resolved.baseStats, attacker.set.sp, attacker.set.nature as NatureName);
  }, [attacker.pokemon, attacker.set]);

  const defenderStats = useMemo(() => {
    if (!defender.pokemon || !defender.set) return null;
    const resolved = resolveDefenderForCalc(defender.pokemon, defender.set);
    return calculateStats(resolved.baseStats, defender.set.sp, defender.set.nature as NatureName);
  }, [defender.pokemon, defender.set]);

  // Calculate damage for all moves
  const allMoveResults = useMemo(() => {
    if (!attacker.pokemon || !attacker.set || !defender.pokemon || !defender.set) return [];
    const options: DamageCalcOptions = {
      weather, terrain, isDoubles, isCrit, helpingHand,
      lightScreen, reflect, auroraVeil, friendGuard,
      computeKOChance: true,
      // In doubles mode, spread moves always deal reduced damage (0.75x)
      // because they hit both opponents. We omit targetCount so the engine
      // applies the reduction whenever isDoubles && isSpreadMove.
    };
    const atkResolved = resolveMegaForCalc(attacker.pokemon, attacker.set);
    const defResolved = resolveDefenderForCalc(defender.pokemon, defender.set);
    const atkData: DamageCalcPokemon = {
      baseStats: atkResolved.baseStats,
      sp: attacker.set.sp,
      nature: attacker.set.nature as NatureName,
      types: atkResolved.types,
      ability: atkResolved.ability,
      item: attacker.set.item,
      atkStages: attacker.stages.atk,
      defStages: attacker.stages.def,
      spAtkStages: attacker.stages.spAtk,
      isBurned: attacker.isBurned,
      currentHPPercent: attacker.currentHP,
    };
    const defData: DamageCalcTarget = {
      baseStats: defResolved.baseStats,
      sp: defender.set.sp,
      nature: defender.set.nature as NatureName,
      types: defResolved.types,
      ability: defResolved.ability,
      item: defender.set.item,
      defStages: defender.stages.def,
      spDefStages: defender.stages.spDef,
      currentHPPercent: defender.currentHP,
    };

    return attacker.set.moves.map(moveName => {
      try {
        return calculateDamage(atkData, defData, moveName, options);
      } catch {
        return null;
      }
    }).filter(Boolean) as DamageResult[];
  }, [attacker, defender, weather, terrain, isDoubles, isCrit, helpingHand, lightScreen, reflect, auroraVeil, friendGuard]);

  // Selected move result (for detailed view)
  const selectedResult = useMemo(() => {
    if (!selectedMove) return allMoveResults[0] ?? null;
    return allMoveResults.find(r => r.moveName === selectedMove) ?? allMoveResults[0] ?? null;
  }, [allMoveResults, selectedMove]);

  // Pokemon picker
  const filteredPokemon = useMemo(() => {
    return POKEMON_SEED.filter(p => {
      if (p.hidden) return false;
      if (pickerTypeFilter && !p.types.includes(pickerTypeFilter)) return false;
      if (pickerSearch === "") return true;
      const q = pickerSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        tp(p.name).toLowerCase().includes(q) ||
        p.types.some(ty => ty.includes(q) || t(`common.types.${ty}`).toLowerCase().includes(q)) ||
        p.abilities.some(a => a.name.toLowerCase().includes(q) || ta(a.name).toLowerCase().includes(q)) ||
        p.moves.some(m => m.name.toLowerCase().includes(q) || tm(m.name).toLowerCase().includes(q))
      );
    });
  }, [pickerSearch, pickerTypeFilter, tp, tm, ta, t]);

  const selectPokemon = useCallback((p: ChampionsPokemon) => {
    const set = getDefaultSet(p);
    // In the damage calculator, start with zero SP so users can freely build
    // any test scenario. Ability/item/moves/nature still load from preset.
    const zeroSP = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
    const slot: PokemonSlot = { pokemon: p, set: { ...set, sp: zeroSP }, stages: { atk: 0, def: 0, spAtk: 0, spDef: 0, speed: 0 }, isBurned: false, currentHP: 100 };
    if (pickerTarget === "attacker") {
      setAttacker(slot);
      setSelectedMove(null);
    } else {
      setDefender(slot);
    }
    setPickerTarget(null);
    setPickerSearch("");
    setPickerTypeFilter(null);
  }, [pickerTarget]);

  const swapPokemon = () => {
    trackEvent("swap_pokemon", "damage_calc");
    const tmp = { ...attacker };
    setAttacker({ ...defender });
    setDefender(tmp);
    setSelectedMove(null);
  };

  const updateAttackerSet = (updates: Partial<CommonSet>) => {
    if (!attacker.set) return;
    setAttacker(prev => ({ ...prev, set: { ...prev.set!, ...updates } }));
  };

  const updateDefenderSet = (updates: Partial<CommonSet>) => {
    if (!defender.set) return;
    setDefender(prev => ({ ...prev, set: { ...prev.set!, ...updates } }));
  };

  const updateAttackerSP = (stat: string, value: number) => {
    if (!attacker.set) return;
    const sp = { ...attacker.set.sp, [stat]: Math.max(0, Math.min(32, value)) };
    const total = Object.values(sp).reduce((a, b) => a + b, 0);
    if (total <= 66) updateAttackerSet({ sp });
  };

  const updateDefenderSP = (stat: string, value: number) => {
    if (!defender.set) return;
    const sp = { ...defender.set.sp, [stat]: Math.max(0, Math.min(32, value)) };
    const total = Object.values(sp).reduce((a, b) => a + b, 0);
    if (total <= 66) updateDefenderSet({ sp });
  };

  // Generate 16 damage rolls
  const damageRolls = useMemo(() => {
    if (!selectedResult) return [];
    if (selectedResult.rolls && selectedResult.rolls.length > 0) return selectedResult.rolls;
    const min = selectedResult.damage[0];
    const max = selectedResult.damage[1];
    if (min === max) return [min];
    const rolls: number[] = [];
    for (let i = 0; i < 16; i++) {
      rolls.push(Math.floor(min + (max - min) * (i / 15)));
    }
    return rolls;
  }, [selectedResult]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Field Conditions Bar */}
      <div className="glass rounded-2xl p-4 border border-gray-200/60">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Weather */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">{t('damageCalc.weather')}</span>
            <div className="flex gap-1">
              {WEATHER_OPTIONS.map(w => (
                <button
                  key={w.value}
                  onClick={() => setWeather(w.value as DamageCalcOptions["weather"])}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
                    weather === w.value
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                      : "glass glass-hover text-muted-foreground"
                  )}
                >
                  {t(`common.weather.${w.value}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* Terrain */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">{t('damageCalc.terrain')}</span>
            <div className="flex gap-1">
              {TERRAIN_OPTIONS.map(tr => (
                <button
                  key={tr.value}
                  onClick={() => setTerrain(tr.value as DamageCalcOptions["terrain"])}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
                    terrain === tr.value
                      ? tr.value !== "none"
                        ? `${TERRAIN_COLORS[tr.value]} border`
                        : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                      : "glass glass-hover text-muted-foreground"
                  )}
                >
                  {t(`common.terrain.${tr.value}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* Toggles */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: t('damageCalc.doubles'), active: isDoubles, toggle: () => setIsDoubles(!isDoubles) },
              { label: t('damageCalc.crit'), active: isCrit, toggle: () => setIsCrit(!isCrit) },
              { label: t('damageCalc.helpingHand'), active: helpingHand, toggle: () => setHelpingHand(!helpingHand) },
              { label: t('damageCalc.lightScreen'), active: lightScreen, toggle: () => setLightScreen(!lightScreen) },
              { label: t('damageCalc.reflect'), active: reflect, toggle: () => setReflect(!reflect) },
              { label: t('damageCalc.auroraVeil'), active: auroraVeil, toggle: () => setAuroraVeil(!auroraVeil) },
              { label: t('damageCalc.friendGuard'), active: friendGuard, toggle: () => setFriendGuard(!friendGuard) },
            ].map(tgl => (
              <button
                key={tgl.label}
                onClick={tgl.toggle}
                className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-medium transition-all border",
                  tgl.active
                    ? "bg-violet-100 text-violet-700 border-violet-300"
                    : "glass glass-hover text-muted-foreground border-transparent"
                )}
              >
                {tgl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Attacker | Results | Defender */}
      <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        {/* ── ATTACKER PANEL ────────────────────────────────────────── */}
        <PokemonPanel
          label={t('damageCalc.attacker')}
          slot={attacker}
          stats={attackerStats}
          color="blue"
          onPickerOpen={() => setPickerTarget("attacker")}
          onSetUpdate={updateAttackerSet}
          onSPUpdate={updateAttackerSP}
          onStageChange={(stat, val) => setAttacker(prev => ({ ...prev, stages: { ...prev.stages, [stat]: val } }))}
          showAtkStages
          showDefStages
          onBurnToggle={() => setAttacker(prev => ({ ...prev, isBurned: !prev.isBurned }))}
          isBurned={attacker.isBurned}
          currentHP={attacker.currentHP}
          onHPChange={(hp) => setAttacker(prev => ({ ...prev, currentHP: hp }))}
          preferUp={allMoveResults.length === 0}
          weather={weather}
        />

        {/* ── CENTER: SWAP + RESULTS ────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 lg:pt-20">
          <button
            onClick={swapPokemon}
            className="p-3 rounded-xl glass glass-hover border border-gray-200/60 hover:border-violet-300 transition-all"
            title={t('damageCalc.swap')}
          >
            <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Compact result card */}
          {selectedResult && (
            <div className="glass rounded-2xl p-4 border border-gray-200/60 w-56 text-center">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                {tm(selectedResult.moveName)}
              </p>
              <p className={cn(
                "text-3xl font-black font-heading",
                selectedResult.percentHP[1] >= 100 ? "text-red-600" :
                selectedResult.percentHP[1] >= 50 ? "text-orange-500" :
                "text-green-600"
              )}>
                {selectedResult.percentHP[0].toFixed(1)}–{selectedResult.percentHP[1].toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedResult.damage[0]}–{selectedResult.damage[1]} {t('damageCalc.descHP')}
              </p>
              <div className={cn(
                "mt-2 px-3 py-1 rounded-lg text-[11px] font-bold inline-block",
                selectedResult.koChance?.n === 1 ? "bg-red-100 text-red-700" :
                selectedResult.koChance?.n === 2 ? "bg-orange-100 text-orange-700" :
                "bg-green-100 text-green-700"
              )}>
                {getKOChanceText(selectedResult, L)}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                {selectedResult.effectiveness === 0 ? t('damageCalc.immune') :
                 selectedResult.effectiveness < 1 ? `${t('damageCalc.notVeryEffective')} (×${selectedResult.effectiveness})` :
                 selectedResult.effectiveness > 1 ? `${t('damageCalc.superEffective')} (×${selectedResult.effectiveness})` :
                 t('damageCalc.neutralEffect')}
              </div>
              {selectedResult.berryActivated && defender.set?.item && (
                <div className="mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold inline-block bg-pink-100 text-pink-700 border border-pink-200">
                  {t('damageCalc.berryActivated', { item: defender.set.item })}
                </div>
              )}
              {selectedResult.modifiers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 justify-center">
                  {selectedResult.modifiers.map((mod, i) => (
                    <span
                      key={i}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-semibold border",
                        mod.multiplier > 1
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                      title={`${mod.name}: ×${mod.multiplier.toFixed(2)}`}
                    >
                      {mod.name} ×{mod.multiplier.toFixed(2)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── DEFENDER PANEL ────────────────────────────────────────── */}
        <PokemonPanel
          label={t('damageCalc.defender')}
          slot={defender}
          stats={defenderStats}
          color="red"
          onPickerOpen={() => setPickerTarget("defender")}
          onSetUpdate={updateDefenderSet}
          onSPUpdate={updateDefenderSP}
          onStageChange={(stat, val) => setDefender(prev => ({ ...prev, stages: { ...prev.stages, [stat]: val } }))}
          showDefStages
          preferUp={allMoveResults.length === 0}
          weather={weather}
          isDefender
        />
      </div>

      {/* ── MOVE COMPARISON TABLE ────────────────────────────────────── */}
      {allMoveResults.length > 0 && attacker.set && (
        <div className="glass rounded-2xl p-5 border border-gray-200/60">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Swords className="w-4 h-4" />
            {t('damageCalc.allMovesVs', { name: tp(defender.pokemon?.name ?? '') || t('damageCalc.defender') })}
          </h3>
          {selectedResult && (
            <button
              onClick={() => navigator.clipboard.writeText(buildCalcDescription(selectedResult, attacker, defender, { weather: weather ?? "none", terrain: terrain ?? "none", isCrit, helpingHand }, L))}
              className="w-full text-left mb-4 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group cursor-pointer"
              title={t('damageCalc.clickToCopy')}
            >
              <p className="text-[11px] font-mono text-muted-foreground leading-relaxed break-words">
                {buildCalcDescription(selectedResult, attacker, defender, { weather: weather ?? "none", terrain: terrain ?? "none", isCrit, helpingHand }, L)}
              </p>
              <p className="text-[9px] text-muted-foreground/50 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{t('damageCalc.clickToCopy')}</p>
            </button>
          )}
          <div className="space-y-1.5">
            {allMoveResults.map((r, i) => {
              const move = getMove(r.moveName);
              const isSelected = (selectedMove ?? attacker.set!.moves[0]) === r.moveName;
              const koText = (() => {
                const kc = r.koChance;
                if (!kc || kc.n === Infinity || r.damage[1] === 0) return "--";
                const label = koLabel(kc.n, L);
                if (kc.chance === 1) return label;
                return `${Math.round(kc.chance * 100)}% ${label}`;
              })();
              return (
                <button
                  key={r.moveName}
                  onClick={() => setSelectedMove(r.moveName)}
                  className={cn(
                    "w-full grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 px-3 py-2.5 rounded-xl transition-all text-left",
                    isSelected ? "bg-violet-50 border border-violet-200 shadow-sm" : "hover:bg-gray-50"
                  )}
                >
                  {/* Col 1: Type dot */}
                  {move ? (
                    <span
                      className="w-2.5 h-2.5 rounded-full row-span-2 self-center"
                      style={{ backgroundColor: TYPE_COLORS[r.effectiveType ?? move.type] }}
                    />
                  ) : <span className="w-2.5" />}

                  {/* Col 2: Move name + meta */}
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="text-sm font-semibold truncate">{tm(r.moveName)}</span>
                    {move && (
                      <span className="text-[10px] text-muted-foreground uppercase flex-shrink-0">
                        {move.category === "physical" ? t('damageCalc.catPhysical') : move.category === "special" ? t('damageCalc.catSpecial') : t('damageCalc.catStatus')}
                      </span>
                    )}
                    {move && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {move.name === "Acrobatics" && !attacker.set?.item ? "110" : (move.basePower || "—")}
                      </span>
                    )}
                  </div>

                  {/* Col 3: Stats — damage %, KO, effectiveness */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={cn(
                      "text-sm font-bold tabular-nums",
                      r.percentHP[1] >= 100 ? "text-red-600" :
                      r.percentHP[1] >= 50 ? "text-orange-500" :
                      "text-green-600"
                    )}>
                      {r.percentHP[0].toFixed(1)}–{r.percentHP[1].toFixed(1)}%
                    </span>
                    <span className={cn(
                      "text-[11px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap min-w-[3rem] text-center",
                      r.koChance?.n === 1 ? "bg-red-100 text-red-700" :
                      r.koChance?.n === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/50"
                    )}>
                      {koText}
                    </span>
                    <span className={cn(
                      "text-[11px] font-semibold w-6 text-center",
                      r.effectiveness > 1 ? "text-green-600" :
                      r.effectiveness < 1 && r.effectiveness > 0 ? "text-red-500" :
                      r.effectiveness === 0 ? "text-gray-400" :
                      "text-gray-500"
                    )}>
                      ×{r.effectiveness}
                    </span>
                    {r.berryActivated && defender.set?.item && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 border border-pink-200 whitespace-nowrap">
                        {defender.set.item}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Damage Rolls */}
          {selectedResult && damageRolls.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                {t('damageCalc.damageRolls', { move: tm(selectedResult.moveName) })}
              </p>
              <p className="text-[11px] text-muted-foreground mb-2 font-mono overflow-x-auto whitespace-nowrap">
                ({damageRolls.map((roll) => {
                  const hpTotal = defenderStats?.hp ?? 1;
                  const pct = (roll / hpTotal) * 100;
                  return `${pct.toFixed(1)}%`;
                }).join(", ")})
              </p>
              <div className="flex gap-1 flex-wrap pb-1">
                {damageRolls.map((roll, i) => {
                  const hpTotal = defenderStats?.hp ?? 1;
                  const pct = (roll / hpTotal) * 100;
                  return (
                    <span
                      key={i}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-mono",
                        pct >= 100 ? "bg-red-100 text-red-700" :
                        pct >= 50 ? "bg-orange-50 text-orange-600" :
                        "bg-gray-50 text-gray-600"
                      )}
                    >
                      {roll}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!attacker.pokemon && !defender.pokemon && (
        <div className="glass rounded-2xl p-12 border border-gray-200/60 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 flex items-center justify-center mx-auto mb-4">
            <Swords className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <p className="text-muted-foreground text-sm mb-1 font-medium">{t('damageCalc.emptyTitle')}</p>
          <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto">
            {t('damageCalc.emptyDesc')}
          </p>
        </div>
      )}

      {/* ── POKEMON PICKER MODAL ────────────────────────────────── */}
      {pickerTarget && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={() => { setPickerTarget(null); setPickerSearch(""); setPickerTypeFilter(null); }}
          />
          <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-lg sm:max-h-[70vh] glass rounded-2xl border border-gray-200/60 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200/60">
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('damageCalc.searchPlaceholder')}
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="flex-1 bg-transparent focus:outline-none text-sm"
                  autoFocus
                />
                <button onClick={() => { setPickerTarget(null); setPickerSearch(""); setPickerTypeFilter(null); }}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(Object.keys(TYPE_COLORS) as PokemonType[]).map((ty) => (
                  <button
                    key={ty}
                    onClick={() => setPickerTypeFilter(pickerTypeFilter === ty ? null : ty)}
                    className="px-2 py-1 rounded-full text-[10px] font-semibold capitalize transition-all"
                    style={{
                      backgroundColor: pickerTypeFilter === ty ? TYPE_COLORS[ty] : `${TYPE_COLORS[ty]}18`,
                      color: pickerTypeFilter === ty ? "#fff" : TYPE_COLORS[ty],
                      border: `1px solid ${pickerTypeFilter === ty ? TYPE_COLORS[ty] : `${TYPE_COLORS[ty]}40`}`,
                    }}
                  >
                    {t(`common.types.${ty}`)}
                  </button>
                ))}
              </div>
              {(pickerSearch || pickerTypeFilter) && (
                <p className="text-[10px] text-muted-foreground mt-2">{t('damageCalc.pokemonFound', { count: filteredPokemon.length })}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-2">
                {filteredPokemon.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectPokemon(p)}
                    className="flex items-center gap-2 p-3 rounded-xl glass glass-hover text-left"
                  >
                    <Image src={p.sprite} alt={tp(p.name)} width={36} height={36} unoptimized />
                    <div>
                      <p className="text-xs font-medium">{tp(p.name)}</p>
                      <div className="flex gap-1 mt-0.5">
                        {p.types.map(t => (
                          <span key={t} className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[t] }} />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// POKEMON PANEL - Attacker or Defender side
// ══════════════════════════════════════════════════════════════════════════

function PokemonPanel({
  label, slot, stats, color, onPickerOpen, onSetUpdate, onSPUpdate,
  onStageChange, showAtkStages, showDefStages, onBurnToggle, isBurned,
  currentHP, onHPChange, preferUp, weather, isDefender,
}: {
  label: string;
  slot: PokemonSlot;
  stats: ReturnType<typeof calculateStats> | null;
  color: "blue" | "red";
  onPickerOpen: () => void;
  onSetUpdate: (u: Partial<CommonSet>) => void;
  onSPUpdate: (stat: string, value: number) => void;
  onStageChange: (stat: string, val: number) => void;
  showAtkStages?: boolean;
  showDefStages?: boolean;
  onBurnToggle?: () => void;
  isBurned?: boolean;
  currentHP?: number;
  onHPChange?: (hp: number) => void;
  preferUp?: boolean;
  weather?: DamageCalcOptions["weather"];
  isDefender?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t, tp, tm, ta, ti, tn, ts, tt, tad, tid } = useI18n();
  const p = slot.pokemon;
  const set = slot.set;
  const borderColor = color === "blue" ? "border-blue-200" : "border-red-200";
  const headerBg = color === "blue" ? "from-blue-50 to-blue-100" : "from-red-50 to-red-100";
  const headerText = color === "blue" ? "text-blue-600" : "text-red-600";

  const usageSets = p ? (USAGE_DATA[p.id] ?? []) : [];
  const totalSP = set ? Object.values(set.sp).reduce((a, b) => a + b, 0) : 0;
  const natureDisplay = set ? getNatureDisplay(set.nature) : { plus: null, minus: null };
  // Resolve mega form stats for display (Aegislash: Blade for attacker, Shield for defender)
  const resolvedStats = p && set ? (isDefender ? resolveDefenderForCalc(p, set) : resolveMegaForCalc(p, set)) : null;

  return (
    <div className={cn("glass rounded-2xl border overflow-hidden", borderColor)}>
      {/* Header */}
      <div className={cn("p-4 bg-gradient-to-r", headerBg)}>
        <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", headerText)}>{label}</p>
        {p ? (
          <div className="flex items-center gap-3">
            <Image src={resolvedStats?.sprite ?? p.sprite} alt={tp(resolvedStats?.name ?? p.name)} width={56} height={56} unoptimized />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold truncate">{tp(resolvedStats?.name ?? p.name)}</p>
              <div className="flex gap-1 mt-1">
                {(resolvedStats?.types ?? p.types).map(t => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white capitalize"
                    style={{ backgroundColor: TYPE_COLORS[t] }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={onPickerOpen} className="p-2 rounded-lg glass glass-hover flex-shrink-0">
              <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button
            onClick={onPickerOpen}
            className="w-full py-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-violet-400 text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center gap-2"
          >
            <Search className="w-6 h-6" />
            <span className="text-sm font-medium">{t('damageCalc.select', { label })}</span>
          </button>
        )}
      </div>

      {/* Body */}
      {p && set && (
        <div className="p-4 space-y-4">
          {/* Set selector */}
          {usageSets.length > 1 && (
            <div>
              <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">{t('damageCalc.set')}</label>
              <select
                value={set.nature + "|" + set.ability + "|" + set.item}
                onChange={(e) => {
                  const selected = usageSets.find(s => (s.nature + "|" + s.ability + "|" + s.item) === e.target.value);
                  if (selected) onSetUpdate(selected);
                }}
                className="w-full px-3 py-2 rounded-lg glass border border-gray-200 text-xs bg-transparent focus:outline-none"
              >
                {usageSets.map((s, i) => (
                  <option key={i} value={s.nature + "|" + s.ability + "|" + s.item}>
                    {tn(s.nature)} / {ta(s.ability)} / {ti(s.item)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nature / Ability / Item row */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">{t('damageCalc.nature')}</label>
              <SearchSelect
                value={set.nature}
                onChange={(v) => onSetUpdate({ nature: v })}
                placeholder="Nature…"
                preferUp={preferUp}
                options={ALL_NATURES.map(n => {
                  const nd = getNatureDisplay(n);
                  return {
                    value: n,
                    label: tn(n),
                    sub: nd.plus ? `+${ts(nd.plus)} / −${ts(nd.minus!)}` : "Neutral",
                  };
                })}
              />
              {natureDisplay.plus && (
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  <span className="text-green-600">+{ts(natureDisplay.plus)}</span>
                  {" / "}
                  <span className="text-red-500">−{ts(natureDisplay.minus!)}</span>
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">{t('damageCalc.ability')}</label>
              <SearchSelect
                value={set.ability}
                onChange={(v) => onSetUpdate({ ability: v })}
                placeholder="Ability…"
                preferUp={preferUp}
                options={(() => {
                  const abilities = [...p.abilities];
                  // Include mega form abilities so mega sets resolve correctly
                  if (p.hasMega && p.forms) {
                    for (const form of p.forms) {
                      if (form.isMega && form.abilities) {
                        for (const a of form.abilities) {
                          if (!abilities.some(ab => ab.name === a.name)) abilities.push(a);
                        }
                      }
                    }
                  }
                  return abilities.map(a => ({ value: a.name, label: ta(a.name), sub: tad(a.name, a.description) }));
                })()}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">{t('damageCalc.item')}</label>
              <SearchSelect
                value={set.item || "(none)"}
                onChange={(v) => onSetUpdate({ item: v === "(none)" ? "" : v })}
                placeholder="Item…"
                preferUp={preferUp}
                options={[
                  { value: "(none)", label: "(none)" },
                  ...getAllItems().map(item => ({ value: item, label: ti(item), sub: tid(item, ITEMS[item]?.description ?? '') })),
                ]}
              />
            </div>
          </div>

          {/* Moves */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">{t('damageCalc.moves')}</label>
            <div className="grid grid-cols-2 gap-1.5">
              {set.moves.map((moveName, idx) => {
                const move = getMove(moveName);
                const WEATHER_BALL_MAP: Record<string, PokemonType> = { sun: "fire", rain: "water", sand: "rock", snow: "ice" };
                const wbType = move?.name === "Weather Ball" && weather && weather !== "none" ? WEATHER_BALL_MAP[weather] : null;
                const displayType = (wbType ?? move?.type ?? "normal") as PokemonType;
                return (
                  <SearchSelect
                    key={idx}
                    value={moveName}
                    onChange={(v) => {
                      const newMoves = [...set.moves];
                      newMoves[idx] = v;
                      onSetUpdate({ moves: newMoves });
                    }}
                    placeholder="Move…"
                    preferUp={preferUp}
                    triggerBadge={move ? { text: tt(displayType), color: TYPE_COLORS[displayType] } : null}
                    options={p.moves.map(m => ({
                      value: m.name,
                      label: tm(m.name),
                      sub: m.category !== "status" ? `${m.type} · ${m.category} · ${m.power} BP` : `${m.type} · status`,
                      badge: tt(m.type),
                      badgeColor: TYPE_COLORS[m.type as PokemonType],
                    }))}
                  />
                );
              })}
            </div>
          </div>

          {/* Stats + SP */}
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-2 hover:text-foreground transition-colors"
            >
              {t('damageCalc.statsSP', { used: totalSP })}
              <ChevronDown className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")} />
            </button>

            {/* Stat bars (always shown) */}
            <div className="space-y-1.5">
              {STAT_KEYS.map(stat => {
                const base = resolvedStats ? resolvedStats.baseStats[stat] : p.baseStats[stat];
                const calc = stats?.[stat] ?? 0;
                const sp = set.sp[stat];
                const natMod = stat !== "hp" ? getNatureModifier(set.nature as NatureName, stat as "attack" | "defense" | "spAtk" | "spDef" | "speed") : 1;
                return (
                  <div key={stat} className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] w-8 font-bold text-right",
                      natMod > 1 ? "text-green-600" : natMod < 1 ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {ts(stat)}
                    </span>
                    <span className="text-[10px] text-muted-foreground w-7 text-right font-mono">{base}</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          sp > 0 ? "bg-gradient-to-r from-violet-400 to-violet-600" : "bg-gray-300"
                        )}
                        style={{ width: `${Math.min(100, calc / 2.5)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono w-8 text-right font-bold">{calc}</span>
                    {expanded && (
                      <input
                        type="number"
                        value={sp}
                        onChange={(e) => onSPUpdate(stat, Number(e.target.value))}
                        min={0}
                        max={32}
                        className="w-10 px-1 py-0.5 rounded text-[10px] font-mono border border-gray-200 text-center bg-transparent focus:outline-none focus:border-violet-400"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stat stages */}
          {expanded && (showAtkStages || showDefStages) && (
            <div>
              <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">{t('damageCalc.statStages')}</label>
              <div className="grid grid-cols-3 gap-2">
                {showAtkStages && (
                  <>
                    <StageSelector label="Atk" value={slot.stages.atk} onChange={(v) => onStageChange("atk", v)} />
                    <StageSelector label="SpA" value={slot.stages.spAtk} onChange={(v) => onStageChange("spAtk", v)} />
                  </>
                )}
                {showDefStages && (
                  <>
                    <StageSelector label="Def" value={slot.stages.def} onChange={(v) => onStageChange("def", v)} />
                    <StageSelector label="SpD" value={slot.stages.spDef} onChange={(v) => onStageChange("spDef", v)} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Status / HP (attacker only) */}
          {expanded && onBurnToggle && (
            <div className="flex items-center gap-4">
              <button
                onClick={onBurnToggle}
                className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-medium border transition-all",
                  isBurned ? "bg-red-100 text-red-700 border-red-300" : "glass glass-hover text-muted-foreground border-transparent"
                )}
              >
                {t('damageCalc.burned')}
              </button>
              {onHPChange && (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[10px] font-semibold text-muted-foreground">{t('damageCalc.hpPercent')}</span>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={currentHP ?? 100}
                    onChange={(e) => onHPChange(Number(e.target.value))}
                    className="flex-1 accent-violet-500"
                  />
                  <span className="text-[10px] font-mono w-8 text-right">{currentHP}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stat Stage Selector ──────────────────────────────────────────────────

function StageSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-bold text-muted-foreground w-7">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 px-1 py-0.5 rounded text-[10px] font-mono border border-gray-200 bg-transparent focus:outline-none"
      >
        {[-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6].map(s => (
          <option key={s} value={s}>{s >= 0 ? `+${s}` : s}</option>
        ))}
      </select>
    </div>
  );
}
