/**
 * sync-limitless-tournaments.ts
 *
 * Fetches all Pokémon Champions (Reg M-A) tournament data from the
 * Limitless TCG public API and generates updated TypeScript data for:
 *   - CHAMPIONS_TOURNAMENT_TEAMS  (top placements with full team comp)
 *   - CHAMPIONS_TOURNAMENT_USAGE  (aggregate Pokémon usage stats)
 *
 * Usage:
 *   npx tsx scripts/sync-limitless-tournaments.ts
 *   npx tsx scripts/sync-limitless-tournaments.ts --dry-run   (preview only)
 *   npx tsx scripts/sync-limitless-tournaments.ts --min-players 32
 *
 * Designed to run daily via cron or manually before deploys.
 */

import { POKEMON_SEED } from "../src/lib/pokemon-data";
import * as fs from "fs";
import * as path from "path";

// ─── Config ──────────────────────────────────────────────────────────
const API_BASE = "https://play.limitlesstcg.com/api";
const FORMAT = "M-A";
const GAME = "VGC";
const MIN_PLAYERS = parseInt(process.argv.find(a => a.startsWith("--min-players="))?.split("=")[1] ?? "8");
const DRY_RUN = process.argv.includes("--dry-run");
const TOP_CUT = 8; // top N placements to record as teams
const RATE_LIMIT_MS = 2500; // ~50 requests per 5 min = 1 every 6s
const CACHE_PATH = path.join(__dirname, "limitless-cache.json");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "lib", "simulation-data.ts");

// ─── Limitless slug → our name mapping ───────────────────────────────
// Build from POKEMON_SEED + manual overrides for tricky cases
const pokemonByName = new Map<string, { id: number; name: string }>();
const pokemonById = new Map<number, { id: number; name: string }>();

for (const p of POKEMON_SEED) {
  if ((p as any).hidden) continue;
  pokemonByName.set(p.name.toLowerCase(), { id: p.id, name: p.name });
  pokemonById.set(p.id, { id: p.id, name: p.name });
}

// Manual Limitless slug → our display name
const SLUG_OVERRIDES: Record<string, string> = {
  // Rotom forms
  "rotom-heat": "Heat Rotom",
  "rotom-wash": "Wash Rotom",
  "rotom-mow": "Mow Rotom",
  "rotom-fan": "Fan Rotom",
  "rotom-frost": "Frost Rotom",
  // Hisuian forms
  "arcanine-hisui": "Hisuian Arcanine",
  "typhlosion-hisui": "Hisuian Typhlosion",
  "lilligant-hisui": "Hisuian Lilligant",
  "zoroark-hisui": "Hisuian Zoroark",
  "braviary-hisui": "Hisuian Braviary",
  "goodra-hisui": "Hisuian Goodra",
  "decidueye-hisui": "Hisuian Decidueye",
  "samurott-hisui": "Hisuian Samurott",
  "electrode-hisui": "Hisuian Electrode",
  "avalugg-hisui": "Hisuian Avalugg",
  "sneasel-hisui": "Hisuian Sneasel",
  "voltorb-hisui": "Hisuian Voltorb",
  // Alolan forms
  "ninetales-alola": "Alolan Ninetales",
  "muk-alola": "Alolan Muk",
  "marowak-alola": "Alolan Marowak",
  "raichu-alola": "Alolan Raichu",
  "exeggutor-alola": "Alolan Exeggutor",
  "persian-alola": "Alolan Persian",
  "sandslash-alola": "Alolan Sandslash",
  "golem-alola": "Alolan Golem",
  // Galarian forms
  "slowking-galar": "Galarian Slowking",
  "slowbro-galar": "Galarian Slowbro",
  "weezing-galar": "Galarian Weezing",
  "moltres-galar": "Galarian Moltres",
  "zapdos-galar": "Galarian Zapdos",
  "articuno-galar": "Galarian Articuno",
  // Paldean forms
  "tauros-paldea-combat": "Paldean Tauros Combat",
  "tauros-paldea-blaze": "Paldean Tauros Blaze",
  "tauros-paldea-aqua": "Paldean Tauros Aqua",
  "tauros-paldea": "Paldean Tauros Combat",
  // Gender forms
  "basculegion-f": "Basculegion-F",
  "basculegion-female": "Basculegion-F",
  "basculegion": "Basculegion-M",
  "basculegion-m": "Basculegion-M",
  "basculegion-male": "Basculegion-M",
  "meowstic": "Meowstic-M",
  "meowstic-f": "Meowstic-F",
  "meowstic-female": "Meowstic-F",
  "indeedee": "Indeedee-M",
  "indeedee-f": "Indeedee-F",
  "indeedee-female": "Indeedee-F",
  // Special forms
  "urshifu": "Urshifu",
  "urshifu-rapid-strike": "Urshifu-Rapid-Strike",
  "ogerpon-wellspring": "Ogerpon-Wellspring",
  "ogerpon-hearthflame": "Ogerpon-Hearthflame",
  "ogerpon-cornerstone": "Ogerpon-Cornerstone",
  "palafin": "Palafin",
  "palafin-hero": "Palafin",
  "aegislash": "Aegislash",
  "aegislash-blade": "Aegislash",
  // Wormadam forms
  "wormadam-sandy": "Wormadam-Sandy",
  "wormadam-trash": "Wormadam-Trash",
  "wormadam": "Wormadam",
  // Lycanroc
  "lycanroc-midnight": "Lycanroc-Midnight",
  "lycanroc-dusk": "Lycanroc-Dusk",
  "lycanroc": "Lycanroc",
  // Hyphenated names
  "kommo-o": "Kommo-o",
  "jangmo-o": "Jangmo-o",
  "hakamo-o": "Hakamo-o",
  "ho-oh": "Ho-Oh",
  "chi-yu": "Chi-Yu",
  "ting-lu": "Ting-Lu",
  "chien-pao": "Chien-Pao",
  "wo-chien": "Wo-Chien",
  "mr-rime": "Mr. Rime",
  "mr-mime": "Mr. Mime",
  "mime-jr": "Mime Jr.",
  "type-null": "Type: Null",
};

