// A generated file: the serverless function can't import the app's code (extensionless imports, @).
// No image URLs or reverse lists (they repeat each Pokémon's own); one line per item: 80k tokens, JSON 98k.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { catalogueBlock } from '../api/_lib/catalogue-text.ts'
import { MODEL_CONFIGS } from '../api/_lib/models.ts'
import { SYSTEM_PROMPT } from '../api/_lib/system-prompt.ts'
import { displayName } from '../src/data/display-name.ts'

interface RawPokemon {
  id: number
  name: string
  height_decimetres: number
  weight_hectograms: number
  base_experience: number
  types: string[]
  stats: Record<string, number>
  abilities: string[]
  moves: string[]
  species: {
    generation: string
    description: string
    genus: string
    color: string
    shape: string
    habitat: string | null
    is_legendary: boolean
    is_mythical: boolean
    evolution_chain_id: number
  }
}

interface RawMove {
  id: number
  name: string
  type: string
  power: number | null
  pp: number | null
  accuracy: number | null
  priority: number
  damage_class: string
  effect_chance: number | null
  effect: string
  short_effect: string
  generation: string
}

interface RawAbility {
  id: number
  name: string
  effect: string
  short_effect: string
  generation: string
  is_main_series: boolean
}

const DATASET = new URL('../src/data/pokedex.json', import.meta.url)
const OUTPUT = new URL('../api/_lib/catalogue.ts', import.meta.url)
// Its size alone, so the eval page can estimate a cost without bundling the catalogue.
const SIZE_OUTPUT = new URL('../api/_lib/catalogue-size.ts', import.meta.url)
// Haiku 5.5's input price is 5× past 100k tokens: stay well under.
const MAX_INPUT_TOKENS = 90_000
// Measured on the recorded v1 run (25,951 cached tokens for about 56k characters): this text,
// full of names and numbers, packs fewer characters per token than prose.
const CHARACTERS_PER_TOKEN = 2.2

const { metadata, pokemon, moves, abilities } = JSON.parse(
  readFileSync(DATASET, 'utf8'),
) as {
  metadata: { source: string; scope: string; version_groups: string[] }
  pokemon: RawPokemon[]
  moves: RawMove[]
  abilities: RawAbility[]
}

const STAT_SHORT: Record<string, string> = {
  hp: 'hp',
  attack: 'atk',
  defense: 'def',
  'special-attack': 'spa',
  'special-defense': 'spd',
  speed: 'spe',
}

const families = new Map<number, string[]>()
for (const p of [...pokemon].sort((a, b) => a.id - b.id)) {
  const chain = families.get(p.species.evolution_chain_id) ?? []
  chain.push(p.name)
  families.set(p.species.evolution_chain_id, chain)
}

// Eevee is the only family in the 151 that branches, as in src/data/build-index.ts.
function familyOf(p: RawPokemon): string {
  const [first, ...rest] = families.get(p.species.evolution_chain_id) ?? []
  if (!rest.length) {
    return 'none'
  }
  return first === 'eevee'
    ? `eevee > ${rest.join(' / ')}`
    : [first, ...rest].join(' > ')
}

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim()
const orDash = (value: number | null) => (value === null ? '—' : String(value))
// Some short effects are the whole effect: sent once.
const effects = (item: { effect: string; short_effect: string }) => {
  const short = oneLine(item.short_effect)
  const full = oneLine(item.effect)
  return full === short ? [short] : [short, `effect: ${full}`]
}

const HEADER = [
  `Dataset: ${metadata.scope}. Source: ${metadata.source}, version groups ${metadata.version_groups.join(', ')}.`,
  'Pokémon: key | name | #id | types | base stats | height, weight | base experience | generation | colour, shape, habitat | genus | legendary or mythical, when it is | abilities | evolution family | moves it learns | description',
  'Move: key | name | #id | type | damage class | power, pp, accuracy, priority, effect chance (— when none) | generation | short effect | effect, when longer',
  'Ability: key | name | #id | generation | short effect | effect, when longer',
]

