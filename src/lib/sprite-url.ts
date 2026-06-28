const CDN = process.env.NEXT_PUBLIC_SPRITE_CDN || "";
// GitHub Pages project-pages deploys live under /<repo>/, so root-relative
// paths need the basePath prefix. next/image does NOT auto-prepend basePath
// to user-supplied src when `images.unoptimized: true` (it only does so for
// internal /_next/static/* assets), so we prepend here. Empty everywhere else.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Resolve a sprite path like `/sprites/3.png` to its CDN URL (or leave as-is when no CDN is set). */
export function spriteUrl(path: string): string {
  if (!path || path.startsWith("http")) return path;
  if (CDN) return CDN + path;
  return BASE_PATH + path;
}
