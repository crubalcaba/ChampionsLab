// ═══════════════════════════════════════════════════════════════════════════════
// CHAMPIONS LAB - COMPREHENSIVE VGC MOVE DATABASE
// Every competitive move with priority, targeting, flags, and effects
// ═══════════════════════════════════════════════════════════════════════════════

import type { PokemonType } from "@/lib/types";

export type MoveCategory = "physical" | "special" | "status";
export type MoveTarget =
  | "normal"           // single adjacent target
  | "allAdjacentFoes"  // both opponents in doubles (spread)
  | "allAdjacent"      // all adjacent including ally (spread)
  | "self"             // user only
  | "adjacentAlly"     // single ally
  | "allySide"         // user's side of the field
  | "foeSide"          // opponent's side
  | "all"              // entire field;

export interface MoveFlags {
  contact?: boolean;         // makes contact (Rough Skin, Rocky Helmet)
  sound?: boolean;           // sound-based (bypasses Substitute)
  bullet?: boolean;          // ball/bomb move (Bulletproof)
  punch?: boolean;           // punching move (Iron Fist)
  bite?: boolean;            // biting move (Strong Jaw)
  slicing?: boolean;         // cutting move (Sharpness)
  wind?: boolean;            // wind move (Wind Rider)
  powder?: boolean;          // powder move (Safety Goggles, Grass immune)
  pulse?: boolean;           // aura/pulse move (Mega Launcher)
  recoil?: number;           // recoil % of damage dealt
  drain?: number;            // drain % of damage dealt (heal)
  selfFaint?: boolean;       // user faints after the move resolves
  protect?: boolean;         // is a Protect variant
  priority?: boolean;        // is a priority move
  ignoresBurn?: boolean;     // bypasses burn damage halving (Facade, Sparkling Aria)
  dealsPhysicalDamage?: boolean; // uses SpA stat but targets Def (Psyshock, Psystrike, Secret Sword)
  charge?: boolean;           // charges turn 1, fires turn 2 (instant in sun for Solar Beam)
  recharge?: boolean;         // must recharge next turn (Hyper Beam etc.)
}

export interface SecondaryEffect {
  chance: number;       // % chance (100 = guaranteed)
  status?: "burn" | "freeze" | "paralysis" | "poison" | "badPoison" | "sleep";
  volatileStatus?: "flinch" | "confusion" | "attract";
  boosts?: Partial<Record<"attack" | "defense" | "spAtk" | "spDef" | "speed" | "accuracy" | "evasion", number>>;
  self?: boolean;       // applies to user instead of target
}

export interface EngineMove {
  name: string;
  type: PokemonType;
  category: MoveCategory;
  basePower: number;    // 0 for status moves
  accuracy: number;     // 0 for always-hit moves (like Aerial Ace, Aura Sphere)
  pp: number;
  priority: number;     // -7 to +5 (Trick Room -7, Protect +4, ExtremeSpeed +2, etc.)
  target: MoveTarget;
  flags: MoveFlags;
  secondary?: SecondaryEffect;
  /** Special behavior description for simulation */
  effect?: string;
  /** Does this move set weather/terrain? */
  fieldEffect?: string;
  /** Stat changes to self */
  selfBoost?: Partial<Record<"attack" | "defense" | "spAtk" | "spDef" | "speed" | "accuracy" | "evasion", number>>;
  /** Number of multi-hits (Population Bomb, Pin Missile, etc.) */
  multiHit?: [number, number]; // [min, max]
  /** Ignores abilities? */
  ignoresAbility?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOVE DATABASE - Comprehensive VGC move data
// ═══════════════════════════════════════════════════════════════════════════════
export const MOVE_DATA: Record<string, EngineMove> = {
    "Chilly Reception": {
    name: "Chilly Reception", type: "ice", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Summons snow for 5 turns. The user switches out of battle to be replaced by another party Pokémon.",
  },
  "Frost Breath": {
    name: "Frost Breath", type: "ice", category: "special", basePower: 60,
    accuracy: 90, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Always a critical hit.",
  },
  "Icicle Spear": {
    name: "Icicle Spear", type: "ice", category: "physical", basePower: 25,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "The user attacks 2 to 5 times in a row.",
  },
  "Sheer Cold": {
    name: "Sheer Cold", type: "ice", category: "special", basePower: 0,
    accuracy: 30, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Knocks out the target. This move does not affect Ice types. The accuracy of this move is fixed at 30%. If used by Pokémon other than Ice types the accuracy of this move is 20%.",
  },
// ── NORMAL ─────────────────────────────────────────────────────────────────
  "Body Slam": {
    name: "Body Slam", type: "normal", category: "physical", basePower: 85,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true },
    secondary: { chance: 30, status: "paralysis" },
  },
  "Double-Edge": {
    name: "Double-Edge", type: "normal", category: "physical", basePower: 120,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, recoil: 33 },
  },
  "Extreme Speed": {
    name: "Extreme Speed", type: "normal", category: "physical", basePower: 80,
    accuracy: 100, pp: 5, priority: 2, target: "normal",
    flags: { contact: true, priority: true },
  },
  "Facade": {
    name: "Facade", type: "normal", category: "physical", basePower: 70,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true, ignoresBurn: true },
    effect: "Doubles power when burned, poisoned, or paralyzed. Bypasses burn damage reduction.",
  },
  "Fake Out": {
    name: "Fake Out", type: "normal", category: "physical", basePower: 40,
    accuracy: 100, pp: 10, priority: 3, target: "normal",
    flags: { contact: true, priority: true },
    secondary: { chance: 100, volatileStatus: "flinch" },
    effect: "Only works on the first turn after switching in.",
  },
  "Headbutt": {
    name: "Headbutt", type: "normal", category: "physical", basePower: 70,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true },
    secondary: { chance: 30, volatileStatus: "flinch" },
  },
  "Hyper Beam": {
    name: "Hyper Beam", type: "normal", category: "special", basePower: 150,
    accuracy: 90, pp: 5, priority: 0, target: "normal",
    flags: { recharge: true },
    effect: "Must recharge next turn.",
  },
  "Hyper Voice": {
    name: "Hyper Voice", type: "normal", category: "special", basePower: 90,
    accuracy: 100, pp: 10, priority: 0, target: "allAdjacentFoes",
    flags: { sound: true },
  },
  "Population Bomb": {
    name: "Population Bomb", type: "normal", category: "physical", basePower: 20,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    multiHit: [1, 10],
  },
  "Quick Attack": {
    name: "Quick Attack", type: "normal", category: "physical", basePower: 40,
    accuracy: 100, pp: 30, priority: 1, target: "normal",
    flags: { contact: true, priority: true },
  },
  "Rapid Spin": {
    name: "Rapid Spin", type: "normal", category: "physical", basePower: 50,
    accuracy: 100, pp: 40, priority: 0, target: "normal",
    flags: { contact: true },
    selfBoost: { speed: 1 },
    effect: "Removes hazards and trapping effects.",
  },
  "Return": {
    name: "Return", type: "normal", category: "physical", basePower: 102,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
  },
  "Super Fang": {
    name: "Super Fang", type: "normal", category: "physical", basePower: 0,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Deals damage equal to 50% of target's current HP.",
  },
  "Thrash": {
    name: "Thrash", type: "normal", category: "physical", basePower: 120,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Attacks for 2-3 turns, then confused.",
  },
  "Explosion": {
    name: "Explosion", type: "normal", category: "physical", basePower: 250,
    accuracy: 100, pp: 5, priority: 0, target: "allAdjacent",
    flags: { selfFaint: true },
    effect: "Hits all adjacent Pokemon. User faints after use.",
  },
  "Self-Destruct": {
    name: "Self-Destruct", type: "normal", category: "physical", basePower: 200,
    accuracy: 100, pp: 5, priority: 0, target: "allAdjacent",
    flags: { selfFaint: true },
    effect: "Hits all adjacent Pokemon. User faints after use.",
  },

    "Axe Kick": {
    name: "Axe Kick", type: "fighting", category: "physical", basePower: 120,
    accuracy: 90, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 30% chance of confusing the target. If this move misses or fails the user takes damage equal to 1/2 of its max HP.",
  },
  "Circle Throw": {
    name: "Circle Throw", type: "fighting", category: "physical", basePower: 60,
    accuracy: 90, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "If there are other Pokémon in the target's party that can switch into battle the target is forced to switch out of battle and is replaced by one of those Pokémon at random.",
  },
  "Cross Chop": {
    name: "Cross Chop", type: "fighting", category: "physical", basePower: 100,
    accuracy: 80, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "This move has a 1-stage Critical-Hit Ratio Boost.",
  },
  "Final Gambit": {
    name: "Final Gambit", type: "fighting", category: "special", basePower: 0,
    accuracy: 100, pp: 8, priority: 0, target: "normal",
    flags: { selfFaint: true },
    effect: "The user faints. This move deals damage to the target equal to the user's remaining HP at the time this move was used.",
  },
  "Flying Press": {
    name: "Flying Press", type: "fighting", category: "physical", basePower: 100,
    accuracy: 95, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The damage dealt by this move is calculated by combining the effectiveness of the move's own type with that of the Flying type. If the target has the Minimized status this move's power is doubled and it will be sure to hit.",
  },
  "Hammer Arm": {
    name: "Hammer Arm", type: "fighting", category: "physical", basePower: 100,
    accuracy: 90, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the user's Speed stat by 1 stage.",
  },
  "Low Sweep": {
    name: "Low Sweep", type: "fighting", category: "physical", basePower: 65,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Speed stat by 1 stage.",
  },
  "No Retreat": {
    name: "No Retreat", type: "fighting", category: "status", basePower: 0,
    accuracy: 0, pp: 8, priority: 0, target: "self",
    flags: {},
    effect: "Boosts the user's Attack, Defense, Sp. Atk, Sp. Def, and Speed stats by 1 stage. The user gains the Can't Escape status. This move can only be used once per time the user enters battleâ otherwise it will fail.",
  },
  "Reversal": {
    name: "Reversal", type: "fighting", category: "physical", basePower: 0,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "The less HP the user has left the greater this move's power (ranging between 20 and 200).",
  },
  "Seismic Toss": {
    name: "Seismic Toss", type: "fighting", category: "physical", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Deals 50 HP of damage.",
  },
  "Storm Throw": {
    name: "Storm Throw", type: "fighting", category: "physical", basePower: 60,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Always a critical hit.",
  },
  "Triple Arrows": {
    name: "Triple Arrows", type: "fighting", category: "physical", basePower: 90,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 50% chance of lowering the target's Defense stat by 1 stage and has a 30% chance of making the target flinch. This move has a 1-stage Critical-Hit Ratio Boost.",
  },
  "Upper Hand": {
    name: "Upper Hand", type: "fighting", category: "physical", basePower: 65,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Makes the target flinch. This move fails if the target isn't about to use a priority move.",
  },
// ── FIRE ───────────────────────────────────────────────────────────────────
  "Eruption": {
    name: "Eruption", type: "fire", category: "special", basePower: 150,
    accuracy: 100, pp: 5, priority: 0, target: "allAdjacentFoes",
    flags: {},
    effect: "Power scales with user's remaining HP (150 × current/max).",
  },
  "Fire Blast": {
    name: "Fire Blast", type: "fire", category: "special", basePower: 110,
    accuracy: 85, pp: 5, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 10, status: "burn" },
  },
  "Fire Punch": {
    name: "Fire Punch", type: "fire", category: "physical", basePower: 75,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, punch: true },
    secondary: { chance: 10, status: "burn" },
  },
  "Flamethrower": {
    name: "Flamethrower", type: "fire", category: "special", basePower: 90,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 10, status: "burn" },
  },
  "Flare Blitz": {
    name: "Flare Blitz", type: "fire", category: "physical", basePower: 120,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, recoil: 33 },
    secondary: { chance: 10, status: "burn" },
  },
  "Heat Wave": {
    name: "Heat Wave", type: "fire", category: "special", basePower: 95,
    accuracy: 90, pp: 10, priority: 0, target: "allAdjacentFoes",
    flags: {},
    secondary: { chance: 10, status: "burn" },
  },
  "Overheat": {
    name: "Overheat", type: "fire", category: "special", basePower: 130,
    accuracy: 90, pp: 5, priority: 0, target: "normal",
    flags: {},
    selfBoost: { spAtk: -2 },
  },
  "Will-O-Wisp": {
    name: "Will-O-Wisp", type: "fire", category: "status", basePower: 0,
    accuracy: 85, pp: 15, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 100, status: "burn" },
  },
  "Armor Cannon": {
    name: "Armor Cannon", type: "fire", category: "special", basePower: 120,
    accuracy: 100, pp: 5, priority: 0, target: "normal",
    flags: {},
    selfBoost: { defense: -1, spDef: -1 },
  },
  "Sunny Day": {
    name: "Sunny Day", type: "fire", category: "status", basePower: 0,
    accuracy: 0, pp: 5, priority: 0, target: "all",
    flags: {},
    fieldEffect: "sun",
  },
  "Matcha Gotcha": {
    name: "Matcha Gotcha", type: "grass", category: "special", basePower: 80,
    accuracy: 90, pp: 15, priority: 0, target: "allAdjacentFoes",
    flags: { drain: 50 },
    secondary: { chance: 20, status: "burn" },
  },
    "Fire Lash": {
    name: "Fire Lash", type: "fire", category: "physical", basePower: 90,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Lowers the target's Defense stat by 1 stage.",
  },

    "Hard Press": {
    name: "Hard Press", type: "steel", category: "physical", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The more HP the target has left the greater this move's power (ranging between 1 and 100).",
  },
    "Make It Rain": {
    name: "Make It Rain", type: "steel", category: "special", basePower: 120,
    accuracy: 95, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the user's Sp. Atk stat by 2 stages.",
  },
  "Metal Sound": {
    name: "Metal Sound", type: "steel", category: "status", basePower: 0,
    accuracy: 85, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Sp. Def stat by 2 stages.",
  },
  "Shelter": {
    name: "Shelter", type: "steel", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "self",
    flags: {},
    effect: "Boosts the user's Defense stat by 2 stages.",
  },
  "Smart Strike": {
    name: "Smart Strike", type: "steel", category: "physical", basePower: 70,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "This move never misses.",
  },
  "Steel Roller": {
    name: "Steel Roller", type: "steel", category: "physical", basePower: 130,
    accuracy: 100, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Removes any terrain. This move fails if there is no terrain on the field.",
  },
  "Steel Wing": {
    name: "Steel Wing", type: "steel", category: "physical", basePower: 70,
    accuracy: 90, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 10% chance of boosting the user's Defense stat by 1 stage.",
  },
