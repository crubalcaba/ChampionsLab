"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  Swords, Play, Search, X, Trophy, BarChart3, Loader2,
  SkipForward, Pause, RotateCcw, ChevronRight, Trash2,
  ArrowRightLeft, FolderOpen, Save, Target, Star, Lightbulb,
  TrendingUp, TrendingDown, GitBranch, Info, Shield,
  Settings2, Minus, Plus, Sparkles, Check, Zap, Download, ClipboardPaste,
} from "lucide-react";
import { exportTeamTesterPDF, PDF_LABELS_FR, PDF_LABELS_DE } from "@/lib/export-pdf";
import { POKEMON_SEED, STAT_PRESETS } from "@/lib/pokemon-data";
import type { ChampionsPokemon, CommonSet, PokemonType, StatPoints } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import {
  runTeamTestSimulation,
  PREBUILT_TEAMS,
  NATURES,
  ITEMS,
  getAllNatures,
  getAllItems,
  isItemAvailable,
  analyzeTeamSynergy,
  identifyRoles,
  detectArchetypes,
  getSpeedTierReport,
  translateInsights,
  translateStrategyTree,
  translateInsightsES,
  translateStrategyTreeES,
  translateInsightsIT,
  translateStrategyTreeIT,
  translateInsightsDE,
  translateStrategyTreeDE,
  generateStrategyTree,
  type PrebuiltTeam,
  type TeamTestDetailedResult,
  type LeadComboResult,
  type PokemonImpact,
  type StrategyTree,
} from "@/lib/engine";
import { SearchSelect, type SearchSelectOption } from "@/components/search-select";
import {
  type DetailedBattleResult,
} from "@/lib/engine/battle-sim";
import { USAGE_DATA } from "@/lib/usage-data";
import {
  getSavedTeams, deserializeTeam,
  type SavedTeam,
} from "@/lib/storage";

// ── Helpers ──────────────────────────────────────────────────────────────

const MAX_TOTAL_POINTS = 66;
const MAX_PER_STAT = 32;
const STAT_KEYS: (keyof StatPoints)[] = ["hp", "attack", "defense", "spAtk", "spDef", "speed"];
const STAT_LABELS: Record<string, string> = { hp: "HP", attack: "Atk", defense: "Def", spAtk: "SpA", spDef: "SpD", speed: "Spe" };
const allNatureNames = getAllNatures();
const allItemNames = getAllItems();

function bestAvailableSet(p: ChampionsPokemon): CommonSet {
  const usageSet = USAGE_DATA[p.id];
  if (usageSet && usageSet.length > 0) {
    const set = { ...usageSet[0] };
    if (set.item && !isItemAvailable(set.item)) set.item = "";
    return set;
  }
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
    item: "Focus Sash",
    moves,
    sp: { hp: 2, attack: isSpecial ? 0 : 32, defense: 0, spAtk: isSpecial ? 32 : 0, spDef: 0, speed: 32 },
  };
}

interface TeamTestResult {
  wins: number;
  losses: number;
  winRate: number;
  avgTurns: number;
  totalGames: number;
  sampleBattle: DetailedBattleResult | null;
  leadCombos: LeadComboResult[];
  pokemonImpact: PokemonImpact[];
  insights: string[];
}

// ── Component ────────────────────────────────────────────────────────────

