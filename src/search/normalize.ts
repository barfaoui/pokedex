export function normalize(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/♀/g, ' f')
      .replace(/♂/g, ' m')
      .replace(/-/g, ' ')
      // Keeps a dot between two digits
      .replace(/[^a-z0-9 .]|\.(?!\d)|(?<!\d)\./g, '')
      .replace(/ +/g, ' ')
      .trim()
  )
}
