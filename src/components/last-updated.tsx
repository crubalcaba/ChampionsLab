"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { ArrowUpRight, X, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ChangelogEntry {
  date: string;
  items: string[];
}

  const SHARED_ENTRIES: ChangelogEntry[] = [
    {
      date: "18/06/2026",
      items: [
        "✅ Validated every active Pokémon/Form base stat against Serebii's Pokémon Champions section — fixed 33 incorrect stat spreads including Mega Eelektross, Mega Delphox, all Mega Raichu forms, and Floette (now Eternal Floette)",
      ],
    },
    {
      date: "17/06/2026",
      items: [
        "🤖 Refreshed battle-bot training data — 2,000,000 simulated battles, 853 teams, 271 Pokémon, updated ELO rankings, synergies, counters, and archetype insights",
      ],
    },
    {
      date: "17/06/2026",
      items: [
        "🔧 Fixed mega stone auto-equip in Team Builder for new megas — enabling Mega Mawile / Mega Metagross now correctly sets Mawilite / Metagrossite",
      ],
    },
    {
      date: "17/06/2026",
      items: [
        "💎 Added missing Mawilite mega stone to the item list",
      ],
    },
    {
      date: "17/06/2026",
      items: [
        "🐾 Unhid Grimmsnarl, Metagross, and Mega Metagross — they now appear in the Pokédex and Team Builder for Regulation M-B",
      ],
    },
    {
      date: "17/06/2026",
      items: [
        "🏆 Refreshed tournament data from Limitless TCG — synced 470 Regulation M-A tournaments (~21,800 teams), updated meta usage rankings and top-cut teams through mid-June 2026",
      ],
    },
    {
      date: "17/06/2026",
      items: [
        "🌐 Added Monthly Challenge Series June 2026 online competition — Regulation M-B Single Battle, June 26–29, rewards Tyranitar, 100 Quick Coupons, and the MCS 06/2026 Challenger title for 3+ battles",
      ],
    },
    {
      date: "17/06/2026",
      items: [
        "🖼️ Uploaded all missing sprites to Hetzner Object Storage — 59 new sprite files including the 22 Regulation M-B base Pokémon, 34 Champions mega forms, 4 official mega forms, and Mega Meowstic official art",
        "🛡️ Fixed ability descriptions and flags across the full roster — every ability now has a proper description pulled from the battle engine and the correct Champions/existing flag (Mega Raichu X/Y, Mega Clefable, etc. no longer show empty text)",
        "➕ Added 18 missing battle-engine abilities used by mega forms: Electric Surge, Aerilate, Pixilate, Refrigerate, Huge Power, Pure Power, Speed Boost, Skill Link, No Guard, Filter, Magic Bounce, Shadow Tag, Berserk, Trace, Infiltrator, Stalwart, Innards Out, and Healer",
      ],
    },
    {
      date: "17/06/2026",
      items: [
        "🗓️ Added Season M-3 / Regulation M-B — active from June 17th through July 8th, with the Regulation running until September 2nd",
        "✅ Validated all 38 Regulation M-B roster additions against Serebii's Regulation M-B page — including Mega Raichu X/Y, Vileplume, Sceptile/Blaziken/Swampert/Mawile mega lines, and the new Champions megas",
        "➕ Added missing official Mega forms for Sceptile, Blaziken, Swampert, and Mawile to complete their Regulation M-B entries",
        "🔧 Regulation end date is now stored per-season and displayed dynamically in the season info card",
      ],
    },
    {
      date: "17/06/2026",
      items: [
        "🐾 Restored 22 missing base Pokémon to the Season 1 roster — Annihilape, Barbaracle, Blaziken, Dragalge, Eelektross, Falinks, Gholdengo, Houndstone, Malamar, Mawile, Musharna, Overqwil, Qwilfish, Sceptile, Scolipede, Scrafty, Staraptor, Swampert, Vileplume, Pyroar, Basculegion, and Meowstic are back with full stats, abilities, and learnsets",
        "✨ Added 34 Mega Evolution forms from Serebii's Champions mega abilities list — including new megas for Raichu X/Y, Clefable, Victreebel, Starmie, Meganium, Feraligatr, Skarmory, Chimecho, Froslass, Emboar, Excadrill, Scolipede, Scrafty, Eelektross, Chandelure, Golurk, Chesnaught, Delphox, Greninja, Pyroar, Floette, Meowstic, Malamar, Barbaracle, Dragalge, Hawlucha, Crabominable, Drampa, Falinks, Scovillain, and Glimmora",
        "🛡️ Updated Champions-exclusive ability descriptions for Mega Sol, Piercing Drill, and Spicy Spray to match Serebii's latest ability text",
      ],
    },
    {
      date: "17/06/2026",
      items: [
        "📦 Added 205 missing competitive moves to the Battle Engine — every move on Serebii's Pokémon Champions available-moves list now has a complete entry in MOVE_DATA with type, category, power, accuracy, targeting, flags, and effects",
      ],
    },
    {
      date: "13/06/2026",
      items: [
        "🛡️ Added Privacy Policy and Terms of Service pages — legal pages now linked in the footer and About page",
        "🍪 Added cookie consent banner — EU/UK/California visitors are now asked for consent before loading Google Analytics; everyone can manage consent via the footer",
        "⚠️ Added official unofficial fan-project disclaimers — About page and footer now clearly state that Champions Lab is not affiliated with Nintendo, The Pokémon Company, Game Freak, or Creatures Inc.",
      ],
    },
    {
      date: "07/06/2026",
      items: [
        "🛡️ Fixed Armor Tail blocking ALL priority moves — now only blocks moves that actually target the Armor Tail side (single-target opponent moves, spread moves, foeSide, and all-field moves). Self-targeting, ally-targeting, and own-side moves like Helping Hand, Follow Me, Rage Powder, Tailwind, Protect, and Quick Guard are no longer incorrectly blocked",
        "🤖 AI no longer wastes turns on priority moves blocked by Armor Tail — the battle sim AI now filters out doomed priority choices (Fake Out, Aqua Jet, Sucker Punch, Prankster status moves, etc.) when the target has Armor Tail or the move is a spread move hitting an Armor Tail side",
        "🏆 Refreshed tournament data from Limitless TCG — synced 354 tournaments (20,344 teams, 2,816 top-8 teams). Meta now reflects the latest Regulation M-A tournament results through early June 2026",
      ],
    },
    {
      date: "27/05/2026",
      items: [
        "😈 Fixed Mega Absol 'never attacking' — increased smart-pick priority for Mega Evolution Pokémon (+18 up from +10) so they're less likely to be benched. Added penalty for switching out megas (−22). Battle Bot replay now shows ALL 6 selected Pokémon with benched ones dimmed and crossed out, so you can see which mons didn't make the cut",
        "🌬️ Improved AI Tailwind decision-making — Prankster users now strongly prefer to set Tailwind themselves (+20 score). Non-Prankster setters get penalized when their ally has Prankster + Tailwind (−25), and slow setters get penalized when all opponents outspeed them (−18). No more Aerodactyl using Tailwind while Whimsicott sits there with Prankster",
        "🛡️ Fixed Protect missing from fallback movesets — Team Tester, Damage Calculator, and Survival Calculator now include Protect (and other key status moves) when building default sets for Pokémon without usage data. Previously all status moves were stripped, causing the battle sim AI to never use Protect even when the Pokémon learns it",
        "👊 Fixed Fake Out interactions — Armor Tail now completely blocks Fake Out (and all priority moves), Inner Focus prevents the flinch, and the AI correctly avoids targeting both. Removed incorrect flinch immunity from Shield Dust and Own Tempo. Incoming threat estimation also ignores neutralized Fake Out",
        "🌱 Fixed terrain damage boosts in Damage Calculator — Psychic Terrain (+30% Psychic), Electric Terrain (+30% Electric), Grassy Terrain (+30% Grass), and Misty Terrain (−50% Dragon) are now correctly applied. Mega Alakazam's Expanding Force under Psychic Terrain finally hits as hard as it should",
        "🎯 Fixed battle engine turn skipping — added 10 missing moves to the simulation database including Struggle (fallback), Life Dew, Strength Sap, Silk Trap, Burning Bulwark, and 5 others. Pokémon no longer silently skip turns when their chosen move was unknown to the engine",
        "⚡ Fixed Tailwind speed boost application — Tailwind now instantly doubles Speed for the remainder of the turn it's used. Your Pokémon no longer get outsped by slower opponents after your Prankster Tailwind setter goes first",
        "🛡️ Fixed Damage Calculator SP auto-fill bug — selecting a Pokémon no longer locks stats with full preset SP. Both attacker and defender now start with 0 SP so you can freely build any damage-test scenario without hitting the 66-cap wall",
        "🔄 Fixed Showdown bidirectional copy/paste for all regional variants — Tauros-Paldea-Aqua/Blaze, Samurott-Hisui, Ninetales-Alola, Slowbro-Galar, and 10 others now import/export correctly in PokePaste format",
        "🏆 Synced tournament teams from Limitless TCG — 287 Regulation M-A tournaments, 18,338 teams, 2,282 top-8 teams with full sets (ability, item, moves, tera). Meta → Teams tab now shows fresh real winning teams",
        "📊 Updated Meta Analysis usage rankings — refreshed Tournament Usage data with 198 Pokémon ranked by Regulation M-A meta usage, win rates, and bring rates",
      ],
    },
    {
      date: "02/05/2026",
      items: [
        "🛍️ New Shop button in navbar — divided support button now includes a direct link to the Champions Lab merch store alongside Support Us",
      ],
    },
    {
      date: "02/05/2026",
      items: [
        "🛡️ Survival Calculator — smart SP auto-optimizer finds the minimum bulk needed to survive a hit and dumps everything else into offense (Speed → Attack → SpAtk). No more over-invested bulk",
        "⚔️ Damage Calculator — user side now shows your actual 4 team-builder moves instead of the full movepool. Enemy side loads the 4 moves from their competitive set, with a selector to swap any move",
        "🔧 Fixed SearchSelect dropdown positioning — dropdown now stays perfectly glued to the trigger input when scrolling page or modal. Rewrote positioning engine for frame-perfect sync",
      ],
    },
    {
      date: "02/05/2026",
      items: [
        "⚔️ Compact Damage Calculator in Team Builder — new mode with your Pokémon auto-loaded. Pick any opponent from the full roster, select moves for both sides, and see damage both ways with KO chances. Includes weather and crit toggles",
        "🛡️ Survival Calculator — full roster threat selector (all Pokémon, not just meta top 30). All damaging moves from each Pokémon's full movepool available",
        "🛡️ Survival Calculator — fixed health bar showing remaining HP after hit (green = safe, amber = low, red = dead). Clear survival messaging: \"Your Pokémon survives!\" / \"Your Pokémon faints!\" / \"Depends on damage roll\"",
        "🛡️ Survival Calculator — animated stat pills that bounce when SP changes. Shows current HP/Def/SpD values live",
        "🛡️ Survival suggestions — one-click apply bulk investments or smart reallocations from Speed/Attack. Up to 5 suggestions shown",
      ],
    },
    {
      date: "02/05/2026",
      items: [
        "⚡ Dynamic Speed Tiers in Team Builder — click the lightning bolt next to the Speed slider to open a live speed tier comparison modal. See exactly where your Pokémon ranks against the full roster, with real-time updates as you adjust SP, nature, item, or moves",
        "⚡ Speed tier modal shows multiple speed scenarios — Base speed, with Choice Scarf, with weather abilities (Swift Swim, Sand Rush, etc.), and after setup moves (Dragon Dance, Agility, Shell Smash) all displayed as clickable chips",
        "⚡ SP-to-outspeed calculator — for every threat you don't outspeed, the modal shows exactly how many additional Stat Points you need to invest to surpass their max speed",
        "⚡ Weather toggle for speed abilities — toggle rain/sun/sand/snow on/off to see your speed with weather-based abilities activated",
        "⚡ Nearby filter and search — filter to show only Pokémon near your current rank, or search for specific threats by name",
        "⚡ Fully responsive on mobile — the speed tier modal adapts to full-screen on phones and tablet-friendly on larger screens",
        "🐛 Fixed SP limit toast message not displaying correctly in all languages",
        "🐛 Speed tier list now auto-scrolls to keep your Pokémon in view when speed changes",
      ],
    },
    {
      date: "30/04/2026",
      items: [
        "🛡️ Fixed Armor Tail blocking priority moves in battle simulator — Fake Out and other priority moves are now correctly blocked by Armor Tail (e.g. Farigiraf). Previously the log would incorrectly show the target flinching even though the move was blocked",
      ],
    },
    {
      date: "30/04/2026",
      items: [
        "🏆 Tournament Teams now load actual sets — clicking a tournament team in the Team Builder sidebar now loads the real moves, items, abilities and tera types from Limitless tournament data instead of auto-filling generic competitive sets. Nature and EVs still fall back to the best matching competitive preset",
      ],
    },
    {
      date: "30/04/2026",
      items: [
        "📊 New Table view for Official Usage Stats — toggle between Cards and Table on the Meta → Pokémon Rankings page. The table shows Rank, Sprite, Name, Types, Abilities, Usage %, and all 6 Base Stats with color-coded pills (gold for 120+, green for 100+, gray for 80+) for instant competitive comparison",
        "🌳 Flowchart now branches horizontally — decision nodes (Fake Out reads, Protect vs setup, offense vs pivot) now split into side-by-side branches instead of stacking vertically, making it clear that these are alternative plays, not sequential steps",
        "🌳 Added Fake Out speed-tie branches — when both sides have Fake Out, the flowchart now branches on who outspeeds, showing the flinch scenario and the backup plan for each case",
        "🌳 Added 'Aggro' and 'Protect' branches when slower with no speed control — instead of a flat warning, the flowchart now shows actionable branches for surviving turn 1",
        "🌳 Added 'Setup' branch to Turn 2 decisions — when a lead has an unused setup move, the 'Continue offense or pivot?' decision now includes a 'Setup' option alongside Offense and Pivot",
        "🇩🇪 Fixed German Mega Evolution names — all 60+ Mega Pokémon now display correct German names (e.g. Mega-Glurak, Mega-Bisaflor, Mega-Krawell) instead of English names when language is set to Deutsch",
        "🇩🇪 Fixed Crabominable German name — now correctly displays 'Krawell' in all German UI contexts",
        "🐛 Fixed mega evolution weather in strategy tree — Mega Charizard Y's Drought and other mega weather abilities are no longer incorrectly treated as entry abilities. Strategy flowchart now correctly shows sun overriding rain when Charizard mega evolves, instead of claiming the slower entry setter wins",
        "🧠 Strategy tree now distinguishes entry vs mega weather/terrain — field notes and weather war logic correctly account for whether weather comes from an entry ability (Drizzle, Drought) or a Mega Evolution ability, with proper timing labels ('on entry' vs 'on Turn 1 (Mega Evolution)')",
        "🐛 Fixed type-based status immunities in battle simulator — Fire-types can no longer be burned, Electric-types can no longer be paralyzed, Ice-types can no longer be frozen, and Poison/Steel-types can no longer be poisoned. This fixes Paldean Tauros (Blaze) being incorrectly burnable",
        "👊 Parental Bond now hits twice in damage calculator — the calculator now correctly applies a second hit at 25% power and shows Parental Bond as an active modifier",
        "👊 Parental Bond battles now log '(2 hits)' — battle replay messages indicate when Parental Bond triggers on a move",
        "🐛 Fixed Huge Power / Pure Power damage calculation — the calculator now correctly doubles Attack for physical moves when a Pokémon has Huge Power or Pure Power (e.g. Mega Starmie)",
        "🐛 Fixed Flash Fire immunity display in Teambuilder — type defenses grid now correctly shows 0× for Fire when a Pokémon has Flash Fire selected (also applies to Levitate, Water Absorb, Volt Absorb, and other ability-based immunities)",
        "🌸 Added Eternal Floette — new standalone Pokémon entry (id: 10061) with correct base stats 74/65/67/125/128/92, following Pokémon Showdown data. Eternal Floette can Mega Evolve into Mega Floette (74/85/87/155/148/102)",
        "🐛 Fixed Floette sprite references — corrected sprite IDs so Eternal Floette uses its official sprite and Mega Floette uses the custom official-artwork sprite",
        "⚔️ Normal Floette can no longer Mega Evolve — only Eternal Floette can Mega Evolve into Mega Floette. All tournament teams, generated teams, and meta data updated to reflect this Showdown-accurate behavior",
      ],
    },
    {
      date: "27/04/2026",
      items: [
        "🇵🇹 Partial Portuguese translation — website UI, PokéSchool, and move/ability/item descriptions (Pokémon names, types, attacks, abilities, items, natures remain in English)",
      ],
    },
    {
      date: "27/04/2026",
      items: [
        "🇩🇪 Full German translation — complete localization with official German Pokémon terminology (Typen, Attacken, Fähigkeiten, Items, Wesen, Wetter, Terrain), competitive set words, battle event strings with German move/ability names, and all UI strings",
        "📖 German PokéSchool — full 9-chapter educational content translated to German (VGC fundamentals, teambuilding, type mastery, strategies, tournament prep, advanced techniques, tools guide)",
        "🧠 German battle strategy insights — strategy flowchart, archetype descriptions, win conditions, and turn-by-turn decision tree fully translated for Team Tester",
        "🇮🇹 Full Italian translation — complete localization with official Italian Pokémon terminology (Tipi, Mosse, Abilità, Strumenti, Natura, Condizioni Atmosferiche, Campo), competitive set words, battle event strings with Italian move/ability names, and all UI strings",
        "📖 Italian PokéSchool — full 9-chapter educational content translated to Italian (VGC fundamentals, teambuilding, type mastery, strategies, tournament prep, advanced techniques, tools guide)",
        "🧠 Italian battle strategy insights — strategy flowchart, archetype descriptions, win conditions, and turn-by-turn decision tree fully translated for Team Tester",
        "⚔️ Team Tester replay now uses statistically best leads — sample battle replays now match the 'Best Lead Combos' / flowchart advice instead of using a separate heuristic that could pick different leads",
      ],
    },
    {
      date: "26/04/2026",
      items: [
        "🐛 Fixed Base Stat filter active counter in Team Builder picker  —  badge now correctly displays \"2 active\" instead of the broken \"2 {count} active\" format",
        "🐛 Fixed Team Builder crash on load  —  added missing \"use client\" directive and React hook imports so the page renders correctly instead of throwing a server-side useI18n() error",
        "🐛 Fixed hydration mismatch warning  —  added suppressHydrationWarning to the <html> element in layout.tsx to silence the font className mismatch between server and client",
        "🐛 Fixed Pokémon picker scroll in Team Builder  —  the modal grid now scrolls correctly even when filtered results are small (3 rows or fewer), so the last row is no longer cut off",
        "🐛 Fixed spread move damage reduction in Damage Calculator  —  toggling Doubles on/off now correctly applies/removes the 0.75× spread reduction for moves like Earthquake, Dazzling Gleam, and Hyper Voice",
        "🧠 Healing berry KO chance modeling  —  Sitrus Berry, Aguav Berry, and Oran Berry now affect KO probability calculations. The calculator accounts for the HP threshold trigger and heal amount when computing 2HKO and nHKO chances",
        "🔖 Active damage modifiers display  —  the Damage Calculator now shows a badge row for every active modifier applied to the calculation (STAB, Weather, Screens, Spread reduction, Critical Hit, Burn, Items, Helping Hand, Friend Guard, Resist Berries) with their exact multipliers",
        "🔥 Facade bypasses burn damage halving  —  Facade and other moves with the `ignoresBurn` flag now correctly deal full damage even when the attacker is burned",
        "🧠 Psyshock-family flag system  —  added `dealsPhysicalDamage` move flag so Psyshock (and future Psystrike/Secret Sword) correctly target Defense while using Special Attack. Body Press and Foul Play also use the same generalized stat-resolution logic",
      ],
    },
    {
      date: "23/04/2026",
      items: [
        "📂 Counter and Role filters now collapsed by default in Team Builder picker  —  keeps the modal clean on open while Type filter stays expanded for quick access; click the header to expand Counter or Role pills",
        "🌙 Dark mode readability fix for Team Builder picker filter labels  —  Type, Counter, and Role section headers now use high-contrast dark:text-white with bold uppercase styling and colorful accent icons for instant scannability",
        "🎨 Creative modern redesign for Type vs Counter filters  —  Type pills use rounded-full solid-background pills with full-opacity colored borders; Counter pills use dashed-border rectangular pills with a '2×' multiplier badge when active, making the two filter modes instantly distinguishable. Inactive pills use solid neutral backgrounds (bg-white / dark:bg-gray-800) for full visibility in both light and dark modes",
        "🎯 Counter type filter in Team Builder picker  —  select a type to see Pokémon that are super effective against it (e.g. Rock → Water, Fighting, Grass, Ground, Steel). Helps cover weaknesses and discover new options (EN/ES/FR)",
        "🛡️ Protect & immunity handling in Damage Calculator  —  spread moves (Earthquake, Dazzling Gleam, etc.) no longer apply the 0.75× spread reduction in the 1v1 damage calc; reduction only applies when multiple targets are actually hit",
      "🛡️ Unseen Fist ability support  —  contact moves now bypass Protect for full damage (like Piercing Drill but without the 25% reduction)",
      "🛡️ Piercing Drill + spread reduction fix in Battle Engine  —  spread moves now only get reduced when 2+ opponents are alive on the field (was always reducing in doubles)",
      "🔗 Meta 'Open in Team Builder' now actually loads teams  —  tournament and curated teams pre-fill moves, nature, ability, item, and SP spreads from usage data instead of opening empty",
      "🍓 Resist berry support in Damage Calculator  —  Chople Berry, Yache Berry, Occa Berry, etc. now halve super-effective damage and show a pink '{item} reduced damage' badge in results (EN/ES/FR)",
      "🍓 Resist berry support in Battle Engine  —  defender's resist berry now correctly reduces damage during battle simulations",
      "🎯 Multi-hit moves in Battle Engine  —  Dual Wingbeat, Population Bomb, and other multi-hit moves now deal correct total damage (rolls random hit count and multiplies)",
      "🎯 Rage Powder / Follow Me redirection in Battle Engine  —  opponent single-target moves are now redirected to the Pokémon that used Rage Powder or Follow Me",
      "🐛 Fixed Intimidate on switch-in  —  Intimidate now always triggers on switch-in (including after Imposter transform) instead of only when Imposter was active",
      "🐛 Fixed move category display in Damage Calculator  —  Physical/Special/Status labels now show correctly (was checking capitalized 'Physical' instead of lowercase 'physical')",
      "🐛 Fixed Psyshock damage calculation  —  now correctly targets Defense stat (was using wrong boolean logic)",
      "🐛 Fixed Assault Vest in damage calc  —  now correctly boosts SpDef (was checking physical flag instead of defense flag)",
      "🔧 Renamed Starmieite → Starminite  —  correct mega stone name used in item database and Starmie usage set",
      "📦 Hisuian Goodra movepool updated  —  19 moves added (Body Press, Dragon Cheer, Dragon Tail, Feint, Flail, Gyro Ball, Ice Spinner, Lash Out, Rain Dance, Rest, Sandstorm, Scary Face, Shelter, Skitter Smack, Sleep Talk, Stomping Tantrum, Sunny Day, Tearful Look, Weather Ball); 10 removed (Absorb, Ancient Power, Dragon Breath, Iron Defense, Magnet Bomb, Tackle, Take Down, Toxic, Water Gun)",
      "📦 Goodra movepool updated  —  added Attract, Double Team, Infestation, Swagger; removed Acid Armor, Counter, Giga Drain, Life Dew",
    ],
  },
  {
    date: "21/04/2026",
    items: [
      "🇪🇸 Full Spanish translation  —  complete localization including UI strings, Pokémon/move/ability/item names, move and ability descriptions, nature names, PokéSchool long-form content (9 sections, 36 subsections), and strategy flowchart post-processor with VGC Spanish terminology",
      "🌙 Dark mode readability fix (Pokémon modal)  —  Stat Points description now uses violet-300 highlights and gray-100 bold text for readable contrast on dark backgrounds",
      "🗓️ Season/Regulation names now translate  —  'Season M-1 · Regulation M-A' header and tab label dynamically localize the words 'Season' and 'Regulation' per locale",
      "📖 Move descriptions in selectors now translate  —  Team Builder, Team Tester, and Battle Bot move picker dropdowns route descriptions through the localized dictionary",
      "🌙 Dark mode readability fix  —  Team Builder Pokémon picker role filter pills now use higher-contrast text, borders, and hover backgrounds so labels are clearly readable in dark theme",
      "🎯 Role-based preset filter in Team Builder picker  —  9 role pills (Physical Sweeper, Special Sweeper, Physical Tank, Special Tank, Support, Speed Control, Redirector, Trick Room, Setup Sweeper) filter the Pokémon selection modal and auto-apply matching competitive sets",
      "📖 Move descriptions in selector dropdown  —  opening any move selector now shows the move description permanently below each option, with italic styling and a bottom divider separating entries",
      "⚔️ Move category styling in dropdowns  —  Physical moves show ⚔ Phys in orange, Special moves show ✦ Spec in indigo, Status moves show ◇ Status in gray across all move selectors",
      "🐛 Fixed Body Press damage calculator  —  attacker can now add Defense boosts which correctly feed into Body Press damage calculation",
    ],
  },
  {
    date: "20/04/2026",
    items: [
      "📊 Meta usage updated from in-game data  —  207 Pokémon reranked using actual Pokémon Champions game battle stats, Sneasler now #1 (52%), Incineroar #2 (46.2%), Garchomp #3 (40.4%)",
      "📈 Rising in the Meta  —  Talonflame (+36 ranks, 54.5% WR), Froslass (+24, 54.2% WR), Corviknight, Archaludon, and Floette identified as top risers",
      "📉 Falling in the Meta  —  Whimsicott, Dragonite, Gengar, Maushold, and Dragapult now flagged as declining picks with sub-50% win rates",
      "🏆 Victory Road Champions Arena  —  full top-8 teams imported (146 players), Hyungwoo Shin (1st), Jorge Tabuyo (2nd), Juan Benítez (3rd), Joseph Ugarte (4th) + 4 more",
      "⚔️ Battle Bot  —  VR Champions Arena top-8 now in all opponent pools (S-tier gets top 2, A-tier gets top 4)",
      "🔄 10 new tournament prebuilt teams  —  replaced old generic teams with real VR Champions Arena and DevonCorp tournament teams",
      "🏷️ Archetype detection rewrite  —  weather setter alone = weather team, Snow archetype added, Tailwind false positives fixed, Goodstuffs renamed to Balance",
      "🐛 Fixed duplicate '55%' in alt-sets, paste import/export for gendered forms (Basculegion-M/F, Meowstic-M/F), dynamic tournament count",
    ],
  },
  {
    date: "18/04/2026",
    items: [
      "📋 PokéPaste  —  new /paste page to share teams as a read-only view with gradient title header, copy-as-text export, and Open in Team Builder link that actually loads the team",
      "🔒 Secure PokéPaste sharing  —  hide Nature / Stat Points / Item / Ability checkboxes now strip data server-side (new share entry) instead of URL params that could be removed",
      "🖼️ Share image fixes  —  sprites now load correctly after CDN migration (same-origin fallback for canvas), long team names are ellipsized so they don't overlap the QR code",
      "🌙 Dark mode: About page X button, share modal URL inputs, paste URL input",
    ],
  },
  {
    date: "17/04/2026",
    items: [
      "🚀 Sprite CDN  -  all Pokémon sprites now served from Hetzner Object Storage with 1-year immutable cache headers for faster load times",
      "🌍 French i18n for Team Builder  -  role tags, teammate suggestion reasons, nature suggestion text, move/ability/SP/set reasons, and competitive set names (288 names translated via word-level decomposition of 40+ VGC vocabulary terms)",
      "🌍 French i18n for stat presets  -  all stat preset labels now translated (Balanced, Sweeper, Tank, etc.)",
      "🌍 French i18n for About page  -  mission, credits, and contribute sections refactored from hardcoded English to i18n keys with HTML support",
      "🐛 Fixed ability description newlines  -  96 literal '\\n' strings in French ability descriptions replaced with proper line breaks",
      "🌙 Dark mode: Language Selector  -  dropdown background now uses proper dark color instead of transparent",
      "🌙 Dark mode: PokéÉcole  -  teal color remaps for dark backgrounds (50/100/200/500/700/800 shades) and improved text contrast on learn page titles/sections",
      "🌙 Dark mode: Season Info card  -  icon container, shield badge, text labels, grid cells, LIVE badge, active tab pill, and rule tooltips all now have proper dark variants",
    ],
  },
  {
    date: "16/04/2026",
    items: [
      "🌍 French i18n for Meta page  -  all overview sections (Tournament Core Pairs, ML-Discovered Cores, Type Distribution, Archetype Rankings, Key Counter Matchups, Rising/Falling trends), Core Pairs tab, Speed Tiers tab, and Moves tab now fully translated",
      "🌍 French i18n for Meta Pokémon modal  -  type badges, tier label, ability names & descriptions, Hidden/Champions badges, move names & categories, Nature/Ability/Item labels, ML best sets header translated",
      "🌍 French i18n for PokéSchool  -  all 9 chapters with full French article content, subsections, tips, and examples wired via locale-based section overlay",
      "🌍 French i18n for overview buttons  -  'View all core pairs', 'View all rankings', 'View all teams', 'View matchup details', 'View all move analysis', and 'View all tournament teams' buttons translated",
      "🔗 Updated Discord invite link  -  Pokédex landing page and About page now point to the new Discord server",
      "🐛 Fixed WR abbreviation in Core Pairs  -  replaced fragile .slice(0,2) hack with dedicated wrAbbr i18n key (WR/TV)",
      "🐛 Fixed JSON double-comma syntax error  -  resolved invalid JSON in both en.json and fr.json that broke the dev server",
      "🐛 Fixed activeSections scope in PokéSchool  -  variable was declared inside toggleSection() instead of component scope, causing runtime crash",
    ],
  },
  {
    date: "14/04/2026",
    items: [
      "📄 PDF Export for Battle Bot  -  export a full Battle Analysis Report as a beautiful light-themed coaching study guide with executive summary, lead analysis, archetype matchups, threat scouting, strategy & game plan, weaknesses, and improvement proposals",
      "📄 PDF Export for Team Tester  -  export a comprehensive Matchup Study Report with team comparison, lead selection guide, speed tier comparison, type coverage & weakness analysis, team identity & role map, Pokémon impact analysis, matchup insights, improvement proposals, and strategy flowchart",
      "🎯 Speed Tier Comparison in Team Tester PDF  -  full table of all 12 Pokémon sorted by speed showing Base/Min/Neutral/Max/Scarf/Tailwind speeds with coaching text about the speed gap",
      "🛡️ Type Coverage & Weaknesses in Team Tester PDF  -  per-team breakdown of defensive weaknesses, resistances, and offensive blind spots with critical weakness warnings",
      "🧭 Team Identity & Role Map in Team Tester PDF  -  detected archetypes with confidence badges, role tables for each team (speed-control, redirector, sweeper, etc.), missing role warnings, and synergy scores",
      "🌳 Strategy Flowchart in Team Tester PDF  -  turn-by-turn decision tree with archetype, win condition, color-coded action steps, key threats, and backup plan",
      "📋 Import from Pokepaste in Team Tester  -  paste a team in Pokepaste/Showdown format directly into the team loader modal for quick matchup testing without saving",
      "🟢 Emerald export buttons  -  both Battle Bot and Team Tester PDF export buttons now use an emerald-to-teal gradient with Sora font",
      "🐛 Fixed VS badge overlap in Team Tester PDF  -  widened gap between team cards so the VS badge no longer overlaps either card",
      "🐛 Fixed badge overlap in Battle Bot PDF  -  tier badge and win rate no longer overflow the team card when team names are long",
      "⚡ Shortened Battle Bot PDF filename  -  now saves as 'ChampionsLab_BattleSimResult.pdf' instead of the long team name",
      "🐛 Fixed Acrobatics damage calc  -  correctly applies 110 BP when holder has no item",
      "🐛 Fixed items in damage calc  -  getAllItems() now properly returns all available items",
      "🐛 Fixed Sucker Punch fail check  -  no longer fails against status moves incorrectly",
      "🐛 Fixed Imposter + Intimidate  -  Ditto no longer fires copied Intimidate on entry",
      "🐛 Fixed Choice Scarf move locking  -  Struggle fallback when locked into a disabled move",
      "🐛 Fixed Pokepaste import gender bug  -  gender suffix (M)/(F) no longer breaks Pokémon name matching",
      "🐛 Fixed damage calc percentage display  -  percentages now show correctly in all scenarios",
      "🆕 2 new S-Tier curated teams by Illiterate Duck  -  Mega Floette Hyper Offense and Sand Bulky Offense added to meta teams and team builder",
    ],
  },
  {
    date: "13/04/2026",
    items: [
      "🧠 Fresh 2M battle engine simulation  -  re-ran the full ML simulation with 2,000,000 battles across 789 teams and 270 Pokémon, updating all engine-powered sections with fresh data",
      "⚔️ Anti-Meta Teams now engine-generated  -  6 counter teams are now auto-built from simulation results using top anti-meta anchors and their best partners, replacing hand-written placeholders",
      "📊 Anti-Meta Pokémon Rankings refreshed  -  15 anti-meta Pokémon rankings regenerated from new sim data with updated scores, counter matchups, and weaknesses",
      "🔗 ML-Discovered Cores updated  -  top 50 core pairs refreshed from 2M battle simulation results",
      "🏗️ ML Archetype Rankings updated  -  50 archetype rankings recalculated from fresh simulation ELO and win rates",
    ],
  },
  {
    date: "12/04/2026",
    items: [
      "🏆 Meta Overview reworked  -  real tournament data now leads the page: Pokémon Champions usage rankings (top 20 with bars), tournament winning teams, core pairs, archetype rankings, and curated teams all appear before ML/simulation sections",
      "📊 ML sections in 2-column layouts  -  engine predictions, insights, threats, cores, and trends now display in compact side-by-side panels instead of full-width blocks",
      "🎯 Fixed empty Counter Matchups section  -  lowered the matchup filter threshold so the 6 most decisive archetype matchups always appear",
      "📉 Added empty state for Falling in the Meta  -  when all Pokémon maintain above-50% win rates, shows a friendly 'meta is stable' message instead of a blank panel",
      "🔗 Fixed 'Open in Team Builder' button  -  tournament teams now correctly pre-fill moves, natures, abilities, and SP spreads from usage data instead of opening empty",
      "📋 Team Builder sidebar reworked  -  replaced Engine Predicted Meta section with Tournament Teams (96 real teams) and Curated Teams, both with Show More buttons",
      "⚔️ Battle Bot tournament teams  -  96 CHAMPIONS_TOURNAMENT_TEAMS now included in all opponent pools (S-tier gets top 2 placements, A-tier gets top 4, etc.)",
      "🔢 Updated Battle Bot battle counts  -  options changed from 50/100/200/500/1000 to 100/200/300/850/1250",
      "🛡️ Fixed anti-meta modal  -  clicking anti-meta teams on the meta page now opens a proper detail modal with team composition, individual sets from usage data, and 'Open in Team Builder' button",
      "📊 Move analysis switched to tournament data  -  move win rates now sourced from CHAMPIONS_TOURNAMENT_TEAMS and USAGE_DATA instead of pure simulation",
      "🎨 Meta Overview modal fix  -  team detail modals no longer overlap the navbar (added proper top padding)",
      "🐟 Basculegion gender form split  -  Basculegion-M (physical attacker, 112 Atk) and Basculegion-F (special attacker, 100 SpAtk) are now separate entries with correct stats, distinct sprites, and gender-appropriate competitive sets",
      "📖 Move descriptions on hover  -  hovering over a move in the Team Builder, Battle Bot, and Team Tester dropdowns now shows the move's description, accuracy, and PP inline below the highlighted option",
      "Fixed Freeze Dry type coverage  -  Freeze Dry now correctly shows as 2x super effective against Water in both the team-wide offensive coverage chart and per-slot Move Coverage grid",
      "Cleaned up em dashes across all source files  -  replaced 138 em dashes with standard dashes for consistent formatting",
    ],
  },
  {
    date: "11/04/2026",
    items: [
      "🎯 Showdown-style Base Stat Filter  -  filter Pokémon by minimum HP, Atk, Def, SpA, SpD, Spe, and BST in both Pokédex and Team Builder picker",
      "Sort by any stat in the Pokédex  -  HP, Attack, Defense, Sp.Atk, Sp.Def, Speed, and BST added as sort options",
      "🧠 AI Synergy-Aware Team Selection  -  smartPick4 now evaluates all possible 4-mon combinations with pairwise synergy scoring (weather moves + weather-dependent partners, Fake Out + megas, Follow Me + setup, +12 to +15 per synergy pair)",
      "Fixed AI circular swap bug  -  Pokémon that just switched out can no longer be immediately switched back in by their ally on the same turn",
      "Fixed AI spread move awareness  -  ally now preemptively switches to an immune/resistant bench Pokémon when partner uses Earthquake, Sludge Wave, or Surf that would KO them",
      "Fixed Earth Eater ability  -  Orthworm's Ground-type immunity now works correctly in the Team Builder type chart",
      "Fixed Fairy Aura  -  Mega Floette's Fairy-type moves now get the 1.33× boost in both the Battle Engine and Damage Calculator",
      "Fixed King's Shield battle log  -  Attack drop on contact now shown in the battle replay",
      "Fixed Palafin/Aegislash damage calculator  -  Hero Form stats (160 Atk) used for attacking Palafin, Blade Form (140 Atk/SpA) for attacking Aegislash, Shield Form (150 Def/SpD) for defending Aegislash",
      "Added Light of Ruin to move database  -  Fairy-type, 140 BP, 90 accuracy, 50% recoil (Mega Floette's signature move)",
      "Mega form sprites and names now display correctly in the Damage Calculator",
      "Fixed AI Focus Sash pivot  -  Pokémon at very low HP no longer waste turns switching out instead of attacking",
      "Fixed AI mega/weather team conflicts  -  smartPick4 no longer brings duplicate mega holders or conflicting weather setters (Rain + Sand)",
      "Fixed Mega Manectric Intimidate  -  Intimidate now triggers on Mega Evolution with full battle log messages, including Mirror Armor/Guard Dog/Competitive/Defiant interactions",
      "Fixed mid-battle switch Intimidate log  -  switching in an Intimidate user now shows the Attack drop in the battle replay",
      "Fixed Ditto Imposter + Intimidate bug  -  Ditto no longer fires the copied Intimidate on entry (Imposter already consumed the on-entry trigger), and reverts to original form on switch-out so Imposter retriggers correctly",
      "📋 Improved Battle Replay logging  -  end-of-turn events now show burn/poison damage, sandstorm chip, Leftovers/Grassy Terrain healing, Lum Berry cures, and weather/Trick Room/Tailwind/screens expiring with descriptive messages",
      "Status move descriptions  -  Tailwind, Trick Room, Light Screen, Reflect, Aurora Veil, weather, and terrain moves now explain their effect in the battle replay",
      "🔍 Mega ability search in Team Builder  -  searching by a mega ability (e.g. 'Intimidate') now shows M-Manectric with mega sprite, amber highlight, and auto-enables Mega Evolution when added",
      "🐱 Meowstic gender form split  -  Meowstic-M and Meowstic-F are now separate entries with correct gender-specific abilities (Prankster vs Competitive) and movepools from Serebii Champions Pokédex",
      "Hidden Z-variant Megas  -  Mega Lucario Z, Mega Garchomp Z, and Mega Absol Z are not in Pokémon Champions and are now hidden across the entire site (Pokédex, Team Builder, Battle Bot, Meta, engine)",
      "Added Brutal Swing to Manectric's movepool  -  Dark, Physical, 60 BP, 100 accuracy",
      "Compact Tier & Usage cards in Pokémon detail modal  -  switched from stacked to inline layout to save vertical space",
      "Mega Evolution section moved into the Moves column in Team Builder for a more compact layout",
      "Fixed README starter commands  -  removed incorrect nested directory path (Closes #21)",
    ],
  },
  {
    date: "09/04/2026",
    items: [
      "🔬 Full 2M Battle Simulation retraining  -  fresh ELO rankings, win rates, core pairs, archetypes, and meta tier data generated from clean roster",
      "66 Mega Stones added to battle engine  -  all 58 mega-capable Pokémon plus X/Y/Z variants now have proper item support",
      "23 missing competitive moves added to engine  -  Acid Spray, Amnesia, Baton Pass, Brick Break, Defog, Dynamic Punch, Focus Punch, Grassy Terrain, Lumina Crash, Psychic Fangs, Sticky Web, and more",
      "Comprehensive data audit  -  removed 22 winning teams with invalid/hidden Pokémon, cleaned 6 hidden Pokémon from usage data, fixed 19 movepool issues in competitive sets",
      "44 empty move descriptions filled across all Pokémon movepools",
      "20 new simulation showcase teams added  -  every Pokémon in the roster now appears in at least one winning team",
      "All 205 active Pokémon now have complete data: stats, types, abilities, moves with descriptions, competitive sets, team appearances, and simulation rankings",
      "Move balance updates from Serebii Champions Pokédex  -  Iron Head PP, Trop Kick power/PP, Moonblast PP, Crabhammer accuracy, and 12+ move stat corrections",
      "9 new Champions-exclusive balance moves added to engine (Sacred Blade, Jet Slash, Ember Burst, etc.)",
      "Fixed Mega Evolution type resolution in Damage Calculator and Battle Engine  -  Charizardite Y, Mewtwonite Y, and other X/Y/Z mega stones now correctly resolve to the matching mega form instead of always picking the first",
      "Weather Ball now changes type and power in the Damage Calculator based on active weather (Sun→Fire, Rain→Water, Sand→Rock, Snow→Ice, BP 50→100)",
      "Team Analysis scoring overhauled  -  sub-scores (Types, Speed, Roles, Archetype) now use wider ranges with proper penalties for weakness concentration, missing coverage, and role redundancy",
      "Added Watchog (#505) to the roster  -  Normal type, 41 moves, 4 competitive sets",
      "Added Hisuian Goodra (#5706) to the roster  -  Steel/Dragon type, 51 moves, 5 competitive sets",
      "Added Paldean Tauros Combat (#10250), Blaze (#10251), and Aqua (#10252)  -  Fighting, Fighting/Fire, and Fighting/Water with full movesets and competitive sets",
      "Removed Patrat (#504) from the roster  -  not available in Champions",
      "Fixed Mega Lucario Z sprite (was incorrectly showing Mega Manectric)",
      "Fixed Mega Medicham and Mega Camerupt sprites (downloaded correct official art)",
      "EV export/import fix  -  Stat Points now correctly convert to Showdown EVs using proportional formula (SP × 252/32)",
      "Mega ability descriptions updated for 156 abilities with accurate text from Serebii",
      "Fixed mobile Pokémon picker modal padding",
      "Fixed Fake Out AI targeting Ghost-type Pokémon  -  Ghosts are now correctly immune to Normal/Fighting moves",
      "Movepools updated from Serebii Champions Pokédex  -  198 Pokémon refreshed with accurate Champions move data",
      "Merged Explosion/Self-Destruct engine support (community PR #16)",
    ],
  },
  {
    date: "08/04/2026",
    items: [
      "🎮 LAUNCH DAY UPDATE  -  Pokémon Champions is live!",
      "Roster updated to 207 Pokémon  -  38 new species added (Pidgeot, Machamp, Medicham, Manectric, Sharpedo, Chimecho, Cofagrigus, Beartic, Florges, Espathra, and more)",
      "6 Pokémon hidden from roster (Metagross, Ursaluna, Pawmot, Dondozo, Tatsugiri, Grimmsnarl)  -  not in the game",
      "60 Mega Evolutions now available  -  all mega abilities confirmed and updated",
      "Mega ability badges changed from 'Speculative' to 'Champions'  -  all abilities officially confirmed",
      "New Mega Chimecho and Mega Golurk sprites from official renders",
      "Items audit: filtered item pool to match in-game availability  -  Life Orb, Choice Specs, Choice Band, Assault Vest, Flame Orb and others correctly excluded",
      "Team Builder no longer auto-assigns unavailable items from competitive sets",
      "Full competitive data for all 207 Pokémon  -  usage rates, 3-4 sets per Pokémon with proper SP spreads",
      "Battle simulation data added for 46 entries (38 base + 8 mega forms) with ELO, win rates, and partner data",
      "6 new winning teams from Champions Warm-Up Challenge",
      "Season M-1 info card now shows season end date (May 13), regulation end (June 17), roster count (201), and mega count (60)",
      "Pokémon picker upgraded across all pages  -  filter by type, ability, or move in Team Builder, Battle Bot, Team Tester, and Damage Calculator",
      "Online competitions added: Warm-Up Challenge (Apr 8–13) and Global Challenge 2026 I (Apr 23–May 4)",
    ],
  },
  {
    date: "07/04/2026",
    items: [
      "Fixed Intimidate affecting immune abilities  -  Clear Body, White Smoke, Hyper Cutter, Full Metal Body now correctly block Intimidate",
      "Added Guard Dog ability  -  boosts Attack instead of lowering it when hit by Intimidate",
      "Fixed Mega Evolution Intimidate not handling Mirror Armor bounce-back",
      "Pokémon Champions release countdown timer on the Pokédex page (April 8, 2026  -  Noon JST)",
      "Three-tier responsive navbar  -  tablet width (800–1139px) shows Pokédex, Team Builder & Battle Bot in the bar with hamburger for remaining items",
      "Pre-mega ability selector in Battle Bot modal  -  editable pre-mega ability with locked mega ability display",
      "Pre-mega ability display in Team Tester modal (both edit and display-only modes)",
      "Team Tester load team modal now sorted by most recent and shows date/time",
      "Tournament event data now refreshes daily instead of hourly for faster page loads",
      "Fixed Super Fang to correctly deal 50% of target's current HP instead of max HP",
    ],
  },
  {
    date: "06/04/2026",
    items: [
      "New VGC Tournament Calendar  -  auto-fetched from official Pokémon CMS (Regionals, Internationals, Worlds, Nationals)",
      "Community tournaments from Limitless TCG integrated as a new tier with live registration counts",
      "Navbar breakpoint raised to 1140px  -  mobile hamburger menu now covers tablet and mid-width screens",
      "Instant-tap hamburger button styled as invisible inline icon (no glass pill, no delay)",
      "New font system: Sora for headings, Inter for body text",
      "New emerald/teal/cyan color palette across all pages (replaced violet)",
      "PokéSchool expanded with full Champions Lab Features Guide: Pokedex, Team Builder, Team Tester, Battle Bot, Damage Calculator, and META Analysis walkthroughs",
      "PokéSchool now has 9 chapters and 40+ lessons covering VGC fundamentals through advanced techniques",
      "Comprehensive dark mode fix across Team Tester  -  all backgrounds, borders, text, bar tracks, badges, and flowchart nodes now properly readable",
      "Dark mode fix for Damage Calculator  -  header gradients, dashed borders, stat bars, and KO badges",
      "Team Tester: clickable lead combos update the Strategy Flowchart dynamically",
      "Team Tester: editable Pokémon modal (moves, ability, nature, item, SP) matching Battle Bot",
      "Indeterminate progress bar animation for Team Tester and Battle Engine simulations",
      "Auto-scroll to progress bar on run, then to results on completion",
      "Updated simulation iteration options and defaults",
      "Fixed Team Builder layout at medium screen sizes (1280-1730px)  -  right column now stacks below instead of squeezing stat sliders",
      "Fixed Mega Absol Z, Mega Garchomp Z, and Mega Lucario Z having identical stats to their regular mega forms  -  restored unique Z-mega stat distributions",
      "Battle Bot replay now shows targets and effects for status moves (e.g. Thunder Wave, Will-O-Wisp)",
      "Added 6 more missing held items: Fairy Feather, Eject Pack, Eject Button, Room Service, Lagging Tail, Iron Ball",
      "Fixed mobile search dropdown closing when keyboard appears",
    ],
  },
  {
    date: "05/04/2026",
    items: [
      "Added 13 missing held items: Power Herb, Ability Shield, terrain Seeds, Normal Gem, Silk Scarf, and more",
      "Added Tauros (#128)  -  Normal-type physical attacker with Intimidate, full movepool and competitive sets",
      "Added Castform (#351)  -  Weather Pokémon with Forecast ability, weather-based sets for rain, sun, and hail",
      "Mega Pokémon now have a Pre-Mega Ability selector (e.g. Intimidate before Mega Gyarados)",
      "Share image now shows both pre-mega and mega abilities",
      "Stat Points now show Base Stats and Final Stats (Total) for each stat",
      "Stat bars are now draggable sliders with grab handles",
      "Nature-boosted stats highlighted in red, lowered in blue",
      "Mega Evolution base stats automatically reflected in stat display",
      "Fixed stat presets using only 64/66 SP instead of 66/66",
      "Fixed empty move bullet points appearing after clearing moves in Team Builder",
    ],
  },
  {
    date: "03/04/2026",
    items: [
      "New Champions Lab logo! (Thanks to Noct 🎨)",
      "Logo updated across all pages: Pokédex, Navbar, Favicon, Team Builder share image, and Open Graph",
      "Share image now shows Mega sprites when a Pokémon is Mega Evolved",
      "Share image text enlarged and improved readability",
      "Instant hamburger menu: pure HTML button, zero React hydration delay",
      "Team Builder buttons centered and no longer overlap team name",
      "Fixed navbar title/subtitle wrapping at mid-range resolutions",
      "Battle AI now considers ability immunities when switching (Lightning Rod, Storm Drain, Flash Fire, Water Absorb, etc.)",
      "Damp Rock, Heat Rock, Smooth Rock, Icy Rock now extend weather from 5 to 8 turns",
      "Lum Berry now cures status conditions in battle",
      "Type Coverage in Team Builder now accounts for -ate abilities (Dragonize, Pixilate, etc.)",
      "Type Coverage now uses Mega form types for defensive matchups",
    ],
  },
  {
    date: "02/04/2026",
    items: [
      "Mega Excadrill ability updated: Piercing Drill  -  contact moves pierce Protect for 1/4 damage",
      "Mega Scovillain ability updated: Spicy Spray  -  burns the attacker when hit",
      "Fixed stat bar display (bars were filling 100% due to motion replacement)",
    ],
  },
  {
    date: "01/04/2026",
    items: [
      "Performance: removed framer-motion from critical bundle  -  ~100KB less JavaScript on page load",
      "Instant hamburger menu: native browser toggle, zero JS delay on mobile",
      "Fixed 46 missing moves across Pokémon movepools",
      "Added Shed Tail to Orthworm",
      "Ability-aware Type Coverage in Team Builder",
      "Damage calculator dropdowns upgraded with search/filter",
      "19 new competitive moves added to Battle Engine",
      "Battle Bot edit modal: mobile-optimized layout",
    ],
  },
  {
    date: "31/03/2026",
    items: [
      "Added 8 missing Pokémon: Mamoswine, Chandelure, Floette, Goodra, Trevenant, Appletun, Grimmsnarl, Skeledirge",
      "Mega Chandelure with Soul Furnace ability (Ghost/Fire 30% boost)",
      "Mega Floette with Eternal Bloom ability (Fairy 30% boost + regen)",
      "Full movesets, competitive sets, and simulation data for all 8",
      "Roster expanded to 155+ Pokémon",
      "10 new engine-generated winning teams from 2M simulation",
    ],
  },
  {
    date: "30/03/2026",
    items: [
      "Corrected stat calculation formula: SP points applied before nature modifier",
      "Mega Evolution now triggers in-battle with stat/type/ability changes",
      "Aegislash Stance Change, Disguise, Illusion, Imposter abilities added",
      "Snow weather: +50% Defense for Ice types",
      "Sand weather: +50% Special Defense for Rock types",
      "Fixed Clefable ability: Magic Guard instead of Friend Guard",
    ],
  },
  {
    date: "29/03/2026",
    items: [
      "Dark mode support across all pages and modals",
      "147 Pokémon roster with 11 regional forms",
      "Full Mega Evolution support with dynamic stats",
      "Tier rankings powered by 2M+ battle simulations",
      "SP System (66 Stat Points) replacing traditional EVs/IVs",
      "VGC AI with intelligent Protect, switching, and move selection",
      "242+ moves fully implemented in the Battle Engine",
      "Team Builder with AI-powered suggestions and synergy analysis",
    ],
  },
];

const SHARED_CHANGELOG = {
  description: "Thanks for the support  -  we're updating the website as fast as possible to adapt to everything new from Pokémon Champions!",
  entries: SHARED_ENTRIES,
};

const CHANGELOGS: Record<string, { description: string; entries: ChangelogEntry[] }> = {
  pokedex: SHARED_CHANGELOG,
  meta: SHARED_CHANGELOG,
  "battle-engine": SHARED_CHANGELOG,
  "team-builder": SHARED_CHANGELOG,
  learn: SHARED_CHANGELOG,
  events: SHARED_CHANGELOG,
};

export function LastUpdated({ page }: { page: keyof typeof CHANGELOGS }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const data = CHANGELOGS[page];
  if (!data) return null;
  const latestDate = data.entries[0]?.date ?? "29/03/2026";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {t('changelog.lastUpdated', { date: latestDate })}
        <ArrowUpRight className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-white dark:bg-[#111a2e] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-200/10 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 dark:border-gray-200/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-bold">{t('changelog.whatsNew')}</h3>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-200/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
                <p className="text-sm text-muted-foreground">{t('changelog.description')}</p>
                {data.entries.map((entry) => (
                  <div key={entry.date}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">{entry.date}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {entry.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
