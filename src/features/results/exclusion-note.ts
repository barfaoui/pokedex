import { displayName } from '@/data/display-name'
import { DESCRIPTOR_LABELS } from '@/features/results/describe-match'
import type { Exclusion, Exclusions } from '@/search/exclusion'

/** The note's lines: what is excluded, and what couldn't be. Empty when nothing was negated. */
export function exclusionNote({ rules, unknown }: Exclusions): string[] {
  const excluding = [...new Set(rules.map(label))]
  return [
    ...(excluding.length ? [`Excluding: ${excluding.join(', ')}`] : []),
    ...unknown.map((word) => `Can't exclude “${word}”`),
  ]
}

function label(rule: Exclusion): string {
  switch (rule.kind) {
    case 'type':
      return displayName(rule.value)
    case 'descriptor':
      return `${DESCRIPTOR_LABELS[rule.descriptor.field]} ${rule.descriptor.value.replaceAll('-', ' ')}`
    case 'concept':
      return rule.word
    case 'name':
      return displayName(rule.name)
  }
}