// ── WATER ──────────────────────────────────────────────────────────────────
  "Aqua Jet": {
    name: "Aqua Jet", type: "water", category: "physical", basePower: 40,
    accuracy: 100, pp: 20, priority: 1, target: "normal",
    flags: { contact: true, priority: true },
  },
  "Hydro Pump": {
    name: "Hydro Pump", type: "water", category: "special", basePower: 110,
    accuracy: 80, pp: 5, priority: 0, target: "normal",
    flags: {},
  },
  "Liquidation": {
    name: "Liquidation", type: "water", category: "physical", basePower: 85,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    secondary: { chance: 20, boosts: { defense: -1 } },
  },
  "Muddy Water": {
    name: "Muddy Water", type: "water", category: "special", basePower: 90,
    accuracy: 85, pp: 10, priority: 0, target: "allAdjacentFoes",
    flags: {},
    secondary: { chance: 30, boosts: { accuracy: -1 } },
  },
  "Scald": {
    name: "Scald", type: "water", category: "special", basePower: 80,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 30, status: "burn" },
  },
  "Surf": {
    name: "Surf", type: "water", category: "special", basePower: 90,
    accuracy: 100, pp: 15, priority: 0, target: "allAdjacent",
    flags: {},
  },
  "Waterfall": {
    name: "Waterfall", type: "water", category: "physical", basePower: 80,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true },
    secondary: { chance: 20, volatileStatus: "flinch" },
  },
  "Flip Turn": {
    name: "Flip Turn", type: "water", category: "physical", basePower: 60,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Switches out after attacking.",
  },
  "Water Pulse": {
    name: "Water Pulse", type: "water", category: "special", basePower: 60,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { pulse: true },
    secondary: { chance: 20, volatileStatus: "confusion" },
  },
  "Wave Crash": {
    name: "Wave Crash", type: "water", category: "physical", basePower: 120,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true, recoil: 33 },
  },
    "Crabhammer": {
    name: "Crabhammer", type: "water", category: "physical", basePower: 100,
    accuracy: 95, pp: 12, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "This move has a 1-stage Critical-Hit Ratio Boost.",
  },
  "Jet Punch": {
    name: "Jet Punch", type: "water", category: "physical", basePower: 60,
    accuracy: 100, pp: 15, priority: 1, target: "normal",
    flags: { contact: true, punch: true, priority: true },
  },
  "Razor Shell": {
    name: "Razor Shell", type: "water", category: "physical", basePower: 75,
    accuracy: 95, pp: 10, priority: 0, target: "normal",
    flags: { contact: true, slicing: true },
    secondary: { chance: 50, boosts: { defense: -1 } },
  },
  "Weather Ball": {
    name: "Weather Ball", type: "normal", category: "special", basePower: 50,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { bullet: true },
    effect: "Type and power change in weather (100 BP, weather type).",
  },

    "Clangorous Soul": {
    name: "Clangorous Soul", type: "dragon", category: "status", basePower: 0,
    accuracy: 0, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "The user loses 1/3 of its max HP to boost its Attack Defense Sp. Atk Sp. Def and Speed stats by 1 stage. This move fails if the user doesn't have enough remaining HP.",
  },
  "Dragon Cheer": {
    name: "Dragon Cheer", type: "dragon", category: "status", basePower: 0,
    accuracy: 0, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Gives allies a Critical-Hit Ratio Boost. Dragon types receive a 2-stage boost. All other types receive a 1-stage boost.",
  },
  "Dragon Tail": {
    name: "Dragon Tail", type: "dragon", category: "physical", basePower: 60,
    accuracy: 90, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "If there are other Pokémon in the target's party that can switch into battle the target is forced to switch out of battle and is replaced by one of those Pokémon at random.",
  },
  "Scale Shot": {
    name: "Scale Shot", type: "dragon", category: "physical", basePower: 25,
    accuracy: 90, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "The user attacks 2 to 5 times in a row. This move lowers the user's Defense stat by 1 stage and boosts its Speed stat by 1 stage.",
  },
// ── ELECTRIC ───────────────────────────────────────────────────────────────
  "Thunderbolt": {
    name: "Thunderbolt", type: "electric", category: "special", basePower: 90,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 10, status: "paralysis" },
  },
  "Thunder": {
    name: "Thunder", type: "electric", category: "special", basePower: 110,
    accuracy: 70, pp: 10, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 30, status: "paralysis" },
    effect: "Never misses in rain.",
  },
  "Thunder Wave": {
    name: "Thunder Wave", type: "electric", category: "status", basePower: 0,
    accuracy: 90, pp: 20, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 100, status: "paralysis" },
  },
  "Thunder Punch": {
    name: "Thunder Punch", type: "electric", category: "physical", basePower: 75,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, punch: true },
    secondary: { chance: 10, status: "paralysis" },
  },
  "Volt Switch": {
    name: "Volt Switch", type: "electric", category: "special", basePower: 70,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "User switches out after attacking.",
  },
  "Wild Charge": {
    name: "Wild Charge", type: "electric", category: "physical", basePower: 90,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, recoil: 25 },
  },
  "Volt Tackle": {
    name: "Volt Tackle", type: "electric", category: "physical", basePower: 120,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, recoil: 33 },
    secondary: { chance: 10, status: "paralysis" },
  },
  "Nuzzle": {
    name: "Nuzzle", type: "electric", category: "physical", basePower: 20,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
    secondary: { chance: 100, status: "paralysis" },
  },
  "Electro Shot": {
    name: "Electro Shot", type: "electric", category: "special", basePower: 130,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    selfBoost: { spAtk: 1 },
    effect: "Charges turn 1 (boost SpA), fires turn 2. Instant in rain.",
  },
    "Double Shock": {
    name: "Double Shock", type: "electric", category: "physical", basePower: 0,
    accuracy: 0, pp: 0, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "The user loses the Electric type. This move fails unless it is used by an Electric type.",
  },

    "Bitter Malice": {
    name: "Bitter Malice", type: "ghost", category: "special", basePower: 75,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Attack stat by 1 stage.",
  },
  "Confuse Ray": {
    name: "Confuse Ray", type: "ghost", category: "status", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Confuses the target.",
  },
  "Hex": {
    name: "Hex", type: "ghost", category: "special", basePower: 65,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "This move's power is doubled if the target has a status condition.",
  },
  "Night Shade": {
    name: "Night Shade", type: "ghost", category: "special", basePower: 0,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Deals 50 HP of damage.",
  },
  "Rage Fist": {
    name: "Rage Fist", type: "ghost", category: "physical", basePower: 50,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "This move's power is increased by 50 each time the user takes damage from a move, up to a maximum power of 350. If the user switches out of battle, the move's power returns to its usual value.",
  },
  "Shadow Punch": {
    name: "Shadow Punch", type: "ghost", category: "physical", basePower: 60,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "This move never misses.",
  },
  "Spite": {
    name: "Spite", type: "ghost", category: "status", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Removes 4 PP from the move last used by the target.",
  },
  "Trick-or-Treat": {
    name: "Trick-or-Treat", type: "ghost", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Trick-or-Treating status.",
  },
// ── GRASS ──────────────────────────────────────────────────────────────────
  "Energy Ball": {
    name: "Energy Ball", type: "grass", category: "special", basePower: 90,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { bullet: true },
    secondary: { chance: 10, boosts: { spDef: -1 } },
  },
  "Giga Drain": {
    name: "Giga Drain", type: "grass", category: "special", basePower: 75,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { drain: 50 },
  },
  "Grass Knot": {
    name: "Grass Knot", type: "grass", category: "special", basePower: 80,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Power based on target's weight (20-120 BP). Defaults to 80.",
  },
  "Leaf Blade": {
    name: "Leaf Blade", type: "grass", category: "physical", basePower: 90,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, slicing: true },
    effect: "High critical hit ratio.",
  },
  "Leaf Storm": {
    name: "Leaf Storm", type: "grass", category: "special", basePower: 130,
    accuracy: 90, pp: 5, priority: 0, target: "normal",
    flags: {},
    selfBoost: { spAtk: -2 },
  },
  "Power Whip": {
    name: "Power Whip", type: "grass", category: "physical", basePower: 120,
    accuracy: 85, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
  },
  "Sleep Powder": {
    name: "Sleep Powder", type: "grass", category: "status", basePower: 0,
    accuracy: 75, pp: 15, priority: 0, target: "normal",
    flags: { powder: true },
    secondary: { chance: 100, status: "sleep" },
  },
  "Solar Beam": {
    name: "Solar Beam", type: "grass", category: "special", basePower: 120,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { charge: true },
    effect: "Charges turn 1, fires turn 2. Instant in sun.",
  },
  "Leech Seed": {
    name: "Leech Seed", type: "grass", category: "status", basePower: 0,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Drains 1/8 max HP per turn. Fails on Grass types.",
  },
  "Spiky Shield": {
    name: "Spiky Shield", type: "grass", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 4, target: "self",
    flags: { protect: true, priority: true },
    effect: "Protects and damages contact attackers for 1/8 HP.",
  },
  "Wood Hammer": {
    name: "Wood Hammer", type: "grass", category: "physical", basePower: 120,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, recoil: 33 },
  },
  "Flower Trick": {
    name: "Flower Trick", type: "grass", category: "physical", basePower: 70,
    accuracy: 0, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Never misses, always crits.",
  },
  "Seed Bomb": {
    name: "Seed Bomb", type: "grass", category: "physical", basePower: 80,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { bullet: true },
  },
    "Trop Kick": {
    name: "Trop Kick", type: "grass", category: "physical", basePower: 85,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Lowers the target's Attack stat by 1 stage.",
  },
    "Grav Apple": {
    name: "Grav Apple", type: "grass", category: "physical", basePower: 90,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Defense stat by 1 stage. This move's power is boosted by 50% when the Gravity status is active.",
  },

    "Bulldoze": {
    name: "Bulldoze", type: "ground", category: "physical", basePower: 60,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers targets' Speed stats by 1 stage. When Grassy Terrain is active this move's power is halved.",
  },
  "Dig": {
    name: "Dig", type: "ground", category: "physical", basePower: 80,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Underground status on the turn this move is used then attacks on the following turn.",
  },
  "Fissure": {
    name: "Fissure", type: "ground", category: "physical", basePower: 0,
    accuracy: 30, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Knocks out the target. The accuracy of this move is fixed at 30%.",
  },
  "Mud Shot": {
    name: "Mud Shot", type: "ground", category: "special", basePower: 55,
    accuracy: 95, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Speed stat by 1 stage.",
  },
  "Mud-Slap": {
    name: "Mud-Slap", type: "ground", category: "special", basePower: 20,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's accuracy by 1 stage.",
  },
  "Sand Tomb": {
    name: "Sand Tomb", type: "ground", category: "physical", basePower: 35,
    accuracy: 85, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Bound status.",
  },
  "Scorching Sands": {
    name: "Scorching Sands", type: "ground", category: "special", basePower: 70,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 30% chance of burning the target. Cures the user and target of being frozen.",
  },
  "Spikes": {
    name: "Spikes", type: "ground", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "foeSide",
    flags: {},
    effect: "Gives the opponent's side the Spikes status.",
  },
