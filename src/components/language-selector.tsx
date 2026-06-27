"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n, type Locale } from "@/lib/i18n";

/* ── Country flag as a tiny rounded image from flagcdn ── */
function Flag({ code, size = 20 }: { code: string; size?: number }) {
  const w = size;
  const h = Math.round(size * 0.67); // ~3:2 real flag ratio
  return (
    <span
      className="inline-block rounded-[3px] overflow-hidden shadow-sm ring-1 ring-black/10 dark:ring-white/20 bg-gray-100 dark:bg-gray-700"
      style={{ width: w, height: h }}
    >
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
        width={w}
        height={h}
        alt=""
        className="block object-cover"
        style={{ width: w, height: h }}
        loading="lazy"
      />
    </span>
  );
}

const LANGUAGES: { code: string; flag: string; label: string; sub?: string }[] = [
  { code: "en",    flag: "gb", label: "English" },
  { code: "fr",    flag: "fr", label: "Français" },
  { code: "es",    flag: "es", label: "Español" },
  { code: "it",    flag: "it", label: "Italiano" },
  { code: "de",    flag: "de", label: "Deutsch" },
  { code: "pt-PT", flag: "pt", label: "Português" },
  { code: "ko",    flag: "kr", label: "한국어" },
];

export function LanguageSelector({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const { locale, setLocale, t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
          "hover:bg-black/5 dark:hover:bg-white/10",
          open && "bg-black/5 dark:bg-white/10"
        )}
        aria-label="Select language"
        aria-expanded={open}
      >
        <Flag code={current.flag} size={18} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "absolute top-full mt-2 w-60 z-[60]",
              mobile ? "left-0" : "right-0",
              "rounded-2xl p-1.5 overflow-hidden",
              "bg-white/80 dark:bg-[rgba(14,21,40,0.88)]",
              "backdrop-blur-xl",
              "border border-gray-200/60 dark:border-white/10",
              "shadow-xl shadow-black/10 dark:shadow-black/40",
              "ring-1 ring-black/[0.03] dark:ring-white/[0.05]"
            )}
          >
            <div className="px-3 pt-2 pb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {t("nav.language")}
              </p>
            </div>

            <div className="space-y-0.5">
              {LANGUAGES.map((lang, i) => {
                const isSelected = locale === lang.code;
                return (
                  <motion.button
                    key={lang.code}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.15 }}
                    onClick={() => {
                      setLocale(lang.code as Locale);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-left group",
                      isSelected
                        ? "bg-gradient-to-r from-violet-500/10 to-cyan-500/10 dark:from-violet-500/20 dark:to-cyan-500/20"
                        : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    )}
                  >
                    <Flag code={lang.flag} size={22} />
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "block leading-tight",
                        isSelected ? "font-semibold text-foreground" : "font-medium text-foreground/80 group-hover:text-foreground"
                      )}>
                        {lang.label}
                      </span>
                      {lang.sub && (
                        <span className="text-[10px] text-muted-foreground/60 leading-tight">
                          {lang.sub}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
