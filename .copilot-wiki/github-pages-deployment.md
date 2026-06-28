---
last-verified: 2026-06-28
verified-against:
  - .github/workflows/deploy-pages.yml
  - next.config.ts
  - src/lib/sprite-url.ts
  - src/components/navbar.tsx
  - src/lib/export-pdf.ts
key-symbols:
  - spriteUrl
  - NEXT_PUBLIC_BASE_PATH
---

# GitHub Pages Deployment

## TL;DR

The fork deploys to **https://crubalcaba.github.io/ChampionsLab/** via `.github/workflows/deploy-pages.yml` on every push to `master`. Static export only — no server. A `GITHUB_PAGES=true` env var at build time switches on `basePath: "/ChampionsLab"` and exposes `NEXT_PUBLIC_BASE_PATH` so the manual-path code paths (sprites, logo, PDF logo fetch) prefix correctly. Local dev, `npm run dev`, and the Electron portable bundle are **unaffected** — they all build/run with no env var and root-relative paths.

## How the basePath toggle works

`next.config.ts`:

```ts
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoBasePath = "/ChampionsLab";

basePath:    isGithubPages ? repoBasePath : "",
assetPrefix: isGithubPages ? `${repoBasePath}/` : "",
env: { NEXT_PUBLIC_BASE_PATH: isGithubPages ? repoBasePath : "" },
```

- `basePath` → routes, `next/link`, `usePathname` (Next strips it back off).
- `assetPrefix` → `_next/static/*` URLs.
- `NEXT_PUBLIC_BASE_PATH` → exposed to client code for the manual-prefix call sites below.

## The next/image gotcha

**`next/image` does NOT auto-prepend `basePath` to user-supplied `src` when `images.unoptimized: true` is set.** Only `_next/static/*` and Next's internal image route get prefixed automatically. Every user-supplied root-relative `src` must be prefixed manually.

This project has a single chokepoint for sprite paths — `spriteUrl()` in `src/lib/sprite-url.ts` — which is invoked at module-load time in `src/lib/pokemon-data.ts` (rewrites every `POKEMON_SEED` entry's `sprite` + `officialArt` + form sprites) and inside the three components that render sprites directly (`survival-panel.tsx`, `compact-damage-calc.tsx`, `speed-tier-panel.tsx`). Updating `spriteUrl` to fall through to `BASE_PATH + path` when there's no CDN covers every sprite in the app with one line.

Non-sprite root-relative assets that needed manual fixes:

| Location | Asset | Fix |
|---|---|---|
| `src/components/navbar.tsx` | `<Image src="/logo.png">` | Inline `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo.png` |
| `src/lib/export-pdf.ts` | `fetch("/logo.png")` (PDF export) | Same inline prefix |

Icons declared in `metadata.icons` (root `layout.tsx`) and Next-generated `<link rel="preload" href="/_next/...">` are handled by Next automatically — no fix needed.

## Workflow

`.github/workflows/deploy-pages.yml`:

- Trigger: `push` to `master` (the personal/deploy branch), plus `workflow_dispatch`. `main` is the upstream mirror and intentionally not built — see [agent-rules](agent-rules.md).
- Permissions: `pages: write`, `id-token: write` (required by `actions/deploy-pages@v4` OIDC).
- Concurrency: `group: pages`, `cancel-in-progress: false` so an in-progress deploy always finishes.
- Steps: `checkout` → `setup-node@v4` (node 20, npm cache) → `npm ci` → `npx tsc --noEmit --skipLibCheck` (required because `next.config.ts` has `typescript.ignoreBuildErrors: true` per the Next 16 Turbopack OOM workaround) → `npm run build` with `GITHUB_PAGES=true` → `touch out/.nojekyll` (stops GitHub Pages from filtering `_next/*`) → `actions/configure-pages@v5` → `actions/upload-pages-artifact@v3` (uploads `out/`) → `actions/deploy-pages@v4`.

## Repo Settings (one-time, manual)

- **Settings → Pages → Source = "GitHub Actions"** (not "Deploy from a branch"). Mandatory for `actions/deploy-pages@v4`.
- Custom domain field: leave empty for now. User may add one later.

## Verifying a build locally

```powershell
$env:GITHUB_PAGES="true"; npm run build
# Confirm:
# - out/index.html contains "/ChampionsLab/logo.png" and "/ChampionsLab/sprites/..."
# - out/index.html contains NO bare 'src="/logo' or 'src="/sprites/'
# - out/_next/static/... assets resolve under the basePath
Remove-Item Env:GITHUB_PAGES   # un-set when done
```

To serve locally with the basePath:

```powershell
npx serve out -l 3000
# then visit http://localhost:3000/ChampionsLab/
```

## Adding a custom domain later

1. Create `public/CNAME` with one line: the apex domain (e.g. `example.com`).
2. In `.github/workflows/deploy-pages.yml`, **remove** the `GITHUB_PAGES: "true"` env from the build step (custom domain serves from root, no basePath needed).
3. Settings → Pages → Custom domain = `example.com`, tick Enforce HTTPS.
4. Configure DNS A/AAAA (apex) or CNAME (subdomain) per [GitHub's docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

The basePath toggle is built so flipping back to no-basePath is a one-line workflow edit, not a code change.

## Cross-refs

- [build-and-verification](build-and-verification.md) — the broader build gate, why tsc runs standalone, Electron packaging.
- [agent-rules](agent-rules.md) — why `master` is the deploy branch and `main` is the upstream mirror.
- [ui-conventions](ui-conventions.md) — image `remotePatterns` allow-list (still applies for sprite CDN).

