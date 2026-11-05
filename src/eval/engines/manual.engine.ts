import { search } from '@/search/search'
import type { EngineDefinition } from './engine'

const manual: EngineDefinition = {
  id: 'manual',
  order: 1,
  create: () => ({
    name: 'Manual',
    search: async (query) => search(query),
  }),
}

export default manual
