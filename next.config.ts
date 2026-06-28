import type { NextConfig } from "next";

// GitHub Pages project-pages deployment lives under /<repo>/, so the build
// needs a basePath + assetPrefix. Gated on an env var so local dev, the
// Electron portable bundle, and any future custom-domain deploy keep their
// root-relative paths. CI sets GITHUB_PAGES=true in .github/workflows/deploy-pages.yml.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoBasePath = "/ChampionsLab";

const nextConfig: NextConfig = {
  // Types verified via standalone `npx tsc --noEmit --skipLibCheck`.
  // Next 16 Turbopack's built-in TS check OOMs on this project (16 GB RAM, 9 workers).
  typescript: { ignoreBuildErrors: true },
  // Fully static export — produces ./out/ for the Electron portable bundle
  // and for the GitHub Pages deploy. No server, no API routes, no runtime
  // image optimizer.
  output: "export",
  basePath: isGithubPages ? repoBasePath : "",
  assetPrefix: isGithubPages ? `${repoBasePath}/` : "",
  // Exposed to client code so manual fetch() calls for public/ assets can
  // prefix the basePath (next/link and next/image do this automatically).
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? repoBasePath : "",
  },
  // Each route becomes <route>/index.html instead of <route>.html, so the
  // Electron protocol handler in electron/main.cjs can resolve clean URLs
  // (file:///.../out/team-builder/) to the right HTML file on hard reload.
  trailingSlash: true,
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  images: {
    // Static export has no /_next/image route. <Image> degrades to plain <img>.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PokeAPI/sprites/**",
      },
      {
        protocol: "https",
        hostname: "champions-lab-sprites.nbg1.your-objectstorage.com",
        pathname: "/sprites/**",
      },
    ],
  },
};

export default nextConfig;
