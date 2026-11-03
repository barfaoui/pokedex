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
3. If everything passes, suggest a commit message by following the `commit-message` skill.
4. Never run `git commit` or `git push`.
