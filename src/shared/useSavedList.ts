import { useCallback, useSyncExternalStore } from 'react'

/** Anything unreadable is an empty list. */
export function parseSavedNames(stored: string | null): string[] {
  if (!stored) {
    return []
  }
  try {
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed)
      ? parsed.filter((name): name is string => typeof name === 'string')
      : []
  } catch {
    return []
  }
}

interface SavedList {
  listeners: Set<() => void>
  // Used when the browser blocks storage (private mode, blocked site data), so the list still works for the visit
  memoryValue: string | null
  cachedValue: string | null | undefined
  cachedList: string[]
}

const savedLists = new Map<string, SavedList>()

function savedList(key: string): SavedList {
  let list = savedLists.get(key)
  if (!list) {
    list = {
      listeners: new Set(),
      memoryValue: null,
      cachedValue: undefined,
      cachedList: [],
    }
    savedLists.set(key, list)
  }
  return list
}

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return savedList(key).memoryValue
  }
}

function writeStored(key: string, value: string) {
  savedList(key).memoryValue = value
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Kept in memory only
  }
}

// Same array while the stored value is unchanged, as useSyncExternalStore requires.
function getList(key: string, parse: (stored: string | null) => string[]) {
  const list = savedList(key)
  const value = readStored(key)
  if (value !== list.cachedValue) {
    list.cachedValue = value
    list.cachedList = parse(value)
  }
  return list.cachedList
}

/** Shared by every component that uses the same key. */
export function useSavedList(
  key: string,
  parse: (stored: string | null) => string[],
): [string[], (update: (current: string[]) => string[]) => void] {
  const subscribe = useCallback(
    (listener: () => void) => {
      const { listeners } = savedList(key)
      listeners.add(listener)
      // Another tab changed the list
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) {
          listener()
        }
      }
      window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(listener)
        window.removeEventListener('storage', onStorage)
      }
    },
    [key],
  )
  const list = useSyncExternalStore(subscribe, () => getList(key, parse))

  const update = useCallback(
    (change: (current: string[]) => string[]) => {
      writeStored(key, JSON.stringify(change(getList(key, parse))))
      savedList(key).listeners.forEach((listener) => listener())
    },
    [key, parse],
  )

  return [list, update]
}
