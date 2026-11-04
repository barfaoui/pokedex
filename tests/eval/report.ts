import { CONFIDENT_SCORE } from '@/search/search'
import { MODEL_DTYPE, MODEL_ID } from '@/search/semantic/model'
import {
  DESCRIPTION_WEIGHT,
  rescale,
  SEMANTIC_THRESHOLD,
} from '@/search/semantic/semantic'
import type { Expectation, Group } from './queries'
import type { EvalRun, ItemCosine, Outcome } from './run'

export interface Context {
  date: Date
  commit: string
  dirty: boolean | null
  machine: string
  cost: CostCheck
}

export interface CostCheck {
  paidDependencies: string[]
  remoteUrls: string[]
  secrets: string[]
  workerLocalOnly: boolean
}

const GROUPS: { group: Group; title: string; intro: string }[] = [
  {
    group: 'prd',
    title: 'PRD queries (section 7)',
    intro:
      'The spec the manual search was built on: these numbers show it still holds, not how it does on new queries.',
  },
  {
    group: 'probe-tuning',
    title: 'Semantic probes, tuning',
    intro: 'May be used to adjust a threshold.',
  },
  {
    group: 'probe-holdout',
    title: 'Semantic probes, held out',
    intro:
      'Never used to tune anything: the closest thing here to how the search does on queries nobody tried.',
  },
]
const TOP_SHOWN = 5

