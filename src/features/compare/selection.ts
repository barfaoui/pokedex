// Compare takes exactly two: a third tick replaces the oldest.
const MAX_SELECTED = 2

export function toggleSelection(selected: string[], name: string): string[] {
  if (selected.includes(name)) {
    return selected.filter((selectedName) => selectedName !== name)
  }
  return [...selected, name].slice(-MAX_SELECTED)
}
