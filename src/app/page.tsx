"use client";

import { useState, useMemo } from "react";
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
