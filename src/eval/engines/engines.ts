import type { Engine, EngineContext, EngineDefinition } from './engine'

const modules = import.meta.glob<EngineDefinition>('./*.engine.ts', {
  eager: true,
  import: 'default',
})

export const ENGINE_DEFINITIONS: EngineDefinition[] = Object.values(
  modules,
).sort((a, b) => a.order - b.order)

export interface AvailableEngine extends Engine {
  id: string
}

/** An engine without its key is left out, so it is never billed. */
export function availableEngines(context: EngineContext): AvailableEngine[] {
  return ENGINE_DEFINITIONS.flatMap((definition) => {
    const engine = definition.create(context)
    return engine ? [{ ...engine, id: definition.id }] : []
  })
}
