export function euros(value: number): string {
  return `${value.toFixed(2)} €`
}

export function percent(ratio: number | null): string {
  return ratio === null ? '—' : `${Math.round(ratio * 100)} %`
}

export function decimal(value: number | null): string {
  return value === null ? '—' : value.toFixed(2)
}

export function ms(value: number): string {
  return value >= 1000
    ? `${(value / 1000).toFixed(2)} s`
    : value >= 10
      ? `${value.toFixed(0)} ms`
      : `${value.toFixed(2)} ms`
}

/** `pikachu`, `sing (move)`: the kind only where a name alone is ambiguous. */
export function itemLabel(item: string): string {
  if (!item.includes(':')) {
    return item
  }
  const [kind, name] = item.split(':')
  return kind === 'pokemon' ? name : `${name} (${kind})`
}
