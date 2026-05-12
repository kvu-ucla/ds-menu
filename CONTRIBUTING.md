# Contributing

This document describes the branching strategy, workflow, and conventions for contributing to this project.

# Maintainers

- Rodrigo Ceballos
- Nicholas Sieracki
- Kenneth (Kenny) Vu

Reach out to Kenny on Slack first for any questions, comments, and/or issues regarding scope, code, or contribution for this project.

## Branch structure

```
main
└── dev
      ├── feature/xml-parser
      ├── feature/location-config
      ├── fix/allergen-badge-styling
      └── chore/update-dependencies
```

There are two permanent branches:

- `main` — production-ready code only. Never pushed to directly.
- `dev` — the integration branch. All contributor work lands here first.

All other branches are short-lived and deleted after merging.

## Branch rules

### main

- No direct pushes to `main`
- Changes reach `main` only via a pull request from `dev`
- Only the maintainer opens and merges PRs into `main`
- Every merge to `main` represents a production release

### dev

- All contributors branch off `dev` for their work
- Completed work is submitted as a pull request back into `dev`
- At least one approval is required before merging
- The maintainer reviews and approves PRs into `dev`

## Workflow

### Starting new work

Always branch from the latest `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-branch-name
```

### Finishing work

Push your branch and open a pull request targeting `dev`:

```bash
git push origin feature/your-branch-name
```

Then open a pull request on GitHub from `feature/your-branch-name` → `dev`.

### Releasing to production

When `dev` is stable and ready for release, the maintainer opens a pull request from `dev` → `main`, reviews it, and merges it.

## Branch naming

Branch names use a prefix that describes the type of work, followed by a short descriptive name. 

| Prefix | When to use | Example |
|---|---|---|
| `feature/` | New functionality | `feature/xml-parser` |
| `fix/` | Bug fixes | `fix/empty-description-null` |
| `refactor/` | Code restructuring, no behavior change | `refactor/extract-allergen-helper` |
| `chore/` | Config, dependencies, tooling | `chore/update-tanstack-query` |
| `docs/` | Documentation only | `docs/update-readme` |

**Rules:**
- Lowercase and hyphenated — `feature/xml-parser` not `feature/XMLParser`
- Descriptive but concise — `feature/xml-parser` not `feature/chis-work`
- One branch per task — do not combine unrelated changes in one branch

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Every commit message follows this format:

```
type:[xxx-yyy] short description in present tense, lowercase, no period
```

Where `[xxx-yyy]` is the Jira ticket ID. 

**Types:**

| Type | When to use |
|---|---|
| `feat` | A new feature or capability |
| `fix` | A bug fix |
| `refactor` | Code change that is not a fix or feature |
| `chore` | Tooling, dependencies, config |
| `docs` | Documentation only |
| `style` | Formatting, whitespace — no logic change |
| `test` | Adding or updating tests |

**Examples:**

```
feat: add XML parser for Jamix
fix: handle empty Description tag as null not empty string
refactor: extract allergen categorization into helper function
chore: update Tailwindcss to v5
docs: update contributing.md with PR process
style: format locations.ts config entries consistently
```

**Rules:**
- Present tense — `add` not `added`, `fix` not `fixed`
- Lowercase — `feat: add` not `Feat: Add`
- No period at the end
- Keep the description under 72 characters
- If more context is needed, add a blank line after the subject and write a body

## Pull request guidelines

- One PR per feature, fix, or task — do not bundle unrelated changes
- Write a clear PR title using the same Conventional Commits format
- Describe what changed and why in the PR description
- Link to any relevant issues or design decisions
- Make sure the branch is up to date with `dev` before requesting review
- Wait for review from a maintainer; they will confirm and merge

## Getting your branch up to date

If `dev` has moved on while you were working, rebase before opening your PR:

```bash
git checkout dev
git pull origin dev
git checkout feature/your-branch-name
git rebase dev
```

Resolve any conflicts, then push:

```bash
git push origin feature/your-branch-name --force-with-lease
```

## Questions

If you are unsure about scope, approach, or whether something belongs in this repo, open a discussion or ask a maintainer before writing code. Thanks all!!
