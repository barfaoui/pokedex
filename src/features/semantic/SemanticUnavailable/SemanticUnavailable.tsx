import './SemanticUnavailable.scss'

export function SemanticUnavailable() {
  return (
    <p className="semantic-unavailable" role="note">
      Prof. Chen's lab files couldn't be opened: search by meaning is off, the
      results below match your words only.
    </p>
  )
}
