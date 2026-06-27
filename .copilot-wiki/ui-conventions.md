---
last-verified: 2026-06-27
verified-against:
  - components.json
  - src/app/layout.tsx
  - src/lib/motion.tsx
  - tsconfig.json
  - next.config.ts
  - package.json
key-symbols:
  - motion
  - AnimatePresence
  - I18nProvider
---

# UI Conventions

## TL;DR

shadcn/ui (`base-nova` style, neutral base color, CSS variables) on top of Tailwind v4 + React 19. Almost every component is `"use client"`. Motion comes from a project wrapper, not directly from `framer-motion`. The `@/*` alias points to `src/`.

## Path alias

`tsconfig.json` defines `"@/*": ["./src/*"]`. Always prefer `@/...` over deep relative imports. Examples that should never appear in source: `import x from "../../../lib/engine"`.

## Client-first

The app is overwhelmingly client-rendered. Every file in `src/components/` is `"use client"` because they use motion, local state, and/or the i18n hook. **New components default to `"use client"`** unless there's a concrete RSC reason (e.g. server-only data fetching with no interactivity).

Server components are limited to:

- `src/app/layout.tsx` (composes providers around the children).
- `src/app/**/page.tsx` shells that delegate to client components.
- `src/app/api/**/route.ts` (Route Handlers).

## Provider stack (`src/app/layout.tsx`)

Top-level wraps include: theme initialization (`<ThemeInit />`, `<ThemeToggle />`), mobile nav init, cookie consent, lazy particles, and `<I18nProvider>`. New global providers go in this file.

## shadcn / components.json

```json
{
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": { "css": "src/app/globals.css", "baseColor": "neutral", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- New UI primitives go in `src/components/ui/`. Install via the shadcn CLI (`npx shadcn add <component>`) so the `base-nova` styling stays consistent — do not hand-roll primitives.
- Icons are **lucide-react only**. Do not mix in `@heroicons` or `react-icons`.

## Motion

`src/lib/motion.tsx`:

```tsx
"use client";
export { motion, AnimatePresence } from "framer-motion";
```

**Import `motion` and `AnimatePresence` from `@/lib/motion`, never from `framer-motion` directly.** This keeps the `"use client"` boundary intact and means any future swap-out (e.g. to `motion` v12 features or a lighter alternative) happens in one file.

## Tailwind v4

- Config-less mode (no `tailwind.config.ts`); plugins/utilities are declared inside `src/app/globals.css`.
- PostCSS plugin: `@tailwindcss/postcss` (see `postcss.config.mjs`).
- The `tw-animate-css` package adds keyframe utilities.
- `tailwind-merge` and `class-variance-authority` are used by shadcn primitives.

## Next/Image

Remote sources are whitelisted in `next.config.ts.images.remotePatterns`:

- `raw.githubusercontent.com/PokeAPI/sprites/**`
- `champions-lab-sprites.nbg1.your-objectstorage.com/sprites/**`

Adding a new image host requires editing `remotePatterns` — Next will hard-fail otherwise.

`framer-motion` is on the `experimental.optimizePackageImports` list to keep bundle size down. Do not import the entire `framer-motion` namespace.

## Drag & drop

`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` are installed and used by the Team Builder. Reuse them; do not introduce another DnD library.

## PDF / QR / clipboard

- `jspdf` — Team / report export to PDF (`src/lib/export-pdf.ts`).
- `qrcode` (+ `@types/qrcode`) — Share-link QR generation.
- `pako` — URL compression for shared teams (see [storage-and-sharing](storage-and-sharing.md)).

## Security headers

Global headers come from `next.config.ts.headers()` — see [build-and-verification](build-and-verification.md).

## Cross-refs

- [i18n-flow](i18n-flow.md) — `useI18n()` only works inside `<I18nProvider>` children (i.e. anything under `layout.tsx`).
- [storage-and-sharing](storage-and-sharing.md) — pako-compressed URL shares.