export function formatReport(run: EvalRun, context: Context): string {
  const lines: string[] = []
  const push = (...more: string[]) => lines.push(...more)
  const { outcomes } = run
  const floor = floorCosine(1)
  const descriptionFloor = floorCosine(DESCRIPTION_WEIGHT)

  push(
    `# Search evaluation · ${stamp(context.date)}`,
    '',
    '| | |',
    '| --- | --- |',
    `| Commit | ${context.commit}${context.dirty ? ' + uncommitted changes' : context.dirty === null ? ' (status unknown)' : ''} |`,
    `| Model | ${MODEL_ID} (${MODEL_DTYPE}), run in Node with the committed files, not in the browser worker |`,
    `| Semantic search runs | when no manual result scores ≥ ${CONFIDENT_SCORE} |`,
    `| Semantic floor | score ${SEMANTIC_THRESHOLD} = cosine ${floor.toFixed(3)} (${descriptionFloor.toFixed(3)} for Pokémon descriptions, weighted ${DESCRIPTION_WEIGHT}) |`,
    `| Machine | ${context.machine} |`,
    `| Queries | ${GROUPS.map(({ group, title }) => `${count(outcomes, group)} ${title.toLowerCase()}`).join(' · ')} |`,
    '',
    '_Italic_ results come from semantic search. † marks a query already used to set a threshold.',
    '',
  )

  for (const { group, title, intro } of GROUPS) {
    const rows = outcomes.filter((o) => o.query.group === group)
    push(
      `## ${title}`,
      '',
      intro,
      '',
      '| Query | Expected | Found | First expected at (All tab · own tab) | Answered by | Result |',
      '| --- | --- | --- | --- | --- | --- |',
      ...rows.map(
        (o) =>
          `| ${o.query.query}${o.query.seen ? ' †' : ''} | ${describe(o.query.expect)} | ${found(o)} | ${firstRank(o)} | ${o.layer} | ${o.check.passed ? 'pass' : 'FAIL'} |`,
      ),
      '',
    )
    const seen = rows.filter((o) => o.query.seen)
    if (seen.length) {
      push(...seen.map((o) => `† ${o.query.query}: ${o.query.seen}`), '')
    }
  }

  push('## False negatives and false positives', '')
  push(
    'False negative: an expected result that is missing. False positive: a forbidden result, any result for a query that should find nothing, or an extra result where the expected list is complete. Extra results elsewhere are not judged.',
    '',
  )
  const wrong = outcomes.filter(
    (o) =>
      o.check.missing.length ||
      o.check.falsePositives.length ||
      o.check.notes.length,
  )
  if (!wrong.length) {
    push('None.', '')
  }
  for (const o of wrong) {
    push(`- **${o.query.query}** (${groupTitle(o.query.group)})`)
    if (o.check.missing.length) {
      push(
        `  - false negatives (${o.check.missing.length}): ${o.check.missing.join(', ')}`,
      )
    }
    if (o.check.falsePositives.length) {
      push(
        `  - false positives (${o.check.falsePositives.length}): ${o.check.falsePositives.join(', ')}`,
      )
    }
    for (const note of o.check.notes) {
      push(`  - ${note}`)
    }
  }
  push('')

  const manualRuns = outcomes.flatMap((o) =>
    o.manualMs.map((ms) => ({ ms, query: o.query.query })),
  )
  const semanticRuns = outcomes.flatMap((o) =>
    o.semanticMs.map((ms) => ({ ms, query: o.query.query })),
  )
  push(
    '## Latency',
    '',
    '| | Median | Slowest | Runs |',
    '| --- | --- | --- | --- |',
    latencyRow('Manual search', manualRuns, outcomes.length),
    latencyRow(
      'Semantic search (embed the query, rank, merge)',
      semanticRuns,
      outcomes.filter((o) => o.triggered).length,
    ),
    `| Model load, once | ${ms(run.modelLoadMs)} | | 1 |`,
    `| First embedding after load | ${ms(run.firstEmbedMs)} | | 1 |`,
    '',
    'Node timings on this machine. In the app the model runs in a web worker on WebAssembly, so expect it slower there, and the first load also downloads 33 MB.',
    '',
  )

  const { cost } = context
  const free =
    !run.networkRequests.length &&
    !cost.paidDependencies.length &&
    !cost.remoteUrls.length &&
    !cost.secrets.length &&
    cost.workerLocalOnly
  push(
    '## Cost',
    '',
    `- Network requests during the run: ${run.networkRequests.length}${run.networkRequests.length ? ` (${run.networkRequests.join(', ')})` : ''}`,
    `- Paid or remote AI packages in package.json: ${cost.paidDependencies.join(', ') || 'none'}`,
    `- Remote URLs in src/: ${cost.remoteUrls.join(', ') || 'none'}`,
    `- API keys or tokens in src/: ${cost.secrets.join(', ') || 'none'}`,
    `- The app's worker forbids remote models (allowRemoteModels = false): ${cost.workerLocalOnly ? 'yes' : 'NO'}`,
    '',
    free
      ? '**Cost: 0.** Everything runs locally, nothing is billed per query.'
      : '**Cost: not proven to be 0**, see above.',
    '',
  )

  push(...thresholds(outcomes, floor), '')

  push(
    '## Totals',
    '',
    '| Group | Queries passed | Expected results found | Median rank of first expected (All tab · own tab) | Should-find-nothing queries that found something | False positives |',
    '| --- | --- | --- | --- | --- | --- |',
    ...GROUPS.map(({ group, title }) =>
      totalRow(
        title,
        outcomes.filter((o) => o.query.group === group),
      ),
    ),
    totalRow(
      'All but held out',
      outcomes.filter((o) => o.query.group !== 'probe-holdout'),
    ),
    '',
  )

  return lines.join('\n')
}

