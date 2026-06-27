---
last-verified: 2026-06-27
verified-against:
  - .gitignore
  - .copilot-wiki/local-only-overrides.md
key-symbols: []
---

# Agent rules

**TL;DR.** Hard rules that override anything else. Read before doing any git or fork-management action.

The single most important rule, restated three ways so you cannot miss it:

- **Rule 0** — **never run a git write-command that mutates history or refs (commit, branch, checkout that creates, merge, rebase, tag, push, pull) without an explicit user instruction.** Editing files on disk is fine; touching the repo's history is not. Local-only scratch operations that don't affect history (`git stash`, `git reset`) are allowed as needed.
- **Rule 1** — even on a feature branch, **never `git commit`, `git push`, or `gh pr create` automatically**. Make the file edits, stop, and tell the user the change is on disk awaiting their command.
- **Rule 2** — for work that's "for contribution / upstream / the live site", base off `main` when (and only when) the user later asks for a branch; everything else bases off `master`. `main` must stay a pure upstream mirror.

## 0. Default end state of any change: edits on disk, nothing else

When the user asks for a change, **the agent's job ends at "files modified on disk"** unless the user says otherwise in the same instruction or earlier in the session.

- ✅ Read files. Edit files. Create new files (other than git artifacts). Run linters / type-checkers / builds in read-only mode. Run read-only git inspection (`git status`, `git log`, `git diff`, `git branch --show-current`, `git ls-files`). Run local scratch ops that don't mutate history (`git stash push/pop/list`, `git reset` to unstage or move HEAD locally).
- ❌ `git add`, `git commit`, `git restore --staged`, `git branch <new>`, `git checkout -b`, `git checkout <other-branch>`, `git merge`, `git rebase`, `git cherry-pick`, `git revert`, `git tag`, `git push`, `git pull`, `git fetch` (when it would mutate refs), `gh pr create`, `gh pr merge`, `gh repo fork`, etc.

The user will explicitly say one of: "commit it", "branch this", "push it", "open the PR", "merge it", "sync master", etc. Wait for those words.

### What counts as "explicit"?

The verb has to be in the user's message, in unambiguous terms:

- ✅ "commit this", "make a commit", "save these changes" → commit.
- ✅ "branch off master for this", "create a feature branch" → branch.
- ✅ "push it", "share it", "send it to GitHub" → push.
- ✅ "open the PR", "create the merge request", "make a PR" → `gh pr create`.
- ✅ "merge PR #5" → `gh pr merge` (rare; almost always the user does this themselves).
- ❌ "let's add X" / "let's improve Y" → just **edit files**. No commit, no branch, no push, no PR.
- ❌ "add this to master" → **edit files only** (the user will tell you when to commit / branch / push).
- ❌ "fix this bug" → edit files only.

If a request implies a PR is the eventual goal but doesn't say "open the PR", make the edits and stop. The user can chain "now commit", "now push", "now open the PR" as separate steps.

## 1. Never commit or push to `main` or `master` directly

Subsumed by rule 0 — no automatic git writes anywhere, period — but `main` and `master` get an extra layer of protection even when the user **does** ask for a write:

This applies to **both remotes** (your fork `crubalcaba/ChampionsLab` and upstream `Andrew21P/ChampionsLab`) and to the local branches with those names.

- ❌ Even if asked to "commit this", if `HEAD` is on `main` or `master`, **ask first**: "Should I branch off first, or do you really want this on `main`/`master`?"
- ❌ Same for `git push origin main`, `git push origin master`, `git push upstream main`.
- ❌ Same for `git merge`, `git rebase`, `git cherry-pick`, `git revert` landing on `main` / `master`.
- ❌ Same for `git push -f` / `git push --force-with-lease` to `main` / `master`.

### Allowed direct-to-protected-branch verbs

Only when the user issues an **explicit, unambiguous command** like:
- "commit this directly to master" / "yes, commit on master"
- "push to main now"
- "merge this PR for me"


## 2. Branching strategy: contribution vs personal

The fork has two long-lived branches with different roles:

| Branch | Tracks | Purpose | Touch when |
|---|---|---|---|
| `main` | Upstream `Andrew21P/ChampionsLab` `main` | Mirror of the live website. Source of truth for upstream contributions. | Only when **explicitly told** the work is "for contribution" / "for upstream" / "for the live site" / similar. |
| `master` | Personal | The user's customised version (for themselves and friends). Carries personal-only features that upstream does not want. | Default for any feature work. |

### Decision tree for "where do I branch from?"

```
Did the user EXPLICITLY say this work is for contribution / upstream / the live site?
│
├── YES → branch off main:    git checkout -b feature/x main
│         PR target:           Andrew21P:main (upstream)
│         AND after upstream merge, also bring it into master:
│           1. Wait for upstream PR to merge.
│           2. Sync local main: git fetch upstream && git pull --ff-only.
│           3. Open a fast-forward sync PR master ← main (or merge main → master)
│              so the personal version stays current.
│
└── NO  → branch off master:  git checkout -b feature/y master
          PR target:           crubalcaba:master (your fork)
          Do NOT touch main. main must remain a pure upstream mirror.
```

### Hard constraint

- **`main` must never carry personal-only commits.** Every commit reachable from `main` must be either (a) upstream's, or (b) about to be sent upstream via PR. Personal stylings, local tooling, friend-only features → `master` only.
- Never assume "for contribution" from context. Examples that are **not** explicit:
  - "let's improve the team builder" → ambiguous → default to `master`.
  - "fix this bug" → ambiguous → default to `master`.
  - "add a personal feature" → clearly personal → `master`.
  - "let's contribute X back upstream" → explicit → `main`.
  - "PR this to the original repo" → explicit → `main`.
  - "this should go to championslab.xyz" → explicit → `main`.

### When a feature is dual-bound (contribution **and** personal)

The user may explicitly want a feature to land both upstream and on master. Procedure:

1. Branch off `main`, PR to upstream `Andrew21P:main` first.
2. After the upstream PR merges, sync your local `main`: `git fetch upstream && git checkout main && git pull --ff-only`. (Set up `upstream` remote on first use: `git remote add upstream https://github.com/Andrew21P/ChampionsLab.git`.)
3. Push the updated `main` to your fork: `git push origin main`.
4. Bring the change into `master` by opening a sync PR `master ← main` (or a feature branch off master that merges main).
5. Never reverse — never bring personal commits from `master` back into `main`.

## 3. Never auto-merge a PR

`gh pr merge` is reserved for the user. Even after a PR is reviewed and approved, do not invoke it without an explicit instruction.

## 4. Never force-push a shared branch

`main`, `master`, and any branch that already has an open PR are shared. `--force` / `--force-with-lease` on those is destructive to upstream history and to other contributors.

Feature branches before they're pushed: fine to rewrite history. Feature branches with an open PR: ask first.

## 5. Branch naming

- `feature/<short-kebab>` — new functionality
- `fix/<short-kebab>` — bug fixes
- `chore/<short-kebab>` — tooling / config
- `wip/<short-kebab>` — explicitly user-throwaway work

Match the existing style of recent branches if it differs.

## 6. Cross-refs

- [local-only-overrides](local-only-overrides.md) — the skip-worktree protocol that pairs with rules 1 & 2 (handles personal-only file mods that must not leak into `main`-based branches).
- `.github/copilot-instructions.md` — repo preamble (always-loaded).

