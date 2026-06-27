---
last-verified: 2026-06-27
verified-against:
  - .gitignore
  - .copilot-wiki/local-only-overrides.md
key-symbols: []
---

# Agent rules

**TL;DR.** Hard rules that override anything else. Read before doing any git or fork-management action.

## 1. Never commit or push to `main` or `master` directly

This applies to **both remotes** (your fork `crubalcaba/ChampionsLab` and upstream `Andrew21P/ChampionsLab`) and to the local branches with those names.

- ❌ No `git commit` while `HEAD` is on `main` or `master`.
- ❌ No `git push origin main`, no `git push origin master`, no `git push upstream main`.
- ❌ No `git merge`, `git rebase`, `git cherry-pick`, or `git revert` that lands commits on `main` or `master`.
- ❌ No `git push -f` / `git push --force-with-lease` to `main` or `master`.

### What to do instead

1. Create a feature branch off the appropriate base:
   - Upstream-bound work → off `main` (`git checkout -b feature/x main`)
   - Personal-only work → off `master` (`git checkout -b feature/y master`)
2. Commit on the feature branch.
3. Push the feature branch.
4. Open a Pull Request (with `gh pr create --base main|master ...`).
5. **Wait for the user to merge it.** Merging is a user-only action.

### When can the rule be broken?

Only when the user issues an **explicit, unambiguous command** like:
- "commit this directly to master"
- "push to main now"
- "merge this PR for me"

A vague "let's update master with X" is **not** explicit enough — ask first, or default to the branch + PR flow.

## 2. Never auto-merge a PR

`gh pr merge` is reserved for the user. Even after a PR is reviewed and approved, do not invoke it without an explicit instruction.

## 3. Never force-push a shared branch

`main`, `master`, and any branch that already has an open PR are shared. `--force` / `--force-with-lease` on those is destructive to upstream history and to other contributors.

Feature branches before they're pushed: fine to rewrite history. Feature branches with an open PR: ask first.

## 4. Branch naming

- `feature/<short-kebab>` — new functionality
- `fix/<short-kebab>` — bug fixes
- `chore/<short-kebab>` — tooling / config
- `wip/<short-kebab>` — explicitly user-throwaway work

Match the existing style of recent branches if it differs.

## 5. Cross-refs

- [local-only-overrides](local-only-overrides.md) — the skip-worktree protocol that pairs with rule 1 (handles personal-only file mods that must not leak into upstream branches).
- `.github/copilot-instructions.md` — repo preamble (always-loaded).

