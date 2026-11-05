import type { EngineDefinition } from './engine'

// The raw query, even "not"-only or sort-word queries that the app would never send to the model.
const embeddings: EngineDefinition = {
  id: 'embeddings',
  order: 2,
  create: ({ semantic }) => ({
    name: 'Embeddings',
    search: (query) => semantic().search(query),
  }),
}

export default embeddings