function thresholds(outcomes: Outcome[], floor: number): string[] {
  const lines = [
    '## Thresholds',
    '',
    `### Run semantic search below ${CONFIDENT_SCORE}`,
    '',
    '| Query | Best manual score | Semantic search ran | Result |',
    '| --- | --- | --- | --- |',
    ...[...outcomes]
      .sort((a, b) => b.bestManual - a.bestManual)
      .map(
        (o) =>
          `| ${o.query.query} | ${o.bestManual.toFixed(2)} | ${o.triggered ? 'yes' : 'no'} | ${o.check.passed ? 'pass' : 'FAIL'} |`,
      ),
    '',
  ]
  const signals: string[] = []
  const confident = outcomes.filter((o) => !o.triggered)
  const weak = outcomes.filter((o) => o.triggered)
  for (const o of confident.filter((o) => !o.check.passed)) {
    signals.push(
      `"${o.query.query}" failed with a confident manual answer (${o.bestManual.toFixed(2)}): semantic search never got a chance.`,
    )
  }
  for (const o of weak.filter(
    (o) => o.layer === 'manual (weak)' && !o.check.passed,
  )) {
    signals.push(
      `"${o.query.query}" failed on weak manual results alone: semantic search ran but added nothing.`,
    )
  }
  if (confident.length && weak.length) {
    const lowestConfident = Math.min(...confident.map((o) => o.bestManual))
    const highestWeak = Math.max(...weak.map((o) => o.bestManual))
    lines.push(
      `Confident answers start at ${lowestConfident.toFixed(2)}, weak ones stop at ${highestWeak.toFixed(2)}: the trigger has ${(lowestConfident - CONFIDENT_SCORE).toFixed(2)} of margin above and ${(CONFIDENT_SCORE - highestWeak).toFixed(2)} below.`,
      '',
    )
  }

  const nothing = outcomes.filter((o) => o.query.expect.type === 'nothing')
  const shouldFind = outcomes.filter(
    (o) => o.query.group !== 'prd' && o.query.expect.type !== 'nothing',
  )
  lines.push(
    `### Semantic floor, cosine ${floor.toFixed(2)}`,
    '',
    'Computed for every query below, even where the app would not run semantic search.',
    '',
    '| Query | Should find | Closest item (cosine) | Best expected (cosine, rank) | Worst expected (cosine, rank) |',
    '| --- | --- | --- | --- | --- |',
    ...[...nothing, ...shouldFind].map((o) => {
      const expected = [...o.cosine.expected].sort(
        (a, b) => b.cosine - a.cosine,
      )
      return `| ${o.query.query} | ${o.query.expect.type === 'nothing' ? 'nothing' : 'something'} | ${item(o.cosine.top)} | ${expected.length ? itemRank(expected[0]) : '—'} | ${expected.length ? itemRank(expected[expected.length - 1]) : '—'} |`
    }),
    '',
  )

  const noisiest = nothing.length
    ? Math.max(...nothing.map((o) => o.cosine.top.cosine))
    : null
  for (const o of nothing.filter((o) => o.cosine.top.cosine >= floor)) {
    signals.push(
      `"${o.query.query}" should find nothing, but ${o.cosine.top.key} reaches cosine ${o.cosine.top.cosine.toFixed(3)}, above the floor.`,
    )
  }
  for (const o of shouldFind) {
    const below = o.cosine.expected.filter((e) => e.cosine < floor)
    if (below.length === o.cosine.expected.length) {
      signals.push(
        `"${o.query.query}": every expected result is below the floor (best ${Math.max(...below.map((e) => e.cosine)).toFixed(3)}).`,
      )
    } else if (below.length) {
      signals.push(
        `"${o.query.query}": ${below.map((e) => `${e.key} (${e.cosine.toFixed(3)})`).join(', ')} below the floor.`,
      )
    }
  }
  if (shouldFind.length && noisiest !== null) {
    const weakestHit = Math.min(
      ...shouldFind.map((o) =>
        Math.max(...o.cosine.expected.map((e) => e.cosine), 0),
      ),
    )
    lines.push(
      `Noise peaks at cosine ${noisiest.toFixed(3)}; the weakest query that should find something has its best expected result at ${weakestHit.toFixed(3)}. A floor between the two separates them${noisiest < floor && floor <= weakestHit ? ', and 0.40 is in between' : ', and 0.40 is NOT in between'}.`,
      '',
    )
  }

  lines.push('### Signals', '')
  lines.push(
    ...(signals.length
      ? signals.map((signal) => `- ${signal}`)
      : [
          `- None of these queries says a threshold is wrong. With ${nothing.length} should-find-nothing and ${shouldFind.length} should-find probes that is weak evidence, not proof.`,
        ]),
  )
  return lines
}