export default function TeamTester() {
  const { t, tm, ta, ti, tn, tp, ts, tt, tmd, tad, tid, locale } = useI18n();
  // Team 1
  const [team1Pokemon, setTeam1Pokemon] = useState<ChampionsPokemon[]>([]);
  const [team1Sets, setTeam1Sets] = useState<CommonSet[]>([]);
  // Team 2
  const [team2Pokemon, setTeam2Pokemon] = useState<ChampionsPokemon[]>([]);
  const [team2Sets, setTeam2Sets] = useState<CommonSet[]>([]);

  const [iterations, setIterations] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TeamTestResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedLeadIdx, setSelectedLeadIdx] = useState(0);

  // Picker
  const [pickerTarget, setPickerTarget] = useState<{ team: 1 | 2 } | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerTypeFilter, setPickerTypeFilter] = useState<PokemonType | null>(null);

  // Team loader
  const [showLoader, setShowLoader] = useState<1 | 2 | null>(null);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState("");
  // Replay
  const [replayTurn, setReplayTurn] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const replayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Pokemon detail modal
  const [detailMon, setDetailMon] = useState<{ pokemon: ChampionsPokemon; set: CommonSet; team: 1 | 2; editable?: boolean; slotIndex: number } | null>(null);

  const openPokemonDetail = useCallback((name: string, team: 1 | 2, editable = false) => {
    const pokemon = (team === 1 ? team1Pokemon : team2Pokemon);
    const sets = (team === 1 ? team1Sets : team2Sets);
    const idx = pokemon.findIndex(p => p.name === name);
    if (idx >= 0) setDetailMon({ pokemon: pokemon[idx], set: sets[idx], team, editable, slotIndex: idx });
  }, [team1Pokemon, team1Sets, team2Pokemon, team2Sets]);

  // ── Edit helpers (for editable detail modal) ──
  const updateTesterSetField = (team: 1 | 2, index: number, updates: Partial<CommonSet>) => {
    const setter = team === 1 ? setTeam1Sets : setTeam2Sets;
    setter(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const updateTesterSetMove = (team: 1 | 2, index: number, moveIndex: number, moveName: string) => {
    const setter = team === 1 ? setTeam1Sets : setTeam2Sets;
    setter(prev => prev.map((s, i) => {
      if (i !== index) return s;
      const newMoves = [...s.moves];
      newMoves[moveIndex] = moveName;
      return { ...s, moves: newMoves };
    }));
  };

  const updateTesterSetSP = (team: 1 | 2, index: number, stat: keyof StatPoints, delta: number) => {
    const setter = team === 1 ? setTeam1Sets : setTeam2Sets;
    setter(prev => prev.map((s, i) => {
      if (i !== index) return s;
      const sp = { ...s.sp };
      const currentTotal = Object.values(sp).reduce((a, b) => a + b, 0);
      const newVal = Math.max(0, Math.min(MAX_PER_STAT, sp[stat] + delta));
      const newTotal = currentTotal - sp[stat] + newVal;
      if (newTotal > MAX_TOTAL_POINTS) return s;
      sp[stat] = newVal;
      return { ...s, sp };
    }));
  };

  const setTesterSPDirect = (team: 1 | 2, index: number, stat: keyof StatPoints, value: number) => {
    const setter = team === 1 ? setTeam1Sets : setTeam2Sets;
    setter(prev => prev.map((s, i) => {
      if (i !== index) return s;
      const sp = { ...s.sp };
      const currentTotal = Object.values(sp).reduce((a, b) => a + b, 0);
      const clamped = Math.max(0, Math.min(MAX_PER_STAT, value));
      const newTotal = currentTotal - sp[stat] + clamped;
      if (newTotal > MAX_TOTAL_POINTS) return s;
      sp[stat] = clamped;
      return { ...s, sp };
    }));
  };

  // ── Battle event translation (reuse battleBot.events.* keys) ──
  const translateBattleEvent = useCallback((s: string): string => {
    if (locale === 'en') return s;
    let m;
    if ((m = s.match(/^The (harsh sunlight|rain|sandstorm|snow|hail) subsided!$/))) return t("battleBot.events.weatherSubsided", { weather: m[1] });
    if (s === "Trick Room wore off! Normal speed order restored.") return t("battleBot.events.trickRoomWoreOff");
    if ((m = s.match(/^The (\w+) terrain faded!$/))) return t("battleBot.events.terrainFaded", { terrain: m[1] });
    if ((m = s.match(/^(Your|Opponent's) Tailwind petered out!$/))) return t("battleBot.events.tailwindEnd", { side: t(`battleBot.events.${m[1] === "Your" ? "your" : "opponents"}`) });
    if ((m = s.match(/^(Your|Opponent's) Reflect wore off!$/))) return t("battleBot.events.reflectEnd", { side: t(`battleBot.events.${m[1] === "Your" ? "your" : "opponents"}`) });
    if ((m = s.match(/^(Your|Opponent's) Light Screen wore off!$/))) return t("battleBot.events.lightScreenEnd", { side: t(`battleBot.events.${m[1] === "Your" ? "your" : "opponents"}`) });
    if ((m = s.match(/^(Your|Opponent's) Aurora Veil wore off!$/))) return t("battleBot.events.auroraVeilEnd", { side: t(`battleBot.events.${m[1] === "Your" ? "your" : "opponents"}`) });
    if ((m = s.match(/^(.+) was hurt by its burn! \((\d+)%\)$/))) return t("battleBot.events.hurtByBurn", { name: tp(m[1]), pct: m[2] });
    if ((m = s.match(/^(.+) was hurt by poison! \((\d+)%\)$/))) return t("battleBot.events.hurtByPoison", { name: tp(m[1]), pct: m[2] });
    if ((m = s.match(/^(.+) restored HP with Leftovers!$/))) return t("battleBot.events.leftoversHeal", { name: tp(m[1]) });
    if ((m = s.match(/^(.+)'s Lum Berry cured its (.+)!$/))) return t("battleBot.events.lumBerryCure", { name: tp(m[1]), status: m[2] });
    if ((m = s.match(/^(.+) was buffeted by the sandstorm! \((\d+)%\)$/))) return t("battleBot.events.sandstormDmg", { name: tp(m[1]), pct: m[2] });
    if ((m = s.match(/^(.+) restored HP from Grassy Terrain!$/))) return t("battleBot.events.grassyHeal", { name: tp(m[1]) });
    if ((m = s.match(/^(.+) fainted!$/))) return t("battleBot.events.fainted", { name: tp(m[1]) });
    if ((m = s.match(/^(.+)'s (.+) set the (.+)!$/))) return t("battleBot.events.setWeather", { name: tp(m[1]), ability: ta(m[2]), weather: m[3] });
    if ((m = s.match(/^(.+)'s (.+) set (.+) terrain!$/))) return t("battleBot.events.setTerrain", { name: tp(m[1]), ability: ta(m[2]), terrain: m[3] });
    if ((m = s.match(/^(.+) transformed into (.+) using Imposter!$/))) return t("battleBot.events.imposterTransform", { name: tp(m[1]), target: tp(m[2]) });
    if ((m = s.match(/^(.+)'s Mirror Armor reflected (.+)'s Intimidate!$/))) return t("battleBot.events.mirrorArmorReflect", { opp: tp(m[1]), name: tp(m[2]) });
    if ((m = s.match(/^(.+)'s Guard Dog raised its Attack from (.+)'s Intimidate!$/))) return t("battleBot.events.guardDogRaise", { opp: tp(m[1]), name: tp(m[2]) });
    if ((m = s.match(/^(.+)'s Intimidate lowered (.+)'s Attack!$/))) return t("battleBot.events.intimidateLower", { name: tp(m[1]), opp: tp(m[2]) });
    if ((m = s.match(/^(.+)'s Competitive raised its Sp\.Atk!$/))) return t("battleBot.events.competitiveRaise", { opp: tp(m[1]) });
    if ((m = s.match(/^(.+)'s Defiant raised its Attack!$/))) return t("battleBot.events.defiantRaise", { opp: tp(m[1]) });
    if ((m = s.match(/^(.+)'s Commander Surge raised its Sp\.Atk!$/))) return t("battleBot.events.commanderSurge", { name: tp(m[1]) });
    if ((m = s.match(/^(.+)'s Razor Plating raised its Defense!$/))) return t("battleBot.events.razorPlating", { name: tp(m[1]) });
    if ((m = s.match(/^(.+) Mega Evolved!$/))) return t("battleBot.events.megaEvolved", { name: tp(m[1]) });
    if ((m = s.match(/^(.+) flinched!$/))) return t("battleBot.events.flinched", { name: tp(m[1]) });
    if ((m = s.match(/^(.+) switched out! (.+) was sent in! Palafin transformed into Hero Form!$/))) return t("battleBot.events.switchedOutPalafin", { prev: tp(m[1]), next: tp(m[2]) });
    if ((m = s.match(/^(.+) switched out! (.+) was sent in!$/))) return t("battleBot.events.switchedOut", { prev: tp(m[1]), next: tp(m[2]) });
    if ((m = s.match(/^(.+) used Sucker Punch - but it failed!$/))) return t("battleBot.events.suckerPunchFailed", { name: tp(m[1]) });
    if ((m = s.match(/^(.+) changed to Blade Forme!$/))) return t("battleBot.events.stanceChangeBlade", { name: tp(m[1]) });
    if ((m = s.match(/^(.+) changed to Shield Forme!$/))) return t("battleBot.events.stanceChangeShield", { name: tp(m[1]) });
    if ((m = s.match(/^(.+)'s Disguise was busted!$/))) return t("battleBot.events.disguiseBusted", { name: tp(m[1]) });
    if ((m = s.match(/^(.+)'s Illusion broke!$/))) return t("battleBot.events.illusionBroke", { name: tp(m[1]) });
    if ((m = s.match(/^(.+) used (.+) on (.+)! \3 was (.+)!$/))) return t("battleBot.events.usedStatusOn", { name: tp(m[1]), move: tm(m[2]), target: tp(m[3]), status: m[4] });
    if ((m = s.match(/^(.+) used (.+) on (.+) - no effect!$/))) return t("battleBot.events.usedStatusNoEffect", { name: tp(m[1]), move: tm(m[2]), target: tp(m[3]) });
    if ((m = s.match(/^(.+) used (.+) on (.+) - blocked by Protect!$/))) return t("battleBot.events.blockedByProtect", { name: tp(m[1]), move: tm(m[2]), target: tp(m[3]) });
    if ((m = s.match(/^(.+)'s King's Shield lowered (.+)'s Attack!$/))) return t("battleBot.events.kingsShieldDrop", { target: tp(m[1]), name: tp(m[2]) });
    if ((m = s.match(/^(.+) used (.+) on (.+) - KO!$/))) return t("battleBot.events.usedMoveKO", { name: tp(m[1]), move: tm(m[2]), target: tp(m[3]) });
    if ((m = s.match(/^(.+) used (.+) on (.+) \((\d+)% damage\)$/))) return t("battleBot.events.usedMoveDmg", { name: tp(m[1]), move: tm(m[2]), target: tp(m[3]), pct: m[4] });
    if ((m = s.match(/^(.+) used (.+) on (.+) - missed!$/))) return t("battleBot.events.usedMoveMissTarget", { name: tp(m[1]), move: tm(m[2]), target: tp(m[3]) });
    if ((m = s.match(/^(.+) fainted from (.+)!$/))) {
      const label = m[2] === "recoil" ? t("battleBot.events.recoil") : m[2] === "Life Orb damage" ? t("battleBot.events.lifeOrbDamage") : tm(m[2]);
      return t("battleBot.events.faintedFrom", { name: tp(m[1]), label });
    }
    if ((m = s.match(/^(.+) took (\d+)% (.+)!$/))) {
      const label = m[3] === "recoil" ? t("battleBot.events.recoil") : m[3] === "Life Orb damage" ? t("battleBot.events.lifeOrbDamage") : tm(m[3]);
      return t("battleBot.events.tookDamage", { name: tp(m[1]), pct: m[2], label });
    }
    if ((m = s.match(/^(.+) used (.+) - missed!$/))) return t("battleBot.events.usedMoveMiss", { name: tp(m[1]), move: tm(m[2]) });
    if ((m = s.match(/^(.+) used (.+) - no target$/))) return t("battleBot.events.usedMoveNoTarget", { name: tp(m[1]), move: tm(m[2]) });
    if ((m = s.match(/^(.+)'s (.+) failed!$/))) return t("battleBot.events.protectFailed", { name: tp(m[1]), move: tm(m[2]) });
    if ((m = s.match(/^(Your|Opponent's) team's Speed doubled for 4 turns!$/))) return t("battleBot.events.tailwindSet", { side: t(`battleBot.events.${m[1] === "Your" ? "your" : "opponents"}`) });
    if (s === "Slower Pokémon now move first!") return t("battleBot.events.trickRoomOn");
    if (s === "Normal speed order restored!") return t("battleBot.events.trickRoomOff");
    if ((m = s.match(/^Special damage reduced for (your|opponent's) side!$/))) return t("battleBot.events.lightScreenSet", { side: t(`battleBot.events.${m[1] === "your" ? "your" : "opponents"}`) });
    if ((m = s.match(/^Physical damage reduced for (your|opponent's) side!$/))) return t("battleBot.events.reflectSet", { side: t(`battleBot.events.${m[1] === "your" ? "your" : "opponents"}`) });
    if ((m = s.match(/^All damage reduced for (your|opponent's) side!$/))) return t("battleBot.events.auroraVeilSet", { side: t(`battleBot.events.${m[1] === "your" ? "your" : "opponents"}`) });
    if (s === "Harsh sunlight intensified!") return t("battleBot.events.weatherSun");
    if (s === "It started to rain!") return t("battleBot.events.weatherRain");
    if (s === "A sandstorm kicked up!") return t("battleBot.events.weatherSand");
    if (s === "It started to snow!") return t("battleBot.events.weatherSnow");
    if (s === "It started to hail!") return t("battleBot.events.weatherHail");
    if ((m = s.match(/^The weather changed to (.+)!$/))) return t("battleBot.events.weatherChanged", { weather: m[1] });
    if (s === "An electric current runs across the battlefield!") return t("battleBot.events.terrainElectric");
    if (s === "Grass grew to cover the battlefield!") return t("battleBot.events.terrainGrassy");
    if (s === "The battlefield got weird!") return t("battleBot.events.terrainPsychic");
    if (s === "Mist swirled around the battlefield!") return t("battleBot.events.terrainMisty");
    if ((m = s.match(/^(\w+) terrain was set!$/))) return t("battleBot.events.terrainSet", { terrain: m[1] });
    if ((m = s.match(/^(Your|Opponent's) (.+) was sent in!$/))) return t("battleBot.events.sentIn", { side: t(`battleBot.events.${m[1] === "Your" ? "your" : "opponents"}`), name: tp(m[2]) });
    if ((m = s.match(/^(.+)'s (.+)! (.+)$/))) return t("battleBot.events.weatherAbility", { name: tp(m[1]), ability: ta(m[2]), desc: m[3] });
    if ((m = s.match(/^(.+) used (.+)!$/))) return t("battleBot.events.usedMove", { name: tp(m[1]), move: tm(m[2]) });
    return s;
  }, [locale, t, tp, tm, ta]);

  useEffect(() => { setSavedTeams(getSavedTeams()); }, []);

  useEffect(() => {
    if (replayPlaying && result?.sampleBattle) {
      replayTimerRef.current = setInterval(() => {
        setReplayTurn(prev => {
          if (prev >= (result.sampleBattle?.log.length ?? 1) - 1) {
            setReplayPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => { if (replayTimerRef.current) clearInterval(replayTimerRef.current); };
  }, [replayPlaying, result?.sampleBattle]);

  const addPokemon = useCallback((pokemon: ChampionsPokemon) => {
    if (!pickerTarget) return;
    const set = bestAvailableSet(pokemon);
    if (pickerTarget.team === 1) {
      if (team1Pokemon.length < 6 && !team1Pokemon.find(p => p.id === pokemon.id)) {
        setTeam1Pokemon(prev => [...prev, pokemon]);
        setTeam1Sets(prev => [...prev, set]);
      }
    } else {
      if (team2Pokemon.length < 6 && !team2Pokemon.find(p => p.id === pokemon.id)) {
        setTeam2Pokemon(prev => [...prev, pokemon]);
        setTeam2Sets(prev => [...prev, set]);
      }
    }
  }, [pickerTarget, team1Pokemon, team2Pokemon]);

  const removePokemon = (team: 1 | 2, id: number) => {
    if (team === 1) {
      const idx = team1Pokemon.findIndex(p => p.id === id);
      if (idx >= 0) {
        setTeam1Pokemon(prev => prev.filter((_, i) => i !== idx));
        setTeam1Sets(prev => prev.filter((_, i) => i !== idx));
      }
    } else {
      const idx = team2Pokemon.findIndex(p => p.id === id);
      if (idx >= 0) {
        setTeam2Pokemon(prev => prev.filter((_, i) => i !== idx));
        setTeam2Sets(prev => prev.filter((_, i) => i !== idx));
      }
    }
  };

  const loadSavedTeam = (team: SavedTeam, target: 1 | 2) => {
    const slots = deserializeTeam(team.slots);
    const pokemon = slots.filter(s => s.pokemon).map(s => s.pokemon!);
    const sets = slots.filter(s => s.pokemon).map(s => {
      const p = s.pokemon!;
      if (s.ability && s.moves.length > 0) {
        return {
          name: p.name,
          nature: s.nature ?? "Hardy",
          ability: s.ability,
          item: s.item ?? "Life Orb",
          moves: s.moves.slice(0, 4),
          sp: s.statPoints,
          teraType: s.teraType,
          preMegaAbility: s.preMegaAbility,
        } as CommonSet;
      }
      return bestAvailableSet(p);
    });
    if (target === 1) { setTeam1Pokemon(pokemon); setTeam1Sets(sets); }
    else { setTeam2Pokemon(pokemon); setTeam2Sets(sets); }
    setShowLoader(null);
  };

  const loadPrebuiltTeam = (team: PrebuiltTeam, target: 1 | 2) => {
    const pokemon = team.pokemonIds
      .map(id => POKEMON_SEED.find(p => p.id === id))
      .filter(Boolean) as ChampionsPokemon[];
    if (target === 1) { setTeam1Pokemon(pokemon); setTeam1Sets(team.sets.slice(0, pokemon.length)); }
    else { setTeam2Pokemon(pokemon); setTeam2Sets(team.sets.slice(0, pokemon.length)); }
    setShowLoader(null);
  };

  const importFromPokepaste = (text: string, target: 1 | 2) => {
    trackEvent("import_pokepaste", "team_tester");
    setPasteError("");
    const matchName = (p: ChampionsPokemon, name: string) => {
      const c = name.toLowerCase();
      const pName = p.name.toLowerCase();
      if (pName === c || p.showdownName?.toLowerCase() === c) return true;
      const regionalSuffixes: Record<string, string> = { hisui: "Hisuian", alola: "Alolan", galar: "Galarian", paldea: "Paldean" };
      const dashIdx = c.lastIndexOf("-");
      if (dashIdx > 0) {
        const base = c.slice(0, dashIdx);
        const suffix = c.slice(dashIdx + 1);
        const prefix = regionalSuffixes[suffix];
        if (prefix && pName === `${prefix.toLowerCase()} ${base}`) return true;
      }
      // Gendered forms: "Basculegion" → "Basculegion-M", "Meowstic" → "Meowstic-M" (default = male in Showdown)
      if (pName === `${c}-m`) return true;
      return false;
    };
    const blocks = text.trim().split(/\n\n+/).filter(Boolean);
    if (blocks.length === 0) { setPasteError("No Pokémon found in the paste."); return; }
    const pokemon: ChampionsPokemon[] = [];
    const sets: CommonSet[] = [];
    for (const block of blocks.slice(0, 6)) {
      const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;
      let pokeName = lines[0];
      let item: string | undefined;
      if (pokeName.includes(" @ ")) {
        const parts = pokeName.split(" @ ");
        pokeName = parts[0].trim();
        item = parts[1].trim();
      }
      pokeName = pokeName.replace(/\s*\((?:M|F)\)\s*$/, "").trim();
      const parenMatch = pokeName.match(/\((.+?)\)/);
      if (parenMatch) pokeName = parenMatch[1].trim();
      pokeName = pokeName.replace(/^(.+)-Mega(?:-[XY])?$/i, "$1").trim();
      const mon = POKEMON_SEED.find(p => matchName(p, pokeName));
      if (!mon) continue;
      let ability: string | undefined;
      let nature: string | undefined;
      const moves: string[] = [];
      const sp: StatPoints = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
      let isNativeSP = false;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("Ability:")) ability = line.replace("Ability:", "").trim();
        else if (line.endsWith("Nature")) nature = line.replace("Nature", "").trim();
        else if (line.startsWith("- ")) moves.push(line.slice(2).trim());
        else if (line.startsWith("EVs:") || line.startsWith("Stat Points:")) {
          const isSP = line.startsWith("Stat Points:");
          const parts = line.replace(/^(?:EVs|Stat Points):/, "").trim().split("/").map(s => s.trim());
          for (const part of parts) {
            const m = part.match(/(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)/i);
            if (m) {
              const val = parseInt(m[1]), stat = m[2].toLowerCase();
              if (stat === "hp") sp.hp = val; else if (stat === "atk") sp.attack = val;
              else if (stat === "def") sp.defense = val; else if (stat === "spa") sp.spAtk = val;
              else if (stat === "spd") sp.spDef = val; else if (stat === "spe") sp.speed = val;
            }
          }
          const maxVal = Math.max(sp.hp, sp.attack, sp.defense, sp.spAtk, sp.spDef, sp.speed);
          const totalVal = sp.hp + sp.attack + sp.defense + sp.spAtk + sp.spDef + sp.speed;
          if ((isSP && maxVal <= MAX_PER_STAT) || (!isSP && maxVal <= MAX_PER_STAT && totalVal <= MAX_TOTAL_POINTS)) isNativeSP = true;
        }
      }
      // Convert Showdown EVs → stat points if needed
      let converted = sp;
      if (!isNativeSP) {
        const raw = STAT_KEYS.map(k => Math.min(MAX_PER_STAT, Math.round(sp[k] * MAX_PER_STAT / 252)));
        let total = raw.reduce((a, b) => a + b, 0);
        while (total > MAX_TOTAL_POINTS) {
          let mi = -1, mv = Infinity;
          for (let i = 0; i < raw.length; i++) { if (raw[i] > 0 && raw[i] < mv) { mv = raw[i]; mi = i; } }
          if (mi === -1) break;
          raw[mi]--; total--;
        }
        converted = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
        STAT_KEYS.forEach((k, i) => { converted[k] = raw[i]; });
      }
      pokemon.push(mon);
      sets.push({
        name: mon.name,
        nature: nature ?? "Hardy",
        ability: ability ?? mon.abilities[0]?.name ?? "",
        item: item ?? "Life Orb",
        moves: moves.length > 0 ? moves.slice(0, 4) : mon.moves.slice(0, 4).map(m => m.name),
        sp: converted,
      });
    }
    if (pokemon.length === 0) { setPasteError("Could not match any Pokémon. Check Pokepaste/Showdown format."); return; }
    if (target === 1) { setTeam1Pokemon(pokemon); setTeam1Sets(sets); }
    else { setTeam2Pokemon(pokemon); setTeam2Sets(sets); }
    setShowLoader(null);
    setPasteText("");
    setPasteError("");
  };

  const swapTeams = () => {
    const tmpPoke = [...team1Pokemon];
    const tmpSets = [...team1Sets];
    setTeam1Pokemon([...team2Pokemon]);
    setTeam1Sets([...team2Sets]);
    setTeam2Pokemon(tmpPoke);
    setTeam2Sets(tmpSets);
    setResult(null);
  };

  const canRun = team1Pokemon.length >= 4 && team2Pokemon.length >= 4 && !isRunning;

  const handleRun = useCallback(async () => {
    trackEvent("run_test", "team_tester", `${team1Pokemon.length}v${team2Pokemon.length}`, iterations);
    if (!canRun) return;
    setIsRunning(true);
    setResult(null);
    setProgress(0);
    setSelectedLeadIdx(0);
    setReplayTurn(0);
    setReplayPlaying(false);

    // Scroll loading bar into view
    await new Promise(r => setTimeout(r, 50));
    progressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

    // Start a fake smooth progress animation (sim is synchronous, blocks UI)
    setProgress(5);
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + (90 - prev) * 0.08;
      });
    }, 80);

    // Yield to let the interval and initial render happen
    await new Promise(r => setTimeout(r, 60));

    const simResult = runTeamTestSimulation(
      team1Pokemon, team1Sets, team2Pokemon, team2Sets, iterations
    );

    clearInterval(progressInterval);
    setProgress(100);

    setResult({
      wins: simResult.wins,
      losses: simResult.losses,
      winRate: simResult.winRate,
      avgTurns: simResult.avgTurns,
      totalGames: simResult.totalGames,
      sampleBattle: simResult.sampleBattle,
      leadCombos: simResult.leadCombos,
      pokemonImpact: simResult.pokemonImpact,
      insights: simResult.insights,
    });
    setIsRunning(false);

    // Scroll results into view (offset for navbar)
    await new Promise(r => setTimeout(r, 100));
    if (resultsRef.current) {
      const top = resultsRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [canRun, team1Pokemon, team1Sets, team2Pokemon, team2Sets, iterations]);

  const filteredPokemon = useMemo(() => {
    if (!pickerTarget) return [];
    const existingIds = pickerTarget.team === 1
      ? team1Pokemon.map(p => p.id)
      : team2Pokemon.map(p => p.id);
    return POKEMON_SEED.filter(p => {
      if (p.hidden) return false;
      if (existingIds.includes(p.id)) return false;
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
  }, [pickerTarget, pickerSearch, pickerTypeFilter, team1Pokemon, team2Pokemon, tp, tm, ta, t]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Two teams side by side */}
      <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        {/* Team 1 */}
        <TeamPanel
          label={t('teamTester.team1')}
          color="blue"
          pokemon={team1Pokemon}
          sets={team1Sets}
          onPickerOpen={() => setPickerTarget({ team: 1 })}
          onRemove={(id) => removePokemon(1, id)}
          onClear={() => { setTeam1Pokemon([]); setTeam1Sets([]); setResult(null); }}
          onLoadTeam={() => setShowLoader(1)}
          onPokemonClick={(name) => openPokemonDetail(name, 1, true)}
        />

        {/* Center controls */}
        <div className="flex flex-col items-center gap-4 lg:pt-20">
          <button
            onClick={swapTeams}
            className="p-3 rounded-xl glass glass-hover border border-gray-200/60 hover:border-violet-300 transition-all"
            title="Swap teams"
          >
            <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="text-center text-3xl font-black font-heading text-muted-foreground/30">VS</div>
        </div>

        {/* Team 2 */}
        <TeamPanel
          label={t('teamTester.team2')}
          color="red"
          pokemon={team2Pokemon}
          sets={team2Sets}
          onPickerOpen={() => setPickerTarget({ team: 2 })}
          onRemove={(id) => removePokemon(2, id)}
          onClear={() => { setTeam2Pokemon([]); setTeam2Sets([]); setResult(null); }}
          onLoadTeam={() => setShowLoader(2)}
          onPokemonClick={(name) => openPokemonDetail(name, 2, true)}
        />
      </div>

      {/* Simulation Controls */}
      <div className="glass rounded-2xl p-5 border border-gray-200/60">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{t('teamTester.battles')}</span>
            <div className="flex gap-1.5">
              {[500, 1000, 1500, 2000, 2500].map(n => (
                <button
                  key={n}
                  onClick={() => setIterations(n)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                    iterations === n
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm"
                      : "glass glass-hover text-muted-foreground"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1" />

          <button
            onClick={handleRun}
            disabled={!canRun}
            className={cn(
              "px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
              isRunning
                ? "bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 text-white shadow-lg shadow-orange-400/30 cursor-wait"
                : canRun
                  ? "bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white hover:from-red-600 hover:via-orange-600 hover:to-amber-600 shadow-lg shadow-red-500/20"
                  : "bg-gray-100 dark:bg-white/5 text-muted-foreground cursor-not-allowed"
            )}
          >
            {isRunning ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('teamTester.battling')}</>
            ) : (
              <><Swords className="w-4 h-4" /> {t('teamTester.runBattles', { n: iterations })}</>
            )}
          </button>
        </div>

        {!canRun && !isRunning && (team1Pokemon.length < 4 || team2Pokemon.length < 4) && (
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            {t('teamTester.needPokemon')}
          </p>
        )}
      </div>

      {/* Progress */}
      {isRunning && (
        <div ref={progressRef} className="glass rounded-2xl p-6 border border-gray-200/60">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 flex-shrink-0">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-red-300"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                <Swords className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t('teamTester.runningSimulation', { n: iterations })}</p>
              <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full w-1/3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                  style={{ animation: "progress-slide 1.2s ease-in-out infinite" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !isRunning && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Hero Stats */}
            <div className="glass rounded-2xl p-6 border border-gray-200/60">
              <div className="flex items-center gap-8 justify-center">
                {/* Team 1 side */}
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase text-blue-600 mb-1">{t('teamTester.team1')}</p>
                  <div className="flex gap-1 justify-center mb-2">
                    {team1Pokemon.slice(0, 4).map(p => (
                      <Image key={p.id} src={p.sprite} alt={p.name} width={28} height={28} unoptimized />
                    ))}
                  </div>
                  <p className={cn(
                    "text-4xl font-black font-heading",
                    result.winRate >= 50
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent"
                      : "bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent"
                  )}>
                    {result.winRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">{t('teamTester.winsLosses', { wins: result.wins, losses: result.losses })}</p>
                </div>

                {/* VS */}
                <div className="text-center">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg",
                    result.winRate >= 55 ? "bg-gradient-to-br from-green-400 to-emerald-600 text-white" :
                    result.winRate <= 45 ? "bg-gradient-to-br from-red-400 to-red-600 text-white" :
                    "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
                  )}>
                    {t('teamTester.vs')}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{t('teamTester.nBattles', { n: iterations })}</p>
                  <p className="text-[10px] text-muted-foreground">{t('teamTester.turnsAvg', { n: result.avgTurns })}</p>
                </div>

                {/* Team 2 side */}
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase text-red-600 mb-1">{t('teamTester.team2')}</p>
                  <div className="flex gap-1 justify-center mb-2">
                    {team2Pokemon.slice(0, 4).map(p => (
                      <Image key={p.id} src={p.sprite} alt={p.name} width={28} height={28} unoptimized />
                    ))}
                  </div>
                  <p className={cn(
                    "text-4xl font-black font-heading",
                    result.winRate <= 50
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent"
                      : "bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent"
                  )}>
                    {(100 - result.winRate).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{t('teamTester.winsLosses', { wins: result.losses, losses: result.wins })}</p>
                </div>
              </div>

              {/* Win bar */}
              <div className="mt-5 relative">
                <div className="h-4 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.winRate}%` }}
                    transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                  />
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-400 to-red-500 flex-1"
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - result.winRate}%` }}
                    transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white drop-shadow-sm">
                    {result.winRate}% - {(100 - result.winRate).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Verdict */}
              <div className={cn(
                "mt-4 p-3 rounded-xl text-center text-sm font-bold",
                result.winRate > 55 ? "bg-blue-50 text-blue-700 border border-blue-200" :
                result.winRate < 45 ? "bg-red-50 text-red-700 border border-red-200" :
                "bg-yellow-50 text-yellow-700 border border-yellow-200"
              )}>
                {result.winRate > 60 ? t('teamTester.verdictDominate1') :
                 result.winRate > 55 ? t('teamTester.verdictClear1') :
                 result.winRate > 52 ? t('teamTester.verdictSlight1') :
                 result.winRate > 48 ? t('teamTester.verdictEven') :
                 result.winRate > 45 ? t('teamTester.verdictSlight2') :
                 result.winRate > 40 ? t('teamTester.verdictClear2') :
                 t('teamTester.verdictDominate2')}
              </div>

              {/* Export PDF */}
              <div className="mt-3 flex justify-center">
                <button
                  onClick={() => {
                    trackEvent("export_pdf", "team_tester");
                    // Build strategy overview from tree
                    const bestLead = result.leadCombos[0];
                    const rawTree = bestLead ? generateStrategyTree(team1Pokemon, team1Sets, team2Pokemon, team2Sets, bestLead, result.winRate) : null;
                    const tree = rawTree && locale === 'fr' ? translateStrategyTree(rawTree, tm, ta) : rawTree && locale === 'es' ? translateStrategyTreeES(rawTree, tm, ta) : rawTree && locale === 'it' ? translateStrategyTreeIT(rawTree, tm, ta) : rawTree && locale === 'de' ? translateStrategyTreeDE(rawTree, tm, ta) : rawTree;
                    let strategyData: Parameters<typeof exportTeamTesterPDF>[0]["strategy"] = null;
                    if (tree) {
                      // Flatten the first scenario's nodes into linear steps
                      const flatSteps: { label: string; detail?: string; severity?: "good" | "neutral" | "bad" }[] = [];
                      const flatten = (node: StrategyNodeData) => {
                        if (node.type !== "start" && node.type !== "opponent-lead") {
                          flatSteps.push({ label: (node.branchLabel ? node.branchLabel + ": " : "") + node.label, detail: node.detail, severity: node.severity });
                        }
                        for (const child of node.children) flatten(child);
                      };
                      const firstScenario = tree.root.children[0];
                      if (firstScenario) {
                        flatSteps.push({ label: `vs ${firstScenario.label}`, detail: firstScenario.detail, severity: "neutral" });
                        for (const child of firstScenario.children) flatten(child);
                      }
                      strategyData = {
                        archetype: tree.archetype,
                        winCondition: tree.winCondition,
                        keyThreats: tree.keyThreats,
                        backupPlan: tree.backupPlan,
                        steps: flatSteps,
                      };
                    }
                    // Build extended analysis data
                    const syn1 = analyzeTeamSynergy(team1Pokemon);
                    const syn2 = analyzeTeamSynergy(team2Pokemon);
                    const speed1 = getSpeedTierReport(team1Pokemon);
                    const speed2 = getSpeedTierReport(team2Pokemon);
                    const roles1 = team1Pokemon.map(p => { const r = identifyRoles(p); return { name: p.name, primaryRole: r.primaryRole, roles: r.roles }; });
                    const roles2 = team2Pokemon.map(p => { const r = identifyRoles(p); return { name: p.name, primaryRole: r.primaryRole, roles: r.roles }; });
                    const arch1 = detectArchetypes(team1Pokemon).filter(a => a.confidence >= 0.3).map(a => ({ archetype: a.archetype, confidence: a.confidence, keyPokemon: a.keyPokemon }));
                    const arch2 = detectArchetypes(team2Pokemon).filter(a => a.confidence >= 0.3).map(a => ({ archetype: a.archetype, confidence: a.confidence, keyPokemon: a.keyPokemon }));

                    exportTeamTesterPDF({
                      team1: team1Pokemon.map((p, i) => ({
                        name: tp(p.name),
                        ability: ta(String(team1Sets[i]?.ability || p.abilities?.[0] || "")),
                        item: ti(team1Sets[i]?.item || ""),
                        moves: (team1Sets[i]?.moves || []).map(m => tm(m)),
                      })),
                      team2: team2Pokemon.map((p, i) => ({
                        name: tp(p.name),
                        ability: ta(String(team2Sets[i]?.ability || p.abilities?.[0] || "")),
                        item: ti(team2Sets[i]?.item || ""),
                        moves: (team2Sets[i]?.moves || []).map(m => tm(m)),
                      })),
                      wins: result.wins,
                      losses: result.losses,
                      winRate: result.winRate,
                      avgTurns: result.avgTurns,
                      totalGames: result.totalGames,
                      leadCombos: result.leadCombos.map(lc => ({ lead1: lc.lead1, lead2: lc.lead2, winRate: lc.winRate, games: lc.games })),
                      pokemonImpact: result.pokemonImpact.map(pi => ({ name: pi.name, impact: pi.impact, excludeWinRate: pi.excludeWinRate })),
                      insights: locale === 'fr' ? translateInsights(result.insights, tm) : locale === 'es' ? translateInsightsES(result.insights, tm) : locale === 'it' ? translateInsightsIT(result.insights, tm) : locale === 'de' ? translateInsightsDE(result.insights, tm) : result.insights,
                      strategy: strategyData,
                      speedTiers: { team1: speed1, team2: speed2 },
                      typeProfile: {
                        team1: {
                          weaknesses: syn1.weaknessProfile.map(w => ({ type: w.type, count: w.count })),
                          resistances: syn1.resistanceProfile.map(r => ({ type: r.type, count: r.count })),
                          uncovered: syn1.uncoveredTypes,
                        },
                        team2: {
                          weaknesses: syn2.weaknessProfile.map(w => ({ type: w.type, count: w.count })),
                          resistances: syn2.resistanceProfile.map(r => ({ type: r.type, count: r.count })),
                          uncovered: syn2.uncoveredTypes,
                        },
                      },
                      roles: { team1: roles1, team2: roles2 },
                      archetypes: { team1: arch1, team2: arch2 },
                      synergyScores: { team1: syn1.overallScore, team2: syn2.overallScore },
                    }, locale === "fr" ? PDF_LABELS_FR : locale === "de" ? PDF_LABELS_DE : undefined);
                  }}
                  className="px-4 py-2 text-xs rounded-xl flex items-center gap-2 font-heading font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('battleBot.downloadMatchupStudy')}
                </button>
              </div>
            </div>

            {/* Best Lead Combos  -  Full Width with Detailed Cards */}
            {result.leadCombos.length > 0 && (
              <div className="glass rounded-2xl p-5 border border-gray-200/60">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-500" />
                  {t('teamTester.bestLeadCombos')}
                </h3>
                <div className="space-y-3">
                  {result.leadCombos.slice(0, 5).map((combo, idx) => {
                    const p1Idx = team1Pokemon.findIndex(p => p.name === combo.lead1);
                    const p2Idx = team1Pokemon.findIndex(p => p.name === combo.lead2);
                    const p1 = p1Idx >= 0 ? team1Pokemon[p1Idx] : null;
                    const p2 = p2Idx >= 0 ? team1Pokemon[p2Idx] : null;
                    const s1 = p1Idx >= 0 ? team1Sets[p1Idx] : null;
                    const s2 = p2Idx >= 0 ? team1Sets[p2Idx] : null;
                    return (
                      <div
                        key={`${combo.lead1}-${combo.lead2}`}
                        onClick={() => setSelectedLeadIdx(idx)}
                        className={cn(
                          "p-4 rounded-xl border transition-all cursor-pointer",
                          idx === selectedLeadIdx
                            ? "bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50 border-violet-300 dark:border-violet-600 ring-2 ring-violet-200 dark:ring-violet-800 shadow-sm"
                            : idx === 0 ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-300"
                            : "bg-gray-50/80 dark:bg-white/5 border-gray-200/60 dark:border-white/10 hover:border-gray-300"
                        )}
                      >
                        {/* Rank + Win Rate Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold",
                              idx === selectedLeadIdx ? "bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200" :
                              idx === 0 ? "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200" : "bg-white/20 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                            )}>
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold">{combo.lead1} + {combo.lead2}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                className={cn(
                                  "h-full rounded-full",
                                  combo.winRate >= 60 ? "bg-gradient-to-r from-green-400 to-emerald-500" :
                                  combo.winRate >= 50 ? "bg-gradient-to-r from-blue-400 to-blue-500" :
                                  combo.winRate >= 40 ? "bg-gradient-to-r from-yellow-400 to-amber-500" :
                                  "bg-gradient-to-r from-red-400 to-red-500"
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${combo.winRate}%` }}
                                transition={{ delay: 0.15 + idx * 0.08, duration: 0.6 }}
                              />
                            </div>
                            <span className={cn(
                              "text-sm font-black",
                              combo.winRate >= 55 ? "text-green-600" : combo.winRate >= 45 ? "text-foreground" : "text-red-500"
                            )}>
                              {combo.winRate}%
                            </span>
                          </div>
                        </div>

                        {/* Two Lead Pokemon Side by Side */}
                        <div className="grid grid-cols-2 gap-3">
                          {[{ p: p1, s: s1, name: combo.lead1, sprite: combo.lead1Sprite },
                            { p: p2, s: s2, name: combo.lead2, sprite: combo.lead2Sprite }].map(({ p, s, name, sprite }) => (
                            <button
                              key={name}
                              onClick={() => p && openPokemonDetail(name, 1)}
                              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/60 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 border border-gray-100 dark:border-white/10 transition-all text-left cursor-pointer"
                            >
                              <Image src={sprite} alt={name} width={36} height={36} unoptimized className="flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-semibold truncate">{name}</span>
                                  {p && (
                                    <div className="flex gap-0.5">
                                      {p.types.map(t => (
                                        <span key={t} className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[t] }} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {s && (
                                  <>
                                    <div className="flex gap-x-3 text-[9px] text-muted-foreground mt-0.5">
                                      <span>{ta(s.ability)}</span>
                                      <span>{ti(s.item)}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-0.5 mt-1">
                                      {s.moves.map(m => (
                                        <span key={m} className="px-1 py-px rounded bg-gray-100 dark:bg-white/10 text-[8px] font-medium text-muted-foreground">{tm(m)}</span>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">
                  {t('teamTester.leadComboHelp', { n: result.leadCombos[0]?.games ?? 0 })}
                </p>
              </div>
            )}

            {/* Strategy Flowchart */}
            {result.leadCombos.length > 0 && (
              <div className="glass rounded-2xl p-5 border border-gray-200/60">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-indigo-500" />
                  {t('teamTester.strategyFlowchart')}
                </h3>
                <StrategyFlowchart
                  team1Pokemon={team1Pokemon}
                  team1Sets={team1Sets}
                  team2Pokemon={team2Pokemon}
                  team2Sets={team2Sets}
                  bestLead={result.leadCombos[selectedLeadIdx]}
                  winRate={result.leadCombos[selectedLeadIdx]?.winRate ?? result.winRate}
                  onPokemonClick={openPokemonDetail}
                />
              </div>
            )}

            {/* Pokémon Impact + Matchup Insights  -  Side by Side */}
            <div className="grid lg:grid-cols-2 gap-5">
              {/* Pokémon Impact Analysis */}
              {result.pokemonImpact.length > 0 && (
                <div className="glass rounded-2xl p-5 border border-gray-200/60">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    {t('teamTester.pokemonImpact')}
                  </h3>
                  <div className="space-y-2">
                    {result.pokemonImpact.map((mon, idx) => {
                      const monIdx = team1Pokemon.findIndex(p => p.name === mon.name);
                      const set = monIdx >= 0 ? team1Sets[monIdx] : null;
                      return (
                        <button
                          key={mon.name}
                          onClick={() => openPokemonDetail(mon.name, 1)}
                          className={cn(
                            "w-full text-left p-3 rounded-xl transition-all cursor-pointer hover:ring-2 hover:ring-violet-300",
                            idx === 0 && mon.impact > 0 ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800" : "bg-gray-50 dark:bg-white/5"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {idx === 0 && mon.impact > 0 && (
                              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-gradient-to-r from-amber-400 to-amber-500 text-white flex-shrink-0">
                                {t('teamTester.mvp')}
                              </span>
                            )}
                            <Image src={mon.sprite} alt={mon.name} width={32} height={32} unoptimized className="flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold truncate block">{mon.name}</span>
                              {set && (
                                <span className="text-[9px] text-muted-foreground">{ta(set.ability)} · {ti(set.item)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {mon.impact > 0 ? (
                                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                              ) : mon.impact < 0 ? (
                                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                              ) : null}
                              <span className={cn(
                                "text-sm font-bold",
                                mon.impact > 5 ? "text-green-600" :
                                mon.impact > 0 ? "text-green-500" :
                                mon.impact === 0 ? "text-muted-foreground" :
                                mon.impact > -5 ? "text-red-400" :
                                "text-red-600"
                              )}>
                                {mon.impact > 0 ? "+" : ""}{mon.impact}%
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    {t('teamTester.impactHelp')}
                  </p>
                </div>
              )}

              {/* Matchup Insights */}
              {result.insights.length > 0 && (
                <div className="glass rounded-2xl p-5 border border-gray-200/60">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    {t('teamTester.matchupInsights')}
                  </h3>
                  <div className="space-y-2">
                    {(locale === 'fr' ? translateInsights(result.insights, tm) : locale === 'es' ? translateInsightsES(result.insights, tm) : locale === 'it' ? translateInsightsIT(result.insights, tm) : locale === 'de' ? translateInsightsDE(result.insights, tm) : result.insights).map((tip, idx) => (                      <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-white/5">
                        <span className="text-sm mt-0.5">💡</span>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sample Battle Replay */}
            {result.sampleBattle && (
              <div className="glass rounded-2xl p-5 border border-gray-200/60">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  {t('teamTester.sampleBattleReplay')}
                </h3>

                {/* Team headers */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">{t('teamTester.team1')}</p>
                    <div className="flex gap-1 flex-wrap">
                      {result.sampleBattle.team1Names.map(name => {
                        const mon = POKEMON_SEED.find(p => p.name === name);
                        return mon ? (
                          <Image key={name} src={mon.sprite} alt={name} width={28} height={28} unoptimized title={name} />
                        ) : <span key={name} className="text-[10px]">{name}</span>;
                      })}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-[10px] font-bold text-red-600 uppercase mb-1">{t('teamTester.team2')}</p>
                    <div className="flex gap-1 flex-wrap">
                      {result.sampleBattle.team2Names.map(name => {
                        const mon = POKEMON_SEED.find(p => p.name === name);
                        return mon ? (
                          <Image key={name} src={mon.sprite} alt={name} width={28} height={28} unoptimized title={name} />
                        ) : <span key={name} className="text-[10px]">{name}</span>;
                      })}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => { setReplayTurn(0); setReplayPlaying(false); }}
                    className="p-2 rounded-lg glass glass-hover"
                    title={t('teamTester.reset')}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setReplayPlaying(!replayPlaying)}
                    className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white"
                  >
                    {replayPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setReplayTurn(prev => Math.min(prev + 1, result.sampleBattle!.log.length - 1))}
                    className="p-2 rounded-lg glass glass-hover"
                    title={t('teamTester.nextTurn')}
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <div className="flex-1 mx-2">
                    <input
                      type="range"
                      min={0}
                      max={result.sampleBattle.log.length - 1}
                      value={replayTurn}
                      onChange={(e) => { setReplayTurn(Number(e.target.value)); setReplayPlaying(false); }}
                      className="w-full accent-orange-500"
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {t('teamTester.turnCounter', { current: result.sampleBattle.log[replayTurn]?.turn ?? 0, total: result.sampleBattle.turnsPlayed })}
                  </span>
                </div>

                {/* HP Bars */}
                {result.sampleBattle.log[replayTurn] && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1.5">
                      {result.sampleBattle.team1Names.map((name, idx) => {
                        const hp = result.sampleBattle!.log[replayTurn]?.team1HP[idx] ?? 0;
                        return (
                          <div key={name} className="flex items-center gap-2">
                            <span className="text-[10px] w-20 truncate text-right">{name}</span>
                            <div className="flex-1 h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  hp > 50 ? "bg-green-500" : hp > 25 ? "bg-yellow-500" : hp > 0 ? "bg-red-500" : "bg-gray-300"
                                )}
                                style={{ width: `${hp}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono w-8 text-right">{hp}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-1.5">
                      {result.sampleBattle.team2Names.map((name, idx) => {
                        const hp = result.sampleBattle!.log[replayTurn]?.team2HP[idx] ?? 0;
                        return (
                          <div key={name} className="flex items-center gap-2">
                            <span className="text-[10px] w-20 truncate text-right">{name}</span>
                            <div className="flex-1 h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  hp > 50 ? "bg-green-500" : hp > 25 ? "bg-yellow-500" : hp > 0 ? "bg-red-500" : "bg-gray-300"
                                )}
                                style={{ width: `${hp}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono w-8 text-right">{hp}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Field state */}
                {result.sampleBattle.log[replayTurn] && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {result.sampleBattle.log[replayTurn].field.weather && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-100 text-blue-700">
                        {result.sampleBattle.log[replayTurn].field.weather}
                      </span>
                    )}
                    {result.sampleBattle.log[replayTurn].field.trickRoom && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-violet-100 text-violet-700">
                        {t('teamTester.trickRoom')}
                      </span>
                    )}
                    {result.sampleBattle.log[replayTurn].field.tailwind1 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-cyan-100 text-cyan-700">
                        {t('teamTester.team1Tailwind')}
                      </span>
                    )}
                    {result.sampleBattle.log[replayTurn].field.tailwind2 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-orange-100 text-orange-700">
                        {t('teamTester.team2Tailwind')}
                      </span>
                    )}
                  </div>
                )}

                {/* Turn events */}
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {result.sampleBattle.log.slice(0, replayTurn + 1).reverse().map((entry) => (
                    <div key={entry.turn} className={cn(
                      "p-2 rounded-lg",
                      entry.turn === result.sampleBattle!.log[replayTurn]?.turn ? "bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800" : "bg-gray-50 dark:bg-white/5"
                    )}>
                      <p className="text-[10px] font-bold text-muted-foreground mb-1">
                        {entry.turn === 0 ? t('teamTester.battleStart') : t('teamTester.turnN', { n: entry.turn })}
                      </p>
                      {entry.events.map((ev, eidx) => (
                        <p key={eidx} className="text-[11px] text-muted-foreground">{translateBattleEvent(ev)}</p>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Result */}
                <div className={cn(
                  "mt-3 p-3 rounded-xl text-center text-sm font-bold",
                  result.sampleBattle.winner === 1
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-red-100 text-red-700 border border-red-300"
                )}>
                  {result.sampleBattle.winner === 1 ? t('teamTester.team1Wins') : t('teamTester.team2Wins')}{' '}
                  {t('teamTester.winsInTurns', { turns: result.sampleBattle.turnsPlayed, t1: result.sampleBattle.team1Remaining, t2: result.sampleBattle.team2Remaining })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !isRunning && (
        <div className="glass rounded-2xl p-12 border border-gray-200/60 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <p className="text-muted-foreground text-sm mb-1 font-medium">{t('teamTester.emptyTitle')}</p>
          <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto">
            {t('teamTester.emptyDesc')}
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
                  placeholder={t('teamTester.searchPlaceholder')}
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
                <p className="text-[10px] text-muted-foreground mt-2">{t('common.pokemonFound', { count: filteredPokemon.length })}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-2">
                {filteredPokemon.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      addPokemon(p);
                      const teamLen = pickerTarget.team === 1 ? team1Pokemon.length : team2Pokemon.length;
                      if (teamLen >= 5) { setPickerTarget(null); setPickerSearch(""); setPickerTypeFilter(null); }
                    }}
                    className="flex items-center gap-2 p-3 rounded-xl glass glass-hover text-left"
                  >
                    <Image src={p.sprite} alt={p.name} width={36} height={36} unoptimized />
                    <div>
                      <p className="text-xs font-medium">{p.name}</p>
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

      {/* ── TEAM LOADER MODAL ────────────────────────────────── */}
      {showLoader && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={() => { setShowLoader(null); setPasteText(""); setPasteError(""); }}
          />
          <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-md sm:max-h-[70vh] glass rounded-2xl border border-gray-200/60 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200/60 flex items-center justify-between">
              <p className="text-sm font-semibold">{t('teamTester.loadTeam', { n: showLoader })}</p>
              <button onClick={() => { setShowLoader(null); setPasteText(""); setPasteError(""); }}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Pokepaste Import */}
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-3">
                <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2 flex items-center gap-1.5">
                  <ClipboardPaste className="w-3 h-3" /> {t('teamTester.importPokepaste')}
                </p>
                <textarea
                  value={pasteText}
                  onChange={e => { setPasteText(e.target.value); setPasteError(""); }}
                  placeholder={t('teamTester.pastePlaceholder') + "\n\nIncineroar @ Assault Vest\nAbility: Intimidate\nEVs: 252 HP / 4 Atk / 252 SpD\nCareful Nature\n- Fake Out\n- Flare Blitz\n- Knock Off\n- U-turn"}
                  className="w-full h-24 text-[11px] bg-white/50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder:text-muted-foreground/50"
                />
                {pasteError && <p className="text-[10px] text-red-500 mt-1">{pasteError}</p>}
                <button
                  onClick={() => showLoader && importFromPokepaste(pasteText, showLoader)}
                  disabled={!pasteText.trim()}
                  className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('teamTester.importTeam')}
                </button>
              </div>

              {savedTeams.length > 0 && (
                <>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">{t('teamTester.yourSavedTeams')}</p>
                  {[...savedTeams].sort((a, b) => b.updatedAt - a.updatedAt).map(t => (
                    <button
                      key={t.id}
                      onClick={() => loadSavedTeam(t, showLoader)}
                      className="w-full text-left p-3 rounded-xl glass glass-hover flex items-center gap-3"
                    >
                      <Save className="w-4 h-4 text-violet-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">{t.slots.length} Pokémon · {new Date(t.updatedAt).toLocaleDateString()} {new Date(t.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              <p className="text-[10px] text-muted-foreground uppercase font-medium mt-2">{t('teamTester.prebuiltTeams')}</p>
              {PREBUILT_TEAMS.map(t => (
                <button
                  key={t.id}
                  onClick={() => loadPrebuiltTeam(t, showLoader)}
                  className="w-full text-left p-3 rounded-xl glass glass-hover flex items-center gap-3"
                >
                  <span className={cn(
                    "px-1.5 py-0.5 text-[9px] font-bold rounded flex-shrink-0",
                    t.tier === "S" ? "bg-amber-100 text-amber-700" :
                    t.tier === "A" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                  )}>{t.tier}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.archetype}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── POKEMON DETAIL / EDIT MODAL ─────────────────────────── */}
      {detailMon && (() => {
        const editPkm = detailMon.pokemon;
        const editSet = detailMon.editable
          ? (detailMon.team === 1 ? team1Sets : team2Sets)[detailMon.slotIndex] ?? detailMon.set
          : detailMon.set;
        const megaForms = editPkm.forms?.filter(f => f.isMega && !f.hidden) ?? [];
        const isMegaItem = (item: string) => item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
        const isMega = isMegaItem(editSet.item);
        const activeMegaForm = isMega ? megaForms.find(f => f.abilities.some(a => a.name === editSet.ability)) ?? megaForms[0] : null;
        const displayTypes = activeMegaForm?.types ?? editPkm.types;
        const displaySprite = activeMegaForm?.sprite ?? editPkm.sprite;
        const displayName = activeMegaForm?.name ?? editPkm.name;
        const usageSets = USAGE_DATA[editPkm.id] ?? [];
        const team = detailMon.team;
        const idx = detailMon.slotIndex;
        return (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setDetailMon(null)}
            />
            <div className={cn(
              "fixed left-3 right-3 top-[72px] bottom-3 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full max-h-[calc(100dvh-84px)] sm:max-h-[85vh] glass rounded-2xl border border-gray-200/60 flex flex-col overflow-hidden",
              detailMon.editable ? "sm:max-w-2xl" : "sm:max-w-lg"
            )}>
              {/* Header */}
              <div className="p-4 border-b border-gray-200/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src={displaySprite} alt={displayName} width={44} height={44} className="drop-shadow-md" unoptimized />
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      {detailMon.editable && <Settings2 className="w-3.5 h-3.5 text-violet-500" />}
                      {displayName}
                    </h3>
                    <div className="flex gap-1 mt-0.5">
                      {displayTypes.map(t => (
                        <span key={t} className="px-1.5 py-0.5 text-[7px] font-bold uppercase rounded text-white/80" style={{ backgroundColor: `${TYPE_COLORS[t]}AA` }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {detailMon.editable && (
                    <button
                      onClick={() => {
                        const remover = detailMon.team === 1
                          ? () => { setTeam1Pokemon(p => p.filter((_, i) => i !== idx)); setTeam1Sets(s => s.filter((_, i) => i !== idx)); }
                          : () => { setTeam2Pokemon(p => p.filter((_, i) => i !== idx)); setTeam2Sets(s => s.filter((_, i) => i !== idx)); };
                        remover();
                        setDetailMon(null);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                      title={t('teamTester.removePokemon')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setDetailMon(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {detailMon.editable ? (
                  /* ── EDITABLE MODE ── */
                  <>
                    {/* Quick Apply Sets */}
                    {usageSets.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">{t('teamTester.quickApplySet')}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {usageSets.slice(0, 5).map((s, i) => (
                            <button key={i} onClick={() => updateTesterSetField(team, idx, { ability: s.ability, moves: s.moves.slice(0, 4), sp: s.sp, nature: s.nature, item: s.item })} className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/20 hover:border-violet-300 transition-all text-[10px] font-medium text-violet-700 dark:text-violet-300">
                              {i === 0 ? <><Zap className="w-3 h-3 inline mr-1" />{t('teamTester.bestSet')}</> : s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Col 1: Moves */}
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">{t('teamTester.moves')}</p>
                        <div className="space-y-1.5">
                          {[0, 1, 2, 3].map((moveIdx) => {
                            const currentMove = editSet.moves[moveIdx] || "";
                            const sortedMoves = [...editPkm.moves].sort((a, b) => a.name.localeCompare(b.name));
                            const moveData = editPkm.moves.find(m => m.name === currentMove);
                            const moveOptions: SearchSelectOption[] = [
                              { value: "", label: t('teamTester.emptySlot') },
                              ...sortedMoves.map((m) => ({
                                value: m.name,
                                label: tm(m.name),
                                sub: `${m.type} · ${m.category}${m.power ? ` · ${m.power}bp` : ""}${m.accuracy ? ` · ${m.accuracy}%` : ""} · ${m.pp}pp`,
                                badge: tt(m.type),
                                badgeColor: `${TYPE_COLORS[m.type]}AA`,
                                description: m.description ? tmd(m.name, m.description) : undefined,
                              })),
                            ];
                            return (
                              <SearchSelect
                                key={moveIdx}
                                value={currentMove}
                                options={moveOptions}
                                onChange={(v) => updateTesterSetMove(team, idx, moveIdx, v)}
                                placeholder={t('teamTester.emptySlot')}
                                triggerBadge={moveData ? { text: tt(moveData.type), color: `${TYPE_COLORS[moveData.type]}AA` } : null}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Col 2: Ability + Nature + Item */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1.5">{isMega ? t('teamTester.preMegaAbility') : t('teamTester.ability')}</p>
                          <div className="space-y-1">
                            {isMega ? (
                              <>
                                {/* Pre-mega ability selector (base abilities) */}
                                {editPkm.abilities.map((ab) => {
                                  const preMega = editSet.preMegaAbility || editPkm.abilities[0]?.name || "";
                                  const isActive = preMega === ab.name;
                                  return (
                                    <button key={ab.name} onClick={() => updateTesterSetField(team, idx, { preMegaAbility: ab.name })} className={cn("w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] border transition-all", isActive ? "bg-emerald-100 dark:bg-emerald-500/30 border-emerald-300 dark:border-emerald-400/50 font-semibold text-emerald-800 dark:text-white" : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10")}>
                                      <div className="flex items-center justify-between">
                                        <span>{ta(ab.name)}{ab.isHidden ? " (H)" : ""}</span>
                                        {isActive && <span className="text-[8px] text-emerald-500 dark:text-emerald-400 font-bold">{t('teamTester.active')}</span>}
                                      </div>
                                      <p className={cn("text-[8px] mt-0.5 line-clamp-1", isActive ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground")}>{tad(ab.name, ab.description)}</p>
                                    </button>
                                  );
                                })}
                                {/* Mega ability (locked display) */}
                                {(() => {
                                  const megaAb = activeMegaForm?.abilities?.[0];
                                  if (!megaAb) return null;
                                  return (
                                    <>
                                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase mt-2 mb-1">{t('teamTester.megaAbility')}</p>
                                      <div className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] border bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-400/50 text-amber-800 dark:text-amber-100">
                                        <div className="flex items-center justify-between">
                                          <span>{ta(megaAb.name)}<span className="ml-1 text-[8px] text-amber-600 dark:text-amber-400 font-bold">{t('teamTester.mega')}</span></span>
                                        </div>
                                        <p className="text-[8px] text-muted-foreground mt-0.5 line-clamp-1">{tad(megaAb.name, megaAb.description)}</p>
                                      </div>
                                    </>
                                  );
                                })()}
                              </>
                            ) : (
                              <>
                                {editPkm.abilities.map((ab) => (
                                  <button key={ab.name} onClick={() => updateTesterSetField(team, idx, { ability: ab.name })} className={cn("w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] border transition-all", editSet.ability === ab.name ? "bg-violet-100 dark:bg-violet-500/30 border-violet-300 dark:border-violet-400/50 font-semibold text-violet-800 dark:text-white" : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10")}>
                                    <span>{ta(ab.name)}{ab.isHidden ? " (H)" : ""}</span>
                                    <p className={cn("text-[8px] mt-0.5 line-clamp-1", editSet.ability === ab.name ? "text-violet-600" : "text-muted-foreground")}>{tad(ab.name, ab.description)}</p>
                                  </button>
                                ))}
                                {megaForms.map((form) => {
                                  const megaAb = form.abilities?.[0];
                                  if (!megaAb || editPkm.abilities.some(a => a.name === megaAb.name)) return null;
                                  const getMegaStone = () => {
                                    const s = usageSets.find(s2 => isMegaItem(s2.item) && s2.ability === megaAb.name);
                                    return s?.item ?? usageSets.find(s2 => isMegaItem(s2.item))?.item;
                                  };
                                  return (
                                    <button key={megaAb.name} onClick={() => updateTesterSetField(team, idx, { ability: megaAb.name, item: getMegaStone() ?? editSet.item, preMegaAbility: editSet.ability })} className={cn("w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] border transition-all", editSet.ability === megaAb.name ? "bg-amber-100 dark:bg-amber-500/30 border-amber-300 dark:border-amber-400/50 font-semibold text-amber-800 dark:text-white" : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10")}>
                                      <span>{ta(megaAb.name)} <span className="text-[8px] text-amber-600 font-bold">{t('teamTester.mega')}</span></span>
                                      <p className={cn("text-[8px] mt-0.5 line-clamp-1", editSet.ability === megaAb.name ? "text-amber-600" : "text-muted-foreground")}>{tad(megaAb.name, megaAb.description)}</p>
                                    </button>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">{t('teamTester.nature')}</p>
                          <SearchSelect
                            value={editSet.nature || "Hardy"}
                            options={allNatureNames.map((n) => {
                              const nat = NATURES[n];
                              return {
                                value: n,
                                label: tn(n),
                                sub: nat.plus && nat.minus ? `+${ts(nat.plus)} / -${ts(nat.minus)}` : t('teamTester.neutral'),
                              };
                            })}
                            onChange={(v) => updateTesterSetField(team, idx, { nature: v })}
                            placeholder={t('teamTester.selectNature')}
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">{t('teamTester.heldItem')}</p>
                          <SearchSelect
                            value={editSet.item || ""}
                            options={[
                              { value: "", label: t('teamTester.noItem') },
                              ...allItemNames.map((name) => ({
                                value: name,
                                label: ti(name),
                                sub: tid(name, ITEMS[name]?.description ?? ''),
                              })),
                            ]}
                            onChange={(v) => updateTesterSetField(team, idx, { item: v || "" })}
                            placeholder={t('teamTester.noItem')}
                            disabled={isMega}
                          />
                          {isMega && <p className="text-[8px] text-amber-600 mt-1">{t('teamTester.megaStoneRequired')}</p>}
                        </div>
                      </div>

                      {/* Col 3: SP Distribution */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-muted-foreground uppercase font-medium">{t('teamTester.statPoints')}</p>
                          <span className={cn("text-[10px] font-bold", Object.values(editSet.sp).reduce((a, b) => a + b, 0) >= MAX_TOTAL_POINTS ? "text-red-500" : "text-muted-foreground")}>{Object.values(editSet.sp).reduce((a, b) => a + b, 0)}/{MAX_TOTAL_POINTS}</span>
                        </div>
                        <div className="space-y-1.5">
                          {STAT_KEYS.map((stat) => {
                            const value = editSet.sp[stat];
                            return (
                              <div key={stat} className="flex items-center gap-1.5">
                                <span className="text-[9px] font-medium text-muted-foreground w-6">{ts(stat)}</span>
                                <button onClick={() => updateTesterSetSP(team, idx, stat, -2)} className="w-5 h-5 rounded bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center transition-colors"><Minus className="w-2.5 h-2.5" /></button>
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full bg-violet-400 transition-all duration-150" style={{ width: `${(value / MAX_PER_STAT) * 100}%` }} /></div>
                                <button onClick={() => updateTesterSetSP(team, idx, stat, 2)} className="w-5 h-5 rounded bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center transition-colors"><Plus className="w-2.5 h-2.5" /></button>
                                <input type="number" min={0} max={MAX_PER_STAT} value={value} onChange={(e) => setTesterSPDirect(team, idx, stat, parseInt(e.target.value) || 0)} className="w-9 text-center text-[10px] font-medium rounded bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-violet-300 py-0.5" />
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2">
                          <p className="text-[8px] text-muted-foreground uppercase mb-1">{t('teamTester.presets')}</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(STAT_PRESETS).map(([name, sp]) => (
                              <button key={name} onClick={() => updateTesterSetField(team, idx, { sp: { ...sp } })} className="px-1.5 py-0.5 text-[8px] rounded bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:border-violet-200 dark:hover:border-violet-500/20 transition-colors">{t(`common.statPresets.${name}`)}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mega Toggle */}
                    {editPkm.hasMega && megaForms.length > 0 && (
                      <div className="pt-3 border-t border-gray-200/60">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">{t('teamTester.megaEvolution')}</p>
                        <div className="flex flex-wrap gap-2">
                          {megaForms.map((form, fi) => {
                            const megaAb = form.abilities?.[0];
                            const isActive = isMega && editSet.ability === megaAb?.name;
                            const getMegaStone = () => {
                              const s = usageSets.find(s2 => isMegaItem(s2.item) && s2.ability === megaAb?.name);
                              return s?.item ?? usageSets.find(s2 => isMegaItem(s2.item))?.item;
                            };
                            return (
                              <button key={fi} onClick={() => {
                                if (isActive) {
                                  updateTesterSetField(team, idx, { ability: editSet.preMegaAbility || (editPkm.abilities[0]?.name ?? ""), item: "Life Orb", preMegaAbility: undefined });
                                } else if (megaAb) {
                                  updateTesterSetField(team, idx, { ability: megaAb.name, item: getMegaStone() ?? editSet.item, preMegaAbility: editSet.ability });
                                }
                              }} className={cn("px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1.5", isActive ? "bg-amber-100 dark:bg-amber-500/30 border-amber-300 dark:border-amber-400/50 text-amber-800 dark:text-white" : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200 dark:hover:border-amber-500/20")}>
                                <Sparkles className="w-3.5 h-3.5" />{isActive ? t('teamTester.megaActive') : form.name.replace(editPkm.name, "").replace("Mega ", "").trim() || t('teamTester.enableMega')}
                              </button>
                            );
                          })}
                          {isMega && (
                            <button onClick={() => updateTesterSetField(team, idx, { ability: editSet.preMegaAbility || (editPkm.abilities[0]?.name ?? ""), item: "Life Orb", preMegaAbility: undefined })} className="px-3 py-1.5 rounded-lg text-[10px] font-medium border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 transition-all text-gray-600 dark:text-gray-400">
                              {t('teamTester.disable')}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* ── DISPLAY-ONLY MODE ── */
                  <>
                    {/* Ability + Item + Nature */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-center">
                        <p className="text-[9px] font-bold text-violet-600 uppercase mb-0.5">{isMega && editSet.preMegaAbility ? t('teamTester.preMegaAbility') : t('teamTester.ability')}</p>
                        {isMega && editSet.preMegaAbility ? (
                          <>
                            <p className="text-[11px] font-semibold">{ta(editSet.preMegaAbility)}</p>
                            {(() => {
                              const ab = editPkm.abilities.find(a => a.name === editSet.preMegaAbility);
                              return ab ? <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{tad(ab.name, ab.description)}</p> : null;
                            })()}
                          </>
                        ) : (
                          <>
                            <p className="text-[11px] font-semibold">{ta(editSet.ability)}</p>
                            {(() => {
                              const ab = editPkm.abilities.find(a => a.name === editSet.ability);
                              return ab ? <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{tad(ab.name, ab.description)}</p> : null;
                            })()}
                          </>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                        <p className="text-[9px] font-bold text-amber-600 uppercase mb-0.5">{t('teamTester.heldItem')}</p>
                        <p className="text-[11px] font-semibold">{ti(editSet.item)}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
                        <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">{t('teamTester.nature')}</p>
                        <p className="text-[11px] font-semibold">{tn(editSet.nature)}</p>
                      </div>
                    </div>
                    {isMega && editSet.preMegaAbility && activeMegaForm?.abilities?.[0] && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                        <p className="text-[9px] font-bold text-amber-600 uppercase mb-0.5">{t('teamTester.megaAbility')}</p>
                        <p className="text-[11px] font-semibold">{ta(activeMegaForm.abilities[0].name)}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{tad(activeMegaForm.abilities[0].name, activeMegaForm.abilities[0].description)}</p>
                      </div>
                    )}

                    {/* Base Stats */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">{t('teamTester.baseStats')}</p>
                      <div className="space-y-1.5">
                        {([
                          [ts('hp'), editPkm.baseStats.hp, editSet.sp.hp],
                          [ts('attack'), editPkm.baseStats.attack, editSet.sp.attack],
                          [ts('defense'), editPkm.baseStats.defense, editSet.sp.defense],
                          [ts('spAtk'), editPkm.baseStats.spAtk, editSet.sp.spAtk],
                          [ts('spDef'), editPkm.baseStats.spDef, editSet.sp.spDef],
                          [ts('speed'), editPkm.baseStats.speed, editSet.sp.speed],
                        ] as [string, number, number][]).map(([label, base, sp]) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className="text-[10px] font-medium w-7 text-right text-muted-foreground">{label}</span>
                            <span className="text-[10px] font-bold w-7 text-right">{base}</span>
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  base >= 130 ? "bg-green-500" : base >= 100 ? "bg-green-400" :
                                  base >= 80 ? "bg-yellow-400" : base >= 60 ? "bg-orange-400" : "bg-red-400"
                                )}
                                style={{ width: `${Math.min(100, (base / 200) * 100)}%` }}
                              />
                            </div>
                            {sp > 0 && (
                              <span className="text-[9px] font-medium text-violet-500 w-8">+{sp} SP</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Moves */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">{t('teamTester.moves')}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {editSet.moves.map(moveName => {
                          const moveData = editPkm.moves.find(m => m.name === moveName);
                          return (
                            <div key={moveName} className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                              <div className="flex items-center gap-1.5 mb-1">
                                {moveData && (
                                  <span className="px-1 py-px text-[8px] font-bold uppercase rounded text-white" style={{ backgroundColor: TYPE_COLORS[moveData.type] }}>
                                    {moveData.type}
                                  </span>
                                )}
                                <span className="text-[11px] font-semibold">{tm(moveName)}</span>
                              </div>
                              {moveData && (
                                <div className="flex gap-2 text-[9px] text-muted-foreground">
                                  <span className={cn(
                                    "font-medium",
                                    moveData.category === "physical" ? "text-red-500" :
                                    moveData.category === "special" ? "text-blue-500" : "text-gray-500"
                                  )}>
                                    {moveData.category === "physical" ? t('teamTester.phys') : moveData.category === "special" ? t('teamTester.spec') : t('teamTester.status')}
                                  </span>
                                  {moveData.power && <span>BP: {moveData.power}</span>}
                                  {moveData.accuracy && <span>Acc: {moveData.accuracy}%</span>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* All Abilities */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">{t('teamTester.allAbilities')}</p>
                      <div className="space-y-1.5">
                        {editPkm.abilities.map(ab => (
                          <div key={ab.name} className={cn(
                            "p-2 rounded-lg text-[10px]",
                            ab.name === editSet.ability ? "bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800" : "bg-gray-50 dark:bg-white/5"
                          )}>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold">{ta(ab.name)}</span>
                              {ab.name === editSet.ability && (
                                <span className="px-1 py-px text-[8px] font-bold bg-violet-200 text-violet-700 rounded">{t('teamTester.active')}</span>
                              )}
                              {ab.isHidden && (
                                <span className="px-1 py-px text-[8px] font-bold bg-gray-200 text-gray-600 rounded">{t('teamTester.ha')}</span>
                              )}
                            </div>
                            <p className="text-muted-foreground mt-0.5">{tad(ab.name, ab.description)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer (edit mode only) */}
              {detailMon.editable && (
                <div className="p-3 border-t border-gray-200/60 flex items-center justify-between">
                  <p className="text-[9px] text-muted-foreground">{t('teamTester.sessionOnly')}</p>
                  <button onClick={() => setDetailMon(null)} className="px-4 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> {t('teamTester.done')}
                  </button>
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}

function TeamPanel({
  label, color, pokemon, sets, onPickerOpen, onRemove, onClear, onLoadTeam, onPokemonClick,
}: {
  label: string;
  color: "blue" | "red";
  pokemon: ChampionsPokemon[];
  sets: CommonSet[];
  onPickerOpen: () => void;
  onRemove: (id: number) => void;
  onClear: () => void;
  onLoadTeam: () => void;
  onPokemonClick?: (name: string) => void;
}) {
  const borderColor = color === "blue" ? "border-blue-200 dark:border-blue-800" : "border-red-200 dark:border-red-800";
  const headerBg = color === "blue" ? "from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950" : "from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950";
  const headerText = color === "blue" ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400";
  const { t } = useI18n();

  return (
    <div className={cn("glass rounded-2xl border overflow-hidden", borderColor)}>
      <div className={cn("p-4 bg-gradient-to-r flex items-center justify-between", headerBg)}>
        <h3 className={cn("text-sm font-semibold uppercase tracking-wider flex items-center gap-2", headerText)}>
          <Swords className="w-4 h-4" />
          {label} ({pokemon.length}/6)
        </h3>
        <button
          onClick={onLoadTeam}
          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <FolderOpen className="w-3 h-3" /> {t('teamTester.load')}
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          {Array.from({ length: 6 }, (_, i) => {
            const mon = pokemon[i];
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl p-2 aspect-square flex flex-col items-center justify-center transition-all",
                  mon ? "glass border border-gray-200" : "border border-dashed border-gray-300 cursor-pointer hover:border-violet-400"
                )}
                onClick={() => !mon && onPickerOpen()}
              >
                {mon ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(mon.id); }}
                      className="self-end -mt-1 -mr-1 p-0.5 rounded hover:bg-red-100"
                    >
                      <span className="text-xs text-muted-foreground hover:text-red-600">✕</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onPokemonClick?.(mon.name); }}
                      className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                    >
                      <Image src={mon.sprite} alt={mon.name} width={40} height={40} unoptimized />
                      <span className="text-[9px] font-medium mt-0.5 truncate w-full text-center">{mon.name}</span>
                    </button>
                  </>
                ) : (
                  <span className="text-lg text-gray-300">+</span>
                )}
              </div>
            );
          })}
        </div>

        {pokemon.length < 6 && (
          <button
            onClick={onPickerOpen}
            className="w-full py-2 rounded-xl glass glass-hover text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors"
          >
            {t('teamTester.addPokemon')} <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {pokemon.length > 0 && (
          <button
            onClick={onClear}
            className="w-full mt-2 py-1.5 rounded-xl text-xs text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> {t('teamTester.clear')}
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// STRATEGY FLOWCHART  -  Clean vertical VGC decision tree
// ══════════════════════════════════════════════════════════════════════════

import {
  type StrategyNode as StrategyNodeData,
} from "@/lib/engine";

function StrategyFlowchart({
  team1Pokemon, team1Sets, team2Pokemon, team2Sets, bestLead, winRate, onPokemonClick,
}: {
  team1Pokemon: ChampionsPokemon[];
  team1Sets: CommonSet[];
  team2Pokemon: ChampionsPokemon[];
  team2Sets: CommonSet[];
  bestLead: LeadComboResult | undefined;
  winRate: number;
  onPokemonClick: (name: string, team: 1 | 2) => void;
}) {
  const [activeScenario, setActiveScenario] = useState(0);
  const { t, tm, ta, locale } = useI18n();

  const tree = useMemo(() => {
    if (!bestLead || team1Pokemon.length < 2 || team2Pokemon.length < 2) return null;
    const raw = generateStrategyTree(team1Pokemon, team1Sets, team2Pokemon, team2Sets, bestLead, winRate);
    return raw && locale === 'fr' ? translateStrategyTree(raw, tm, ta) : raw && locale === 'es' ? translateStrategyTreeES(raw, tm, ta) : raw && locale === 'it' ? translateStrategyTreeIT(raw, tm, ta) : raw && locale === 'de' ? translateStrategyTreeDE(raw, tm, ta) : raw;
  }, [team1Pokemon, team1Sets, team2Pokemon, team2Sets, bestLead, winRate, locale, tm, ta]);

  // Reset scenario tab when lead changes
  useEffect(() => { setActiveScenario(0); }, [bestLead]);

  if (!tree) return null;

  const scenarios = tree.root.children;
  const current = scenarios[activeScenario];

  // Helper to determine which team a pokemon name belongs to
  const handleSpriteClick = (name: string) => {
    if (team1Pokemon.some(p => p.name === name)) onPokemonClick(name, 1);
    else if (team2Pokemon.some(p => p.name === name)) onPokemonClick(name, 2);
  };

  const arrow = <div className="w-px h-4 mx-auto bg-gray-300 dark:bg-gray-600" />;
  const nodeBase = "px-4 py-2.5 rounded-xl text-[11px] font-medium border text-center max-w-md mx-auto w-full";

  return (
    <div className="flex flex-col items-center gap-0">
      {/* Strategy + Win Condition  -  compact row */}
      <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg mb-4">
        <div className="px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-[10px] text-center">
          <span className="font-semibold text-violet-700 dark:text-violet-300">{t('teamTester.strategy')} </span>
          <span className="text-violet-600 dark:text-violet-400">{tree.archetype}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] text-center">
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">{t('teamTester.win')} </span>
          <span className="text-emerald-600 dark:text-emerald-400">{tree.winCondition}</span>
        </div>
      </div>

      {/* ── START NODE ── */}
      <div className={cn(nodeBase, "bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/50 border-violet-300 dark:border-violet-700 font-bold flex items-center justify-center gap-3")}>
        <div className="flex -space-x-1">
          {tree.root.sprites?.map((sprite, i) => (
            <button key={i} onClick={() => tree.root.pokemon?.[i] && handleSpriteClick(tree.root.pokemon[i])} className="hover:scale-110 transition-transform cursor-pointer">
              <Image src={sprite} alt={tree.root.pokemon?.[i] ?? ""} width={32} height={32} className="rounded-full bg-white/80 dark:bg-white/10 border border-violet-200 dark:border-violet-700" unoptimized />
            </button>
          ))}
        </div>
        <div>
          <div className="text-violet-800 dark:text-violet-200">{tree.root.label}</div>
          <div className="text-[9px] text-violet-500 font-normal">{tree.root.detail}</div>
        </div>
      </div>

      {arrow}

      {/* ── SCENARIO TABS ── */}
      {scenarios.length > 1 && (
        <div className="flex gap-2 mb-2">
          {scenarios.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveScenario(i)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm",
                i === activeScenario
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md shadow-red-500/20 scale-105"
                  : "glass border border-gray-200 text-muted-foreground hover:border-violet-300 hover:text-foreground hover:shadow-md"
              )}
            >
              {s.branchLabel ?? t('teamTester.scenarioN', { n: i + 1 })}
            </button>
          ))}
        </div>
      )}

      {/* ── OPPONENT LEAD ── */}
      {current && (
        <>
          <div className={cn(nodeBase, "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 border-red-200 dark:border-red-800 flex items-center justify-center gap-3")}>
            <div className="flex -space-x-1">
              {current.sprites?.map((sprite, i) => (
                <button key={i} onClick={() => current.pokemon?.[i] && handleSpriteClick(current.pokemon[i])} className="hover:scale-110 transition-transform cursor-pointer">
                  <Image src={sprite} alt={current.pokemon?.[i] ?? ""} width={28} height={28} className="rounded-full bg-white/80 dark:bg-white/10 border border-red-200 dark:border-red-700" unoptimized />
                </button>
              ))}
            </div>
            <div>
              <div className="text-red-700 dark:text-red-300 font-semibold">{current.label}</div>
              <div className="text-[9px] text-red-400 dark:text-red-500 font-normal">{current.detail}</div>
            </div>
          </div>

          {arrow}

          {/* ── RENDER EACH TURN ── */}
          {current.children.map((turnNode, ti) => {
            if (turnNode.type !== "turn-label") return null;
            return (
              <div key={turnNode.id} className="w-full flex flex-col items-center gap-0">
                {ti > 0 && arrow}
                {/* Turn header */}
                <div className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-[11px] font-bold text-gray-600 dark:text-white/70 flex items-center gap-2 max-w-md w-full">
                  <SkipForward className="w-3 h-3 text-gray-400" />
                  <div>
                    <span>{turnNode.label}</span>
                    {turnNode.detail && <span className="font-normal text-[10px] text-muted-foreground ml-2">{turnNode.detail}</span>}
                  </div>
                </div>

                {/* Turn children  -  clean vertical flow */}
                {turnNode.children.map((child) => (
                  <FlowNode key={child.id} node={child} onSpriteClick={handleSpriteClick} />
                ))}
              </div>
            );
          })}
        </>
      )}

      {arrow}

      {/* ── KEY THREATS ── */}
      {tree.keyThreats.length > 0 && (
        <div className={cn(nodeBase, "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300")}>
          <Shield className="w-3 h-3 inline mr-1 -mt-0.5" />
          <span className="font-semibold">{t('teamTester.keyThreats')}</span> {tree.keyThreats.join(", ")}
        </div>
      )}

      {arrow}

      {/* ── BACKUP PLAN ── */}
      <div className={cn(nodeBase, "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300")}>
        <RotateCcw className="w-3 h-3 inline mr-1 -mt-0.5" />
        <span className="font-semibold">{t('teamTester.backup')}</span> {tree.backupPlan}
      </div>
    </div>
  );
}

/** Single flowchart node  -  clean card with optional children */
function FlowNode({ node, onSpriteClick }: { node: StrategyNodeData; onSpriteClick: (name: string) => void }) {
  const arrow = <div className="w-px h-3 mx-auto bg-gray-300 dark:bg-gray-600" />;
  const style = getNodeStyle(node);
  const { t } = useI18n();

  return (
    <div className="w-full flex flex-col items-center gap-0">
      {arrow}

      {/* Branch label */}
      {node.branchLabel && (
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
          {node.branchLabel}
        </p>
      )}

      <div className={cn(style.bg, "px-4 py-2 rounded-xl border text-[11px] max-w-md mx-auto w-full", style.border)}>
        <div className="flex items-center gap-2">
          <span className={cn("flex-shrink-0", style.icon)}>{getNodeIcon(node)}</span>

          {/* Sprites */}
          {node.sprites && node.sprites.length > 0 && (
            <div className="flex -space-x-1.5 flex-shrink-0">
              {node.sprites.map((sprite, i) => (
                <button key={i} onClick={() => node.pokemon?.[i] && onSpriteClick(node.pokemon[i])} className="hover:scale-110 transition-transform cursor-pointer">
                  <Image src={sprite} alt={node.pokemon?.[i] ?? ""} width={24} height={24} className="rounded-full bg-white border border-gray-200" unoptimized />
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span className={cn("font-semibold", style.text)}>{node.label}</span>
            {node.moveType && (
              <span className={cn("ml-1.5 px-1.5 py-0 rounded text-[8px] font-bold uppercase", TYPE_COLORS[node.moveType] ?? "bg-white/10 dark:bg-white/10 text-gray-600 dark:text-gray-400")}>
                {node.moveType}
              </span>
            )}
          </div>
        </div>

        {node.detail && (
          <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">{node.detail}</p>
        )}

        {/* Field state badges */}
        {node.fieldState && (
          <div className="flex flex-wrap gap-1 mt-1 ml-5">
            {node.fieldState.weather && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-sky-100 text-sky-700">
                ☀ {node.fieldState.weather.toUpperCase()}{node.fieldState.turnsLeft ? ` ${node.fieldState.turnsLeft}T` : ""}
              </span>
            )}
            {node.fieldState.terrain && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-700">
                ⬡ {node.fieldState.terrain.toUpperCase()}{node.fieldState.turnsLeft ? ` ${node.fieldState.turnsLeft}T` : ""}
              </span>
            )}
            {node.fieldState.tailwind && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-cyan-100 text-cyan-700">
                💨 {t('teamTester.tailwind').toUpperCase()}{node.fieldState.turnsLeft ? ` ${node.fieldState.turnsLeft}T` : ""}
              </span>
            )}
            {node.fieldState.trickRoom && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-100 text-purple-700">
                🔮 {t('teamTester.trickRoom').toUpperCase()}{node.fieldState.turnsLeft ? ` ${node.fieldState.turnsLeft}T` : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Children  -  horizontal branch for decisions, vertical otherwise */}
      {node.children.length > 0 && (
        node.type === "decision" ? (
          <div className="w-full flex flex-col items-center">
            {/* Shared stem from decision card down to the fork */}
            <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
            <div className="w-full max-w-lg mx-auto flex gap-2 justify-center items-start">
              {node.children.map(child => (
                <div key={child.id} className="flex-1 min-w-0 flex flex-col items-center">
                  <FlowNode node={child} onSpriteClick={onSpriteClick} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          node.children.map(child => (
            <FlowNode key={child.id} node={child} onSpriteClick={onSpriteClick} />
          ))
        )
      )}
    </div>
  );
}

function getNodeStyle(node: StrategyNodeData) {
  switch (node.type) {
    case "field-state":
      return node.severity === "bad"
        ? { bg: "bg-red-50/60 dark:bg-red-950/40", border: "border-red-200 dark:border-red-800", icon: "text-red-400", text: "text-red-700 dark:text-red-300" }
        : { bg: "bg-sky-50 dark:bg-sky-950/40", border: "border-sky-200 dark:border-sky-800", icon: "text-sky-500", text: "text-sky-700 dark:text-sky-300" };
    case "action":
      if (node.severity === "good") return { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", icon: "text-emerald-500", text: "text-emerald-800 dark:text-emerald-300" };
      if (node.severity === "bad") return { bg: "bg-red-50 dark:bg-red-950/40", border: "border-red-200 dark:border-red-800", icon: "text-red-500", text: "text-red-800 dark:text-red-300" };
      return { bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800", icon: "text-blue-500", text: "text-blue-800 dark:text-blue-300" };
    case "decision":
      return node.severity === "bad"
        ? { bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-300 dark:border-orange-800", icon: "text-orange-500", text: "text-orange-800 dark:text-orange-300" }
        : { bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800", icon: "text-amber-500", text: "text-amber-800 dark:text-amber-300" };
    case "outcome":
      if (node.severity === "good") return { bg: "bg-green-50 dark:bg-green-950/40", border: "border-green-300 dark:border-green-800", icon: "text-green-500", text: "text-green-800 dark:text-green-300" };
      if (node.severity === "bad") return { bg: "bg-red-50 dark:bg-red-950/40", border: "border-red-300 dark:border-red-800", icon: "text-red-500", text: "text-red-800 dark:text-red-300" };
      return { bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-300 dark:border-amber-800", icon: "text-amber-500", text: "text-amber-800 dark:text-amber-300" };
    case "switch":
      return { bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200 dark:border-indigo-800", icon: "text-indigo-500", text: "text-indigo-800 dark:text-indigo-300" };
    default:
      return { bg: "bg-gray-50 dark:bg-white/5", border: "border-gray-200 dark:border-white/10", icon: "text-gray-500", text: "text-gray-700 dark:text-white/70" };
  }
}

function getNodeIcon(node: StrategyNodeData) {
  const size = "w-3.5 h-3.5";
  switch (node.type) {
    case "start": return <Play className={size} />;
    case "opponent-lead": return <Swords className={size} />;
    case "action": return <ChevronRight className={size} />;
    case "decision": return <GitBranch className={size} />;
    case "field-state": return <Info className={size} />;
    case "outcome": return <Trophy className={size} />;
    case "switch": return <ArrowRightLeft className={size} />;
    case "turn-label": return <SkipForward className={size} />;
    default: return <ChevronRight className={size} />;
  }
}