const lines = [
  ...pokemon.map((p) =>
    [
      `pokemon:${p.name}`,
      displayName(p.name),
      `#${p.id}`,
      p.types.join('/'),
      Object.entries(p.stats)
        .map(([stat, value]) => `${STAT_SHORT[stat] ?? stat} ${value}`)
        .join(' '),
      `${p.height_decimetres / 10} m, ${p.weight_hectograms / 10} kg`,
      `base exp ${p.base_experience}`,
      p.species.generation,
      `${p.species.color}, ${p.species.shape}, ${p.species.habitat ?? 'unknown habitat'}`,
      p.species.genus,
      ...(p.species.is_legendary ? ['legendary'] : []),
      ...(p.species.is_mythical ? ['mythical'] : []),
      `abilities: ${p.abilities.join(', ')}`,
      `family: ${familyOf(p)}`,
      `moves: ${p.moves.join(', ')}`,
      oneLine(p.species.description),
    ].join(' | '),
  ),
  ...moves.map((m) =>
    [
      `move:${m.name}`,
      displayName(m.name),
      `#${m.id}`,
      m.type,
      m.damage_class,
      `power ${orDash(m.power)}, pp ${orDash(m.pp)}, accuracy ${orDash(m.accuracy)}, priority ${m.priority}, effect chance ${orDash(m.effect_chance)}`,
      m.generation,
      ...effects(m),
    ].join(' | '),
  ),
  ...abilities.map((a) =>
    [
      `ability:${a.name}`,
      displayName(a.name),
      `#${a.id}`,
      a.generation,
      ...(a.is_main_series ? [] : ['not main series']),
      ...effects(a),
    ].join(' | '),
  ),
]

const catalogue = catalogueBlock(HEADER, lines)
const models = [...new Set(MODEL_CONFIGS.map((config) => config.model))]
const tokens: Record<string, number> = {}
for (const model of models) {
  const counted = await countTokens(model)
  tokens[model] =
    counted ??
    Math.ceil((SYSTEM_PROMPT.length + catalogue.length) / CHARACTERS_PER_TOKEN)
  console.log(
    `${model}: ${tokens[model]} input tokens (${counted === null ? 'estimated: no ANTHROPIC_API_KEY' : 'counted by the API'}).`,
  )
}
console.log(`${catalogue.length} catalogue characters, ${lines.length} items.`)
const over = models.filter((model) => tokens[model] > MAX_INPUT_TOKENS)
if (over.length) {
  console.error(
    `Over ${MAX_INPUT_TOKENS} input tokens for ${over.join(', ')}: nothing written. Make the catalogue smaller.`,
  )
  process.exit(1)
}

writeFileSync(
  OUTPUT,
  [
    '// Generated by scripts/build-catalogue.ts from src/data/pokedex.json: run `npm run catalogue`.',
    `export const CATALOGUE_HEADER: readonly string[] = ${JSON.stringify(HEADER, null, 2)}`,
    '',
    `export const CATALOGUE_LINES: readonly string[] = ${JSON.stringify(lines, null, 2)}`,
    '',
  ].join('\n'),
)
writeFileSync(
  SIZE_OUTPUT,
  [
    '// Generated by scripts/build-catalogue.ts: run `npm run catalogue`.',
    "// The system prompt and the catalogue, in each model's tokens.",
    `export const CACHED_PROMPT_TOKENS: Readonly<Record<string, number>> = ${JSON.stringify(tokens, null, 2)}`,
    '',
  ].join('\n'),
)
console.log('Written to api/_lib/catalogue.ts')

/** The whole request with a one-word query, counted for free. null without a key or on failure. */
async function countTokens(model: string): Promise<number | null> {
  if (!process.env.ANTHROPIC_API_KEY && existsSync('.env.local')) {
    process.loadEnvFile('.env.local')
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return null
  }
  try {
    const response = await fetch(
      'https://api.anthropic.com/v1/messages/count_tokens',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          system: [
            { type: 'text', text: SYSTEM_PROMPT },
            { type: 'text', text: catalogue },
          ],
          messages: [{ role: 'user', content: '<query>x</query>' }],
        }),
      },
    )
    if (!response.ok) {
      console.error(`count_tokens: HTTP ${response.status}, estimating instead`)
      return null
    }
    const { input_tokens } = (await response.json()) as {
      input_tokens?: number
    }
    return typeof input_tokens === 'number' ? input_tokens : null
  } catch {
    console.error('count_tokens: unreachable, estimating instead')
    return null
  }
}