// ── ICE ────────────────────────────────────────────────────────────────────
  "Blizzard": {
    name: "Blizzard", type: "ice", category: "special", basePower: 110,
    accuracy: 70, pp: 5, priority: 0, target: "allAdjacentFoes",
    flags: {},
    secondary: { chance: 10, status: "freeze" },
    effect: "Never misses in hail.",
  },
  "Freeze-Dry": {
    name: "Freeze-Dry", type: "ice", category: "special", basePower: 70,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Super effective against Water types regardless of type chart.",
    secondary: { chance: 10, status: "freeze" },
  },
  "Ice Beam": {
    name: "Ice Beam", type: "ice", category: "special", basePower: 90,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 10, status: "freeze" },
  },
  "Ice Fang": {
    name: "Ice Fang", type: "ice", category: "physical", basePower: 65,
    accuracy: 95, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, bite: true },
    secondary: { chance: 10, status: "freeze" },
  },
  "Ice Hammer": {
    name: "Ice Hammer", type: "ice", category: "physical", basePower: 100,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: { contact: true, punch: true },
    selfBoost: { speed: -1 },
  },
  "Ice Punch": {
    name: "Ice Punch", type: "ice", category: "physical", basePower: 75,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, punch: true },
    secondary: { chance: 10, status: "freeze" },
  },
  "Icy Wind": {
    name: "Icy Wind", type: "ice", category: "special", basePower: 55,
    accuracy: 95, pp: 15, priority: 0, target: "allAdjacentFoes",
    flags: { wind: true },
    secondary: { chance: 100, boosts: { speed: -1 } },
  },
  "Triple Axel": {
    name: "Triple Axel", type: "ice", category: "physical", basePower: 20,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    multiHit: [3, 3],
    effect: "Hits 3 times with increasing power (20, 40, 60).",
  },
  "Aurora Veil": {
    name: "Aurora Veil", type: "ice", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "allySide",
    flags: {},
    effect: "Halves damage from both physical and special attacks for 5 turns. Only works in hail/snow.",
  },
    "Mountain Gale": {
    name: "Mountain Gale", type: "ice", category: "physical", basePower: 120,
    accuracy: 85, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 30% chance of making the target flinch.",
  },

    "Alluring Voice": {
    name: "Alluring Voice", type: "fairy", category: "special", basePower: 80,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Confuses the target if its stats were boosted during the turn this move is used.",
  },
  "Aromatic Mist": {
    name: "Aromatic Mist", type: "fairy", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Boosts an ally's Sp. Def stat by 1 stage.",
  },
  "Baby-Doll Eyes": {
    name: "Baby-Doll Eyes", type: "fairy", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Attack stat by 1 stage.",
  },
  "Fairy Lock": {
    name: "Fairy Lock", type: "fairy", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Gives all Pokémon on the field the Fairy Locked status.",
  },
  "Misty Terrain": {
    name: "Misty Terrain", type: "fairy", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "all",
    flags: {},
    effect: "Turns the entire field into Misty Terrain for 5 turns.",
  },
  "Sweet Kiss": {
    name: "Sweet Kiss", type: "fairy", category: "status", basePower: 0,
    accuracy: 75, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Confuses the target.",
  },
// ── FIGHTING ───────────────────────────────────────────────────────────────
  "Aura Sphere": {
    name: "Aura Sphere", type: "fighting", category: "special", basePower: 80,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: { pulse: true, bullet: true },
  },
  "Bullet Punch": {
    name: "Bullet Punch", type: "steel", category: "physical", basePower: 40,
    accuracy: 100, pp: 30, priority: 1, target: "normal",
    flags: { contact: true, punch: true, priority: true },
  },
  "Close Combat": {
    name: "Close Combat", type: "fighting", category: "physical", basePower: 120,
    accuracy: 100, pp: 5, priority: 0, target: "normal",
    flags: { contact: true },
    selfBoost: { defense: -1, spDef: -1 },
  },
  "Coaching": {
    name: "Coaching", type: "fighting", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "adjacentAlly",
    flags: {},
    effect: "Raises ally's Attack and Defense by 1 stage each.",
  },
  "Counter": {
    name: "Counter", type: "fighting", category: "physical", basePower: 0,
    accuracy: 100, pp: 20, priority: -5, target: "self",
    flags: { contact: true },
    effect: "Returns 2× physical damage received this turn.",
  },
  "Drain Punch": {
    name: "Drain Punch", type: "fighting", category: "physical", basePower: 75,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true, punch: true, drain: 50 },
  },
  "Focus Blast": {
    name: "Focus Blast", type: "fighting", category: "special", basePower: 120,
    accuracy: 70, pp: 5, priority: 0, target: "normal",
    flags: { bullet: true },
    secondary: { chance: 10, boosts: { spDef: -1 } },
  },
  "High Jump Kick": {
    name: "High Jump Kick", type: "fighting", category: "physical", basePower: 130,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "User takes 50% max HP crash damage on miss.",
  },
  "Low Kick": {
    name: "Low Kick", type: "fighting", category: "physical", basePower: 80,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Power based on target's weight (20-120 BP). Defaults to 80.",
  },
  "Mach Punch": {
    name: "Mach Punch", type: "fighting", category: "physical", basePower: 40,
    accuracy: 100, pp: 30, priority: 1, target: "normal",
    flags: { contact: true, punch: true, priority: true },
  },
  "Sacred Sword": {
    name: "Sacred Sword", type: "fighting", category: "physical", basePower: 90,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, slicing: true },
    effect: "Ignores target's stat changes.",
  },
  "Superpower": {
    name: "Superpower", type: "fighting", category: "physical", basePower: 120,
    accuracy: 100, pp: 5, priority: 0, target: "normal",
    flags: { contact: true },
    selfBoost: { attack: -1, defense: -1 },
  },
  "Vacuum Wave": {
    name: "Vacuum Wave", type: "fighting", category: "special", basePower: 40,
    accuracy: 100, pp: 30, priority: 1, target: "normal",
    flags: { priority: true },
  },
  "Power-Up Punch": {
    name: "Power-Up Punch", type: "fighting", category: "physical", basePower: 40,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true, punch: true },
    selfBoost: { attack: 1 },
  },
  "Arm Thrust": {
    name: "Arm Thrust", type: "fighting", category: "physical", basePower: 15,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
    multiHit: [2, 5],
  },
  "Mat Block": {
    name: "Mat Block", type: "fighting", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "allySide",
    flags: {},
    effect: "Protects the user's side from damaging moves. Only works on first turn after switch-in.",
  },
  "Megahorn": {
    name: "Megahorn", type: "bug", category: "physical", basePower: 120,
    accuracy: 85, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
  },

    "Acupressure": {
    name: "Acupressure", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Boosts the Attack Defense Sp. Atk Sp. Def Speed accuracy or evasiveness of the user or an ally by 2 stages.",
  },
  "Attract": {
    name: "Attract", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Infatuated status. This move will fail against a target that is the same gender as the user or whose gender is unknown.",
  },
  "Bind": {
    name: "Bind", type: "normal", category: "physical", basePower: 15,
    accuracy: 85, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Bound status.",
  },
  "Block": {
    name: "Block", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Can't Escape status.",
  },
  "Boomburst": {
    name: "Boomburst", type: "normal", category: "special", basePower: 140,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
  },
  "Copycat": {
    name: "Copycat", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "The user mimics the move that was last used. This move fails if no other move has been used yet.",
  },
  "Covet": {
    name: "Covet", type: "normal", category: "physical", basePower: 60,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "If the user is not already holding an item it steals the target's held item.",
  },
  "Crush Claw": {
    name: "Crush Claw", type: "normal", category: "physical", basePower: 75,
    accuracy: 95, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 50% chance of lowering the target's Defense stat by 1 stage.",
  },
  "Double Hit": {
    name: "Double Hit", type: "normal", category: "physical", basePower: 35,
    accuracy: 90, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user attacks twice in a row.",
  },
  "Double Team": {
    name: "Double Team", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 16, priority: 0, target: "self",
    flags: {},
    effect: "Boosts the user's evasiveness by 1 stage.",
  },
  "Endeavor": {
    name: "Endeavor", type: "normal", category: "physical", basePower: 0,
    accuracy: 100, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Deals damage to the target equal to its remaining HP minus the user's remaining HP. This move fails if the target's HP is the same as or lower than the user's.",
  },
  "Entrainment": {
    name: "Entrainment", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Changes the target's Ability to be the same as the user's.",
  },
  "Flail": {
    name: "Flail", type: "normal", category: "physical", basePower: 0,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "The less HP the user has left the greater this move's power (ranging between 20 and 200).",
  },
  "Focus Energy": {
    name: "Focus Energy", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains a 2-stage Critical-Hit Ratio Boost.",
  },
  "Giga Impact": {
    name: "Giga Impact", type: "normal", category: "physical", basePower: 150,
    accuracy: 90, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Recharging status on the turn after this move is used.",
  },
  "Guillotine": {
    name: "Guillotine", type: "normal", category: "physical", basePower: 0,
    accuracy: 30, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Knocks out the target. The accuracy of this move is fixed at 30%.",
  },
  "Horn Drill": {
    name: "Horn Drill", type: "normal", category: "physical", basePower: 0,
    accuracy: 30, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Knocks out the target. The accuracy of this move is fixed at 30%.",
  },
  "Howl": {
    name: "Howl", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "allySide",
    flags: {},
    effect: "Boosts the Attack stats of the user and its allies by 1 stage.",
  },
  "Last Resort": {
    name: "Last Resort", type: "normal", category: "physical", basePower: 140,
    accuracy: 100, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "This move fails unless the user has already used all the other moves it knows.",
  },
  "Lock-On": {
    name: "Lock-On", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Locked On status.",
  },
  "Mean Look": {
    name: "Mean Look", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Can't Escape status.",
  },
  "Mega Kick": {
    name: "Mega Kick", type: "normal", category: "physical", basePower: 120,
    accuracy: 75, pp: 8, priority: 0, target: "normal",
    flags: {},
  },
  "Milk Drink": {
    name: "Milk Drink", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 8, priority: 0, target: "self",
    flags: { drain: 50 },
    effect: "Restores 1/2 of the user's max HP.",
  },
  "Minimize": {
    name: "Minimize", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "self",
    flags: {},
    effect: "Boosts the user's evasiveness by 2 stages. The user gains the Minimized status.",
  },
  "Noble Roar": {
    name: "Noble Roar", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Attack and Sp. Atk stats by 1 stage.",
  },
  "Pain Split": {
    name: "Pain Split", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "The user adds its remaining HP to the target's remaining HP then splits the total in half for them to share.",
  },
  "Power Shift": {
    name: "Power Shift", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Atk/Def Swapped status.",
  },
  "Psych Up": {
    name: "Psych Up", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user copies the target's stat changes.",
  },
  "Recycle": {
    name: "Recycle", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Regenerates the last held item that the user consumed. The user then holds this item once more.",
  },
  "Reflect Type": {
    name: "Reflect Type", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "The user becomes the same type or types as the target.",
  },
  "Round": {
    name: "Round", type: "normal", category: "special", basePower: 60,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "If multiple Pokémon use this move in the same turn the second user onward will act immediately after the first and the power of the second Round onward will be doubled.",
  },
  "Safeguard": {
    name: "Safeguard", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "allySide",
    flags: {},
    effect: "Gives the user's side the Safeguard status for 5 turns.",
  },
  "Scary Face": {
    name: "Scary Face", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Speed stat by 2 stages.",
  },
  "Screech": {
    name: "Screech", type: "normal", category: "status", basePower: 0,
    accuracy: 85, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Defense stat by 2 stages.",
  },
  "Simple Beam": {
    name: "Simple Beam", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Changes the target's Ability to Simple.",
  },
  "Sing": {
    name: "Sing", type: "normal", category: "status", basePower: 0,
    accuracy: 55, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Puts the target to sleep.",
  },
  "Sleep Talk": {
    name: "Sleep Talk", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Can be used only if the user is asleep. The user uses one of the other moves it knows at random.",
  },
  "Snore": {
    name: "Snore", type: "normal", category: "special", basePower: 50,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Can be used only if the user is asleep. Has a 30% chance of making the target flinch.",
  },
  "Spit Up": {
    name: "Spit Up", type: "normal", category: "special", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The higher the user's Stockpiling level the greater this move's power (ranging between 100 and 300). This move fails unless the user has the Stockpiling status.",
  },
  "Stockpile": {
    name: "Stockpile", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    effect: "Boosts the user's Defense and Sp. Def stats by 1 stage. Raises the user's Stockpiling level by 1. Can be used up to 3 times.",
  },
  "Stuff Cheeks": {
    name: "Stuff Cheeks", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user eats its held Berry and boosts its Defense stat by 2 stages. This move can't be used if the user is not holding a Berry.",
  },
  "Swagger": {
    name: "Swagger", type: "normal", category: "status", basePower: 0,
    accuracy: 85, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Boosts the target's Attack stat by 2 stages and confuses it.",
  },
  "Swallow": {
    name: "Swallow", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "self",
    flags: { drain: 50 },
    effect: "The higher the user's Stockpiling level the more HP the user restores. Level 1 1/4 of the user's max HP is restored. Level 2 1/2 of the user's max HP is restored. Level 3 The user's HP is fully restored. This move fails unless the user has the Stockpiling status.",
  },
  "Sweet Scent": {
    name: "Sweet Scent", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers targets' evasiveness by 2 stages.",
  },
  "Tail Slap": {
    name: "Tail Slap", type: "normal", category: "physical", basePower: 25,
    accuracy: 85, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user attacks 2 to 5 times in a row.",
  },
  "Tearful Look": {
    name: "Tearful Look", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: { protect: true },
    effect: "Lowers the target's Attack and Sp. Atk stats by 1 stage. This move ignores the target's evasiveness and can hit a target using a move such as Protect.",
  },
  "Teatime": {
    name: "Teatime", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Causes all Pokémon on the field to eat their held Berries.",
  },
  "Teeter Dance": {
    name: "Teeter Dance", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Confuses all other Pokémon on the field.",
  },
  "Terrain Pulse": {
    name: "Terrain Pulse", type: "normal", category: "special", basePower: 50,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "This move's power is doubled if the user is under the effect of a terrain. This move's type depends on the terrain.",
  },
  "Tickle": {
    name: "Tickle", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Attack and Defense stats by 1 stage.",
  },
  "Tri Attack": {
    name: "Tri Attack", type: "normal", category: "special", basePower: 80,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 20% chance of leaving the target burned frozen or paralyzed.",
  },
  "Uproar": {
    name: "Uproar", type: "normal", category: "special", basePower: 90,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Uproar status.",
  },
  "Wrap": {
    name: "Wrap", type: "normal", category: "physical", basePower: 15,
    accuracy: 90, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Bound status.",
  },
