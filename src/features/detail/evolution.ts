import type { Evolution } from '@/data/types/model'

export interface EvolutionAround {
  previous: string[]
  next: string[]
}

export function evolutionAround(
  evolution: Evolution,
  name: string,
): EvolutionAround {
  const stage = evolution.stages.findIndex((members) => members.includes(name))
  return {
    previous: evolution.stages[stage - 1] ?? [],
    next: evolution.stages[stage + 1] ?? [],
  }
}
