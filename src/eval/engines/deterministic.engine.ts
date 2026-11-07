import { search } from '@/search/search'
import type { EngineDefinition } from './engine'

// Rules and scoring, no learned model: the app's search without its embeddings.
const deterministic: EngineDefinition = {
  id: 'deterministic',
  order: 1,
  create: () => ({
    name: 'Deterministic (D)',
    search: async (query) => search(query),
  }),
}

export default deterministic