// ── POISON ─────────────────────────────────────────────────────────────────
  "Poison Jab": {
    name: "Poison Jab", type: "poison", category: "physical", basePower: 80,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
    secondary: { chance: 30, status: "poison" },
  },
  "Sludge Bomb": {
    name: "Sludge Bomb", type: "poison", category: "special", basePower: 90,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { bullet: true },
    secondary: { chance: 30, status: "poison" },
  },
  "Sludge Wave": {
    name: "Sludge Wave", type: "poison", category: "special", basePower: 95,
    accuracy: 100, pp: 10, priority: 0, target: "allAdjacent",
    flags: {},
    secondary: { chance: 10, status: "poison" },
  },
  "Toxic": {
    name: "Toxic", type: "poison", category: "status", basePower: 0,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 100, status: "badPoison" },
  },
  "Baneful Bunker": {
    name: "Baneful Bunker", type: "poison", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 4, target: "self",
    flags: { protect: true, priority: true },
    effect: "Protects and poisons contact attackers.",
  },

    "Cotton Spore": {
    name: "Cotton Spore", type: "grass", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers targets' Speed stats by 2 stages.",
  },
  "Forest's Curse": {
    name: "Forest's Curse", type: "grass", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Forest Cursed status.",
  },
  "Frenzy Plant": {
    name: "Frenzy Plant", type: "grass", category: "special", basePower: 150,
    accuracy: 90, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Recharging status on the turn after this move is used.",
  },
  "Grassy Glide": {
    name: "Grassy Glide", type: "grass", category: "physical", basePower: 55,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "If the user is under the effect of Grassy Terrain this move's priority becomes +1.",
  },
  "Ingrain": {
    name: "Ingrain", type: "grass", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Ingrained status.",
  },
  "Petal Blizzard": {
    name: "Petal Blizzard", type: "grass", category: "physical", basePower: 90,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
  },
  "Petal Dance": {
    name: "Petal Dance", type: "grass", category: "special", basePower: 120,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Rampaging status.",
  },
  "Solar Blade": {
    name: "Solar Blade", type: "grass", category: "physical", basePower: 125,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Charging status on the turn this move is used then attacks on the following turn. In harsh sunlight the user does not gain the Charging status and can attack immediately. This move's power is halved in any other weather condition.",
  },
  "Spicy Extract": {
    name: "Spicy Extract", type: "grass", category: "status", basePower: 0,
    accuracy: 0, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Defense stat by 2 stages and boosts its Attack stat by 2 stages.",
  },
  "Spore": {
    name: "Spore", type: "grass", category: "status", basePower: 0,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Puts the target to sleep.",
  },
  "Stun Spore": {
    name: "Stun Spore", type: "grass", category: "status", basePower: 0,
    accuracy: 75, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Paralyzes the target.",
  },
    "Syrup Bomb": {
    name: "Syrup Bomb", type: "grass", category: "special", basePower: 60,
    accuracy: 90, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Syrupy status for 3 turns.",
  },
  "Trailblaze": {
    name: "Trailblaze", type: "grass", category: "physical", basePower: 50,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Boosts the user's Speed stat by 1 stage.",
  },
  "Worry Seed": {
    name: "Worry Seed", type: "grass", category: "status", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Changes the target's Ability to Insomnia.",
  },
// ── GROUND ─────────────────────────────────────────────────────────────────
  "Earthquake": {
    name: "Earthquake", type: "ground", category: "physical", basePower: 100,
    accuracy: 100, pp: 10, priority: 0, target: "allAdjacent",
    flags: {},
  },
  "High Horsepower": {
    name: "High Horsepower", type: "ground", category: "physical", basePower: 95,
    accuracy: 95, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
  },
  "Headlong Rush": {
    name: "Headlong Rush", type: "ground", category: "physical", basePower: 120,
    accuracy: 100, pp: 5, priority: 0, target: "normal",
    flags: { contact: true, punch: true },
    selfBoost: { defense: -1, spDef: -1 },
  },
  "Earth Power": {
    name: "Earth Power", type: "ground", category: "special", basePower: 90,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 10, boosts: { spDef: -1 } },
  },
  "Stomping Tantrum": {
    name: "Stomping Tantrum", type: "ground", category: "physical", basePower: 75,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Doubles power if user's last move failed.",
  },
    "Bone Rush": {
    name: "Bone Rush", type: "ground", category: "physical", basePower: 30,
    accuracy: 90, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user attacks 2 to 5 times in a row.",
  },

    "Blast Burn": {
    name: "Blast Burn", type: "fire", category: "special", basePower: 150,
    accuracy: 90, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Recharging status on the turn after this move is used.",
  },
  "Blaze Kick": {
    name: "Blaze Kick", type: "fire", category: "physical", basePower: 85,
    accuracy: 90, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 10% chance of burning the target. This move has a 1-stage Critical-Hit Ratio Boost.",
  },
  "Burn Up": {
    name: "Burn Up", type: "fire", category: "special", basePower: 130,
    accuracy: 100, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "The user loses the Fire type. Cures the user of being frozen. This move fails unless it is used by a Fire type.",
  },
  "Burning Jealousy": {
    name: "Burning Jealousy", type: "fire", category: "special", basePower: 70,
    accuracy: 100, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Burns targets if their stats were boosted during the turn this move is used.",
  },
  "Fiery Dance": {
    name: "Fiery Dance", type: "fire", category: "special", basePower: 80,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 50% chance of boosting the user's Sp. Atk stat by 1 stage.",
  },
  "Fire Spin": {
    name: "Fire Spin", type: "fire", category: "special", basePower: 35,
    accuracy: 85, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Bound status.",
  },
  "Heat Crash": {
    name: "Heat Crash", type: "fire", category: "physical", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The more the user outweighs the target the greater this move's power (ranging between 40 and 120). If the target has the Minimized status this move's power is doubled and it will be sure to hit.",
  },
  "Inferno": {
    name: "Inferno", type: "fire", category: "special", basePower: 100,
    accuracy: 50, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Burns the target.",
  },
  "Lava Plume": {
    name: "Lava Plume", type: "fire", category: "special", basePower: 80,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 30% chance of burning targets.",
  },
  "Raging Fury": {
    name: "Raging Fury", type: "fire", category: "physical", basePower: 120,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Rampaging status.",
  },
  "Temper Flare": {
    name: "Temper Flare", type: "fire", category: "physical", basePower: 75,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "This move's power is doubled if the user couldn't act or its move missed or failed on the previous turn.",
  },
// ── FLYING ─────────────────────────────────────────────────────────────────
  "Acrobatics": {
    name: "Acrobatics", type: "flying", category: "physical", basePower: 55,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Doubles power if user has no held item.",
  },
  "Air Slash": {
    name: "Air Slash", type: "flying", category: "special", basePower: 75,
    accuracy: 95, pp: 15, priority: 0, target: "normal",
    flags: { slicing: true },
    secondary: { chance: 30, volatileStatus: "flinch" },
  },
  "Brave Bird": {
    name: "Brave Bird", type: "flying", category: "physical", basePower: 120,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, recoil: 33 },
  },
  "Hurricane": {
    name: "Hurricane", type: "flying", category: "special", basePower: 110,
    accuracy: 70, pp: 10, priority: 0, target: "normal",
    flags: { wind: true },
    secondary: { chance: 30, volatileStatus: "confusion" },
    effect: "Never misses in rain.",
  },
  "Tailwind": {
    name: "Tailwind", type: "flying", category: "status", basePower: 0,
    accuracy: 0, pp: 15, priority: 0, target: "allySide",
    flags: { wind: true },
    effect: "Doubles Speed for user's side for 4 turns.",
  },

    "Acid Armor": {
    name: "Acid Armor", type: "poison", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    effect: "Boosts the user's Defense stat by 2 stages.",
  },
  "Barb Barrage": {
    name: "Barb Barrage", type: "poison", category: "physical", basePower: 60,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 50% chance of poisoning the target. This move's power is doubled if the target is poisoned or badly poisoned.",
  },
  "Belch": {
    name: "Belch", type: "poison", category: "special", basePower: 120,
    accuracy: 90, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "This move fails unless the user has eaten a Berry during the battle.",
  },
  "Clear Smog": {
    name: "Clear Smog", type: "poison", category: "special", basePower: 50,
    accuracy: 0, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Removes all stat changes from the target. This move never misses.",
  },
  "Corrosive Gas": {
    name: "Corrosive Gas", type: "poison", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Causes all other Pokémon on the field to lose their held items.",
  },
  "Cross Poison": {
    name: "Cross Poison", type: "poison", category: "physical", basePower: 70,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 10% chance of poisoning the target. This move has a 1-stage Critical-Hit Ratio Boost.",
  },
  "Gastro Acid": {
    name: "Gastro Acid", type: "poison", category: "status", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the No Ability status.",
  },
  "Poison Fang": {
    name: "Poison Fang", type: "poison", category: "physical", basePower: 50,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 50% chance of badly poisoning the target.",
  },
  "Poison Powder": {
    name: "Poison Powder", type: "poison", category: "status", basePower: 0,
    accuracy: 75, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Poisons the target.",
  },
  "Shell Side Arm": {
    name: "Shell Side Arm", type: "poison", category: "special", basePower: 90,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 20% chance of poisoning the target. Becomes a physical move if that will deal more damage.",
  },
  "Venoshock": {
    name: "Venoshock", type: "poison", category: "special", basePower: 65,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "This move's power is doubled if the target is poisoned or badly poisoned.",
  },
