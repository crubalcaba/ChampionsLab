---
last-verified: 2026-06-28
verified-against:
  - .gitignore
  - src/app/globals.css
  - src/app/layout.tsx
key-symbols:
  - notoColorEmoji
  - --font-emoji
---

# Local-only overrides (skip-worktree files)

**TL;DR.** Two tracked files have `git update-index --skip-worktree` set so their local modifications never appear in `git status` / `git diff` and never enter PRs. They hold personal dev-environment tweaks the upstream project doesn't want.

> Historical note (2026-06-28): `.gitignore` was previously listed here with a `/public/sprites/` row. That entry was removed from `.gitignore` on master (commit `52dbc26`) so the GitHub Pages deploy ships every sprite — see [github-pages-deployment](github-pages-deployment.md). If you ever re-introduce a local-only `.gitignore` diff, re-add the row here AND re-apply `git update-index --skip-worktree .gitignore`.

## Currently skipped files

| File | Local-only change | Why local |
|---|---|---|
| `src/app/globals.css` | Adds `--font-emoji` CSS var + a global `html, body { font-family: ... }` block that wires Noto Color Emoji into the fallback chain after `Apple Color Emoji`. | Personal preference for nicer emoji rendering on non-Apple devices. Not wanted upstream. |
| `src/app/layout.tsx` | Imports `Noto_Color_Emoji` from `next/font/google`, instantiates it as `notoColorEmoji` with the `--font-emoji` CSS variable, and appends `${notoColorEmoji.variable}` to the `<html className>`. | Same as above — paired with the `globals.css` change. |

Verify what's currently skipped:

```powershell
git ls-files -v | Select-String "^S "
```

## Protocol when working on these files

**Read this section before editing any file in the table above.** Skip-worktree silently hides changes from `git status`, so a normal edit will appear to "do nothing" and the diff won't show in PRs — easy to miss.

### Before editing a skipped file for real (upstream-bound) work

1. Un-skip the file so changes are visible again:
   ```powershell
   git update-index --no-skip-worktree <path>
   ```
2. Re-apply the local-only override on top of the new edit (since un-skipping doesn't remove the local diff, just re-exposes it).
3. Commit only the upstream-relevant portion. Easiest: `git add -p <path>` and skip the local-override hunks.
4. After committing, re-skip:
   ```powershell
   git update-index --skip-worktree <path>
   ```

### Before pulling

If `git pull` touches a skipped file, git refuses the merge with a "would clobber local changes" error. Resolution:

```powershell
git stash push -- <path>      # stash local-only edits
git update-index --no-skip-worktree <path>
git pull
# re-apply local override (re-run the original edit or pop the stash)
git stash pop
git update-index --skip-worktree <path>
```

### Helper one-liners

```powershell
# Show every currently-skipped file
git ls-files -v | Select-String "^S "

# Un-skip everything (use before a clean checkout or major rebase)
git ls-files -v | Select-String "^S " | ForEach-Object { ($_ -split "\s+")[1] } |
  ForEach-Object { git update-index --no-skip-worktree $_ }
```

## When to update this page

- A new file is added to the skip-worktree set → add a row to the table, bump `last-verified`, list it in `verified-against`.
- A file is removed from the set (override has been upstreamed or abandoned) → remove the row, bump `last-verified`.
- A symbol in `key-symbols` is renamed or removed in source → update or replace it here so the drift lint can still find it.

## Cross-refs

- `.github/copilot-instructions.md` (repo preamble) — overall conventions.
- `~/.copilot/copilot-instructions.md` (global) — wiki / CodeGraph tool-preference protocol.

