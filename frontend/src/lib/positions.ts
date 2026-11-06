export function codePointColumnToMonaco(
  lineText: string,
  col1Based: number,
): number {
  let monacoColumn = 1
  let codePoints = 0

  for (const character of lineText) {
    if (codePoints >= col1Based - 1) {
      break
    }

    monacoColumn += character.length
    codePoints += 1
  }

  return monacoColumn
}
