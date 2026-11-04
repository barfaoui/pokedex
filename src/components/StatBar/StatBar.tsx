import './StatBar.scss'

interface StatBarProps {
  value: number
  max: number
}

export function StatBar({ value, max }: StatBarProps) {
  return (
    <svg
      className="stat-bar"
      viewBox={`0 0 ${max} 1`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="stat-bar__track" width={max} height={1} />
      <rect
        className="stat-bar__fill"
        width={Math.min(value, max)}
        height={1}
      />
    </svg>
  )
}
