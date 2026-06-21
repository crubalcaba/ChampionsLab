"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import Image from "next/image";
import { LastUpdated } from "@/components/last-updated";
import {
  Plus, X, Download, Upload, Copy, Trash2, Shield, Zap, Swords,
  ChevronDown, ChevronUp, Check, AlertTriangle, Sparkles, Star,
  Users, Brain, Target, Award, Minus, Settings2,
  Save, FolderOpen, Share2, SlidersHorizontal, ExternalLink,
} from "lucide-react";
import { POKEMON_SEED, STAT_PRESETS } from "@/lib/pokemon-data";
import {
  ChampionsPokemon, TeamSlot, PokemonType, TYPE_COLORS, StatPoints,
} from "@/lib/types";
import { PokemonDetailModal } from "@/components/pokemon-detail-modal";
import { SpeedTierPanel } from "@/components/speed-tier-panel";
import { SurvivalPanel } from "@/components/survival-panel";
import { CompactDamageCalc } from "@/components/compact-damage-calc";
import { StatSlider } from "@/components/stat-slider";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { USAGE_DATA } from "@/lib/usage-data";
import { SearchSelect, type SearchSelectOption } from "@/components/search-select";
import {
  analyzePartialTeam,
  suggestTeammates,
  getSlotSuggestions,
  suggestSets,
  PREBUILT_TEAMS,
  NATURES,
  ITEMS,
  getAllNatures,
  getAllItems,
  type NatureName,
  type PrebuiltTeam,
  type TeammateSuggestion,
  type TeamAnalysis,
  type SlotSuggestion,
  getTypeImmunity,
  calculateStats,
  isItemAvailable,
} from "@/lib/engine";
import { getMatchup, getAllTypes } from "@/lib/engine/type-chart";
import {
  classifyPickerRoles, pickSetForRole, PICKER_ROLES,
  type PickerRole,
} from "@/lib/engine/picker-roles";
import {
  getSavedTeams, saveTeam, deleteTeam, deserializeTeam, saveLastTeam, getLastTeam,
  serializeTeam,
  type SavedTeam, type SavedTeamSlot,
} from "@/lib/storage";
import {
  CHAMPIONS_TOURNAMENT_TEAMS,
  type ChampionsTournamentTeam,
} from "@/lib/simulation-data";
import { deflateRaw, inflateRaw } from "pako";
import QRCode from "qrcode";
import { useI18n } from "@/lib/i18n";

const EMPTY_STAT_POINTS: StatPoints = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
const MAX_TOTAL_POINTS = 66;
const MAX_PER_STAT = 32;
const STAT_KEYS: (keyof StatPoints)[] = ["hp", "attack", "defense", "spAtk", "spDef", "speed"];
const STAT_LABELS: Record<string, string> = { hp: "HP", attack: "Atk", defense: "Def", spAtk: "SpA", spDef: "SpD", speed: "Spe" };

// ── Showdown EV ↔ SP conversion ─────────────────────────────────────────
// Proportional: 32 SP = 252 EVs (exact), no 510 total cap (Champions allows more)
// Champions: 0-32 per stat, 66 total
// Showdown EVs: multiples of 4, 0-252 per stat
function evsToStatPoints(evs: StatPoints): StatPoints {
  const result = STAT_KEYS.map(k => Math.min(MAX_PER_STAT, Math.round(evs[k] * MAX_PER_STAT / 252)));
  let total = result.reduce((a, b) => a + b, 0);
  while (total > MAX_TOTAL_POINTS) {
    let minIdx = -1, minVal = Infinity;
    for (let i = 0; i < result.length; i++) {
      if (result[i] > 0 && result[i] < minVal) { minVal = result[i]; minIdx = i; }
    }
    if (minIdx === -1) break;
    result[minIdx]--;
    total--;
  }
  const sp: StatPoints = { ...EMPTY_STAT_POINTS };
  STAT_KEYS.forEach((k, i) => { sp[k] = result[i]; });
  return sp;
}

function statPointsToEVs(sp: StatPoints): StatPoints {
  const evs: StatPoints = { ...EMPTY_STAT_POINTS };
  STAT_KEYS.forEach(k => {
    evs[k] = Math.min(252, Math.round(sp[k] * 252 / MAX_PER_STAT / 4) * 4);
  });
  return evs;
}

function createEmptySlot(): TeamSlot {
  return { pokemon: null, moves: [], statPoints: { ...EMPTY_STAT_POINTS } };
}

// Type effectiveness for coverage chart
const TYPE_CHART: Record<PokemonType, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

const ALL_TYPES: PokemonType[] = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

