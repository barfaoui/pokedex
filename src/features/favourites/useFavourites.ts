import { useCallback } from 'react'
import {
  parseFavourites,
  toggleFavourite,
} from '@/features/favourites/favourites'
import { useSavedList } from '@/shared/useSavedList'

export function useFavourites() {
  const [favourites, update] = useSavedList(
    'pokedex.favourites',
    parseFavourites,
  )
  const toggle = useCallback(
    (name: string) => update((current) => toggleFavourite(current, name)),
    [update],
  )
  return { favourites, toggle }
}
