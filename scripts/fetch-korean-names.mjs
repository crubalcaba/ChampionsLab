#!/usr/bin/env node
/**
 * Fetch Korean Pokémon names from PokéAPI for the Champions roster.
 *
 * Usage: node scripts/fetch-korean-names.mjs
 * Output: src/lib/i18n/pokemon-names.ko.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Read the roster from pokemon-data.ts
const dataFile = fs.readFileSync(path.join(ROOT, "src/lib/pokemon-data.ts"), "utf-8");
const idNameRe = /"id":\s*(\d+),\s*\n\s*"name":\s*"([^"]+)"/g;

const roster = [];
let m;
while ((m = idNameRe.exec(dataFile)) !== null) {
  roster.push({ id: parseInt(m[1]), name: m[2] });
}

console.log(`Found ${roster.length} Pokémon in roster`);

// Map custom IDs to PokeAPI species IDs
// Regional forms & special forms: strip to base species for the species endpoint
function getSpeciesId(id) {
  // Rotom forms (10008-10012) → base species 479
  if (id >= 10008 && id <= 10012) return 479;
  // Alolan forms: 10100=Raichu(26), 10103=Ninetales(38)
  if (id === 10100) return 26;
  if (id === 10103) return 38;
  // Paldean Tauros: 10250,10251,10252 → 128
  if (id >= 10250 && id <= 10252) return 128;
  // Hisuian: 5059=Arcanine(59), 5157=Typhlosion(157), 5706=Goodra(706), 5713=Avalugg(713)
  if (id === 5059) return 59;
  if (id === 5157) return 157;
  if (id === 5706) return 706;
  if (id === 5713) return 713;
  // Galarian: 6080=Slowbro(80), 6199=Slowking(199), 6618=Stunfisk(618)
  if (id === 6080) return 80;
  if (id === 6199) return 199;
  if (id === 6618) return 618;
  // Hisuian via 10xxx: 10336=Samurott(503), 10340=Zoroark(571), 10341=Decidueye(724)
  if (id === 10336) return 503;
  if (id === 10340) return 571;
  if (id === 10341) return 724;
  // Meowstic-F: 10678 → 678
  if (id === 10678) return 678;
  // Basculegion-F: 10902 → 902
  if (id === 10902) return 902;
  // Eternal Floette
  if (id === 10061) return 670;
  // Custom Champions roster IDs for Pokémon that share IDs with other forms
  if (id === 10903) return 979; // Annihilape
  if (id === 10904) return 689; // Barbaracle
  if (id === 10905) return 257; // Blaziken
  if (id === 10906) return 691; // Dragalge
  if (id === 10907) return 604; // Eelektross
  if (id === 10908) return 870; // Falinks
  if (id === 10909) return 1000; // Gholdengo
  if (id === 10910) return 972; // Houndstone
  if (id === 10911) return 687; // Malamar
  if (id === 10912) return 303; // Mawile
  if (id === 10913) return 518; // Musharna
  if (id === 10914) return 904; // Overqwil
  if (id === 10915) return 211; // Qwilfish
  if (id === 10916) return 254; // Sceptile
  if (id === 10917) return 545; // Scolipede
  if (id === 10918) return 560; // Scrafty
  if (id === 10919) return 398; // Staraptor
  if (id === 10920) return 260; // Swampert
  if (id === 10921) return 45; // Vileplume
  if (id === 10922) return 668; // Pyroar
  if (id === 10923) return 902; // Basculegion
  if (id === 10924) return 678; // Meowstic
  // Normal Pokémon
  return id;
}

// Regional prefix mappings for display names
function getRegionalPrefix(id, enName) {
  if (enName.startsWith("Hisuian ")) return "Hisuian";
  if (enName.startsWith("Alolan ")) return "Alolan";
  if (enName.startsWith("Galarian ")) return "Galarian";
  if (enName.startsWith("Paldean ")) return "Paldean";
  return null;
}

// Korean regional prefixes
const KOREAN_REGIONAL_PREFIXES = {
  "Hisuian": "히스이",
  "Alolan": "알로라",
  "Galarian": "가라르",
  "Paldean": "팔데아",
};

// Special name overrides for forms that won't map cleanly
const SPECIAL_NAMES = {
  10008: { suffix: " (히트)" },   // Heat Rotom
  10009: { suffix: " (세탁)" },   // Wash Rotom
  10010: { suffix: " (냉동)" },   // Frost Rotom
  10011: { suffix: " (스핀)" },   // Fan Rotom
  10012: { suffix: " (커트)" },   // Mow Rotom
  10061: { suffix: " (이터널)" }, // Eternal Floette
  10678: { suffix: "-F" },         // Meowstic-F
  10902: { suffix: "-F" },         // Basculegion-F
  10251: { suffix: " (블레이즈)" }, // Paldean Tauros Blaze
  10252: { suffix: " (아쿠아)" },  // Paldean Tauros Aqua
};

async function fetchSpeciesName(speciesId) {
  const url = `https://pokeapi.co/api/v2/pokemon-species/${speciesId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch species ${speciesId}: ${res.status}`);
  const data = await res.json();

  const koEntry = data.names.find(n => n.language.name === "ko");
  return koEntry ? koEntry.name : null;
}

async function main() {
  const result = {};
  const speciesCache = {};

  // Batch in groups of 10 to avoid rate limiting
  for (let i = 0; i < roster.length; i += 10) {
    const batch = roster.slice(i, i + 10);

    const promises = batch.map(async ({ id, name }) => {
      const speciesId = getSpeciesId(id);

      // Cache species lookups
      if (!speciesCache[speciesId]) {
        speciesCache[speciesId] = await fetchSpeciesName(speciesId);
      }

      let koName = speciesCache[speciesId];
      if (!koName) {
        console.warn(`  ⚠ No Korean name for ${name} (species ${speciesId}), using English`);
        koName = name;
      }

      // Handle regional forms
      const prefix = getRegionalPrefix(id, name);
      if (prefix) {
        const koPrefix = KOREAN_REGIONAL_PREFIXES[prefix];
        koName = `${koPrefix} ${koName}`;
      }

      // Handle special suffixes (Rotom forms, gender forms)
      if (SPECIAL_NAMES[id]) {
        koName = koName + SPECIAL_NAMES[id].suffix;
      }

      result[name] = koName;
      console.log(`  ✓ ${name} → ${koName}`);
    });

    await Promise.all(promises);

    // Small delay between batches
    if (i + 10 < roster.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Ensure output directory
  const outDir = path.join(ROOT, "src/lib/i18n");
  fs.mkdirSync(outDir, { recursive: true });

  // Write sorted output
  const sorted = Object.fromEntries(
    Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
  );

  const outPath = path.join(outDir, "pokemon-names.ko.json");
  fs.writeFileSync(outPath, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`\n✅ Written ${Object.keys(sorted).length} Korean names to ${outPath}`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
