"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "@/lib/motion";
import Image from "next/image";
import { LastUpdated } from "@/components/last-updated";
import { Search, SlidersHorizontal, Sparkles, ChevronDown } from "lucide-react";
import { getPokemonBySeason, SEASONS } from "@/lib/pokemon-data";
import { PokemonType, ChampionsPokemon } from "@/lib/types";
import { PokemonCard } from "@/components/pokemon-card";
import { PokemonDetailModal } from "@/components/pokemon-detail-modal";
import { SeasonInfo } from "@/components/season-tabs";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";

const ALL_TYPES: PokemonType[] = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

const ALL_GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const TYPE_COLORS_MAP: Record<PokemonType, string> = {
  normal: "#a8a878", fire: "#f08030", water: "#6890f0", electric: "#f8d030",
  grass: "#78c850", ice: "#98d8d8", fighting: "#c03028", poison: "#a040a0",
  ground: "#e0c068", flying: "#a890f0", psychic: "#f85888", bug: "#a8b820",
  rock: "#b8a038", ghost: "#705898", dragon: "#7038f8", dark: "#705848",
  steel: "#b8b8d0", fairy: "#ee99ac",
};

type SortOption = "name" | "dex" | "tier" | "hp" | "attack" | "defense" | "spAtk" | "spDef" | "speed" | "bst";

type StatKey = "hp" | "attack" | "defense" | "spAtk" | "spDef" | "speed";
const STAT_KEYS: { key: StatKey; label: string; color: string }[] = [
  { key: "hp", label: "HP", color: "#ff5959" },
  { key: "attack", label: "Atk", color: "#f5ac78" },
  { key: "defense", label: "Def", color: "#fae078" },
  { key: "spAtk", label: "SpA", color: "#9db7f5" },
  { key: "spDef", label: "SpD", color: "#a7db8d" },
  { key: "speed", label: "Spe", color: "#fa92b2" },
];
const EMPTY_STAT_FILTERS = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, bst: 0 };
type StatFilters = typeof EMPTY_STAT_FILTERS;
function getBST(p: ChampionsPokemon) { return p.baseStats.hp + p.baseStats.attack + p.baseStats.defense + p.baseStats.spAtk + p.baseStats.spDef + p.baseStats.speed; }

