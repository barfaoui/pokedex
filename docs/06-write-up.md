# Write-up

Choices, limitations, what I'd do differently, and next steps.

## 1. The problem I chose

**Go from a vague intent to a confident answer.**

| The brief's challenge | What the app does |
| --- | --- |
| "bulba…" | Partial names and typos, with the image to confirm |
| A fast Electric type | Criteria ("fast electric") and a side-by-side compare |
| "Put an opponent to sleep" | Effects in plain words, through a concept dictionary that knows the direction |
| A rain team | Abilities, moves and Pokémon around a theme, in one search |

**Not built, on purpose:** battle tools, "how to beat X" (no type chart in the data), accounts.

## 2. Key choices

| Choice | Trade-off |
| --- | --- |
| **Deterministic search first** | Exact, instant, explainable; unknown phrasings need a fallback |
| **A concept dictionary with directions** | "Sleep" no longer returns Insomnia or Rest; costs a review |
| **A small model in the browser as fallback** | Free, offline, no key; weak on its own (34 of 192) |
| **A 0–1 score, shown with what matched** | Users see why a result is there; the score needs calibrating |
| **The LLM as an option, measured** | Better on meaning, but ~1.3 s and paid: a button, suggested when the search isn't sure |

## 3. Results

| Setup | Passed (of 192) | Typical time | Cost / 1,000 |
| --- | --- | --- | --- |
| The app without AI | 143 (74%) | 14 ms | 0 |
| LLM alone (Haiku 5.5) | 151 (79%) | 1.3 s | 0.82 € |
| **Deterministic + LLM fallback** | **178 (93%)** | **24 ms** (1.3 s when it asks the LLM) | **0.38 €** |

**An LLM alone isn't the answer; behind the deterministic search, it is.** Details: [Evaluation](./05-evaluation.md).

## 4. Limitations

| Limit | What would fix it |
| --- | --- |
| **No blind test set:** I fixed the search against these cases | Fresh queries from new users |
| **Without AI, meaning is weak:** describing a Pokémon 40%, lore 1 of 5 | The LLM fallback (95%) |
| **Noise without AI:** 6 of 13 return something ("hello" → yellow) | The fallback (0 of 13) |
| **The LLM is slow, and costs more with sparse traffic** | Send only the top candidates |
| **AI results don't say why they matched** | Match them against the query locally |
| **No type chart:** no "best counter for Gyarados" | A small type-chart table |

## 5. What I'd do differently

- **Build the eval first:** my first scores were tuned on 25 queries.
- **Keep a blind test set from day one.**
- **Measure the LLM earlier:** I had parked it; it turned out to be the biggest gain.

## 6. Next steps

1. **A blind test set** from new users.
2. **The LLM fallback on a smaller catalogue:** faster and cheaper.
3. **A type chart,** for "how to beat X".

---

**Previous:** [Evaluation](./05-evaluation.md) · [All steps](./00-steps.md)
