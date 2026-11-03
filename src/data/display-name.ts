const OFFICIAL_NAMES = new Map([
  ['nidoran-f', 'Nidoran♀'],
  ['nidoran-m', 'Nidoran♂'],
  ['mr-mime', 'Mr. Mime'],
  ['farfetchd', "Farfetch'd"],
  ['double-edge', 'Double-Edge'],
  ['self-destruct', 'Self-Destruct'],
  ['soft-boiled', 'Soft-Boiled'],
])

export function displayName(name: string): string {
  return (
    OFFICIAL_NAMES.get(name) ??
    name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  )
}