// ── PSYCHIC ────────────────────────────────────────────────────────────────
  "Psychic": {
    name: "Psychic", type: "psychic", category: "special", basePower: 90,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 10, boosts: { spDef: -1 } },
  },
  "Psyshock": {
    name: "Psyshock", type: "psychic", category: "special", basePower: 80,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { dealsPhysicalDamage: true },
    effect: "Targets Defense instead of Sp.Def.",
  },
  "Trick Room": {
    name: "Trick Room", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 5, priority: -7, target: "all",
    flags: {},
    fieldEffect: "trickroom",
    effect: "Reverses move order (slower Pokémon move first) for 5 turns.",
  },
  "Ally Switch": {
    name: "Ally Switch", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 15, priority: 1, target: "self",
    flags: { priority: true },
    effect: "Swaps position with ally.",
  },
  "Heal Pulse": {
    name: "Heal Pulse", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "normal",
    flags: { pulse: true },
    effect: "Heals target for 50% max HP.",
  },
  "Instruct": {
    name: "Instruct", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 15, priority: 0, target: "normal",
    flags: {},
    effect: "Target uses its last move again.",
  },
  "Expanding Force": {
    name: "Expanding Force", type: "psychic", category: "special", basePower: 80,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "In Psychic Terrain, hits all foes and power increases to 120.",
  },
    "Psyshield Bash": {
    name: "Psyshield Bash", type: "psychic", category: "physical", basePower: 90,
    accuracy: 90, pp: 12, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Boosts the user's Defense stat by 1 stage.",
  },

  // ── BUG ────────────────────────────────────────────────────────────────────
  "Bug Bite": {
    name: "Bug Bite", type: "bug", category: "physical", basePower: 60,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Eats target's held berry.",
  },
  "U-turn": {
    name: "U-turn", type: "bug", category: "physical", basePower: 70,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Switches out after attacking.",
  },
  "X-Scissor": {
    name: "X-Scissor", type: "bug", category: "physical", basePower: 80,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, slicing: true },
  },
  "Pin Missile": {
    name: "Pin Missile", type: "bug", category: "physical", basePower: 25,
    accuracy: 95, pp: 20, priority: 0, target: "normal",
    flags: {},
    multiHit: [2, 5],
  },
    "First Impression": {
    name: "First Impression", type: "bug", category: "physical", basePower: 100,
    accuracy: 100, pp: 12, priority: 2, target: "normal",
    flags: { contact: true, priority: true },
    effect: "This move fails unless it is the first move used by the user after it enters a battle.",
  },
  "Pollen Puff": {
    name: "Pollen Puff", type: "bug", category: "special", basePower: 90,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { bullet: true },
    effect: "Heals ally for 50% max HP instead of dealing damage.",
  },

    "Cosmic Power": {
    name: "Cosmic Power", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    effect: "Boosts the user's Defense and Sp. Def stats by 1 stage.",
  },
  "Eerie Spell": {
    name: "Eerie Spell", type: "psychic", category: "special", basePower: 80,
    accuracy: 100, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Removes 3 PP from the move last used by the target.",
  },
  "Gravity": {
    name: "Gravity", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 8, priority: 0, target: "all",
    flags: {},
    effect: "Gives the entire field the Gravity status for 5 turns.",
  },
  "Guard Split": {
    name: "Guard Split", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user adds its Defense stat to the target's Defense stat then splits the total in half for them to share. It does the same with each of their Sp. Def stats.",
  },
  "Guard Swap": {
    name: "Guard Swap", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user swaps the changes to its Defense and Sp. Def stats with the changes to the target's Defense and Sp. Def stats.",
  },
  "Magic Powder": {
    name: "Magic Powder", type: "psychic", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Changes the target's type to Psychic.",
  },
  "Magic Room": {
    name: "Magic Room", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "all",
    flags: {},
    effect: "Gives the entire field the Magic Room status for 5 turns.",
  },
  "Mirror Coat": {
    name: "Mirror Coat", type: "psychic", category: "special", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "The user retaliates to deal double the damage it took from an opponent's special move during the turn this move is used.",
  },
  "Power Split": {
    name: "Power Split", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user adds its Attack stat to the target's Attack stat then splits the total in half for them to share. It does the same with each of their Sp. Atk stats.",
  },
  "Power Swap": {
    name: "Power Swap", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user swaps the changes to its Attack and Sp. Atk stats with the changes to the target's Attack and Sp. Atk stats.",
  },
  "Power Trick": {
    name: "Power Trick", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Atk/Def Swapped status.",
  },
  "Psychic Noise": {
    name: "Psychic Noise", type: "psychic", category: "special", basePower: 75,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Healing Prevented status for 2 turns.",
  },
  "Psychic Terrain": {
    name: "Psychic Terrain", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "all",
    flags: {},
    effect: "Turns the entire field into Psychic Terrain for 5 turns.",
  },
  "Role Play": {
    name: "Role Play", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Changes the user's Ability to be the same as the target's.",
  },
  "Skill Swap": {
    name: "Skill Swap", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user and the target swap their Abilities.",
  },
  "Speed Swap": {
    name: "Speed Swap", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user and the target swap their Speed stats.",
  },
  "Twin Beam": {
    name: "Twin Beam", type: "psychic", category: "special", basePower: 40,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user attacks twice in a row.",
  },
  "Wonder Room": {
    name: "Wonder Room", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "all",
    flags: {},
    effect: "Gives the entire field the Wonder Room status for 5 turns.",
  },
// ── ROCK ───────────────────────────────────────────────────────────────────
  "Rock Slide": {
    name: "Rock Slide", type: "rock", category: "physical", basePower: 75,
    accuracy: 90, pp: 10, priority: 0, target: "allAdjacentFoes",
    flags: {},
    secondary: { chance: 30, volatileStatus: "flinch" },
  },
  "Stone Edge": {
    name: "Stone Edge", type: "rock", category: "physical", basePower: 100,
    accuracy: 80, pp: 5, priority: 0, target: "normal",
    flags: {},
    effect: "High critical hit ratio.",
  },
  "Stealth Rock": {
    name: "Stealth Rock", type: "rock", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "foeSide",
    flags: {},
    effect: "Damages Pokémon switching in based on type effectiveness to Rock.",
  },
  "Rock Blast": {
    name: "Rock Blast", type: "rock", category: "physical", basePower: 25,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: {},
    multiHit: [2, 5],
  },
  "Power Gem": {
    name: "Power Gem", type: "rock", category: "special", basePower: 80,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
  },
  "Stone Axe": {
    name: "Stone Axe", type: "rock", category: "physical", basePower: 65,
    accuracy: 90, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, slicing: true },
    effect: "Sets Stealth Rock on the opponent's side.",
  },
  "Ancient Power": {
    name: "Ancient Power", type: "rock", category: "special", basePower: 60,
    accuracy: 100, pp: 5, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 10, boosts: { attack: 1, defense: 1, spAtk: 1, spDef: 1, speed: 1 }, self: true },
  },

    "Aerial Ace": {
    name: "Aerial Ace", type: "flying", category: "physical", basePower: 60,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "This move never misses.",
  },
  "Air Cutter": {
    name: "Air Cutter", type: "flying", category: "special", basePower: 60,
    accuracy: 95, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "This move has a 1-stage Critical-Hit Ratio Boost.",
  },
  "Bounce": {
    name: "Bounce", type: "flying", category: "physical", basePower: 85,
    accuracy: 85, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Sky-High status on the turn this move is used then attacks on the following turn. This move has a 30% chance of paralyzing the target.",
  },
  "Feather Dance": {
    name: "Feather Dance", type: "flying", category: "status", basePower: 0,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Attack stat by 2 stages.",
  },
  "Fly": {
    name: "Fly", type: "flying", category: "physical", basePower: 90,
    accuracy: 95, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Sky-High status on the turn this move is used then attacks on the following turn.",
  },
  "Pluck": {
    name: "Pluck", type: "flying", category: "physical", basePower: 60,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "If the target is holding a Berry the user eats that Berry and gains its effect.",
  },
  "Sky Attack": {
    name: "Sky Attack", type: "flying", category: "physical", basePower: 140,
    accuracy: 90, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Charging status on the turn this move is used then attacks on the following turn. This move has a 30% chance of making the target flinch and it has a 1-stage Critical-Hit Ratio Boost.",
  },
// ── GHOST ──────────────────────────────────────────────────────────────────
  "Shadow Ball": {
    name: "Shadow Ball", type: "ghost", category: "special", basePower: 80,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { bullet: true },
    secondary: { chance: 20, boosts: { spDef: -1 } },
  },
  "Shadow Claw": {
    name: "Shadow Claw", type: "ghost", category: "physical", basePower: 70,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, slicing: true },
    effect: "High critical hit ratio.",
  },
  "Shadow Sneak": {
    name: "Shadow Sneak", type: "ghost", category: "physical", basePower: 40,
    accuracy: 100, pp: 30, priority: 1, target: "normal",
    flags: { contact: true, priority: true },
  },
  "Phantom Force": {
    name: "Phantom Force", type: "ghost", category: "physical", basePower: 90,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Disappears turn 1, attacks turn 2. Bypasses Protect.",
  },
  "Destiny Bond": {
    name: "Destiny Bond", type: "ghost", category: "status", basePower: 0,
    accuracy: 0, pp: 5, priority: 0, target: "self",
    flags: {},
    effect: "If user faints next turn, attacker also faints.",
  },
    "Spirit Shackle": {
    name: "Spirit Shackle", type: "ghost", category: "physical", basePower: 90,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Can't Escape status.",
  },

    "Assurance": {
    name: "Assurance", type: "dark", category: "physical", basePower: 60,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "This move's power is doubled if the target has already taken damage during the turn this move is used.",
  },
  "Brutal Swing": {
    name: "Brutal Swing", type: "dark", category: "physical", basePower: 60,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
  },
  "Comeuppance": {
    name: "Comeuppance", type: "dark", category: "physical", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user retaliates to deal 150% of the damage it took from an opponent's move during the turn this move is used.",
  },
  "Flatter": {
    name: "Flatter", type: "dark", category: "status", basePower: 0,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Boosts the target's Sp. Atk stat by 1 stage and confuses it.",
  },
  "Fling": {
    name: "Fling", type: "dark", category: "physical", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "This move's power and effects depend on the user's held item. The held item is lost after this move is used.",
  },
  "Lash Out": {
    name: "Lash Out", type: "dark", category: "physical", basePower: 75,
    accuracy: 100, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "This move's power is doubled if the user's stats were lowered during the turn this move is used.",
  },
  "Memento": {
    name: "Memento", type: "dark", category: "status", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: { selfFaint: true },
    effect: "Lowers the target's Attack and Sp. Atk stats by 2 stages. The user faints upon using this move.",
  },
  "Payback": {
    name: "Payback", type: "dark", category: "physical", basePower: 50,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "This move's power is doubled if the user attacks after the target.",
  },
  "Power Trip": {
    name: "Power Trip", type: "dark", category: "physical", basePower: 20,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "This move's power is increased by 20 for each stage that the user's stats have been boosted.",
  },
  "Switcheroo": {
    name: "Switcheroo", type: "dark", category: "status", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user and the target swap their held items.",
  },
  "Thief": {
    name: "Thief", type: "dark", category: "physical", basePower: 60,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "If the user is not already holding an item it steals the target's held item.",
  },
  "Topsy-Turvy": {
    name: "Topsy-Turvy", type: "dark", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Inverts all stat changes affecting the target.",
  },
  "Torment": {
    name: "Torment", type: "dark", category: "status", basePower: 0,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Unable to Repeat status.",
  },
// ── DRAGON ─────────────────────────────────────────────────────────────────
  "Draco Meteor": {
    name: "Draco Meteor", type: "dragon", category: "special", basePower: 130,
    accuracy: 90, pp: 5, priority: 0, target: "normal",
    flags: {},
    selfBoost: { spAtk: -2 },
  },
  "Dragon Claw": {
    name: "Dragon Claw", type: "dragon", category: "physical", basePower: 80,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, slicing: true },
  },
  "Dragon Dance": {
    name: "Dragon Dance", type: "dragon", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    selfBoost: { attack: 1, speed: 1 },
  },
  "Dragon Darts": {
    name: "Dragon Darts", type: "dragon", category: "physical", basePower: 50,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    multiHit: [2, 2],
    effect: "In doubles, hits each opponent once.",
  },
  "Dragon Pulse": {
    name: "Dragon Pulse", type: "dragon", category: "special", basePower: 85,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { pulse: true },
  },
  "Clanging Scales": {
    name: "Clanging Scales", type: "dragon", category: "special", basePower: 110,
    accuracy: 100, pp: 5, priority: 0, target: "allAdjacentFoes",
    flags: { sound: true },
    selfBoost: { defense: -1 },
  },
    "Dire Claw": {
    name: "Dire Claw", type: "poison", category: "physical", basePower: 80,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Has a 30% chance of leaving the target poisoned paralyzed or asleep.",
  },

    "Pounce": {
    name: "Pounce", type: "bug", category: "physical", basePower: 50,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Speed stat by 1 stage.",
  },
  "String Shot": {
    name: "String Shot", type: "bug", category: "status", basePower: 0,
    accuracy: 95, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers targets' Speed stats by 2 stages.",
  },
  "Struggle Bug": {
    name: "Struggle Bug", type: "bug", category: "special", basePower: 50,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers targets' Sp. Atk stats by 1 stage.",
  },
