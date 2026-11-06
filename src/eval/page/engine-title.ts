import type { AvailableEngine } from '@/eval/engines/engines'

/** A column header's tooltip: the full name when the header shows a short one, and which run it is. */
export function engineTitle(engine: AvailableEngine): string | undefined {
  const parts = [
    ...(engine.shortName ? [engine.name] : []),
    ...(engine.about ? [engine.about] : []),
  ]
  return parts.length ? parts.join(', ') : undefined
}
