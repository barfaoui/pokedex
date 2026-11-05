/** Written for a reader who isn't a search engineer; shared by the report and the page. */
export const GLOSSARY: { term: string; meaning: string }[] = [
  {
    term: 'Holdout / tuning',
    meaning:
      'Tuning cases were used to set rules and thresholds, so they look better. Holdout cases never were: they are the closest thing to queries nobody has tried. The two are never added up.',
  },
  {
    term: 'Best / okay / forbidden',
    meaning:
      'For each query, the best answers must come at the top, okay answers are relevant but not the point, and forbidden ones must never appear.',
  },
  {
    term: 'Check',
    meaning:
      'What a query must do to pass: a best answer first (first), the top 3 or top 10 filled with best answers as far as they go (top3, top10), or no result at all (nothing).',
  },
  {
    term: 'Pass',
    meaning:
      'Share of queries whose check holds, with no forbidden result anywhere in the list.',
  },
  {
    term: 'First best at',
    meaning:
      'Position of the first best answer in the list; — when none came back.',
  },
  {
    term: 'Hit@1',
    meaning: 'How often the very first result is one of the best answers.',
  },
  {
    term: 'Recall@10',
    meaning:
      'Of the right answers (best and okay), the share that shows in the first 10 results, out of as many as fit in 10.',
  },
  {
    term: 'MRR',
    meaning:
      '1 ÷ the position of the first best answer, averaged: 1 = always first, 0.5 = usually second, 0 = never found.',
  },
  {
    term: 'nDCG@10',
    meaning:
      'How close the first 10 results are to the ideal order, best answers counting double: 1 is perfect, 0 is nothing useful.',
  },
  {
    term: 'False positives',
    meaning:
      'Of the queries that should find nothing (noise like "pizza"), the share that found something.',
  },
  {
    term: 'p50 / p95',
    meaning:
      'The time a query takes for half of the queries / for all but the slowest 5 %.',
  },
  {
    term: 'Cost / 1,000',
    meaning:
      'Euros billed per thousand queries; 0 for engines that run on the device.',
  },
  {
    term: 'Manual / Embeddings / Hybrid',
    meaning:
      'Manual: the rule-based search alone. Embeddings: search by meaning alone, on every query. Hybrid: what the app does, manual first and search by meaning when manual isn’t confident.',
  },
]
