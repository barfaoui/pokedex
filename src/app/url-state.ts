import { isResultTab, type ResultTab } from '@/features/results/result-tabs'

export interface UrlState {
  query: string
  tab: ResultTab
}

/** A missing or unknown tab is All. */
export function readUrlState(search: string): UrlState {
  const params = new URLSearchParams(search)
  const tab = params.get('tab') ?? ''
  return {
    query: params.get('q') ?? '',
    tab: isResultTab(tab) ? tab : 'all',
  }
}

/** All, the default tab, is left out of the URL. */
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
