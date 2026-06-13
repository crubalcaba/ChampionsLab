"use client";

import Link from "next/link";
import { Shield, FileText, Cookie } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { resetCookieConsent } from "./cookie-consent";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="relative z-10 border-t border-gray-200/60 dark:border-gray-800/60 bg-background/80 backdrop-blur-sm mt-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("footer.disclaimer")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              {t("footer.privacy")}
            </Link>
            <Link
              href="/terms"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              {t("footer.terms")}
            </Link>
            <button
              type="button"
              onClick={resetCookieConsent}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Cookie className="w-3.5 h-3.5" />
              {t("footer.cookieSettings")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
