import { POKEMON_SEED } from "../src/lib/pokemon-data.ts";
import { ITEMS } from "../src/lib/engine/items.ts";

const megaStones = Object.values(ITEMS).filter((i) => i.isMegaStone);
const stoneForPokemon = new Set(megaStones.map((i) => i.forPokemon));

const missing: { base: string; mega: string }[] = [];

for (const p of POKEMON_SEED) {
  if (p.hidden) continue;
  for (const f of p.forms || []) {
    if (!f.isMega) continue;
    // X/Y megas share the same base pokemon; the stone name will include X/Y
    const baseName = p.name;
    const normalizedName = baseName.replace(/-M$|-F$/, "");
    const suffix = f.name.endsWith(" X") ? " X" : f.name.endsWith(" Y") ? " Y" : "";
    const stone = megaStones.find(
      (s) =>
        (s.forPokemon === baseName || s.forPokemon === normalizedName) &&
        (suffix ? s.name.endsWith(suffix) : !s.name.match(/ite [XY]$/))
    );
    if (!stone) {
      missing.push({ base: baseName, mega: f.name });
    }
  }
}

console.log(`Total mega stones: ${megaStones.length}`);
console.log(`Missing stones: ${missing.length}`);
for (const m of missing) {
  console.log(`- ${m.mega} (base: ${m.base})`);
}
