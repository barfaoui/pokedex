import './FilterSelect.scss'

interface FilterSelectProps {
  label: string
  /** '' for All. */
  value: string
  options: string[]
  onChange: (value: string) => void
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <label className="filter-select">
      {label}
      <select
        className="filter-select__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
