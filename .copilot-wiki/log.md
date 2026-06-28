# Copilot Wiki — Log

Append-only chronological record. New entries on top of their date section.
Format: `## [YYYY-MM-DD] <kind> | <title> — <one-line note>`. Kinds: `bootstrap`, `ingest`, `edit`, `lint`, `query-fileback`.

## [2026-06-28]

- `ingest` | github-pages-deployment — Added `.github/workflows/deploy-pages.yml` (push-to-`master` → `actions/deploy-pages@v4`), `basePath` toggle in `next.config.ts` gated on `GITHUB_PAGES=true`, `NEXT_PUBLIC_BASE_PATH` exposed via `env`. Patched `spriteUrl` (single chokepoint for all sprite URLs) + navbar logo + `export-pdf.ts` fetch to prefix the basePath because `next/image` does NOT auto-prepend `basePath` to user-supplied `src` under `images.unoptimized: true`. New wiki page captures the gotcha and the custom-domain switch-over plan.
- `edit` | build-and-verification — Added "Desktop packaging" section (NSIS default + portable + verbose targets, static-export `next start` caveat → `npx serve out`, `wait-for-package.ps1` + `package-verbose.cjs` helpers, electron-builder cache + LZMA cost notes). Updated `verified-against` with `electron/main.cjs` + the two new helper scripts.
- `edit` | scripts-and-data-ops — Added "Packaging helpers" section documenting `package-verbose.cjs` (with the Node 20 `.cmd` EINVAL / CVE-2024-27980 gotcha) and `wait-for-package.ps1` (artifact-poll-and-restart watcher). Refreshed `verified-against`.
- `edit` | (no wiki page) — Rebranding pass: visible app name now "Not exactly Champions Lab" (navbar small superscript line above gradient title, layout metadata titles + OG/Twitter + siteName, OG image alt, electron window title, package.json productName + NSIS shortcut/uninstall names). New `about.credits.attribution` + `footer.attribution` i18n keys across all 7 locales, wired into about page (violet highlight box) and footer (above disclaimer). No wiki page currently tracks branding strings, so no page edited — noted here for traceability.

## [2026-06-27]

- `query-fileback` | suggested-teammates — New page documenting the Suggested Teammates feature (pool filters, `scorePokemonFit` rubric, `addSuggestedTeammate` mega resolution, id-only memo caveat, shared scorer consumers).
- `edit` | scripts-and-data-ops — Replaced deprecated local sync/refresh-mega references with rewritten mega download workflow (`npm run sprites:download-mega`, `scripts/download-mega-sprites.cjs`).
- `edit` | scripts-and-data-ops — Corrected mega `m`-suffix sprite workflow: `sprites:refresh-mega` now re-downloads from object storage instead of copying base sprites.
- `query-fileback` | scripts-and-data-ops — Documented `scripts/sync-local-sprites.mjs` and `npm run sprites:sync-local` after adding local sprite sync for all `/sprites/*.png` references in `pokemon-data.ts`.
- `bootstrap` | Initial wiki seed — Created index + 7 topic pages (engine-architecture, data-validation-rules, i18n-flow, storage-and-sharing, build-and-verification, scripts-and-data-ops, ui-conventions). Verified against repo state at CodeGraph index commit (216 files, 3,612 nodes, 9,137 edges).
## [2026-06-27] ingest | local-only-overrides � Captured the three skip-worktree files (.gitignore, src/app/globals.css, src/app/layout.tsx) and the un-skip / re-skip protocol so future sessions don't silently lose edits to those files.
## [2026-06-27] ingest | agent-rules � Codified the never-commit-to-main/master rule and the branch+PR-by-default flow; user explicitly merges. Linked from index.md top banner.
## [2026-06-27] edit | agent-rules � Added rule 2 (branching strategy: contribution vs personal). main = upstream mirror, only touched on explicit "for contribution" commands; master = default base for personal work. Added decision tree + dual-bound feature procedure.
