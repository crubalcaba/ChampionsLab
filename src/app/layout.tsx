import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { LazyParticles } from "@/components/lazy-particles";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeInit } from "@/components/theme-init";
import { MobileNavInit } from "@/components/mobile-nav-init";
import { I18nProvider } from "@/lib/i18n";

// GitHub Pages serves the site under /ChampionsLab/. Next auto-prefixes
// next/link, usePathname, and _next/static/* with basePath, but it does
// NOT prefix user-supplied URLs in `metadata.icons` — those render as
// raw <link rel="icon" href="..."> and 404 without the prefix. Inline the
// basePath the same way navbar.tsx and export-pdf.ts do.
// (openGraph/twitter images don't need this — `metadataBase` makes them
//  absolute against championslab.xyz.)
// See .copilot-wiki/github-pages-deployment.md.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const inter = localFont({
  variable: "--font-sans",
  src: "./fonts/Inter-Variable.woff2",
  display: "swap",
});

const sora = localFont({
  variable: "--font-heading",
  src: "./fonts/Sora-Variable.woff2",
  display: "swap",
});

const jetbrainsMono = localFont({
  variable: "--font-mono",
  src: "./fonts/JetBrainsMono-Variable.woff2",
  display: "swap",
});

const notoColorEmoji = localFont({
  variable: "--font-emoji",
  src: "./fonts/NotoColorEmoji.woff2",
  display: "swap",
});

// Inline script that runs before React hydrates. Reads localStorage to set
// <html lang> + dark class, eliminating the FOUC.
const NO_FOUC_SCRIPT = `
(function(){try{
  var l=localStorage.getItem("championslab-lang");
  if(l){document.documentElement.lang=l.split("-")[0];}
  var t=localStorage.getItem("championslab-theme");
  if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}
  else{document.documentElement.style.colorScheme="light";}
}catch(e){}})();
`;

export const metadata: Metadata = {
  title: "Not exactly Champions Lab - Pokémon Champions 2026",
  description:
    "The ultimate competitive companion for Pokémon Champions. Season tracking, team builder, battle simulator, and deep Pokémon data - all in one immersive hub.",
  keywords: ["Pokemon Champions", "VGC", "team builder", "battle simulator", "competitive Pokemon", "Pokemon Champions 2026", "VGC team builder", "Pokemon meta"],
  metadataBase: new URL("https://championslab.xyz"),
  icons: {
    icon: [
      { url: `${BASE_PATH}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${BASE_PATH}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: `${BASE_PATH}/apple-touch-icon.png`,
  },
  openGraph: {
    title: "Not exactly Champions Lab - Pokémon Champions 2026",
    description: "The ultimate competitive companion for Pokémon Champions. Team builder, battle simulator, META analysis, and VGC learning - all in one hub.",
    url: "https://championslab.xyz",
    siteName: "Not exactly Champions Lab",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Not exactly Champions Lab - Pokémon Champions 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Not exactly Champions Lab - Pokémon Champions 2026",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} ${notoColorEmoji.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FOUC_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <I18nProvider>
        <LazyParticles />
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
