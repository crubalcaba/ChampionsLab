import { POKEMON_SEED } from "../src/lib/pokemon-data.ts";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const REGIONAL_MAP = {
  "Hisuian Avalugg": "avalugg",
  "Alolan Raichu": "raichu",
  "Hisuian Arcanine": "arcanine",
  "Alolan Ninetales": "ninetales",
  "Galarian Slowbro": "slowbro",
  "Paldean Tauros (Aqua)": "tauros",
  "Paldean Tauros": "tauros",
  "Paldean Tauros (Blaze)": "tauros",
  "Hisuian Typhlosion": "typhlosion",
  "Galarian Slowking": "slowking",
  "Heat Rotom": "rotom",
  "Frost Rotom": "rotom",
  "Fan Rotom": "rotom",
  "Wash Rotom": "rotom",
  "Mow Rotom": "rotom",
  "Hisuian Samurott": "samurott",
  "Hisuian Zoroark": "zoroark",
  "Galarian Stunfisk": "stunfisk",
  "Meowstic-M": "meowstic",
  "Meowstic-F": "meowstic",
  "Hisuian Decidueye": "decidueye",
  "Basculegion-M": "basculegion",
  "Basculegion-F": "basculegion",
  "Hisuian Goodra": "goodra",
  "Eternal Floette": "floette",
  "Mr. Rime": "mr.rime",
};

function getSlug(name) {
  if (REGIONAL_MAP[name]) return REGIONAL_MAP[name];
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/:/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractStatTables(html) {
  const tables = [];
  const regex = /Base Stats - Total:\s*(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    tables.push({
      total: parseInt(m[1], 10),
      hp: parseInt(m[2], 10),
      attack: parseInt(m[3], 10),
      defense: parseInt(m[4], 10),
      spAtk: parseInt(m[5], 10),
      spDef: parseInt(m[6], 10),
      speed: parseInt(m[7], 10),
    });
  }
  return tables;
}

function sameStats(a, b) {
  return (
    a.hp === b.hp &&
    a.attack === b.attack &&
    a.defense === b.defense &&
    a.spAtk === b.spAtk &&
    a.spDef === b.spDef &&
    a.speed === b.speed
  );
}

function statString(s) {
  return `${s.hp}/${s.attack}/${s.defense}/${s.spAtk}/${s.spDef}/${s.speed} (total ${s.total})`;
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.status === 429 || res.status === 503) {
        await sleep(5000 * (i + 1));
        continue;
      }
      if (!res.ok) return { ok: false, status: res.status, text: "" };
      const text = await res.text();
      return { ok: true, status: res.status, text };
    } catch (e) {
      if (i === retries - 1) return { ok: false, status: 0, text: "" };
      await sleep(2000 * (i + 1));
    }
  }
  return { ok: false, status: 0, text: "" };
}

const mismatches = [];
const errors = [];
const checked = [];

const CONCURRENCY = 4;
const DELAY_MS = 1200;

async function processBatch(batch) {
  await Promise.all(
    batch.map(async (pokemon) => {
      const slug = getSlug(pokemon.name);
      const url = `https://www.serebii.net/pokedex-champions/${slug}/`;
      const res = await fetchWithRetry(url);
      if (!res.ok) {
        errors.push({ name: pokemon.name, url, status: res.status });
        return;
      }
      const tables = extractStatTables(res.text);
      if (tables.length === 0) {
        errors.push({ name: pokemon.name, url, status: "no stats tables" });
        return;
      }

      const formsToCheck = [
        { name: pokemon.name, stats: pokemon.baseStats, isMega: false },
        ...(pokemon.forms || []).map((f) => ({
          name: f.name,
          stats: f.baseStats,
          isMega: !!f.isMega,
        })),
      ];

      const matchedTables = [];
      const usedIndices = new Set();

      for (const form of formsToCheck) {
        const formTotal = Object.values(form.stats).reduce((a, b) => a + b, 0);
        const candidates = tables
          .map((t, i) => ({ t, i }))
          .filter(({ i }) => !usedIndices.has(i))
          .filter(({ t }) => sameStats(t, form.stats));

        if (candidates.length === 1) {
          usedIndices.add(candidates[0].i);
          matchedTables.push({ form: form.name, matched: true });
        } else if (candidates.length > 1) {
          matchedTables.push({ form: form.name, matched: true, note: "ambiguous match" });
          usedIndices.add(candidates[0].i);
        } else {
          const byTotal = tables
            .map((t, i) => ({ t, i }))
            .filter(({ i }) => !usedIndices.has(i))
            .filter(({ t }) => t.total === formTotal);
          if (byTotal.length >= 1) {
            usedIndices.add(byTotal[0].i);
            mismatches.push({
              pokemon: pokemon.name,
              form: form.name,
              url,
              ours: statString(form.stats),
              serebii: statString(byTotal[0].t),
            });
            matchedTables.push({ form: form.name, matched: false, byTotal: true });
          } else {
            mismatches.push({
              pokemon: pokemon.name,
              form: form.name,
              url,
              ours: statString(form.stats),
              serebii: "no matching table found",
            });
            matchedTables.push({ form: form.name, matched: false });
          }
        }
      }

      checked.push({
        name: pokemon.name,
        url,
        tables: tables.length,
        forms: formsToCheck.length,
        matchedTables,
      });
    })
  );
}

async function main() {
  const batches = [];
  for (let i = 0; i < POKEMON_SEED.length; i += CONCURRENCY) {
    batches.push(POKEMON_SEED.slice(i, i + CONCURRENCY));
  }

  let done = 0;
  for (const batch of batches) {
    await processBatch(batch);
    done += batch.length;
    if (done % 20 === 0 || done === POKEMON_SEED.length) {
      console.log(`[${done}/${POKEMON_SEED.length}] processed`);
    }
    await sleep(DELAY_MS);
  }

  const report = {
    checked: checked.length,
    errors,
    mismatches,
  };

  fs.writeFileSync("scripts/stats-validation-report.json", JSON.stringify(report, null, 2));
  console.log(`\nDone. Checked ${checked.length} Pokémon.`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Mismatches: ${mismatches.length}`);
  if (mismatches.length > 0) {
    console.log("\nMismatches:");
    for (const m of mismatches) {
      console.log(`- ${m.pokemon} / ${m.form}: ours ${m.ours} vs Serebii ${m.serebii}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
