import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Inter, JetBrains_Mono, Sora, Noto_Color_Emoji } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { LazyParticles } from "@/components/lazy-particles";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeInit } from "@/components/theme-init";
import { MobileNavInit } from "@/components/mobile-nav-init";
import { CookieConsent } from "@/components/cookie-consent";
import { I18nProvider } from "@/lib/i18n";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const notoColorEmoji = Noto_Color_Emoji({
  variable: "--font-emoji",
  weight: "400",
  subsets: ["emoji"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Champions Lab - Pokémon Champions 2026",
  description:
    "The ultimate competitive companion for Pokémon Champions. Season tracking, team builder, battle simulator, and deep Pokémon data - all in one immersive hub.",
  keywords: ["Pokemon Champions", "VGC", "team builder", "battle simulator", "competitive Pokemon", "Pokemon Champions 2026", "VGC team builder", "Pokemon meta"],
  metadataBase: new URL("https://championslab.xyz"),
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Champions Lab - Pokémon Champions 2026",
    description: "The ultimate competitive companion for Pokémon Champions. Team builder, battle simulator, META analysis, and VGC learning - all in one hub.",
    url: "https://championslab.xyz",
    siteName: "Champions Lab",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Champions Lab - Pokémon Champions 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Champions Lab - Pokémon Champions 2026",
    description: "The ultimate competitive companion for Pokémon Champions. Team builder, battle simulator, META analysis & more.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://championslab.xyz",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = cookieStore.get("cl-lang")?.value ?? "en";
  const themeCookie = cookieStore.get("cl-theme")?.value;
  const isDark = themeCookie === "dark";

  return (
    <html
      lang={initialLocale.split("-")[0]}
      className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} ${notoColorEmoji.variable} h-full antialiased ${isDark ? "dark" : ""}`}
      style={{ colorScheme: isDark ? "dark" : "light" }}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <I18nProvider initialLocale={initialLocale}>
        <LazyParticles />
        <CookieConsent />
        {/* Pure HTML hamburger  -  works instantly, no React hydration needed */}
        <button
          id="mobile-nav-toggle"
          className="mobile-nav-btn"
          aria-label="Toggle menu"
          suppressHydrationWarning
        >
          <svg className="hamburger-open w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg className="hamburger-close w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <MobileNavInit />
        <ThemeInit />
        <Navbar />
        <Suspense>
          <main className="flex-1 relative z-10">{children}</main>
        </Suspense>
        <Footer />
        <ThemeToggle />
        </I18nProvider>
      </body>
    </html>
  );
}
