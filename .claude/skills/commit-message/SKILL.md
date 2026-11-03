---
name: commit-message
description: Suggest a commit message for the current changes, in the Conventional Commits style used in this repo. Use when asked for a commit message, or at the end of pre-commit-check.
disable-model-invocation: true
---

# Suggest a commit message

## 1. Look at the changes

- Run `git status` and `git diff HEAD` (staged and unstaged). Read new untracked files too.
- Run `git log --oneline -10` to match the recent wording.
- If nothing changed, say so and stop.

## 2. Decide if it's one commit

One commit = one reason to change. If the changes mix unrelated things (e.g. a search feature and a docs fix), propose a split: one message per commit and the files that go in each.

## 3. Write the message

`<type>(<scope>): <subject>`

| Type | When |
| --- | --- |
| `feat` | New behaviour users or the search core can rely on |
| `fix` | A bug fix |
| `test` | Tests only (including red tests written before the code) |
| `refactor` | Same behaviour, different code |
| `docs` | `docs/`, `README.md` |
| `ci` | `.github/` |
| `chore` | Tooling, config, dependencies, Cursor rules and skills |

- **Scope** (optional): the area touched: `data`, `search`, `queries`, `ui`, `e2e`, or the doc (`prd`, `tech-spec`, `data-discovery`). Leave it out when the change spans several areas.
- **Subject:** imperative, lowercase, no full stop, at most ~60 characters. Say what changed from the user's or the project's point of view, not which files ("add the data model and red tests for buildIndex", not "update model.ts").
- **Body:** only when the reason isn't obvious from the subject, or a documented decision changes (say which one). A few short lines, wrapped at 72 characters.
- Mention it in the body when the commit is intentionally red (tests written before the code).

## 4. Hand it over

Show the message (or messages, if split) in a code block, ready to paste. Never run `git commit` or `git push`.
