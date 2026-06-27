---
last-verified: 2026-06-27
verified-against:
  - src/lib/storage.ts
  - src/app/api/share/route.ts
  - src/app/api/share/[id]/route.ts
  - supabase/schema.sql
  - package.json
key-symbols:
  - saveTeam
  - SavedTeam
  - SavedTeamSlot
  - KEYS
---

# Storage & Sharing

## TL;DR

There are **no user accounts**. Persistence is browser-side; sharing is either URL-encoded (compressed) or via a small server endpoint backed by a disk JSON file. Supabase has a schema but is mostly not wired up.

## Browser persistence (`src/lib/storage.ts`)

- Storage backend: `localStorage`.
- Key namespace: `champions-lab:*`.
  - `champions-lab:teams` — saved teams.
  - `champions-lab:sim-results` — battle-bot results.
  - `champions-lab:settings` — UI settings.
  - `champions-lab:last-team` — the team currently open in the builder.
- A saved team uses `SavedTeamSlot` (stores `pokemonId: number`, not the full `ChampionsPokemon`) so the format is portable across roster changes — hydration looks the slot's `pokemonId` up in `POKEMON_SEED` at load time.

## Team sharing — URL mode (default)

Teams are encoded into URL fragments using **`pako`** compression (zlib in JS). The encoder/decoder lives near the Team Builder (search for `pako` usages). This produces compact, server-less share links — a full team fits in a single URL.

## Team sharing — ID mode (`/api/share`)

For times when the URL is too long or the user wants a short link:

- `POST /api/share` body: `{ s: SavedTeamSlot[] }` → returns `{ id: "Ab3xY9" }` (6-char alphanumeric).
- `GET /api/share/[id]` → returns the stored payload.
- Storage: `data/shared-teams.json` on disk (created on demand under the project root). **This is server file I/O, not a database** — shared teams persist as long as the deployment volume does.
- Collision avoidance: `generateId()` retries on collision.

## Supabase

- Schema present at `supabase/schema.sql` (profiles, seasons, pokemon_seed, teams, etc.).
- `@supabase/ssr` and `@supabase/supabase-js` are installed dependencies.
- Active runtime usage is minimal — `grep` finds no `createClient` call sites in `src/` at the time of writing.
- **Treat Supabase as planned-but-not-live.** Do not assume any row exists. Do not introduce a runtime read/write without coordinating with the maintainer.

## Tournament / event data

Lives in `src/lib/winning-teams.ts`, `src/lib/vgc-events.ts`, `src/lib/simulation-data.ts`, and `src/lib/engine/vgc-data.ts`. These are static TS modules updated by scripts in `scripts/` (see [scripts-and-data-ops](scripts-and-data-ops.md)).

## Cross-refs

- [data-validation-rules](data-validation-rules.md) — saved slots reference `pokemonId` against `POKEMON_SEED`; removing a Pokémon will orphan old saves.
- [scripts-and-data-ops](scripts-and-data-ops.md) — tournament data refresh scripts.
