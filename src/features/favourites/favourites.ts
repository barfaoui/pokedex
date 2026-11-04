import { parseSavedNames } from '@/shared/useSavedList'

export const parseFavourites = parseSavedNames

export function toggleFavourite(favourites: string[], name: string): string[] {
  return favourites.includes(name)
    ? favourites.filter((favourite) => favourite !== name)
    : [...favourites, name]
}
