/** "claude-haiku-5-5" → "Claude Haiku 5.5": words capitalised, consecutive numbers as a version. */
export function modelLabel(model: string): string {
  return model
    .split('-')
    .reduce<string[]>((words, part) => {
      const previous = words.at(-1)
      if (/^\d+$/.test(part) && previous && /\d$/.test(previous)) {
        words[words.length - 1] = `${previous}.${part}`
      } else {
        words.push(
          /^\d/.test(part) ? part : part[0].toUpperCase() + part.slice(1),
        )
      }
      return words
    }, [])
    .join(' ')
}

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

export function itemLabel(item: string): string {
  if (!item.includes(':')) {
    return item
  }
  const [kind, name] = item.split(':')
  return kind === 'pokemon' ? name : `${name} (${kind})`
}
