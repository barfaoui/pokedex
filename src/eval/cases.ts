export type Check = 'first' | 'top3' | 'top10' | 'nothing'

/** `kind:name`. A bare name, as some `forbidden` cells have, stands for every kind. */
export type ItemKey = string

export interface EvalCase {
  id: string
  query: string
  category: string
  check: Check
  best: ItemKey[]
  ok: ItemKey[]
  forbidden: ItemKey[]
  source: string
  note: string
}

const CHECKS: readonly Check[] = ['first', 'top3', 'top10', 'nothing']
const COLUMNS = [
  'id',
  'query',
  'category',
  'check',
  'best',
  'ok',
  'forbidden',
  'source',
  'note',
] as const

/** RFC 4180 quoting: some queries and notes hold commas ("fire, water"), some notes hold "". */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let at = 0; at < text.length; at++) {
    const char = text[at]
    if (quoted) {
      if (char !== '"') {
        field += char
      } else if (text[at + 1] === '"') {
        field += '"'
        at++
      } else {
        quoted = false
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''))
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''))
    rows.push(row)
  }
  return rows
}

export function parseCases(text: string): EvalCase[] {
  const [header, ...rows] = parseCsv(text)
  const column = new Map(header.map((name, at) => [name.trim(), at]))
  const missing = COLUMNS.filter((name) => !column.has(name))
  if (missing.length) {
    throw new Error(`cases.csv: missing columns ${missing.join(', ')}`)
  }
  return rows
    .filter((cells) => cells.some((cell) => cell.trim()))
    .map((cells, at) => {
      const cell = (name: (typeof COLUMNS)[number]) =>
        (cells[column.get(name) ?? -1] ?? '').trim()
      const line = at + 2
      const check = cell('check') as Check
      if (!CHECKS.includes(check)) {
        throw new Error(`cases.csv line ${line}: unknown check "${check}"`)
      }
      return {
        id: cell('id') || String(line - 1),
        query: cell('query'),
        category: cell('category'),
        check,
        best: items(cell('best')),
        ok: items(cell('ok')),
        forbidden: items(cell('forbidden')),
        source: cell('source'),
        note: cell('note'),
      }
    })
}

function items(cell: string): ItemKey[] {
  return cell.split(/\s+/).filter(Boolean)
}
