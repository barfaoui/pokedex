interface PixelArtProps {
  className: string
  /** One string per row, one character per pixel; characters missing from `pixelClasses` stay transparent. */
  rows: readonly string[]
  pixelClasses: Readonly<Record<string, string>>
}

interface PixelRun {
  x: number
  y: number
  width: number
  className: string
}

// Decorative: always hidden from screen readers.
export function PixelArt({ className, rows, pixelClasses }: PixelArtProps) {
  const width = Math.max(...rows.map((row) => row.length))

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${rows.length}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {pixelRuns(rows, pixelClasses).map((run) => (
        <rect
          key={`${run.x},${run.y}`}
          className={run.className}
          x={run.x}
          y={run.y}
          width={run.width}
          height={1}
        />
      ))}
    </svg>
  )
}

/** Merges neighbouring pixels of the same colour on a row into one rectangle. */
function pixelRuns(
  rows: readonly string[],
  pixelClasses: Readonly<Record<string, string>>,
): PixelRun[] {
  const runs: PixelRun[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const pixel = row[x]
      let end = x + 1
      while (end < row.length && row[end] === pixel) {
        end++
      }
      const className = pixelClasses[pixel]
      if (className) {
        runs.push({ x, y, width: end - x, className })
      }
      x = end
    }
  })
  return runs
}
