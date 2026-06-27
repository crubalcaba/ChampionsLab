"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import en from "./en.json";
import fr from "./fr.json";
import es from "./es.json";
import it from "./it.json";
import de from "./de.json";
import ptPT from "./pt-PT.json";
import ko from "./ko.json";
import moveDescsPtPT from "./move-descriptions.pt-PT.json";
import abilityDescsPtPT from "./ability-descriptions.pt-PT.json";
import itemDescsPtPT from "./item-descriptions.pt-PT.json";
import pokemonNamesKo from "./pokemon-names.ko.json";
import movesKo from "./moves.ko.json";
import abilitiesKo from "./abilities.ko.json";
import itemsKo from "./items.ko.json";
import naturesKo from "./natures.ko.json";
import moveDescsKo from "./move-descriptions.ko.json";
import abilityDescsKo from "./ability-descriptions.ko.json";
import itemDescsKo from "./item-descriptions.ko.json";
import pokemonNamesFr from "./pokemon-names.fr.json";
import pokemonNamesEs from "./pokemon-names.es.json";
import pokemonNamesIt from "./pokemon-names.it.json";
import pokemonNamesDe from "./pokemon-names.de.json";
import movesFr from "./moves.fr.json";
import movesEs from "./moves.es.json";
import movesIt from "./moves.it.json";
import movesDe from "./moves.de.json";
import moveDescsFr from "./move-descriptions.fr.json";
import moveDescsEs from "./move-descriptions.es.json";
import moveDescsIt from "./move-descriptions.it.json";
import moveDescsDe from "./move-descriptions.de.json";
import moveDescsEn from "./move-descriptions.en.json";
import abilitiesFr from "./abilities.fr.json";
import abilitiesEs from "./abilities.es.json";
import abilitiesIt from "./abilities.it.json";
import abilitiesDe from "./abilities.de.json";
import abilityDescsFr from "./ability-descriptions.fr.json";
import abilityDescsEs from "./ability-descriptions.es.json";
import abilityDescsIt from "./ability-descriptions.it.json";
import abilityDescsDe from "./ability-descriptions.de.json";
import abilityDescsEn from "./ability-descriptions.en.json";
import itemsFr from "./items.fr.json";
import itemsEs from "./items.es.json";
import itemsIt from "./items.it.json";
import itemsDe from "./items.de.json";
import itemDescsFr from "./item-descriptions.fr.json";
import itemDescsEs from "./item-descriptions.es.json";
import itemDescsIt from "./item-descriptions.it.json";
import itemDescsDe from "./item-descriptions.de.json";
import itemDescsEn from "./item-descriptions.en.json";
import naturesFr from "./natures.fr.json";
import naturesEs from "./natures.es.json";
import naturesIt from "./natures.it.json";
import naturesDe from "./natures.de.json";

/* ── Supported locales ── */
export type Locale = "en" | "fr" | "es" | "es-419" | "pt-PT" | "pt-BR" | "it" | "de" | "th" | "ko";

/* ── UI translation dictionaries ── */
type Dict = typeof en;
const UI_TRANSLATIONS: Record<string, Dict> = { en, fr, es: es as Dict, it: it as Dict, de: de as Dict, "pt-PT": ptPT as Dict, ko: ko as Dict };

/* ── Pokémon name dictionaries (en → localised) ── */
const POKEMON_NAMES: Record<string, Record<string, string>> = {
  fr: pokemonNamesFr as Record<string, string>,
  es: pokemonNamesEs as Record<string, string>,
  it: pokemonNamesIt as Record<string, string>,
  de: pokemonNamesDe as Record<string, string>,
  ko: pokemonNamesKo as Record<string, string>,
};

/* ── Game data dictionaries (en → localised) ── */
const MOVE_NAMES: Record<string, Record<string, string>> = {
  fr: movesFr as Record<string, string>,
  es: movesEs as Record<string, string>,
  it: movesIt as Record<string, string>,
  de: movesDe as Record<string, string>,
  ko: movesKo as Record<string, string>,
};
const ABILITY_NAMES: Record<string, Record<string, string>> = {
  fr: abilitiesFr as Record<string, string>,
  es: abilitiesEs as Record<string, string>,
  it: abilitiesIt as Record<string, string>,
  de: abilitiesDe as Record<string, string>,
  ko: abilitiesKo as Record<string, string>,
};
const ITEM_NAMES: Record<string, Record<string, string>> = {
  fr: itemsFr as Record<string, string>,
  es: itemsEs as Record<string, string>,
  it: itemsIt as Record<string, string>,
  de: itemsDe as Record<string, string>,
  ko: itemsKo as Record<string, string>,
};
const NATURE_NAMES: Record<string, Record<string, string>> = {
  fr: naturesFr as Record<string, string>,
  es: naturesEs as Record<string, string>,
  it: naturesIt as Record<string, string>,
  de: naturesDe as Record<string, string>,
  ko: naturesKo as Record<string, string>,
};

const MOVE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  en: moveDescsEn as Record<string, string>,
  fr: moveDescsFr as Record<string, string>,
  es: moveDescsEs as Record<string, string>,
  it: moveDescsIt as Record<string, string>,
  de: moveDescsDe as Record<string, string>,
  "pt-PT": moveDescsPtPT as Record<string, string>,
  ko: moveDescsKo as Record<string, string>,
};

const ABILITY_DESCRIPTIONS: Record<string, Record<string, string>> = {
  en: abilityDescsEn as Record<string, string>,
  fr: abilityDescsFr as Record<string, string>,
  es: abilityDescsEs as Record<string, string>,
  it: abilityDescsIt as Record<string, string>,
  de: abilityDescsDe as Record<string, string>,
  "pt-PT": abilityDescsPtPT as Record<string, string>,
  ko: abilityDescsKo as Record<string, string>,
};

