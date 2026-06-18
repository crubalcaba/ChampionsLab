import { POKEMON_SEED } from "../src/lib/pokemon-data.ts";
import fs from "fs";

const report = JSON.parse(fs.readFileSync("scripts/stats-validation-report.json", "utf8"));

let file = fs.readFileSync("src/lib/pokemon-data.ts", "utf8");
let changes = 0;

// Manual override for Floette since Serebii page only lists Eternal Floette
const FLOETTE_OVERRIDE = {
  "Floette": { hp: 74, attack: 65, defense: 67, spAtk: 125, spDef: 128, speed: 92 },
  "Mega Floette": { hp: 74, attack: 85, defense: 87, spAtk: 155, spDef: 148, speed: 102 },
};

function parseStats(str) {
  const [hp, attack, defense, spAtk, spDef, speed] = str.split("/").map((s) => parseInt(s.trim(), 10));
  return { hp, attack, defense, spAtk, spDef, speed };
}

function statsString(stats) {
  return `{ "hp": ${stats.hp}, "attack": ${stats.attack}, "defense": ${stats.defense}, "spAtk": ${stats.spAtk}, "spDef": ${stats.spDef}, "speed": ${stats.speed} }`;
}

function replaceStat(formName, newStats) {
  const newStr = statsString(newStats);
  // Match baseStats inside a form object with the given form name
  const regex = new RegExp(
    `"name": "${formName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",\\s*"sprite": "[^"]*",\\s*"types": \\[[^\\]]*\\],\\s*"baseStats": \\{[^}]+\\}`,
    "g"
  );
  const replaced = file.replace(regex, (match) => {
    return match.replace(/"baseStats": \{[^}]+\}/, `"baseStats": ${newStr}`);
  });
  if (replaced !== file) {
    file = replaced;
    changes++;
    console.log(`Updated ${formName}: ${newStr}`);
    return true;
  }
  return false;
}

function replaceBaseStat(pokemonName, newStats) {
  const newStr = statsString(newStats);
  // Match the baseStats of the top-level pokemon by name
  const regex = new RegExp(
    `"name": "${pokemonName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",\\s*"dexNumber":\\s*\\d+,\\s*"types": \\[[^\\]]*\\],\\s*"baseStats": \\{[^}]+\\}`,
    "g"
  );
  const replaced = file.replace(regex, (match) => {
    return match.replace(/"baseStats": \{[^}]+\}/, `"baseStats": ${newStr}`);
  });
  if (replaced !== file) {
    file = replaced;
    changes++;
    console.log(`Updated ${pokemonName} base: ${newStr}`);
    return true;
  }
  return false;
}

for (const m of report.mismatches) {
  if (m.serebii === "no matching table found") continue;
  const stats = parseStats(m.serebii);
  const ok = replaceStat(m.form, stats);
  if (!ok) {
    // Try base form
    const okBase = replaceBaseStat(m.form, stats);
    if (!okBase) {
      console.log(`WARNING: could not update ${m.pokemon} / ${m.form}`);
    }
  }
}

// Apply Floette override
for (const [formName, stats] of Object.entries(FLOETTE_OVERRIDE)) {
  const ok = replaceStat(formName, stats);
  if (!ok) {
    const okBase = replaceBaseStat(formName, stats);
    if (!okBase) {
      console.log(`WARNING: could not update Floette form ${formName}`);
    }
  }
}

fs.writeFileSync("src/lib/pokemon-data.ts", file);
console.log(`\nTotal changes: ${changes}`);
