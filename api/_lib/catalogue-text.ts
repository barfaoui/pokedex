// No imports: scripts/build-catalogue.ts measures the exact text the server sends, so both build it
// here.
export function catalogueBlock(
  header: readonly string[],
  lines: readonly string[],
): string {
  return `<catalogue>\n${[...header, ...lines].join('\n')}\n</catalogue>`
}
