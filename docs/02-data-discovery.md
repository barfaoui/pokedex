# Data Discovery

What the dataset contains, what it can and can't answer, and what that means for search. Source: `pokedex.json` provided with the exercise.

## Contents

- [1. Shape](#1-shape)
- [2. What the data can answer for the brief's examples](#2-what-the-data-can-answer-for-the-briefs-examples)
- [3. Key finding: plain keyword search gives wrong answers here](#3-key-finding-plain-keyword-search-gives-wrong-answers-here)
- [4. 🤖 How I used AI for this document](#4--how-i-used-ai-for-this-document)

## 1. Shape

`metadata`, `pokemon` (151), `moves` (164), `abilities` (114).
Scope from the metadata: *Pokémon #1–151 with English species data, abilities, and moves available in Pokémon Red, Blue, or Yellow.*

| Entity | Fields |
| --- | --- |
| **Pokémon** | `id`, `name`, `height_decimetres`, `weight_hectograms`, `base_experience`, `types`, `stats` (hp, attack, defense, special-attack, special-defense, speed), `abilities` (names), `moves` (names), `species` (generation, description, genus, color, shape, habitat, is_legendary, is_mythical, evolution_chain_id), `images` (sprite, official_artwork) |
| **Move** | `id`, `name`, `type`, `power`, `pp`, `accuracy`, `priority`, `damage_class`, `effect_chance`, `effect`, `short_effect`, `generation`, `learned_by_pokemon` |
| **Ability** | `id`, `name`, `effect`, `short_effect`, `generation`, `is_main_series`, `pokemon` |

- Relationships go both ways (Pokémon ↔ moves, Pokémon ↔ abilities), and every move listed on a Pokémon exists in `moves`.
- Every move and ability has a long `effect` and a `short_effect`; none are empty.
- 18 types: 17 on Pokémon, plus Dark, used only by the move Bite. Typing and abilities are **modern** (abilities come from later generations; Fairy and Steel are present, e.g. Clefairy is Fairy), while moves are first-generation only.
- No type-effectiveness data.

## 2. What the data can answer for the brief's examples

**Partial names:** all 151 names are there; nothing special needed.

**Fast Electric:** a type filter plus a sort on `stats.speed`: Electrode (150), Jolteon (130), Raichu (110). Nothing in the dataset is faster than 150.

**Putting the opponent to sleep:**

- Moves whose effect puts the target to sleep: Sing (6 Pokémon), Sleep Powder (14), Hypnosis (10), Lovely Kiss (1), Spore (2).
- Ability: Effect Spore (30% chance on contact).
- Some species descriptions mention sleep (Jigglypuff, Snorlax…). That's lore, not a game mechanic: Snorlax has no sleep move.

**Rain:**

- Abilities that benefit from rain: Swift Swim (13 Pokémon), Rain Dish (5), Hydration (4), Dry Skin (3).
- Moves affected by rain: Thunder (always hits), Solar Beam (power halved).
- **Nothing in the dataset starts rain** (no Rain Dance, no Drizzle).
- Other weather: only sun can be started (ability Drought: Vulpix, Ninetales). Nothing starts sandstorm or hail.

**Evolutions:** Pokémon sharing `species.evolution_chain_id` form a family, and ordering by Pokédex number gives the right order. 78 families; 23 Pokémon don't evolve; Eevee's family branches into Vaporeon, Jolteon and Flareon. Family members outside the 151 (e.g. Crobat) aren't in the data.

## 3. Key finding: plain keyword search gives wrong answers here

- "rain" as a substring matches *d**rain**s* (Absorb, Mega Drain, Leech Life) and *t**rain**ers* (Roar, Whirlwind).
- "sleep" matches many unrelated moves whose description only mentions *Sleep Talk* (Dig, Fly, Bide…), *Rest* (the user sleeps, not the target), and abilities that do the **opposite** (Insomnia, Vital Spirit: "Prevents sleep").
- Drought's effect **mentions** Drizzle (a rain ability) without being about rain: a rain synonym "drizzle" must not make it a rain result.
- Some mechanics appear **only in the long `effect`**: Thunder's `short_effect` doesn't mention rain.

**Consequence for search:** match whole words, understand meaning (who is affected; causing vs preventing), and search both effect fields. The test set in the [PRD](./01-prd.md#7-success-metrics) locks these cases in.

## 4. 🤖 How I used AI for this document

- **I checked the key facts by hand** in the raw JSON first: the shape and counts, what exists for rain and sleep, the fastest Pokémon.
- **Then AI-run checks on the same file** cross-checked them and went further: evolution families, every text that matches "rain" or "sleep", fields that are never empty. That second pass surfaced the keyword traps in section 3.
- **Where the AI was wrong:** it assumed Electrode's speed was 140; my check of the data found 150.

---

**Previous:** [PRD](./01-prd.md) · **All steps:** [Steps](./00-steps.md)