function resolveSlug(slug: string): { id: number; name: string } | null {
  // 1. Check manual overrides first
  const override = SLUG_OVERRIDES[slug];
  if (override) {
    const found = pokemonByName.get(override.toLowerCase());
    if (found) return found;
  }

  // 2. Direct slug → name (capitalize)
  const directName = slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const direct = pokemonByName.get(directName.toLowerCase());
  if (direct) return direct;

  // 3. Try single word (just first part of slug)
  const firstWord = slug.split("-")[0];
  const capitalized = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  const partial = pokemonByName.get(capitalized.toLowerCase());
  if (partial) return partial;

  return null;
}

// ─── API helpers ─────────────────────────────────────────────────────
async function fetchJSON<T>(url: string, retries = 5): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("retry-after") ?? "30");
      const wait = (retryAfter + 2) * 1000; // add 2s buffer
      console.log(`    \u23f3 Rate limited, waiting ${Math.round(wait / 1000)}s (retry-after: ${retryAfter}s)...`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json() as Promise<T>;
  }
  throw new Error(`Rate limited after ${retries} retries: ${url}`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface LimitlessTournament {
  id: string;
  game: string;
  format: string;
  name: string;
  date: string;
  players: number;
}

interface LimitlessTournamentDetails extends LimitlessTournament {
  decklists: boolean;
  isPublic: boolean;
  isOnline: boolean;
  organizer: { id: number; name: string };
  phases: { phase: number; type: string; rounds: number; mode: string }[];
}

interface LimitlessStanding {
  player: string;
  name: string;
  country: string | null;
  placing: number | null;
  record: { wins: number; losses: number; ties: number };
  decklist: LimitlessPokemon[] | null;
  deck: Record<string, unknown>;
  drop: number | null;
}

interface LimitlessPokemon {
  id: string;      // slug like "basculegion", "rotom-heat"
  name: string;    // display name like "Basculegion", "Heat Rotom"
  item: string;
  ability: string;
  attacks: string[];
  tera: string | null;
}

// ─── Types for output ────────────────────────────────────────────────
interface TournamentSet {
  ability: string;
  item: string;
  moves: string[];
  teraType?: string;
}

interface TournamentTeam {
  id: string;
  tournament: string;
  players: number;
  placement: number;
  player: string;
  wins: number;
  losses: number;
  pokemonIds: number[];
  pokemonNames: string[];
  sets: TournamentSet[];
}

interface TournamentUsage {
  rank: number;
  name: string;
  count: number;
  usagePct: number;
  top8Count: number;
}

// ─── Cache ───────────────────────────────────────────────────────────
interface CacheData {
  lastFetch: string;
  tournamentIds: string[];
}

function loadCache(): CacheData {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    return { lastFetch: "", tournamentIds: [] };
  }
}

