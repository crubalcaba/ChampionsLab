"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Cookie, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleAnalytics } from "./google-analytics";
import { useI18n } from "@/lib/i18n";

const CONSENT_COOKIE = "cl-cookie-consent";
const CONSENT_MAX_AGE_DAYS = 365;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setConsentCookie(value: "granted" | "denied") {
  if (typeof document === "undefined") return;
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${CONSENT_COOKIE}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
}

/**
 * Detect whether the user is in a region that requires prior consent for
 * analytics cookies (GDPR/ePrivacy / UK GDPR / CCPA best-practice).
 * Uses the browser timezone as a heuristic.
 */
function isConsentRequiredRegion(): boolean {
  if (typeof Intl === "undefined") return true;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const euTimezones = [
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Madrid",
    "Europe/Rome",
    "Europe/Amsterdam",
    "Europe/Brussels",
    "Europe/Vienna",
    "Europe/Warsaw",
    "Europe/Prague",
    "Europe/Budapest",
    "Europe/Stockholm",
    "Europe/Copenhagen",
    "Europe/Helsinki",
    "Europe/Dublin",
    "Europe/Lisbon",
    "Europe/Athens",
    "Europe/Sofia",
    "Europe/Bucharest",
    "Europe/Zagreb",
    "Europe/Ljubljana",
    "Europe/Bratislava",
    "Europe/Tallinn",
    "Europe/Riga",
    "Europe/Vilnius",
    "Europe/Luxembourg",
    "Europe/Malta",
    "Europe/Nicosia",
    "Europe/Sarajevo",
    "Europe/Skopje",
    "Europe/Podgorica",
    "Europe/Tirana",
  ];

  if (tz === "Europe/London") return true;
  if (tz === "America/Los_Angeles") return true; // California proxy
  if (euTimezones.includes(tz)) return true;

  return false;
}

export function CookieConsent() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    setMounted(true);
    const existing = getCookie(CONSENT_COOKIE);

    if (existing === "granted" || existing === "denied") {
      setConsent(existing);
      return;
    }

    // No consent cookie yet
    if (isConsentRequiredRegion()) {
      setShowBanner(true);
    } else {
      // Outside EU/UK/CA we still record consent implicitly for transparency,
      // but we do not interrupt the first visit with a banner.
      setConsentCookie("granted");
      setConsent("granted");
    }
  }, []);

  const accept = () => {
    setConsentCookie("granted");
    setConsent("granted");
    setShowBanner(false);
  };

  const decline = () => {
    setConsentCookie("denied");
    setConsent("denied");
    setShowBanner(false);
  };

  if (!mounted) return null;

  return (
    <>
      {consent === "granted" && <GoogleAnalytics />}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
            role="dialog"
            aria-live="polite"
            aria-label={t("cookieConsent.title")}
          >
            <div className="max-w-4xl mx-auto glass rounded-2xl border border-amber-200/80 dark:border-amber-500/30 bg-gradient-to-br from-amber-50/95 to-orange-50/95 dark:from-amber-950/90 dark:to-orange-950/90 shadow-2xl shadow-black/10 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 shrink-0">
                  <Cookie className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    {t("cookieConsent.title")}
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                    {t("cookieConsent.description")}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={decline}
                    className="flex-1 sm:flex-none border-amber-300 dark:border-amber-500/40 hover:bg-amber-100/50 dark:hover:bg-amber-500/10"
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    {t("cookieConsent.decline")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={accept}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    {t("cookieConsent.accept")}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Clears the consent cookie so the banner is shown again on next load. */
export function resetCookieConsent() {
  if (typeof document === "undefined") return;
  document.cookie = `${CONSENT_COOKIE}=;path=/;max-age=0;SameSite=Lax`;
  window.location.reload();
}
