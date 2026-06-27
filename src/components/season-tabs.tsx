"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { SEASONS, POKEMON_SEED } from "@/lib/pokemon-data";
import { cn } from "@/lib/utils";
import { Shield, Swords, Users, Timer, Sparkles, Ban, Gauge, ListChecks, Calendar, Dna, Package } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface SeasonTabsProps {
  activeSeason: number;
  onSeasonChange: (season: number) => void;
}

export function SeasonTabs({ activeSeason, onSeasonChange }: SeasonTabsProps) {
  const { t } = useI18n();
  const translateSeasonName = (name: string) =>
    name
      .replace(/\bSeason\b/g, t('season.seasonWord'))
      .replace(/\bRegulation\b/g, t('season.regulationWord'));
  return (
    <div className="flex flex-wrap gap-2">
      {SEASONS.map((season) => {
        const isActive = activeSeason === season.id;
        return (
          <button
            key={season.id}
            onClick={() => onSeasonChange(season.id)}
            className={cn(
              "relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground glass glass-hover"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="season-active"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-500/20 dark:to-blue-500/20 border border-violet-300 dark:border-violet-500/30"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Shield className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{translateSeasonName(season.name)}</span>
            {season.isActive && (
              <span className="relative z-10 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                LIVE
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface RuleConfig {
  icon: typeof Swords;
  labelKey: string;
  descKey: string;
  color: string;
  bg: string;
  ring: string;
}

const RULES_CONFIG: Record<string, RuleConfig> = {
  "Doubles format": {
    icon: Swords,
    labelKey: "season.ruleDoubles",
    descKey: "season.ruleDoublesDesc",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-500/15",
    ring: "ring-red-100 dark:ring-red-500/25",
  },
  "Bring 6, Pick 4": {
    icon: ListChecks,
    labelKey: "season.ruleBring6",
    descKey: "season.ruleBring6Desc",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/15",
    ring: "ring-blue-100 dark:ring-blue-500/25",
  },
  "Level 50 auto-level": {
    icon: Gauge,
    labelKey: "season.ruleLevel50",
    descKey: "season.ruleLevel50Desc",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    ring: "ring-amber-100 dark:ring-amber-500/25",
  },
  "Stat Points (no IVs/EVs)": {
    icon: Sparkles,
    labelKey: "season.ruleStatPoints",
    descKey: "season.ruleStatPointsDesc",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/15",
    ring: "ring-violet-100 dark:ring-violet-500/25",
  },
  "Mega Evolution": {
    icon: Sparkles,
    labelKey: "season.ruleMega",
    descKey: "season.ruleMegaDesc",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-500/15",
    ring: "ring-pink-100 dark:ring-pink-500/25",
  },
  "No duplicate Pokémon": {
    icon: Ban,
    labelKey: "season.ruleNoDupePokemon",
    descKey: "season.ruleNoDupePokemonDesc",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    ring: "ring-emerald-100 dark:ring-emerald-500/25",
  },
  "No duplicate held items": {
    icon: Ban,
    labelKey: "season.ruleNoDupeItems",
    descKey: "season.ruleNoDupeItemsDesc",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-500/15",
    ring: "ring-cyan-100 dark:ring-cyan-500/25",
  },
  "20-minute game timer": {
    icon: Timer,
    labelKey: "season.ruleTimer",
    descKey: "season.ruleTimerDesc",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-500/15",
    ring: "ring-orange-100 dark:ring-orange-500/25",
  },
};

function RuleCard({ rule }: { rule: string }) {
  const [hovered, setHovered] = useState(false);
  const { t } = useI18n();
  const config = RULES_CONFIG[rule];

  if (!config) return null;

  const Icon = config.icon;
  const label = t(config.labelKey);
  const description = t(config.descKey);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl cursor-default transition-all duration-200 ring-1",
          config.bg,
          config.ring,
          hovered && "shadow-md ring-2"
        )}
      >
        <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", config.color)} />
        <span className={cn("text-xs font-medium", config.color)}>{label}</span>
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 top-full mt-2 w-72 p-4 bg-white dark:bg-[#131c2e] rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 border border-gray-100 dark:border-gray-200/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", config.bg)}>
                <Icon className={cn("w-3.5 h-3.5", config.color)} />
              </div>
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SeasonInfo({ seasonId }: { seasonId: number }) {
  const { t, locale } = useI18n();
  const season = SEASONS.find((s) => s.id === seasonId);
  if (!season) return null;

  const rosterCount = POKEMON_SEED.filter(p => !(p as any).hidden).length;
  const megaCount = POKEMON_SEED.filter(p => p.hasMega && !(p as any).hidden).length;

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00Z").toLocaleDateString(
      locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : locale === "it" ? "it-IT" : locale === "de" ? "de-DE" : locale === "ko" ? "ko-KR" : "en-US",
      { month: "long", day: "numeric", year: "numeric" }
    );

  const regulationEnd = season.regulationEnd ?? season.endDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-gray-200/10 shadow-sm"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/20 dark:to-indigo-500/20 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{season.name.replace(/\bSeason\b/g, t('season.seasonWord')).replace(/\bRegulation\b/g, t('season.regulationWord'))}</h3>
            <p className="text-xs text-muted-foreground">
              {formatDate(season.startDate)}
            </p>
          </div>
        </div>
        {season.isActive && (
          <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/25 uppercase tracking-wider">
            {t('season.activeSeason')}
          </span>
        )}
      </div>

      {/* Season details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 ring-1 ring-gray-100 dark:ring-gray-200/10">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t('season.seasonEnds')}</p>
            <p className="text-xs font-semibold text-foreground">{season.endDate ? formatDate(season.endDate) : "TBD"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 ring-1 ring-gray-100 dark:ring-gray-200/10">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t('season.regulationUntil')}</p>
            <p className="text-xs font-semibold text-foreground">{regulationEnd ? formatDate(regulationEnd) : "TBD"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 ring-1 ring-gray-100 dark:ring-gray-200/10">
          <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t('season.pokemon')}</p>
            <p className="text-xs font-semibold text-foreground">{t('season.inRoster', { count: rosterCount })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 ring-1 ring-gray-100 dark:ring-gray-200/10">
          <Dna className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t('season.megaEvolutions')}</p>
            <p className="text-xs font-semibold text-foreground">{t('season.available', { count: megaCount })}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">{t('season.rulesHover')}</p>

      <div className="flex flex-wrap gap-2">
        {season.rules.map((rule) => (
          <RuleCard key={rule} rule={rule} />
        ))}
      </div>
    </motion.div>
  );
}
