// Optimal string alignment: insertions, deletions, substitutions and swaps of two adjacent letters each count as one change.
export function editDistance(a: string, b: string): number {
  const distances = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const substitution = a[i - 1] === b[j - 1] ? 0 : 1
      distances[i][j] = Math.min(
        distances[i - 1][j] + 1,
        distances[i][j - 1] + 1,
        distances[i - 1][j - 1] + substitution,
      )
      const isSwap =
        i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]
      if (isSwap) {
        distances[i][j] = Math.min(distances[i][j], distances[i - 2][j - 2] + 1)
      }
    }
  }
  return distances[a.length][b.length]
}

export function typoLimit(length: number): number {
  return Math.floor((length * 3) / 10)
}
