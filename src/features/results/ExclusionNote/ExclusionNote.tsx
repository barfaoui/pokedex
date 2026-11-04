import { exclusionNote } from '@/features/results/exclusion-note'
import type { Exclusions } from '@/search/exclusion'
import './ExclusionNote.scss'

interface ExclusionNoteProps {
  exclusions: Exclusions
}

export function ExclusionNote({ exclusions }: ExclusionNoteProps) {
  const lines = exclusionNote(exclusions)
  if (!lines.length) {
    return null
  }

  return (
    <div className="exclusion-note" role="note">
      {lines.map((line) => (
        <p className="exclusion-note__line" key={line}>
          {line}
        </p>
      ))}
    </div>
  )
}
