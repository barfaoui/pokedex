---
name: add-test
description: Write a new failing test for a search query, a PRD user story or an internal rule, in the right place. Use when a behaviour should be guaranteed before (or after) it's built.
disable-model-invocation: true
---

# Add a test

## 1. Understand what to guarantee

Ask for anything missing: the input and the expected result. Then classify the request:

| It's about…                                                    | Example                                                    | Kind of test            | Where                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------- | ------------------------------------------------------------- |
| A **search query** and what it should return                   | "legendary fire" → Moltres first                           | Query test (Vitest)     | `tests/queries.test.ts` + a row in `docs/01-prd.md` section 7 |
| A **PRD user story** (M1–M8, S1–S4, C1–C2) as the user sees it | M5: a result shows what matched                            | End-to-end (Playwright) | `tests/e2e/`                                                  |
| An **internal rule** of the search                             | the 30% typo rule, concept direction (Insomnia = prevents) | Unit test (Vitest)      | `tests/search/`                                               |
| The **dataset** itself                                         | every ability has a short effect                           | Data check (Vitest)     | `tests/data/`                                                 |

If it fits more than one row, say which ones and why, and ask before writing several.

## 2. Check the expected result

- For anything about the data, **verify the expected result in `src/data/pokedex.json`**, never assume it. If it's wrong, say so and propose the right one instead of writing the test.
- For a user story, re-read its "done when" line in `docs/01-prd.md` and test that, nothing more.

## 3. Write it

- Follow `.cursor/rules/testing.mdc`.
- A new query test goes in the PRD table **and** in `tests/queries.test.ts`, with the same wording, in the same change.
- End-to-end tests find elements by role and accessible name, and are named after the story (e.g. `M5 · shows what matched`).

## 4. Run it

- Run only the relevant suite (`npm test`, `npm run test:queries` or `npm run test:e2e`).
- Confirm the test **fails for the right reason** (red). If it already passes, say so: the behaviour may already exist.

## 5. Summarise

The kind of test and where it went, the expected result and how it was checked, and its current status. Don't commit.
