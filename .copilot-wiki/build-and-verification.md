---
last-verified: 2026-06-27
verified-against:
  - package.json
  - next.config.ts
  - tsconfig.json
  - eslint.config.mjs
  - .prettierrc.json
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

## Cross-refs

- [data-validation-rules](data-validation-rules.md) — post-data-change checklist.
- [scripts-and-data-ops](scripts-and-data-ops.md) — operational scripts and runners.
