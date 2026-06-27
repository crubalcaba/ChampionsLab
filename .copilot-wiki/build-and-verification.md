---
last-verified: 2026-06-28
verified-against:
  - package.json
  - next.config.ts
  - tsconfig.json
  - eslint.config.mjs
  - .prettierrc.json
  - electron/main.cjs
  - scripts/wait-for-package.ps1
  - scripts/package-verbose.cjs
key-symbols:
  - nextConfig
---

# Build & Verification

## TL;DR

`npm run build` is the canonical verification gate. **There is no automated test suite** — type checks + a successful production build are the contract.

## Commands

```bash
npm run dev           # Dev server on :3000
npm run build         # Production build — primary verification gate
npm run start         # Run production build
npm run lint          # ESLint (eslint-config-next: core-web-vitals + typescript)
npm run format        # Prettier write
npm run format:check  # Prettier check (no write)
```

## Why the build is the gate

There is no `npm test`, no Jest/Vitest config, no `__tests__/` directory. The Next production build catches the failures the project actually cares about: TS compilation, route export shape, server/client boundary violations, missing imports, image domain whitelist failures.

## The Next 16 TS quirk

`next.config.ts`:

```ts
typescript: { ignoreBuildErrors: true }
```

The comment in the file explains it: **Next 16's Turbopack built-in TS check OOMs on this project** (16 GB RAM, 9 workers). Types are verified standalone:

```bash
npx tsc --noEmit --skipLibCheck
```

Always run this in addition to `npm run build` when you change types, the engine, or anything in `src/lib/`. CI (when it exists) should do both.

## Manual engine smoke tests

`scripts/qa-*.{ts,mjs,cjs}` are **manual** engine smoke tests, not unit tests. Run them directly with `tsx` when you change battle-sim, damage-calc, or stat-calc:

```bash
npx tsx scripts/qa-battle-bot.ts
npx tsx scripts/qa-calc-tester.ts
npx tsx scripts/qa-team-composition.ts
npx tsx scripts/qa-transforms.ts
```

These print human-readable summaries — no assertions, no exit codes to rely on for CI. Read the output.

## Lint & format

- ESLint config: `eslint.config.mjs` extends `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`. Ignores `.next/`, `out/`, `build/`, `next-env.d.ts`.
- Prettier config: 2-space indent, double quotes, semicolons, trailing commas (all), LF line endings, 80-col width.
- Prettier ignores `.next`, `node_modules`, `out`, `build`, `coverage`, `public/sprites`.

## Image whitelist

`next.config.ts` `images.remotePatterns` only allows:

1. `raw.githubusercontent.com/PokeAPI/sprites/**`
2. `champions-lab-sprites.nbg1.your-objectstorage.com/sprites/**`

Adding a Next `<Image>` source from any other host will fail at build/runtime — edit `remotePatterns` first.

## Security headers

Set globally in `next.config.ts.headers()`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.

## Desktop packaging (Electron + electron-builder)

`electron/main.cjs` wraps the static export (`out/`) in a desktop window using a custom `app://` protocol handler (file:// resolves root-relative `_next/*` paths against the drive root and fails). `package.json > build` configures electron-builder.

### Targets

| Script | Output | Notes |
|---|---|---|
| `npm run package` | `dist-electron/ChampionsLab-Setup-${version}.exe` | NSIS installer (default). Per-user install (`perMachine: false`, no UAC), classic wizard (`oneClick: false`), Desktop + Start-menu shortcuts, registered in Apps & Features. `deleteAppDataOnUninstall: false` so localStorage survives reinstalls. |
| `npm run package:portable` | `dist-electron/ChampionsLab-Portable-${version}.exe` | Self-extracting portable exe. LZMA-compressed (~184 MB). Always re-extracts to `%TEMP%` on launch. |
| `npm run package:verbose` | NSIS (default) or portable with `-- --portable` | Wraps `next build && electron-builder` via `scripts/package-verbose.cjs` with `DEBUG=electron-builder*` set so progress is logged through the quiet phases (asar pack, 7z/LZMA, NSIS compose). |

### Static-export caveat — `next start` does not work

`next.config.ts` sets `output: "export"`, so `npm run start` fails with `"next start" does not work with "output: export" configuration`. To run the production output as a web server, serve the static dir directly:

```powershell
npx serve out -l 3000
```

Electron loads the same `out/` dir via the `app://` protocol handler in `electron/main.cjs`; no HTTP server is involved in the desktop build.

### Helper scripts

- **`scripts/wait-for-package.ps1`** — Watcher. Polls `dist-electron/` for a target artifact pattern (default `ChampionsLab-Portable-*.exe`, override with `-artifactPattern "ChampionsLab-Setup-*.exe"`). If no file activity for `-stuckMinutes` (default 5) it kills `node/electron/electron-builder/next` processes and restarts `npm run package` once. Aborts after `-hardCapMinutes` (default 45). Used when you want to walk away from a long build without burning agent tokens polling.
- **`scripts/package-verbose.cjs`** — Cross-shell wrapper. Spawns `npm run build` then `electron-builder --win <target> --x64` with `DEBUG=electron-builder*` (override via the env var). `--portable` flag selects the portable target. **Windows quirk**: uses `shell: process.platform === "win32"` because Node 20+ refuses to `spawn` `.cmd` shims (`npm.cmd`, `electron-builder.cmd`) without a shell (CVE-2024-27980 hardening → `EINVAL`).

### What gets cached between runs

- Electron runtime + `winCodeSign` + `nsis` toolchain → `%LOCALAPPDATA%\electron-builder\Cache` (first packaging downloads ~150 MB; subsequent runs skip).
- Next build cache → `.next/cache` (warm `next build` is the 8s case).
- LZMA compression of the ~180 MB payload is the dominant per-run cost on warm builds. To skip it, set `"compression": "store"` in the `build` block (`package.json`) — artifacts grow to ~250–300 MB but build is near-instant.

## Cross-refs

- [data-validation-rules](data-validation-rules.md) — post-data-change checklist.
- [scripts-and-data-ops](scripts-and-data-ops.md) — operational scripts and runners.