function saveCache(data: CacheData) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2));
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   Limitless Tournament Sync — Pokémon Champions     ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`  Format: ${FORMAT} | Min players: ${MIN_PLAYERS} | Top cut: ${TOP_CUT}`);
  console.log(`  Dry run: ${DRY_RUN}\n`);

  // 1. Fetch all M-A tournaments (paginate)
  let allTournaments: LimitlessTournament[] = [];
  let page = 1;
  while (true) {
    const url = `${API_BASE}/tournaments?game=${GAME}&format=${FORMAT}&limit=50&page=${page}`;
    console.log(`  Fetching tournament list (page ${page})...`);
    const batch = await fetchJSON<LimitlessTournament[]>(url);
    if (batch.length === 0) break;
    allTournaments.push(...batch);
    if (batch.length < 50) break;
    page++;
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`\n  Found ${allTournaments.length} total M-A tournaments`);

  // Filter by minimum players
  const eligible = allTournaments.filter(t => t.players >= MIN_PLAYERS);
  console.log(`  ${eligible.length} with ${MIN_PLAYERS}+ players\n`);

  // 2. For each tournament, check if it has decklists, then fetch standings
  const teams: TournamentTeam[] = [];
  const usageMap = new Map<string, { count: number; top8Count: number; name: string }>();
  let totalTeamsWithLists = 0;
  let totalTeams = 0;
  let tournamentCount = 0;
  const unmapped = new Map<string, number>();

  for (const tournament of eligible) {
    await sleep(RATE_LIMIT_MS);

    // Check details for decklists
    const details = await fetchJSON<LimitlessTournamentDetails>(
      `${API_BASE}/tournaments/${tournament.id}/details`
    );

    if (!details.decklists) {
      console.log(`  ⊘ ${tournament.name.slice(0, 50)} (${tournament.players}p) — no team lists`);
      continue;
    }

    await sleep(RATE_LIMIT_MS);

    // Fetch standings
    const standings = await fetchJSON<LimitlessStanding[]>(
      `${API_BASE}/tournaments/${tournament.id}/standings`
    );

    // Filter to players with placements and decklists
    const withTeams = standings.filter(
      s => s.decklist && s.decklist.length > 0 && s.placing != null
    );

    if (withTeams.length === 0) {
      console.log(`  ⊘ ${tournament.name.slice(0, 50)} (${tournament.players}p) — 0 usable teams`);
      continue;
    }

    tournamentCount++;
    console.log(`  ✓ ${tournament.name.slice(0, 50)} (${tournament.players}p) — ${withTeams.length} teams`);

    // Sort by placement
    withTeams.sort((a, b) => (a.placing ?? 999) - (b.placing ?? 999));

    // Count ALL teams for usage stats
    for (const standing of withTeams) {
      totalTeams++;
      const isTop8 = (standing.placing ?? 999) <= TOP_CUT;

      for (const mon of standing.decklist!) {
        const resolved = resolveSlug(mon.id);
        if (!resolved) {
          unmapped.set(mon.id, (unmapped.get(mon.id) ?? 0) + 1);
          continue;
        }
        const key = resolved.name;
        const existing = usageMap.get(key) ?? { count: 0, top8Count: 0, name: resolved.name };
        existing.count++;
        if (isTop8) existing.top8Count++;
        usageMap.set(key, existing);
      }
    }

    // Record top-cut teams for CHAMPIONS_TOURNAMENT_TEAMS
    const topCut = withTeams.filter(s => (s.placing ?? 999) <= TOP_CUT);
    totalTeamsWithLists += topCut.length;

    for (const standing of topCut) {
      const pokemonIds: number[] = [];
      const pokemonNames: string[] = [];
      const sets: TournamentSet[] = [];

      for (const mon of standing.decklist!) {
        const resolved = resolveSlug(mon.id);
        if (resolved) {
          pokemonIds.push(resolved.id);
          pokemonNames.push(resolved.name);
          sets.push({
            ability: mon.ability,
            item: mon.item,
            moves: mon.attacks,
            teraType: mon.tera ?? undefined,
          });
        }
      }

      if (pokemonIds.length >= 4) {
        teams.push({
          id: `ct-${teams.length + 1}`,
          tournament: tournament.name.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim(),
          players: tournament.players,
          placement: standing.placing ?? 999,
          player: standing.name,
          wins: standing.record.wins,
          losses: standing.record.losses,
          pokemonIds,
          pokemonNames,
          sets,
        });
      }
    }
  }

  // 3. Build usage array
  const usageArray: TournamentUsage[] = [...usageMap.values()]
    .sort((a, b) => b.count - a.count)
    .map((entry, i) => ({
      rank: i + 1,
      name: entry.name,
      count: entry.count,
      usagePct: Math.round((entry.count / totalTeams) * 1000) / 10,
      top8Count: entry.top8Count,
    }));

  // 4. Summary
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   Results                                           ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`  Tournaments processed: ${tournamentCount}`);
  console.log(`  Total teams with lists: ${totalTeams}`);
  console.log(`  Top-${TOP_CUT} teams recorded: ${teams.length}`);
  console.log(`  Unique Pokémon in usage: ${usageArray.length}`);

  if (unmapped.size > 0) {
    console.log(`\n  ⚠ Unmapped Limitless slugs (${unmapped.size}):`);
    for (const [slug, count] of [...unmapped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
      console.log(`    ${slug} (×${count})`);
    }
  }

  console.log("\n  Top 20 usage:");
  for (const u of usageArray.slice(0, 20)) {
    console.log(`    #${u.rank} ${u.name.padEnd(22)} ${u.usagePct}% (${u.count} teams, ${u.top8Count} top8)`);
  }

  // 5. Write output
  if (DRY_RUN) {
    console.log("\n  [DRY RUN] Would write to simulation-data.ts — skipping.");
    // Write to a preview JSON instead
    const previewPath = path.join(__dirname, "limitless-preview.json");
    fs.writeFileSync(previewPath, JSON.stringify({ teams: teams.slice(0, 5), usage: usageArray.slice(0, 10) }, null, 2));
    console.log(`  Preview written to ${previewPath}`);
  } else {
    updateSimulationData(teams, usageArray, totalTeams, tournamentCount);
    saveCache({
      lastFetch: new Date().toISOString(),
      tournamentIds: eligible.map(t => t.id),
    });
    console.log("\n  ✅ simulation-data.ts updated!");
    console.log("  ✅ Cache saved to limitless-cache.json");
  }
}