const ITEM_DESCRIPTIONS: Record<string, Record<string, string>> = {
  en: itemDescsEn as Record<string, string>,
  fr: itemDescsFr as Record<string, string>,
  es: itemDescsEs as Record<string, string>,
  it: itemDescsIt as Record<string, string>,
  de: itemDescsDe as Record<string, string>,
  "pt-PT": itemDescsPtPT as Record<string, string>,
  ko: itemDescsKo as Record<string, string>,
};

/* ── Helpers ── */
function getNestedValue(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

/* ── Context ── */
interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Look up a dotted key like "nav.pokedex". Falls back to English, then the key itself. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Translate a Pokémon name. Returns the localised name or the English name if unavailable. */
  tp: (englishName: string) => string;
  /** Translate a move name. */
  tm: (englishName: string) => string;
  /** Translate an ability name. */
  ta: (englishName: string) => string;
  /** Translate an item name. */
  ti: (englishName: string) => string;
  /** Translate a nature name. */
  tn: (englishName: string) => string;
  /** Translate a stat key (hp, attack, etc.) to its short localised label. */
  ts: (statKey: string) => string;
  /** Translate a type name to its short localised abbreviation (e.g. "fire" → "FEU" in French). */
  tt: (typeName: string) => string;
  /** Translate a type name to its full localised name (e.g. "fire" → "Feu" in French). */
  tty: (typeName: string) => string;
  /** Translate a move description. Falls back to the English description from PokeAPI, then the raw description. */
  tmd: (englishMoveName: string, fallbackDesc: string) => string;
  /** Translate an ability description. */
  tad: (englishAbilityName: string, fallbackDesc: string) => string;
  /** Translate an item description. */
  tid: (englishItemName: string, fallbackDesc: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/* ── Provider ── */
export function I18nProvider({ children, initialLocale = "en" }: { children: ReactNode; initialLocale?: string }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale as Locale);

  // Sync localStorage → state on mount (handles stale state edge case)
  useEffect(() => {
    const stored = localStorage.getItem("championslab-lang") as Locale | null;
    if (stored && stored !== locale) {
      setLocaleState(stored);
      document.documentElement.lang = stored.split("-")[0];
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("championslab-lang", l);
    document.documentElement.lang = l.split("-")[0];
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const dict = UI_TRANSLATIONS[locale] ?? UI_TRANSLATIONS.en;
      let value = getNestedValue(dict, key) ?? getNestedValue(en, key) ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return value;
    },
    [locale]
  );

  const tp = useCallback(
    (englishName: string): string => {
      if (locale === "en") return englishName;
      return POKEMON_NAMES[locale]?.[englishName] ?? englishName;
    },
    [locale]
  );

  const tm = useCallback(
    (englishName: string): string => {
      if (locale === "en") return englishName;
      return MOVE_NAMES[locale]?.[englishName] ?? englishName;
    },
    [locale]
  );

  const ta = useCallback(
    (englishName: string): string => {
      if (locale === "en") return englishName;
      return ABILITY_NAMES[locale]?.[englishName] ?? englishName;
    },
    [locale]
  );

  const ti = useCallback(
    (englishName: string): string => {
      if (locale === "en") return englishName;
      return ITEM_NAMES[locale]?.[englishName] ?? englishName;
    },
    [locale]
  );

  const tn = useCallback(
    (englishName: string): string => {
      if (locale === "en") return englishName;
      return NATURE_NAMES[locale]?.[englishName] ?? englishName;
    },
    [locale]
  );

  const ts = useCallback(
    (statKey: string): string => {
      const dict = UI_TRANSLATIONS[locale] ?? UI_TRANSLATIONS.en;
      return (dict as any).common?.stats?.[statKey] ?? (en as any).common?.stats?.[statKey] ?? statKey;
    },
    [locale]
  );

  const tt = useCallback(
    (typeName: string): string => {
      const key = typeName.toLowerCase();
      const dict = UI_TRANSLATIONS[locale] ?? UI_TRANSLATIONS.en;
      return (dict as any).common?.typeShort?.[key] ?? (en as any).common?.typeShort?.[key] ?? typeName.slice(0, 3).toUpperCase();
    },
    [locale]
  );

  const tty = useCallback(
    (typeName: string): string => {
      const key = typeName.toLowerCase();
      const dict = UI_TRANSLATIONS[locale] ?? UI_TRANSLATIONS.en;
      return (dict as any).common?.typeFull?.[key] ?? (en as any).common?.typeFull?.[key] ?? typeName;
    },
    [locale]
  );

  const tmd = useCallback(
    (englishMoveName: string, fallbackDesc: string): string => {
      return MOVE_DESCRIPTIONS[locale]?.[englishMoveName] ?? MOVE_DESCRIPTIONS.en?.[englishMoveName] ?? fallbackDesc;
    },
    [locale]
  );

  const tad = useCallback(
    (englishAbilityName: string, fallbackDesc: string): string => {
      return ABILITY_DESCRIPTIONS[locale]?.[englishAbilityName] ?? ABILITY_DESCRIPTIONS.en?.[englishAbilityName] ?? fallbackDesc;
    },
    [locale]
  );

  const tid = useCallback(
    (englishItemName: string, fallbackDesc: string): string => {
      return ITEM_DESCRIPTIONS[locale]?.[englishItemName] ?? ITEM_DESCRIPTIONS.en?.[englishItemName] ?? fallbackDesc;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tp, tm, ta, ti, tn, ts, tt, tty, tmd, tad, tid }}>
      {children}
    </I18nContext.Provider>
  );
}

/* ── Hook ── */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}
