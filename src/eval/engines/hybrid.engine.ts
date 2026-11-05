import { withoutExcluded } from '@/search/exclusion'
import {
  needsSemantic,
  queryExclusions,
  search,
  semanticQueryOf,
} from '@/search/search'
import { withSemanticResults } from '@/search/semantic/semantic'
import type { EngineDefinition } from './engine'

// The same calls in the same order as SearchPage, minus the debounce: keep the two in step.
const hybrid: EngineDefinition = {
  id: 'hybrid',
  order: 3,
  create: ({ semantic }) => ({
    name: 'Hybrid (the app)',
    search: async (query) => {
      if (query.trim() === '') {
        return []
      }
      const manual = search(query)
      const semanticQuery = semanticQueryOf(query)
      const semanticResults =
        semanticQuery !== '' && needsSemantic(manual)
          ? await semantic().search(semanticQuery)
          : []
      return withoutExcluded(
        withSemanticResults(manual, semanticResults),
        queryExclusions(query).rules,
      )
    },
  }),
}

export default hybrid