// ─── Update simulation-data.ts ───────────────────────────────────────
function updateSimulationData(
  teams: TournamentTeam[],
  usage: TournamentUsage[],
  totalTeams: number,
  tournamentCount: number,
) {
  const filePath = OUTPUT_PATH;
  let content = fs.readFileSync(filePath, "utf-8");

  const today = new Date().toISOString().split("T")[0];

  // Replace CHAMPIONS_TOURNAMENT_COUNT
  content = content.replace(
    /export const CHAMPIONS_TOURNAMENT_COUNT = \d+;/,
    `export const CHAMPIONS_TOURNAMENT_COUNT = ${tournamentCount};`
  );

  // Replace CHAMPIONS_TOURNAMENT_TOTAL_TEAMS
  content = content.replace(
    /export const CHAMPIONS_TOURNAMENT_TOTAL_TEAMS = \d+;/,
    `export const CHAMPIONS_TOURNAMENT_TOTAL_TEAMS = ${totalTeams};`
  );

  // Replace CHAMPIONS_TOURNAMENT_DATE
  content = content.replace(
    /export const CHAMPIONS_TOURNAMENT_DATE = "[^"]+";/,
    `export const CHAMPIONS_TOURNAMENT_DATE = "${today}";`
  );

  // Replace CHAMPIONS_TOURNAMENT_USAGE array
  const usageStr = usage.map(u =>
    `  { rank: ${u.rank}, name: "${u.name}", count: ${u.count}, usagePct: ${u.usagePct}, top8Count: ${u.top8Count} },`
  ).join("\n");

  content = content.replace(
    /export const CHAMPIONS_TOURNAMENT_USAGE: ChampionsTournamentUsage\[\] = \[[\s\S]*?\n\];/,
    `export const CHAMPIONS_TOURNAMENT_USAGE: ChampionsTournamentUsage[] = [\n${usageStr}\n];`
  );

  // Replace CHAMPIONS_TOURNAMENT_TEAMS array
  const teamsStr = teams.map(t => {
    const setsStr = t.sets.map(s =>
      `    { ability: ${JSON.stringify(s.ability)}, item: ${JSON.stringify(s.item)}, moves: [${s.moves.map(m => JSON.stringify(m)).join(", ")}]${s.teraType ? `, teraType: ${JSON.stringify(s.teraType)}` : ""} }`
    ).join(",\n");
    return `  { id: "${t.id}", tournament: ${JSON.stringify(t.tournament)}, players: ${t.players}, placement: ${t.placement}, player: ${JSON.stringify(t.player)}, wins: ${t.wins}, losses: ${t.losses}, pokemonIds: [${t.pokemonIds.join(", ")}], pokemonNames: [${t.pokemonNames.map(n => `"${n}"`).join(", ")}], sets: [\n${setsStr}\n  ] }`;
  }).join(",\n");

  content = content.replace(
    /export const CHAMPIONS_TOURNAMENT_TEAMS: ChampionsTournamentTeam\[\] = \[[\s\S]*?\n\];/,
    `export const CHAMPIONS_TOURNAMENT_TEAMS: ChampionsTournamentTeam[] = [\n${teamsStr}\n];`
  );

  fs.writeFileSync(filePath, content);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
