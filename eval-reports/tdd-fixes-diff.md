# TDD fixes · diff report

Branch `td-fixes`. Baseline: `7eb16a6` (main plus the eval snapshot flag). Final: `21e4296`. All 185 cases of `tests/eval/cases.csv`, timed in Node. The full final report is [2026-11-05_12-40-43.md](./2026-11-05_12-40-43.md).

I changed no threshold, concept score or CSV answer, and added no dependency. I kept a fix only if:

- hybrid passed more cases;
- no case that passed before failed;
- `npm test` and `npm run test:queries` still passed.

## Baseline → final, per engine

| Metric | Manual | Embeddings | Hybrid (the app) |
| --- | ---: | ---: | ---: |
| Queries passed | 94 → 115 | 31 → 31 | 100 → 121 |
| Best answer first (Hit@1) | 50 % → 62 % | 18 % → 18 % | 57 % → 67 % |
| Right answers in the top 10 (Recall@10) | 64 % → 70 % | 19 % → 19 % | 70 % → 76 % |
| How high the first best answer is (MRR) | 0.56 → 0.65 | 0.21 → 0.21 | 0.63 → 0.71 |
| How good the top 10 order is (nDCG@10) | 0.58 → 0.66 | 0.18 → 0.18 | 0.64 → 0.72 |
| Noise queries that found something | 40 % of 10 → 40 % of 10 | 0 % of 10 → 0 % of 10 | 40 % of 10 → 40 % of 10 |
| (out of) | 185 | | |

## Per category (bold: changed)

| Category | Cases | Hybrid passed | Hybrid nDCG@10 | Manual passed | Embeddings passed |
| --- | ---: | ---: | ---: | ---: | ---: |
| ability name | 1 | 1 → 1 | 1.00 → 1.00 | 1 → 1 | 0 → 0 |
| appearance | 11 | 8 → 8 | 0.89 → 0.89 | 9 → 9 | 0 → 0 |
| category | 8 | 3 → 3 | 0.37 → 0.37 | 3 → 3 | 0 → 0 |
| effect | 24 | 13 → 13 | 0.64 → 0.64 | 8 → 8 | 11 → 11 |
| **family** | 8 | 0 → 8 | 0.70 → 1.00 | 0 → 8 | 0 → 0 |
| **learnset** | 2 | 0 → 1 | 0.27 → 0.50 | 0 → 1 | 0 → 0 |
| lore | 5 | 2 → 2 | 0.38 → 0.38 | 0 → 0 | 2 → 2 |
| move name | 3 | 3 → 3 | 1.00 → 1.00 | 3 → 3 | 0 → 0 |
| name | 17 | 17 → 17 | 1.00 → 1.00 | 17 → 17 | 0 → 0 |
| **negation** | 4 | 2 → 3 | 0.63 → 0.75 | 2 → 3 | 1 → 1 |
| noise | 10 | 6 → 6 | — → — | 6 → 6 | 10 → 10 |
| number | 4 | 4 → 4 | 1.00 → 1.00 | 4 → 4 | 0 → 0 |
| sentence | 6 | 2 → 2 | 0.50 → 0.50 | 3 → 3 | 0 → 0 |
| **stats** | 17 | 13 → 16 | 0.80 → 0.98 | 13 → 16 | 0 → 0 |
| type | 11 | 8 → 8 | 0.84 → 0.84 | 7 → 7 | 1 → 1 |
| units | 4 | 0 → 0 | 0.02 → 0.02 | 0 → 0 | 0 → 0 |
| weather | 6 | 4 → 4 | 0.79 → 0.79 | 3 → 3 | 2 → 2 |
| **web: GO syntax** | 12 | 5 → 9 | 0.47 → 0.78 | 5 → 9 | 1 → 1 |
| **web: Q&A** | 12 | 6 → 10 | 0.51 → 0.78 | 7 → 11 | 0 → 0 |
| web: identify | 20 | 3 → 3 | 0.33 → 0.33 | 3 → 3 | 3 → 3 |

## Per source

| Source | Cases | Hybrid passed | Hybrid nDCG@10 | Manual passed | Embeddings passed |
| --- | ---: | ---: | ---: | ---: | ---: |
| **drafted** | 120 | 70 → 81 | 0.70 → 0.75 | 63 → 74 | 25 → 25 |
| prd | 9 | 9 → 9 | 0.98 → 0.98 | 9 → 9 | 2 → 2 |
| **real user** | 12 | 7 → 9 | 0.73 → 0.75 | 7 → 9 | 0 → 0 |
| **web pattern** | 44 | 14 → 22 | 0.42 → 0.57 | 15 → 23 | 4 → 4 |

## Per commit

