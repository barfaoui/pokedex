import { isResultTab, type ResultTab } from './result-tabs'

export interface UrlState {
  query: string
  tab: ResultTab
}

/** Reads `?q=…&tab=…`; a missing or unknown tab is All. */
export function readUrlState(search: string): UrlState {
  const params = new URLSearchParams(search)
  const tab = params.get('tab') ?? ''
  return {
    query: params.get('q') ?? '',
    tab: isResultTab(tab) ? tab : 'all',
  }
}

/** The URL's search part for a state, '' for the home page. All, the default tab, is left out. */
export function writeUrlState({ query, tab }: UrlState): string {
  const params = new URLSearchParams()
  if (query) {
    params.set('q', query)
  }
  if (tab !== 'all') {
    params.set('tab', tab)
  }
  const search = params.toString()
  return search ? `?${search}` : ''
}