export default function HomePage() {
  const [activeSeason, setActiveSeason] = useState(() => SEASONS.find((s) => s.isActive)?.id ?? SEASONS[0]?.id ?? 1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<PokemonType[]>([]);
  const [selectedGens, setSelectedGens] = useState<number[]>([]);
  const [showMegaOnly, setShowMegaOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("dex");
  const [statFilters, setStatFilters] = useState<StatFilters>({ ...EMPTY_STAT_FILTERS });
  const [selectedPokemon, setSelectedPokemon] = useState<ChampionsPokemon | null>(null);
  const { t, ts, tp, tm, ta } = useI18n();

  // Pokémon Champions release countdown  -  April 8, 2026 12:00 JST (03:00 UTC)
  const RELEASE_DATE = new Date("2026-04-08T03:00:00Z");
  const [countdown, setCountdown] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [released, setReleased] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = RELEASE_DATE.getTime() - Date.now();
      if (diff <= 0) {
        setReleased(true);
        setCountdown(null);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown({ d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const filteredPokemon = useMemo(() => {
    let results = getPokemonBySeason(activeSeason);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          tp(p.name).toLowerCase().includes(q) ||
          p.dexNumber.toString().includes(q) ||
          p.types.some((ty) => ty.includes(q) || t(`common.types.${ty}`).toLowerCase().includes(q)) ||
          p.abilities.some((a) => a.name.toLowerCase().includes(q) || ta(a.name).toLowerCase().includes(q)) ||
          p.moves.some((m) => m.name.toLowerCase().includes(q) || tm(m.name).toLowerCase().includes(q)) ||
          (p.forms?.some((f) =>
            f.name.toLowerCase().includes(q) ||
            f.abilities.some((a) => a.name.toLowerCase().includes(q) || ta(a.name).toLowerCase().includes(q))
          ) ?? false)
      );
    }

    if (selectedTypes.length > 0) {
      results = results.filter((p) =>
        selectedTypes.some((ty) => p.types.includes(ty))
      );
    }

    if (selectedGens.length > 0) {
      results = results.filter((p) => selectedGens.includes(p.generation));
    }

    if (showMegaOnly) {
      results = results.filter((p) => p.hasMega);
    }

    // Stat filters
    for (const sk of STAT_KEYS) {
      if (statFilters[sk.key] > 0) {
        results = results.filter((p) => p.baseStats[sk.key] >= statFilters[sk.key]);
      }
    }
    if (statFilters.bst > 0) {
      results = results.filter((p) => getBST(p) >= statFilters.bst);
    }

    results = [...results].sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "dex": return a.dexNumber - b.dexNumber;
        case "tier": {
          const tierOrder = { S: 0, A: 1, B: 2, C: 3, D: 4 };
          return (tierOrder[a.tier ?? "D"] ?? 5) - (tierOrder[b.tier ?? "D"] ?? 5);
        }
        case "hp": return b.baseStats.hp - a.baseStats.hp;
        case "attack": return b.baseStats.attack - a.baseStats.attack;
        case "defense": return b.baseStats.defense - a.baseStats.defense;
        case "spAtk": return b.baseStats.spAtk - a.baseStats.spAtk;
        case "spDef": return b.baseStats.spDef - a.baseStats.spDef;
        case "speed": return b.baseStats.speed - a.baseStats.speed;
        case "bst": return getBST(b) - getBST(a);
        default: return 0;
      }
    });

    return results;
  }, [activeSeason, searchQuery, selectedTypes, selectedGens, showMegaOnly, sortBy, statFilters, tp, tm, ta, t]);

  const toggleType = (type: PokemonType) => {
    trackEvent("filter_type", "pokedex", type);
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleGen = (gen: number) => {
    trackEvent("filter_gen", "pokedex", `gen_${gen}`);
    setSelectedGens((prev) =>
      prev.includes(gen) ? prev.filter((g) => g !== gen) : [...prev, gen]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-10 space-y-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="flex justify-center mb-2"
        >
          <Image
            src="/logo.png"
            alt="Champions Lab"
            width={200}
            height={200}
            className="drop-shadow-xl"
            priority
            unoptimized
          />
        </motion.div>
        <motion.h1
          className="text-3xl sm:text-4xl font-bold tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.25 }}
        >
          <span className="bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
            {t("pokedex.title")}
          </span>
        </motion.h1>
        <div className="flex justify-center mt-2">
          <LastUpdated page="pokedex" />
        </div>
        <motion.p
          className="text-gray-400 max-w-lg mx-auto text-sm leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.25 }}
        >
          {t("pokedex.description", { count: getPokemonBySeason(activeSeason).length })}
        </motion.p>

        {/* Engine Promotion Banner */}
        <motion.a
          href="/battle-bot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="inline-flex items-center gap-3 mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-400/30 hover:border-amber-400/60 hover:from-amber-500/20 hover:to-amber-500/20 transition-all group"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/25">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </span>
          <div className="text-left">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">{t("pokedex.promo.battleEngine")}</p>
            <p className="text-[10px] text-muted-foreground">{t("pokedex.promo.battleEngineDesc")}</p>
          </div>
        </motion.a>

        {/* Pokémon Champions Release Countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.25 }}
          className="mt-5"
        >
          {!released && countdown ? (
            <div className="relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 px-5 py-4 max-w-lg mx-auto">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.15),transparent_70%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.1),transparent_70%)]" />
              <div className="relative space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <p className="text-lg sm:text-xl font-extrabold uppercase tracking-wider bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent font-heading">
                    {t("pokedex.countdown.title")}
                  </p>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                </div>
                <div className="flex justify-center gap-3 py-1">
                  {[
                    { val: countdown.d, label: t("pokedex.countdown.days") },
                    { val: countdown.h, label: t("pokedex.countdown.hours") },
                    { val: countdown.m, label: t("pokedex.countdown.min") },
                    { val: countdown.s, label: t("pokedex.countdown.sec") },
                  ].map((unit) => (
                    <div key={unit.label} className="flex flex-col items-center min-w-[3.5rem] py-2 px-1 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10">
                      <span className="text-2xl sm:text-3xl font-black tabular-nums bg-gradient-to-b from-emerald-400 to-cyan-500 bg-clip-text text-transparent leading-none">
                        {String(unit.val).padStart(2, "0")}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">{unit.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center italic">
                  {t("pokedex.countdown.expected")}
                </p>
                <p className="text-[11px] text-center text-muted-foreground">
                  {t("pokedex.countdown.hype")}
                </p>
                <div className="flex justify-center">
                  <a
                    href="https://discord.gg/WShMRRSrtm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#5865F2]/15 hover:bg-[#5865F2]/25 border border-[#5865F2]/30 hover:border-[#5865F2]/50 transition-all text-xs font-bold text-[#5865F2] hover:scale-105"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                    {t("pokedex.countdown.discordWait")}
                  </a>
                </div>
              </div>
            </div>
          ) : released ? (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/15 via-green-500/15 to-teal-500/15 px-5 py-6 max-w-lg mx-auto">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.2),transparent_70%)]" />
              <div className="relative space-y-3 text-center">
                <p className="text-3xl">🎉🎮🏆</p>
                <p className="text-lg font-extrabold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                  {t("pokedex.countdown.released")}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  {t("pokedex.countdown.releasedDesc")}
                </p>
                <p className="text-xs font-semibold text-foreground/80 flex items-center justify-center gap-1.5 flex-wrap">
                  <span>🇪🇸</span>
                  <span>🇫🇷</span>
                  <span>🇮🇹</span>
                  <span>🇩🇪</span>
                  <span>🇵🇹</span>
                  <span>{t("pokedex.countdown.translationsAdded")}</span>
                </p>
                <div className="flex justify-center">
                  <a
                    href="https://discord.gg/WShMRRSrtm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#5865F2]/15 hover:bg-[#5865F2]/25 border border-[#5865F2]/30 hover:border-[#5865F2]/50 transition-all text-xs font-bold text-[#5865F2] hover:scale-105"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                    {t("pokedex.countdown.discordJoin")}
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      </motion.div>

      {/* Season Rules */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="mb-8"
      >
        <SeasonInfo seasonId={activeSeason} />
      </motion.div>

      {/* Search & Filters bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="mb-6 space-y-4"
      >
        <div className="flex gap-3 items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("pokedex.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 text-sm placeholder:text-gray-400 transition-all shadow-sm"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-3 rounded-xl transition-all flex items-center gap-2",
              showFilters
                ? "bg-violet-100 text-violet-700 border border-violet-300"
                : "glass glass-hover text-muted-foreground"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">{t("common.filters")}</span>
          </button>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-3 rounded-xl glass border border-gray-200 text-sm bg-transparent cursor-pointer focus:outline-none focus:border-violet-500/50"
          >
            <option value="tier">{t("pokedex.sort.tier")}</option>
            <option value="name">{t("pokedex.sort.name")}</option>
            <option value="dex">{t("pokedex.sort.dex")}</option>
            <option value="hp">{t("pokedex.sort.hp")}</option>
            <option value="attack">{t("pokedex.sort.attack")}</option>
            <option value="defense">{t("pokedex.sort.defense")}</option>
            <option value="spAtk">{t("pokedex.sort.spAtk")}</option>
            <option value="spDef">{t("pokedex.sort.spDef")}</option>
            <option value="speed">{t("pokedex.sort.speed")}</option>
            <option value="bst">{t("pokedex.sort.bst")}</option>
          </select>
        </div>

        {/* Expandable filters */}
        <motion.div
          initial={false}
          animate={{ height: showFilters ? "auto" : 0, opacity: showFilters ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="glass rounded-2xl p-5 border border-gray-200/60 space-y-4">
            {/* Type filters */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{t("pokedex.filters.type")}</h4>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      "px-3 py-1.5 text-[11px] font-bold uppercase rounded-lg transition-all tracking-wider",
                      selectedTypes.includes(type)
                        ? "text-white shadow-lg"
                        : "hover:opacity-90"
                    )}
                    style={{
                      backgroundColor: selectedTypes.includes(type)
                        ? `${TYPE_COLORS_MAP[type]}CC`
                        : `${TYPE_COLORS_MAP[type]}30`,
                      color: selectedTypes.includes(type)
                        ? "#fff"
                        : TYPE_COLORS_MAP[type],
                      border: `1.5px solid ${selectedTypes.includes(type) ? TYPE_COLORS_MAP[type] : `${TYPE_COLORS_MAP[type]}55`}`,
                    }}
                  >
                    {t(`common.types.${type}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Generation filters */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{t("pokedex.filters.generation")}</h4>
              <div className="flex flex-wrap gap-1.5">
                {ALL_GENS.map((gen) => (
                  <button
                    key={gen}
                    onClick={() => toggleGen(gen)}
                    className={cn(
                      "px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all",
                      selectedGens.includes(gen)
                        ? "bg-violet-100 text-violet-700 border border-violet-300"
                        : "glass glass-hover text-muted-foreground"
                    )}
                  >
                    Gen {gen}
                  </button>
                ))}
              </div>
            </div>

            {/* Special filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowMegaOnly(!showMegaOnly)}
                className={cn(
                  "px-4 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5",
                  showMegaOnly
                    ? "bg-gradient-to-r from-pink-100 to-violet-100 text-pink-700 border border-pink-300"
                    : "glass glass-hover text-muted-foreground"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t("pokedex.filters.megaOnly")}
              </button>
            </div>

            {/* Base Stat Filters */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-violet-500" />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("pokedex.filters.baseStats")}</h4>
                  {Object.values(statFilters).some(v => v > 0) && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400">
                      {Object.values(statFilters).filter(v => v > 0).length} active
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setStatFilters({ ...EMPTY_STAT_FILTERS })}
                  className={cn(
                    "text-[10px] font-semibold transition-colors",
                    Object.values(statFilters).some(v => v > 0)
                      ? "text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                      : "text-transparent pointer-events-none"
                  )}
                >
                  {t("common.clearAll")}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                {STAT_KEYS.map(({ key, label, color }) => (
                  <div key={key} className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold w-8 text-right" style={{ color }}>{ts(key)}</span>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      step={5}
                      value={statFilters[key]}
                      onChange={(e) => setStatFilters(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="flex-1 h-1.5 cursor-pointer"
                      style={{ accentColor: color }}
                    />
                    <span className={cn(
                      "text-[11px] font-mono w-9 tabular-nums text-right transition-colors",
                      statFilters[key] > 0 ? "font-bold" : "text-gray-400 dark:text-gray-500"
                    )} style={statFilters[key] > 0 ? { color } : undefined}>
                      {statFilters[key] > 0 ? `≥${statFilters[key]}` : " - "}
                    </span>
                  </div>
                ))}
                {/* BST row */}
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-bold w-8 text-right text-gray-500">BST</span>
                  <input
                    type="range"
                    min={0}
                    max={800}
                    step={10}
                    value={statFilters.bst}
                    onChange={(e) => setStatFilters(prev => ({ ...prev, bst: Number(e.target.value) }))}
                    className="flex-1 h-1.5 cursor-pointer"
                    style={{ accentColor: "#888" }}
                  />
                  <span className={cn(
                    "text-[11px] font-mono w-9 tabular-nums text-right transition-colors",
                    statFilters.bst > 0 ? "font-bold text-gray-600 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"
                  )}>
                    {statFilters.bst > 0 ? `≥${statFilters.bst}` : " - "}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-400">
          {t("common.showing", { count: filteredPokemon.length })}
        </p>
      </div>

      {/* Pokémon Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
      >
        {filteredPokemon.map((pokemon, i) => (
          <PokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            onClick={(p) => { trackEvent("pokemon_click", "pokedex", p.name); setSelectedPokemon(p); }}
            index={i}
          />
        ))}
      </motion.div>

      {/* Empty state */}
      {filteredPokemon.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-muted-foreground text-lg mb-2">{t("pokedex.noMatch")}</p>
          <p className="text-sm text-muted-foreground/60">{t("pokedex.adjustFilters")}</p>
        </motion.div>
      )}

      {/* Detail Modal */}
      <PokemonDetailModal
        pokemon={selectedPokemon}
        onClose={() => setSelectedPokemon(null)}
      />
    </div>
  );
}