// ── DARK ───────────────────────────────────────────────────────────────────
  "Crunch": {
    name: "Crunch", type: "dark", category: "physical", basePower: 80,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, bite: true },
    secondary: { chance: 20, boosts: { defense: -1 } },
  },
  "Dark Pulse": {
    name: "Dark Pulse", type: "dark", category: "special", basePower: 80,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { pulse: true },
    secondary: { chance: 20, volatileStatus: "flinch" },
  },
  "Foul Play": {
    name: "Foul Play", type: "dark", category: "physical", basePower: 95,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Uses target's Attack stat instead of user's.",
  },
  "Knock Off": {
    name: "Knock Off", type: "dark", category: "physical", basePower: 65,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Removes target's held item. 50% power boost if target has an item (97.5 BP).",
  },
  "Night Slash": {
    name: "Night Slash", type: "dark", category: "physical", basePower: 70,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, slicing: true },
    effect: "High critical hit ratio.",
  },
  "Snarl": {
    name: "Snarl", type: "dark", category: "special", basePower: 55,
    accuracy: 95, pp: 15, priority: 0, target: "allAdjacentFoes",
    flags: { sound: true },
    secondary: { chance: 100, boosts: { spAtk: -1 } },
  },
  "Sucker Punch": {
    name: "Sucker Punch", type: "dark", category: "physical", basePower: 70,
    accuracy: 100, pp: 5, priority: 1, target: "normal",
    flags: { contact: true, priority: true },
    effect: "Fails if target is not attacking.",
  },
  "Taunt": {
    name: "Taunt", type: "dark", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Prevents target from using status moves for 3 turns.",
  },
  "Beat Up": {
    name: "Beat Up", type: "dark", category: "physical", basePower: 0,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Hits once for each party Pokémon. Base power = (Party member's base Atk / 10) + 5.",
  },
  "Kowtow Cleave": {
    name: "Kowtow Cleave", type: "dark", category: "physical", basePower: 85,
    accuracy: 0, pp: 10, priority: 0, target: "normal",
    flags: { contact: true, slicing: true },
    effect: "Never misses.",
  },
    "Night Daze": {
    name: "Night Daze", type: "dark", category: "special", basePower: 90,
    accuracy: 95, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 40% chance of lowering the target's accuracy by 1 stage.",
  },

    "Rock Polish": {
    name: "Rock Polish", type: "rock", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    effect: "Boosts the user's Speed stat by 2 stages.",
  },
  "Rock Tomb": {
    name: "Rock Tomb", type: "rock", category: "physical", basePower: 60,
    accuracy: 95, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Speed stat by 1 stage.",
  },
  "Rock Wrecker": {
    name: "Rock Wrecker", type: "rock", category: "physical", basePower: 150,
    accuracy: 90, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Recharging status on the turn after this move is used.",
  },
  "Smack Down": {
    name: "Smack Down", type: "rock", category: "physical", basePower: 50,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "If the target is off the ground it gains the Landed status. This move can hit a target that has the Sky-High status.",
  },
// ── STEEL ──────────────────────────────────────────────────────────────────
  "Flash Cannon": {
    name: "Flash Cannon", type: "steel", category: "special", basePower: 80,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 10, boosts: { spDef: -1 } },
  },
    "Iron Head": {
    name: "Iron Head", type: "steel", category: "physical", basePower: 80,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Has a 20% chance of making the target flinch.",
  },
  "Iron Tail": {
    name: "Iron Tail", type: "steel", category: "physical", basePower: 100,
    accuracy: 75, pp: 15, priority: 0, target: "normal",
    flags: { contact: true },
    secondary: { chance: 30, boosts: { defense: -1 } },
  },
  "King's Shield": {
    name: "King's Shield", type: "steel", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 4, target: "self",
    flags: { protect: true, priority: true },
    effect: "Protects and lowers contact attacker's Attack by 1 stage.",
  },
  "Meteor Mash": {
    name: "Meteor Mash", type: "steel", category: "physical", basePower: 90,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: { contact: true, punch: true },
    secondary: { chance: 20, boosts: { attack: 1 }, self: true },
  },
  "Gigaton Hammer": {
    name: "Gigaton Hammer", type: "steel", category: "physical", basePower: 160,
    accuracy: 100, pp: 5, priority: 0, target: "normal",
    flags: {},
    effect: "Cannot be used consecutively.",
  },

    "Eerie Impulse": {
    name: "Eerie Impulse", type: "electric", category: "status", basePower: 0,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Sp. Atk stat by 2 stages.",
  },
  "Electric Terrain": {
    name: "Electric Terrain", type: "electric", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "all",
    flags: {},
    effect: "Turns the entire field into Electric Terrain for 5 turns.",
  },
  "Electrify": {
    name: "Electrify", type: "electric", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "If this move hits the target before it uses a move its move becomes Electric type for that turn.",
  },
  "Electro Ball": {
    name: "Electro Ball", type: "electric", category: "special", basePower: 0,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The higher the user's Speed stat compared to the target's the greater this move's power (ranging between 40 and 150).",
  },
  "Magnet Rise": {
    name: "Magnet Rise", type: "electric", category: "status", basePower: 0,
    accuracy: 0, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Magnet Rise status.",
  },
  "Magnetic Flux": {
    name: "Magnetic Flux", type: "electric", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "If the user or its allies have the Plus Ability or the Minus Ability their Defense and Sp. Def stats are boosted by 1 stage.",
  },
  "Parabolic Charge": {
    name: "Parabolic Charge", type: "electric", category: "special", basePower: 65,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "The user's HP is restored by 1/2 of the damage dealt by this move.",
  },
  "Rising Voltage": {
    name: "Rising Voltage", type: "electric", category: "special", basePower: 70,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "This move's power is doubled if the target is under the effect of Electric Terrain.",
  },
  "Supercell Slam": {
    name: "Supercell Slam", type: "electric", category: "physical", basePower: 100,
    accuracy: 95, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "If this move misses or fails the user takes damage equal to 1/2 of its max HP. If the target has the Minimized status this move's power is doubled and it will be sure to hit.",
  },
  "Thunder Fang": {
    name: "Thunder Fang", type: "electric", category: "physical", basePower: 65,
    accuracy: 95, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 10% chance of paralyzing the target and a 10% chance of making the target flinch.",
  },
  "Zap Cannon": {
    name: "Zap Cannon", type: "electric", category: "special", basePower: 120,
    accuracy: 50, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "Paralyzes the target.",
  },
