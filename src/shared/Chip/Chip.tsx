import './Chip.scss'

interface ChipProps {
  label: string
  onClick: () => void
}

export function Chip({ label, onClick }: ChipProps) {
  return (
    <button className="chip" type="button" onClick={onClick}>
      {label}
    </button>
  )
}