function describe(expect: Expectation): string {
  switch (expect.type) {
    case 'nothing':
      return 'nothing'
    case 'first':
      return `${nameOf(expect.key)} first`
    case 'ordered':
      return `${expect.keys.map(nameOf).join(', ')}, in that order`
    case 'includes': {
      const parts: string[] = []
      if (expect.keys.length) {
        const shown = expect.keys.slice(0, 6).map(nameOf).join(', ')
        const more =
          expect.keys.length > 6 ? ` +${expect.keys.length - 6} more` : ''
        parts.push(
          `${shown}${more}${expect.exhaustive ? ` (only these${expect.exhaustive === 'all' ? '' : ` ${expect.exhaustive}`})` : ''}`,
        )
      }
      if (expect.forbidden?.length) {
        parts.push(`never ${expect.forbidden.join(', ')}`)
      }
      return parts.join('; ')
    }
  }
}

const TAB_NAMES = { pokemon: 'Pokémon', move: 'Moves', ability: 'Abilities' }

function firstRank(o: Outcome): string {
  const { firstRank, firstRankInTab } = o.check
  if (firstRank === null || !firstRankInTab) {
    return '—'
  }
  return `${firstRank} · ${firstRankInTab.rank} in ${TAB_NAMES[firstRankInTab.kind]}`
}

function found(o: Outcome): string {
  if (!o.results.length) {
    return 'nothing'
  }
  const top = o.results.slice(0, TOP_SHOWN).map((result, index) => {
    const text = `${result.item.name} ${result.score.toFixed(2)}`
    return o.fromSemantic[index] ? `_${text}_` : text
  })
  const rest = o.results.length - TOP_SHOWN
  return `${top.join(', ')}${rest > 0 ? ` (+${rest})` : ''}`
}

function latencyRow(
  label: string,
  runs: { ms: number; query: string }[],
  queries: number,
): string {
  if (!runs.length) {
    return `| ${label} | — | — | 0 |`
  }
  const slowest = runs.reduce((a, b) => (b.ms > a.ms ? b : a))
  return `| ${label} | ${ms(median(runs.map((run) => run.ms)))} | ${ms(slowest.ms)} ("${slowest.query}") | ${runs.length} over ${queries} queries |`
}

function totalRow(label: string, rows: Outcome[]): string {
  const passed = rows.filter((o) => o.check.passed).length
  const expected = rows.reduce((sum, o) => sum + o.check.expectedCount, 0)
  const missing = rows.reduce((sum, o) => sum + o.check.missing.length, 0)
  const ranks = rows.flatMap((o) => o.check.firstRank ?? [])
  const tabRanks = rows.flatMap((o) => o.check.firstRankInTab?.rank ?? [])
  const nothing = rows.filter((o) => o.query.expect.type === 'nothing')
  const noisy = nothing.filter((o) => o.results.length).length
  const falsePositives = rows.reduce(
    (sum, o) => sum + o.check.falsePositives.length,
    0,
  )
  return `| ${label} | ${passed}/${rows.length} | ${expected - missing}/${expected}${expected ? ` (${percent((expected - missing) / expected)})` : ''} | ${ranks.length ? `${median(ranks)} · ${median(tabRanks)}` : '—'} | ${noisy}/${nothing.length} | ${falsePositives} |`
}

function floorCosine(weight: number): number {
  let low = -1
  let high = 1
  for (let step = 0; step < 60; step++) {
    const middle = (low + high) / 2
    if (rescale(middle) * weight >= SEMANTIC_THRESHOLD) {
      high = middle
    } else {
      low = middle
    }
  }
  return high
}

function item(cosine: ItemCosine): string {
  return `${nameOf(cosine.key)} ${cosine.cosine.toFixed(3)}${cosine.source === 'description' ? ' (description)' : ''}`
}

function itemRank(cosine: ItemCosine): string {
  return `${item(cosine)}, #${cosine.rank}`
}

function nameOf(key: string): string {
  return key.slice(key.indexOf(':') + 1)
}

function groupTitle(group: Group): string {
  return GROUPS.find((g) => g.group === group)?.title ?? group
}

function count(outcomes: Outcome[], group: Group): number {
  return outcomes.filter((o) => o.query.group === group).length
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

function ms(value: number): string {
  return value >= 1000
    ? `${(value / 1000).toFixed(2)} s`
    : value >= 10
      ? `${value.toFixed(0)} ms`
      : `${value.toFixed(2)} ms`
}

function percent(ratio: number): string {
  return `${Math.round(ratio * 100)} %`
}

export function stamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
