# Contributing to Champions Lab

Thank you for wanting to help! Champions Lab is a community-driven project and we welcome contributions of all kinds.

---

## 🌍 Translating Champions Lab

We're actively expanding language support. If you'd like to help translate Champions Lab into your language, here's how:

### Translation Files

All translation files are in `src/lib/i18n/`:

```
src/lib/i18n/
├── en.json                      # English (base language)
├── fr.json                      # French
├── abilities.fr.json            # Pokémon abilities (French)
├── items.fr.json                # Items (French)
├── moves.fr.json                # Moves (French)
├── natures.fr.json              # Natures (French)
├── pokemon-names.fr.json        # Pokémon names (French)
├── ability-descriptions.*.json  # Ability descriptions
├── item-descriptions.*.json     # Item descriptions
└── move-descriptions.*.json     # Move descriptions
```

### Adding a New Language

1. **Fork** the [repository](https://github.com/Andrew21P/ChampionsLab)
2. **Copy** the English translation file as a template:
   - `src/lib/i18n/en.json` → `src/lib/i18n/{lang}.json`
   - `src/lib/i18n/pokemon-names.fr.json` → `src/lib/i18n/pokemon-names.{lang}.json`
   - `src/lib/i18n/abilities.fr.json` → `src/lib/i18n/abilities.{lang}.json`
   - `src/lib/i18n/items.fr.json` → `src/lib/i18n/items.{lang}.json`
   - `src/lib/i18n/moves.fr.json` → `src/lib/i18n/moves.{lang}.json`
   - `src/lib/i18n/natures.fr.json` → `src/lib/i18n/natures.{lang}.json`
   - `src/lib/i18n/ability-descriptions.en.json` → `src/lib/i18n/ability-descriptions.{lang}.json`
   - `src/lib/i18n/item-descriptions.en.json` → `src/lib/i18n/item-descriptions.{lang}.json`
   - `src/lib/i18n/move-descriptions.en.json` → `src/lib/i18n/move-descriptions.{lang}.json`
   - (where `{lang}` is your language code, e.g., `es`, `de`, `ja`, `it`)
3. **Translate** all the keys and values to your language
4. **Update** `src/lib/i18n/index.tsx` to add your language to the language selector
5. **Commit** and **Push** your changes
6. **Open a Pull Request** with your language translation

### Updating an Existing Translation

If you want to improve or complete an existing translation:

1. **Fork** the [repository](https://github.com/Andrew21P/ChampionsLab)
2. **Edit** the translation file you want to improve:
   - Check `src/lib/i18n/{lang}.json` for missing keys or outdated strings
   - Update `src/lib/i18n/pokemon-names.{lang}.json`, moves, abilities, items, etc. as needed
   - Compare against the English version to ensure all keys are translated
3. **Test** your changes locally to ensure text displays correctly
4. **Commit** your changes with clear messages (e.g., "Update French translation: add missing meta keys")
5. **Push** to your fork and **open a Pull Request**

**Tips for updating:**
- Look for `❌` markers in comments or check if recent English updates haven't been translated yet
- Test on the actual website if possible to catch text overflow issues
- If you're making a partial update, mention what you've improved in the PR description

### Translation Guidelines

- Keep the same **JSON structure** as the English version
- Preserve **variable placeholders** like `{count}`, `{value}`, `{name}` — these are replaced at runtime
- **Don't translate** Pokémon names unless they have an official regional translation
- Use **professional terminology** for battle/competitive terms (Fake Out, Trick Room, etc.)
- Test your translation locally if possible — ensure text fits in UI elements
- If you're unsure about a term, leave a comment in the PR

### Example

**en.json:**
```json
{
  "meta": {
    "wrAbbr": "WR",
    "title": "Meta Analysis",
    "pokemonRanking": "Pokémon Ranking for {season}"
  }
}
```

**es.json (Spanish):**
```json
{
  "meta": {
    "wrAbbr": "TV",
    "title": "Análisis Meta",
    "pokemonRanking": "Clasificación de Pokémon para {season}"
  }
}
```

---

## 🐛 Reporting Bugs & Requesting Features

### Bug Reports
1. Check if the bug has already been reported in [Issues](https://github.com/Andrew21P/ChampionsLab/issues)
2. Open a new Issue with:
   - What you were doing when the bug occurred
   - What happened vs. what you expected
   - Browser/device info
   - Screenshots if helpful

### Feature Requests
1. Open an Issue describing the feature
2. Explain **why** it would be useful
3. Include any mockups or examples if you have them

---

## 💻 Code Contributions

### Getting Started

```bash
# Clone the repo
git clone https://github.com/Andrew21P/ChampionsLab.git
cd ChampionsLab

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Test thoroughly (run `npm run build` to check for TypeScript errors)
4. Commit with clear messages: `git commit -m "Add X feature"`
5. Push to your fork: `git push origin feature/my-feature`
6. Open a Pull Request from your fork to `main`

### Code Style

- Use **TypeScript** — we aim for 100% type coverage
- Follow the existing code style (2-space indents, semicolons, etc.)
- Use **shadcn/ui** components when building UI
- Keep components small and focused
- Add comments for complex logic

---

## 📝 Commit Messages

Write clear, descriptive commit messages:

```
✨ Add dark mode toggle
🐛 Fix team synergy calculation for weather cores
📖 Update README with API docs
🌍 Add German translation (de.json)
```

---

## 🤝 Community

We hang out on Discord and through GitHub Discussions. If you have questions:

- **GitHub Issues** — for bugs and feature requests
- **GitHub Discussions** — for ideas and general chat
- **Contact Form** — on the website at [championslab.xyz](https://championslab.xyz)

---

## ❤️ What We're Looking For

- **Translations** — Help us reach players worldwide
- **Bug fixes** — Found a typo? A calculation error? PR it!
- **Feature ideas** — New pages, tools, analysis modes
- **Data** — Tournament results, usage statistics
- **Design** — UI/UX improvements, accessibility fixes
- **Documentation** — Better guides, clearer explanations

---

## 🗃️ Data Contributions

If you are adding or updating Pokémon, moves, abilities, or items, read `DATA_AND_SCRIPTS.md` first. The most common mistake is adding data to the raw files without adding it to the **valid list** that the UI and engine actually use.

### Quick rules

- **Pokémon** — add to `POKEMON_SEED` in `src/lib/pokemon-data.ts`. Set `hidden: true` to keep it out of the UI.
- **Moves** — a move is valid only if it appears in a Pokémon's `moves` array. The engine needs it in `MOVE_DATA` (`src/lib/engine/move-data.ts`).
  - Add to `MOVE_DATA`.
  - Add to at least one Pokémon's `moves` array.
  - Do not add moves only to `MOVE_DATA`; they will be orphaned.
- **Items** — an item is selectable only if it is in `CHAMPIONS_ITEMS` **or** has `isMegaStone: true` in `src/lib/engine/items.ts`.
  - Add the entry to `ITEMS`.
  - Add the name to `CHAMPIONS_ITEMS`, or mark it `isMegaStone: true`.
  - For Mega Stones, set `forPokemon` to a Pokémon that exists in `POKEMON_SEED`.
- **Abilities** — add to `src/lib/engine/ability-data.ts` and to the relevant Pokémon's `abilities` array.

After data changes, run the audits and build (`npm run build`) and update the changelog in `src/components/last-updated.tsx`.

## License

By contributing to Champions Lab, you agree that your contributions will be licensed under the same [MIT License](LICENSE) as the project.

---

Thank you for helping make Champions Lab better. We can't wait to see what you build. 🚀
