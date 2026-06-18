import { POKEMON_SEED } from "../src/lib/pokemon-data.ts";
import fs from "fs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const REGIONAL_MAP: Record<string, string> = {
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

function extractStatTables(html: string) {
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

function sameStats(a: any, b: any) {
  return (
    a.hp === b.hp &&
    a.attack === b.attack &&
    a.defense === b.defense &&
    a.spAtk === b.spAtk &&
    a.spDef === b.spDef &&
    a.speed === b.speed
  );
}

function statString(s: any) {
  return `${s.hp}/${s.attack}/${s.defense}/${s.spAtk}/${s.spDef}/${s.speed} (total ${s.total})`;
}

async function fetchWithRetry(url: string, retries = 3) {
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

async function main() {
  const mismatches: any[] = [];
  const errors: any[] = [];

  for (const pokemon of POKEMON_SEED) {
    const slug = REGIONAL_MAP[pokemon.name];
    if (!slug) continue;

    const url = `https://www.serebii.net/pokedex-champions/${slug}/`;
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      errors.push({ name: pokemon.name, url, status: res.status });
      continue;
    }

    const tables = extractStatTables(res.text);
    if (tables.length === 0) {
      errors.push({ name: pokemon.name, url, status: "no stats tables" });
      continue;
    }

    const stats = pokemon.baseStats;
    const match = tables.find((t) => sameStats(t, stats));
    if (!match) {
      const total = Object.values(stats).reduce((a, b) => a + b, 0);
      const byTotal = tables.find((t) => t.total === total);
      mismatches.push({
        pokemon: pokemon.name,
        url,
        ours: statString({ ...stats, total }),
        serebii: byTotal ? statString(byTotal) : "no matching table",
      });
    }

    await sleep(800);
  }

  fs.writeFileSync("scripts/regional-forms-validation-report.json", JSON.stringify({ errors, mismatches }, null, 2));
  console.log(`Done. Errors: ${errors.length}, Mismatches: ${mismatches.length}`);
  if (mismatches.length > 0) {
    for (const m of mismatches) {
      console.log(`- ${m.pokemon}: ours ${m.ours} vs Serebii ${m.serebii}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
