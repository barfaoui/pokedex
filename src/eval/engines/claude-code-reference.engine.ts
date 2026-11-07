import csv from '../../../tests/eval/llm-answers.csv?raw'
import { index } from '@/data/dataset'
import { parseCsv } from '@/eval/cases'
import type { SearchResult } from '@/search/types/result'
import type { EngineDefinition } from './engine'

const REFERENCE_NOTE =
  'Answers written once by a Claude Code session that saw the full data and the queries. An upper bound, not timed, not reproducible.'

const answers = new Map(
  parseCsv(csv)
    .slice(1)
    .filter((cells) => cells.length >= 3)
    .map(([, query, results]) => [
      query.trim(),
      results.split(/\s+/).filter(Boolean),
    ]),
)

function keysOf(query: string): string[] {
  return answers.get(query.trim()) ?? []
}

function resultOf(key: string): SearchResult | null {
  const [kind, name] = key.split(':')
  const matched: SearchResult['matched'] = []
  switch (kind) {
    case 'pokemon': {
      const item = index.pokemon.get(name)
      return item ? { kind, item, score: 0, matched } : null
    }
    case 'move': {
      const item = index.moves.get(name)
      return item ? { kind, item, score: 0, matched } : null
    }
    case 'ability': {
      const item = index.abilities.get(name)
      return item ? { kind, item, score: 0, matched } : null
    }
    default:
      return null
  }
}

// A key the data doesn't hold can't be shown or linked: it is left out of the results and listed
// by `invented` instead.
const claudeCodeReference: EngineDefinition = {
  id: 'claude-code-reference',
  order: 4,
  create: () => ({
    name: 'Claude Code',
    notMeasured: REFERENCE_NOTE,
    search: async (query) =>
      keysOf(query)
        .map(resultOf)
        .filter((result) => result !== null),
    invented: (query) => keysOf(query).filter((key) => !resultOf(key)),
  }),
}

export default claudeCodeReference