// ── FAIRY ──────────────────────────────────────────────────────────────────
  "Dazzling Gleam": {
    name: "Dazzling Gleam", type: "fairy", category: "special", basePower: 80,
    accuracy: 100, pp: 10, priority: 0, target: "allAdjacentFoes",
    flags: {},
  },
    "Moonblast": {
    name: "Moonblast", type: "fairy", category: "special", basePower: 95,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 10% chance of lowering the target's Sp. Atk stat by 1 stage.",
  },
  "Play Rough": {
    name: "Play Rough", type: "fairy", category: "physical", basePower: 90,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    secondary: { chance: 10, boosts: { attack: -1 } },
  },
  "Misty Explosion": {
    name: "Misty Explosion", type: "fairy", category: "special", basePower: 100,
    accuracy: 100, pp: 5, priority: 0, target: "allAdjacent",
    flags: { selfFaint: true },
    effect: "Hits all adjacent Pokemon. User faints after use.",
  },
  "Light of Ruin": {
    name: "Light of Ruin", type: "fairy", category: "special", basePower: 140,
    accuracy: 90, pp: 5, priority: 0, target: "normal",
    flags: { recoil: 50 },
    effect: "User takes 1/2 of the damage dealt as recoil.",
  },

  // ── STATUS / SUPPORT ──────────────────────────────────────────────────────
  "Protect": {
    name: "Protect", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 4, target: "self",
    flags: { protect: true, priority: true },
    effect: "Blocks most moves for one turn. Successive uses halve success rate.",
  },
  "Detect": {
    name: "Detect", type: "fighting", category: "status", basePower: 0,
    accuracy: 0, pp: 5, priority: 4, target: "self",
    flags: { protect: true, priority: true },
    effect: "Blocks most moves for one turn. Cannot be blocked by Imprison.",
  },
  "Wide Guard": {
    name: "Wide Guard", type: "rock", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 3, target: "allySide",
    flags: { priority: true },
    effect: "Protects user's side from spread moves for one turn.",
  },
  "Quick Guard": {
    name: "Quick Guard", type: "fighting", category: "status", basePower: 0,
    accuracy: 0, pp: 15, priority: 3, target: "allySide",
    flags: { priority: true },
    effect: "Protects user's side from priority moves for one turn.",
  },
  "Follow Me": {
    name: "Follow Me", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 2, target: "self",
    flags: { priority: true },
    effect: "Redirects all single-target moves to user.",
  },
  "Rage Powder": {
    name: "Rage Powder", type: "bug", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 2, target: "self",
    flags: { powder: true, priority: true },
    effect: "Redirects all single-target moves to user. Fails on Grass types and Safety Goggles.",
  },
  "Helping Hand": {
    name: "Helping Hand", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 5, target: "adjacentAlly",
    flags: { priority: true },
    effect: "Boosts ally's move damage by 50% this turn.",
  },
  "After You": {
    name: "After You", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 15, priority: 0, target: "normal",
    flags: {},
    effect: "Makes target move immediately after user.",
  },
  "Light Screen": {
    name: "Light Screen", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 30, priority: 0, target: "allySide",
    flags: {},
    effect: "Halves special damage to user's side for 5 turns.",
  },
  "Reflect": {
    name: "Reflect", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "allySide",
    flags: {},
    effect: "Halves physical damage to user's side for 5 turns.",
  },
  "Haze": {
    name: "Haze", type: "ice", category: "status", basePower: 0,
    accuracy: 0, pp: 30, priority: 0, target: "all",
    flags: {},
    effect: "Resets all stat changes for all Pokémon on the field.",
  },
  "Encore": {
    name: "Encore", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 5, priority: 0, target: "normal",
    flags: {},
    effect: "Forces target to repeat its last move for 3 turns.",
  },
  "Disable": {
    name: "Disable", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Prevents target from using its last move for 4 turns.",
  },
  "Glare": {
    name: "Glare", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 30, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 100, status: "paralysis" },
  },
  "Yawn": {
    name: "Yawn", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Target falls asleep at end of next turn.",
  },
  "Roar": {
    name: "Roar", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: -6, target: "normal",
    flags: { sound: true },
    effect: "Forces target to switch out.",
  },
  "Whirlwind": {
    name: "Whirlwind", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: -6, target: "normal",
    flags: { wind: true },
    effect: "Forces target to switch out.",
  },
  "Trick": {
    name: "Trick", type: "psychic", category: "status", basePower: 0,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Swaps held items with target.",
  },
  "Substitute": {
    name: "Substitute", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "self",
    flags: {},
    effect: "Sacrifices 25% max HP to create a decoy that absorbs damage.",
  },
  "Shed Tail": {
    name: "Shed Tail", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "self",
    flags: {},
    effect: "Creates a substitute using 50% of max HP, then switches out.",
  },
  "Endure": {
    name: "Endure", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 4, target: "self",
    flags: { priority: true },
    effect: "Survives any attack with at least 1 HP.",
  },
  "Rest": {
    name: "Rest", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 5, priority: 0, target: "self",
    flags: {},
    effect: "Fully heals HP and status but sleeps for 2 turns.",
  },
  "Roost": {
    name: "Roost", type: "flying", category: "status", basePower: 0,
    accuracy: 0, pp: 5, priority: 0, target: "self",
    flags: {},
    effect: "Heals 50% max HP. Loses Flying type for the turn.",
  },
  "Soft-Boiled": {
    name: "Soft-Boiled", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 5, priority: 0, target: "self",
    flags: {},
    effect: "Heals 50% max HP.",
  },
  "Slack Off": {
    name: "Slack Off", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 5, priority: 0, target: "self",
    flags: {},
    effect: "Heals 50% max HP.",
  },
  "Wish": {
    name: "Wish", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "self",
    flags: {},
    effect: "Heals user or incoming Pokémon for 50% max HP at end of next turn.",
  },
  "Aromatherapy": {
    name: "Aromatherapy", type: "grass", category: "status", basePower: 0,
    accuracy: 0, pp: 5, priority: 0, target: "allySide",
    flags: {},
    effect: "Cures status conditions for the entire party.",
  },
  "Heal Bell": {
    name: "Heal Bell", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 5, priority: 0, target: "allySide",
    flags: { sound: true },
    effect: "Cures status conditions for the entire party.",
  },
    "Revival Blessing": {
    name: "Revival Blessing", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 0, priority: 0, target: "self",
    flags: {},
    effect: "Revives a Pok mon in the user's party that has fainted and restores 1/2 of that Pok mon's max HP.",
  },

  // ── STAT BOOSTING ──────────────────────────────────────────────────────────
  "Swords Dance": {
    name: "Swords Dance", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    selfBoost: { attack: 2 },
  },
  "Nasty Plot": {
    name: "Nasty Plot", type: "dark", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    selfBoost: { spAtk: 2 },
  },
  "Calm Mind": {
    name: "Calm Mind", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    selfBoost: { spAtk: 1, spDef: 1 },
  },
  "Bulk Up": {
    name: "Bulk Up", type: "fighting", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    selfBoost: { attack: 1, defense: 1 },
  },
  "Belly Drum": {
    name: "Belly Drum", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "self",
    flags: {},
    selfBoost: { attack: 6 },
    effect: "Maximizes Attack but costs 50% max HP.",
  },
  "Shell Smash": {
    name: "Shell Smash", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 15, priority: 0, target: "self",
    flags: {},
    selfBoost: { attack: 2, spAtk: 2, speed: 2, defense: -1, spDef: -1 },
  },
  "Cotton Guard": {
    name: "Cotton Guard", type: "grass", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "self",
    flags: {},
    selfBoost: { defense: 3 },
  },
  "Agility": {
    name: "Agility", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 30, priority: 0, target: "self",
    flags: {},
    selfBoost: { speed: 2 },
  },
  "Coil": {
    name: "Coil", type: "poison", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    selfBoost: { attack: 1, defense: 1, accuracy: 1 },
  },
  "Curse": {
    name: "Curse", type: "ghost", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "self",
    flags: {},
    selfBoost: { attack: 1, defense: 1, speed: -1 },
    effect: "If user is Ghost type, costs 50% HP to curse target instead.",
  },
  "Tidy Up": {
    name: "Tidy Up", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "self",
    flags: {},
    selfBoost: { attack: 1, speed: 1 },
    effect: "Also removes hazards and substitutes.",
  },
  "Order Up": {
    name: "Order Up", type: "dragon", category: "physical", basePower: 80,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Boost depends on Tatsugiri form in mouth (Atk/Def/Spe +1).",
  },
    "Growth": {
    name: "Growth", type: "grass", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    effect: "Boosts the user's Attack and Sp. Atk stats by 1 stage. In harsh sunlight these stats will be boosted by 2 stages instead.",
  },

  // ── WEATHER SETTERS ────────────────────────────────────────────────────────
  "Rain Dance": {
    name: "Rain Dance", type: "water", category: "status", basePower: 0,
    accuracy: 0, pp: 5, priority: 0, target: "all",
    flags: {},
    fieldEffect: "rain",
  },
  "Sandstorm": {
    name: "Sandstorm", type: "rock", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "all",
    flags: {},
    fieldEffect: "sand",
  },
  "Snowscape": {
    name: "Snowscape", type: "ice", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "all",
    flags: {},
    fieldEffect: "snow",
  },

  // ── ADDITIONAL COMPETITIVE MOVES ──────────────────────────────────────────
  "Fickle Beam": {
    name: "Fickle Beam", type: "dragon", category: "special", basePower: 80,
    accuracy: 100, pp: 5, priority: 0, target: "normal",
    flags: {},
    effect: "30% chance to double power to 160.",
  },
  "Body Press": {
    name: "Body Press", type: "fighting", category: "physical", basePower: 80,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Uses Defense stat instead of Attack for damage calculation.",
  },
  "Bite": {
    name: "Bite", type: "dark", category: "physical", basePower: 60,
    accuracy: 100, pp: 25, priority: 0, target: "normal",
    flags: { contact: true, bite: true },
    secondary: { chance: 30, volatileStatus: "flinch" },
  },
  "Hidden Power Fire": {
    name: "Hidden Power Fire", type: "fire", category: "special", basePower: 60,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: {},
  },

  // ── MISSING COMPETITIVE MOVES ──────────────────────────────────────
  "Darkest Lariat": {
    name: "Darkest Lariat", type: "dark", category: "physical", basePower: 85,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Ignores target's stat changes.",
  },
  "Drill Run": {
    name: "Drill Run", type: "ground", category: "physical", basePower: 80,
    accuracy: 95, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
  },
  "Fell Stinger": {
    name: "Fell Stinger", type: "bug", category: "physical", basePower: 50,
    accuracy: 100, pp: 25, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Sharply raises Attack if this KOs the target.",
  },
  "Morning Sun": {
    name: "Morning Sun", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 5, priority: 0, target: "self",
    flags: {},
    effect: "Heals 50% HP (more in sun).",
  },
  "Perish Song": {
    name: "Perish Song", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 5, priority: 0, target: "all",
    flags: {},
    effect: "All Pokemon faint in 3 turns unless they switch.",
  },
  "Feint": {
    name: "Feint", type: "normal", category: "physical", basePower: 30,
    accuracy: 100, pp: 10, priority: 2, target: "normal",
    flags: {},
    effect: "Hits through Protect.",
  },
  "Flame Charge": {
    name: "Flame Charge", type: "fire", category: "physical", basePower: 50,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
    selfBoost: { speed: 1 },
  },
  "Dual Wingbeat": {
    name: "Dual Wingbeat", type: "flying", category: "physical", basePower: 40,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    multiHit: [2, 2],
  },
  "Extrasensory": {
    name: "Extrasensory", type: "psychic", category: "special", basePower: 80,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 10, volatileStatus: "flinch" },
  },
  "Transform": {
    name: "Transform", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Transforms into the target.",
  },
  "Stored Power": {
    name: "Stored Power", type: "psychic", category: "special", basePower: 20,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Power increases with stat boosts.",
  },
  "Gyro Ball": {
    name: "Gyro Ball", type: "steel", category: "physical", basePower: 1,
    accuracy: 100, pp: 5, priority: 0, target: "normal",
    flags: { contact: true, bullet: true },
    effect: "More power the slower the user is vs the target (max 150).",
  },
  "Drill Peck": {
    name: "Drill Peck", type: "flying", category: "physical", basePower: 80,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
  },
  "Quash": {
    name: "Quash", type: "dark", category: "status", basePower: 0,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: {},
    effect: "Forces target to move last this turn.",
  },
  "Recover": {
    name: "Recover", type: "normal", category: "status", basePower: 0,
    accuracy: 100, pp: 5, priority: 0, target: "self",
    flags: {},
    effect: "Heals 50% HP.",
  },
  "Heavy Slam": {
    name: "Heavy Slam", type: "steel", category: "physical", basePower: 80,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "More damage if user is much heavier than target.",
  },
  "Iron Defense": {
    name: "Iron Defense", type: "steel", category: "status", basePower: 0,
    accuracy: 100, pp: 15, priority: 0, target: "self",
    flags: {},
    selfBoost: { defense: 2 },
  },
  "Head Smash": {
    name: "Head Smash", type: "rock", category: "physical", basePower: 150,
    accuracy: 80, pp: 5, priority: 0, target: "normal",
    flags: { contact: true, recoil: 50 },
    effect: "User takes 50% recoil damage.",
  },
  "Zen Headbutt": {
    name: "Zen Headbutt", type: "psychic", category: "physical", basePower: 80,
    accuracy: 90, pp: 15, priority: 0, target: "normal",
    flags: { contact: true },
    secondary: { chance: 20, volatileStatus: "flinch" },
  },
  "Fire Fang": {
    name: "Fire Fang", type: "fire", category: "physical", basePower: 65,
    accuracy: 95, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, bite: true },
    secondary: { chance: 10, status: "burn" },
  },
  "Ice Shard": {
    name: "Ice Shard", type: "ice", category: "physical", basePower: 40,
    accuracy: 100, pp: 30, priority: 1, target: "normal",
    flags: {},
  },
  "Psycho Cut": {
    name: "Psycho Cut", type: "psychic", category: "physical", basePower: 70,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { slicing: true },
  },
  "Charm": {
    name: "Charm", type: "fairy", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers target's Attack by 2.",
  },
  "Gunk Shot": {
    name: "Gunk Shot", type: "poison", category: "physical", basePower: 120,
    accuracy: 80, pp: 5, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 30, status: "poison" },
  },
  "Discharge": {
    name: "Discharge", type: "electric", category: "special", basePower: 80,
    accuracy: 100, pp: 15, priority: 0, target: "allAdjacent",
    flags: {},
    secondary: { chance: 30, status: "paralysis" },
  },
  "Poltergeist": {
    name: "Poltergeist", type: "ghost", category: "physical", basePower: 110,
    accuracy: 90, pp: 5, priority: 0, target: "normal",
    flags: {},
    effect: "Fails if the target has no held item.",
  },
  "Quiver Dance": {
    name: "Quiver Dance", type: "bug", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "self",
    flags: {},
    selfBoost: { spAtk: 1, spDef: 1, speed: 1 },
  },
  "Bug Buzz": {
    name: "Bug Buzz", type: "bug", category: "special", basePower: 90,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { sound: true },
    effect: "10% chance to lower target's Sp. Def.",
  },
  "Mystical Fire": {
    name: "Mystical Fire", type: "fire", category: "special", basePower: 75,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers target's Sp. Atk by 1.",
  },
  "Synthesis": {
    name: "Synthesis", type: "grass", category: "status", basePower: 0,
    accuracy: 100, pp: 5, priority: 0, target: "self",
    flags: {},
    effect: "Heals 50% HP.",
  },
  "Toxic Spikes": {
    name: "Toxic Spikes", type: "poison", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "foeSide",
    flags: {},
    effect: "Poisons grounded foes switching in.",
  },
  "Parting Shot": {
    name: "Parting Shot", type: "dark", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { sound: true },
    effect: "Lowers target's Attack and Sp. Atk by 1, then switches out.",
  },
  "Water Shuriken": {
    name: "Water Shuriken", type: "water", category: "special", basePower: 15,
    accuracy: 100, pp: 20, priority: 1, target: "normal",
    flags: {},
    multiHit: [2, 5],
  },
  "Accelerock": {
    name: "Accelerock", type: "rock", category: "physical", basePower: 40,
    accuracy: 100, pp: 20, priority: 1, target: "normal",
    flags: { contact: true },
  },
  "Lunge": {
    name: "Lunge", type: "bug", category: "physical", basePower: 80,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Lowers target's Attack by 1.",
  },
  "Outrage": {
    name: "Outrage", type: "dragon", category: "physical", basePower: 120,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Attacks for 2-3 turns, then confuses the user.",
  },
  "Bullet Seed": {
    name: "Bullet Seed", type: "grass", category: "physical", basePower: 25,
    accuracy: 100, pp: 30, priority: 0, target: "normal",
    flags: { bullet: true },
    multiHit: [2, 5],
  },
    "Beak Blast": {
    name: "Beak Blast", type: "flying", category: "physical", basePower: 120,
    accuracy: 100, pp: 8, priority: -3, target: "normal",
    flags: { bullet: true },
    effect: "If the user is hit by a contact move before it uses this move the attacker will be burned.",
  },
  "Leech Life": {
    name: "Leech Life", type: "bug", category: "physical", basePower: 80,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true, drain: 50 },
  },
  "Infestation": {
    name: "Infestation", type: "bug", category: "special", basePower: 20,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Traps target for 4-5 turns, dealing 1/8 HP per turn.",
  },
  "Healing Wish": {
    name: "Healing Wish", type: "psychic", category: "status", basePower: 0,
    accuracy: 100, pp: 10, priority: 0, target: "self",
    flags: {},
    effect: "User faints. Next switch-in is fully healed.",
  },
  // ── Competitive set moves (added 01/04/2026) ──────────────────────────
    "Apple Acid": {
    name: "Apple Acid", type: "grass", category: "special", basePower: 90,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Sp. Def stat by 1 stage.",
  },
  "Aqua Step": {
    name: "Aqua Step", type: "water", category: "physical", basePower: 80,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Raises the user's Speed by one stage.",
    selfBoost: { speed: 1 },
  },
  "Aura Wheel": {
    name: "Aura Wheel", type: "electric", category: "physical", basePower: 110,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Type changes based on Morpeko's form. Raises user's Speed.",
    selfBoost: { speed: 1 },
  },
  "Avalanche": {
    name: "Avalanche", type: "ice", category: "physical", basePower: 60,
    accuracy: 100, pp: 10, priority: -4, target: "normal",
    flags: { contact: true },
    effect: "Doubles in power if the user was hit first this turn.",
  },
  "Bitter Blade": {
    name: "Bitter Blade", type: "fire", category: "physical", basePower: 90,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true, slicing: true },
    effect: "Heals 50% of damage dealt.",
  },
  "Breaking Swipe": {
    name: "Breaking Swipe", type: "dragon", category: "physical", basePower: 60,
    accuracy: 100, pp: 15, priority: 0, target: "allAdjacentFoes",
    flags: { contact: true },
    effect: "Lowers the target's Attack by one stage.",
    secondary: { chance: 100, boosts: { attack: -1 } },
  },
  "Ceaseless Edge": {
    name: "Ceaseless Edge", type: "dark", category: "physical", basePower: 65,
    accuracy: 90, pp: 15, priority: 0, target: "normal",
    flags: { contact: true, slicing: true },
    effect: "Sets Spikes on the target's side. High crit ratio.",
  },
  "Decorate": {
    name: "Decorate", type: "fairy", category: "status", basePower: 0,
    accuracy: 0, pp: 15, priority: 0, target: "normal",
    flags: {},
    effect: "Raises the target's Attack and Sp. Atk by 2 stages.",
  },
  "Horn Leech": {
    name: "Horn Leech", type: "grass", category: "physical", basePower: 75,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Heals 50% of damage dealt.",
  },
  "Ice Spinner": {
    name: "Ice Spinner", type: "ice", category: "physical", basePower: 80,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Removes terrain from the field.",
  },
  "Icicle Crash": {
    name: "Icicle Crash", type: "ice", category: "physical", basePower: 85,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "30% chance to flinch the target.",
    secondary: { chance: 30, volatileStatus: "flinch" },
  },
    "Infernal Parade": {
    name: "Infernal Parade", type: "ghost", category: "special", basePower: 65,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Has a 30% chance of burning the target. This move's power is doubled if the target has a status condition.",
  },
  "Last Respects": {
    name: "Last Respects", type: "ghost", category: "physical", basePower: 50,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Power increases by 50 for each fainted party member.",
  },
  "Meteor Beam": {
    name: "Meteor Beam", type: "rock", category: "special", basePower: 120,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Charges on turn 1 (raises Sp. Atk), fires on turn 2. Power Herb skips charge.",
  },
  "Mortal Spin": {
    name: "Mortal Spin", type: "poison", category: "physical", basePower: 30,
    accuracy: 100, pp: 15, priority: 0, target: "allAdjacentFoes",
    flags: { contact: true },
    effect: "Removes hazards and poisons all targets.",
  },
  "Salt Cure": {
    name: "Salt Cure", type: "rock", category: "physical", basePower: 40,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: {},
    effect: "Deals 1/8 HP per turn (1/4 for Water/Steel types).",
  },
    "Snap Trap": {
    name: "Snap Trap", type: "steel", category: "physical", basePower: 35,
    accuracy: 100, pp: 16, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Gives the target the Bound status.",
  },
  "Spirit Break": {
    name: "Spirit Break", type: "fairy", category: "physical", basePower: 75,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Lowers the target's Sp. Atk by one stage.",
    secondary: { chance: 100, boosts: { spAtk: -1 } },
  },
  "Torch Song": {
    name: "Torch Song", type: "fire", category: "special", basePower: 80,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { sound: true },
    effect: "Raises the user's Sp. Atk by one stage.",
    selfBoost: { spAtk: 1 },
  },

  // ── MISSING COMPETITIVE MOVES (added by audit 09/04/2026) ─────────────────
  "Acid Spray": {
    name: "Acid Spray", type: "poison", category: "special", basePower: 40,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: { bullet: true },
    secondary: { chance: 100, boosts: { spDef: -2 } },
  },
  "Amnesia": {
    name: "Amnesia", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    selfBoost: { spDef: 2 },
  },
  "Baton Pass": {
    name: "Baton Pass", type: "normal", category: "status", basePower: 0,
    accuracy: 0, pp: 40, priority: 0, target: "self",
    flags: {},
    effect: "Switches out, passing stat changes and certain effects to the replacement.",
  },
  "Brick Break": {
    name: "Brick Break", type: "fighting", category: "physical", basePower: 75,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Shatters Light Screen and Reflect before dealing damage.",
  },
  "Charge": {
    name: "Charge", type: "electric", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "self",
    flags: {},
    selfBoost: { spDef: 1 },
    effect: "Doubles the power of the user's next Electric-type move.",
  },
  "Defog": {
    name: "Defog", type: "flying", category: "status", basePower: 0,
    accuracy: 0, pp: 15, priority: 0, target: "normal",
    flags: {},
    effect: "Clears all hazards, screens, and terrain from both sides.",
  },
  "Dragon Rush": {
    name: "Dragon Rush", type: "dragon", category: "physical", basePower: 100,
    accuracy: 75, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    secondary: { chance: 20, volatileStatus: "flinch" },
  },
  "Dynamic Punch": {
    name: "Dynamic Punch", type: "fighting", category: "physical", basePower: 100,
    accuracy: 50, pp: 5, priority: 0, target: "normal",
    flags: { contact: true, punch: true },
    secondary: { chance: 100, volatileStatus: "confusion" },
  },
  "Electroweb": {
    name: "Electroweb", type: "electric", category: "special", basePower: 55,
    accuracy: 95, pp: 15, priority: 0, target: "allAdjacentFoes",
    flags: {},
    secondary: { chance: 100, boosts: { speed: -1 } },
  },
  "Fake Tears": {
    name: "Fake Tears", type: "dark", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 100, boosts: { spDef: -2 } },
  },
  "Focus Punch": {
    name: "Focus Punch", type: "fighting", category: "physical", basePower: 150,
    accuracy: 100, pp: 20, priority: -3, target: "normal",
    flags: { contact: true, punch: true },
    effect: "Fails if the user is hit before it can execute.",
  },
  "Grassy Terrain": {
    name: "Grassy Terrain", type: "grass", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "all",
    flags: {},
    fieldEffect: "grassyterrain",
    effect: "Sets Grassy Terrain for 5 turns. Heals grounded Pokemon 1/16 HP per turn.",
  },
  "Hypnosis": {
    name: "Hypnosis", type: "psychic", category: "status", basePower: 0,
    accuracy: 60, pp: 20, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 100, status: "sleep" },
  },
  "Lumina Crash": {
    name: "Lumina Crash", type: "psychic", category: "special", basePower: 80,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 100, boosts: { spDef: -2 } },
  },
  "Metal Burst": {
    name: "Metal Burst", type: "steel", category: "physical", basePower: 0,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Returns 1.5x the damage received from the last hit.",
  },
  "Moonlight": {
    name: "Moonlight", type: "fairy", category: "status", basePower: 0,
    accuracy: 0, pp: 5, priority: 0, target: "self",
    flags: {},
    effect: "Heals 50% HP (66% in sun, 25% in other weather).",
  },
  "Psychic Fangs": {
    name: "Psychic Fangs", type: "psychic", category: "physical", basePower: 85,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true, bite: true },
    effect: "Shatters Light Screen and Reflect before dealing damage.",
  },
  "Raging Bull": {
    name: "Raging Bull", type: "normal", category: "physical", basePower: 90,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Type depends on the user's form. Shatters Light Screen and Reflect.",
  },
  "Skitter Smack": {
    name: "Skitter Smack", type: "bug", category: "physical", basePower: 70,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: { contact: true },
    secondary: { chance: 100, boosts: { spAtk: -1 } },
  },
  "Steel Beam": {
    name: "Steel Beam", type: "steel", category: "special", basePower: 140,
    accuracy: 95, pp: 5, priority: 0, target: "normal",
    flags: {},
    effect: "User loses 50% of max HP as recoil.",
  },
  "Sticky Web": {
    name: "Sticky Web", type: "bug", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "foeSide",
    flags: {},
    effect: "Lowers Speed of opposing Pokemon that switch in by 1 stage.",
  },
  "Toxic Thread": {
    name: "Toxic Thread", type: "poison", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 100, status: "poison" },
    effect: "Poisons the target and lowers its Speed by 2 stages.",
  },
  "Burning Bulwark": {
    name: "Burning Bulwark", type: "fire", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 4, target: "self",
    flags: { protect: true, priority: true },
    effect: "Blocks most moves for one turn. Contact moves burn the attacker.",
  },
  "Charge Beam": {
    name: "Charge Beam", type: "electric", category: "special", basePower: 50,
    accuracy: 90, pp: 10, priority: 0, target: "normal",
    flags: {},
    secondary: { chance: 70, self: true, boosts: { spAtk: 1 } },
  },
  "Draining Kiss": {
    name: "Draining Kiss", type: "fairy", category: "special", basePower: 50,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: { drain: 0.75, contact: true },
  },
  "Future Sight": {
    name: "Future Sight", type: "psychic", category: "special", basePower: 120,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Hits the target two turns after use. Ignores Protect and type immunities.",
  },
  "Imprison": {
    name: "Imprison", type: "psychic", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "self",
    flags: {},
    effect: "Prevents the target from using any moves the user knows.",
  },
  "Life Dew": {
    name: "Life Dew", type: "water", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 0, target: "self",
    flags: {},
    effect: "Restores the user and ally's HP by 25% of their max HP.",
  },
  "Silk Trap": {
    name: "Silk Trap", type: "bug", category: "status", basePower: 0,
    accuracy: 0, pp: 10, priority: 4, target: "self",
    flags: { protect: true, priority: true },
    effect: "Blocks most moves for one turn. Lowers Attack of contact attackers by 1 stage.",
  },
  "Strength Sap": {
    name: "Strength Sap", type: "grass", category: "status", basePower: 0,
    accuracy: 100, pp: 10, priority: 0, target: "normal",
    flags: {},
    effect: "Restores HP equal to the target's Attack stat and lowers its Attack by 1 stage.",
    secondary: { chance: 100, boosts: { attack: -1 } },
  },
  "Struggle": {
    name: "Struggle", type: "normal", category: "physical", basePower: 50,
    accuracy: 0, pp: 1, priority: 0, target: "normal",
    flags: { recoil: 25 },
    effect: "Used only when the user has no usable moves. User takes 25% recoil damage.",
  },
  "Throat Chop": {
    name: "Throat Chop", type: "dark", category: "physical", basePower: 80,
    accuracy: 100, pp: 15, priority: 0, target: "normal",
    flags: { contact: true },
    effect: "Prevents the target from using sound-based moves for two turns.",
  },
  "Aqua Cutter": {
    name: "Aqua Cutter", type: "water", category: "physical", basePower: 70,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "This move has a 1-stage Critical-Hit Ratio Boost.",
  },
  "Aqua Ring": {
    name: "Aqua Ring", type: "water", category: "status", basePower: 0,
    accuracy: 0, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Aqua Ring status.",
  },
  "Aqua Tail": {
    name: "Aqua Tail", type: "water", category: "physical", basePower: 90,
    accuracy: 90, pp: 12, priority: 0, target: "normal",
    flags: {},
  },
  "Chilling Water": {
    name: "Chilling Water", type: "water", category: "special", basePower: 50,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Lowers the target's Attack stat by 1 stage.",
  },
  "Dive": {
    name: "Dive", type: "water", category: "physical", basePower: 80,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Submerged status on the turn this move is used then attacks on the following turn.",
  },
  "Hydro Cannon": {
    name: "Hydro Cannon", type: "water", category: "special", basePower: 150,
    accuracy: 90, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "The user gains the Recharging status on the turn after this move is used.",
  },
  "Soak": {
    name: "Soak", type: "water", category: "status", basePower: 0,
    accuracy: 100, pp: 20, priority: 0, target: "normal",
    flags: {},
    effect: "Changes the target's type to Water.",
  },
  "Sparkling Aria": {
    name: "Sparkling Aria", type: "water", category: "special", basePower: 90,
    accuracy: 100, pp: 12, priority: 0, target: "normal",
    flags: {},
    effect: "Cures targets of their burns.",
  },
  "Water Spout": {
    name: "Water Spout", type: "water", category: "special", basePower: 150,
    accuracy: 100, pp: 8, priority: 0, target: "normal",
    flags: {},
    effect: "The less HP the user has left the lower this move's power (ranging between 1 and 150).",
  },
  "Whirlpool": {
    name: "Whirlpool", type: "water", category: "special", basePower: 35,
    accuracy: 85, pp: 16, priority: 0, target: "normal",
    flags: {},
    effect: "Gives the target the Bound status. This move's power is doubled if the target has the Submerged status.",
  },

};