| Commit | Issue (root cause) | Rule | Cases it fixed (hybrid) | Unit test |
| --- | --- | --- | --- | --- |
| `006d399` feat(search): family queries follow the direction they ask for | On a family query, the Pokémon named ranked above the relatives the query asked for | When a query asks for a family, the relatives come before the Pokémon named, at the same score. "Evolves into X" and "pre" point to earlier forms, "final" and "last" to the last one, anything else to the next one | 50, 51, 52, 53, 54, 55, 56, 57 (+8) | `tests/search/asked-family.test.ts` › which way a family query points |
| `91eed06` feat(search): "who learns X" and "pokemon with X" list the Pokémon | A query asking which Pokémon learn a move or have an ability returned the move or ability itself | With a learn word ("learn", "knows", "@"), or "have"/"has"/"with" next to "pokemon", a move or ability named exactly matches the Pokémon that learn or have it, and they rank first as the asked kind | 115, 138, 139, 144, 145, 155 (+6) | `tests/search/learners.test.ts` |
| `78d6e4f` feat(search): superlatives sort by the stat they name | Only the base qualifiers (high, most, low, least) sorted by a stat | "Highest", "best" and "greatest" + a stat sort it down; "lowest" and "worst" + a stat sort it up; "tankiest" sorts like "tanky" | 68, 69, 70, 152 (+4) | `tests/search/sort-words.test.ts` › superlatives sort by the stat they name |
| `21e4296` feat(search): "without", "except", "!" and "&" negate and join | Only "not" and "no" started an exclusion | "Without" and "except" negate like "not"; "!" reads as "not" and "&" as "and" (Pokémon GO syntax) | 124, 141, 142 (+3) | `tests/search/exclusion.test.ts` › other ways to write a negation |

The eval tool got two commits too: `7eb16a6` adds `EVAL_SNAPSHOT=<file>`, which saves the numbers without writing a report, and the next one adds per-case metrics to that snapshot.

## Cases that now pass (hybrid, 21)

- 50. "evolution of pikachu" (family): now raichu, pikachu
- 51. "i want the evolution of pikachu" (family): now raichu, pikachu
- 52. "what does charmander evolve into" (family): now charmeleon, charizard, charmander
- 53. "evolutions of eevee" (family): now vaporeon, jolteon, flareon
- 54. "eevee evolutions" (family): now vaporeon, jolteon, flareon
- 55. "final evolution of bulbasaur" (family): now venusaur, ivysaur, bulbasaur
- 56. "what evolves into raichu" (family): now pikachu, raichu, bulbasaur
- 57. "pre evolution of gyarados" (family): now magikarp, gyarados
- 68. "highest attack" (stats): now dragonite, machamp, kingler
- 69. "best special attack" (stats): now mewtwo, alakazam, gengar
- 70. "tankiest pokemon" (stats): now chansey, cloyster, rhydon
- 115. "pokemon that learn thunderbolt" (learnset): now rattata, raticate, pikachu
- 124. "water without ice" (negation): now squirtle, wartortle, blastoise
- 138. "@surf" (web: GO syntax): now squirtle, wartortle, blastoise
- 139. "@thunderbolt" (web: GO syntax): now rattata, raticate, pikachu
- 141. "!flying" (web: GO syntax): now bulbasaur, ivysaur, venusaur
- 142. "water & !ice" (web: GO syntax): now squirtle, wartortle, blastoise
- 144. "every pokemon with intimidate" (web: Q&A): now neutralizing-gas, ekans, arbok
- 145. "which pokemon have levitate" (web: Q&A): now gastly, haunter, koffing
- 152. "which pokemon has the highest defense" (web: Q&A): now cloyster, onix, golem
- 155. "which pokemon learn hypnosis" (web: Q&A): now poliwag, poliwhirl, poliwrath

## Cases that got worse

- **Passed before and fail now:** None.
- **Lower nDCG@10 than before, passing or not:** None.

## Issues skipped

**Category words (genus) aren't searched**, e.g. "Mouse Pokémon", "Fox Pokémon", "Jellyfish Pokémon".

- **Rule tried:** a query word that is a whole word of a Pokémon's category matches it, unless the dictionary reads that word as an effect.
- **What it fixed:** 7 cases (29, 30, 41, 42, 161, 162, 165), taking hybrid from 100 to 106.
- **Why it was reverted:** it broke **34 "fossil"**. Aerodactyl is the "Fossil Pokémon", so it now scored 1, the manual answer became confident, and semantic search no longer ran. Omanyte and Kabuto dropped out, which breaks the no-regression rule.
- **Where it is:** in `git stash` as "issue A: genus words". See case 34 below.

**Not attempted, because the five issues were done:**

- **Question words are searched as words.** "who" in 114 "who can learn surf" and "is" in 128 "which pokemon is the strongest" are scored as words and pull the other matches down. Making them filler words is vocabulary, so it fits the rules.
- **The data's legendary and mythical flags aren't searched** (`species.is_legendary`, `is_mythical`): cases 87, 140 and 143.
- **Units and comparatives** ("90kg", "heavier than 200 kg", "taller than 2 m"): cases 75–77.

**Would need a threshold change, so out of bounds:**

- The noise queries that still find something (178, 180, 181, 183) do so through the typo rule and the cosine floor.
- 65 "strongest pokemon" puts the move String Shot first, through the lone sort word's name match and the 40 % typo rule.

**The data can't answer:**

- 153 "best counter for gyarados" needs a type chart.
- 89 "starter pokemon": the CSV note says it isn't in the data.

## Expected answers that look wrong

- **34 "fossil":** the data calls Aerodactyl the "Fossil Pokémon", but the case grades it only "okay" and asks for Omanyte and Kabuto in the top 3. Making Aerodactyl a best answer, alongside Omanyte and Kabuto, would match the data. This is the only case blocking the genus fix.
- **26 "mouse" and 28 "the mouse pokemon":** six Pokémon have the category "Mouse Pokémon" (Rattata, Raticate, Pikachu, Raichu, Sandshrew, Sandslash). A top 3 that must hold Pikachu and Raichu asks for popularity, which the data doesn't have. A top 10, or all six as best answers, would be answerable.
