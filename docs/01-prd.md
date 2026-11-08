# Product Requirements — Pokédex Search

## Contents

- [1. Problem](#1-problem)
- [2. Users](#2-users)
- [3. Goals and non-goals](#3-goals-and-non-goals)
- [4. User stories](#4-user-stories)
- [5. Requirements](#5-requirements)
- [6. Assumptions](#6-assumptions)
- [7. Success metrics](#7-success-metrics)
- [8. Limits](#8-limits)
- [9. 🤖 How I used AI for this document](#9--how-i-used-ai-for-this-document)

## 1. Problem

Professor Chen's lab has a complete Pokédex (Pokémon, moves, abilities, types, stats and the relationships between them), but today it only helps people who already know the exact name of what they're looking for. Users often remember only part of a name, an effect ("make the opponent fall asleep") or a goal ("a fast Electric type for my team"), and the links between Pokémon, moves and abilities are invisible.

**Goal: help users go from a vague intent to a confident answer.**

## 2. Users

| Persona | What they know | What they type | What "useful" means to them |
| --- | --- | --- | --- |
| **Researcher** (expert) | Vocabulary, types, stats | Precise criteria: "electric speed > 100", a move name | Precise results, side-by-side comparison |
| **New trainer** (beginner) | Part of a name, a goal, an effect in plain words | "bulba", "pikachoo", "put my opponent to sleep" | Being understood without the right words |

## 3. Goals and non-goals

### Goals

1. **Find by partial or misspelled name.** The most common search; it must never fail. *(brief challenge 1)*
2. **Find and compare by criteria** to narrow down candidates and pick one. *(challenge 2)*
3. **Find by meaning, not vocabulary:** describe an effect in your own words and get the moves, abilities and Pokémon behind it. *(challenge 3)*
4. **Explore a theme across categories** in one search. *(challenge 4)*
5. **No false positives:** a query that matches nothing returns nothing.

### Non-goals (this version)

- A battle simulator: no damage calculation, levels or team optimisation.
- "How to beat X": needs a type-effectiveness chart that isn't in the dataset.
- User accounts or cloud sync.
- Generations beyond the first 151 Pokémon.

## 4. User stories

- **Must:** without it, the product doesn't deliver its core promise. These are built and tested first.
- **Should:** high value, but the product is still coherent without it. Built once every Must is done.
- **Could:** nice to have, only if time is left.

Each story has an example query and a "done when" acceptance criterion.

### Must

#### M1. Name search: partial, typos, accents *(challenge 1)*

> As a new trainer, I want to type part of a name, even misspelled, so that I find a Pokémon I only half remember.

- Examples: "bulba", "pikachoo", "char"
- Done when: the intended Pokémon is in the top 3, with its image and types visible so I can confirm it's the right one. Accents don't matter: "é" matches "e", "à" matches "a".

#### M2. Criteria search *(challenge 2)*

> As a player filling the last slot of my team, I want to search by criteria (type, stat, ability, move, colour, habitat, shape), so that I get a short list of candidates I can compare.

- Examples: "fast electric", "electric" sorted by speed, "green", "cave"
- Done when: results match the criteria and are sorted by the relevant attribute.

#### M3. Search by effect, in my own words *(challenge 3)*

> As a new trainer, I want to describe what I want to happen in my own words, so that I find the moves and abilities that do it and the Pokémon that have them.

- Example: "put my opponent to sleep"
- Done when: results show the Pokémon together with the move or ability that does it and its effect (e.g. Jigglypuff · *Sing* · "Puts the target to sleep.").
- Never returns the opposite meaning: *Insomnia* / *Vital Spirit* ("Prevents sleep") or *Rest* (puts the **user** to sleep).

#### M4. Theme search across categories *(challenge 4)*

> As a player building a team, I want to explore a theme in one search, so that I see everything connected to it without searching each category separately.

- Example: "rain team"
- Done when: results are grouped by category (abilities, moves, Pokémon) and each item opens its card.
- Gaps in the data (e.g. nothing can start rain) aren't detected by the app; they're stated in [Limits](#8-limits).

#### M5. Show what matched

> As any user, I want each result to show the information I searched on, so that I can judge it without opening the card.

- Done when: the result shows the matched attribute and its value: speed for "fast electric", the move and its effect for "put my opponent to sleep", the ability for "rain team".

#### M6. Ranked by how well it matches

> As any user, I want the best matches first, so that I don't have to scan the whole list.

- Done when: every result has a match score from 0 to 1, results are sorted by it, and exact matches (score 1) are highlighted. Close matches simply come after, in the same list.

#### M7. No match means no results

> As any user, when my query has nothing to do with Pokémon, I want to be told nothing matched, so that I'm not shown random results.

- Example: "spaghetti"
- Done when: results below a minimum score are not shown; if none remain, the app says nothing matched and suggests example queries.

#### M8. Detail card

> As any user, I want to open a Pokémon to see everything about it, so that I can confirm my choice.

- Done when: the card shows image, types, stats, abilities, moves and description.

### Should

#### S1. Semantic search for unusual phrasing

> As any user, when the deterministic search isn't confident about my query, I want the app to search by meaning, so that I still get an answer when I phrase things in an unexpected way.

- Done when: if no result reaches the confidence threshold, the query is compared by meaning with the move effects, ability effects and descriptions, using a small model that runs in the browser. Results still come only from the dataset, and if nothing reaches the threshold, M7 applies.
- No server, API key or paid service: the model ships with the app and works offline.

#### S2. Compare two Pokémon

> As a player choosing between two candidates, I want to see them side by side, so that I can decide quickly.

- Entry points: "Compare with" on a card, and selecting two results in the list.
- Done when: for each stat, I can tell which of the two is higher, and I can see which types and abilities they share.

#### S3. Browse and filter — dropped

> As a researcher, I want to browse all Pokémon and filter by type, ability or move, including or excluding a value, so that I can explore without typing a query.

- **Dropped after testing the built search:** typing a type, colour or stat ("electric", "green", "fast fire") already does what the filters would do, in one place. Excluding a value belongs in the search bar as negation ("not electric"), listed in the next steps.

#### S4. Evolution family on the card

> As any user, I want to see a Pokémon's evolution family, so that I can find its earlier or later forms.

- Done when: the card shows the family in order, with Eevee's family shown as a branch.

### Could

#### C1. Favourites

> As any user, I want to mark Pokémon as favourites and browse them, so that I can come back to the ones I care about.

- Done when: favourites can be added or removed from a result and from the card, persist after a refresh (stored in the browser), and can be browsed together.

#### C2. Teams (up to 6)

> As a player, I want to build a team of up to 6 Pokémon, so that I can plan a lineup (e.g. a rain team, or fill a last slot).

## 5. Requirements

### Functional

the stories above.

### Non-functional

- **Easy to run locally:** one documented command, no paid service or API key required.
- **Also available online:** a deployed version with a public URL.
- **Fast:** results update as you type.
- **Accessible:** keyboard navigation, screen-reader labels, no information carried by colour alone.
- **Responsive:** usable on mobile.
- **Tested:** every Must story is covered by automated tests that run on every change; the queries in section 7 form the test set. The same end-to-end tests can run against the deployed version (`BASE_URL`).

## 6. Assumptions

| # | Assumption | Why it matters | Decision |
| --- | --- | --- | --- |
| 1 | Users search in English | Matching, test set | English only; accents don't matter ("é" = "e") |
| 2 | The dataset is fixed and used as provided: first-generation Pokémon and moves, with modern abilities and types | What can and can't be answered | No external data at runtime; gaps are stated, not filled |
| 3 | Reviewers run the app on an ordinary laptop or phone, possibly offline | The semantic search model must be small and local | A small model that ships with the app and runs in the browser (S1) |

## 7. Success metrics

Each query below is an automated test:

| Query | Expected |
| --- | --- |
| "bulba" | Bulbasaur first |
| "pikachoo" | Pikachu first |
| "saur" | Bulbasaur, Ivysaur, Venusaur (only these 3) |
| "fast electric" | Electrode (150), Jolteon (130), Raichu (110), in that order |
| "green" | The 9 green Pokémon: Bulbasaur, Ivysaur, Venusaur, Caterpie, Metapod, Bellsprout, Weepinbell, Victreebel, Scyther |
| "put my opponent to sleep" | Sing, Sleep Powder, Hypnosis, Lovely Kiss, Spore (and the ability Effect Spore) with their Pokémon, e.g. Jigglypuff · Sing. **Not** Insomnia, Vital Spirit or Rest |
| "rain team" | Abilities Swift Swim, Rain Dish, Hydration, Dry Skin; moves Thunder, Solar Beam; their Pokémon |
| "sun team" | Drought, Chlorophyll, Solar Power, Growth, Solar Beam, and Thunder as affected; **not** Mirror Move |
| "drain", "trainer" | No rain results |
| "spaghetti" | No results, with example queries suggested |

## 8. Limits

- **Data:** first-generation Pokémon (151) as provided. No type chart, so no matchup questions.
- **Gaps aren't detected.** The app shows what the data has, not what it lacks: a search for a "rain team" doesn't say that nothing can start rain. Known gaps are in [data discovery](./02-data-discovery.md#2-what-the-data-can-answer-for-the-briefs-examples).
- **Not a battle tool:** no damage calculation or optimisation.
- **No accounts:** favourites and teams live in the browser (cleared with browser data, not shared across devices).
- **Exclusion is word-based:** "not", "no", "without" and "except" leave a value out ("fire not flying"); negation inside a sentence ("doesn't put to sleep") isn't understood.
- **English only.** Accents don't matter ("é" matches "e").
- **An LLM is optional:** the "Ask AI" button needs an API key on the server; without it, the app works the same, minus the button.
- **Semantic search** uses a small model that loads on the first query that needs it, so that first search by meaning takes a moment longer.
- **Noise isn't always empty:** the deterministic search keeps any result scoring above 0, so a word like "hello" can return weak matches (6 of 13 noise cases in the [evaluation](./05-evaluation.md)). The LLM fallback brings that to 0.

## 9. 🤖 How I used AI for this document

I used Claude (chat) as a thinking partner. The decisions in this document are mine. Every document ends with a section like this one.

- **Organising my ideas.** I wrote the problem, my user stories and open questions first. I then used AI to challenge them against the brief's four challenges, prioritise them, rewrite them as "As a… I want… so that…" with acceptance criteria, and produce a first structured draft, which I reviewed and rewrote.
- **Domain knowledge.** I'm not a Pokémon expert, so I asked how weather (rain), type matchups and evolutions work. I treated the answers as hypotheses and checked them in the data ([data discovery](./02-data-discovery.md)).
- **Where I disagreed.**
  - **How results are displayed.** The AI proposed showing, on each result, a sentence explaining *why* it matched, a list of which parts of the query it met or missed, and a separate section for close matches. I disagreed: users care about *what* matched (the speed, the move), not how the engine reasoned. My design shows the matched attribute on the result, in a single list ranked by a match score, with exact matches highlighted.
  - It suggested replacing favourites with a team builder. I kept favourites and made teams a separate story.
- **A decision I changed later.** M4 first required the app to say when a theme has a known gap in the data. The AI pointed out it could be computed from the concept dictionary (a weather that things benefit from but nothing starts). I dropped it anyway: it would only cover the concepts in the dictionary, so it would look more complete than it is. Known gaps are stated in [Limits](#8-limits) instead.
- **Ideas that came from me:** comparing two Pokémon, the match score with highlighted exact matches, the no-false-positive rule, semantic search with a small in-browser model when the deterministic search isn't confident, favourites, and evolution families. The final scope and priorities were my call.

---

**Next:** [Data discovery](./02-data-discovery.md) · [All steps](./00-steps.md)
