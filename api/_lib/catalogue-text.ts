// No imports: scripts/build-catalogue.ts must measure exactly the text the server sends.
export function catalogueBlock(
  header: readonly string[],
  lines: readonly string[],
): string {
  return `<catalogue>\n${[...header, ...lines].join('\n')}\n</catalogue>`
}
