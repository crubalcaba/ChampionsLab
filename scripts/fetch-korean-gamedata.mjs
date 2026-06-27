#!/usr/bin/env node
/**
 * Fetch Korean names AND descriptions for moves, abilities, items, and natures from PokéAPI.
 *
 * Usage: node scripts/fetch-korean-gamedata.mjs
 * Outputs:
 *   src/lib/i18n/moves.ko.json
 *   src/lib/i18n/abilities.ko.json
 *   src/lib/i18n/items.ko.json
 *   src/lib/i18n/natures.ko.json
 *   src/lib/i18n/move-descriptions.ko.json
 *   src/lib/i18n/ability-descriptions.ko.json
 *   src/lib/i18n/item-descriptions.ko.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const I18N_DIR = path.join(ROOT, "src/lib/i18n");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

const moveNames = Object.keys(readJson(path.join(I18N_DIR, "move-descriptions.en.json")));
const abilityNames = Object.keys(readJson(path.join(I18N_DIR, "ability-descriptions.en.json")));
const itemNames = Object.keys(readJson(path.join(I18N_DIR, "item-descriptions.en.json")));
const natureNames = Object.keys(readJson(path.join(I18N_DIR, "natures.fr.json")));

console.log(`Moves: ${moveNames.length}, Abilities: ${abilityNames.length}, Items: ${itemNames.length}, Natures: ${natureNames.length}`);

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

const MOVE_SLUG_OVERRIDES = {
  "Freeze-Dry": "freeze-dry",
  "Power-Up Punch": "power-up-punch",
  "Double-Edge": "double-edge",
  "Self-Destruct": "self-destruct",
  "Wake-Up Slap": "wake-up-slap",
  "X-Scissor": "x-scissor",
  "U-turn": "u-turn",
  "Will-O-Wisp": "will-o-wisp",
  "Trick-or-Treat": "trick-or-treat",
  "V-create": "v-create",
  "Baby-Doll Eyes": "baby-doll-eyes",
  "Lock-On": "lock-on",
  "Mud-Slap": "mud-slap",
  "Hidden Power Fire": "hidden-power",
};
const ABILITY_SLUG_OVERRIDES = {
  "Zero To Hero": "zero-to-hero",
};
const ITEM_SLUG_OVERRIDES = {
  "BrightPowder": "bright-powder",
};
const NATURE_SLUG_OVERRIDES = {};

const BATCH_SIZE = 15;
const DELAY_MS = 250;
const LANG = "ko";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function pickFlavor(entries) {
  if (!entries) return null;
  const order = ["scarlet-violet", "sword-shield", "ultra-sun-ultra-moon", "sun-moon", "omega-ruby-alpha-sapphire", "x-y"];
  for (const vg of order) {
    const e = entries.find(e => e.language.name === LANG && e.version_group?.name === vg);
    if (e) return e;
  }
  return entries.find(e => e.language.name === LANG) ?? null;
}

function cleanText(t) {
  return (t ?? "").replace(/[\n\f\r]+/g, " ").replace(/\u00ad/g, "").replace(/\s+/g, " ").trim();
}

async function fetchOne(endpoint, slug) {
  const url = `https://pokeapi.co/api/v2/${endpoint}/${slug}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const nameEntry = data.names?.find(n => n.language.name === LANG);
    const name = nameEntry?.name ?? null;

    let description = null;
    const flavor = pickFlavor(data.flavor_text_entries);
    if (flavor) {
      description = cleanText(flavor.flavor_text ?? flavor.text);
    }
    if (!description) {
      const effect = data.effect_entries?.find(e => e.language.name === LANG);
      if (effect) description = cleanText(effect.short_effect ?? effect.effect);
    }
    return { name, description };
  } catch (err) {
    return null;
  }
}

async function fetchNature(slug) {
  const url = `https://pokeapi.co/api/v2/nature/${slug}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const nameEntry = data.names?.find(n => n.language.name === LANG);
    return nameEntry?.name ?? null;
  } catch {
    return null;
  }
}

async function fetchBatch(endpoint, names, slugOverrides) {
  const resultNames = {};
  const resultDescs = {};
  const failed = [];

  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const batch = names.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (name) => {
      const slug = slugOverrides[name] ?? toSlug(name);
      const data = await fetchOne(endpoint, slug);
      if (!data) { failed.push({ name, slug }); return; }
      if (data.name) resultNames[name] = data.name;
      if (data.description) resultDescs[name] = data.description;
    });
    await Promise.all(promises);
    const done = Math.min(i + BATCH_SIZE, names.length);
    process.stdout.write(`\r  ${endpoint}: ${done}/${names.length}`);
    if (i + BATCH_SIZE < names.length) await sleep(DELAY_MS);
  }
  console.log();
  return { resultNames, resultDescs, failed };
}

async function fetchNatures(names) {
  const result = {};
  const failed = [];
  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const batch = names.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (name) => {
      const slug = NATURE_SLUG_OVERRIDES[name] ?? toSlug(name);
      const koName = await fetchNature(slug);
      if (koName) {
        result[name] = koName;
      } else {
        failed.push({ name, slug });
      }
    });
    await Promise.all(promises);
    const done = Math.min(i + BATCH_SIZE, names.length);
    process.stdout.write(`\r  nature: ${done}/${names.length}`);
    if (i + BATCH_SIZE < names.length) await sleep(DELAY_MS);
  }
  console.log();
  return { result, failed };
}

async function main() {
  console.log("\n🇰🇷 Fetching Korean game data from PokéAPI...\n");

  console.log("Fetching moves...");
  const moves = await fetchBatch("move", moveNames, MOVE_SLUG_OVERRIDES);
  if (moves.failed.length) {
    console.log(`  ${moves.failed.length} moves not found:`);
    moves.failed.forEach(f => console.log(`    - ${f.name} (slug: ${f.slug})`));
  }

  console.log("Fetching abilities...");
  const abilities = await fetchBatch("ability", abilityNames, ABILITY_SLUG_OVERRIDES);
  if (abilities.failed.length) {
    console.log(`  ${abilities.failed.length} abilities not found:`);
    abilities.failed.forEach(f => console.log(`    - ${f.name} (slug: ${f.slug})`));
  }

  console.log("Fetching items...");
  const items = await fetchBatch("item", itemNames, ITEM_SLUG_OVERRIDES);
  if (items.failed.length) {
    console.log(`  ${items.failed.length} items not found:`);
    items.failed.forEach(f => console.log(`    - ${f.name} (slug: ${f.slug})`));
  }

  console.log("Fetching natures...");
  const natures = await fetchNatures(natureNames);
  if (natures.failed.length) {
    console.log(`  ${natures.failed.length} natures not found:`);
    natures.failed.forEach(f => console.log(`    - ${f.name} (slug: ${f.slug})`));
  }

  const sortObj = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));

  const write = (file, data) => {
    fs.writeFileSync(path.join(I18N_DIR, file), JSON.stringify(sortObj(data), null, 2) + "\n");
    console.log(`  Wrote ${Object.keys(data).length} entries -> src/lib/i18n/${file}`);
  };

  console.log("");
  write("moves.ko.json", moves.resultNames);
  write("move-descriptions.ko.json", moves.resultDescs);
  write("abilities.ko.json", abilities.resultNames);
  write("ability-descriptions.ko.json", abilities.resultDescs);
  write("items.ko.json", items.resultNames);
  write("item-descriptions.ko.json", items.resultDescs);
  write("natures.ko.json", natures.result);
}

main().catch(console.error);
