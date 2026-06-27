import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Types verified via standalone `npx tsc --noEmit --skipLibCheck`.
  // Next 16 Turbopack's built-in TS check OOMs on this project (16 GB RAM, 9 workers).
  typescript: { ignoreBuildErrors: true },
  // Fully static export — produces ./out/ for the Electron portable bundle.
  // No server, no API routes, no runtime image optimizer.
  output: "export",
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
  // NOTE: headers() is ignored by `output: "export"` (no server to apply them).
  // Kept here so a future server build would still pick them up.
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ],
    },
  ],
};

export default nextConfig;