/** Look up a move by name */
export function getMove(name: string): EngineMove | undefined {
  return MOVE_DATA[name];
}

/** Is this a spread move? (hits multiple targets in doubles) */
export function isSpreadMove(move: EngineMove): boolean {
  return move.target === "allAdjacentFoes" || move.target === "allAdjacent";
}

/** Is this a priority move? */
export function isPriorityMove(move: EngineMove): boolean {
  return move.priority !== 0;
}

/** Is this a protect variant? */
export function isProtectMove(move: EngineMove): boolean {
  return !!move.flags.protect;
}

/** Get effective base power considering spread reduction in doubles */
export function getEffectiveBP(move: EngineMove, isDoubles: boolean = true): number {
  let bp = move.basePower;
  if (isDoubles && isSpreadMove(move)) {
    bp = Math.floor(bp * 0.75); // Spread moves do 75% damage in doubles
  }
  return bp;
}

/** Categorize a move for team building analysis */
export function getMoveRole(move: EngineMove): string {
  if (move.flags.protect) return "protection";
  if (move.effect?.includes("switch") || move.name === "U-turn" || move.name === "Volt Switch") return "pivot";
  if (move.selfBoost) return "setup";
  if (move.fieldEffect) return "field-control";
  if (move.name === "Tailwind" || move.name === "Trick Room" || move.name === "Icy Wind") return "speed-control";
  if (move.name === "Helping Hand" || move.name === "Coaching") return "support";
  if (move.name === "Fake Out" || move.name === "First Impression") return "disruption";
  if (move.name === "Follow Me" || move.name === "Rage Powder") return "redirection";
  if (move.name === "Taunt" || move.name === "Encore" || move.name === "Disable") return "disruption";
  if (move.category !== "status" && move.basePower >= 100) return "nuke";
  if (move.category !== "status" && isSpreadMove(move)) return "spread-damage";
  if (move.priority > 0 && move.category !== "status") return "priority-damage";
  if (move.category !== "status") return "damage";
  return "utility";
}
