import { useCallback, useSyncExternalStore } from 'react'
import { parseFavourites, toggleFavourite } from './favourites'

const STORAGE_KEY = 'pokedex.favourites'

const listeners = new Set<() => void>()

// Used when the browser blocks storage (private mode, blocked site data), so hearts still work for the visit.
let memoryValue: string | null = null
let cachedValue: string | null | undefined
let cachedFavourites: string[] = []

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return memoryValue
  }
}

function writeStored(value: string) {
  memoryValue = value
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Kept in memory only
  }
}

// Same array while the stored value is unchanged, as useSyncExternalStore requires.
function getFavourites(): string[] {
  const value = readStored()
  if (value !== cachedValue) {
    cachedValue = value
    cachedFavourites = parseFavourites(value)
  }
  return cachedFavourites
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab changed the favourites
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** The favourite Pokémon names, saved in the browser, and a toggle to add or remove one. */
export function useFavourites() {
  const favourites = useSyncExternalStore(subscribe, getFavourites)

  const toggle = useCallback((name: string) => {
    writeStored(JSON.stringify(toggleFavourite(getFavourites(), name)))
    listeners.forEach((listener) => listener())
  }, [])

  return { favourites, toggle }
}