export default function TeamBuilderPage() {
  const { locale, t, tp, tm, ta, ti, tn, ts, tt, tad, tid, tmd } = useI18n();

  // ── Analysis text translators ──
  const RATING_KEYS: Record<string, string> = {
    "Empty": "empty", "In Progress": "inProgress", "Excellent": "excellent",
    "Strong": "strong", "Decent": "decent", "Needs Work": "needsWork", "Weak": "weak",
  };
  const tRating = (r: string) => t("teamBuilder.ratings." + (RATING_KEYS[r] ?? "empty"));
  const tArchetype = (a: string) => t("teamBuilder.archetypeNames." + a) || a.replace(/-/g, " ");
  const tFullType = (type: string) => t("common.types." + type.toLowerCase());
  const translateInsight = (s: string): string => {
    // Fixed strings
    const FIXED: Record<string, string> = {
      "Excellent offensive type coverage": "excellentCoverage",
      "Strong defensive type synergy": "strongDefSynergy",
      "Has speed control options": "hasSpeedControl",
      "Intimidate support available": "intimidateSupport",
      "Has redirection support": "hasRedirection",
      "Priority moves for endgame": "priorityMoves",
      "No speed control - vulnerable to faster teams": "noSpeedControl",
      "Lacks fast options to pressure opponents": "lacksFast",
      "No dedicated support Pokémon": "noSupport",
      "No Intimidate to weaken physical attackers": "noIntimidate",
      "Add a Tailwind or Trick Room user for speed control": "addSpeedControl",
      "Consider adding an Intimidate user (Incineroar, Gyarados)": "addIntimidate",
      "Add a priority move user for endgame situations": "addPriority",
      "No speed control - add Tailwind or Trick Room user": "noSpeedControlThreat",
      "No Intimidate - consider adding an Intimidate user": "noIntimidateThreat",
    };
    if (FIXED[s]) return t("teamBuilder.insights." + FIXED[s]);
    // Dynamic patterns
    let m;
    if ((m = s.match(/^Clear (.+) game plan$/))) return t("teamBuilder.insights.clearGamePlan", { archetype: tArchetype(m[1]) });
    if ((m = s.match(/^(\d+) Pokémon weak to (.+)$/))) return t("teamBuilder.insights.weakToType", { count: m[1], type: tFullType(m[2]) });
    if ((m = s.match(/^Can't hit (.+) types super effectively$/))) return t("teamBuilder.insights.cantHit", { types: m[1].split("/").map(tFullType).join("/") });
    if ((m = s.match(/^Add coverage for (.+) types$/))) return t("teamBuilder.insights.addCoverage", { types: m[1].split(" and ").map(tFullType).join(" / ") });
    if ((m = s.match(/^Reduce (.+) weakness/))) return t("teamBuilder.insights.reduceWeakness", { type: tFullType(m[1]) });
    if ((m = s.match(/^Team needs (\d+) more/))) return t("teamBuilder.insights.needMore", { n: m[1] });
    if ((m = s.match(/^Critical weakness to (.+) - /))) return t("teamBuilder.insights.criticalTo", { types: m[1].split(", ").map(tFullType).join(", ") });
    if ((m = s.match(/^Poor coverage - no super effective hits vs (.+)$/))) return t("teamBuilder.insights.poorCoverage", { types: m[1].split(", ").map(tFullType).join(", ") });
    return s;
  };
  const translateReason = (s: string): string => {
    if (s === "Strong starting pick") return t("common.suggestions.strongStartingPick");
    if (s === "Great defensive type synergy") return t("common.suggestions.greatDefSynergy");
    let m;
    if ((m = s.match(/^Covers (.+) weaknesses$/))) return t("common.suggestions.coversWeaknesses", { types: m[1].split("/").map(tFullType).join("/") });
    if ((m = s.match(/^Fills missing (.+) role$/))) return t("common.suggestions.fillsRole", { role: t("common.roles." + m[1].replace(/ /g, "-")) });
    return s;
  };
  const translateSetName = (name: string): string => {
    const words = t("common.setWords." + name);
    if (words !== "common.setWords." + name) return words;
    // Word-level translation for compound names
    const SET_WORDS = [
      "Specially Defensive", "Trick Room", "Choice Band", "Choice Scarf", "Choice Specs",
      "Assault Vest", "Life Orb", "Focus Sash", "Swords Dance", "Nasty Plot", "Calm Mind",
      "Dragon Dance", "Shell Smash", "Quiver Dance", "Belly Drum",
      "Sweeper", "Attacker", "Tank", "Support", "Lead", "Wall", "Setter", "Pivot",
      "Bulky", "Offensive", "Physical", "Special", "Mixed", "Fast", "Defensive",
      "Supportive", "Counter", "Sun", "Rain", "Sand", "Snow", "Hail", "Tailwind", "Mega",
    ];
    let result = name;
    for (const w of SET_WORDS) {
      const tr = t("common.setWords." + w);
      if (tr !== "common.setWords." + w) {
        result = result.replace(new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "g"), tr);
      }
    }
    return result;
  };
  const translateNatureReason = (reason: string): string => {
    let m;
    if ((m = reason.match(/^Most used competitively \((\d+)%\)$/))) return t("common.natureReasons.mostUsed", { pct: m[1] });
    if (reason === "Based on base stats") return t("common.natureReasons.basedOnStats");
    if ((m = reason.match(/^From (.+) build$/))) return t("common.spReasons.fromBuild", { name: translateSetName(m[1]) });
    if (reason === "Default offensive spread") return t("common.spReasons.defaultSpread");
    return reason;
  };
  const [slots, setSlots] = useState<TeamSlot[]>(
    Array.from({ length: 6 }, createEmptySlot)
  );
  const [teamName, setTeamName] = useState("My Team");
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [showPokemonPicker, setShowPokemonPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerTypeFilter, setPickerTypeFilter] = useState<PokemonType | null>(null);
  const [pickerCounterFilter, setPickerCounterFilter] = useState<PokemonType | null>(null);
  const [pickerRoleFilter, setPickerRoleFilter] = useState<PickerRole | null>(null);
  const [pickerStatFilters, setPickerStatFilters] = useState({ hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, bst: 0 });
  const [showStatFilters, setShowStatFilters] = useState(false);
  const [showCounterFilter, setShowCounterFilter] = useState(false);
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [selectedPokemonDetail, setSelectedPokemonDetail] = useState<ChampionsPokemon | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const editPanelRef = useRef<HTMLDivElement>(null);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState<string | undefined>();
  const [showSavedTeams, setShowSavedTeams] = useState(false);
  const [saveConfirm, setSaveConfirm] = useState(false);
  const [shuffledTeams, setShuffledTeams] = useState<PrebuiltTeam[]>([]);
  const [showShare, setShowShare] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"normal" | "speed" | "survival" | "damage">("normal");
  const [spToast, setSpToast] = useState<string | null>(null);

  const [shareLinkError, setShareLinkError] = useState<string | null>(null);
  const [showMoreTournament, setShowMoreTournament] = useState(false);
  const [showMoreCurated, setShowMoreCurated] = useState(false);
  const [pasteHideNature, setPasteHideNature] = useState(false);
  const [pasteHideStatPoints, setPasteHideStatPoints] = useState(false);
  const [pasteHideItem, setPasteHideItem] = useState(false);
  const [pasteHideAbility, setPasteHideAbility] = useState(false);
  const [pasteLinkCopied, setPasteLinkCopied] = useState(false);



  // Tournament teams filtered to active roster, sorted by placement
  const tournamentTeams = useMemo(() => {
    const validIds = new Set(POKEMON_SEED.filter(p => !p.hidden).map(p => p.id));
    return CHAMPIONS_TOURNAMENT_TEAMS
      .filter(tm => tm.pokemonIds.every(id => validIds.has(id)))
      .sort((a, b) => a.placement - b.placement || b.players - a.players);
  }, []);

  // Shuffle suggested teams on mount
  useEffect(() => {
    const shuffled = [...PREBUILT_TEAMS].sort(() => Math.random() - 0.5);
    setShuffledTeams(shuffled);
  }, []);

  // Build shareable URL - store team on server, return short link
  const buildShareUrl = useCallback(async () => {
    const filled = slots.filter(s => s.pokemon);
    if (filled.length === 0) return "";
    const data = {
      n: teamName,
      s: serializeTeam(slots).map(s => ({
        p: s.pokemonId,
        a: s.ability,
        t: s.nature,
        m: s.moves,
        sp: [s.statPoints.hp, s.statPoints.attack, s.statPoints.defense, s.statPoints.spAtk, s.statPoints.spDef, s.statPoints.speed],
        te: s.teraType,
        i: s.item,
        mg: s.isMega,
        pa: s.preMegaAbility,
      })),
    };
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { id } = await res.json();
        return `${window.location.origin}/team-builder?s=${id}`;
      }
    } catch { /* fall through to compressed fallback */ }
    // Fallback: compressed URL
    const compressed = deflateRaw(JSON.stringify(data));
    const b64 = btoa(String.fromCharCode(...compressed))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return `${window.location.origin}/team-builder?t=${b64}`;
  }, [slots, teamName]);

  // Load saved teams on mount + restore last team if available OR load from share URL
  useEffect(() => {
    setSavedTeams(getSavedTeams());

    // Check for shared team URL first
    const params = new URLSearchParams(window.location.search);
    const shortId = params.get("s");
    const teamParam = params.get("t") || params.get("team"); // "t" = compressed, "team" = legacy

    const restoreTeam = (data: { n?: string; s: Array<{ p: number; a?: string; t?: string; m: string[]; sp: number[]; te?: string; i?: string; mg?: boolean; mgi?: number; pa?: string }> }) => {
      const restored: SavedTeamSlot[] = data.s.map(s => ({
        pokemonId: s.p,
        ability: s.a,
        nature: s.t,
        moves: s.m || [],
        statPoints: { hp: s.sp?.[0] || 0, attack: s.sp?.[1] || 0, defense: s.sp?.[2] || 0, spAtk: s.sp?.[3] || 0, spDef: s.sp?.[4] || 0, speed: s.sp?.[5] || 0 },
        teraType: s.te as PokemonType | undefined,
        item: s.i,
        isMega: s.mg,
        megaFormIndex: s.mgi,
        preMegaAbility: s.pa,
      }));
      setSlots(deserializeTeam(restored));
      setTeamName(data.n || t('teamBuilder.sharedTeam'));
      window.history.replaceState({}, "", "/team-builder");
    };

    // Short link: fetch from API
    if (shortId) {
      fetch(`/api/share/${encodeURIComponent(shortId)}`)
        .then(r => {
          if (!r.ok) { setShareLinkError(t('teamBuilder.sharedExpired')); window.history.replaceState({}, "", "/team-builder"); return null; }
          return r.json();
        })
        .then(data => { if (data?.s) restoreTeam(data); })
        .catch(() => { setShareLinkError(t('teamBuilder.sharedFailed')); window.history.replaceState({}, "", "/team-builder"); });
      return;
    }

    if (teamParam) {
      try {
        let data;
        if (params.has("t")) {
          // Compressed: URL-safe base64 → deflateRaw → JSON
          const b64 = teamParam.replace(/-/g, "+").replace(/_/g, "/");
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          data = JSON.parse(new TextDecoder().decode(inflateRaw(bytes)));
        } else {
          // Legacy uncompressed
          data = JSON.parse(atob(teamParam));
        }
        if (data.s && Array.isArray(data.s)) {
          restoreTeam(data);
          return;
        }
      } catch { /* invalid param, fall through to normal load */ }
    }

    const last = getLastTeam();
    if (last && last.slots.length > 0) {
      setSlots(deserializeTeam(last.slots));
      setTeamName(last.name);
      if (last.teamId) setCurrentTeamId(last.teamId);
    }
  }, []);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const seenDexNumbers = new Set<number>();
    const seenItems = new Set<string>();

    slots.forEach((s) => {
      if (!s.pokemon) return;

      if (seenDexNumbers.has(s.pokemon.dexNumber)) {
        errors.push(`${t('teamBuilder.duplicatePokemon')} ${tp(s.pokemon.name)}`);
      }
      seenDexNumbers.add(s.pokemon.dexNumber);

      const item = s.item?.trim();
      if (item) {
        if (seenItems.has(item)) {
          errors.push(`${t('teamBuilder.duplicateItem')} ${item}`);
        }
        seenItems.add(item);
      }
    });

    return errors;
  }, [slots]);

  // Auto-save last worked team
  useEffect(() => {
    const filledCount = slots.filter(s => s.pokemon).length;
    if (filledCount > 0 && validationErrors.length === 0) {
      saveLastTeam(teamName, slots, currentTeamId);
    }
  }, [slots, teamName, currentTeamId, validationErrors.length]);

  const handleSaveTeam = () => {
    if (validationErrors.length > 0) return;
    trackEvent("save_team", "team_builder", teamName, filledSlots.length);
    const team = saveTeam(teamName, slots, currentTeamId);
    setCurrentTeamId(team.id);
    setSavedTeams(getSavedTeams());
    setSaveConfirm(true);
    setTimeout(() => setSaveConfirm(false), 2000);
  };

  const handleLoadSavedTeam = (team: SavedTeam) => {
    trackEvent("load_saved_team", "team_builder", team.name);
    const restoredSlots = deserializeTeam(team.slots);
    setSlots(restoredSlots);
    setTeamName(team.name);
    setCurrentTeamId(team.id);
    setShowSavedTeams(false);
  };

  const handleDeleteSavedTeam = (id: string) => {
    trackEvent("delete_saved_team", "team_builder");
    deleteTeam(id);
    setSavedTeams(getSavedTeams());
    if (currentTeamId === id) setCurrentTeamId(undefined);
  };

  const generateShareImage = async () => {
    trackEvent("share_team", "team_builder", teamName, filledSlots.length);
    const filled = slots.filter(s => s.pokemon);
    if (filled.length === 0) return;

    // Build share URL first so we can generate a QR code
    const shareUrlForQR = await buildShareUrl();
    if (shareUrlForQR) setShareUrl(shareUrlForQR);

    const W = 1200, cardH = 200, headerH = 140, footerH = 60;
    const H = headerH + Math.ceil(filled.length / 2) * cardH + footerH;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#1e1b4b");
    grad.addColorStop(0.5, "#312e81");
    grad.addColorStop(1, "#0c4a6e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid pattern
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Header LEFT - Team name + subtitle (ellipsize if too long)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px Inter, system-ui, sans-serif";
    const maxTitleWidth = W - 660; // leave room for QR + logo + brand on right
    let titleText = teamName;
    if (ctx.measureText(titleText).width > maxTitleWidth) {
      while (titleText.length > 1 && ctx.measureText(titleText + "…").width > maxTitleWidth) {
        titleText = titleText.slice(0, -1);
      }
      titleText = titleText.trimEnd() + "…";
    }
    ctx.fillText(titleText, 40, 55);

    ctx.font = "15px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(`${filled.length} Pokémon · The Ultimate Competitive Pokémon Companion`, 40, 85);

    // Accent line
    const accentGrad = ctx.createLinearGradient(40, 100, 500, 100);
    accentGrad.addColorStop(0, "#8b5cf6");
    accentGrad.addColorStop(1, "#06b6d4");
    ctx.fillStyle = accentGrad;
    ctx.fillRect(40, 100, 460, 3);

    // Header RIGHT - QR + Logo + brand + URL (right-aligned)
    const logo = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "/logo.png";
    });

    // Generate QR code image from share URL
    let qrImage: HTMLImageElement | null = null;
    if (shareUrlForQR) {
      try {
        const qrDataUrl = await QRCode.toDataURL(shareUrlForQR, {
          width: 200,
          margin: 1,
          color: { dark: "#ffffffee", light: "#00000000" },
          errorCorrectionLevel: "M",
        });
        qrImage = await new Promise<HTMLImageElement | null>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = qrDataUrl;
        });
      } catch { /* QR generation failed, skip it */ }
    }

    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Inter, system-ui, sans-serif";
    const brandText = "Champions Lab";
    const brandWidth = ctx.measureText(brandText).width;
    ctx.fillText(brandText, W - 40, 52);

    ctx.font = "bold 18px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#a78bfa";
    ctx.fillText("championslab.xyz", W - 40, 80);

    // Position logo to left of brand text
    let logoRightEdge = W - 40 - brandWidth - 14;
    if (logo) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const logoW = 120;
      const logoH = 80;
      ctx.drawImage(logo, logoRightEdge - logoW, 10, logoW, logoH);
      logoRightEdge = logoRightEdge - logoW - 14;
    }

    // Draw QR code to the left of the logo
    if (qrImage) {
      const qrSize = 86;
      const qrX = logoRightEdge - qrSize;
      const qrY = 8;
      // Subtle rounded background behind QR
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.roundRect(qrX - 6, qrY - 2, qrSize + 12, qrSize + 16, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
      // "Scan to import" label below QR
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "bold 8px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(t('teamBuilder.scanToImport').toUpperCase(), qrX + qrSize / 2, qrY + qrSize + 10);
    }
    ctx.textAlign = "left";

    // Load sprites as images (use mega sprite if slot is mega)
    // Strip CDN prefix so sprites load from same origin (avoids CORS issues with canvas)
    const cdnPrefix = process.env.NEXT_PUBLIC_SPRITE_CDN || "";
    const toLocalUrl = (url: string) => cdnPrefix && url.startsWith(cdnPrefix) ? url.slice(cdnPrefix.length) : url;
    const spritePromises = filled.map(s => {
      const megaForms = s.pokemon!.forms?.filter(f => f.isMega && !f.hidden) ?? [];
      const megaSprite = s.isMega && megaForms[s.megaFormIndex ?? 0]
        ? megaForms[s.megaFormIndex ?? 0].sprite
        : s.pokemon!.sprite;
      return new Promise<HTMLImageElement | null>((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = toLocalUrl(megaSprite);
      });
    });
    const sprites = await Promise.all(spritePromises);

    // Draw Pokémon cards (2 per row)
    filled.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 30 + col * 580;
      const y = headerH + row * cardH;
      const p = s.pokemon!;

      // Card background
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.roundRect(x, y + 10, 560, cardH - 20, 16);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Sprite
      const sprite = sprites[i];
      if (sprite) {
        ctx.drawImage(sprite, x + 15, y + 25, 80, 80);
      }

      // Name + Item
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Inter, system-ui, sans-serif";
      ctx.fillText(p.name, x + 110, y + 48);
      if (s.item) {
        const nameWidth = ctx.measureText(p.name).width;
        ctx.font = "15px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        const itemStart = x + 110 + nameWidth + 10;
        const maxItemWidth = x + 395 - itemStart; // stop before type badges
        let itemText = `@ ${ti(s.item)}`;
        if (maxItemWidth > 30 && ctx.measureText(itemText).width > maxItemWidth) {
          while (itemText.length > 3 && ctx.measureText(itemText + "…").width > maxItemWidth) {
            itemText = itemText.slice(0, -1);
          }
          itemText = itemText.trimEnd() + "…";
        }
        ctx.fillText(itemText, itemStart, y + 48);
      }

      // Nature + Ability
      ctx.font = "15px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      const abilityText = s.isMega && s.preMegaAbility
        ? `${ta(s.preMegaAbility ?? "-")} → ${ta(s.ability ?? "-")}`
        : ta(s.ability ?? "-");
      const info = [s.nature && `${tn(s.nature)} Nature`, abilityText].filter(Boolean).join(" · ");
      ctx.fillText(info, x + 110, y + 72);

      // Moves
      ctx.font = "14px Inter, system-ui, sans-serif";
      s.moves.forEach((m, mi) => {
        const mx = x + 110 + (mi >= 2 ? 150 : 0);
        const my = y + 97 + (mi % 2) * 24;
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.roundRect(mx, my - 14, 140, 22, 6);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(`• ${tm(m)}`, mx + 6, my);
      });

      // Stat Points summary
      const sp = s.statPoints;
      const totalSP = Object.values(sp).reduce((a, b) => a + b, 0);
      if (totalSP > 0) {
        ctx.font = "14px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        const spText = STAT_KEYS.filter(k => sp[k] > 0).map(k => `${sp[k]} ${ts(k)}`).join(" / ");
        ctx.fillText(spText, x + 110, y + 158);
      }

      // Type badges
      p.types.forEach((ty, ti) => {
        const tx = x + 400 + ti * 60;
        const colors: Record<string, string> = {
          fire: "#ef4444", water: "#3b82f6", grass: "#22c55e", electric: "#eab308",
          psychic: "#ec4899", ice: "#67e8f9", dragon: "#7c3aed", dark: "#525252",
          fairy: "#f472b6", fighting: "#dc2626", poison: "#a855f7", ground: "#a16207",
          flying: "#93c5fd", bug: "#84cc16", rock: "#78716c", ghost: "#6d28d9",
          steel: "#94a3b8", normal: "#a1a1aa",
        };
        ctx.fillStyle = colors[ty] || "#888";
        ctx.beginPath();
        ctx.roundRect(tx, y + 30, 52, 22, 8);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(ty.toUpperCase(), tx + 26, y + 45);
        ctx.textAlign = "left";
      });
    });

    // Footer
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(0, H - footerH, W, footerH);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "13px Inter, system-ui, sans-serif";
    ctx.fillText(`${t('teamBuilder.builtWith')} Champions Lab · championslab.xyz`, 40, H - 22);

    ctx.fillStyle = "#8b5cf6";
    ctx.font = "bold 16px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("⚡ Champions Lab", W - 40, H - 22);
    ctx.textAlign = "left";

    const dataUrl = canvas.toDataURL("image/png");
    setShareImageUrl(dataUrl);
    setUrlCopied(false);
    setShowShare(true);
  };

  const downloadShareImage = () => {
    trackEvent("download_share_image", "team_builder", teamName);
    if (!shareImageUrl) return;
    const a = document.createElement("a");
    a.href = shareImageUrl;
    a.download = `${teamName.replace(/\s+/g, "_")}_team.png`;
    a.click();
  };

  const [shareUrl, setShareUrl] = useState("");
  const [urlCopied, setUrlCopied] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const [pasteGenerating, setPasteGenerating] = useState(false);

  const copyShareUrl = async () => {
    trackEvent("copy_share_url", "team_builder", teamName);
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  // Build a secure paste URL: creates a NEW share entry with hidden fields stripped
  const buildPasteUrl = async () => {
    const filled = slots.filter(s => s.pokemon);
    if (filled.length === 0) return "";
    const data = {
      n: teamName,
      s: serializeTeam(slots).map(s => ({
        p: s.pokemonId,
        a: pasteHideAbility ? undefined : s.ability,
        t: pasteHideNature ? undefined : s.nature,
        m: s.moves,
        sp: pasteHideStatPoints ? [0, 0, 0, 0, 0, 0] : [s.statPoints.hp, s.statPoints.attack, s.statPoints.defense, s.statPoints.spAtk, s.statPoints.spDef, s.statPoints.speed],
        i: pasteHideItem ? undefined : s.item,
        mg: s.isMega,
        pa: s.preMegaAbility,
      })),
    };
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { id } = await res.json();
        return `${window.location.origin}/paste?s=${id}`;
      }
    } catch { /* fall through to compressed fallback */ }
    // Fallback: compressed URL
    const compressed = deflateRaw(JSON.stringify(data));
    const b64 = btoa(String.fromCharCode(...compressed))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return `${window.location.origin}/paste?t=${b64}`;
  };

  // Regenerate paste URL when hide options change
  useEffect(() => {
    if (!shareUrl) { setPasteUrl(""); return; }
    setPasteGenerating(true);
    buildPasteUrl().then(url => { setPasteUrl(url); setPasteGenerating(false); });
  }, [pasteHideNature, pasteHideStatPoints, pasteHideItem, pasteHideAbility, shareUrl]);

  const copyPasteUrl = async () => {
    trackEvent("copy_paste_url", "team_builder", teamName);
    if (!pasteUrl) return;
    await navigator.clipboard.writeText(pasteUrl);
    setPasteLinkCopied(true);
    setTimeout(() => setPasteLinkCopied(false), 2000);
  };

  const filledSlots = slots.filter((s) => s.pokemon !== null);
  const usedPokemonIds = filledSlots.map((s) => s.pokemon!.id);
  const teamPokemon = filledSlots.map((s) => s.pokemon!);

  // Engine-powered analysis
  const teamAnalysis = useMemo<TeamAnalysis>(() => {
    return analyzePartialTeam(teamPokemon);
  }, [teamPokemon.map(p => p.id).join(",")]);

  const teammates = useMemo<TeammateSuggestion[]>(() => {
    if (teamPokemon.length >= 6) return [];
    return suggestTeammates(teamPokemon, 8);
  }, [teamPokemon.map(p => p.id).join(",")]);

  const slotSuggestion = useMemo<SlotSuggestion | null>(() => {
    if (selectedSlotIndex === null) return null;
    const slot = slots[selectedSlotIndex];
    if (!slot?.pokemon) return null;
    const otherPokemon = teamPokemon.filter(p => p.id !== slot.pokemon!.id);
    return getSlotSuggestions(slot.pokemon, otherPokemon);
  }, [selectedSlotIndex, teamPokemon.map(p => p.id).join(",")]);

  const addPokemon = (pokemon: ChampionsPokemon) => {
    trackEvent("add_pokemon", "team_builder", pokemon.name);
    if (activeSlot !== null) {
      const sets = suggestSets(pokemon, teamPokemon);
      // When a role filter is active, bias the auto-applied preset toward
      // a tournament set that actually delivers that role.
      const roleSet = pickerRoleFilter
        ? pickSetForRole(USAGE_DATA[pokemon.id] ?? [], pickerRoleFilter)
        : null;
      const bestSet = roleSet ?? (sets.length > 0 ? sets[0].set : null);
      const newSlots = [...slots];

      // Auto-enable mega if the search matched a mega form ability
      const q = pickerSearch.toLowerCase().trim();
      const megaForms = pokemon.forms?.filter(f => f.isMega && !f.hidden) ?? [];
      const megaAbilityMatch = q && pokemon.hasMega && megaForms.length > 0 &&
        !pokemon.abilities.some(a => a.name.toLowerCase().includes(q)) &&
        megaForms.some(f => f.abilities.some(a => a.name.toLowerCase().includes(q)));
      if (megaAbilityMatch) {
        const matchedFormIndex = megaForms.findIndex(f => f.abilities.some(a => a.name.toLowerCase().includes(q)));
        const formIndex = matchedFormIndex >= 0 ? matchedFormIndex : 0;
        const megaAbility = megaForms[formIndex]?.abilities?.[0]?.name;
        const isMegaItem = (item: string) => item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
        const usageSets = USAGE_DATA[pokemon.id] ?? [];
        const megaSet = usageSets.find(s => isMegaItem(s.item) && s.ability === megaAbility);
        const megaItem = megaSet?.item ?? usageSets.find(s => isMegaItem(s.item))?.item;
        newSlots[activeSlot] = {
          pokemon,
          ability: megaAbility ?? bestSet?.ability ?? pokemon.abilities[0]?.name,
          nature: megaSet?.nature ?? bestSet?.nature ?? "Adamant",
          moves: megaSet?.moves ?? bestSet?.moves ?? pokemon.moves.slice(0, 4).map((m) => m.name),
          statPoints: megaSet?.sp ?? bestSet?.sp ?? { ...EMPTY_STAT_POINTS },
          item: megaItem && isItemAvailable(megaItem) ? megaItem : undefined,
          isMega: true,
          megaFormIndex: formIndex,
          preMegaAbility: pokemon.abilities[0]?.name,
        };
      } else {
        newSlots[activeSlot] = {
          pokemon,
          ability: bestSet?.ability ?? pokemon.abilities[0]?.name,
          nature: bestSet?.nature ?? "Adamant",
          moves: bestSet?.moves ?? pokemon.moves.slice(0, 4).map((m) => m.name),
          statPoints: bestSet?.sp ?? { ...EMPTY_STAT_POINTS },
          item: bestSet?.item && isItemAvailable(bestSet.item) ? bestSet.item : undefined,
        };
      }
      setSlots(newSlots);
      setShowPokemonPicker(false);
      setSelectedSlotIndex(activeSlot);
      setActiveSlot(null);
    }
  };

  const removeSlot = (index: number) => {
    trackEvent("remove_pokemon", "team_builder", slots[index]?.pokemon?.name);
    const newSlots = [...slots];
    newSlots[index] = createEmptySlot();
    setSlots(newSlots);
    if (selectedSlotIndex === index) setSelectedSlotIndex(null);
  };

  const loadPrebuiltTeam = (team: PrebuiltTeam) => {
    trackEvent("load_prebuilt_team", "team_builder", team.name);
    const isMegaItem = (item: string) => item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
    const newSlots = team.pokemonIds.map((id, i) => {
      const pokemon = POKEMON_SEED.find(p => p.id === id);
      if (!pokemon) return createEmptySlot();
      const set = team.sets[i];
      let isMega = false;
      let megaFormIndex = 0;
      if (pokemon.hasMega && set?.item && isMegaItem(set.item)) {
        isMega = true;
        const megaForms = pokemon.forms?.filter(f => f.isMega && !f.hidden) ?? [];
        const idx = megaForms.findIndex(f => f.abilities.some(a => a.name === set.ability));
        megaFormIndex = idx >= 0 ? idx : 0;
      }
      return {
        pokemon,
        ability: set?.ability ?? pokemon.abilities[0]?.name,
        moves: set?.moves ?? pokemon.moves.slice(0, 4).map(m => m.name),
        statPoints: set?.sp ?? { ...EMPTY_STAT_POINTS },
        item: set?.item && isItemAvailable(set.item) ? set.item : undefined,
        isMega,
        megaFormIndex,
      } as TeamSlot;
    });
    // Pad to 6 if needed
    while (newSlots.length < 6) newSlots.push(createEmptySlot());
    setSlots(newSlots);
    setTeamName(team.name);
    setCurrentTeamId(undefined);
    setSelectedSlotIndex(0);
  };

  const loadTournamentTeam = (team: ChampionsTournamentTeam) => {
    trackEvent("load_tournament_team", "team_builder", team.player);
    const isMegaItem = (item: string) => item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
    const newSlots = team.pokemonIds.map((id, idx) => {
      const pokemon = POKEMON_SEED.find(p => p.id === id);
      if (!pokemon) return createEmptySlot();
      const tourSet = team.sets?.[idx];
      const usageSets = USAGE_DATA[pokemon.id] ?? [];

      // Find best matching competitive set for nature/EVs fallback
      const bestMatch = tourSet
        ? (usageSets.find(s => s.ability === tourSet.ability && s.item === tourSet.item)
          ?? usageSets.find(s => s.ability === tourSet.ability)
          ?? usageSets.find(s => s.item === tourSet.item)
          ?? usageSets[0])
        : usageSets[0];

      const ability = tourSet?.ability ?? bestMatch?.ability ?? pokemon.abilities[0]?.name;
      const item = tourSet?.item ?? bestMatch?.item;
      const moves = tourSet?.moves ?? bestMatch?.moves ?? pokemon.moves.slice(0, 4).map(m => m.name);
      const teraType = tourSet?.teraType ? (tourSet.teraType.toLowerCase() as PokemonType) : undefined;

      // Detect mega from tournament item
      const isMega = pokemon.hasMega && item ? isMegaItem(item) : false;
      let megaFormIndex = 0;
      if (isMega) {
        const megaForms = pokemon.forms?.filter(f => f.isMega && !f.hidden) ?? [];
        const formIdx = megaForms.findIndex(f => f.abilities.some(a => a.name === ability));
        megaFormIndex = formIdx >= 0 ? formIdx : 0;
      }

      return {
        pokemon,
        ability,
        nature: bestMatch?.nature ?? "Adamant",
        moves,
        statPoints: bestMatch?.sp ? { ...bestMatch.sp } : { ...EMPTY_STAT_POINTS },
        item: item && isItemAvailable(item) ? item : undefined,
        teraType,
        isMega,
        megaFormIndex,
      } as TeamSlot;
    });
    while (newSlots.length < 6) newSlots.push(createEmptySlot());
    setSlots(newSlots);
    setTeamName(`${team.player} - ${team.tournament}`);
    setCurrentTeamId(undefined);
    setSelectedSlotIndex(0);
  };

  const addSuggestedTeammate = (pokemon: ChampionsPokemon) => {
    trackEvent("add_suggested_teammate", "team_builder", pokemon.name);
    const emptyIndex = slots.findIndex(s => !s.pokemon);
    if (emptyIndex === -1) return;
    const sets = suggestSets(pokemon, teamPokemon);
    const bestSet = sets.length > 0 ? sets[0].set : null;
    const isMegaItem = (item: string) => item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
    let isMega = false;
    let megaFormIndex = 0;
    const setItem = bestSet?.item;
    if (pokemon.hasMega && setItem && isMegaItem(setItem)) {
      isMega = true;
      const megaForms = pokemon.forms?.filter(f => f.isMega && !f.hidden) ?? [];
      const idx = megaForms.findIndex(f => f.abilities.some(a => a.name === bestSet?.ability));
      megaFormIndex = idx >= 0 ? idx : 0;
    }
    const newSlots = [...slots];
    newSlots[emptyIndex] = {
      pokemon,
      ability: bestSet?.ability ?? pokemon.abilities[0]?.name,
      nature: bestSet?.nature ?? "Adamant",
      moves: bestSet?.moves ?? pokemon.moves.slice(0, 4).map(m => m.name),
      statPoints: bestSet?.sp ?? { ...EMPTY_STAT_POINTS },
      item: bestSet?.item && isItemAvailable(bestSet.item) ? bestSet.item : undefined,
      isMega,
      megaFormIndex,
    };
    setSlots(newSlots);
    setSelectedSlotIndex(emptyIndex);
  };

  const applySet = (slotIndex: number, set: { ability?: string; moves?: string[]; sp?: StatPoints; nature?: string; item?: string }) => {
    trackEvent("apply_set", "team_builder", slots[slotIndex]?.pokemon?.name);
    const newSlots = [...slots];
    const slot = { ...newSlots[slotIndex] };
    if (set.ability) slot.ability = set.ability;
    if (set.moves) slot.moves = set.moves;
    if (set.sp) slot.statPoints = { ...set.sp };
    if (set.item && isItemAvailable(set.item)) slot.item = set.item;
    if (set.nature) slot.nature = set.nature;
    // Auto-detect mega form from item
    const isMegaItem = (item: string) => item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
    if (set.item && isMegaItem(set.item) && slot.pokemon?.hasMega) {
      slot.isMega = true;
      const megaForms = slot.pokemon.forms?.filter(f => f.isMega && !f.hidden) ?? [];
      const matchedIdx = megaForms.findIndex(f => f.abilities.some(a => a.name === set.ability));
      slot.megaFormIndex = matchedIdx >= 0 ? matchedIdx : 0;
    } else if (set.item && !isMegaItem(set.item)) {
      slot.isMega = false;
      slot.megaFormIndex = 0;
    }
    newSlots[slotIndex] = slot;
    setSlots(newSlots);
  };

  const updateSlot = (index: number, updates: Partial<TeamSlot>) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], ...updates };
    setSlots(newSlots);
  };

  const updateMove = (slotIndex: number, moveIndex: number, moveName: string) => {
    const newSlots = [...slots];
    const moves = [...newSlots[slotIndex].moves];
    moves[moveIndex] = moveName;
    newSlots[slotIndex] = { ...newSlots[slotIndex], moves };
    setSlots(newSlots);
  };

  const updateSP = (slotIndex: number, stat: keyof StatPoints, delta: number) => {
    const sp = { ...slots[slotIndex].statPoints };
    const current = sp[stat];
    const total = Object.values(sp).reduce((a, b) => a + b, 0);
    const newValue = Math.max(0, Math.min(MAX_PER_STAT, current + delta));
    const newTotal = total - current + newValue;
    if (newTotal > MAX_TOTAL_POINTS) {
      setSpToast(t("teamBuilder.spLimitReached"));
      setTimeout(() => setSpToast(null), 2000);
      return;
    }
    sp[stat] = newValue;
    updateSlot(slotIndex, { statPoints: sp });
  };

  const setSPDirect = (slotIndex: number, stat: keyof StatPoints, value: number) => {
    const sp = { ...slots[slotIndex].statPoints };
    const total = Object.values(sp).reduce((a, b) => a + b, 0);
    const remaining = MAX_TOTAL_POINTS - (total - sp[stat]);
    if (value > remaining && remaining < MAX_PER_STAT) {
      setSpToast(t("teamBuilder.spLimitReached"));
      setTimeout(() => setSpToast(null), 2000);
    }
    const clamped = Math.max(0, Math.min(MAX_PER_STAT, remaining, value));
    sp[stat] = clamped;
    updateSlot(slotIndex, { statPoints: sp });
  };

  const allItemNames = useMemo(() => getAllItems(), []);
  const allNatureNames = useMemo(() => getAllNatures(), []);

  const openPicker = (index: number) => {
    setActiveSlot(index);
    setPickerSearch("");
    setPickerTypeFilter(null);
    setPickerCounterFilter(null);
    setPickerRoleFilter(null);
    setPickerStatFilters({ hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, bst: 0 });
    setShowStatFilters(false);
    setShowPokemonPicker(true);
  };

  // Coverage calculation  -  resolve mega types per slot
  const ATE_ABILITIES: Record<string, PokemonType> = {
    Aerilate: "flying", Pixilate: "fairy", Refrigerate: "ice",
    Galvanize: "electric", Dragonize: "dragon",
  };
  const resolveSlotTypes = (s: TeamSlot): PokemonType[] => {
    if (s.isMega && s.pokemon!.forms) {
      const megaForms = s.pokemon!.forms.filter(f => f.isMega && !f.hidden);
      const mf = megaForms[s.megaFormIndex ?? 0];
      if (mf) return mf.types as PokemonType[];
    }
    return s.pokemon!.types;
  };
  const resolveSlotAbility = (s: TeamSlot): string => {
    if (s.ability) return s.ability;
    if (s.isMega && s.pokemon!.forms) {
      const megaForms = s.pokemon!.forms.filter(f => f.isMega && !f.hidden);
      const mf = megaForms[s.megaFormIndex ?? 0];
      if (mf) return mf.abilities[0]?.name ?? s.pokemon!.abilities[0]?.name ?? "";
    }
    return s.pokemon!.abilities[0]?.name ?? "";
  };
  const teamTypes = filledSlots.flatMap((s) => resolveSlotTypes(s));

  // Offensive coverage: check selected moves (slot.moves), not full movepool
  // Accounts for -ate abilities converting Normal-type moves
  const offensiveCoverage: Record<string, number> = {};
  ALL_TYPES.forEach((defType) => {
    let count = 0;
    filledSlots.forEach((s) => {
      const ability = resolveSlotAbility(s);
      const ateType = ATE_ABILITIES[ability];
      // Check if any of this slot's selected moves are SE vs defType
      const hasHit = s.moves.some((moveName) => {
        const moveData = s.pokemon!.moves.find((m) => m.name === moveName);
        if (!moveData || moveData.category === "status") return false;
        // -ate abilities convert Normal moves to the ability's type
        let moveType = moveData.type as PokemonType;
        if (ateType && moveType === "normal") moveType = ateType;
        // Freeze Dry is super effective vs Water regardless of type chart
        if (moveName === "Freeze Dry" && defType === "water") return true;
        const eff = TYPE_CHART[moveType]?.[defType] ?? 1;
        return eff >= 2;
      });
      if (hasHit) count++;
    });
    offensiveCoverage[defType] = count;
  });

  // Defensive profile: count weaknesses, resistances, and immunities per type
  // Uses mega types and accounts for ability-based immunities and resistances
  const ABILITY_RESISTS: Record<string, string[]> = {
    "Thick Fat": ["fire", "ice"],
    "Heatproof": ["fire"],
    "Water Bubble": ["fire"],
    "Purifying Salt": ["ghost"],
  };
  const ABILITY_EXTRA_WEAK: Record<string, string[]> = {
    "Dry Skin": ["fire"],
    "Fluffy": ["fire"],
  };
  const defensiveWeaknesses: Record<string, number> = {};
  const defensiveResists: Record<string, number> = {};
  ALL_TYPES.forEach((atkType) => {
    let weakCount = 0;
    let resistCount = 0;
    filledSlots.forEach((s) => {
      const types = resolveSlotTypes(s);
      let mult = 1;
      for (const t of types) {
        mult *= TYPE_CHART[atkType]?.[t] ?? 1;
      }
      // Apply ability-based type modifiers
      const ability = resolveSlotAbility(s);
      const immuneType = getTypeImmunity(ability);
      if (immuneType === atkType) {
        mult = 0; // Full immunity from ability (Levitate, Water Absorb, etc.)
      }
      if (ABILITY_RESISTS[ability]?.includes(atkType)) {
        mult *= 0.5; // Thick Fat halves Fire/Ice, etc.
      }
      if (ABILITY_EXTRA_WEAK[ability]?.includes(atkType)) {
        mult *= 2; // Dry Skin/Fluffy doubles Fire damage
      }
      if (mult >= 2) weakCount++;
      else if (mult < 1) resistCount++; // includes immunities (0) and resists (0.5, 0.25)
    });
    defensiveWeaknesses[atkType] = weakCount;
    defensiveResists[atkType] = resistCount;
  });

  const matchesPokemonName = (pokemon: ChampionsPokemon, name: string): boolean => {
    const candidate = name.toLowerCase();
    const pName = pokemon.name.toLowerCase();
    if (pName === candidate || pokemon.showdownName?.toLowerCase() === candidate) return true;
    // Showdown regional forms: "Samurott-Hisui" → "Hisuian Samurott", "Ninetales-Alola" → "Alolan Ninetales", etc.
    const regionalSuffixes: Record<string, string> = { hisui: "Hisuian", alola: "Alolan", galar: "Galarian", paldea: "Paldean" };
    const dashIdx = candidate.lastIndexOf("-");
    if (dashIdx > 0) {
      const base = candidate.slice(0, dashIdx);
      const suffix = candidate.slice(dashIdx + 1);
      const prefix = regionalSuffixes[suffix];
      if (prefix && pName === `${prefix.toLowerCase()} ${base}`) return true;
    }
    // Gendered forms: "Basculegion" → "Basculegion-M", "Meowstic" → "Meowstic-M" (default = male in Showdown)
    if (pName === `${candidate}-m`) return true;
    // Also match "Indeedee-F" etc. directly
    if (pName === candidate.replace(/-f$/, "-f") || pName === candidate.replace(/-m$/, "-m")) return true;
    return false;
  };

  // Import from Pokepaste format
  const importPokepaste = (text: string) => {
    trackEvent("import_pokepaste", "team_builder");
    const isMegaItem = (item: string) => item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
    const blocks = text.trim().split(/\n\n+/).filter(Boolean);
    if (blocks.length === 0) { setImportError(t('teamBuilder.noPokemonInPaste')); return; }
    const newSlots: TeamSlot[] = [];
    for (const block of blocks.slice(0, 6)) {
      const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;
      // First line: "Name @ Item" or just "Name"
      const firstLine = lines[0];
      let pokeName = firstLine;
      let item: string | undefined;
      if (firstLine.includes(" @ ")) {
        const parts = firstLine.split(" @ ");
        pokeName = parts[0].trim();
        item = parts[1].trim();
      }
      // Strip gender suffix first (before nickname check, so "(F)" doesn't get mistaken for species)
      pokeName = pokeName.replace(/\s*\((?:M|F)\)\s*$/, "").trim();
      // Handle nicknamed Pokémon: "Nickname (Species)"
      const parenMatch = pokeName.match(/\((.+?)\)/);
      if (parenMatch) pokeName = parenMatch[1].trim();
      // Handle Showdown mega suffixes: "Charizard-Mega-X" → "Charizard", "Lucario-Mega" → "Lucario"
      let showdownMegaSuffix: string | null = null;
      const megaXY = pokeName.match(/^(.+)-Mega-([XY])$/i);
      const megaPlain = pokeName.match(/^(.+)-Mega$/i);
      if (megaXY) {
        pokeName = megaXY[1].trim();
        showdownMegaSuffix = megaXY[2].toUpperCase();
      } else if (megaPlain) {
        pokeName = megaPlain[1].trim();
        showdownMegaSuffix = "";
      }
      const pokemon = POKEMON_SEED.find(p => matchesPokemonName(p, pokeName));
      if (!pokemon) continue;
      let ability: string | undefined;
      let nature: string | undefined;
      const moves: string[] = [];
      const sp: StatPoints = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
      let isNativeSP = false;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("Ability:")) {
          ability = line.replace("Ability:", "").trim();
        } else if (line.endsWith("Nature")) {
          nature = line.replace("Nature", "").trim();
        } else if (line.startsWith("- ")) {
          moves.push(line.slice(2).trim());
        } else if (line.startsWith("EVs:") || line.startsWith("Stat Points:")) {
          const isStatPoints = line.startsWith("Stat Points:");
          const evStr = line.replace(/^(?:EVs|Stat Points):/, "").trim();
          const evParts = evStr.split("/").map(s => s.trim());
          for (const part of evParts) {
            const m = part.match(/(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)/i);
            if (m) {
              const val = parseInt(m[1]);
              const stat = m[2].toLowerCase();
              if (stat === "hp") sp.hp = val;
              else if (stat === "atk") sp.attack = val;
              else if (stat === "def") sp.defense = val;
              else if (stat === "spa") sp.spAtk = val;
              else if (stat === "spd") sp.spDef = val;
              else if (stat === "spe") sp.speed = val;
            }
          }
          // Detect native Stat Points: either "Stat Points:" prefix, or "EVs:" with all values ≤ 32
          // (Showdown now uses the same 0-32 SP system as Champions)
          const maxVal = Math.max(sp.hp, sp.attack, sp.defense, sp.spAtk, sp.spDef, sp.speed);
          const totalVal = sp.hp + sp.attack + sp.defense + sp.spAtk + sp.spDef + sp.speed;
          if ((isStatPoints && maxVal <= MAX_PER_STAT) || (!isStatPoints && maxVal <= MAX_PER_STAT && totalVal <= MAX_TOTAL_POINTS)) isNativeSP = true;
        }
      }
      // Convert Showdown EVs to our stat point system (skip if already native SP)
      const converted = isNativeSP ? sp : evsToStatPoints(sp);
      // Auto-detect mega from item or Showdown suffix
      let isMega = false;
      let megaFormIndex = 0;
      if (pokemon.hasMega) {
        const megaForms = pokemon.forms?.filter(f => f.isMega && !f.hidden) ?? [];
        if (showdownMegaSuffix !== null) {
          // Came from Showdown mega name like "Charizard-Mega-X"
          isMega = true;
          if (showdownMegaSuffix === "X") megaFormIndex = 0;
          else if (showdownMegaSuffix === "Y") megaFormIndex = megaForms.length > 1 ? 1 : 0;
          else megaFormIndex = 0;
          // Auto-assign mega stone if missing
          if (!item) {
            const megaSet = (USAGE_DATA[pokemon.id] ?? []).find(s => isMegaItem(s.item) && s.ability === megaForms[megaFormIndex]?.abilities?.[0]?.name);
            item = megaSet?.item;
          }
          // Auto-assign mega ability if missing
          if (!ability && megaForms[megaFormIndex]) {
            ability = megaForms[megaFormIndex].abilities[0]?.name;
          }
        } else if (item && isMegaItem(item)) {
          // Detected mega from item (standard Showdown format)
          isMega = true;
          if (ability) {
            const idx = megaForms.findIndex(f => f.abilities.some(a => a.name === ability));
            megaFormIndex = idx >= 0 ? idx : 0;
          } else {
            megaFormIndex = 0;
            ability = megaForms[0]?.abilities?.[0]?.name;
          }
        }
      }
      newSlots.push({
        pokemon,
        ability: ability ?? pokemon.abilities[0]?.name,
        nature: nature ?? "Adamant",
        moves: moves.length > 0 ? moves.slice(0, 4) : pokemon.moves.slice(0, 4).map(m => m.name),
        statPoints: converted,
        item,
        isMega,
        megaFormIndex,
      });
    }
    if (newSlots.length === 0) { setImportError(t('teamBuilder.couldNotMatch')); return; }
    while (newSlots.length < 6) newSlots.push(createEmptySlot());
    setSlots(newSlots);
    setCurrentTeamId(undefined);
    setSelectedSlotIndex(0);
    setShowImport(false);
    setImportText("");
    setImportError("");
  };

  // Export to Pokepaste format
  const exportPokepaste = () => {
    const isMegaItem = (item: string) => item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
    return filledSlots
      .map((s) => {
        const p = s.pokemon!;
        // Use Showdown mega naming for mega Pokemon (e.g., Charizard-Mega-Y)
        let exportName = p.showdownName ?? p.name;
        // Convert regional prefix to Showdown suffix: "Hisuian Samurott" → "Samurott-Hisui"
        const regionalPrefixes: Record<string, string> = { hisuian: "Hisui", alolan: "Alola", galarian: "Galar", paldean: "Paldea" };
        for (const [prefix, suffix] of Object.entries(regionalPrefixes)) {
          if (exportName.toLowerCase().startsWith(prefix + " ")) {
            exportName = `${exportName.slice(prefix.length + 1)}-${suffix}`;
            break;
          }
        }
        // Gendered forms: "Basculegion-M" → "Basculegion" (male = default in Showdown), "Meowstic-M" → "Meowstic"
        if (exportName.endsWith("-M") && !exportName.startsWith("Rotom")) {
          exportName = exportName.slice(0, -2);
        }
        if (s.isMega && p.hasMega) {
          const megaForms = p.forms?.filter(f => f.isMega && !f.hidden) ?? [];
          if (megaForms.length > 1) {
            // Multi-form mega: Charizard-Mega-X or Charizard-Mega-Y
            exportName = `${p.name}-Mega-${s.megaFormIndex === 1 ? "Y" : "X"}`;
          } else if (megaForms.length === 1) {
            exportName = `${p.name}-Mega`;
          }
        }
        const nameLine = s.item ? `${exportName} @ ${s.item}` : exportName;
        const lines = [nameLine];
        if (s.ability) lines.push(`Ability: ${s.ability}`);
        if (s.nature) lines.push(`${s.nature} Nature`);

        lines.push(`Level: 50`);
        // Export Stat Points directly as EVs (Showdown now uses the same SP system)
        const spParts = STAT_KEYS
          .map(k => ({ val: s.statPoints[k], label: STAT_LABELS[k] }))
          .filter(e => e.val > 0)
          .map(e => `${e.val} ${e.label}`);
        if (spParts.length > 0) lines.push(`EVs: ${spParts.join(" / ")}`);
        s.moves.forEach((m) => lines.push(`- ${m}`));
        return lines.join("\n");
      })
      .join("\n\n");
  };

  const copyToClipboard = () => {
    trackEvent("export_pokepaste", "team_builder");
    navigator.clipboard.writeText(exportPokepaste());
  };

  const filteredPicker = useMemo(() => {
    const sf = pickerStatFilters;
    const hasStatFilter = sf.hp > 0 || sf.attack > 0 || sf.defense > 0 || sf.spAtk > 0 || sf.spDef > 0 || sf.speed > 0 || sf.bst > 0;
    return POKEMON_SEED.filter((p) => {
      if (p.hidden) return false;
      if (usedPokemonIds.includes(p.id)) return false;
      if (pickerTypeFilter && !p.types.includes(pickerTypeFilter)) return false;
      if (pickerCounterFilter) {
        const counters = p.types.some(t => (TYPE_CHART[t]?.[pickerCounterFilter] ?? 1) >= 2);
        if (!counters) return false;
      }
      if (pickerRoleFilter) {
        const roles = classifyPickerRoles(p, USAGE_DATA[p.id] ?? []);
        if (!roles.has(pickerRoleFilter)) return false;
      }
      if (hasStatFilter) {
        const bs = p.baseStats;
        if (bs.hp < sf.hp || bs.attack < sf.attack || bs.defense < sf.defense ||
            bs.spAtk < sf.spAtk || bs.spDef < sf.spDef || bs.speed < sf.speed) return false;
        if (sf.bst > 0 && (bs.hp + bs.attack + bs.defense + bs.spAtk + bs.spDef + bs.speed) < sf.bst) return false;
      }
      if (pickerSearch === "") return true;
      const q = pickerSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        tp(p.name).toLowerCase().includes(q) ||
        p.types.some((ty) => ty.includes(q) || t(`common.types.${ty}`).toLowerCase().includes(q)) ||
        p.abilities.some((a) => a.name.toLowerCase().includes(q) || ta(a.name).toLowerCase().includes(q)) ||
        p.moves.some((m) => m.name.toLowerCase().includes(q) || tm(m.name).toLowerCase().includes(q)) ||
        (p.hasMega && p.forms?.some((f) => f.isMega && f.abilities.some((a) => a.name.toLowerCase().includes(q) || ta(a.name).toLowerCase().includes(q))))
      );
    });
  }, [pickerSearch, pickerTypeFilter, pickerCounterFilter, pickerRoleFilter, pickerStatFilters, usedPokemonIds, tp, tm, ta, t]);

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
            <div className="shrink-0">
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                  {t('teamBuilder.title')}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('teamBuilder.description')}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <a href="/battle-bot" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400/15 to-yellow-500/15 border border-amber-400/30 text-amber-700 hover:border-amber-400/50 transition-all">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  {t('teamBuilder.poweredBy')}
                </a>
                <LastUpdated page="team-builder" />
              </div>
            </div>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="px-4 py-2 rounded-xl glass border border-gray-200 focus:border-emerald-500/50 focus:outline-none text-lg font-semibold bg-transparent w-full sm:w-64"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap sm:justify-center">
            <button
              onClick={generateShareImage}
              disabled={filledSlots.length === 0}
              className="px-5 py-2 text-sm rounded-xl font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100 shrink-0"
            >
              <Share2 className="w-4 h-4" />
              {t('common.share')}
            </button>
            <button
              onClick={handleSaveTeam}
              disabled={filledSlots.length === 0 || validationErrors.length > 0}
              className={cn(
                "px-4 py-2 text-sm rounded-xl flex items-center gap-2 transition-colors shrink-0",
                saveConfirm
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "glass glass-hover text-muted-foreground hover:text-foreground"
              )}
            >
              {saveConfirm ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveConfirm ? t('common.saved') : t('common.save')}
            </button>
            <button
              onClick={() => setShowSavedTeams(!showSavedTeams)}
              className="px-4 py-2 text-sm rounded-xl glass glass-hover flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <FolderOpen className="w-4 h-4" />
              {t('teamBuilder.myTeamsLoad')}
            </button>
            <button
              onClick={() => { setShowImport(true); setImportText(""); setImportError(""); }}
              className="px-4 py-2 text-sm rounded-xl glass glass-hover flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              {t('common.import')}
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="px-4 py-2 text-sm rounded-xl glass glass-hover flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Upload className="w-4 h-4" />
              {t('common.export')}
            </button>
            <button
              onClick={() => { trackEvent("new_team", "team_builder"); setSlots(Array.from({ length: 6 }, createEmptySlot)); setCurrentTeamId(undefined); setSelectedSlotIndex(null); setTeamName(t('teamBuilder.myTeam')); }}
              className="px-4 py-2 text-sm rounded-xl glass glass-hover flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              {t('teamBuilder.newTeamClear')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Saved Teams Panel */}
      <AnimatePresence>
        {showSavedTeams && savedTeams.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="glass rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                {t('teamBuilder.savedTeams')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {[...savedTeams].sort((a, b) => b.updatedAt - a.updatedAt).map(st => (
                  <div key={st.id} className="flex items-center gap-2 p-3 rounded-xl glass glass-hover">
                    <button
                      onClick={() => handleLoadSavedTeam(st)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-xs font-medium truncate">{st.name}</p>
                      <p className="text-[10px] text-muted-foreground">{st.slots.length} Pokémon · {new Date(st.updatedAt).toLocaleDateString()} {new Date(st.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </button>
                    <button
                      onClick={() => handleDeleteSavedTeam(st.id)}
                      className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showSavedTeams && savedTeams.length === 0 && (
        <div className="mb-6 p-4 rounded-xl bg-gray-50 text-center">
          <p className="text-sm text-muted-foreground">{t('teamBuilder.noSavedTeams')}</p>
        </div>
      )}

      {/* Shared link error */}
      {shareLinkError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {shareLinkError}
          </div>
          <button onClick={() => setShareLinkError(null)} className="text-amber-400/60 hover:text-amber-400 text-xs ml-4">{t('common.dismiss')}</button>
        </motion.div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          {validationErrors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {err}
            </div>
          ))}
        </motion.div>
      )}

      {/* ═══ MAIN THREE-COLUMN LAYOUT ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6" data-team-grid>

        {/* ══ LEFT COLUMN: Team Analysis + Suggested Teammates ══ */}
        <div className="space-y-6 min-w-0 order-2 xl:order-1">
          {/* ── Team Analysis ── */}
          {filledSlots.length >= 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 border border-gray-200/60">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-500" /> {t('teamBuilder.teamAnalysis')}
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <path d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32" fill="none" stroke={teamAnalysis.synergy.overallScore >= 70 ? "#22c55e" : teamAnalysis.synergy.overallScore >= 50 ? "#eab308" : "#ef4444"} strokeWidth="3" strokeDasharray={`${teamAnalysis.synergy.overallScore} 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{teamAnalysis.synergy.overallScore}</span>
                </div>
                <div>
                  <p className="text-base font-semibold">{tRating(teamAnalysis.overallRating)}</p>
                  <p className="text-xs text-muted-foreground">{t('teamBuilder.teamCount', { n: filledSlots.length })}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: t('teamBuilder.typesTab'), value: teamAnalysis.synergy.typeScore, icon: Shield },
                  { label: t('teamBuilder.speedTab'), value: teamAnalysis.synergy.speedScore, icon: Zap },
                  { label: t('teamBuilder.rolesTab'), value: teamAnalysis.synergy.roleScore, icon: Users },
                  { label: t('teamBuilder.archetypeTab'), value: teamAnalysis.synergy.archetypeScore, icon: Target },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="text-center p-1.5 rounded-lg bg-gray-50">
                    <Icon className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                    <p className="text-xs font-bold">{value}</p>
                    <p className="text-[9px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              {teamAnalysis.synergy.detectedArchetypes.length > 0 && (
                <div className="mb-2">
                  <div className="flex flex-wrap gap-1">
                    {teamAnalysis.synergy.detectedArchetypes.map(a => <span key={a.archetype} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-700 capitalize">{tArchetype(a.archetype)} ({Math.round(a.confidence * 100)}%)</span>)}
                  </div>
                </div>
              )}
              <div className="space-y-2 mb-2">
                {teamAnalysis.synergy.strengths.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">{t('teamBuilder.strengths')}</p>
                    {teamAnalysis.synergy.strengths.map((s, i) => <p key={i} className="text-[11px] text-green-700 flex items-start gap-1"><Check className="w-3 h-3 flex-shrink-0 mt-0.5" /> {translateInsight(s)}</p>)}
                  </div>
                )}
                {teamAnalysis.threatAnalysis.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">{t('teamBuilder.issues')}</p>
                    {teamAnalysis.threatAnalysis.map((thr, i) => <p key={i} className="text-[11px] text-amber-700 flex items-start gap-1"><AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {translateInsight(thr)}</p>)}
                  </div>
                )}
              </div>
              {teamAnalysis.criticalWeaknesses.length > 0 && (
                <div className="p-2 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-[10px] text-red-600 font-medium uppercase mb-1">{t('teamBuilder.criticalWeaknesses')}</p>
                  <div className="flex flex-wrap gap-1">
                    {teamAnalysis.criticalWeaknesses.map(type => <span key={type} className="px-2 py-0.5 text-[10px] font-bold uppercase rounded text-white/90" style={{ backgroundColor: `${TYPE_COLORS[type]}CC` }}>{tFullType(type)}</span>)}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Type Coverage ── */}
          {filledSlots.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 border border-gray-200/60">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> {t('teamBuilder.typeCoverage')}
              </h3>
              <div className="grid grid-cols-6 gap-1.5">
                {ALL_TYPES.map((type) => {
                  const se = offensiveCoverage[type] ?? 0;
                  const weak = defensiveWeaknesses[type] ?? 0;
                  const resist = defensiveResists[type] ?? 0;
                  return (
                    <div key={type} className="text-center space-y-0.5">
                      <span className="block w-full py-0.5 text-[7px] font-bold uppercase rounded text-white/90" style={{ backgroundColor: `${TYPE_COLORS[type]}AA` }}>{tt(type)}</span>
                      <span className={cn("block text-[10px] font-bold", se > 0 ? "text-green-600" : "text-muted-foreground/40")}>{se > 0 ? `${se}×` : " - "}</span>
                    </div>
                  );
                })}
              </div>
              {/* Defensive breakdown */}
              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                {/* Defensive Weaknesses */}
                {(() => {
                  const weakTypes = ALL_TYPES
                    .filter(ty => (defensiveWeaknesses[ty] ?? 0) > 0)
                    .map(ty => ({ type: ty, weak: defensiveWeaknesses[ty] ?? 0, resist: defensiveResists[ty] ?? 0 }))
                    .sort((a, b) => (b.weak - b.resist) - (a.weak - a.resist));
                  if (weakTypes.length === 0) return null;
                  return (
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {t('teamBuilder.defensiveWeaknesses')}
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {weakTypes.map(({ type, weak, resist }) => {
                          const net = weak - resist;
                          const bg = net >= 3 ? "bg-red-100 dark:bg-red-950/40 border-red-300 dark:border-red-800" : net >= 1 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
                          return (
                            <div key={type} className={cn("flex items-center gap-1 px-1.5 py-1 rounded-lg border", bg)}>
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[type] }} />
                              <span className="text-[9px] font-semibold uppercase flex-1 truncate">{tFullType(type)}</span>
                              <span className="text-[9px] font-bold text-red-600 dark:text-red-400">{weak}↓</span>
                              {resist > 0 && <span className="text-[9px] font-bold text-green-600 dark:text-green-400">{resist}↑</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                {/* Resistances & Immunities */}
                {(() => {
                  const resistTypes = ALL_TYPES
                    .filter(ty => (defensiveResists[ty] ?? 0) > 0 && (defensiveWeaknesses[ty] ?? 0) === 0)
                    .sort((a, b) => (defensiveResists[b] ?? 0) - (defensiveResists[a] ?? 0));
                  if (resistTypes.length === 0) return null;
                  return (
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> {t('teamBuilder.resistancesImmunities')}
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {resistTypes.map(type => (
                          <div key={type} className="flex items-center gap-1 px-1.5 py-1 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[type] }} />
                            <span className="text-[9px] font-semibold uppercase flex-1 truncate">{tFullType(type)}</span>
                            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">{defensiveResists[type]}↑</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {/* Blind Spots - types the team can't hit super-effectively */}
                {(() => {
                  const uncovered = ALL_TYPES.filter(ty => (offensiveCoverage[ty] ?? 0) === 0);
                  if (uncovered.length === 0) return null;
                  return (
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                        <Target className="w-3 h-3" /> {t('teamBuilder.blindSpots')}
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {uncovered.map(type => (
                          <div key={type} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.06]">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[type] }} />
                            <span className="text-[9px] font-semibold uppercase text-gray-600 dark:text-white truncate">{tFullType(type)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {/* ── Suggested Teammates ── */}
          {filledSlots.length >= 1 && filledSlots.length < 6 && teammates.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 border border-gray-200/60">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-500" /> {t('teamBuilder.suggestedTeammates')}
              </h3>
              <div className="space-y-1.5">
                {teammates.map((s) => (
                  <button key={s.pokemon.id} onClick={() => addSuggestedTeammate(s.pokemon)} className="w-full text-left p-2 rounded-xl glass glass-hover border border-transparent hover:border-cyan-300 transition-all">
                    <div className="flex items-center gap-2">
                      <Image src={s.pokemon.sprite} alt={tp(s.pokemon.name)} width={28} height={28} className="rounded-lg" unoptimized />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold truncate">{tp(s.pokemon.name)}</p>
                        <div className="flex gap-0.5">{s.pokemon.types.map(ty => <span key={ty} className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[ty] }} />)}</div>
                      </div>
                      <span className={cn("text-[11px] font-bold", s.score >= 70 ? "text-green-600" : s.score >= 50 ? "text-amber-600" : "text-gray-400")}>{s.score}</span>
                    </div>
                    {s.reasons.length > 0 && <p className="text-[9px] text-muted-foreground truncate mt-0.5 ml-8">{translateReason(s.reasons[0])}</p>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* ══ CENTER COLUMN: Team Slots + Edit Panel ══ */}
        <div className="space-y-6 min-w-0 order-1 xl:order-2">
          {/* Team Slots */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {slots.map((slot, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative rounded-2xl overflow-hidden border transition-all duration-300 min-h-[200px]",
                  slot.pokemon
                    ? selectedSlotIndex === i
                      ? "glass cursor-pointer"
                      : "glass border-gray-200 hover:border-gray-300 cursor-pointer"
                    : "border-dashed border-gray-300 hover:border-emerald-400 cursor-pointer"
                )}
                style={selectedSlotIndex === i && slot.pokemon ? { outline: "3px solid #3b82f6", outlineOffset: "-1px" } : undefined}
                onClick={() => {
                  if (!slot.pokemon) {
                    openPicker(i);
                  } else {
                    const newIdx = selectedSlotIndex === i ? null : i;
                    setSelectedSlotIndex(newIdx);
                    if (newIdx !== null && window.innerWidth < 768) {
                      setTimeout(() => {
                        const el = editPanelRef.current;
                        if (el) {
                          const y = el.getBoundingClientRect().top + window.scrollY - 80;
                          window.scrollTo({ top: y, behavior: "smooth" });
                        }
                      }, 100);
                    }
                  }
                }}
              >
                {slot.pokemon ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSlot(i); }}
                      className="absolute top-2 right-2 z-20 p-1 rounded-lg bg-white/80 dark:bg-[#1a2540]/80 hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-600 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute top-2 left-2 z-20 w-6 h-6 rounded-lg bg-gray-100 dark:bg-[#1a2540] flex items-center justify-center">
                      <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                    </div>
                    {slot.isMega && (() => {
                      const megaForms = slot.pokemon.forms?.filter(f => f.isMega && !f.hidden) ?? [];
                      const activeMega = megaForms[slot.megaFormIndex ?? 0];
                      const label = megaForms.length > 1 && activeMega ? activeMega.name.replace(slot.pokemon.name, "").replace("Mega ", "").trim() : "MEGA";
                      return (
                        <div className="absolute top-2 left-10 z-20 px-1 rounded bg-amber-200/60 dark:bg-amber-500/20 border border-amber-400/50 dark:border-amber-500/30 flex items-center" style={{ height: 16 }}>
                          <span className="text-[7px] font-bold text-amber-700 dark:text-amber-400">{label || "MEGA"}</span>
                        </div>
                      );
                    })()}
                    {(() => {
                      const megaForms = slot.pokemon.forms?.filter(f => f.isMega && !f.hidden) ?? [];
                      const activeMega = slot.isMega ? megaForms[slot.megaFormIndex ?? 0] : null;
                      const displaySprite = activeMega?.sprite ?? slot.pokemon.officialArt;
                      const displayName = activeMega?.name ?? slot.pokemon.name;
                      const displayTypes = activeMega?.types ?? slot.pokemon.types;
                      return (
                        <>
                          <div
                            className="h-24 flex items-center justify-center"
                            style={{ background: `radial-gradient(ellipse, ${TYPE_COLORS[displayTypes[0]]}15 0%, transparent 70%)` }}
                          >
                            <Image src={displaySprite} alt={displayName} width={80} height={80} className="drop-shadow-lg object-contain" unoptimized />
                          </div>
                          <div className="p-2 space-y-1">
                            <h4 className="text-xs font-semibold truncate">{tp(displayName)}</h4>
                            <div className="flex gap-1">
                              {displayTypes.map((type) => (
                                <span key={type} className="px-1 py-0.5 text-[8px] font-bold uppercase rounded text-white/80" style={{ backgroundColor: `${TYPE_COLORS[type]}AA` }}>{tt(type)}</span>
                              ))}
                            </div>
                            {slot.item && isItemAvailable(slot.item) && <div className="text-[8px] text-amber-700 bg-amber-50 rounded px-1 py-0.5 truncate font-medium">{ti(slot.item)}</div>}
                            {slot.nature && <div className="text-[8px] text-emerald-600 truncate">{tn(slot.nature)}</div>}
                            <div className="space-y-0">
                              {slot.moves.slice(0, 4).filter(Boolean).map((m) => (
                                <div key={m} className="text-[9px] text-muted-foreground truncate">• {tm(m)}</div>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                    <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{t('teamBuilder.slot', { n: i + 1 })}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* ── EDIT PANEL (directly below team slots) ── */}
          <AnimatePresence mode="wait">
            {selectedSlotIndex !== null && slots[selectedSlotIndex]?.pokemon && (() => {
              const editSlotData = slots[selectedSlotIndex];
              const editPkm = editSlotData.pokemon!;
              return (
                <motion.div
                  key={selectedSlotIndex}
                  ref={editPanelRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass rounded-2xl p-5 border border-emerald-200/60"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    {(() => {
                      const megaForms = editPkm.forms?.filter(f => f.isMega && !f.hidden) ?? [];
                      const activeMega = editSlotData.isMega ? megaForms[editSlotData.megaFormIndex ?? 0] : null;
                      const displaySprite = activeMega?.sprite ?? editPkm.officialArt;
                      const displayName = activeMega?.name ?? editPkm.name;
                      const displayTypes = activeMega?.types ?? editPkm.types;
                      return (
                        <div className="flex items-center gap-3">
                          <Image src={displaySprite} alt={displayName} width={48} height={48} className="drop-shadow-md" unoptimized />
                          <div>
                            <h3 className="text-base font-bold flex items-center gap-2">
                              <Settings2 className="w-4 h-4 text-emerald-500" />
                              {tp(displayName)}
                            </h3>
                            <div className="flex gap-1 mt-0.5">
                              {displayTypes.map(ty => (
                                <span key={ty} className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded text-white/80" style={{ backgroundColor: `${TYPE_COLORS[ty]}AA` }}>{ty}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditMode(m => m === "speed" ? "normal" : "speed")}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors",
                          editMode === "speed"
                            ? "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300 hover:bg-pink-200"
                            : "bg-gray-100 text-muted-foreground hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10"
                        )}
                      >
                        <Zap className="w-4 h-4" />
                        <span>Speed Tier</span>
                      </button>
                      <button
                        onClick={() => setEditMode(m => m === "survival" ? "normal" : "survival")}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors",
                          editMode === "survival"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-200"
                            : "bg-gray-100 text-muted-foreground hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10"
                        )}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Survival</span>
                      </button>
                      <button
                        onClick={() => setEditMode(m => m === "damage" ? "normal" : "damage")}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors",
                          editMode === "damage"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 hover:bg-amber-200"
                            : "bg-gray-100 text-muted-foreground hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10"
                        )}
                      >
                        <Swords className="w-4 h-4" />
                        <span>Damage</span>
                      </button>
                      <button onClick={() => setSelectedSlotIndex(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {/* Auto-Fill + Quick Apply Sets */}
                  {editMode === "normal" && <div className="mb-4">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">{t('teamBuilder.quickApply')}</p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const sets = USAGE_DATA[editPkm.id] ?? [];
                        const isMega = editSlotData.isMega || false;
                        const isMegaItem = (item: string) => item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
                        const filteredSets = editPkm.hasMega
                          ? isMega ? sets.filter(s => isMegaItem(s.item)) : sets.filter(s => !isMegaItem(s.item))
                          : sets;
                        const bestSet = filteredSets[0];
                        return (
                          <>
                            {bestSet && (
                              <button
                                onClick={() => applySet(selectedSlotIndex, { ability: bestSet.ability, moves: bestSet.moves, sp: bestSet.sp, nature: bestSet.nature, item: bestSet.item })}
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 hover:border-emerald-400 transition-all text-[11px] font-bold text-emerald-700 flex items-center gap-1.5"
                              >
                                <Zap className="w-3 h-3" /> {t('teamBuilder.autoFill')}
                              </button>
                            )}
                            {filteredSets.slice(bestSet ? 1 : 0, 5).map((s, i) => (
                              <button key={i} onClick={() => applySet(selectedSlotIndex, { ability: s.ability, moves: s.moves, sp: s.sp, nature: s.nature, item: s.item })} className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 transition-all text-[11px] font-medium text-emerald-700">
                                {translateSetName(s.name)}
                              </button>
                            ))}
                          </>
                        );
                      })()}
                      {slotSuggestion && slotSuggestion.altSets.length > 0 && (() => {
                        const shownSetNames = new Set((USAGE_DATA[editPkm.id] ?? []).map(s => s.name));
                        const isMegaItem = (item: string) => item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
                        const isMega = editSlotData.isMega || false;
                        const filtered = slotSuggestion.altSets.filter(s => {
                          if (shownSetNames.has(s.set.name)) return false;
                          if (editPkm.hasMega) {
                            const setIsMega = isMegaItem(s.set.item);
                            if (isMega && !setIsMega) return false;
                            if (!isMega && setIsMega) return false;
                          }
                          return true;
                        });
                        return filtered.slice(0, 3).map((s, i) => (
                        <button key={`sug-${i}`} onClick={() => applySet(selectedSlotIndex, s.set)} className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 transition-all text-[11px] font-medium text-emerald-700">
                            {translateSetName(s.set.name)}
                            <span className={cn("ml-1.5 text-[9px] font-bold", s.matchScore >= 70 ? "text-green-600" : s.matchScore >= 50 ? "text-amber-600" : "text-gray-400")}>{s.matchScore}%</span>
                          </button>
                        ));
                      })()}
                      </div>
                    </div>}

                  <div className={cn("grid gap-5 items-start", editMode !== "normal" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
                    {/* Col 1: Moves */}
                    {editMode === "normal" && <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">{t('teamBuilder.moves')}</p>
                      <div className="space-y-2">
                        {[0, 1, 2, 3].map((moveIdx) => {
                          const currentMove = editSlotData.moves[moveIdx] || "";
                          const sortedMoves = [...editPkm.moves].sort((a, b) => a.name.localeCompare(b.name));
                          const moveData = editPkm.moves.find(m => m.name === currentMove);
                          const suggestedNames = slotSuggestion?.suggestedMoves.map(m => m.name) ?? [];
                          const moveOptions: SearchSelectOption[] = [
                            { value: "", label: t('teamBuilder.emptySlot') },
                            ...sortedMoves.map((m) => ({
                              value: m.name,
                              label: tm(m.name),
                              sub: `${m.type} · ${m.category}${m.power ? ` · ${m.power}bp` : ""}${m.accuracy ? ` · ${m.accuracy}%` : ""} · ${m.pp}pp`,
                              badge: tt(m.type),
                              badgeColor: `${TYPE_COLORS[m.type]}AA`,
                              suggested: suggestedNames.includes(m.name),
                              description: m.description ? tmd(m.name, m.description) : undefined,
                            })),
                          ];
                          return (
                            <SearchSelect
                              key={moveIdx}
                              value={currentMove}
                              options={moveOptions}
                              onChange={(v) => updateMove(selectedSlotIndex, moveIdx, v)}
                              placeholder={t('teamBuilder.emptySlot')}
                              triggerBadge={moveData ? { text: tt(moveData.type), color: `${TYPE_COLORS[moveData.type]}AA` } : null}
                            />
                          );
                        })}
                      </div>
                      {slotSuggestion && slotSuggestion.suggestedMoves.length > 0 && <p className="text-[9px] text-muted-foreground mt-2">{t('teamBuilder.engineRecommended')}</p>}

                      {/* Mega Toggle */}
                      {editPkm.hasMega && (() => {
                        const megaForms = editPkm.forms?.filter(f => f.isMega && !f.hidden) ?? [];
                        const isMega = editSlotData.isMega || false;
                        const activeIdx = editSlotData.megaFormIndex ?? 0;
                        const activeMega = megaForms[activeIdx];
                        const isMegaItem = (item: string) => item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
                        const getMegaStone = (formIndex: number) => {
                          const form = megaForms[formIndex];
                          if (!form) return undefined;
                          const sets = USAGE_DATA[editPkm.id] ?? [];
                          const megaSet = sets.find(s => isMegaItem(s.item) && s.ability === form.abilities[0]?.name);
                          if (megaSet) return megaSet.item;
                          const anySet = sets.find(s => isMegaItem(s.item))?.item;
                          if (anySet) return anySet;
                          // Fallback to item definition for new/uncatalogued megas
                          const suffix = form.name.endsWith(" X") ? " X" : form.name.endsWith(" Y") ? " Y" : form.name.endsWith(" Z") ? " Z" : "";
                          const baseName = editPkm.name.replace(/-M$|-F$/, "");
                          const candidates = Object.values(ITEMS).filter(i => i.isMegaStone && (i.forPokemon === editPkm.name || i.forPokemon === baseName));
                          if (candidates.length === 0) return undefined;
                          if (candidates.length === 1) return candidates[0].name;
                          return candidates.find(i => suffix ? i.name.endsWith(suffix) : !i.name.match(/ite [XYZ]$/))?.name ?? candidates[0].name;
                        };
                        return (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">{t('teamBuilder.megaEvolution')}</p>
                            {megaForms.length <= 1 ? (
                              <button onClick={() => {
                                if (isMega) {
                                  updateSlot(selectedSlotIndex, { isMega: false, megaFormIndex: 0, ability: editSlotData.preMegaAbility || editPkm.abilities[0]?.name, item: undefined, preMegaAbility: undefined });
                                } else {
                                  const ab = megaForms[0]?.abilities?.[0];
                                  if (ab) updateSlot(selectedSlotIndex, { isMega: true, megaFormIndex: 0, ability: ab.name, preMegaAbility: editSlotData.ability || editPkm.abilities[0]?.name, item: getMegaStone(0) });
                                }
                              }} className={cn("px-4 py-2 rounded-lg text-[12px] font-medium border transition-all flex items-center gap-2", isMega ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-gray-50 border-gray-200 hover:bg-amber-50 hover:border-amber-200")}>
                                <Sparkles className="w-4 h-4" />{isMega ? t('teamBuilder.megaActive') : t('teamBuilder.enableMega')}
                              </button>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {megaForms.map((form, fi) => {
                                  const isActive = isMega && activeIdx === fi;
                                  return (
                                    <button key={fi} onClick={() => {
                                      if (isActive) {
                                        updateSlot(selectedSlotIndex, { isMega: false, megaFormIndex: 0, ability: editSlotData.preMegaAbility || editPkm.abilities[0]?.name, item: undefined, preMegaAbility: undefined });
                                      } else {
                                        const ab = form.abilities?.[0];
                                        if (ab) updateSlot(selectedSlotIndex, { isMega: true, megaFormIndex: fi, ability: ab.name, preMegaAbility: editSlotData.ability || editPkm.abilities[0]?.name, item: getMegaStone(fi) });
                                      }
                                    }} className={cn("px-4 py-2 rounded-lg text-[12px] font-medium border transition-all flex items-center gap-2", isActive ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-gray-50 border-gray-200 hover:bg-amber-50 hover:border-amber-200")}>
                                      <Sparkles className="w-4 h-4" />{form.name.replace(editPkm.name, "").replace("Mega ", "").trim() || "Mega"}
                                    </button>
                                  );
                                })}
                                {isMega && (
                                  <button onClick={() => updateSlot(selectedSlotIndex, { isMega: false, megaFormIndex: 0, ability: editPkm.abilities[0]?.name, item: undefined })} className="px-3 py-2 rounded-lg text-[11px] font-medium border border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-200 transition-all text-gray-600">
                                    {t('teamBuilder.disable')}
                                  </button>
                                )}
                              </div>
                            )}
                            {activeMega && isMega && (
                              <div className="mt-1.5 p-2 rounded-lg bg-amber-50/50 border border-amber-100 text-[10px]">
                                <p className="font-medium text-amber-800">{activeMega.name}</p>
                                {activeMega.abilities?.[0] && <p className="text-amber-700 mt-0.5">{ta(activeMega.abilities[0].name)}: {tad(activeMega.abilities[0].name, activeMega.abilities[0].description)}</p>}
                                {getMegaStone(activeIdx) && <p className="text-amber-600 mt-0.5">{t('teamBuilder.item')}: {getMegaStone(activeIdx)}</p>}
                                <p className="text-muted-foreground mt-0.5">{t('teamBuilder.typesLabel')}: {activeMega.types.map(ty => ty.charAt(0).toUpperCase() + ty.slice(1)).join("/")}</p>
                              </div>
                            )}
                            <p className="text-[9px] text-muted-foreground mt-1">{t('teamBuilder.megaNote')}</p>
                          </div>
                        );
                      })()}
                    </div>}

                    {/* Col 2: Ability + Nature + Item */}
                    <div className="space-y-3">
                      {editMode === "normal" && <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">{editSlotData.isMega ? t('teamBuilder.preMegaAbility') : t('teamBuilder.ability')}</p>
                        <div className="space-y-1.5">
                          {(() => {
                            const megaForms = editPkm.forms?.filter(f => f.isMega && !f.hidden) ?? [];
                            const allMegaAbilities: { ab: typeof editPkm.abilities[0]; formIndex: number; formName: string }[] = [];
                            megaForms.forEach((form, fi) => {
                              form.abilities.forEach(ab => {
                                if (!editPkm.abilities.some(a => a.name === ab.name) && !allMegaAbilities.some(m => m.ab.name === ab.name)) {
                                  allMegaAbilities.push({ ab, formIndex: fi, formName: form.name });
                                }
                              });
                            });
                            const isMegaItem = (item: string) => item.endsWith("ite") || item.endsWith("ite X") || item.endsWith("ite Y") || item.endsWith("ite Z");
                            const getMegaStoneForForm = (fi: number) => {
                              const form = megaForms[fi];
                              if (!form) return undefined;
                              const sets = USAGE_DATA[editPkm.id] ?? [];
                              const set = sets.find(s => isMegaItem(s.item) && s.ability === form.abilities[0]?.name)?.item ?? sets.find(s => isMegaItem(s.item))?.item;
                              if (set) return set;
                              // Fallback to item definition for new/uncatalogued megas
                              const suffix = form.name.endsWith(" X") ? " X" : form.name.endsWith(" Y") ? " Y" : form.name.endsWith(" Z") ? " Z" : "";
                              const baseName = editPkm.name.replace(/-M$|-F$/, "");
                              const candidates = Object.values(ITEMS).filter(i => i.isMegaStone && (i.forPokemon === editPkm.name || i.forPokemon === baseName));
                              if (candidates.length === 0) return undefined;
                              if (candidates.length === 1) return candidates[0].name;
                              return candidates.find(i => suffix ? i.name.endsWith(suffix) : !i.name.match(/ite [XYZ]$/))?.name ?? candidates[0].name;
                            };
                            return (
                              <>
                                {editSlotData.isMega && (() => {
                                  const activeMegaForm = megaForms[editSlotData.megaFormIndex ?? 0];
                                  const megaAb = activeMegaForm?.abilities[0];
                                  const preMegaAbility = editSlotData.preMegaAbility || editPkm.abilities[0]?.name || "";
                                  return (
                                    <>
                                      {editPkm.abilities.map((ab) => {
                                        const isActive = preMegaAbility === ab.name;
                                        return (
                                          <button key={ab.name} onClick={() => updateSlot(selectedSlotIndex, { preMegaAbility: ab.name })} className={cn("w-full text-left px-3 py-1.5 rounded-lg text-[11px] border transition-all", isActive ? "bg-emerald-100 border-emerald-300 font-semibold text-emerald-800" : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300")}>
                                            <div className="flex items-center justify-between">
                                              <span>{ta(ab.name)}{ab.isHidden ? " (H)" : ""}</span>
                                              {isActive && <span className="text-[8px] text-emerald-500 font-bold">{t('teamBuilder.activeLabel')}</span>}
                                            </div>
                                            <p className="text-[8px] text-muted-foreground mt-0.5 line-clamp-1">{tad(ab.name, ab.description)}</p>
                                          </button>
                                        );
                                      })}
                                      {megaAb && (
                                        <>
                                          <p className="text-[10px] text-amber-600 font-bold uppercase mt-2 mb-1">{t('teamBuilder.megaAbilityLabel')}</p>
                                          <div className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] border bg-amber-50 border-amber-200 text-amber-800">
                                            <div className="flex items-center justify-between">
                                              <span>{ta(megaAb.name)}<span className="ml-1 text-[9px] text-amber-600 font-bold">{t('teamBuilder.megaLabel')}</span></span>
                                            </div>
                                            <p className="text-[8px] text-muted-foreground mt-0.5 line-clamp-1">{tad(megaAb.name, megaAb.description)}</p>
                                          </div>
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                                {!editSlotData.isMega && (
                                  <>
                                {editPkm.abilities.map((ab) => {
                                  const isActive = editSlotData.ability === ab.name;
                                  const isSugg = slotSuggestion?.suggestedAbilities.some(a => a.name === ab.name);
                                  return (
                                    <button key={ab.name} onClick={() => { updateSlot(selectedSlotIndex, { ability: ab.name, isMega: false, megaFormIndex: 0 }); }} className={cn("w-full text-left px-3 py-1.5 rounded-lg text-[11px] border transition-all", isActive ? "bg-emerald-100 border-emerald-300 font-semibold text-emerald-800" : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300")}>
                                      <div className="flex items-center justify-between">
                                        <span>{ta(ab.name)}{ab.isHidden ? " (H)" : ""}</span>
                                        {isSugg && <span className="text-[8px] text-emerald-500 font-bold">{t('teamBuilder.recLabel')}</span>}
                                      </div>
                                      <p className="text-[8px] text-muted-foreground mt-0.5 line-clamp-1">{tad(ab.name, ab.description)}</p>
                                    </button>
                                  );
                                })}
                                {allMegaAbilities.map(({ ab, formIndex, formName }) => {
                                  const isActive = editSlotData.ability === ab.name;
                                  const isSugg = slotSuggestion?.suggestedAbilities.some(a => a.name === ab.name);
                                  const shortForm = megaForms.length > 1 ? formName.replace(editPkm.name, "").replace("Mega ", "").trim() : "";
                                  return (
                                    <button key={ab.name} onClick={() => { updateSlot(selectedSlotIndex, { ability: ab.name, isMega: true, megaFormIndex: formIndex, preMegaAbility: editSlotData.ability || editPkm.abilities[0]?.name, item: getMegaStoneForForm(formIndex) }); }} className={cn("w-full text-left px-3 py-1.5 rounded-lg text-[11px] border transition-all", isActive ? "bg-amber-100 border-amber-300 font-semibold text-amber-800" : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300")}>
                                      <div className="flex items-center justify-between">
                                        <span>{ta(ab.name)}{shortForm ? ` (${shortForm})` : ""}<span className="ml-1 text-[9px] text-amber-600 font-bold">{t('teamBuilder.megaLabel')}</span></span>
                                        {isSugg && <span className="text-[8px] text-emerald-500 font-bold">{t('teamBuilder.recLabel')}</span>}
                                      </div>
                                      <p className="text-[8px] text-muted-foreground mt-0.5 line-clamp-1">{tad(ab.name, ab.description)}</p>
                                    </button>
                                  );
                                })}
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>}
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{t('teamBuilder.nature')}</p>
                        <SearchSelect
                          value={editSlotData.nature || "Hardy"}
                          options={allNatureNames.map((n) => {
                            const nat = NATURES[n];
                            return {
                              value: n,
                              label: tn(n),
                              sub: nat.plus && nat.minus ? `+${ts(nat.plus)} / -${ts(nat.minus)}` : t('teamBuilder.neutral'),
                              suggested: slotSuggestion?.suggestedNature.nature === n,
                            };
                          })}
                          onChange={(v) => updateSlot(selectedSlotIndex, { nature: v })}
                          placeholder={t('teamBuilder.selectNature')}
                        />
                        {slotSuggestion && <button onClick={() => updateSlot(selectedSlotIndex, { nature: slotSuggestion.suggestedNature.nature })} className="mt-1 text-[9px] text-emerald-600 hover:text-emerald-800 transition-colors">{t('teamBuilder.suggestedPreset')}: {tn(slotSuggestion.suggestedNature.nature)} - {translateNatureReason(slotSuggestion.suggestedNature.reason)}</button>}
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{t('teamBuilder.item')}</p>
                        <SearchSelect
                          value={editSlotData.item || ""}
                          options={[
                            { value: "", label: t('teamBuilder.noItem') },
                            ...allItemNames.map((name) => ({
                              value: name,
                              label: ti(name),
                              sub: tid(name, ITEMS[name]?.description ?? ''),
                            })),
                          ]}
                          onChange={(v) => updateSlot(selectedSlotIndex, { item: v || undefined })}
                          placeholder={t('teamBuilder.noItem')}
                          disabled={editSlotData.isMega}
                        />
                        {editSlotData.isMega && <p className="text-[9px] text-amber-600 mt-1">{t('teamBuilder.megaLocked')}</p>}
                        {!editSlotData.isMega && editSlotData.item && ITEMS[editSlotData.item!] && <p className="text-[9px] text-muted-foreground mt-1">{tid(editSlotData.item!, ITEMS[editSlotData.item!].description)}</p>}
                      </div>
                    </div>

                    {/* Col 3: SP Distribution */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{editMode === "speed" ? "Speed" : t('teamBuilder.statPoints')}</p>
                        {editMode === "normal" && <span className={cn("text-[11px] font-bold", Object.values(editSlotData.statPoints).reduce((a, b) => a + b, 0) >= MAX_TOTAL_POINTS ? "text-red-500" : "text-muted-foreground")}>{Object.values(editSlotData.statPoints).reduce((a, b) => a + b, 0)}/{MAX_TOTAL_POINTS}</span>}
                      </div>
                      {editMode === "normal" && <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-7" />
                        <span className="text-[8px] text-muted-foreground uppercase w-6 text-right">{t('teamBuilder.baseLabel')}</span>
                        <span className="w-5" />
                        <span className="flex-1 text-[8px] text-muted-foreground uppercase text-center">{t('teamBuilder.spLabel')}</span>
                        <span className="w-5" />
                        <span className="w-8" />
                        <span className="text-[8px] text-muted-foreground uppercase w-7 text-right">{t('teamBuilder.totalLabel')}</span>
                      </div>}
                      <div className={cn("space-y-1.5", editMode === "speed" && "py-2 px-3 rounded-lg bg-pink-500/[0.04] border border-pink-200/40", editMode === "survival" && "py-2 px-3 rounded-lg bg-emerald-500/[0.04] border border-emerald-200/40")}>
                        {(() => {
                          const megaForms = editPkm.forms?.filter(f => f.isMega && !f.hidden) ?? [];
                          const activeBase = editSlotData.isMega && megaForms[editSlotData.megaFormIndex ?? 0]
                            ? megaForms[editSlotData.megaFormIndex ?? 0].baseStats
                            : editPkm.baseStats;
                          const nature = (editSlotData.nature || "Hardy") as NatureName;
                          const finalStats = calculateStats(activeBase, editSlotData.statPoints, nature);
                          const nat = NATURES[nature];
                          const keysToShow = editMode === "speed" ? (["speed"] as const) : editMode === "survival" ? (["hp", "defense", "spDef"] as const) : editMode === "damage" ? (["hp", "attack", "defense", "spAtk", "spDef", "speed"] as const) : STAT_KEYS;
                          return keysToShow.map((stat) => {
                            const value = editSlotData.statPoints[stat];
                            const base = activeBase[stat];
                            const final_ = finalStats[stat];
                            const isPlus = nat.plus === stat;
                            const isMinus = nat.minus === stat;
                            return (
                              <div key={stat} className="flex items-center gap-1.5">
                                <span className={cn("text-[10px] font-medium w-7", isPlus ? "text-red-500" : isMinus ? "text-blue-500" : "text-muted-foreground")}>{ts(stat)}</span>
                                <span className="text-[10px] font-bold text-muted-foreground w-6 text-right tabular-nums">{base}</span>
                                <button onClick={() => updateSP(selectedSlotIndex, stat, -2)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><Minus className="w-2.5 h-2.5" /></button>
                                <StatSlider value={value} max={MAX_PER_STAT} step={2} onChange={(v) => setSPDirect(selectedSlotIndex, stat, v)} />
                                <button onClick={() => updateSP(selectedSlotIndex, stat, 2)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><Plus className="w-2.5 h-2.5" /></button>
                                <input type="number" min={0} max={MAX_PER_STAT} value={value} onChange={(e) => setSPDirect(selectedSlotIndex, stat, parseInt(e.target.value) || 0)} className="w-8 text-center text-[10px] font-medium rounded bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-300 py-0.5" />
                                <span className={cn("text-[11px] font-bold w-7 text-right tabular-nums", isPlus ? "text-red-500" : isMinus ? "text-blue-500" : "text-foreground")}>{final_}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      {editMode === "normal" && <div className="mt-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{t('teamBuilder.presets')}</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(STAT_PRESETS).map(([name, sp]) => (
                            <button key={name} onClick={() => updateSlot(selectedSlotIndex, { statPoints: { ...sp } })} className="px-2 py-0.5 text-[9px] rounded bg-gray-50 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors">{t(`common.statPresets.${name}`)}</button>
                          ))}
                          {slotSuggestion && <button onClick={() => updateSlot(selectedSlotIndex, { statPoints: { ...slotSuggestion.suggestedSP.sp } })} className="px-2 py-0.5 text-[9px] rounded bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors font-medium">{t('teamBuilder.suggestedPreset')}</button>}
                        </div>
                      </div>}
                    </div>
                  </div>

                  {/* Inline Speed Tier Panel */}
                  {editMode === "speed" && (() => {
                    const megaForms = editPkm.forms?.filter(f => f.isMega && !f.hidden) ?? [];
                    const activeBase = editSlotData.isMega && megaForms[editSlotData.megaFormIndex ?? 0]
                      ? megaForms[editSlotData.megaFormIndex ?? 0].baseStats
                      : editPkm.baseStats;
                    return (
                      <>
                        <SpeedTierPanel
                          userPokemon={editPkm}
                          userBaseStats={activeBase}
                          userSP={editSlotData.statPoints}
                          userNature={(editSlotData.nature || "Hardy") as NatureName}
                          userItem={editSlotData.item}
                          userAbility={editSlotData.ability}
                          userMoves={editSlotData.moves}
                          onSpeedChange={(value) => setSPDirect(selectedSlotIndex, "speed", value)}
                        />
                        {spToast && (
                          <div className="mt-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-pink-200 dark:border-pink-500/30 text-pink-600 dark:text-pink-400 text-xs font-medium shadow-sm text-center animate-in fade-in slide-in-from-bottom-1">
                            {spToast}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Inline Survival Panel */}
                  {editMode === "survival" && (() => {
                    const megaForms = editPkm.forms?.filter(f => f.isMega && !f.hidden) ?? [];
                    const activeBase = editSlotData.isMega && megaForms[editSlotData.megaFormIndex ?? 0]
                      ? megaForms[editSlotData.megaFormIndex ?? 0].baseStats
                      : editPkm.baseStats;
                    return (
                      <>
                        <SurvivalPanel
                          userPokemon={editPkm}
                          userBaseStats={activeBase}
                          userSP={editSlotData.statPoints}
                          userNature={(editSlotData.nature || "Hardy") as NatureName}
                          userItem={editSlotData.item}
                          userAbility={editSlotData.ability}
                          userMoves={editSlotData.moves}
                          onSPChange={(sp) => updateSlot(selectedSlotIndex, { statPoints: sp })}
                        />
                        {spToast && (
                          <div className="mt-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium shadow-sm text-center animate-in fade-in slide-in-from-bottom-1">
                            {spToast}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Inline Compact Damage Calculator */}
                  {editMode === "damage" && (() => {
                    const megaForms = editPkm.forms?.filter(f => f.isMega && !f.hidden) ?? [];
                    const activeBase = editSlotData.isMega && megaForms[editSlotData.megaFormIndex ?? 0]
                      ? megaForms[editSlotData.megaFormIndex ?? 0].baseStats
                      : editPkm.baseStats;
                    return (
                      <>
                        <CompactDamageCalc
                          userPokemon={editPkm}
                          userBaseStats={activeBase}
                          userSP={editSlotData.statPoints}
                          userNature={(editSlotData.nature || "Hardy") as NatureName}
                          userItem={editSlotData.item}
                          userAbility={editSlotData.ability}
                          userMoves={editSlotData.moves}
                        />
                        {spToast && (
                          <div className="mt-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium shadow-sm text-center animate-in fade-in slide-in-from-bottom-1">
                            {spToast}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Type Defenses & Coverage */}
                  {editMode === "normal" && (() => {
                    const megaForms = editPkm.forms?.filter(f => f.isMega && !f.hidden) ?? [];
                    const activeTypes = editSlotData.isMega && megaForms[editSlotData.megaFormIndex ?? 0]
                      ? megaForms[editSlotData.megaFormIndex ?? 0].types
                      : editPkm.types;
                    const allTypes = getAllTypes();
                    const ABILITY_RESISTS: Record<string, string[]> = {
                      "Thick Fat": ["fire", "ice"],
                      "Heatproof": ["fire"],
                      "Water Bubble": ["fire"],
                      "Purifying Salt": ["ghost"],
                    };
                    const ABILITY_EXTRA_WEAK: Record<string, string[]> = {
                      "Dry Skin": ["fire"],
                      "Fluffy": ["fire"],
                    };
                    const slotAbility = editSlotData.ability || (editSlotData.isMega && megaForms[editSlotData.megaFormIndex ?? 0] ? megaForms[editSlotData.megaFormIndex ?? 0].abilities[0]?.name : undefined) || editPkm.abilities[0]?.name || "";
                    // offensive: best effectiveness from selected moves
                    const selectedMoveData = editSlotData.moves
                      .filter(Boolean)
                      .map(mName => editPkm.moves.find(m => m.name === mName))
                      .filter((m): m is NonNullable<typeof m> => m != null && m.category !== "status");
                    const selectedMoveTypes = selectedMoveData.map(m => m.type);
                    const uniqueMoveTypes = [...new Set(selectedMoveTypes)];
                    const hasFreezeDry = selectedMoveData.some(m => m.name === "Freeze Dry");
                    return (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Defensive */}
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">{t('teamBuilder.typeDefenses')}</p>
                          <div className="grid grid-cols-6 gap-1">
                            {allTypes.map((type) => {
                              let mult = getMatchup(type as PokemonType, activeTypes);
                              const immuneType = getTypeImmunity(slotAbility);
                              if (immuneType === type) {
                                mult = 0;
                              }
                              if (ABILITY_RESISTS[slotAbility]?.includes(type)) {
                                mult *= 0.5;
                              }
                              if (ABILITY_EXTRA_WEAK[slotAbility]?.includes(type)) {
                                mult *= 2;
                              }
                              let label = "";
                              let bg = "bg-gray-50 dark:bg-white/[0.03]";
                              let textColor = "text-gray-300 dark:text-gray-600";
                              if (mult === 0) { label = "0"; bg = "bg-black/60 dark:bg-black/40"; textColor = "text-gray-500 dark:text-gray-500"; }
                              else if (mult === 0.25) { label = "\u00bc"; bg = "bg-emerald-100 dark:bg-emerald-500/20"; textColor = "text-emerald-700 dark:text-emerald-300"; }
                              else if (mult === 0.5) { label = "\u00bd"; bg = "bg-emerald-50 dark:bg-emerald-500/15"; textColor = "text-emerald-600 dark:text-emerald-300"; }
                              else if (mult === 1) { label = ""; }
                              else if (mult === 2) { label = "2\u00d7"; bg = "bg-red-50 dark:bg-red-500/15"; textColor = "text-red-600 dark:text-red-400"; }
                              else if (mult === 4) { label = "4\u00d7"; bg = "bg-red-100 dark:bg-red-500/25"; textColor = "text-red-700 dark:text-red-300"; }
                              return (
                                <div key={type} className={cn("flex flex-col items-center gap-0.5 py-1 rounded-md", bg)}>
                                  <span className="w-full text-center text-[7px] font-bold uppercase text-white/90 rounded px-0.5 py-px leading-none" style={{ backgroundColor: TYPE_COLORS[type as PokemonType] }}>{tt(type)}</span>
                                  <span className={cn("text-[10px] font-bold leading-none min-h-[14px]", textColor)}>{label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* Offensive */}
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">{t('teamBuilder.moveCoverage')}{uniqueMoveTypes.length === 0 ? ` ${t('teamBuilder.pickMoves')}` : ""}</p>
                          <div className="grid grid-cols-6 gap-1">
                            {allTypes.map((type) => {
                              let best = 0;
                              for (const mt of uniqueMoveTypes) {
                                const eff = getMatchup(mt, [type as PokemonType]);
                                if (eff > best) best = eff;
                              }
                              // Freeze Dry is always SE vs Water
                              if (hasFreezeDry && type === "water" && best < 2) best = 2;
                              let label = "";
                              let bg = "bg-gray-50 dark:bg-gray-200/5";
                              let textColor = "text-gray-300 dark:text-gray-600";
                              if (uniqueMoveTypes.length === 0) { label = "\u2014"; }
                              else if (best >= 2) { label = "2\u00d7"; bg = "bg-emerald-50 dark:bg-emerald-500/10"; textColor = "text-emerald-600 dark:text-emerald-400"; }
                              else if (best === 1) { label = "1\u00d7"; textColor = "text-gray-400 dark:text-gray-500"; }
                              else if (best > 0 && best < 1) { label = "\u00bd"; bg = "bg-red-50 dark:bg-red-500/10"; textColor = "text-red-500 dark:text-red-400"; }
                              else { label = "0"; bg = "bg-black/60 dark:bg-black/40"; textColor = "text-gray-500 dark:text-gray-500"; }
                              return (
                                <div key={type} className={cn("flex flex-col items-center gap-0.5 py-1 rounded-md", bg)}>
                                  <span className="w-full text-center text-[7px] font-bold uppercase text-white/90 rounded px-0.5 py-px leading-none" style={{ backgroundColor: TYPE_COLORS[type as PokemonType] }}>{tt(type)}</span>
                                  <span className={cn("text-[10px] font-bold leading-none min-h-[14px]", textColor)}>{label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {slotSuggestion && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] text-muted-foreground mr-1">{t('teamBuilder.roles')}</span>
                        {slotSuggestion.role.roles.map(r => <span key={r} className="px-1.5 py-0.5 text-[9px] rounded bg-gray-100 text-gray-600 capitalize">{t('common.roles.' + r)}</span>)}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })()}
          </AnimatePresence>

        </div>

        {/* ══ RIGHT COLUMN: Tournament Teams + Curated Teams ══ */}
        <div className="space-y-6 order-3" data-right-col>
          {/* ── Tournament Teams ── */}
          <div className="glass rounded-2xl p-5 border border-gray-200/60">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">{t('teamBuilder.tournamentTeams')}</span>
              <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200">{t('teamBuilder.teamsCount', { count: tournamentTeams.length })}</span>
            </h3>
            <p className="text-[10px] text-muted-foreground mb-3">{t('teamBuilder.tournamentTeamsDesc')}</p>
            <div className="space-y-2">
              {tournamentTeams.slice(0, showMoreTournament ? tournamentTeams.length : 6).map((team) => (
                <button key={team.id} onClick={() => loadTournamentTeam(team)} className="w-full text-left p-3 rounded-xl glass border border-gray-200/40 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn("px-1.5 py-0.5 text-[9px] font-bold rounded", team.placement <= 1 ? "bg-amber-100 text-amber-700" : team.placement <= 2 ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-600")}>
                      {team.placement === 1 ? "\uD83E\uDD47" : team.placement === 2 ? "\uD83E\uDD48" : `#${team.placement}`}
                    </span>
                    <h4 className="text-xs font-semibold truncate flex-1">{team.player}</h4>
                    <span className="text-[9px] text-emerald-600 font-medium">{team.wins}W-{team.losses}L</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 truncate">{team.tournament}</p>
                  <div className="flex gap-1">
                    {team.pokemonIds.map(id => { const p = POKEMON_SEED.find(pk => pk.id === id); return p ? <Image key={id} src={p.sprite} alt={tp(p.name)} width={26} height={26} className="rounded" unoptimized /> : null; })}
                  </div>
                </button>
              ))}
            </div>
            {tournamentTeams.length > 6 && (
              <button onClick={() => setShowMoreTournament(!showMoreTournament)} className="w-full mt-3 py-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex items-center justify-center gap-1">
                {showMoreTournament ? <>{t('common.showLess')} <ChevronUp className="w-3.5 h-3.5" /></> : <>{t('common.showAll', { count: tournamentTeams.length })} <ChevronDown className="w-3.5 h-3.5" /></>}
              </button>
            )}
          </div>

          {/* ── Curated Teams ── */}
          <div className="glass rounded-2xl p-5 border border-gray-200/60">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> {t('teamBuilder.curatedTeams')}
              <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-gray-100 text-gray-600">{t('teamBuilder.teamsCount', { count: shuffledTeams.length })}</span>
            </h3>
            <div className="space-y-2">
              {shuffledTeams.slice(0, showMoreCurated ? shuffledTeams.length : 6).map((team) => (
                <button key={team.id} onClick={() => loadPrebuiltTeam(team)} className="w-full text-left p-3 rounded-xl glass border border-transparent hover:border-emerald-300 transition-all">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn("px-1.5 py-0.5 text-[9px] font-bold uppercase rounded", team.tier === "S" ? "bg-amber-100 text-amber-700" : team.tier === "A" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")}>{team.tier}</span>
                    <h4 className="text-xs font-semibold truncate">{team.name}</h4>
                    <div className="ml-auto flex gap-0.5">{team.tags.slice(0, 2).map(tag => <span key={tag} className="px-1 py-0.5 text-[8px] rounded bg-gray-100 text-gray-500 capitalize">{tag}</span>)}</div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 line-clamp-1">{team.description}</p>
                  <div className="flex gap-1">
                    {team.pokemonIds.map(id => { const p = POKEMON_SEED.find(pk => pk.id === id); return p ? <Image key={id} src={p.sprite} alt={tp(p.name)} width={26} height={26} className="rounded" unoptimized /> : null; })}
                  </div>
                </button>
              ))}
            </div>
            {shuffledTeams.length > 6 && (
              <button onClick={() => setShowMoreCurated(!showMoreCurated)} className="w-full mt-3 py-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex items-center justify-center gap-1">
                {showMoreCurated ? <>{t('common.showLess')} <ChevronUp className="w-3.5 h-3.5" /></> : <>{t('common.showAll', { count: shuffledTeams.length })} <ChevronDown className="w-3.5 h-3.5" /></>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImport && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowImport(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-lg glass rounded-2xl border border-gray-200/60 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('teamBuilder.importTitle')}</h3>
                <button onClick={() => setShowImport(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{t('teamBuilder.importPastePrompt')}</p>
              <textarea
                value={importText}
                onChange={(e) => { setImportText(e.target.value); setImportError(""); }}
                placeholder={`Incineroar @ Figy Berry\nAbility: Intimidate\nCareful Nature\nEVs: 252 HP / 4 Def / 252 SpD\n- Flare Blitz\n- Fake Out\n- Darkest Lariat\n- Protect\n\nGarchomp @ Life Orb\n...`}
                className="w-full h-64 rounded-xl p-4 bg-gray-50 border border-gray-200 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              {importError && <p className="text-xs text-red-500 mt-2">{importError}</p>}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => importPokepaste(importText)}
                  disabled={!importText.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  <Upload className="w-4 h-4" />
                  {t('teamBuilder.importBtn')}
                </button>
                <button
                  onClick={() => setShowImport(false)}
                  className="flex-1 py-2.5 rounded-xl glass glass-hover text-sm font-medium flex items-center justify-center gap-2"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExport && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowExport(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-lg glass rounded-2xl border border-gray-200/60 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('teamBuilder.exportTitle')}</h3>
                <button onClick={() => setShowExport(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <textarea
                readOnly
                value={exportPokepaste()}
                className="w-full h-64 rounded-xl p-4 bg-gray-50 border border-gray-200 text-xs font-mono resize-none focus:outline-none"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-200 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {t('teamBuilder.copyPokepaste')}
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify({ name: teamName, slots: slots.filter(s => s.pokemon) }, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${teamName.replace(/\s+/g, "_")}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 py-2.5 rounded-xl glass glass-hover text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t('teamBuilder.downloadJson')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && shareImageUrl && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowShare(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-2xl glass rounded-2xl border border-gray-200/60 p-6 overflow-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('teamBuilder.shareTitle')}</h3>
                <button onClick={() => setShowShare(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-200/60 mb-4">
                <img src={shareImageUrl} alt="Team card" className="w-full" />
              </div>
              {shareUrl && (
                <div className="mb-4 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-gray-100 border border-gray-200 text-gray-600 truncate"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={copyShareUrl}
                    className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5", urlCopied ? "bg-green-100 text-green-700" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200")}
                  >
                    {urlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {urlCopied ? t('common.copied') : t('teamBuilder.copyLink')}
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={downloadShareImage}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                  {t('teamBuilder.downloadImage')}
                </button>
                <button
                  onClick={copyShareUrl}
                  className={cn("flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all", urlCopied ? "bg-green-100 text-green-700" : "glass glass-hover")}
                >
                  {urlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {urlCopied ? t('teamBuilder.linkCopied') : t('teamBuilder.copyLink')}
                </button>
              </div>

              {/* Pokepaste Section */}
              {shareUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200/60 dark:border-white/10">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-indigo-500" />
                    {t('teamBuilder.pokepaste')}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mb-3">{t('teamBuilder.pokepasteDesc')}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="checkbox" checked={pasteHideNature} onChange={e => setPasteHideNature(e.target.checked)} className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5" />
                      {t('teamBuilder.hideNature')}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="checkbox" checked={pasteHideStatPoints} onChange={e => setPasteHideStatPoints(e.target.checked)} className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5" />
                      {t('teamBuilder.hideStatPoints')}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="checkbox" checked={pasteHideItem} onChange={e => setPasteHideItem(e.target.checked)} className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5" />
                      {t('teamBuilder.hideItem')}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="checkbox" checked={pasteHideAbility} onChange={e => setPasteHideAbility(e.target.checked)} className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5" />
                      {t('teamBuilder.hideAbility')}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pasteGenerating ? "..." : pasteUrl}
                      className="flex-1 px-3 py-2 text-xs rounded-lg bg-gray-100 border border-gray-200 text-gray-600 truncate"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={copyPasteUrl}
                      className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0", pasteLinkCopied ? "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400" : "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-500/25")}
                    >
                      {pasteLinkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {pasteLinkCopied ? t('common.copied') : t('teamBuilder.copyPasteLink')}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pokémon Picker Modal */}
      <AnimatePresence>
        {showPokemonPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowPokemonPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-x-3 top-20 bottom-3 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-2xl sm:h-[80vh] glass rounded-2xl border border-gray-200/60 flex flex-col overflow-hidden"
            >
              {/* Picker Header */}
              <div className="p-4 border-b border-gray-200/60">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{t('common.choosePokemon')}</h3>
                  <button onClick={() => setShowPokemonPicker(false)} className="p-1 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={t('teamBuilder.searchPlaceholder')}
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass border border-gray-200 focus:border-emerald-500/50 focus:outline-none text-sm"
                  autoFocus
                />
                {/* Type filter pills */}
                <div className="flex flex-wrap gap-1.5 mt-3 items-center">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mr-1 self-center shrink-0 flex items-center gap-1">
                    <span className="w-1 h-3 rounded-full bg-emerald-400" />
                    {t('teamBuilder.typeFilter')}
                  </span>
                  {(Object.keys(TYPE_COLORS) as PokemonType[]).map((ty) => (
                    <button
                      key={ty}
                      onClick={() => { setPickerTypeFilter(pickerTypeFilter === ty ? null : ty); setPickerCounterFilter(null); }}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all border hover:scale-105",
                        pickerTypeFilter === ty
                          ? "text-white shadow-sm"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                      )}
                      style={pickerTypeFilter === ty ? {
                        backgroundColor: TYPE_COLORS[ty],
                        borderColor: TYPE_COLORS[ty],
                      } : {
                        borderColor: TYPE_COLORS[ty],
                      }}
                    >
                      {t(`common.types.${ty}`)}
                    </button>
                  ))}
                </div>

                {/* Counter type filter pills — collapsible */}
                <div className="mt-3 rounded-xl border border-gray-200/60 dark:border-white/[0.06] overflow-hidden bg-white/40 dark:bg-white/[0.03]">
                  <button
                    onClick={() => setShowCounterFilter(!showCounterFilter)}
                    className="w-full flex items-center justify-between px-3 py-3 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-white">{t('teamBuilder.counterFilter')}</span>
                      {pickerCounterFilter && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                          {t(`common.types.${pickerCounterFilter}`)}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showCounterFilter && "rotate-180")} />
                  </button>

                  {showCounterFilter && (
                    <div className="px-3 pb-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap gap-1.5">
                      {(Object.keys(TYPE_COLORS) as PokemonType[]).map((ty) => (
                        <button
                          key={ty}
                          onClick={() => { setPickerCounterFilter(pickerCounterFilter === ty ? null : ty); setPickerTypeFilter(null); }}
                          className={cn(
                            "px-2 py-[3px] rounded-md text-[10px] font-bold capitalize transition-all border flex items-center gap-1 hover:scale-105",
                            pickerCounterFilter === ty
                              ? "text-white shadow-sm border-transparent"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-dashed hover:border-solid hover:bg-gray-50 dark:hover:bg-gray-700"
                          )}
                          style={pickerCounterFilter === ty ? {
                            backgroundColor: TYPE_COLORS[ty],
                          } : {
                            borderColor: TYPE_COLORS[ty],
                          }}
                        >
                          {pickerCounterFilter === ty && <span className="text-[8px] opacity-80 font-black">2×</span>}
                          {t(`common.types.${ty}`)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Role filter pills — collapsible */}
                <div className="mt-3 rounded-xl border border-gray-200/60 dark:border-white/[0.06] overflow-hidden bg-white/40 dark:bg-white/[0.03]">
                  <button
                    onClick={() => setShowRoleFilter(!showRoleFilter)}
                    className="w-full flex items-center justify-between px-3 py-3 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-white">{t('teamBuilder.rolePreset')}</span>
                      {pickerRoleFilter && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400">
                          {t(`teamBuilder.rolePresets.${pickerRoleFilter}`)}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showRoleFilter && "rotate-180")} />
                  </button>

                  {showRoleFilter && (
                    <div className="px-3 pb-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap gap-1.5">
                      {PICKER_ROLES.map((r) => {
                        const active = pickerRoleFilter === r;
                        return (
                          <button
                            key={r}
                            onClick={() => setPickerRoleFilter(active ? null : r)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize transition-all border",
                              active
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-500 shadow-sm"
                                : "bg-white/40 dark:bg-slate-800/90 text-gray-700 dark:text-slate-100 border-gray-200 dark:border-slate-500/70 hover:border-emerald-400 dark:hover:border-emerald-400 dark:hover:bg-slate-700/90",
                            )}
                            title={t(`teamBuilder.rolePresetDesc`)}
                          >
                            {t(`teamBuilder.rolePresets.${r}`)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Base Stats section */}
                <div className="mt-3 rounded-xl border border-gray-200/60 dark:border-white/[0.06] overflow-hidden bg-white/40 dark:bg-white/[0.03]">
                  <button
                    onClick={() => setShowStatFilters(!showStatFilters)}
                    className="w-full flex items-center justify-between px-3 py-3 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-white">{t('teamBuilder.baseStatFilter')}</span>
                      {Object.values(pickerStatFilters).some(v => v > 0) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          {t('teamBuilder.activeFilters', { count: Object.values(pickerStatFilters).filter(v => v > 0).length })}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showStatFilters && "rotate-180")} />
                  </button>

                  {showStatFilters && (
                    <div className="px-3 pb-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                      <div className="flex justify-end mb-1.5">
                        <button
                          onClick={() => setPickerStatFilters({ hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, bst: 0 })}
                          className={cn(
                            "text-[10px] font-semibold transition-colors",
                            Object.values(pickerStatFilters).some(v => v > 0)
                              ? "text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                              : "text-transparent pointer-events-none"
                          )}
                        >
                          {t('common.clearAll')}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
                        {([
                          { key: "hp" as const, stat: "hp", color: "#ff5959", max: 255 },
                          { key: "attack" as const, stat: "attack", color: "#f5ac78", max: 255 },
                          { key: "defense" as const, stat: "defense", color: "#fae078", max: 255 },
                          { key: "spAtk" as const, stat: "spAtk", color: "#9db7f5", max: 255 },
                          { key: "spDef" as const, stat: "spDef", color: "#a7db8d", max: 255 },
                          { key: "speed" as const, stat: "speed", color: "#fa92b2", max: 255 },
                          { key: "bst" as const, stat: "bst", color: "#888", max: 800 },
                        ]).map(({ key, stat, color, max }) => (
                          <div key={key} className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold w-7 text-right shrink-0" style={{ color }}>{ts(stat)}</span>
                            <input
                              type="range"
                              min={0}
                              max={max}
                              step={key === "bst" ? 10 : 5}
                              value={pickerStatFilters[key]}
                              onChange={(e) => setPickerStatFilters(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                              className="stat-range flex-1 h-1.5 cursor-pointer appearance-none bg-transparent"
                              style={{ accentColor: color, "--stat-color": color } as React.CSSProperties}
                            />
                            <span className={cn(
                              "text-[10px] font-mono w-8 tabular-nums shrink-0 text-right transition-colors",
                              pickerStatFilters[key] > 0 ? "font-bold" : "text-gray-400 dark:text-gray-400"
                            )} style={pickerStatFilters[key] > 0 ? { color } : undefined}>
                              {pickerStatFilters[key] > 0 ? `≥${pickerStatFilters[key]}` : " - "}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Result count */}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-muted-foreground">
                    {t(pickerSearch || pickerTypeFilter || pickerCounterFilter || pickerRoleFilter || Object.values(pickerStatFilters).some(v => v > 0) ? 'teamBuilder.pokemonCount' : 'teamBuilder.pokemonAvailable', { count: filteredPicker.length })}
                  </p>
                </div>
              </div>

              {/* Picker Grid */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {filteredPicker.map((pokemon) => {
                    const q = pickerSearch.toLowerCase().trim();
                    const megaForms = pokemon.forms?.filter(f => f.isMega && !f.hidden) ?? [];
                    const isMegaAbilityMatch = q && pokemon.hasMega && megaForms.length > 0 &&
                      !pokemon.abilities.some(a => a.name.toLowerCase().includes(q)) &&
                      megaForms.some(f => f.abilities.some(a => a.name.toLowerCase().includes(q)));
                    const matchedMegaForm = isMegaAbilityMatch ? megaForms.find(f => f.abilities.some(a => a.name.toLowerCase().includes(q))) ?? megaForms[0] : null;
                    const megaMatchAbility = matchedMegaForm?.abilities[0]?.name ?? null;
                    return (
                    <button
                      key={pokemon.id}
                      onClick={() => addPokemon(pokemon)}
                      className={cn("glass glass-hover rounded-xl p-3 text-left transition-all border border-transparent", isMegaAbilityMatch ? "hover:border-amber-300 ring-1 ring-amber-200" : "hover:border-emerald-300")}
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src={matchedMegaForm?.sprite ?? pokemon.sprite}
                          alt={tp(pokemon.name)}
                          width={40}
                          height={40}
                          className="rounded-lg"
                          unoptimized
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{matchedMegaForm ? matchedMegaForm.name.replace(pokemon.name + " ", "M-").replace(pokemon.name, `M-${tp(pokemon.name)}`) : tp(pokemon.name)}</p>
                          {isMegaAbilityMatch && megaMatchAbility && (
                            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium truncate">{megaMatchAbility}</p>
                          )}
                          <div className="flex gap-1 mt-0.5">
                            {(matchedMegaForm?.types ?? pokemon.types).map((ty) => (
                              <span
                                key={ty}
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: TYPE_COLORS[ty] }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pokémon Detail */}
      <PokemonDetailModal
        pokemon={selectedPokemonDetail}
        onClose={() => setSelectedPokemonDetail(null)}
      />


    </div>
  );
}
