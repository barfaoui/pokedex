export function parseFavourites(stored: string | null): string[] {
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

export function toggleFavourite(favourites: string[], name: string): string[] {
  return favourites.includes(name)
    ? favourites.filter((favourite) => favourite !== name)
    : [...favourites, name]
}
