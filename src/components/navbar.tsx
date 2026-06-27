"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Swords,
  Grid3X3,
  Users,
  TrendingUp,
  GraduationCap,
  Heart,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n";

const NAV_ITEMS = [
  { href: "/", i18nKey: "nav.pokedex", icon: Grid3X3 },
  { href: "/team-builder", i18nKey: "nav.teamBuilder", icon: Users },
  { href: "/battle-bot", i18nKey: "nav.battleBot", icon: Swords },
  { href: "/meta", i18nKey: "nav.meta", icon: TrendingUp },
  { href: "/learn", i18nKey: "nav.pokeSchool", icon: GraduationCap },
  { href: "/about", i18nKey: "nav.about", icon: Heart },
];

// First 3 items shown in the bar at tablet widths (800–1139px)
const PRIMARY_NAV = NAV_ITEMS.slice(0, 3);
const SECONDARY_NAV = NAV_ITEMS.slice(3);

export function Navbar() {
  const pathname = usePathname();
  const { t } = useI18n();

  // Close mobile nav on route change (body class is set by inline script in layout)
  useEffect(() => {
    document.body.classList.remove('mobile-open');
  }, [pathname]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
                <Image
                  src="/logo.png"
                  alt="Not exactly Champions Lab"
                  width={76}
                  height={60}
                  className="-my-3"
                  unoptimized
                />
              </div>
              <div className="hidden sm:block leading-none">
                <span className="block text-[9px] font-medium tracking-widest uppercase text-muted-foreground/80 -mb-0.5">
                  Not exactly
                </span>
                <span className="text-lg font-bold tracking-tight whitespace-nowrap bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 bg-clip-text text-transparent font-heading">
                  Champions Lab
                </span>
                <span className="hidden md:block text-[10px] text-muted-foreground -mt-1 tracking-widest uppercase">
                  {t('nav.subtitle')}
                </span>
              </div>
            </Link>

            {/* Desktop Nav  -  all items, ≥1140px */}
            <nav className="hidden desktop:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => trackEvent("nav_click", "navigation", t(item.i18nKey))}
                    className={cn(
                      "relative px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap",
                      isActive
                        ? "text-foreground bg-gray-900/[0.05] border border-gray-900/[0.08]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{t(item.i18nKey)}</span>
                  </Link>
                );
              })}
              <LanguageSelector />
            </nav>

            {/* Tablet Nav  -  primary items only, 800–1139px */}
            <nav className="tablet-nav items-center gap-1">
              {PRIMARY_NAV.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => trackEvent("nav_click", "navigation", t(item.i18nKey))}
                    className={cn(
                      "relative px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap",
                      isActive
                        ? "text-foreground bg-gray-900/[0.05] border border-gray-900/[0.08]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{t(item.i18nKey)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile nav panel  -  visibility controlled by body.mobile-open class (set by inline script in layout) */}
        <nav className="mobile-nav-panel border-t border-gray-200/60 px-4 py-3 space-y-1">
          {/* All items shown < 800px, only secondary shown 800–1139px */}
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const isPrimary = PRIMARY_NAV.includes(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => trackEvent("nav_click", "navigation", `mobile_${t(item.i18nKey)}`)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isPrimary && "tablet-hide-item",
                  isActive
                    ? "bg-gray-900/[0.05] text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-900/[0.03]"
                )}
              >
                <item.icon className="w-5 h-5" />
                {t(item.i18nKey)}
              </Link>
            );
          })}
          <div className="px-4 pt-2">
            <LanguageSelector mobile />
          </div>
        </nav>
      </header>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
}
