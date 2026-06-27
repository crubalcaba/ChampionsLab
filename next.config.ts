import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Types verified via standalone `npx tsc --noEmit --skipLibCheck`.
  // Next 16 Turbopack's built-in TS check OOMs on this project (16 GB RAM, 9 workers).
  typescript: { ignoreBuildErrors: true },
  // Fully static export — produces ./out/ for the Electron portable bundle.
  // No server, no API routes, no runtime image optimizer.
  output: "export",
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
