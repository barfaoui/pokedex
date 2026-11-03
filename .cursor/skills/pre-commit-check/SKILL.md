---
name: pre-commit-check
description: Run every check CI runs, summarise the results and suggest a commit message. Use before committing.
disable-model-invocation: true
---

# Pre-commit check

1. Run, in order, and stop at the first failure:
   - `npm run format:check`
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run test:e2e`
2. If something fails, show the relevant part of the output and propose a fix. Don't fix tests by weakening them.
3. If everything passes, look at the staged and unstaged changes and suggest a commit message in the Conventional Commits style used in this repo (`feat(search): …`, `test(queries): …`, `docs(prd): …`, `chore: …`, `ci: …`). If the changes mix unrelated things, suggest splitting them into several commits.
4. Never run `git commit` or `git push`.
