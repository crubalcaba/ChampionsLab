# Copilot Wiki — Index

> **READ FIRST → [agent-rules](agent-rules.md)** — hard rules. Most important: never commit/push to `main` or `master` without an explicit user command. Always create a branch + PR.
>
> **Read me first** for any "how does X work" question.
> Protocol & conventions live in `.github/copilot-instructions.md` (Wiki protocol section).

This wiki is **agent-maintained**. Each page is a synthesised, drift-checked answer to a recurring question about this codebase. If a page exists for your question, read it instead of re-deriving from source. If it doesn't, investigate, answer, then **file the synthesis back here** (page + `index.md` entry + `log.md` line).

## Architecture

- [engine-architecture](engine-architecture.md) — How the VGC battle engine is organized, public API barrel, simulator entry points, form/mega resolution.
- [data-validation-rules](data-validation-rules.md) — The cross-file wiring rules for Pokémon / moves / items / abilities. Orphans silently disappear; this page explains why and what to do.
- [i18n-flow](i18n-flow.md) — How the locale provider, hook surface, and per-category dictionaries fit together. How to add a locale.
- [storage-and-sharing](storage-and-sharing.md) — localStorage-first persistence, team-sharing endpoints, URL compression, and where Supabase fits (mostly doesn't, yet).

## Operations

- [build-and-verification](build-and-verification.md) — Why `npm run build` is the verification gate, the Next 16 TS check OOM workaround, the absence of a test suite, lint/format setup.
- [scripts-and-data-ops](scripts-and-data-ops.md) — What lives in `scripts/`, the naming-prefix convention (`fetch-*`, `audit-*`, `validate-*`, `qa-*`, `run-*`, …), and how to run each kind.
- [ui-conventions](ui-conventions.md) — shadcn `base-nova`, `lucide-react`, the `@/lib/motion` re-export rule, client-component default, image `remotePatterns` allow-list, security headers.
- [local-only-overrides](local-only-overrides.md) — Tracked files held under `git update-index --skip-worktree`. **Read before editing `.gitignore`, `src/app/globals.css`, or `src/app/layout.tsx`** — local diffs there are invisible to `git status` by design.

## Meta

- [agent-rules](agent-rules.md) — **READ FIRST.** Hard rules for git, PR, and merge behaviour. Branch + PR by default; only the user merges.
- [log.md](log.md) — Append-only chronological record of ingests, edits, lint passes.
